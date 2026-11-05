import { Router } from 'express';
import { z } from 'zod';
import { admin, staff } from './auth.js';
import { transaction } from './db.js';
import { fail, notFound } from './errors.js';
import { idParam, name, uuid } from './validation.js';
import { catalogInput,catalogPage } from './catalog-pagination.js';
import {directoryPage} from './directory-pagination.js';

// Defaults belong to creation only; applying Zod defaults inside partial PATCH
// schemas would overwrite omitted fields (e.g. reactivate a disabled room).
const roomInput = z.object({ name, description: z.string().trim().max(2000).optional(), active: z.boolean().optional() }).strict();
const planInput = z.object({ name, duration_days: z.number().int().min(1).max(365), price_vnd: z.number().int().min(0).max(1_000_000_000), active: z.boolean().optional() }).strict();
const trayInput = z.object({ room_id: uuid, code: z.string().trim().regex(/^[A-Z0-9][A-Z0-9_-]{2,39}$/), label: name, status: z.enum(['available','maintenance','retired']).optional() }).strict();
const someFields = schema => schema.partial().refine(v => Object.keys(v).length > 0, 'Cần ít nhất một trường.');

export function catalogRouter(pool) {
  const router = Router();
  router.get('/customers', staff, async (req, res) => {
    res.json(await directoryPage(pool,req,{kind:'customers',select:'id,name,email',from:'users',search:"name||' '||email",where:"role='customer' AND active AND deleted_at IS NULL"}));
  });
  router.get('/catalog', async (req, res) => {
    const input=catalogInput(req),{query,after,limit}=input;
    const plans = await pool.query(`SELECT * FROM rental_plans WHERE active AND strpos(lower(name),lower($1))>0
      AND ($2::int IS NULL OR (price_vnd,id)>($2::int,$3::uuid)) ORDER BY price_vnd,id LIMIT $4`,
    [query.plan_q,after.plans?.price_vnd??null,after.plans?.id??null,limit+1]);
    const trays = await pool.query(`SELECT t.id,t.code,t.label,t.room_id,r.name AS room_name FROM trays t JOIN rooms r ON r.id=t.room_id
      WHERE t.status='available' AND r.active AND NOT EXISTS (SELECT 1 FROM rental_items i WHERE i.tray_id=t.id AND i.ended_at IS NULL)
      AND ($1::uuid IS NULL OR t.room_id=$1) AND strpos(lower(t.code||' '||t.label||' '||r.name),lower($2))>0
      AND ($3::text IS NULL OR t.code>$3) ORDER BY t.code LIMIT $4`, [query.room_id??null,query.tray_q,after.trays?.code??null,limit+1]);
    const p=catalogPage(plans.rows,input,'plans'),t=catalogPage(trays.rows,input,'trays');
    res.json({ data: { plans:p.rows,trays:t.rows,pagination:{plans:p.pagination,trays:t.pagination} } });
  });
  router.get('/rooms', staff, async (req, res) => {
    res.json(await directoryPage(pool,req,{kind:'rooms',select:`r.id,r.name,r.description,r.active,r.created_at,
      (SELECT count(*)::int FROM trays t WHERE t.room_id=r.id) AS tray_count`,from:'rooms r',id:'r.id',order:'r.name',search:"r.name||' '||r.description"}));
  });
  router.post('/rooms', staff, async (req, res) => {
    const input = roomInput.parse(req.body);
    const result = await pool.query('INSERT INTO rooms(name,description,active) VALUES ($1,$2,$3) RETURNING id,name,description,active,created_at', [input.name,input.description ?? '',input.active ?? true]);
    res.status(201).json({ data: result.rows[0] });
  });
  router.patch('/rooms/:id', staff, async (req, res) => {
    const id = idParam(req);
    const input = someFields(roomInput).parse(req.body);
    const room = await transaction(pool, async db => {
      const current = (await db.query('SELECT * FROM rooms WHERE id=$1 FOR UPDATE', [id])).rows[0];
      if (!current) return notFound();
      if (input.active === false) {
        const busy = await db.query('SELECT 1 FROM rental_items i JOIN trays t ON t.id=i.tray_id WHERE t.room_id=$1 AND i.ended_at IS NULL', [id]);
        if (busy.rowCount) return fail(409, 'ROOM_IN_USE', 'Phòng còn khay đang thuê.');
      }
      const merged = { ...current, ...input };
      return (await db.query('UPDATE rooms SET name=$2,description=$3,active=$4 WHERE id=$1 RETURNING id,name,description,active,created_at', [id,merged.name,merged.description,merged.active])).rows[0];
    });
    res.json({ data: room });
  });
  router.delete('/rooms/:id', staff, async (req, res) => {
    const result = await pool.query('DELETE FROM rooms WHERE id=$1 RETURNING id', [idParam(req)]);
    if (!result.rowCount) return notFound();
    res.status(204).end();
  });
  router.get('/plans', async (req, res) => {
    res.json(await directoryPage(pool,req,{kind:'plans',select:'*',from:'rental_plans',where:"($1 <> 'customer' OR active)",values:[req.user.role]}));
  });
  router.post('/plans', admin, async (req, res) => {
    const input = planInput.parse(req.body);
    const result = await pool.query('INSERT INTO rental_plans(name,duration_days,price_vnd,active) VALUES ($1,$2,$3,$4) RETURNING *', [input.name,input.duration_days,input.price_vnd,input.active ?? true]);
    res.status(201).json({ data: result.rows[0] });
  });
  router.patch('/plans/:id', admin, async (req, res) => {
    const id = idParam(req);
    const input = someFields(planInput).parse(req.body);
    const updated = await transaction(pool, async db => {
      const current = (await db.query('SELECT * FROM rental_plans WHERE id=$1 FOR UPDATE', [id])).rows[0];
      if (!current) return notFound();
      const merged = { ...current, ...input };
      return (await db.query('UPDATE rental_plans SET name=$2,duration_days=$3,price_vnd=$4,active=$5 WHERE id=$1 RETURNING *', [id,merged.name,merged.duration_days,merged.price_vnd,merged.active])).rows[0];
    });
    res.json({ data: updated });
  });
  router.delete('/plans/:id', admin, async (req, res) => {
    const result = await pool.query('DELETE FROM rental_plans WHERE id=$1 RETURNING id', [idParam(req)]);
    if (!result.rowCount) return notFound();
    res.status(204).end();
  });
  router.get('/trays', staff, async (req, res) => {
    res.json(await directoryPage(pool,req,{kind:'trays',select:'t.*,r.name AS room_name,i.id AS active_rental_item_id,n.customer_id',
      from:'trays t JOIN rooms r ON r.id=t.room_id LEFT JOIN rental_items i ON i.tray_id=t.id AND i.ended_at IS NULL LEFT JOIN rentals n ON n.id=i.rental_id',
      id:'t.id',order:'t.code',search:"t.code||' '||t.label||' '||r.name"}));
  });
  router.post('/trays', staff, async (req, res) => {
    const input = trayInput.parse(req.body);
    const result = await pool.query('INSERT INTO trays(room_id,code,label,status) VALUES ($1,$2,$3,$4) RETURNING *', [input.room_id,input.code,input.label,input.status ?? 'available']);
    res.status(201).json({ data: result.rows[0] });
  });
  router.patch('/trays/:id', staff, async (req, res) => {
    const id = idParam(req);
    // Stable code: only the label, room and service status are editable.
    const input = someFields(trayInput.omit({ code: true })).parse(req.body);
    const result = await transaction(pool, async db => {
      const current = (await db.query('SELECT * FROM trays WHERE id=$1 FOR UPDATE', [id])).rows[0];
      if (!current) return notFound();
      const busy = await db.query('SELECT 1 FROM rental_items WHERE tray_id=$1 AND ended_at IS NULL', [id]);
      if (busy.rowCount && ((input.room_id && input.room_id !== current.room_id) || (input.status && input.status !== current.status))) return fail(409, 'TRAY_IN_USE', 'Không chuyển phòng/trạng thái phục vụ khay đang thuê.');
      const merged = { ...current, ...input };
      return (await db.query('UPDATE trays SET room_id=$2,label=$3,status=$4 WHERE id=$1 RETURNING *', [id,merged.room_id,merged.label,merged.status])).rows[0];
    });
    res.json({ data: result });
  });
  router.delete('/trays/:id', staff, async (req, res) => {
    const result = await pool.query('DELETE FROM trays WHERE id=$1 RETURNING id', [idParam(req)]);
    if (!result.rowCount) return notFound();
    res.status(204).end();
  });
  return router;
}
