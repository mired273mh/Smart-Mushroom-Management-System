import { spawn, execFileSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { setup } from '../server/test/helpers.js';

const device=process.env.ANDROID_TEST_DEVICE ?? 'emulator-5554';
if(!/^emulator-\d+$/.test(device))throw new Error('This runner permits Android emulators only; no physical device is modified.');
const sdk=process.env.ANDROID_SDK_ROOT ?? process.env.ANDROID_HOME ?? join(homedir(),'AppData','Local','Android','Sdk');
const adb=join(sdk,'platform-tools',process.platform==='win32'?'adb.exe':'adb');
try {assert.equal(execFileSync(adb,['-s',device,'get-state'],{encoding:'utf8',windowsHide:true,timeout:10000,stdio:['ignore','pipe','ignore']}).trim(),'device');}
catch {throw new Error('Android emulator is unavailable. Boot an AVD and set ANDROID_TEST_DEVICE before running; no test DB was created.');}
const ctx=await setup();
try {
  const admin=await ctx.user('admin');
  const post=async(path,body)=>{
    const r=await ctx.request('/api'+path,{token:admin.token,method:'POST',body});
    assert.equal(r.status,201,'Android fixture '+path);return r.body.data;
  };
  const room=await post('/rooms',{name:'Phòng Android test'});
  await post('/plans',{name:'Gói Android',duration_days:30,price_vnd:130000});
  for(const code of ['ANDROID-UI-001','ANDROID-UI-002'])await post('/trays',{room_id:room.id,code,label:'Khay Android test'});
  await post('/devices',{room_id:room.id,name:'Android SIMULATOR',mode:'simulator'});
  const email='android-'+randomUUID()+'@test.invalid';
  const local=fileURLToPath(new URL('../.local/',import.meta.url));await mkdir(local,{recursive:true});
  const fixture=join(local,'android-fixture-'+Date.now()+'.json');
  await writeFile(fixture,JSON.stringify({ANDROID_TEST_URL:ctx.base.replace('127.0.0.1','10.0.2.2'),ANDROID_TEST_EMAIL:email,ANDROID_TEST_PASSWORD:admin.password,ANDROID_TEST_ADMIN_EMAIL:admin.email}));
  const flutter=process.env.FLUTTER_ROOT ?? join(homedir(),'.sm-tools','flutter');
  const dart=join(flutter,'bin','cache','dart-sdk','bin',process.platform==='win32'?'dart.exe':'dart');
  const child=spawn(dart,[join(flutter,'bin','cache','flutter_tools.snapshot'),'test','integration_test/customer_android_test.dart','-d',device,'--dart-define-from-file='+fixture,'--reporter','expanded'],{cwd:fileURLToPath(new URL('../mobile/',import.meta.url)),env:{...process.env,FLUTTER_ROOT:flutter,DEBUG:''},stdio:'inherit',windowsHide:true});
  const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',resolve);});
  assert.equal(code,0,'Android UI integration runner must pass');
  const state=(await ctx.pool.query(`SELECT n.status,(SELECT count(*)::int FROM rental_items i WHERE i.rental_id=n.id) AS items,
    (SELECT count(*)::int FROM rental_items i WHERE i.rental_id=n.id AND i.linked_at IS NOT NULL) AS linked,
    (SELECT count(*)::int FROM transactions t WHERE t.rental_id=n.id AND t.status='paid') AS paid,
    (SELECT count(*)::int FROM fulfillment_requests f WHERE f.customer_id=n.customer_id AND f.status='completed') AS delivered
    FROM rentals n JOIN users u ON u.id=n.customer_id WHERE u.email=$1`,[email])).rows;
  assert.equal(state.length,1);assert.equal(state[0].status,'completed');assert.equal(state[0].items,2);assert.equal(state[0].linked,1);assert.equal(state[0].paid,1);assert.equal(state[0].delivered,1);
  console.log('PASS: Android emulator UI registration/rent2/link/room telemetry SIMULATOR/harvest/delivery/profile/logout; PostgreSQL confirmed completed rental, paid ledger and delivered harvest. No physical IoT tested. Test DB retained.');
} finally {await ctx.close();}
