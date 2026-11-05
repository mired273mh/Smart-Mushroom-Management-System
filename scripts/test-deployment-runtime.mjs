import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { readFile,writeFile,mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

// Fresh isolated Compose project/volume, never the default/user project.
const project='smhq'+Date.now(),root=fileURLToPath(new URL('../',import.meta.url));
const directory=new URL('../.local/hq-docker/'+project+'/',import.meta.url);
await mkdir(directory,{recursive:true});
const env={...process.env,POSTGRES_PASSWORD:randomBytes(24).toString('hex'),APP_DB_PASSWORD:randomBytes(24).toString('hex'),ADMIN_EMAIL:'admin@hq-docker.test.invalid',ADMIN_PASSWORD:randomBytes(24).toString('base64url'),ADMIN_NAME:'HQ Docker fixture'};
const reportPassword=randomBytes(24).toString('hex');
await writeFile(new URL('private.json',directory),JSON.stringify({project,POSTGRES_PASSWORD:env.POSTGRES_PASSWORD,APP_DB_PASSWORD:env.APP_DB_PASSWORD,ADMIN_EMAIL:env.ADMIN_EMAIL,ADMIN_PASSWORD:env.ADMIN_PASSWORD,reportPassword},null,2),{mode:0o600});
const log=[];
const redact=text=>{
  let value=text;for(const secret of [env.POSTGRES_PASSWORD,env.APP_DB_PASSWORD,env.ADMIN_PASSWORD,reportPassword])value=value.replaceAll(secret,'[REDACTED]');return value;
};
const run=async(args,{input='',capture=false}={})=>{
  const child=spawn(process.platform==='win32'?'docker.exe':'docker',args,{cwd:root,env,windowsHide:true,stdio:['pipe','pipe','pipe']});
  let output='';child.stdout.on('data',b=>{output+=b;});child.stderr.on('data',b=>{output+=b;});
  const completion=new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',resolve);});
  child.stdin.on('error',()=>{});child.stdin.end(input);
  const code=await completion;
  // Arguments contain no secrets; provisioning passwords only go through stdin.
  const clean=redact(output);
  log.push({args,code,output:clean});await writeFile(new URL('commands.json',directory),JSON.stringify(log,null,2));
  assert.equal(code,0,'Docker command failed; inspect private commands.json');return capture?output:undefined;
};
const base=['compose','-p',project,'-f','compose.yaml'];
const runtime=['compose','-p',project,'-f','compose.yaml','-f','deploy/database/compose.runtime.yaml'];
let started=false;
try{
  await run([...runtime,'config','--quiet']);
  await run([...runtime,'build']);console.log('PASS runtime Docker: images built.');
  started=true;await run([...base,'up','-d','--wait','--wait-timeout','120','db']);
  await run([...base,'run','--rm','migrate']);
  // Only this fresh container DB is provisioned; no ALTER ROLE/password reset.
  const roleSql=`CREATE ROLE sm_runtime LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD '${env.APP_DB_PASSWORD}';\nCREATE ROLE sm_report LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD '${reportPassword}';`;
  await run([...base,'exec','-T','db','psql','-X','-v','ON_ERROR_STOP=1','-U','smart_mushroom','-d','smart_mushroom'],{input:roleSql});
  await run([...base,'exec','-T','db','psql','-X','-v','ON_ERROR_STOP=1','-v','runtime_role=sm_runtime','-v','report_role=sm_report','-v','db_name=smart_mushroom','-U','smart_mushroom','-d','smart_mushroom'],{input:await readFile(new URL('../deploy/database/grants.sql',import.meta.url),'utf8')});
  await run([...runtime,'run','--rm','-e','ADMIN_EMAIL','-e','ADMIN_PASSWORD','-e','ADMIN_NAME','api','node','server/src/cli.js','admin']);
  await run([...runtime,'up','-d','--wait','--wait-timeout','120']);
  const identity=await run([...runtime,'exec','-T','api','node','--input-type=module','-e',
    "import pg from 'pg';const p=new pg.Pool({connectionString:process.env.DATABASE_URL});try{const r=await p.query(\"SELECT current_user,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) AS superuser,has_schema_privilege(current_user,'public','CREATE') AS ddl,has_table_privilege(current_user,'schema_migrations','SELECT') AS migrations\");console.log(JSON.stringify(r.rows[0]));}finally{await p.end();}"],{capture:true});
  const actual=JSON.parse(identity.trim());assert.deepEqual(actual,{current_user:'sm_runtime',superuser:false,ddl:false,migrations:false});
  await run([...runtime,'exec','-T','api','node','--input-type=module','-e',
    "const r=await fetch('http://127.0.0.1:3000/ready');if(!r.ok)throw Error('not ready');console.log('Ready with runtime role');"]);
  const script=spawn(process.execPath,['scripts/test-deployment.mjs'],{cwd:root,env,windowsHide:true,stdio:['ignore','pipe','pipe']});let smoke='';
  script.stdout.on('data',b=>{smoke+=b;});script.stderr.on('data',b=>{smoke+=b;});
  const code=await new Promise((resolve,reject)=>{script.once('error',reject);script.once('exit',resolve);});
  await writeFile(new URL('smoke.log',directory),redact(smoke));if(code!==0)console.error(redact(smoke).slice(-3000));assert.equal(code,0,'Runtime stack smoke failed');
  await writeFile(new URL('result.json',directory),JSON.stringify({status:'PASS',project,identity:actual,smoke:'real PostgreSQL/migrate/API/Nginx/login/query/logout',hardware:'NOT TESTED'},null,2));
  console.log('PASS runtime Docker: real sm_runtime login, no superuser/DDL/migration access; Nginx/API/DB/auth smoke.');
}catch(error){
  await writeFile(new URL('result.json',directory),JSON.stringify({status:'FAIL',project,code:error.code??error.name,message:error.message},null,2));
  console.error('FAIL runtime Docker; inspect '+fileURLToPath(directory));process.exitCode=1;
  console.error(redact(log.at(-1)?.output??error.message).slice(-3000));
}finally{
  if(started)try{await run([...runtime,'stop']);console.log('Stopped only '+project+'; its volume/data retained.');}catch{process.exitCode=1;}
}
