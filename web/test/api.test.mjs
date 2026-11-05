import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApi } from '../src/api.js';

test('HTML gateway error is readable and does not expose a JSON parser exception', async () => {
  const previous=globalThis.fetch;
  try {
    globalThis.fetch=async () => new Response('<html>gateway failure</html>',{status:502});
    await assert.rejects(createApi()('/rooms'),/HTTP 502/);
  } finally { globalThis.fetch=previous; }
});
test('401 callback receives the issuing token even when the response body is not JSON', async () => {
  const previous=globalThis.fetch, expired=[];
  try {
    globalThis.fetch=async () => new Response('Not JSON',{status:401});
    await assert.rejects(createApi('old-session',token=>expired.push(token))('/rooms'),/HTTP 401/);
    assert.deepEqual(expired,['old-session']);
  } finally { globalThis.fetch=previous; }
});

test('assignment lookups follow independent catalog cursors and directory pages',async()=>{
  const previous=globalThis.fetch,paths=[];
  const response=data=>new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json'}});
  try{
    globalThis.fetch=async path=>{
      const url=new URL(path,'https://test.invalid');paths.push(url);
      if(url.pathname==='/api/customers')return response(url.searchParams.has('cursor')?{data:[{id:'c2'}],pagination:{next_cursor:null}}:{data:[{id:'c1'}],pagination:{next_cursor:'next'}});
      if(url.searchParams.has('plan_cursor'))return response({data:{plans:[{id:'p2'}],trays:[],pagination:{plans:{next_cursor:null}}}});
      if(url.searchParams.has('tray_cursor'))return response({data:{plans:[],trays:[{id:'t2'}],pagination:{trays:{next_cursor:null}}}});
      return response({data:{plans:[{id:'p1'}],trays:[{id:'t1'}],pagination:{plans:{next_cursor:'plans-next'},trays:{next_cursor:'trays-next'}}}});
    };
    const api=createApi();assert.deepEqual(await api.all('/customers'),[{id:'c1'},{id:'c2'}]);
    assert.deepEqual(await api.catalog(),{plans:[{id:'p1'},{id:'p2'}],trays:[{id:'t1'},{id:'t2'}]});
    assert.ok(paths.every(url=>url.searchParams.get('limit')==='200'));
  }finally{globalThis.fetch=previous;}
});

test('lookup rejects a repeating cursor and never treats a failed page as a complete list',async()=>{
  const previous=globalThis.fetch;
  try{
    globalThis.fetch=async()=>new Response(JSON.stringify({data:[{id:'c1'}],pagination:{next_cursor:'loop'}}),{headers:{'Content-Type':'application/json'}});
    await assert.rejects(createApi().all('/customers'),/bị lặp/);
    let calls=0;
    globalThis.fetch=async()=>++calls===1?new Response(JSON.stringify({data:[],pagination:{next_cursor:'next'}}),{headers:{'Content-Type':'application/json'}}):new Response('gateway',{status:502});
    await assert.rejects(createApi().all('/rooms'),/HTTP 502/);
  }finally{globalThis.fetch=previous;}
});
