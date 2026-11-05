import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { setup } from './helpers.js';
test('standalone simulator stores labelled readings, acknowledges dry-run and refuses hardware identity', async () => {
  const ctx = await setup();
  try {
    const admin = await ctx.user('admin');
    const room = (await ctx.request('/api/rooms',{token:admin.token,method:'POST',body:{name:'Simulator CLI test'}})).body.data;
    const device = (await ctx.request('/api/devices',{token:admin.token,method:'POST',body:{room_id:room.id,name:'CLI test',mode:'simulator'}})).body.data;
    await ctx.request(`/api/devices/${device.id}`,{token:admin.token,method:'PATCH',body:{automation_enabled:true}});
    const run = async token => {
      const child = spawn(process.execPath,[fileURLToPath(new URL('../../iot/simulator.mjs',import.meta.url))],{env:{...process.env,API_URL:ctx.base,DEVICE_TOKEN:token,SAMPLE_COUNT:'2'},windowsHide:true});
      let output = '';
      child.stdout.on('data',chunk => { output += chunk; });
      child.stderr.on('data',chunk => { output += chunk; });
      const code = await new Promise((resolve,reject) => { child.once('error',reject); child.once('exit',resolve); });
      return {code,output};
    };
    const result = await run(device.token);
    assert.equal(result.code,0,result.output);
    assert.match(result.output,/MÔ PHỎNG/);
    assert.equal((await ctx.pool.query('SELECT count(*)::int AS n FROM sensor_readings WHERE device_id=$1 AND simulated',[device.id])).rows[0].n,2);
    assert.ok((await ctx.pool.query("SELECT count(*)::int AS n FROM device_commands WHERE device_id=$1 AND dry_run AND status='acknowledged'",[device.id])).rows[0].n>=3);
    const hardware = (await ctx.request('/api/devices',{token:admin.token,method:'POST',body:{room_id:room.id,name:'Hardware placeholder',mode:'hardware'}})).body.data;
    const refused = await run(hardware.token);
    assert.equal(refused.code,1);
    assert.match(refused.output,/mode=simulator/);
  } finally { await ctx.close(); }
});
