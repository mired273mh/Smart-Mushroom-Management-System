import { Router } from 'express';
import { z } from 'zod';
import { staff, roles } from './auth.js';
import { transaction } from './db.js';
import { idParam, uuid } from './validation.js';
import { rentalPageInput, rentalPageResponse } from './rental-pagination.js';
import { fail, notFound } from './errors.js';

export async function accessibleRental(db, id, user) {
  const row = (await db.query("SELECT * FROM rentals WHERE id=$1 AND ($2 <> 'customer' OR customer_id=$3)", [id,user.role,user.id])).rows[0];
  if (!row) return notFound();
  return row;
}
export async function accessibleItem(db, id, user, { active = false, lock = false } = {}) {
  if (lock) {
    await db.query(`SELECT n.id FROM rentals n JOIN rental_items i ON i.rental_id=n.id
      WHERE i.id=$1 AND ($2 <> 'customer' OR n.customer_id=$3) FOR UPDATE OF n`, [id,user.role,user.id]);
  }
  const row = (await db.query(`SELECT i.*,n.customer_id,n.starts_at,n.status AS rental_status,t.room_id,t.code,t.label
    FROM rental_items i JOIN rentals n ON n.id=i.rental_id JOIN trays t ON t.id=i.tray_id
    WHERE i.id=$1 AND ($2 <> 'customer' OR n.customer_id=$3) ${active ? 'AND i.ended_at IS NULL' : ''}
    ${lock ? 'FOR UPDATE OF i' : ''}`, [id,user.role,user.id])).rows[0];
  if (!row) return notFound();
  return row;
}

