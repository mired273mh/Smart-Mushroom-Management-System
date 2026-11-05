import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { setup } from './helpers.js';
let ctx, admin, operator, alice, bob, room, plan;
const suffix = randomUUID().slice(0,8).toUpperCase();
before(async () => {
  ctx = await setup();
  [admin,operator,alice,bob] = await Promise.all(['admin','operator','customer','customer'].map(ctx.user));
  room = (await ctx.request('/api/rooms', { method: 'POST', token: operator.token, body: { name: `Room ${suffix}` } })).body.data;
  plan = (await ctx.request('/api/plans', { method: 'POST', token: admin.token, body: { name: `Plan ${suffix}`, price_vnd: 100000, duration_days: 30 } })).body.data;
});
after(async () => { await ctx?.close(); });
async function tray(n) {
  const res = await ctx.request('/api/trays', { method: 'POST', token: operator.token, body: { room_id: room.id, code: `TR-${suffix}-${n}`, label: `Khay ${n}` } });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  return res.body.data;
}
test('RBAC, unique code, validation, and reference restrictions', async () => {
  assert.equal((await ctx.request('/api/rooms', { token: alice.token })).status, 403);
  assert.equal((await ctx.request('/api/users', { token: operator.token })).status, 403);
  assert.equal((await ctx.request('/api/plans', { token: operator.token, method: 'POST', body: {} })).status, 403);
  const t = await tray('UNIQUE');
  assert.equal((await ctx.request('/api/trays', { token: admin.token, method: 'POST', body: { room_id: room.id, code: t.code, label: 'Trùng' } })).status, 409);
  assert.equal((await ctx.request('/api/rooms/not-a-uuid', { token: admin.token, method: 'DELETE' })).status, 422);
  assert.equal((await ctx.request(`/api/rooms/${room.id}`, { token: admin.token, method: 'DELETE' })).status, 409);
});
test('multi-tray rental has price snapshot, ownership and safe linking', async () => {
  const a = await tray('MULTI-A'), b = await tray('MULTI-B');
  const res = await ctx.request('/api/rentals', { token: alice.token, method: 'POST', body: { plan_id: plan.id, tray_ids: [a.id,b.id] } });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  const rental = res.body.data;
  assert.equal(rental.items.length, 2);
  assert.equal((await ctx.request(`/api/rentals/${rental.id}`, { token: bob.token })).status, 404);
  assert.equal((await ctx.request(`/api/rental-items/${rental.items[0].id}`, { token: bob.token })).status, 404);
  assert.equal((await ctx.request('/api/trays/link', { token: bob.token, method: 'POST', body: { code: a.code } })).status, 404);
  assert.ok((await ctx.request('/api/trays/link', { token: alice.token, method: 'POST', body: { code: a.code } })).body.data.linked_at);
  assert.equal((await ctx.request(`/api/trays/${a.id}`, { token: operator.token, method: 'PATCH', body: { status: 'maintenance' } })).status, 409);
  assert.equal((await ctx.request(`/api/rooms/${room.id}`, { token: operator.token, method: 'PATCH', body: { active: false } })).status, 409);
  await ctx.request(`/api/plans/${plan.id}`, { token: admin.token, method: 'PATCH', body: { price_vnd: 200000 } });
  const detail = await ctx.request(`/api/rentals/${rental.id}`, { token: alice.token });
  assert.equal(detail.body.data.price_per_tray_vnd, 100000);
  assert.equal(Number(detail.body.data.transactions[0].amount_vnd), 200000);
  assert.equal((await ctx.request(`/api/rentals/${rental.id}/complete`, { token: alice.token, method: 'POST' })).status, 403);
  assert.equal((await ctx.request(`/api/rentals/${rental.id}/complete`, { token: operator.token, method: 'POST' })).status, 409);
  const catalog = await ctx.request('/api/catalog', { token: bob.token });
  assert.ok(!catalog.body.data.trays.some(t => t.id === a.id));
});
test('concurrent attempts for one tray: one success and one conflict', async () => {
  const t = await tray('RACE');
  const results = await Promise.all([alice,bob].map(u => ctx.request('/api/rentals', { token: u.token, method: 'POST', body: { plan_id: plan.id, tray_ids: [t.id] } })));
  assert.deepEqual(results.map(r => r.status).sort(), [201,409]);
  assert.equal((await ctx.pool.query('SELECT count(*)::int AS n FROM rental_items WHERE tray_id=$1 AND ended_at IS NULL', [t.id])).rows[0].n, 1);
});
test('rental is all-or-nothing and customer cannot assign to another customer', async () => {
  const busy = await tray('BUSY'), free = await tray('FREE');
  assert.equal((await ctx.request('/api/rentals', { token: alice.token, method: 'POST', body: { plan_id: plan.id, tray_ids: [busy.id] } })).status, 201);
  const countBefore = (await ctx.pool.query('SELECT count(*) FROM rentals')).rows[0].count;
  assert.equal((await ctx.request('/api/rentals', { token: bob.token, method: 'POST', body: { plan_id: plan.id, tray_ids: [free.id,busy.id] } })).status, 409);
  assert.equal((await ctx.pool.query('SELECT count(*) FROM rentals')).rows[0].count, countBefore);
  assert.equal((await ctx.pool.query('SELECT 1 FROM rental_items WHERE tray_id=$1', [free.id])).rowCount, 0);
  assert.equal((await ctx.request('/api/rentals', { token: bob.token, method: 'POST', body: { plan_id: plan.id, tray_ids: [free.id], customer_id: alice.id } })).status, 403);
  assert.equal((await ctx.request('/api/rentals', { token: operator.token, method: 'POST', body: { plan_id: plan.id, tray_ids: [free.id], customer_id: bob.id } })).status, 201);
});
test('user administration revokes sessions and protects last admin', async () => {
  const isolated = await ctx.user('operator');
  assert.equal((await ctx.request(`/api/users/${isolated.id}`, { token: admin.token, method: 'PATCH', body: { password: 'ReplacedPassword_123' } })).status, 200);
  assert.equal((await ctx.request('/api/auth/me', { token: isolated.token })).status, 401);
  const allAdmins = await ctx.pool.query("SELECT id FROM users WHERE role='admin' AND active AND deleted_at IS NULL");
  // Setup may share a test database with the foundation file, which creates no admins.
  assert.equal(allAdmins.rowCount, 1);
  assert.equal((await ctx.request(`/api/users/${admin.id}`, { token: admin.token, method: 'DELETE' })).status, 409);
});
