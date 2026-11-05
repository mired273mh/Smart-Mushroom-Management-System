import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { setup } from './helpers.js';
import { seedRentalHistory } from './history-fixtures.js';
let ctx, admin, alice, bob, fixtures;
before(async () => {
  ctx = await setup();
  [admin,alice,bob] = await Promise.all(['admin','customer','customer'].map(ctx.user));
  fixtures = await seedRentalHistory(ctx.pool,{ customerId:alice.id,actorId:admin.id });
  await seedRentalHistory(ctx.pool,{ customerId:bob.id,actorId:admin.id,count:7 });
});
after(async () => { await ctx?.close(); });

test('cursor visits >100 rentals exactly once with ties and microsecond timestamps', async () => {
  const expected = (await ctx.pool.query('SELECT id FROM rentals WHERE customer_id=$1 ORDER BY starts_at DESC,id DESC',[alice.id])).rows.map(r => r.id);
  const first = await ctx.request('/api/rentals',{token:alice.token});
  assert.equal(first.status,200);
  assert.equal(first.body.data.length,100);
  assert.equal(first.body.pagination.has_more,true);
  assert.equal(first.body.data[0].cursor_started_at,undefined);
  const actual = first.body.data.map(r => r.id);
  let cursor = first.body.pagination.next_cursor;
  while (cursor) {
    const result = await ctx.request('/api/rentals?limit=31&cursor='+encodeURIComponent(cursor),{token:alice.token});
    assert.equal(result.status,200,JSON.stringify(result.body));
    assert.ok(result.body.data.every(r => r.customer_id === alice.id));
    actual.push(...result.body.data.map(r => r.id));
    cursor = result.body.pagination.next_cursor;
    if (actual.length > 207) assert.fail('Repeated cursor/page');
  }
  assert.equal(actual.length,207);
  assert.equal(new Set(actual).size,207);
  assert.deepEqual(actual,expected);
});
test('status/customer filters retain ownership and cannot reuse a mismatched cursor', async () => {
  const first = await ctx.request('/api/rentals?limit=10&status=completed',{token:alice.token});
  assert.ok(first.body.data.every(r => r.status==='completed' && r.customer_id===alice.id));
  const cursor = first.body.pagination.next_cursor;
  assert.equal((await ctx.request('/api/rentals?status=active&cursor='+cursor,{token:alice.token})).status,422);
  assert.equal((await ctx.request('/api/rentals?status=completed&cursor='+cursor,{token:bob.token})).status,422);
  assert.equal((await ctx.request('/api/rentals?customer_id='+bob.id,{token:alice.token})).status,403);
  const selected = await ctx.request('/api/rentals?limit=200&customer_id='+bob.id,{token:admin.token});
  assert.equal(selected.body.data.length,7);
  assert.ok(selected.body.data.every(r => r.customer_id===bob.id));
  assert.equal(selected.body.pagination.has_more,false);
  assert.equal(selected.body.pagination.next_cursor,null);
  const owned = await ctx.request('/api/rentals?limit=200&status=completed',{token:bob.token});
  assert.equal(owned.body.data.length,3);
});
test('cursor validation rejects malformed input while a forged position cannot change ownership', async () => {
  for (const query of ['limit=0','limit=201','limit=-1','limit=1.5','limit=1&limit=2','status=unknown','cursor=bad!','unexpected=value']) {
    assert.equal((await ctx.request('/api/rentals?'+query,{token:alice.token})).status,422,query);
  }
  const cursor = Buffer.from(JSON.stringify({v:1,starts_at:'2027-01-01T00:00:00Z',id:fixtures[0].id,viewer:alice.id,status:null,customer_id:null})).toString('base64url');
  const result = await ctx.request('/api/rentals?cursor='+cursor,{token:alice.token});
  assert.equal(result.status,200);
  assert.ok(result.body.data.every(r => r.customer_id===alice.id));
  assert.equal((await ctx.request('/api/rentals?limit=200&status=completed&customer_id='+alice.id,{token:admin.token})).body.data.length,103);
});
