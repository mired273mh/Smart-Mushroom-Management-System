import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {createPool} from '../server/src/db.js';

// Requires an already running local demo. No bootstrap, booking, actuator,
// schema change or process termination; login/logout creates/revokes sessions.
let profile,browser,pool;
const sessions=[];
const secrets=()=>[profile?.databaseUrl,profile?.deviceToken,profile?.controlKey,...(profile?.accounts??[]).map(account=>account.password)].filter(Boolean);
const redact=value=>secrets().reduce((text,secret)=>text.replaceAll(secret,'[REDACTED]'),String(value));
const base='http://127.0.0.1:3000';
async function request(path,token,body){
  return fetch(base+path,{method:body===undefined?'GET':'POST',headers:{...(token?{Authorization:'Bearer '+token}:{}),...(body===undefined?{}:{'Content-Type':'application/json'})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(10000)});
}
try{
  profile=JSON.parse(await readFile(new URL('../.local/demo/private.json',import.meta.url),'utf8'));
  const url=new URL(profile.databaseUrl);
  assert.ok(['127.0.0.1','localhost'].includes(url.hostname)&&/^sm_demo_[a-z0-9_]+$/.test(url.pathname.slice(1)),'Only the isolated local demo is supported.');
  assert.equal((await request('/ready')).status,200,'Start the demo first.');
  pool=createPool(profile.databaseUrl);
  const counts=async()=>(await pool.query('SELECT (SELECT count(*)::int FROM users) AS users,(SELECT count(*)::int FROM rentals) AS rentals')).rows[0];
  const before=await counts();
  assert.equal((await pool.query('SELECT count(*)::int AS n FROM schema_migrations')).rows[0].n,4);
  for(const account of profile.accounts){
    const response=await request('/api/auth/login',null,{email:account.email,password:account.password});
    assert.equal(response.status,200,'Demo account login failed.');
    const {data}=await response.json();assert.equal(data.user.role,account.role);sessions.push(data.token);
    assert.equal((await request('/api/users',data.token)).status,account.role==='admin'?200:403);
    assert.equal((await request('/api/rentals?limit=20',data.token)).status,200);
    const catalog=await (await request('/api/catalog?limit=20',data.token)).json();assert.ok(catalog.data.pagination.trays);
  }
  const adminIndex=profile.accounts.findIndex(account=>account.role==='admin');
  const rooms=await (await request('/api/rooms?limit=20',sessions[adminIndex])).json();
  assert.ok(rooms.pagination);assert.ok(rooms.data.length>0);
  const environment=await (await request('/api/rooms/'+rooms.data[0].id+'/environment?limit=1',sessions[adminIndex])).json();
  assert.ok(environment.data.readings[0]?.simulated,'Expected explicitly simulated demo telemetry.');
  assert.ok(Date.now()-Date.parse(environment.data.readings[0].recorded_at)<30000,'Simulator has no recent sample.');
  browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH||process.platform==='win32'?{executablePath:process.env.CHROME_PATH??'C:/Program Files/Google/Chrome/Application/chrome.exe'}:{})});
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://localhost:5173');
  for(const role of ['admin','operator','customer']){
    const account=profile.accounts.find(account=>account.role===role);
    await page.getByLabel('Email',{exact:true}).fill(account.email);
    await page.getByLabel('Mật khẩu',{exact:true}).fill(account.password);
    await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();
    if(role==='customer')await page.getByRole('alert').filter({hasText:'Customer sử dụng ứng dụng Flutter'}).waitFor();
    else{
      await page.getByRole('heading',{name:'Tổng quan',exact:true}).waitFor();
      assert.equal(await page.getByRole('navigation').getByRole('button',{name:'Tài khoản',exact:true}).count(),role==='admin'?1:0);
      await page.getByRole('navigation').getByRole('button',{name:'Phòng trồng',exact:true}).click();
      await page.getByRole('navigation',{name:'Phân trang danh sách'}).getByText(/^Trang 1/).waitFor();
      await page.getByRole('button',{name:'Đăng xuất',exact:true}).click();
      await page.getByRole('heading',{name:'Đăng nhập',exact:true}).waitFor();
    }
  }
  assert.deepEqual(errors,[]);assert.deepEqual(await counts(),before);
  console.log('PASS: native demo readiness/schema4, 3-role API/RBAC, React Chrome login/logout/directory, recent SIMULATOR data; business row counts unchanged.');
}catch(error){console.error('Demo smoke failed: '+redact(error.message));process.exitCode=1;}
finally{
  await browser?.close();
  for(const token of sessions){
    try{const response=await request('/api/auth/logout',token,{});assert.equal(response.status,204);}catch{console.error('Demo smoke session cleanup failed; no business data was deleted.');process.exitCode=1;}
  }
  await pool?.end();
}
