import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { createPool } from '../server/src/db.js';
import { setup } from '../server/test/helpers.js';
const ctx = await setup();
const pgBin = process.env.PG_BIN ?? join(homedir(),'.sm-tools','pgsql','bin');
const executable = name => join(pgBin,name+(process.platform === 'win32' ? '.exe' : ''));
const url = new URL(ctx.pool.options.connectionString);
const pgEnv = { ...process.env, PGHOST:url.hostname, PGPORT:url.port || '5432', PGUSER:decodeURIComponent(url.username), PGPASSWORD:decodeURIComponent(url.password), PGDATABASE:url.pathname.slice(1) };
const run = async (name,args,env=pgEnv) => {
  const child = spawn(executable(name),args,{env,windowsHide:true,stdio:['ignore','ignore','pipe']});
  let errorOutput = '';
  child.stderr.on('data',chunk => { errorOutput += chunk; });
  const code = await new Promise((resolve,reject) => { child.once('error',reject); child.once('exit',resolve); });
  if (code !== 0) throw new Error(`${name} failed: ${errorOutput}`);
};
let restored;
try {
  const user = await ctx.user('customer');
  const directory = fileURLToPath(new URL('../.local/backups/',import.meta.url));
  await mkdir(directory,{recursive:true});
  const filename = join(directory,`verification-${Date.now()}.dump`);
  await run('pg_dump',['--format=custom','--file',filename]);
  const restoreName = 'sm_test_restore_'+randomUUID().replaceAll('-','');
  const management = new URL(url); management.pathname='/postgres';
  const pool = createPool(management.href);
  try { await pool.query(`CREATE DATABASE "${restoreName}"`); } finally { await pool.end(); }
  await run('pg_restore',['--exit-on-error','--no-owner','--no-privileges','--dbname',restoreName,filename],{...pgEnv,PGDATABASE:restoreName});
  const restoreUrl = new URL(url); restoreUrl.pathname='/'+restoreName;
  restored = createPool(restoreUrl.href);
  assert.equal((await restored.query('SELECT email FROM users WHERE id=$1',[user.id])).rows[0].email,user.email);
  assert.equal((await restored.query('SELECT count(*)::int AS n FROM schema_migrations')).rows[0].n,3);
  console.log('PASS: pg_dump custom → pg_restore into a NEW sm_test_restore_* database; data and migrations verified. Source/test databases retained.');
} finally { await restored?.end(); await ctx.close(); }
