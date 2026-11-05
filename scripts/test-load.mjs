import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { mkdir, writeFile } from 'node:fs/promises';
import { setup } from '../server/test/helpers.js';
import { seedRentalHistory } from '../server/test/history-fixtures.js';

// Bounded local read benchmark, not a production capacity/soak test.
// setup() requires a NEW sm_test_* DB and never deletes existing data.
const ctx = await setup();
try {
  const admin = await ctx.user('admin');
  const customers = [];
  for (let i=0;i<20;i++) customers.push(await ctx.user('customer'));
  const roomId = (await ctx.pool.query("INSERT INTO rooms(name) VALUES ('Load test room') RETURNING id")).rows[0].id;
  const planId = (await ctx.pool.query("INSERT INTO rental_plans(name,duration_days,price_vnd) VALUES ('Load test plan',30,100000) RETURNING id")).rows[0].id;
  for (const customer of customers) await seedRentalHistory(ctx.pool,{customerId:customer.id,actorId:admin.id,count:20,roomId,planId});
  const deviceId = (await ctx.pool.query("INSERT INTO devices(room_id,name,token_hash) VALUES ($1,'Load simulator','noncredential-test-fixture') RETURNING id",[roomId])).rows[0].id;
  await ctx.pool.query(`INSERT INTO sensor_readings(device_id,temperature,humidity,co2,simulated,recorded_at)
    SELECT $1,24,80,900,true,now()-make_interval(secs=>n) FROM generate_series(1,1000) n`,[deviceId]);
  const routes = ['/rentals?limit=20',`/rooms/${roomId}/environment?limit=100`];
  const samples = routes.map(()=>[]);
  const read = async (customer,routeIndex,measure) => {
    const start=performance.now();
    const response=await ctx.request('/api'+routes[routeIndex],{token:customer.token});
    const elapsed=performance.now()-start;
    assert.equal(response.status,200);
    if (routeIndex===0) {
      assert.equal(response.body.data.length,20);
      assert.ok(response.body.data.every(r=>r.customer_id===customer.id));
    } else assert.equal(response.body.data.readings.length,100);
    if (measure) samples[routeIndex].push(elapsed);
  };
  for (const routeIndex of [0,1]) await Promise.all(customers.map(c=>read(c,routeIndex,false)));
  const started=performance.now();
  for (let round=0;round<5;round++) {
    // 20 distinct sessions, one in-flight request each, alternating read endpoints.
    await Promise.all(customers.map(async c=>{ for (const i of [0,1]) await read(c,i,true); }));
  }
  const elapsedMs=performance.now()-started;
  const results=samples.map((values,i)=>{
    values.sort((a,b)=>a-b);
    return {route:routes[i],count:values.length,p50_ms:+values[49].toFixed(2),p95_ms:+values[94].toFixed(2),max_ms:+values.at(-1).toFixed(2)};
  });
  const report={at:new Date().toISOString(),node:process.version,platform:process.platform,users:20,rentals:400,readings:1000,requests:200,errors:0,elapsed_ms:+elapsedMs.toFixed(2),results,scope:'Loopback HTTP + PostgreSQL; authenticated reads only; excludes login timing, TLS, mobile network and production capacity.'};
  await mkdir(new URL('../.local/',import.meta.url),{recursive:true});
  await writeFile(new URL('../.local/review-load.json',import.meta.url),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
  assert.ok(results.every(r=>r.p95_ms<1000),'Proposed local p95 <1000ms target exceeded');
  console.log('PASS: bounded local p95 target; not production acceptance. Test database retained.');
} finally { await ctx.close(); }
