import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { createPool } from '../server/src/db.js';
import { setup } from '../server/test/helpers.js';
import { restrictedRoles } from '../server/test/database-roles.js';
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
let restored, restoredRoles;
try {
  const user = await ctx.user('customer');
  const admin=await ctx.user('admin'),other=await ctx.user('customer');
  const post=async(path,body,token=admin.token)=>{
    const result=await ctx.request('/api'+path,{token,method:'POST',body});
    assert.equal(result.status,201);return result.body.data;
  };
  const room=await post('/rooms',{name:'Backup integrity fixture'});
  const tray=await post('/trays',{room_id:room.id,code:'BACKUP-001',label:'Backup test tray'});
  const plan=await post('/plans',{name:'Backup plan',duration_days:30,price_vnd:120000});
  const rental=await post('/rentals',{plan_id:plan.id,tray_ids:[tray.id]},user.token);
  const item=rental.items[0];
  await post(`/rental-items/${item.id}/progress`,{stage:'fruiting'});
  await post(`/rental-items/${item.id}/progress`,{stage:'ready'});
  const harvest=await post(`/rental-items/${item.id}/harvests`,{weight_grams:1000});
  const tables=(await ctx.pool.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")).rows.map(r=>r.tablename);
  const counts=async pool=>Object.fromEntries(await Promise.all(tables.map(async name=>{
    assert.match(name,/^[a-z_]+$/);return [name,(await pool.query(`SELECT count(*)::int AS n FROM "${name}"`)).rows[0].n];
  })));
  const before=await counts(ctx.pool);
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
  const expected=(await ctx.pool.query('SELECT count(*)::int AS n FROM schema_migrations')).rows[0].n;
  assert.equal((await restored.query('SELECT count(*)::int AS n FROM schema_migrations')).rows[0].n,expected);
  assert.deepEqual(await counts(restored),before);
  assert.equal((await restored.query('SELECT public.fn_rental_total_vnd($1) AS amount',[rental.id])).rows[0].amount,'120000');
  assert.equal((await restored.query('SELECT harvested_grams FROM public.v_room_cultivation_summary WHERE id=$1',[room.id])).rows[0].harvested_grams,'1000');
  assert.equal((await restored.query("SELECT 1 FROM pg_trigger WHERE tgname='fulfillment_owner' AND NOT tgisinternal")).rowCount,1);
  assert.ok((await restored.query("SELECT to_regprocedure('public.sp_confirm_rental_payment(uuid,uuid)') AS routine")).rows[0].routine);
  await assert.rejects(restored.query("INSERT INTO fulfillment_requests(harvest_id,customer_id,method) VALUES ($1,$2,'pickup')",[harvest.id,other.id]),{code:'23514'});
  // Portable restore skips ACLs; reinstall verified least-privilege grants.
  restoredRoles=await restrictedRoles(restored);
  assert.equal((await restoredRoles.runtime.query('SELECT public.fn_rental_total_vnd($1) AS amount',[rental.id])).rows[0].amount,'120000');
  await assert.rejects(restoredRoles.report.query('SELECT password_hash FROM users'),{code:'42501'});
  await assert.rejects(restoredRoles.report.query('SELECT public.fn_rental_total_vnd($1)',[rental.id]),{code:'42501'});
  const ledger=(await restored.query('SELECT id FROM transactions WHERE rental_id=$1',[rental.id])).rows[0];
  await restoredRoles.runtime.query('CALL public.sp_confirm_rental_payment($1,$2)',[ledger.id,admin.id]);
  assert.equal((await restored.query('SELECT status FROM transactions WHERE id=$1',[ledger.id])).rows[0].status,'paid');
  console.log(`PASS: pg_dump/pg_restore NEW database; ${tables.length} table row counts, rental snapshot/harvest views, trigger, procedure and restored runtime/report privileges verified. Test databases/dump retained.`);
} finally { await restoredRoles?.close();await restored?.end(); await ctx.close(); }
