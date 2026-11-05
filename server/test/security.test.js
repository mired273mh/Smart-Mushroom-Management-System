import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { setup } from './helpers.js';
let ctx;
before(async () => { ctx = await setup(); });
after(async () => { await ctx?.close(); });
test('bootstrap CLI creates only the first admin and never logs credentials', async () => {
  const secret = 'IsolatedBootstrapPassword_123!';
  const run = async () => {
    const child = spawn(process.execPath,[fileURLToPath(new URL('../src/cli.js',import.meta.url)),'admin'],{env:{...process.env,DATABASE_URL:ctx.pool.options.connectionString,ADMIN_EMAIL:'bootstrap@test.invalid',ADMIN_PASSWORD:secret,ADMIN_NAME:'First Admin'},windowsHide:true});
    let output = '';
    child.stdout.on('data',v => { output += v; }); child.stderr.on('data',v => { output += v; });
    const code = await new Promise((resolve,reject) => { child.once('error',reject); child.once('exit',resolve); });
    return {code,output};
  };
  const first = await run();
  assert.equal(first.code,0,first.output);
  assert.equal(first.output.includes(secret),false);
  const second = await run();
  assert.equal(second.code,1);
  assert.match(second.output,/Admin already exists/);
  assert.equal((await ctx.pool.query("SELECT id FROM users WHERE role='admin'")).rowCount,1);
});
test('malformed JSON, oversized input and auth errors stay bounded', async () => {
  const broken = await fetch(ctx.base+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"email":'});
  assert.equal(broken.status,400);
  assert.equal((await broken.json()).error.code,'BAD_JSON');
  const large = await fetch(ctx.base+'/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'x'.repeat(70000)})});
  assert.equal(large.status,413);
  assert.equal((await ctx.request('/api/users')).status,401);
});
test('user lifecycle, operator assignment projection and last-admin protection', async () => {
  const login = await ctx.request('/api/auth/login',{method:'POST',body:{email:'bootstrap@test.invalid',password:'IsolatedBootstrapPassword_123!'}});
  const token = login.body.data.token;
  const created = await ctx.request('/api/users',{token,method:'POST',body:{name:'New Staff',email:'newstaff@test.invalid',password:'NewStaffPassword_123!',role:'operator'}});
  assert.equal(created.status,201);
  const id = created.body.data.id;
  assert.equal(created.body.data.password_hash,undefined);
  assert.equal((await ctx.request(`/api/users/${id}`,{token,method:'PATCH',body:{role:'customer',name:'New Customer'}})).status,200);
  const operator = await ctx.user('operator');
  const projected = (await ctx.request('/api/customers',{token:operator.token})).body.data;
  assert.deepEqual(Object.keys(projected.find(u => u.id===id)).sort(),['email','id','name']);
  assert.equal((await ctx.request(`/api/users/${id}`,{token,method:'DELETE'})).status,204);
  assert.ok((await ctx.pool.query('SELECT deleted_at FROM users WHERE id=$1',[id])).rows[0].deleted_at);
  const me = (await ctx.request('/api/auth/me',{token})).body.data;
  assert.equal((await ctx.request(`/api/users/${me.id}`,{token,method:'PATCH',body:{role:'customer'}})).status,409);
});
