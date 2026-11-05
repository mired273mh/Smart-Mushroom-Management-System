import { z } from 'zod';
import { readConfig } from './config.js';
import { createPool, transaction } from './db.js';
import { migrate } from './migrate.js';
import { hashPassword } from './security.js';
import { email, password, name } from './validation.js';
const pool = createPool(readConfig().DATABASE_URL);
try {
  if (process.argv[2] === 'migrate') {
    console.log(`Migrations verified: ${await migrate(pool)}`);
  } else if (process.argv[2] === 'admin') {
    const input = z.object({ ADMIN_EMAIL: email, ADMIN_PASSWORD: password, ADMIN_NAME: name }).parse(process.env);
    const hash = await hashPassword(input.ADMIN_PASSWORD);
    await transaction(pool, async db => {
      await db.query('SELECT pg_advisory_xact_lock(56051106)');
      if ((await db.query("SELECT 1 FROM users WHERE role='admin'")).rowCount) throw new Error('Admin already exists; use authenticated user management.');
      await db.query("INSERT INTO users(email,name,password_hash,role) VALUES ($1,$2,$3,'admin')", [input.ADMIN_EMAIL, input.ADMIN_NAME, hash]);
    });
    console.log('Administrator created. No credentials are logged.');
  } else { throw new Error('Usage: cli.js migrate|admin'); }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally { await pool.end(); }
