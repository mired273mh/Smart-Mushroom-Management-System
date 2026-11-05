import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { setup } from './helpers.js';
import { migrate } from '../src/migrate.js';
import { readConfig } from '../src/config.js';
let ctx;
before(async () => { ctx = await setup(); });
after(async () => { await ctx?.close(); });
test('migration is repeatable and PostgreSQL is ready', async () => {
  assert.equal(await migrate(ctx.pool), 4);
  assert.equal((await ctx.request('/health')).status, 200);
  assert.equal((await ctx.request('/ready')).status, 200);
});
test('configuration rejects non-PostgreSQL and invalid ports', () => {
  assert.throws(() => readConfig({ DATABASE_URL: 'sqlite://local', PORT: '0' }));
});
test('public registration cannot elevate role; login/logout and profile are enforced', async () => {
  const input = { email: `${randomUUID()}@test.invalid`, name: 'Khách mới', password: 'CustomerPassword123!' };
  assert.equal((await ctx.request('/api/auth/register', { method: 'POST', body: { ...input, role: 'admin' } })).status, 422);
  const created = await ctx.request('/api/auth/register', { method: 'POST', body: input });
  assert.equal(created.status, 201);
  assert.equal(created.body.data.role, 'customer');
  assert.equal(created.body.data.password_hash, undefined);
  assert.equal((await ctx.request('/api/auth/register', { method: 'POST', body: input })).status, 409);
  assert.equal((await ctx.request('/api/auth/login', { method: 'POST', body: { email: input.email, password: 'wrong' } })).status, 401);
  const login = await ctx.request('/api/auth/login', { method: 'POST', body: { email: input.email, password: input.password } });
  assert.equal(login.status, 200);
  const token = login.body.data.token;
  assert.equal((await ctx.request('/api/auth/me')).status, 401);
  assert.equal((await ctx.request('/api/auth/me', { token })).body.data.id, created.body.data.id);
  assert.equal((await ctx.request('/api/auth/me', { token, method: 'PATCH', body: { name: 'Tên mới' } })).body.data.name, 'Tên mới');
  const session = (await ctx.pool.query('SELECT token_hash FROM sessions WHERE user_id=$1', [created.body.data.id])).rows[0];
  assert.notEqual(session.token_hash, token);
  assert.equal((await ctx.request('/api/auth/logout', { token, method: 'POST' })).status, 204);
  assert.equal((await ctx.request('/api/auth/me', { token })).status, 401);
});
test('expired sessions and disabled users are denied immediately', async () => {
  const user = await ctx.user('operator');
  await ctx.pool.query('UPDATE users SET active=false WHERE id=$1', [user.id]);
  assert.equal((await ctx.request('/api/auth/me', { token: user.token })).status, 401);
  await ctx.pool.query('UPDATE users SET active=true WHERE id=$1', [user.id]);
  await ctx.pool.query("UPDATE sessions SET expires_at=now()-interval '1 second' WHERE user_id=$1", [user.id]);
  assert.equal((await ctx.request('/api/auth/me', { token: user.token })).status, 401);
});
