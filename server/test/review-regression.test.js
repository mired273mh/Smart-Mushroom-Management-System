import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { setup } from './helpers.js';
import { seedRentalHistory } from './history-fixtures.js';
import { hashPassword } from '../src/security.js';
let ctx, admin;
before(async () => { ctx = await setup(); admin = await ctx.user('admin'); });
after(async () => { await ctx?.close(); });
const request = (path, method='GET', body) => ctx.request('/api'+path,{token:admin.token,method,body});
const room = async (active=true) => (await request('/rooms','POST',{name:'Review '+randomUUID(),active,description:'Keep description'})).body.data;

async function waitForBlockedQuery() {
  const deadline = Date.now()+5000;
  while (Date.now()<deadline) {
    const result = await ctx.pool.query("SELECT 1 FROM pg_stat_activity WHERE datname=current_database() AND pid<>pg_backend_pid() AND state='active' AND wait_event_type='Lock'");
    if (result.rowCount) return;
    await new Promise(resolve => setTimeout(resolve,20));
  }
  throw new Error('Expected a blocked test request, no lock waiter appeared.');
}

test('PATCH room preserves omitted active/description; empty patch is rejected', async () => {
  const r = await room(false);
  const changed = await request('/rooms/'+r.id,'PATCH',{name:'Renamed '+randomUUID()});
  assert.equal(changed.status,200);
  assert.equal(changed.body.data.active,false);
  assert.equal(changed.body.data.description,'Keep description');
  assert.equal((await request('/rooms/'+r.id,'PATCH',{})).status,422);
});
test('PATCH plan does not silently reactivate a closed plan', async () => {
  const plan = (await request('/plans','POST',{name:'Review plan '+randomUUID(),duration_days:30,price_vnd:100,active:false})).body.data;
  const changed = await request('/plans/'+plan.id,'PATCH',{price_vnd:200});
  assert.equal(changed.status,200);
  assert.equal(changed.body.data.active,false);
  assert.equal((await request('/plans/'+plan.id,'PATCH',{})).status,422);
});
test('PATCH tray label preserves maintenance status', async () => {
  const r = await room();
  const created = await request('/trays','POST',{room_id:r.id,code:'R-'+randomUUID().toUpperCase(),label:'Review tray',status:'maintenance'});
  assert.equal(created.status,201);
  const tray = created.body.data;
  const changed = await request('/trays/'+tray.id,'PATCH',{label:'Renamed tray'});
  assert.equal(changed.status,200);
  assert.equal(changed.body.data.status,'maintenance');
});
test('editing rented tray with unchanged room/status is allowed', async () => {
  const customer = await ctx.user('customer');
  const [fixture] = await seedRentalHistory(ctx.pool,{customerId:customer.id,actorId:admin.id,count:1});
  const tray = (await ctx.pool.query('SELECT * FROM trays WHERE id=$1',[fixture.tray_id])).rows[0];
  const changed = await request('/trays/'+tray.id,'PATCH',{room_id:tray.room_id,label:'Label correction',status:'available'});
  assert.equal(changed.status,200);
  assert.equal(changed.body.data.label,'Label correction');
});
test('soft-delete cannot strand a customer with active rentals', async () => {
  const customer = await ctx.user('customer');
  await seedRentalHistory(ctx.pool,{customerId:customer.id,actorId:admin.id,count:1});
  const deleted = await request('/users/'+customer.id,'DELETE');
  assert.equal(deleted.status,409);
  assert.equal((await ctx.pool.query('SELECT deleted_at FROM users WHERE id=$1',[customer.id])).rows[0].deleted_at,null);
});
test('password reset serializes with login so the old password cannot create a fresh session', async () => {
  const customer = await ctx.user('customer');
  const newHash = await hashPassword('NewPasswordAfterReset_123!');
  const blocker = await ctx.pool.connect();
  let open = false, pending;
  try {
    await blocker.query('BEGIN'); open=true;
    await blocker.query('SELECT id FROM users WHERE id=$1 FOR UPDATE',[customer.id]);
    pending = ctx.request('/api/auth/login',{method:'POST',body:{email:customer.email,password:customer.password}});
    await waitForBlockedQuery();
    await blocker.query('UPDATE users SET password_hash=$2 WHERE id=$1',[customer.id,newHash]);
    await blocker.query('DELETE FROM sessions WHERE user_id=$1',[customer.id]);
    await blocker.query('COMMIT'); open=false;
    assert.equal((await pending).status,401);
    assert.equal((await ctx.pool.query('SELECT 1 FROM sessions WHERE user_id=$1',[customer.id])).rowCount,0);
  } finally { if (open) await blocker.query('ROLLBACK'); blocker.release(); if (pending) await pending; }
});
test('customer environment boundary keeps PostgreSQL microseconds', async () => {
  const customer = await ctx.user('customer');
  const [fixture] = await seedRentalHistory(ctx.pool,{customerId:customer.id,actorId:admin.id,count:1});
  const tray = (await ctx.pool.query('SELECT room_id FROM trays WHERE id=$1',[fixture.tray_id])).rows[0];
  await ctx.pool.query("UPDATE rentals SET starts_at='2026-01-01T00:00:00.123999Z' WHERE id=$1",[fixture.id]);
  const device = (await request('/devices','POST',{room_id:tray.room_id,name:'Boundary simulator',mode:'simulator'})).body.data;
  await ctx.pool.query("INSERT INTO sensor_readings(device_id,temperature,humidity,co2,simulated,recorded_at) VALUES ($1,22,80,800,true,'2026-01-01T00:00:00.123500Z'),($1,23,81,900,true,'2026-01-01T00:00:00.124000Z')",[device.id]);
  const response = await ctx.request(`/api/rooms/${tray.room_id}/environment`,{token:customer.token});
  assert.equal(response.status,200);
  assert.equal(response.body.data.readings.length,1);
  assert.equal(response.body.data.readings[0].co2,900);
});
test('device token rotation revokes an ingest request waiting for the room lock', async () => {
  const r = await room();
  const device = (await request('/devices','POST',{room_id:r.id,name:'Race simulator',mode:'simulator'})).body.data;
  const blocker = await ctx.pool.connect();
  let open=false, pending;
  try {
    await blocker.query('BEGIN'); open=true;
    await blocker.query('SELECT id FROM rooms WHERE id=$1 FOR UPDATE',[r.id]);
    pending = ctx.request('/api/iot/readings',{token:device.token,method:'POST',body:{temperature:22,humidity:80,co2:800}});
    await waitForBlockedQuery();
    assert.equal((await request(`/devices/${device.id}/rotate-token`,'POST')).status,200);
    await blocker.query('COMMIT'); open=false;
    assert.equal((await pending).status,401);
    assert.equal((await ctx.pool.query('SELECT 1 FROM sensor_readings WHERE device_id=$1',[device.id])).rowCount,0);
  } finally { if (open) await blocker.query('ROLLBACK'); blocker.release(); if (pending) await pending; }
});
