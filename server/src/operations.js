import { Router } from 'express';
import { z } from 'zod';
import { admin, roles, staff } from './auth.js';
import { transaction } from './db.js';
import { accessibleItem } from './rentals.js';
import { idParam, limitParam, isoDate, stages, uuid } from './validation.js';
import { fail, notFound } from './errors.js';

export async function notify(db, userId, kind, message, itemId = null) {
  await db.query('INSERT INTO notifications(user_id,kind,message,rental_item_id) VALUES ($1,$2,$3,$4)', [userId,kind,message,itemId]);
}

export function operationsRouter(pool) {
  const router = Router();
  router.post('/rental-items/:id/progress', staff, async (req, res) => {
    const id = idParam(req);
    const input = z.object({ stage: z.enum(stages), note: z.string().trim().max(2000).default(''), expected_harvest_at: isoDate.nullable().optional() }).strict().parse(req.body);
    const result = await transaction(pool, async db => {
      const item = await accessibleItem(db, id, req.user, { active: true, lock: true });
      const next = stages.indexOf(input.stage), current = stages.indexOf(item.stage);
      if (next < current || next > current + 1 || input.stage === 'harvested') return fail(409, 'INVALID_STAGE', 'Cần cập nhật đúng thứ tự; thu hoạch qua chức năng ghi thu hoạch.');
      await db.query('UPDATE rental_items SET stage=$2,expected_harvest_at=$3 WHERE id=$1', [id,input.stage,input.expected_harvest_at === undefined ? item.expected_harvest_at : input.expected_harvest_at]);
      const event = (await db.query('INSERT INTO growth_events(rental_item_id,stage,note,created_by) VALUES ($1,$2,$3,$4) RETURNING *', [id,input.stage,input.note,req.user.id])).rows[0];
      await notify(db, item.customer_id, 'growth', `Khay ${item.code}: ${input.stage}. ${input.note}`, id);
      return event;
    });
    res.status(201).json({ data: result });
  });
  router.post('/rental-items/:id/harvests', staff, async (req, res) => {
    const id = idParam(req);
    const input = z.object({ weight_grams: z.number().int().min(1).max(100_000_000), note: z.string().trim().max(2000).default('') }).strict().parse(req.body);
    const result = await transaction(pool, async db => {
      const item = await accessibleItem(db, id, req.user, { active: true, lock: true });
      if (item.stage !== 'ready') return fail(409, 'NOT_READY', 'Khay cần ở giai đoạn sẵn sàng thu hoạch.');
      const harvest = (await db.query('INSERT INTO harvests(rental_item_id,weight_grams,note,created_by) VALUES ($1,$2,$3,$4) RETURNING *', [id,input.weight_grams,input.note,req.user.id])).rows[0];
      await db.query("UPDATE rental_items SET stage='harvested' WHERE id=$1", [id]);
      await db.query("INSERT INTO growth_events(rental_item_id,stage,note,created_by) VALUES ($1,'harvested',$2,$3)", [id,input.note,req.user.id]);
      await notify(db, item.customer_id, 'harvest', `Khay ${item.code} đã thu hoạch ${input.weight_grams} g, có thể yêu cầu nhận/giao.`, id);
      return harvest;
    });
    res.status(201).json({ data: result });
  });
  router.get('/harvests', async (req, res) => {
    const result = await pool.query(`SELECT h.*,t.code,n.customer_id,f.id AS fulfillment_id,f.status AS fulfillment_status FROM harvests h
      JOIN rental_items i ON i.id=h.rental_item_id JOIN trays t ON t.id=i.tray_id JOIN rentals n ON n.id=i.rental_id
      LEFT JOIN fulfillment_requests f ON f.harvest_id=h.id WHERE ($1 <> 'customer' OR n.customer_id=$2)
      ORDER BY h.harvested_at DESC LIMIT $3`, [req.user.role,req.user.id,limitParam(req)]);
    res.json({ data: result.rows });
  });
  router.post('/fulfillment-requests', roles('customer'), async (req, res) => {
    const input = z.object({ harvest_id: uuid, method: z.enum(['pickup','delivery']), address: z.string().trim().max(1000).optional() }).strict()
      .refine(v => v.method !== 'delivery' || !!v.address, { message: 'Giao hàng cần địa chỉ.', path: ['address'] }).parse(req.body);
    const result = await transaction(pool, async db => {
      const harvest = (await db.query(`SELECT h.id,n.id AS rental_id FROM harvests h JOIN rental_items i ON i.id=h.rental_item_id JOIN rentals n ON n.id=i.rental_id
        WHERE h.id=$1 AND n.customer_id=$2 AND n.status='active' FOR UPDATE OF n`, [input.harvest_id,req.user.id])).rows[0];
      if (!harvest) return notFound();
      // One request per harvest; cancelled requests may be submitted again through PATCH.
      return (await db.query('INSERT INTO fulfillment_requests(harvest_id,customer_id,method,address) VALUES ($1,$2,$3,$4) RETURNING *', [harvest.id,req.user.id,input.method,input.address ?? null])).rows[0];
    });
    res.status(201).json({ data: result });
  });
  router.get('/fulfillment-requests', async (req, res) => {
    const result = await pool.query(`SELECT f.*,h.weight_grams,t.code FROM fulfillment_requests f JOIN harvests h ON h.id=f.harvest_id
      JOIN rental_items i ON i.id=h.rental_item_id JOIN trays t ON t.id=i.tray_id
      WHERE ($1 <> 'customer' OR f.customer_id=$2) ORDER BY f.created_at DESC LIMIT $3`, [req.user.role,req.user.id,limitParam(req)]);
    res.json({ data: result.rows });
  });
  router.patch('/fulfillment-requests/:id', async (req, res) => {
    const id = idParam(req);
    const input = z.object({ status: z.enum(['processing','completed','cancelled','requested']) }).strict().parse(req.body);
    const result = await transaction(pool, async db => {
      const row = (await db.query("SELECT * FROM fulfillment_requests WHERE id=$1 AND ($2 <> 'customer' OR customer_id=$3) FOR UPDATE", [id,req.user.role,req.user.id])).rows[0];
      if (!row) return notFound();
      const customerAction = req.user.role === 'customer';
      const transitions = customerAction ? { requested: ['cancelled'], cancelled: ['requested'] } : { requested: ['processing'], processing: ['completed'] };
      if (!transitions[row.status]?.includes(input.status)) return fail(409, 'INVALID_TRANSITION', 'Không thể chuyển trạng thái yêu cầu như vậy.');
      return (await db.query('UPDATE fulfillment_requests SET status=$2 WHERE id=$1 RETURNING *', [id,input.status])).rows[0];
    });
    res.json({ data: result });
  });
  router.post('/transactions/:id/confirm', staff, async (req, res) => {
    const id=idParam(req);
    try {
      const result=await transaction(pool,async db=>{
        await db.query('CALL public.sp_confirm_rental_payment($1,$2)',[id,req.user.id]);
        return (await db.query('SELECT * FROM transactions WHERE id=$1',[id])).rows[0];
      });
      res.json({data:result});
    } catch(error) {
      if(error.code==='P1001')return fail(409,'TRANSACTION_NOT_PENDING','Không có giao dịch đang chờ xác nhận.');
      throw error;
    }
  });
  router.get('/notifications', async (req, res) => {
    const result = await pool.query('SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT $2', [req.user.id,limitParam(req)]);
    res.json({ data: result.rows });
  });
  router.patch('/notifications/:id/read', async (req, res) => {
    const result = await pool.query('UPDATE notifications SET read_at=coalesce(read_at,now()) WHERE id=$1 AND user_id=$2 RETURNING *', [idParam(req),req.user.id]);
    if (!result.rowCount) return notFound();
    res.json({ data: result.rows[0] });
  });
  router.get('/dashboard', staff, async (req, res) => {
    const result = await pool.query(`SELECT (SELECT count(*)::int FROM rooms WHERE active) AS active_rooms,
      (SELECT count(*)::int FROM trays WHERE status <> 'retired') AS total_trays,
      (SELECT count(*)::int FROM rental_items WHERE ended_at IS NULL) AS rented_trays,
      (SELECT count(*)::int FROM rentals WHERE status='active') AS active_rentals,
      (SELECT coalesce(sum(weight_grams),0)::bigint FROM harvests) AS harvested_grams,
      (SELECT coalesce(sum(amount_vnd),0)::bigint FROM transactions WHERE status='paid') AS received_vnd,
      (SELECT count(*)::int FROM fulfillment_requests WHERE status IN ('requested','processing')) AS pending_fulfillments`);
    res.json({ data: result.rows[0] });
  });
  router.get('/reports', admin, async (req, res) => {
    const rooms = await pool.query('SELECT * FROM public.v_room_cultivation_summary ORDER BY name LIMIT $1', [limitParam(req)]);
    const environment = await pool.query('SELECT * FROM public.v_room_environment_24h ORDER BY name LIMIT $1', [limitParam(req)]);
    res.json({ data: { rooms: rooms.rows, environment_last_24h: environment.rows } });
  });
  router.get('/reports/export', admin, async (req, res) => {
    const type = z.enum(['rentals','harvests','environment']).default('rentals').parse(req.query.type);
    const queries = {
      rentals: `SELECT n.id,u.name AS customer,n.status,n.price_per_tray_vnd,n.duration_days,n.starts_at,n.expected_end_at FROM rentals n JOIN users u ON u.id=n.customer_id ORDER BY n.starts_at DESC LIMIT 10000`,
      harvests: `SELECT h.id,t.code,h.weight_grams,h.harvested_at,h.note FROM harvests h JOIN rental_items i ON i.id=h.rental_item_id JOIN trays t ON t.id=i.tray_id ORDER BY h.harvested_at DESC LIMIT 10000`,
      environment: `SELECT s.recorded_at,r.name AS room,d.name AS device,s.temperature,s.humidity,s.co2,s.simulated FROM sensor_readings s JOIN devices d ON d.id=s.device_id JOIN rooms r ON r.id=d.room_id ORDER BY s.recorded_at DESC LIMIT 10000`,
    };
    const result = await pool.query(queries[type]);
    const columns = result.fields.map(f => f.name);
    const cell = value => {
      let text = value instanceof Date ? value.toISOString() : String(value ?? '');
      if (/^[\s]*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
      return '"' + text.replaceAll('"','""') + '"';
    };
    const csv = [columns, ...result.rows.map(row => columns.map(c => row[c]))].map(row => row.map(cell).join(',')).join('\r\n');
    res.set('Content-Disposition', `attachment; filename="${type}.csv"`).type('text/csv').send('\uFEFF' + csv);
  });
  return router;
}
