// HTTP device fixtures only. These tests do NOT exercise a physical ESP32/relay.
import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';
import { readConfig } from '../src/config.js';
let ctx, admin, operator, customer, room, device, simulator;
const allowlist=[];
const sample={temperature:24,humidity:85,co2:800};
before(async()=>{
  ctx=await setup({HARDWARE_ACTUATION_ALLOWLIST:allowlist});
  [admin,operator,customer]=await Promise.all(['admin','operator','customer'].map(ctx.user));
  room=(await ctx.request('/api/rooms',{token:admin.token,method:'POST',body:{name:'Hardware policy test'}})).body.data;
  for(const mode of ['hardware','simulator']){
    const d=(await ctx.request('/api/devices',{token:admin.token,method:'POST',body:{room_id:room.id,name:mode,mode}})).body.data;
    if(mode==='hardware')device=d;else simulator=d;
  }
});
after(async()=>{await ctx?.close();});
const send=(d,body)=>ctx.request(`/api/devices/${d.id}/commands`,{token:operator.token,method:'POST',body:{actuator:'fan',enabled:true,dry_run:false,...body}});
const poll=d=>ctx.request('/api/iot/commands',{token:d.token});
test('hardware deployment config defaults locked and rejects non-UUID allowlist',()=>{
  assert.deepEqual(readConfig({DATABASE_URL:'postgresql://localhost/test'}).HARDWARE_ACTUATION_ALLOWLIST,[]);
  assert.throws(()=>readConfig({DATABASE_URL:'postgresql://localhost/test',HARDWARE_ACTUATION_ALLOWLIST:'*'}));
  assert.deepEqual(readConfig({DATABASE_URL:'postgresql://localhost/test',HARDWARE_ACTUATION_ALLOWLIST:` ${device.id}, `}).HARDWARE_ACTUATION_ALLOWLIST,[device.id]);
});
test('physical control requires explicit hardware allowlist, fresh sample, bounded duration and staff',async()=>{
  assert.equal((await send(device)).status,409);
  assert.equal((await poll(device)).body.meta.hardware_control_available,false);
  allowlist.push(device.id,simulator.id);
  assert.equal((await send(simulator)).status,409);
  assert.equal((await send(device)).body.error.code,'SENSOR_STALE');
  assert.equal((await send(device,{duration_seconds:11})).status,422);
  assert.equal((await ctx.request(`/api/devices/${device.id}/commands`,{token:customer.token,method:'POST',body:{actuator:'fan',enabled:true,dry_run:false}})).status,403);
  assert.equal((await ctx.request('/api/iot/readings',{token:device.token,method:'POST',body:sample})).status,201);
  const command=await send(device);
  assert.equal(command.status,201);assert.equal(command.body.data.dry_run,false);
  assert.equal(command.body.data.status,'pending');
  const queued=(await poll(device)).body;
  assert.equal(queued.meta.hardware_control_available,true);
  assert.equal(queued.data.length,1);assert.ok(Number(queued.data[0].expires_epoch)>Date.now()/1000);
  assert.equal((await poll(simulator)).body.data.length,0);
});
test('supersede, token-scoped ack, replay, expiration and stale OFF',async()=>{
  const old=(await poll(device)).body.data[0];
  const next=await send(device,{enabled:false});
  assert.equal(next.status,201);
  assert.equal((await ctx.pool.query('SELECT status FROM device_commands WHERE id=$1',[old.id])).rows[0].status,'expired');
  const ack=`/api/iot/commands/${next.body.data.id}/ack`;
  const body={success:true,result:'HTTP fixture only; no electrical feedback'};
  assert.equal((await ctx.request(ack,{token:simulator.token,method:'POST',body})).status,404);
  assert.equal((await ctx.request(ack,{token:device.token,method:'POST',body})).status,200);
  assert.equal((await ctx.request(ack,{token:device.token,method:'POST',body})).status,404);
  const expiring=await send(device);
  await ctx.pool.query("UPDATE device_commands SET expires_at=now()-interval '1 second' WHERE id=$1",[expiring.body.data.id]);
  const history=(await ctx.request(`/api/devices/${device.id}/commands`,{token:operator.token})).body.data;
  assert.equal(history.find(c=>c.id===expiring.body.data.id).status,'expired');
  assert.equal(history.find(c=>c.id===next.body.data.id).status,'acknowledged');
  assert.equal((await ctx.request(`/api/devices/${device.id}/commands`,{token:customer.token})).status,403);
  assert.equal((await poll(device)).body.data.length,0);
  assert.equal((await ctx.request(`/api/iot/commands/${expiring.body.data.id}/ack`,{token:device.token,method:'POST',body})).status,404);
  await ctx.pool.query("UPDATE sensor_readings SET recorded_at=now()-interval '31 seconds' WHERE device_id=$1",[device.id]);
  assert.equal((await send(device)).status,409);
  assert.equal((await send(device,{enabled:false})).status,201);
});
test('poll and ack enforce wall-clock TTL after waiting for a database lock',async()=>{
  for(const operation of ['poll','ack']){
    const command=(await send(device,{enabled:false})).body.data;
    const blocker=await ctx.pool.connect();let pending;
    try{
      await blocker.query('BEGIN');
      await blocker.query('SELECT id FROM rooms WHERE id=$1 FOR UPDATE',[room.id]);
      pending=operation==='poll'?poll(device):ctx.request(`/api/iot/commands/${command.id}/ack`,{token:device.token,method:'POST',body:{success:true,result:'HTTP fixture'}});
      let waiting=false;
      for(let i=0;i<100;i++){
        waiting=(await ctx.pool.query("SELECT 1 FROM pg_stat_activity WHERE datname=current_database() AND state='active' AND wait_event_type='Lock'")).rowCount>0;
        if(waiting)break;await new Promise(resolve=>setTimeout(resolve,20));
      }
      assert.equal(waiting,true,'request must reach the room lock before expiry');
      await blocker.query("UPDATE device_commands SET expires_at=clock_timestamp()-interval '1 millisecond' WHERE device_id=$1 AND status='pending'",[device.id]);
      await blocker.query('COMMIT');
      const result=await pending;
      if(operation==='poll')assert.equal(result.body.data.length,0);else assert.equal(result.status,404);
    }finally{await blocker.query('ROLLBACK');blocker.release();if(pending)await pending;}
  }
});
test('automatic bounded pulses prioritize ventilation, deduplicate and renew only after cooldown',async()=>{
  await ctx.request(`/api/devices/${device.id}`,{token:admin.token,method:'PATCH',body:{automation_enabled:true}});
  const ingest=()=>ctx.request('/api/iot/readings',{token:device.token,method:'POST',body:{temperature:10,humidity:60,co2:2000}});
  assert.equal((await ingest()).status,201);
  const rows=()=>ctx.pool.query("SELECT * FROM device_commands WHERE device_id=$1 AND source='automatic' ORDER BY created_at",[device.id]);
  let commands=(await rows()).rows;
  assert.equal(commands.length,3);assert.ok(commands.every(c=>!c.dry_run&&c.duration_seconds===10));
  assert.equal(commands.find(c=>c.actuator==='fan').enabled,true);
  assert.equal(commands.find(c=>c.actuator==='heater').enabled,false);
  await ingest();assert.equal((await rows()).rowCount,3);
  await ctx.pool.query("UPDATE device_commands SET created_at=now()-interval '31 seconds' WHERE device_id=$1 AND source='automatic'",[device.id]);
  await ingest();assert.equal((await rows()).rowCount,5);
  allowlist.length=0;
  assert.equal((await poll(device)).body.data.length,0);
  assert.equal((await send(device)).status,409);
});
test('rotated and disabled device credentials cannot poll or acknowledge',async()=>{
  const rotated=(await ctx.request(`/api/devices/${device.id}/rotate-token`,{token:admin.token,method:'POST'})).body.data;
  assert.equal((await poll(device)).status,401);
  assert.equal((await ctx.request('/api/iot/commands/00000000-0000-4000-8000-000000000000/ack',{token:device.token,method:'POST',body:{success:true,result:'old token'}})).status,401);
  device.token=rotated.token;
  assert.equal((await poll(device)).status,200);
  await ctx.request(`/api/devices/${device.id}`,{token:admin.token,method:'PATCH',body:{active:false}});
  assert.equal((await poll(device)).status,401);
});
