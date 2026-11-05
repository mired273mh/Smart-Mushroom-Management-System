import { readFile, mkdir, writeFile, access } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { parse } from 'dotenv';
import { createPool } from '../server/src/db.js';
import { migrate } from '../server/src/migrate.js';
import { hashPassword, newToken, tokenHash } from '../server/src/security.js';
import { createApp } from '../server/src/app.js';

const repo=fileURLToPath(new URL('../',import.meta.url));
const directory=new URL('../.local/demo/',import.meta.url);
const configFile=new URL('private.json',directory);
const command=process.argv[2];
const exists=async path=>{try{await access(path);return true;}catch{return false;}};
function validate(value){
  const url=new URL(value.databaseUrl);
  if(!['127.0.0.1','localhost'].includes(url.hostname)||!/^sm_demo_[a-z0-9_]+$/.test(url.pathname.slice(1)))throw new Error('Refusing non-local or non-demo database. Do not edit private.json manually.');
  return value;
}
async function initialize(){
  if(await exists(configFile)){validate(JSON.parse(await readFile(configFile,'utf8')));console.log('Demo already initialized; kept existing DB/accounts. Run: node scripts/demo.mjs start');return;}
  // Only the known local cluster is used as a connection template. No seed is
  // ever inserted into the template/development database or an arbitrary env DB.
  const local=parse(await readFile(new URL('../.local/database.env',import.meta.url)));
  const url=new URL(local.DATABASE_URL);
  if(!['127.0.0.1','localhost'].includes(url.hostname))throw new Error('Expected the local PostgreSQL cluster; see demo guide.');
  const name='sm_demo_'+Date.now()+'_'+randomBytes(4).toString('hex');
  const management=new URL(url);management.pathname='/postgres';
  const adminPool=createPool(management.href);
  try{await adminPool.query(`CREATE DATABASE "${name}"`);}finally{await adminPool.end();}
  url.pathname='/'+name;
  const config=validate({databaseUrl:url.href,accounts:[],deviceToken:newToken(),controlKey:newToken(),createdAt:new Date().toISOString()});
  const pool=createPool(config.databaseUrl);
  try{
    await migrate(pool);
    for(const role of ['admin','operator','customer']){
      const email=role+'@demo.test.invalid',password=randomBytes(18).toString('base64url');
      await pool.query('INSERT INTO users(email,name,password_hash,role) VALUES ($1,$2,$3,$4)',[email,'Demo '+role,await hashPassword(password),role]);
      config.accounts.push({role,email,password});
    }
    const room=(await pool.query("INSERT INTO rooms(name,description) VALUES ('Phòng Demo','Dữ liệu trình diễn riêng; không phải trại thực tế') RETURNING id")).rows[0];
    for(let n=1;n<=6;n++)await pool.query('INSERT INTO trays(room_id,code,label) VALUES ($1,$2,$3)',[room.id,'DEMO-'+String(n).padStart(3,'0'),'Khay trình diễn '+n]);
    await pool.query("INSERT INTO rental_plans(name,duration_days,price_vnd) VALUES ('Gói Demo 30 ngày',30,120000)");
    await pool.query("INSERT INTO devices(room_id,name,token_hash,mode) VALUES ($1,'SIMULATOR Demo',$2,'simulator')",[room.id,tokenHash(config.deviceToken)]);
    await mkdir(directory,{recursive:true});
    await writeFile(configFile,JSON.stringify(config,null,2),{flag:'wx',mode:0o600});
    console.log('Created isolated '+name+' with 3 accounts, 6 trays and simulator. Passwords are stored only in .local/demo/private.json (ignored by Git).');
  } finally{await pool.end();}
}
async function start(){
  const config=validate(JSON.parse(await readFile(configFile,'utf8')));
  const pool=createPool(config.databaseUrl);let api;const children=[];let closing=false;
  const close=async()=>{
    if(closing)return;closing=true;
    for(const child of children)child.kill();
    if(api)await new Promise(resolve=>api.close(resolve));
    await pool.end();
    console.log('Demo processes stopped; DB/accounts and PostgreSQL retained.');
  };
  try{
    await pool.query('SELECT 1');
    const app=createApp({pool,config:{WEB_ORIGIN:'http://localhost:5173'}});
    api=createServer((req,res)=>{
      if(req.method==='POST'&&req.url==='/__demo/stop'){
        if(!config.controlKey||req.headers['x-demo-control']!==config.controlKey){res.writeHead(403);res.end();return;}
        res.writeHead(204);res.end();setImmediate(close);return;
      }
      app(req,res);
    }).listen(3000,'127.0.0.1');
    await new Promise((resolve,reject)=>{api.once('listening',resolve);api.once('error',reject);});
    const child=(file,args=[],extraEnv={})=>{
      const processChild=spawn(process.execPath,[file,...args],{cwd:repo,env:{...process.env,...extraEnv},stdio:['ignore','inherit','inherit'],windowsHide:true});
      children.push(processChild);
      processChild.on('error',()=>{console.error('Demo child could not start.');process.exitCode=1;close();});
      return processChild;
    };
    const vite=child(fileURLToPath(new URL('../node_modules/vite/bin/vite.js',import.meta.url)),[fileURLToPath(new URL('../web/',import.meta.url)),'--host','127.0.0.1','--port','5173','--strictPort'],{API_TARGET:'http://127.0.0.1:3000'});
    vite.on('exit',code=>{if(!closing){console.error('Web exited ('+code+'); check whether port5173 is already used.');process.exitCode=1;close();}});
    child(fileURLToPath(new URL('../iot/simulator.mjs',import.meta.url)),[],{API_URL:'http://127.0.0.1:3000',DEVICE_TOKEN:config.deviceToken,SAMPLE_COUNT:'1000'});
    process.once('SIGINT',close);process.once('SIGTERM',close);
    console.log('Demo API http://127.0.0.1:3000; Web http://localhost:5173; Android emulator http://10.0.2.2:3000. Ctrl+C stops only this demo.');
    console.log('Read .local/demo/private.json locally for account credentials. Telemetry is SIMULATED, commands dry-run; no camera feed.');
  }catch(error){await close();throw error;}
}
try{
  if(command==='init')await initialize();
  else if(command==='start')await start();
  else if(command==='stop'){
    const config=validate(JSON.parse(await readFile(configFile,'utf8')));
    if(!config.controlKey)throw new Error('No demo control key configured.');
    const response=await fetch('http://127.0.0.1:3000/__demo/stop',{method:'POST',headers:{'X-Demo-Control':config.controlKey},signal:AbortSignal.timeout(5000)});
    if(response.status!==204)throw new Error('Stop refused; no unrelated process was terminated.');
    console.log('Requested shutdown of this demo only. PostgreSQL/data retained.');
  } else if(command==='status'){
    const config=validate(JSON.parse(await readFile(configFile,'utf8')));const pool=createPool(config.databaseUrl);
    try{const row=(await pool.query("SELECT current_database() AS database,(SELECT count(*)::int FROM users) AS users,(SELECT count(*)::int FROM rentals) AS rentals")).rows[0];console.log(JSON.stringify(row));}finally{await pool.end();}
  }else throw new Error('Usage: node scripts/demo.mjs init|start|stop|status. See docs/DEMO_WINDOWS.md.');
}catch(error){console.error('Demo failed: '+(error.code||error.message));process.exitCode=1;}
