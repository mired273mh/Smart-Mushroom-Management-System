import { readFile, mkdir, writeFile, access } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { parse } from 'dotenv';
import { createPool } from '../server/src/db.js';
import { runPg } from './postgres-tools.mjs';
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
const schemaReady=async pool=>(await pool.query("SELECT 1 FROM schema_migrations WHERE filename='004_database_integrity.sql'")).rowCount>0;
const businessCounts=async pool=>{
  const tables=(await pool.query("SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename<>'schema_migrations' ORDER BY tablename")).rows;
  const result={};for(const {tablename} of tables){if(!/^[a-z_]+$/.test(tablename))throw Error('Unexpected table name');result[tablename]=(await pool.query(`SELECT count(*)::bigint AS n FROM "${tablename}"`)).rows[0].n;}return result;
};
async function upgrade(){
  const config=validate(JSON.parse(await readFile(configFile,'utf8'))),pool=createPool(config.databaseUrl);
  let restored;
  try{
    if(await schemaReady(pool)){console.log('Demo schema already current; migrations verified: '+await migrate(pool));return;}
    // Refuse upgrade while a local API may still be writing. Do not stop it.
    try{await fetch('http://127.0.0.1:3000/health',{signal:AbortSignal.timeout(1000)});throw Error('Stop the local API/demo before upgrade.');}
    catch(error){if(error.cause?.code!=='ECONNREFUSED')throw error;}
    const before=await businessCounts(pool),stamp=Date.now()+'_'+randomBytes(4).toString('hex');
    const backups=new URL('../.local/backups/',import.meta.url);await mkdir(backups,{recursive:true});
    const filename=fileURLToPath(new URL('demo-before-upgrade-'+stamp+'.dump',backups));
    await runPg(config.databaseUrl,'pg_dump',['--format=custom','--file',filename]);
    const restoreName='sm_test_demo_upgrade_'+stamp,management=new URL(config.databaseUrl);management.pathname='/postgres';
    const manager=createPool(management.href);try{await manager.query(`CREATE DATABASE "${restoreName}"`);}finally{await manager.end();}
    await runPg(config.databaseUrl,'pg_restore',['--exit-on-error','--no-owner','--no-privileges','--dbname',restoreName,filename],{database:restoreName});
    const restoredUrl=new URL(config.databaseUrl);restoredUrl.pathname='/'+restoreName;restored=createPool(restoredUrl.href);
    await migrate(restored);
    if(JSON.stringify(await businessCounts(restored))!==JSON.stringify(before))throw Error('Restore/upgrade row counts mismatch; original DB not migrated.');
    if(JSON.stringify(await businessCounts(pool))!==JSON.stringify(before))throw Error('Demo data changed during verification; original DB not migrated.');
    await migrate(pool);
    if(JSON.stringify(await businessCounts(pool))!==JSON.stringify(before))throw Error('Post-upgrade counts changed; inspect backup before any further action.');
    console.log('Demo schema upgraded after dump/restore rehearsal; business row counts unchanged.');
    console.log('Private backup: '+filename+'; restored test database retained. Accounts/config unchanged.');
  }finally{await restored?.end();await pool.end();}
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
    if(!await schemaReady(pool))throw Error('Demo schema needs upgrade. Stop services, then run: node scripts/demo.mjs upgrade (backup +restore rehearsal first).');
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
  else if(command==='upgrade')await upgrade();
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
  }else throw new Error('Usage: node scripts/demo.mjs init|upgrade|start|stop|status. See docs/DEMO_WINDOWS.md.');
}catch(error){console.error('Demo failed: '+(error.code||error.message));process.exitCode=1;}
