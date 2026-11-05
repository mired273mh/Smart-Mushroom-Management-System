import { readFile,writeFile,mkdir } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { setup } from '../server/test/helpers.js';
import { restrictedRoles } from '../server/test/database-roles.js';

// One fresh sm_test_* DB per run; never reset/drop an existing database.
if(!process.env.TEST_DATABASE_URL){
  const line=(await readFile(new URL('../.local/database.env',import.meta.url),'utf8')).trim();
  if(!line.startsWith('DATABASE_URL='))throw Error('Need TEST_DATABASE_URL or .local/database.env');
  const url=new URL(line.slice(13));
  if(!['127.0.0.1','localhost'].includes(url.hostname))throw Error('Default lab template must be local');
  url.pathname='/sm_test_hq_'+Date.now();process.env.TEST_DATABASE_URL=url.href;
}
const root=fileURLToPath(new URL('../',import.meta.url));
const directory=join(root,'.local','hq-demo','run-'+Date.now()+'-'+randomBytes(3).toString('hex'));
await mkdir(directory,{recursive:true});
const report={createdAt:new Date().toISOString(),demos:Object.fromEntries(Array.from({length:9},(_,i)=>[i+1,{status:'NOT TESTED'}]))};
const ctx=await setup();const db=await ctx.pool.connect();let current=0;
const sql=name=>readFile(new URL('../docs/demo-hqtcsdl/'+name,import.meta.url),'utf8');
const record=async(id,run)=>{
  current=id;const started=performance.now();
  const evidence=await run();report.demos[id]={status:'PASS',elapsedMs:+(performance.now()-started).toFixed(2),evidence};
  await writeFile(join(directory,'results.json'),JSON.stringify(report,null,2));
  console.log(`PASS demo${id}: ${JSON.stringify(evidence)}`);
};
const child=async(file,env={},name='child')=>{
  const result=spawn(process.execPath,[file],{cwd:root,env:{...process.env,...env},windowsHide:true,stdio:['ignore','pipe','pipe']});
  let output='';result.stdout.on('data',b=>{output+=b;});result.stderr.on('data',b=>{output+=b;});
  const code=await new Promise((resolve,reject)=>{result.once('error',reject);result.once('exit',resolve);});
  await writeFile(join(directory,name+'.log'),output);assert.equal(code,0,`${name}: inspect its private log`);return output;
};
try{
  await db.query(await sql('00_guard.sql'));
  const [admin,operator,customer,other]=await Promise.all(['admin','operator','customer','customer'].map(ctx.user));
  const post=async(path,body,token=admin.token)=>{
    const r=await ctx.request('/api'+path,{token,method:'POST',body});assert.equal(r.status,201,`fixture ${path}`);return r.body.data;
  };
  const room=await post('/rooms',{name:'HQ lab room',description:'Isolated synthetic HQTCSDL demo'});
  const plan=await post('/plans',{name:'HQ lab snapshot plan',duration_days:30,price_vnd:123000});
  const trays=[];
  for(let n=1;n<=3;n++)trays.push(await post('/trays',{room_id:room.id,code:'HQ-LAB-'+n,label:'HQ lab tray '+n}));
  const rental=await post('/rentals',{plan_id:plan.id,tray_ids:trays.slice(0,2).map(t=>t.id)},customer.token);
  const item=rental.items[0];
  await post(`/rental-items/${item.id}/progress`,{stage:'fruiting'});
  await post(`/rental-items/${item.id}/progress`,{stage:'ready'});
  const harvest=await post(`/rental-items/${item.id}/harvests`,{weight_grams:1250});
  const ledger=(await db.query('SELECT id FROM transactions WHERE rental_id=$1',[rental.id])).rows[0];
  const device=await post('/devices',{room_id:room.id,name:'HQ lab SIMULATOR',mode:'simulator'});
  const vars={
    'sm.demo_rental_id':rental.id,'sm.demo_transaction_id':ledger.id,'sm.demo_staff_id':admin.id,
    'sm.demo_room_id':room.id,'sm.demo_harvest_id':harvest.id,'sm.demo_other_id':other.id,
    'sm.demo_race_tray_id':trays[2].id,'sm.demo_device_id':device.id,'sm.demo_lock_seconds':'8',
  };
  const perfDevices=(await db.query(`INSERT INTO devices(room_id,name,token_hash,mode)
    SELECT $1,'HQ-PERF-'||g,md5(random()::text)||md5(random()::text),'simulator'
    FROM generate_series(1,50) g RETURNING id`,[room.id])).rows;
  const perfInserted=await db.query(`INSERT INTO sensor_readings(device_id,temperature,humidity,co2,recorded_at,simulated)
    SELECT d.id,22+(g%4),80+(g%10),800+(g%500),now()-g*interval '1 second',true
    FROM devices d CROSS JOIN generate_series(1,1000) g WHERE d.id=ANY($1::uuid[])`,[perfDevices.map(d=>d.id)]);
  assert.equal(perfInserted.rowCount,50000);vars['sm.demo_perf_device_id']=perfDevices[0].id;
  const configure=async(client,extra={})=>{for(const [key,value] of Object.entries({...vars,...extra}))await client.query('SELECT set_config($1,$2,false)',[key,value]);};
  await configure(db);
  await writeFile(join(directory,'private.json'),JSON.stringify({databaseUrl:ctx.pool.options.connectionString,accounts:[admin,operator,customer,other],vars},null,2),{mode:0o600});
  await writeFile(join(directory,'demo-vars.sql'),Object.entries(vars).map(([k,v])=>`SELECT set_config('${k}','${v}',false);`).join('\n'));
  await writeFile(join(root,'.local','hq-demo','latest.json'),JSON.stringify({directory}));
  if(process.argv.includes('--prepare')){
    report.mode='PREPARED';console.log('Prepared NEW isolated lab. Credentials/SQL vars kept private in '+directory);
  }else{
  await record(1,async()=>{
    const result=await db.query(await sql('01_schema.sql'));
    const tables=(await db.query("SELECT count(*)::int AS n FROM pg_tables WHERE schemaname='public'")).rows[0].n;
    assert.equal(tables,17);await writeFile(join(directory,'schema.json'),JSON.stringify(result.map(r=>r.rows),null,2));
    return {tables,constraints:result[1].rowCount,indexes:result[2].rowCount};
  });
  await record(2,async()=>{
    await db.query(await sql('02_sql_objects.sql'));
    assert.equal((await db.query('SELECT status FROM transactions WHERE id=$1',[ledger.id])).rows[0].status,'pending');
    assert.equal((await db.query('SELECT public.fn_rental_total_vnd($1) AS amount',[rental.id])).rows[0].amount,'246000');
    assert.equal((await db.query('SELECT 1 FROM fulfillment_requests WHERE harvest_id=$1',[harvest.id])).rowCount,0);
    return {views:2,snapshotVnd:'246000',procedureRolledBack:true,triggerRejectedOtherCustomer:true};
  });
  await record(3,async()=>{
    const before=(await db.query('SELECT count(*)::int AS n FROM rentals')).rows[0].n;
    await db.query(await sql('03_transactions.sql'));
    assert.equal((await db.query('SELECT description FROM rooms WHERE id=$1',[room.id])).rows[0].description,'HQ demo committed');
    assert.equal((await db.query('SELECT count(*)::int AS n FROM rentals')).rows[0].n,before);
    return {commitVisible:true,rollbackPreservedCommit:true,failedBookingLeftNoOrphan:true};
  });
  await record(4,async()=>{
    const a=await ctx.pool.connect(),b=await ctx.pool.connect();let pending;
    try{
      await configure(a,{'sm.demo_lock_seconds':'2'});await configure(b);
      const pid=(await a.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;
      pending=a.query(await sql('04_concurrency_a.sql')).then(value=>({value}),error=>({error}));
      let holding=false;
      for(let i=0;i<100;i++){
        holding=(await db.query("SELECT 1 FROM pg_stat_activity WHERE pid=$1 AND wait_event='PgSleep'",[pid])).rowCount>0;
        if(holding)break;await new Promise(resolve=>setTimeout(resolve,20));
      }
      assert.equal(holding,true,'A must hold its lock before B starts');
      await assert.rejects(b.query(await sql('04_concurrency_b.sql')),{code:'23505'});
      const result=await pending;if(result.error)throw result.error;
      await b.query('ROLLBACK');
      assert.equal((await db.query('SELECT 1 FROM rental_items WHERE tray_id=$1 AND ended_at IS NULL',[trays[2].id])).rowCount,1);
      assert.equal((await db.query('SELECT count(*)::int AS n FROM rentals')).rows[0].n,2);
      return {sessionA:'COMMIT',sessionB:'23505 then ROLLBACK',activeOwners:1,noOrphanRental:true};
    }finally{if(pending)await pending;await a.query('ROLLBACK');await b.query('ROLLBACK');a.release();b.release();}
  });
  await record(5,async()=>{
    const roles=await restrictedRoles(ctx.pool);
    try{
      const rows={};for(const name of ['runtime','report']){
        const result=await roles[name].query(await sql('05_privileges.sql'));rows[name]=result[0].rows[0];
        assert.equal(rows[name].can_create_persistent_objects,false);assert.equal(rows[name].can_read_migrations,false);assert.equal(rows[name].can_truncate,false);
      }
      assert.equal(rows.runtime.can_read_users,true);assert.equal(rows.report.can_read_users,false);
      await assert.rejects(roles.report.query('SELECT password_hash FROM users'),{code:'42501'});
      await assert.rejects(roles.runtime.query('UPDATE rentals SET price_per_tray_vnd=1'),{code:'42501'});
      return {actualLogins:rows,forbiddenAccess:'42501',businessRbac:'also enforced separately by HTTP'};
    }finally{await roles.close();}
  });
  await record(6,async()=>{
    const result=await db.query(await sql('06_explain.sql'));
    const plans=result.filter(r=>r.command==='EXPLAIN').map(r=>r.rows[0]['QUERY PLAN'][0]);
    assert.equal(plans.length,2);assert.match(JSON.stringify(plans[0]),/Seq Scan/);assert.match(JSON.stringify(plans[1]),/sensor_readings_device_time_idx/);
    await writeFile(join(directory,'explain.json'),JSON.stringify(plans,null,2));
    return {simulatedRows:perfInserted.rowCount,sequentialMs:plans[0]['Execution Time'],indexedMs:plans[1]['Execution Time'],comparison:'forced sequential vs normal planner; single local run, not production capacity'};
  });
  await record(7,async()=>{
    const output=await child('scripts/verify-backup.mjs',{},'backup-restore');assert.match(output,/PASS:/);
    return {scope:'independent new backup/restore fixture',tables:17,routinesTriggersDataAndAcl:true,sourceAndRestoreRetained:true};
  });
  await record(8,async()=>{
    assert.equal((await ctx.request('/api/reports',{token:customer.token})).status,403);
    assert.equal((await ctx.request(`/api/rentals/${rental.id}`,{token:other.token})).status,404);
    assert.equal((await ctx.request(`/api/rentals/${rental.id}`,{token:customer.token})).status,200);
    assert.equal((await ctx.request(`/api/transactions/${ledger.id}/confirm`,{token:operator.token,method:'POST'})).status,200);
    await post('/fulfillment-requests',{harvest_id:harvest.id,method:'pickup'},customer.token);
    const result=await db.query(await sql('08_application.sql'));
    assert.equal(result[0].rows[0].tray_count,'2');assert.equal(result[1].rows[0].status,'paid');assert.equal(result[2].rows[0].customer_id,customer.id);
    return {httpToSql:true,staffPayment:'200',ownRental:'200',otherRental:'404',customerReport:'403',uiScope:'API evidence; React/Flutter have separate tests, not inferred here'};
  });
  await record(9,async()=>{
    await ctx.request(`/api/devices/${device.id}`,{token:admin.token,method:'PATCH',body:{automation_enabled:true}});
    await child('iot/simulator.mjs',{API_URL:ctx.base,DEVICE_TOKEN:device.token,SAMPLE_COUNT:'3'},'simulator');
    const result=await db.query(await sql('09_iot.sql'));
    assert.equal(result[0].rows[0].sample_count,'3');assert.equal(result[0].rows[0].all_simulated,true);
    assert.ok(result[2].rows.length>0);assert.ok(result[2].rows.every(c=>c.dry_run&&c.status==='acknowledged'));
    assert.ok(result[3].rows.some(r=>r.kind==='environment'));
    const environment=await ctx.request(`/api/rooms/${room.id}/environment?limit=1000`,{token:customer.token});assert.equal(environment.status,200);
    assert.ok(environment.body.data.readings.some(r=>r.device_id===device.id&&r.simulated));
    assert.equal((await ctx.pool.query("SELECT 1 FROM notifications WHERE user_id=$1 AND kind='environment'",[other.id])).rowCount,0);
    return {samples:3,simulated:true,commands:'dry-run/acknowledged',alerts:true,customerApiReadsSql:true,physicalHardware:'NOT TESTED'};
  });
  console.log('PASS9/9 HQTCSDL demos. Private fixture, SQL variables, measured plans and results: '+directory);
  }
}catch(error){
  report.demos[current||1]={status:'FAIL',code:error.code??error.name,message:error.message};process.exitCode=1;
  console.error('FAIL HQTCSDL demo'+current+': '+(error.code??error.name)+'; inspect private results/logs.');
}finally{
  report.finishedAt=new Date().toISOString();await writeFile(join(directory,'results.json'),JSON.stringify(report,null,2));
  await db.query('ROLLBACK');db.release();await ctx.close();
}
