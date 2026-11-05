import {before,after,test} from 'node:test';
import assert from 'node:assert/strict';
import {setup} from './helpers.js';
let ctx,customer,other,room;
before(async()=>{
  ctx=await setup();const admin=await ctx.user('admin');customer=await ctx.user('customer');other=await ctx.user('customer');
  room=(await ctx.request('/api/rooms',{token:admin.token,method:'POST',body:{name:'Catalog room'}})).body.data;
  const off=(await ctx.request('/api/rooms',{token:admin.token,method:'POST',body:{name:'Offline room',active:false}})).body.data;
  await ctx.pool.query("INSERT INTO rental_plans(name,price_vnd,duration_days) SELECT 'Plan '||lpad(g::text,4,'0'),(g/10)*1000,30 FROM generate_series(1,205) g");
  await ctx.pool.query("INSERT INTO rental_plans(name,price_vnd,duration_days,active) VALUES ('Inactive plan',1,30,false)");
  await ctx.pool.query("INSERT INTO trays(room_id,code,label,status) SELECT $1,'CAT-'||lpad(g::text,4,'0'),'Catalog tray '||g,CASE WHEN g>231 THEN 'maintenance' ELSE 'available' END FROM generate_series(1,251) g",[room.id]);
  await ctx.pool.query("INSERT INTO trays(room_id,code,label) VALUES ($1,'CAT-OFF','Offline tray')",[off.id]);
  const plan=(await ctx.pool.query('SELECT id FROM rental_plans WHERE active LIMIT 1')).rows[0];
  const tray=(await ctx.pool.query("SELECT id FROM trays WHERE code='CAT-0001'")).rows[0];
  assert.equal((await ctx.request('/api/rentals',{token:customer.token,method:'POST',body:{plan_id:plan.id,tray_ids:[tray.id]}})).status,201);
});
after(async()=>{await ctx?.close();});
const get=async(query='',token=customer.token)=>ctx.request('/api/catalog'+(query?'?'+query:''),{token});
test('catalog exposes next pages beyond100 and does not return unavailable stock',async()=>{
  const first=(await get()).body.data;
  assert.equal(first.plans.length,100);assert.equal(first.trays.length,100);
  assert.equal(first.pagination.plans.has_more,true);assert.equal(first.pagination.trays.has_more,true);
  for(const kind of ['plans','trays']){
    let cursor=null;const rows=[];
    do{
      const params=new URLSearchParams({limit:'37'});if(cursor)params.set(kind==='trays'?'tray_cursor':'plan_cursor',cursor);
      const result=await get(params.toString());assert.equal(result.status,200);const data=result.body.data;
      rows.push(...data[kind]);cursor=data.pagination[kind].next_cursor;
      if(!data.pagination[kind].has_more)assert.equal(cursor,null);
    }while(cursor);
    assert.equal(rows.length,kind==='plans'?205:230);assert.equal(new Set(rows.map(r=>r.id)).size,rows.length);
    if(kind==='trays')assert.equal(rows.some(r=>r.code==='CAT-0001'||r.code==='CAT-OFF'),false);
    else for(let i=1;i<rows.length;i++)assert.ok(rows[i-1].price_vnd<=rows[i].price_vnd);
  }
});
test('catalog searches code/label/room and plans literally, filtering before paging',async()=>{
  const result=await get(new URLSearchParams({tray_q:'cat-0023',plan_q:'Plan 0205',room_id:room.id}).toString());
  assert.equal(result.status,200);assert.deepEqual(result.body.data.trays.map(t=>t.code),['CAT-0023']);
  assert.deepEqual(result.body.data.plans.map(p=>p.name),['Plan 0205']);
  assert.equal(result.body.data.pagination.trays.has_more,false);
  assert.equal((await get('tray_q=Offline')).body.data.trays.length,0);
  for(const search of ['%','_',"' OR TRUE --"]){const r=await get(new URLSearchParams({tray_q:search,plan_q:search}).toString());assert.equal(r.status,200);assert.equal(r.body.data.trays.length,0);assert.equal(r.body.data.plans.length,0);}
  assert.equal((await get('tray_q=Catalog%20room&limit=5')).body.data.trays.length,5);
});
test('catalog cursor rejects corrupt, cross-viewer/kind/filter/limit contexts',async()=>{
  const first=(await get('limit=5')).body.data.pagination;
  for(const [query,token] of [
    ['limit=5&tray_cursor=not-a-cursor',customer.token],
    ['limit=5&tray_cursor='+first.trays.next_cursor,other.token],
    ['limit=6&tray_cursor='+first.trays.next_cursor,customer.token],
    ['limit=5&tray_q=abc&tray_cursor='+first.trays.next_cursor,customer.token],
    ['limit=5&plan_cursor='+first.trays.next_cursor,customer.token],
  ])assert.equal((await get(query,token)).status,422);
  assert.equal((await get('limit=0')).status,422);assert.equal((await get('limit=201')).status,422);
  assert.equal((await get('room_id=bad')).status,422);
  assert.equal((await get('tray_q='+('a'.repeat(101)))).status,422);
});
