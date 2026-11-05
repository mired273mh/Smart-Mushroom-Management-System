import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createPool } from '../src/db.js';

// Fresh roles on the isolated test database only, never change a user's login.
export async function restrictedRoles(ownerPool) {
  const url=new URL(ownerPool.options.connectionString),database=url.pathname.slice(1);
  if(!/^sm_test_[a-z0-9_]+$/.test(database))throw Error('Roles fixture requires sm_test_* database');
  const suffix=randomBytes(6).toString('hex');
  const names={runtime_role:'sm_test_app_'+suffix,report_role:'sm_test_report_'+suffix,db_name:database};
  const pools=[],created=[];
  const close=async()=>{
    await Promise.all(pools.map(p=>p.end()));
    for(const role of created){
      // Remove only this fixture's explicit privileges; it owns no data objects.
      await ownerPool.query(`REVOKE ALL ON ALL TABLES IN SCHEMA public FROM "${role}"`);
      await ownerPool.query(`REVOKE UPDATE(status,completed_at) ON public.rentals FROM "${role}"`);
      await ownerPool.query(`REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM "${role}"`);
      await ownerPool.query(`REVOKE ALL ON SCHEMA public FROM "${role}"`);
      await ownerPool.query(`REVOKE ALL ON DATABASE "${database}" FROM "${role}"`);
      await ownerPool.query(`DROP ROLE "${role}"`);
    }
  };
  try{
    for(const kind of ['runtime_role','report_role']){
      const password=randomBytes(24).toString('hex'),role=names[kind];
      await ownerPool.query(`CREATE ROLE "${role}" LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD '${password}'`);
      created.push(role);
      const login=new URL(url);login.username=role;login.password=password;
      pools.push(createPool(login.href));
    }
    let sql=await readFile(new URL('../../deploy/database/grants.sql',import.meta.url),'utf8');
    sql=sql.replace(/:"(runtime_role|report_role|db_name)"/g,(_,key)=>'"'+names[key]+'"')
      .replace(/:'(runtime_role|report_role)'/g,(_,key)=>"'"+names[key]+"'");
    // query(BEGIN...COMMIT) is one connection; failed scripts are rolled back.
    const db=await ownerPool.connect();
    try{await db.query(sql);}catch(e){await db.query('ROLLBACK');throw e;}finally{db.release();}
    return {runtime:pools[0],report:pools[1],names,close};
  }catch(e){await close();throw e;}
}
