import assert from 'node:assert/strict';

// Run after Compose has initialized an isolated CI database and bootstrap admin.
const base='http://127.0.0.1:8080';
assert.ok(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD,'CI bootstrap credentials required via environment');
const ready=await fetch(base+'/ready');
assert.equal(ready.status,200);
assert.equal((await ready.json()).data.status,'ready');
const web=await fetch(base);
assert.equal(web.status,200);
assert.ok(web.headers.get('content-security-policy')?.includes("frame-ancestors 'none'"));
const html=await web.text();
const entry=html.match(/src="(\/assets\/[^"\s]+\.js)"/)?.[1];
assert.ok(entry,'Built React entry script must be served by Nginx');
assert.equal((await fetch(base+entry)).status,200);
assert.equal((await fetch(base+'/api/rooms')).status,401);
const login=await fetch(base+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:process.env.ADMIN_EMAIL,password:process.env.ADMIN_PASSWORD})});
assert.equal(login.status,200);
const session=(await login.json()).data;
assert.equal(session.user.role,'admin');
const headers={Authorization:'Bearer '+session.token};
const rooms=await fetch(base+'/api/rooms',{headers});
assert.equal(rooms.status,200);
assert.ok(Array.isArray((await rooms.json()).data));
assert.equal((await fetch(base+'/api/auth/logout',{method:'POST',headers})).status,204);
assert.equal((await fetch(base+'/api/rooms',{headers})).status,401);
console.log('PASS: Docker Compose PostgreSQL/migration/API/Nginx/React assets, CSP, authenticated DB read and revoked session. No credentials logged.');
