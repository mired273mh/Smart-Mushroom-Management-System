import { Router } from 'express';
import { z } from 'zod';
import { admin, publicUserColumns } from './auth.js';
import { transaction } from './db.js';
import { hashPassword } from './security.js';
import { email, name, password, idParam, limitParam } from './validation.js';
import { fail, notFound } from './errors.js';

export function usersRouter(pool) {
  const router = Router();
  router.use(admin);
  router.get('/', async (req, res) => {
    const result = await pool.query(`SELECT ${publicUserColumns},deleted_at FROM users ORDER BY created_at DESC LIMIT $1`, [limitParam(req)]);
    res.json({ data: result.rows });
  });
  router.post('/', async (req, res) => {
    const input = z.object({ email, name, password, role: z.enum(['admin','operator','customer']) }).strict().parse(req.body);
    const result = await pool.query(`INSERT INTO users(email,name,password_hash,role) VALUES ($1,$2,$3,$4) RETURNING ${publicUserColumns}`, [input.email,input.name,await hashPassword(input.password),input.role]);
    res.status(201).json({ data: result.rows[0] });
  });
  async function updateUser(id, input, deleting = false) {
    return transaction(pool, async db => {
      await db.query('SELECT pg_advisory_xact_lock(56051106)');
      const current = (await db.query('SELECT * FROM users WHERE id=$1 AND deleted_at IS NULL FOR UPDATE', [id])).rows[0];
      if (!current) return notFound();
      if (current.role === 'admin' && current.active && (deleting || input.active === false || (input.role && input.role !== 'admin'))) {
        const admins = await db.query("SELECT 1 FROM users WHERE role='admin' AND active AND deleted_at IS NULL AND id<>$1", [id]);
        if (!admins.rowCount) return fail(409, 'LAST_ADMIN', 'Không được loại bỏ quản trị viên cuối cùng.');
      }
      if (input.role && input.role !== current.role) {
        const rented = await db.query("SELECT 1 FROM rentals WHERE customer_id=$1 AND status='active'", [id]);
        if (rented.rowCount) return fail(409, 'ACTIVE_RENTALS', 'Khách còn hợp đồng đang hoạt động.');
      }
      const merged = { ...current, ...input };
      const hash = input.password ? await hashPassword(input.password) : current.password_hash;
      const result = await db.query(`UPDATE users SET name=$2,role=$3,active=$4,password_hash=$5,deleted_at=CASE WHEN $6 THEN now() ELSE deleted_at END
        WHERE id=$1 RETURNING ${publicUserColumns},deleted_at`, [id,merged.name,merged.role,deleting ? false : merged.active,hash,deleting]);
      if (input.password || input.role || input.active === false || deleting) await db.query('DELETE FROM sessions WHERE user_id=$1', [id]);
      return result.rows[0];
    });
  }
  router.patch('/:id', async (req, res) => {
    const input = z.object({ name: name.optional(), role: z.enum(['admin','operator','customer']).optional(), active: z.boolean().optional(), password: password.optional() }).strict().refine(v => Object.keys(v).length > 0).parse(req.body);
    res.json({ data: await updateUser(idParam(req), input) });
  });
  router.delete('/:id', async (req, res) => {
    await updateUser(idParam(req), {}, true);
    res.status(204).end();
  });
  return router;
}