export function rentalsRouter(pool) {
  const router = Router();
  router.get('/rentals', async (req, res) => {
    const page = rentalPageInput(req);
    const result = await pool.query(`SELECT n.*,u.name AS customer_name,(SELECT count(*)::int FROM rental_items i WHERE i.rental_id=n.id) AS tray_count,
      to_char(n.starts_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS cursor_started_at
      FROM rentals n JOIN users u ON u.id=n.customer_id
      WHERE ($1 <> 'customer' OR n.customer_id=$2)
        AND ($3::text IS NULL OR n.status=$3)
        AND ($4::uuid IS NULL OR n.customer_id=$4)
        AND ($5::timestamptz IS NULL OR (n.starts_at,n.id)<($5::timestamptz,$6::uuid))
      ORDER BY n.starts_at DESC,n.id DESC LIMIT $7`, [req.user.role,req.user.id,page.status,page.customerId,page.cursor?.starts_at ?? null,page.cursor?.id ?? null,page.limit+1]);
    res.json(rentalPageResponse(result.rows, page, req.user));
  });
  router.post('/rentals', async (req, res) => {
    const input = z.object({ plan_id: uuid, tray_ids: z.array(uuid).min(1).max(20).refine(ids => new Set(ids).size === ids.length), customer_id: uuid.optional() }).strict().parse(req.body);
    if (req.user.role === 'customer' && input.customer_id) return fail(403, 'FORBIDDEN', 'Khách chỉ được thuê cho tài khoản của mình.');
    const customerId = req.user.role === 'customer' ? req.user.id : input.customer_id;
    if (!customerId) return fail(422, 'CUSTOMER_REQUIRED', 'Nhân viên cần chọn khách thuê.');
    const result = await transaction(pool, async db => {
      const customer = await db.query("SELECT id FROM users WHERE id=$1 AND role='customer' AND active AND deleted_at IS NULL FOR SHARE", [customerId]);
      if (!customer.rowCount) return fail(422, 'INVALID_CUSTOMER', 'Khách thuê không hợp lệ.');
      const plan = (await db.query('SELECT * FROM rental_plans WHERE id=$1 AND active FOR SHARE', [input.plan_id])).rows[0];
      if (!plan) return fail(422, 'INVALID_PLAN', 'Gói thuê không khả dụng.');
      const trays = await db.query(`SELECT t.id,t.status,r.active FROM trays t JOIN rooms r ON r.id=t.room_id
        WHERE t.id=ANY($1::uuid[]) ORDER BY t.id FOR UPDATE OF t FOR SHARE OF r`, [input.tray_ids]);
      if (trays.rowCount !== input.tray_ids.length || trays.rows.some(t => t.status !== 'available' || !t.active)) return fail(409, 'TRAY_UNAVAILABLE', 'Có khay không khả dụng.');
      const busy = await db.query('SELECT 1 FROM rental_items WHERE tray_id=ANY($1::uuid[]) AND ended_at IS NULL', [input.tray_ids]);
      if (busy.rowCount) return fail(409, 'TRAY_UNAVAILABLE', 'Có khay đã được thuê.');
      const rental = (await db.query(`INSERT INTO rentals(customer_id,plan_id,price_per_tray_vnd,duration_days,expected_end_at,created_by)
        VALUES ($1,$2,$3,$4::integer,now()+$4::integer*interval '1 day',$5) RETURNING *`, [customerId,plan.id,plan.price_vnd,plan.duration_days,req.user.id])).rows[0];
      const items = [];
      for (const trayId of [...input.tray_ids].sort()) {
        items.push((await db.query('INSERT INTO rental_items(rental_id,tray_id) VALUES ($1,$2) RETURNING *', [rental.id,trayId])).rows[0]);
      }
      await db.query('INSERT INTO transactions(rental_id,amount_vnd) VALUES ($1,$2)', [rental.id,plan.price_vnd * items.length]);
      await db.query("INSERT INTO notifications(user_id,kind,message) VALUES ($1,'rental',$2)", [customerId,`Đã xác nhận thuê ${items.length} khay.`]);
      return { ...rental, items };
    });
    res.status(201).json({ data: result });
  });
  router.get('/rentals/:id', async (req, res) => {
    const rental = await accessibleRental(pool, idParam(req), req.user);
    const items = await pool.query('SELECT i.*,t.code,t.label,t.room_id FROM rental_items i JOIN trays t ON t.id=i.tray_id WHERE i.rental_id=$1 ORDER BY t.code', [rental.id]);
    const ledger = await pool.query('SELECT * FROM transactions WHERE rental_id=$1 ORDER BY created_at', [rental.id]);
    res.json({ data: { ...rental, items: items.rows, transactions: ledger.rows } });
  });
  router.post('/rentals/:id/complete', staff, async (req, res) => {
    const id = idParam(req);
    const result = await transaction(pool, async db => {
      const current = (await db.query('SELECT * FROM rentals WHERE id=$1 FOR UPDATE', [id])).rows[0];
      if (!current) return notFound();
      if (current.status !== 'active') return fail(409, 'RENTAL_CLOSED', 'Hợp đồng đã đóng.');
      const unsettled = await db.query("SELECT 1 FROM transactions WHERE rental_id=$1 AND status='pending'", [id]);
      if (unsettled.rowCount) return fail(409, 'PAYMENT_PENDING', 'Cần xác nhận thu tiền thủ công trước khi đóng.');
      const delivery = await db.query(`SELECT 1 FROM harvests h JOIN rental_items i ON i.id=h.rental_item_id LEFT JOIN fulfillment_requests f ON f.harvest_id=h.id
        WHERE i.rental_id=$1 AND (f.id IS NULL OR f.status <> 'completed')`, [id]);
      if (delivery.rowCount) return fail(409, 'FULFILLMENT_PENDING', 'Còn yêu cầu nhận/giao đang xử lý.');
      await db.query('UPDATE rental_items SET ended_at=now() WHERE rental_id=$1 AND ended_at IS NULL', [id]);
      return (await db.query("UPDATE rentals SET status='completed',completed_at=now() WHERE id=$1 RETURNING *", [id])).rows[0];
    });
    res.json({ data: result });
  });
  router.post('/trays/link', roles('customer'), async (req, res) => {
    const input = z.object({ code: z.string().trim().min(3).max(40) }).strict().parse(req.body);
    const result = await pool.query(`UPDATE rental_items i SET linked_at=coalesce(i.linked_at,now()) FROM rentals n,trays t
      WHERE i.rental_id=n.id AND i.tray_id=t.id AND t.code=$1 AND n.customer_id=$2 AND i.ended_at IS NULL RETURNING i.*`, [input.code,req.user.id]);
    if (!result.rowCount) return notFound();
    res.json({ data: result.rows[0] });
  });
  router.get('/rental-items/:id', async (req, res) => {
    const item = await accessibleItem(pool, idParam(req), req.user);
    const events = await pool.query('SELECT * FROM growth_events WHERE rental_item_id=$1 ORDER BY created_at DESC LIMIT 200', [item.id]);
    const harvests = await pool.query('SELECT * FROM harvests WHERE rental_item_id=$1 ORDER BY harvested_at DESC LIMIT 200', [item.id]);
    res.json({ data: { ...item, events: events.rows, harvests: harvests.rows } });
  });
  return router;
}
