import {before,after,test} from 'node:test';
import assert from 'node:assert/strict';
import {setup} from './helpers.js';
let ctx,admin,operator,customer,other,room;
before(async()=>{
  ctx=await setup();[admin,operator,customer,other]=await Promise.all(['admin','operator','customer','admin'].map(ctx.user));
  await ctx.pool.query("INSERT INTO rooms(name) SELECT 'Directory room '||g FROM generate_series(1,211) g");
  room=(await ctx.pool.query('SELECT id FROM rooms LIMIT 1')).rows[0];
  await ctx.pool.query("INSERT INTO trays(room_id,code,label) SELECT $1,'DIR-'||lpad(g::text,4,'0'),'Directory tray' FROM generate_series(1,211) g",[room.id]);
  await ctx.pool.query("INSERT INTO rental_plans(name,duration_days,price_vnd,active) SELECT 'Directory plan '||g,30,1000,g<>211 FROM generate_series(1,211) g");
  await ctx.pool.query("INSERT INTO users(email,name,password_hash,role,created_at) SELECT 'dir'||g||'@test.invalid','Directory customer '||(g/4),password_hash,'customer','2026-01-01'::timestamptz+(g%3)*interval '0.000001 second' FROM users CROSS JOIN generate_series(1,211) g WHERE id=$1",[customer.id]);
  await ctx.pool.query("INSERT INTO devices(room_id,name,mode,token_hash,created_at) SELECT $1,'Directory device '||g,'simulator',md5(g::text),'2026-01-01'::timestamptz+(g%3)*interval '0.000001 second' FROM generate_series(1,211) g",[room.id]);
});
after(async()=>{await ctx?.close();});
const get=(path,query='',token=admin.token)=>ctx.request('/api/'+path+(query?'?'+query:''),{token});
test('staff directories expose every row beyond100 with stable ties and precise timestamps',async()=>{
  for(const kind of ['rooms','trays','plans','customers','users','devices']){
    const first=await get(kind);assert.equal(first.status,200);assert.equal(first.body.data.length,100);assert.equal(first.body.pagination.has_more,true);
    const seen=[];let cursor=null;
    do{
      const p=new URLSearchParams({limit:'37'});if(cursor)p.set('cursor',cursor);
      const r=await get(kind,p.toString());assert.equal(r.status,200);seen.push(...r.body.data.map(row=>row.id));cursor=r.body.pagination.next_cursor;
      assert.ok(seen.length<300,'cursor must advance');
    }while(cursor);
    const table={customers:'users',users:'users',plans:'rental_plans'}[kind]??kind;
    const count=Number((await ctx.pool.query(`SELECT count(*) FROM ${table}`+(kind==='customers'?" WHERE role='customer' AND active AND deleted_at IS NULL":''))).rows[0].count);
    assert.equal(seen.length,count,kind);assert.equal(new Set(seen).size,count,kind);
  }
});
test('directory search is literal and cursor context is validated without widening access',async()=>{
  for(const kind of ['rooms','trays','plans','customers','users','devices']){
    const r=await get(kind,'limit=5&q=Directory');assert.equal(r.status,200);assert.equal(r.body.data.length,5);
    const cursor=r.body.pagination.next_cursor;
    for(const query of ['limit=5&q=Other&cursor='+cursor,'limit=6&q=Directory&cursor='+cursor,'limit=5&q=Directory&cursor=bad'])assert.equal((await get(kind,query)).status,422);
    assert.equal((await get(kind,'limit=5&q=Directory&cursor='+cursor,other.token)).status,422);
    for(const q of ['%',"' OR TRUE --"]){const empty=await get(kind,new URLSearchParams({q}).toString());assert.equal(empty.status,200);assert.equal(empty.body.data.length,0);}
    assert.equal((await get(kind,'q='+('a'.repeat(101)))).status,422);
  }
  const foreign=(await get('rooms','limit=5')).body.pagination.next_cursor;
  assert.equal((await get('trays','limit=5&cursor='+foreign)).status,422);
  for(const kind of ['rooms','trays','customers','users','devices'])assert.equal((await get(kind,'',customer.token)).status,403);
  assert.equal((await get('users','',operator.token)).status,403);
  let cursor=null,plans=[];
  do{const r=await get('plans',new URLSearchParams({limit:'37',...(cursor?{cursor}:{})}).toString(),customer.token);assert.equal(r.status,200);plans.push(...r.body.data);cursor=r.body.pagination.next_cursor;}while(cursor);
  assert.equal(plans.length,210);assert.ok(plans.every(p=>p.active));
  assert.ok(!(await get('users','limit=1')).body.data[0].password_hash);
  assert.ok(!(await get('devices','limit=1')).body.data[0].token_hash);
});
