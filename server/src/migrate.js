import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { transaction } from './db.js';

export async function migrate(pool) {
  return transaction(pool, async db => {
    await db.query('SELECT pg_advisory_xact_lock(56051105)');
    await db.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      filename text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now()
    )`);
    const directory = new URL('../migrations/', import.meta.url);
    const files = (await readdir(directory)).filter(f => /^\d+_[a-z_]+\.sql$/.test(f)).sort();
    for (const filename of files) {
      const sql = await readFile(new URL(filename, directory), 'utf8');
      const checksum = createHash('sha256').update(sql).digest('hex');
      const existing = await db.query('SELECT checksum FROM schema_migrations WHERE filename=$1', [filename]);
      if (existing.rowCount) {
        if (existing.rows[0].checksum !== checksum) throw new Error(`Migration changed after application: ${filename}`);
        continue;
      }
      await db.query(sql);
      await db.query('INSERT INTO schema_migrations(filename,checksum) VALUES ($1,$2)', [filename, checksum]);
    }
    return files.length;
  });
}
