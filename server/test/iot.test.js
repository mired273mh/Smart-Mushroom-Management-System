import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { setup } from './helpers.js';
let ctx, admin, operator, alice, bob, room, device, hardware, item;
const suffix = randomUUID().slice(0,8).toUpperCase();
const sample = { temperature: 35, humidity: 65, co2: 2000 };
before(async () => {
  ctx = await setup();
  [admin,operator,alice,bob] = await Promise.all(['admin','operator','customer','customer'].map(ctx.user));
  room = (await ctx.request('/api/rooms', { token: operator.token, method: 'POST', body: { name: `IoT ${suffix}` } })).body.data;
  for (const mode of ['simulator','hardware']) {
    const result = await ctx.request('/api/devices', { token: admin.token, method: 'POST', body: { room_id: room.id, name: mode, mode } });
    assert.equal(result.status, 201);
    if (mode === 'simulator') device = result.body.data; else hardware = result.body.data;
  }
});
after(async () => { await ctx?.close(); });
test('device identity is separate; sensor validation and database provenance', async () => {
  assert.equal((await ctx.request('/api/iot/me', { token: device.token })).body.data.mode, 'simulator');
  assert.equal((await ctx.request('/api/iot/readings', { token: alice.token, method: 'POST', body: sample })).status, 401);
  assert.equal((await ctx.request('/api/auth/me', { token: device.token })).status, 401);
  assert.equal((await ctx.request('/api/iot/readings', { token: device.token, method: 'POST', body: { ...sample, humidity: 101 } })).status, 422);
  assert.equal((await ctx.request('/api/iot/readings', { token: device.token, method: 'POST', body: { ...sample, simulated: false } })).status, 422);
  const reading = await ctx.request('/api/iot/readings', { token: device.token, method: 'POST', body: sample });
  assert.equal(reading.status, 201);
  assert.equal(reading.body.data.simulated, true);
  assert.equal(reading.body.data.abnormal, true);
  const listed = await ctx.request('/api/devices', { token: operator.token });
  assert.equal(listed.body.data[0].token_hash, undefined);
  assert.ok(listed.body.data.find(d => d.id === device.id).last_seen_at);
});
test('environment ownership excludes pre-rental readings and other customers', async () => {
  const tray = (await ctx.request('/api/trays', { token: operator.token, method: 'POST', body: { room_id: room.id, code: `IOT-${suffix}`, label: 'Khay IoT' } })).body.data;
  const plan = (await ctx.request('/api/plans', { token: admin.token, method: 'POST', body: { name: `IoT ${suffix}`, price_vnd: 1, duration_days: 1 } })).body.data;
  const rental = (await ctx.request('/api/rentals', { token: alice.token, method: 'POST', body: { plan_id: plan.id, tray_ids: [tray.id] } })).body.data;
  item = rental.items[0];
  assert.equal((await ctx.request(`/api/rooms/${room.id}/environment`, { token: bob.token })).status, 404);
  assert.equal((await ctx.request(`/api/rooms/${room.id}/environment`, { token: alice.token })).body.data.readings.length, 0);
  await ctx.request('/api/iot/readings', { token: device.token, method: 'POST', body: sample });
  const environment = (await ctx.request(`/api/rooms/${room.id}/environment`, { token: alice.token })).body.data;
  assert.equal(environment.measurement_scope, 'room');
  assert.equal(environment.readings.length, 1);
  await ctx.request('/api/iot/readings', { token: device.token, method: 'POST', body: sample });
  assert.equal((await ctx.request('/api/notifications', { token: alice.token })).body.data.filter(n => n.kind === 'environment').length, 1);
  assert.equal((await ctx.request('/api/notifications', { token: bob.token })).body.data.filter(n => n.kind === 'environment').length, 0);
});
test('thresholds, automation dry-run, command scoping, ack and TTL', async () => {
  const threshold = { temperature_min: 15, temperature_max: 30, humidity_min: 70, humidity_max: 95, co2_max: 1500, notifications_enabled: true };
  assert.equal((await ctx.request(`/api/rooms/${room.id}/thresholds`, { token: operator.token, method: 'PATCH', body: threshold })).status, 403);
  assert.equal((await ctx.request(`/api/rooms/${room.id}/thresholds`, { token: admin.token, method: 'PATCH', body: { ...threshold, humidity_min: 98 } })).status, 422);
  assert.equal((await ctx.request(`/api/rooms/${room.id}/thresholds`, { token: admin.token, method: 'PATCH', body: threshold })).status, 200);
  await ctx.request(`/api/devices/${device.id}`, { token: admin.token, method: 'PATCH', body: { automation_enabled: true } });
  await ctx.request('/api/iot/readings', { token: device.token, method: 'POST', body: sample });
  const commands = (await ctx.request('/api/iot/commands', { token: device.token })).body.data;
  assert.equal(commands.length, 3);
  assert.ok(commands.every(c => c.dry_run));
  const ack = `/api/iot/commands/${commands[0].id}/ack`;
  assert.equal((await ctx.request(ack, { token: hardware.token, method: 'POST', body: { success: true, result: 'wrong device' } })).status, 404);
  assert.equal((await ctx.request(ack, { token: device.token, method: 'POST', body: { success: true, result: 'Mô phỏng' } })).status, 200);
  assert.equal((await ctx.request(ack, { token: device.token, method: 'POST', body: { success: true, result: 'replay' } })).status, 404);
  await ctx.pool.query("UPDATE device_commands SET expires_at=now()-interval '1 second' WHERE device_id=$1 AND status='dry_run'", [device.id]);
  assert.equal((await ctx.request('/api/iot/commands', { token: device.token })).body.data.length, 0);
  assert.equal((await ctx.request(`/api/devices/${device.id}/commands`, { token: operator.token, method: 'POST', body: { actuator: 'fan', enabled: true, dry_run: false } })).status, 409);
  assert.equal((await ctx.request(`/api/devices/${device.id}/commands`, { token: alice.token, method: 'POST', body: { actuator: 'fan', enabled: true } })).status, 403);
  assert.equal((await ctx.request('/api/iot/commands', { token: hardware.token })).body.data.length, 0);
});
test('camera contract, ownership and device token rotation', async () => {
  const path = `/api/rooms/${room.id}/camera`;
  assert.equal((await ctx.request(path, { token: alice.token })).body.data.configured, false);
  assert.equal((await ctx.request(path, { token: bob.token })).status, 404);
  assert.equal((await ctx.request(path, { token: operator.token, method: 'PATCH', body: { url: 'https://user:pass@camera.invalid' } })).status, 422);
  assert.equal((await ctx.request(path, { token: operator.token, method: 'PATCH', body: { url: 'https://camera.example.invalid/live' } })).status, 200);
  assert.equal((await ctx.request(path, { token: alice.token })).body.data.hardware_verified, false);
  const rotated = await ctx.request(`/api/devices/${device.id}/rotate-token`, { token: admin.token, method: 'POST' });
  assert.equal(rotated.status, 200);
  assert.equal((await ctx.request('/api/iot/readings', { token: device.token, method: 'POST', body: sample })).status, 401);
  assert.equal((await ctx.request('/api/iot/readings', { token: rotated.body.data.token, method: 'POST', body: sample })).status, 201);
});
