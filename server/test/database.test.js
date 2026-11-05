import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { setup } from './helpers.js';
import { transaction } from '../src/db.js';
import { createApp } from '../src/app.js';
import { migrate } from '../src/migrate.js';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { restrictedRoles } from './database-roles.js';
let ctx, admin, customer, other, room, tray, plan, rental, item, harvest;
before(async()=>{
  ctx=await setup();
  [admin,customer,other]=await Promise.all(['admin','customer','customer'].map(ctx.user));
  const post=async(path,body,token=admin.token)=>{
    const r=await ctx.request('/api'+path,{token,method:'POST',body});assert.equal(r.status,201);return r.body.data;
  };
  room=await post('/rooms',{name:'HQTCSDL '+randomUUID()});
  tray=await post('/trays',{room_id:room.id,code:'HQ-'+randomUUID().slice(0,8).toUpperCase(),label:'SQL integrity tray'});
  plan=await post('/plans',{name:'HQ SQL '+randomUUID(),duration_days:30,price_vnd:123000});
  rental=await post('/rentals',{plan_id:plan.id,tray_ids:[tray.id]},customer.token);item=rental.items[0];
  await post(`/rental-items/${item.id}/progress`,{stage:'fruiting'});
  await post(`/rental-items/${item.id}/progress`,{stage:'ready'});
  harvest=await post(`/rental-items/${item.id}/harvests`,{weight_grams:1250});
});
after(async()=>{await ctx?.close();});
test('direct SQL fulfillment rejects customer different from harvest owner',async()=>{
  await assert.rejects(ctx.pool.query("INSERT INTO fulfillment_requests(harvest_id,customer_id,method) VALUES ($1,$2,'pickup')",[harvest.id,other.id]),{code:'23514'});
  assert.equal((await ctx.pool.query('SELECT 1 FROM fulfillment_requests WHERE harvest_id=$1',[harvest.id])).rowCount,0);
});
test('historical ownership links cannot be rewired, but idempotent updates remain valid',async()=>{
  for(const [table,column,id,value] of [
    ['rentals','customer_id',rental.id,other.id],
    ['rental_items','rental_id',item.id,randomUUID()],
    ['rental_items','tray_id',item.id,randomUUID()],
    ['harvests','rental_item_id',harvest.id,randomUUID()],
  ])await assert.rejects(ctx.pool.query(`UPDATE ${table} SET ${column}=$1 WHERE id=$2`,[value,id]),{code:'23514'});
  assert.equal((await ctx.pool.query('UPDATE rentals SET customer_id=customer_id WHERE id=$1 RETURNING id',[rental.id])).rowCount,1);
});
test('database PK/FK/UNIQUE/NOT NULL/CHECK reject invalid direct writes',async()=>{
  await assert.rejects(ctx.pool.query('INSERT INTO users SELECT * FROM users WHERE id=$1',[customer.id]),{code:'23505'});
  await assert.rejects(ctx.pool.query('UPDATE users SET name=NULL WHERE id=$1',[customer.id]),{code:'23502'});
  await assert.rejects(ctx.pool.query("INSERT INTO trays(room_id,code,label) VALUES ($1,$2,'Invalid FK')",[randomUUID(),'FK-'+randomUUID()]),{code:'23503'});
  await assert.rejects(ctx.pool.query('INSERT INTO harvests(rental_item_id,weight_grams,created_by) VALUES ($1,0,$2)',[item.id,admin.id]),{code:'23514'});
  await assert.rejects(ctx.pool.query('INSERT INTO rental_items(rental_id,tray_id) VALUES ($1,$2)',[rental.id,tray.id]),{code:'23505'});
});
test('snapshot function and reporting views agree with real rental and telemetry data',async()=>{
  assert.equal((await ctx.pool.query('SELECT public.fn_rental_total_vnd($1) AS amount',[rental.id])).rows[0].amount,'123000');
  await ctx.pool.query('UPDATE rental_plans SET price_vnd=999999 WHERE id=$1',[plan.id]);
  assert.equal((await ctx.pool.query('SELECT public.fn_rental_total_vnd($1) AS amount',[rental.id])).rows[0].amount,'123000');
  assert.equal((await ctx.pool.query('SELECT public.fn_rental_total_vnd($1) AS amount',[randomUUID()])).rows[0].amount,null);
  const device=(await ctx.request('/api/devices',{token:admin.token,method:'POST',body:{room_id:room.id,name:'HQ simulator',mode:'simulator'}})).body.data;
  await ctx.request('/api/iot/readings',{token:device.token,method:'POST',body:{temperature:24,humidity:85,co2:800}});
  const reports=(await ctx.request('/api/reports',{token:admin.token})).body.data;
  assert.equal(reports.rooms[0].harvested_grams,'1250');assert.equal(reports.rooms[0].rented_trays,1);
  assert.equal(reports.environment_last_24h[0].sample_count,1);
  assert.equal(reports.environment_last_24h[0].simulated_sample_count,1);
  assert.equal(reports.environment_last_24h[0].hardware_sample_count,0);
});
test('payment procedure rejects customer actor, rolls back with caller and serializes confirmations',async()=>{
  const ledger=(await ctx.pool.query('SELECT * FROM transactions WHERE rental_id=$1',[rental.id])).rows[0];
  await assert.rejects(ctx.pool.query('CALL public.sp_confirm_rental_payment($1,$2)',[ledger.id,customer.id]),{code:'23514'});
  await assert.rejects(transaction(ctx.pool,async db=>{
    await db.query('CALL public.sp_confirm_rental_payment($1,$2)',[ledger.id,admin.id]);
    await db.query('INSERT INTO harvests(rental_item_id,weight_grams,created_by) VALUES ($1,0,$2)',[item.id,admin.id]);
  }),{code:'23514'});
  assert.equal((await ctx.pool.query('SELECT status FROM transactions WHERE id=$1',[ledger.id])).rows[0].status,'pending');
  const responses=await Promise.all([1,2].map(()=>ctx.request(`/api/transactions/${ledger.id}/confirm`,{token:admin.token,method:'POST'})));
  assert.deepEqual(responses.map(r=>r.status).sort(),[200,409]);
  assert.equal((await ctx.pool.query('SELECT confirmed_by FROM transactions WHERE id=$1',[ledger.id])).rows[0].confirmed_by,admin.id);
});
test('real limited database login supports API and denies DDL, migration table and private reporting access',async()=>{
  const roles=await restrictedRoles(ctx.pool);let server;
  try{
    assert.equal((await roles.runtime.query('SELECT current_user')).rows[0].current_user,roles.names.runtime_role);
    for(const sql of ['CREATE TABLE public.forbidden(id int)','SELECT * FROM schema_migrations','DELETE FROM users','TRUNCATE sensor_readings'])await assert.rejects(roles.runtime.query(sql),{code:'42501'});
    await assert.rejects(roles.runtime.query('UPDATE rentals SET price_per_tray_vnd=1 WHERE id=$1',[rental.id]),{code:'42501'});
    assert.equal((await roles.report.query('SELECT * FROM public.v_room_cultivation_summary')).rowCount,1);
    await assert.rejects(roles.report.query('SELECT password_hash FROM users'),{code:'42501'});
    await assert.rejects(roles.report.query('SELECT public.fn_rental_total_vnd($1)',[rental.id]),{code:'42501'});
    server=createApp({pool:roles.runtime,config:{WEB_ORIGIN:'http://localhost:5173'}}).listen(0,'127.0.0.1');
    await new Promise(resolve=>server.once('listening',resolve));const base=`http://127.0.0.1:${server.address().port}/api`;
    const request=async(path,body,token=admin.token)=>{
      const res=await fetch(base+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+token,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
      return {status:res.status,body:res.status===204?null:await res.json()};
    };
    const login=await request('/auth/login',{email:customer.email,password:customer.password});assert.equal(login.status,200);
    const token=login.body.data.token;
    const newTray=(await ctx.request('/api/trays',{token:admin.token,method:'POST',body:{room_id:room.id,code:'LIMITED-'+randomUUID().slice(0,8).toUpperCase(),label:'Limited role tray'}})).body.data;
    const booked=await request('/rentals',{plan_id:plan.id,tray_ids:[newTray.id]},token);assert.equal(booked.status,201);
    const ledger=(await roles.runtime.query('SELECT id FROM transactions WHERE rental_id=$1',[booked.body.data.id])).rows[0];
    assert.equal((await request(`/transactions/${ledger.id}/confirm`,{})).status,200);
    assert.equal((await request('/fulfillment-requests',{harvest_id:harvest.id,method:'pickup'},token)).status,201);
    assert.equal((await request('/reports')).status,200);
    assert.equal((await request('/auth/logout',{},token)).status,204);
  }finally{if(server)await new Promise(resolve=>server.close(resolve));await roles.close();}
});
test('migration preflight fails atomically on legacy mismatch, then preserves data on valid upgrade',async()=>{
  const legacy=await setup({},async pool=>{
    await pool.query('CREATE TABLE schema_migrations(filename text PRIMARY KEY,checksum text NOT NULL,applied_at timestamptz NOT NULL DEFAULT now())');
    for(const file of ['001_foundation.sql','002_iot_automation.sql','003_rental_pagination.sql']){
      const sql=await readFile(new URL('../migrations/'+file,import.meta.url),'utf8');await pool.query(sql);
      await pool.query('INSERT INTO schema_migrations(filename,checksum) VALUES ($1,$2)',[file,createHash('sha256').update(sql).digest('hex')]);
    }
  });
  try{
    // Copy only this test's minimal graph; no environment database is touched.
    for(const table of ['users','rooms','trays','rental_plans','rentals','rental_items','harvests']){
      const data=(await ctx.pool.query('SELECT * FROM '+table)).rows;
      for(const row of data){const keys=Object.keys(row);await legacy.pool.query(`INSERT INTO ${table}(${keys.join(',')}) VALUES (${keys.map((_,i)=>'$'+(i+1)).join(',')})`,Object.values(row));}
    }
    await legacy.pool.query("INSERT INTO fulfillment_requests(harvest_id,customer_id,method) VALUES ($1,$2,'pickup')",[harvest.id,other.id]);
    await assert.rejects(migrate(legacy.pool),{code:'23514'});
    assert.equal((await legacy.pool.query('SELECT count(*)::int AS n FROM schema_migrations')).rows[0].n,3);
    assert.equal((await legacy.pool.query("SELECT to_regprocedure('public.fn_rental_total_vnd(uuid)') AS f")).rows[0].f,null);
    await legacy.pool.query('UPDATE fulfillment_requests SET customer_id=$1',[customer.id]); // Only deliberate invalid test fixture.
    assert.equal(await migrate(legacy.pool),4);assert.equal(await migrate(legacy.pool),4);
    assert.equal((await legacy.pool.query('SELECT customer_id FROM fulfillment_requests')).rows[0].customer_id,customer.id);
    assert.equal((await legacy.pool.query('SELECT public.fn_rental_total_vnd($1) AS amount',[rental.id])).rows[0].amount,'123000');
  }finally{await legacy.close();}
});
