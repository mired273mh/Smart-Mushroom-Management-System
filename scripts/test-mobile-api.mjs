import { spawn } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setup } from '../server/test/helpers.js';
const ctx = await setup();
try {
  const [admin,customer] = await Promise.all(['admin','customer'].map(ctx.user));
  const post = async (path,body) => {
    const response = await ctx.request('/api'+path,{token:admin.token,method:'POST',body});
    if (response.status !== 201) throw new Error('Mobile fixture failed: '+response.status);
    return response.body.data;
  };
  const room = await post('/rooms',{name:'Phòng Flutter integration'});
  const tray = await post('/trays',{room_id:room.id,code:'FLUTTER-LIVE-001',label:'Khay thử mới'});
  const plan = await post('/plans',{name:'Gói Flutter integration',duration_days:30,price_vnd:120000});
  const device = await post('/devices',{room_id:room.id,name:'Simulator Flutter',mode:'simulator'});
  const flutterRoot = process.env.FLUTTER_ROOT ?? join(homedir(),'.sm-tools','flutter');
  const dart = join(flutterRoot,'bin','cache','dart-sdk','bin',process.platform === 'win32' ? 'dart.exe' : 'dart');
  const child = spawn(dart,[join(flutterRoot,'bin','cache','flutter_tools.snapshot'),'test','integration/api_live_test.dart','--reporter','expanded'],{
    cwd:fileURLToPath(new URL('../mobile/',import.meta.url)),windowsHide:true,stdio:'inherit',
    env:{...process.env,FLUTTER_ROOT:flutterRoot,API_TEST_URL:ctx.base,API_TEST_EMAIL:customer.email,API_TEST_PASSWORD:customer.password,API_TEST_ROOM_ID:room.id,API_TEST_TRAY_ID:tray.id,API_TEST_TRAY_CODE:tray.code,API_TEST_PLAN_ID:plan.id,API_TEST_DEVICE_TOKEN:device.token},
  });
  const code = await new Promise((resolve,reject) => { child.once('error',reject); child.once('exit',resolve); });
  if (code !== 0) throw new Error('Flutter live API test failed.');
} finally { await ctx.close(); }
