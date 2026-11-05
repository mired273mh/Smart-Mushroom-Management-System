import { randomUUID } from 'node:crypto';
import { createPool } from '../src/db.js';
import { migrate } from '../src/migrate.js';
import { createApp } from '../src/app.js';
import { hashPassword } from '../src/security.js';

export async function setup(config = {}) {
  const connectionString = process.env.TEST_DATABASE_URL;
  if (!connectionString) throw new Error('TEST_DATABASE_URL is required (PostgreSQL real, no mock).');
  const url = new URL(connectionString);
  if (!url.pathname.slice(1).startsWith('sm_test_')) throw new Error('Test DB name must start with sm_test_. Never use production/development DB.');
  url.pathname += '_' + randomUUID().slice(0,8);
  const management = new URL(connectionString);
  management.pathname = '/postgres';
  const adminPool = createPool(management.href);
  // Names are validated before being interpolated as SQL identifiers.
  const dbName = url.pathname.slice(1);
  if (!/^sm_test_[a-z0-9_]+$/.test(dbName)) throw new Error('Invalid test database name.');
  try {
    const exists = await adminPool.query('SELECT 1 FROM pg_database WHERE datname=$1', [dbName]);
    if (!exists.rowCount) await adminPool.query(`CREATE DATABASE "${dbName}"`);
  } finally { await adminPool.end(); }
  const pool = createPool(url.href);
  await migrate(pool);
  const server = createApp({ pool, config: { WEB_ORIGIN: 'http://localhost:5173', ...config } }).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = async (path, { method = 'GET', body, token } = {}) => {
    const res = await fetch(base + path, { method, headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: res.status, body: res.status === 204 ? null : res.headers.get('content-type')?.includes('application/json') ? await res.json() : await res.text(), headers: res.headers };
  };
  const user = async role => {
    const email = `${randomUUID()}@test.invalid`;
    const password = 'OnlyForTests_12345!';
    const row = (await pool.query('INSERT INTO users(email,name,password_hash,role) VALUES ($1,$2,$3,$4) RETURNING id', [email, role, await hashPassword(password), role])).rows[0];
    const login = await request('/api/auth/login', { method: 'POST', body: { email, password } });
    if (login.status !== 200) throw new Error(`Login failed: ${JSON.stringify(login.body)}`);
    return { id: row.id, email, password, token: login.body.data.token };
  };
  return { pool, base, request, user, close: async () => { await new Promise(resolve => server.close(resolve)); await pool.end(); } };
}
