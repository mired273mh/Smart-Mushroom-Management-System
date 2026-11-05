import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { homedir } from 'node:os';

export async function runPg(connectionString,command,args,{database}={}) {
  if(!['pg_dump','pg_restore'].includes(command))throw Error('Unsupported PostgreSQL CLI');
  const url=new URL(connectionString);
  const directory=process.env.PG_BIN??(process.platform==='win32'?join(homedir(),'.sm-tools','pgsql','bin'):'/usr/lib/postgresql/17/bin');
  const env={...process.env,PGHOST:url.hostname,PGPORT:url.port||'5432',PGUSER:decodeURIComponent(url.username),PGPASSWORD:decodeURIComponent(url.password),PGDATABASE:database??url.pathname.slice(1)};
  const child=spawn(join(directory,command+(process.platform==='win32'?'.exe':'')),args,{env,windowsHide:true,stdio:['ignore','ignore','pipe']});
  let output='';child.stderr.on('data',chunk=>{output+=chunk;});
  const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',resolve);});
  if(code!==0){
    for(const secret of [connectionString,url.password,decodeURIComponent(url.password)])if(secret)output=output.replaceAll(secret,'[REDACTED]');
    throw Error(`${command} exit ${code}: ${output}`);
  }
}
