import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { email, name, password } from './validation.js';
import { hashPassword, verifyPassword, newToken, tokenHash } from './security.js';
import { fail } from './errors.js';

export const publicUserColumns = 'id,email,name,role,active,created_at';
export function authenticate(pool) {
  return async (req, res, next) => {
    const match = /^Bearer ([a-f0-9]{64})$/.exec(req.headers.authorization ?? '');
    if (!match) return fail(401, 'UNAUTHENTICATED', 'Cần đăng nhập.');
    const result = await pool.query(`SELECT u.${publicUserColumns.split(',').join(',u.')} FROM sessions s JOIN users u ON u.id=s.user_id
      WHERE s.token_hash=$1 AND s.expires_at>now() AND u.active AND u.deleted_at IS NULL`, [tokenHash(match[1])]);
    if (!result.rowCount) return fail(401, 'UNAUTHENTICATED', 'Phiên hết hạn hoặc tài khoản bị khóa.');
    req.user = result.rows[0];
    req.sessionHash = tokenHash(match[1]);
    next();
  };
}
export const roles = (...allowed) => (req, res, next) => {
  if (!allowed.includes(req.user.role)) return fail(403, 'FORBIDDEN', 'Không có quyền thực hiện.');
  next();
};
export const staff = roles('admin', 'operator');
export const admin = roles('admin');

export function authRouter(pool) {
  const router = Router();
  const throttle = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false });
  router.post('/register', throttle, async (req, res) => {
    const input = z.object({ email, name, password }).strict().parse(req.body);
    const hash = await hashPassword(input.password);
    const result = await pool.query(`INSERT INTO users(email,name,password_hash,role) VALUES ($1,$2,$3,'customer') RETURNING ${publicUserColumns}`, [input.email, input.name, hash]);
    res.status(201).json({ data: result.rows[0] });
  });
  // Constant work for an unknown email avoids a trivial timing distinction.
  const dummyHash = hashPassword(newToken());
  router.post('/login', throttle, async (req, res) => {
    const input = z.object({ email, password: z.string().min(1).max(128) }).strict().parse(req.body);
    const result = await pool.query('SELECT * FROM users WHERE email=$1', [input.email]);
    const user = result.rows[0];
    const valid = await verifyPassword(input.password, user?.password_hash ?? await dummyHash);
    if (!valid || !user?.active || user.deleted_at) return fail(401, 'INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng.');
    const token = newToken();
    await pool.query(`INSERT INTO sessions(token_hash,user_id,expires_at) VALUES ($1,$2,now()+interval '12 hours')`, [tokenHash(token), user.id]);
    const { password_hash, deleted_at, ...publicUser } = user;
    res.json({ data: { token, expires_in: 43200, user: publicUser } });
  });
  router.use(authenticate(pool));
  router.post('/logout', async (req, res) => {
    await pool.query('DELETE FROM sessions WHERE token_hash=$1', [req.sessionHash]);
    res.status(204).end();
  });
  router.get('/me', (req, res) => res.json({ data: req.user }));
  router.patch('/me', async (req, res) => {
    const input = z.object({ name }).strict().parse(req.body);
    const result = await pool.query(`UPDATE users SET name=$1 WHERE id=$2 RETURNING ${publicUserColumns}`, [input.name, req.user.id]);
    res.json({ data: result.rows[0] });
  });
  return router;
}
