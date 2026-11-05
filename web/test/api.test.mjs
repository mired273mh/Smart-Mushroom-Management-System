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
