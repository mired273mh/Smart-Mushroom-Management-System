import { Router } from 'express';
import { z } from 'zod';
import { admin, staff } from './auth.js';
import { transaction } from './db.js';
import { idParam, limitParam, name, uuid } from './validation.js';
import { fail, notFound } from './errors.js';
import { newToken, tokenHash } from './security.js';

const thresholdInput = z.object({
  temperature_min: z.number().min(-40).max(85), temperature_max: z.number().min(-40).max(85),
  humidity_min: z.number().min(0).max(100), humidity_max: z.number().min(0).max(100),
  co2_max: z.number().int().min(0).max(40000), notifications_enabled: z.boolean(),
}).strict().refine(v => v.temperature_min < v.temperature_max && v.humidity_min < v.humidity_max);
const defaultThreshold = { temperature_min: 15, temperature_max: 30, humidity_min: 70, humidity_max: 95, co2_max: 1500, notifications_enabled: true };

async function roomAccess(db, id, user) {
  const room = (await db.query(`SELECT r.id,r.name FROM rooms r WHERE r.id=$1 AND ($2 <> 'customer' OR EXISTS (
    SELECT 1 FROM trays t JOIN rental_items i ON i.tray_id=t.id JOIN rentals n ON n.id=i.rental_id
    WHERE t.room_id=r.id AND i.ended_at IS NULL AND n.customer_id=$3))`, [id,user.role,user.id])).rows[0];
  if (!room) return notFound();
  return room;
}

export function deviceRouter(pool) {
  const router = Router();
  router.use(async (req, res, next) => {
    const match = /^Bearer ([a-f0-9]{64})$/.exec(req.headers.authorization ?? '');
    if (!match) return fail(401, 'INVALID_DEVICE_TOKEN', 'Cần token thiết bị.');
    const device = (await pool.query('SELECT d.* FROM devices d JOIN rooms r ON r.id=d.room_id WHERE d.token_hash=$1 AND d.active AND r.active', [tokenHash(match[1])])).rows[0];
    if (!device) return fail(401, 'INVALID_DEVICE_TOKEN', 'Token thiết bị không hợp lệ.');
    req.device = device;
    next();
  });
  router.post('/readings', async (req, res) => {
    const sample = z.object({ temperature: z.number().min(-40).max(85), humidity: z.number().min(0).max(100), co2: z.number().int().min(0).max(40000) }).strict().parse(req.body);
    const result = await transaction(pool, async db => {
      // Serialize per-room alert deduplication and automatic command generation.
      await db.query('SELECT id FROM rooms WHERE id=$1 FOR UPDATE', [req.device.room_id]);
      const currentDevice = (await db.query('SELECT * FROM devices WHERE id=$1 AND active', [req.device.id])).rows[0];
      if (!currentDevice) return fail(401, 'INVALID_DEVICE_TOKEN', 'Thiết bị đã bị khóa.');
      const reading = (await db.query(`INSERT INTO sensor_readings(device_id,temperature,humidity,co2,simulated)
        VALUES ($1,$2,$3,$4,$5) RETURNING *`, [currentDevice.id,sample.temperature,sample.humidity,sample.co2,currentDevice.mode === 'simulator'])).rows[0];
      await db.query('UPDATE devices SET last_seen_at=now() WHERE id=$1', [currentDevice.id]);
      const threshold = (await db.query('SELECT * FROM room_thresholds WHERE room_id=$1', [currentDevice.room_id])).rows[0] ?? defaultThreshold;
      const abnormal = sample.temperature < threshold.temperature_min || sample.temperature > threshold.temperature_max || sample.humidity < threshold.humidity_min || sample.humidity > threshold.humidity_max || sample.co2 > threshold.co2_max;
      if (abnormal && threshold.notifications_enabled) {
        await db.query(`INSERT INTO notifications(user_id,kind,message,reading_id)
          SELECT u.id,'environment',$1,$2 FROM users u WHERE u.active AND u.deleted_at IS NULL AND (
            u.role IN ('admin','operator') OR EXISTS (SELECT 1 FROM rentals n JOIN rental_items i ON i.rental_id=n.id JOIN trays t ON t.id=i.tray_id
              WHERE n.customer_id=u.id AND i.ended_at IS NULL AND t.room_id=$3))
          AND NOT EXISTS (SELECT 1 FROM notifications n JOIN sensor_readings s ON s.id=n.reading_id JOIN devices d ON d.id=s.device_id
            WHERE n.user_id=u.id AND n.kind='environment' AND d.room_id=$3 AND n.created_at>now()-interval '5 minutes')`,
        [`Phòng có môi trường vượt ngưỡng: ${sample.temperature} °C, ${sample.humidity} %RH, ${sample.co2} ppm${reading.simulated ? ' (mô phỏng)' : ''}.`,reading.id,currentDevice.room_id]);
      }
      if (currentDevice.automation_enabled) {
        const actuators = [
          ['mist', sample.humidity < threshold.humidity_min],
          ['fan', sample.co2 > threshold.co2_max || sample.temperature > threshold.temperature_max],
          ['heater', sample.temperature < threshold.temperature_min],
        ];
        for (const [actuator, enabled] of actuators) {
          const previous = (await db.query('SELECT enabled FROM device_commands WHERE device_id=$1 AND actuator=$2 AND source=\'automatic\' ORDER BY created_at DESC LIMIT 1', [currentDevice.id,actuator])).rows[0];
          if (previous && previous.enabled === enabled) continue;
          // Automation is observable dry-run only until hardware acceptance.
          await db.query(`INSERT INTO device_commands(device_id,actuator,enabled,duration_seconds,dry_run,status,source,created_by)
            SELECT $1,$2,$3,10,true,'dry_run','automatic',id FROM users WHERE role='admin' AND active AND deleted_at IS NULL ORDER BY created_at LIMIT 1`, [currentDevice.id,actuator,enabled]);
        }
      }
      return { ...reading, abnormal };
    });
    res.status(201).json({ data: result });
  });
  router.get('/me', (req, res) => res.json({ data: { id:req.device.id, room_id:req.device.room_id, name:req.device.name, mode:req.device.mode } }));
  router.get('/commands', async (req, res) => {
    await pool.query("UPDATE device_commands SET status='expired' WHERE device_id=$1 AND status IN ('pending','dry_run') AND expires_at<=now()", [req.device.id]);
    await pool.query('UPDATE devices SET last_seen_at=now() WHERE id=$1', [req.device.id]);
    const result = await pool.query(`SELECT id,actuator,enabled,duration_seconds,dry_run,expires_at,source FROM device_commands
      WHERE device_id=$1 AND expires_at>now() AND status='dry_run' AND $2='simulator' ORDER BY created_at LIMIT 20`, [req.device.id,req.device.mode]);
    res.json({ data: result.rows });
  });
  router.post('/commands/:id/ack', async (req, res) => {
    const input = z.object({ success: z.boolean(), result: z.string().trim().max(500) }).strict().parse(req.body);
    const result = await pool.query(`UPDATE device_commands SET status=$3,result=$4 WHERE id=$1 AND device_id=$2
      AND status='dry_run' AND dry_run AND expires_at>now() AND $5='simulator' RETURNING id,status,dry_run`, [idParam(req),req.device.id,input.success ? 'acknowledged' : 'failed',input.result,req.device.mode]);
    if (!result.rowCount) return notFound();
    res.json({ data: result.rows[0] });
  });
  return router;
}

export function monitoringRouter(pool) {
  const router = Router();
  const deviceColumns = 'id,room_id,name,mode,active,last_seen_at,created_at,automation_enabled';
  router.get('/devices', staff, async (req, res) => {
    const result = await pool.query(`SELECT ${deviceColumns},(last_seen_at>now()-interval '2 minutes') AS online FROM devices ORDER BY created_at DESC LIMIT $1`, [limitParam(req)]);
    res.json({ data: result.rows });
  });
  router.post('/devices', admin, async (req, res) => {
    const input = z.object({ room_id: uuid, name, mode: z.enum(['simulator','hardware']).default('simulator') }).strict().parse(req.body);
    const token = newToken();
    const result = await pool.query(`INSERT INTO devices(room_id,name,mode,token_hash) VALUES ($1,$2,$3,$4) RETURNING ${deviceColumns}`, [input.room_id,input.name,input.mode,tokenHash(token)]);
    res.status(201).json({ data: { ...result.rows[0], token } });
  });
  router.patch('/devices/:id', admin, async (req, res) => {
    const input = z.object({ name: name.optional(), active: z.boolean().optional(), automation_enabled: z.boolean().optional() }).strict().refine(v => Object.keys(v).length > 0).parse(req.body);
    const result = await pool.query(`UPDATE devices SET name=coalesce($2,name),active=coalesce($3,active),automation_enabled=coalesce($4,automation_enabled) WHERE id=$1 RETURNING ${deviceColumns}`, [idParam(req),input.name,input.active,input.automation_enabled]);
    if (!result.rowCount) return notFound();
    res.json({ data: result.rows[0] });
  });
  router.post('/devices/:id/rotate-token', admin, async (req, res) => {
    const token = newToken();
    const result = await pool.query(`UPDATE devices SET token_hash=$2 WHERE id=$1 RETURNING ${deviceColumns}`, [idParam(req),tokenHash(token)]);
    if (!result.rowCount) return notFound();
    res.json({ data: { ...result.rows[0], token } });
  });
  router.get('/devices/:id/commands', staff, async (req, res) => {
    const result = await pool.query('SELECT id,device_id,actuator,enabled,duration_seconds,dry_run,status,source,result,expires_at,created_at FROM device_commands WHERE device_id=$1 ORDER BY created_at DESC LIMIT $2', [idParam(req),limitParam(req)]);
    res.json({ data: result.rows });
  });
  router.post('/devices/:id/commands', staff, async (req, res) => {
    const input = z.object({ actuator: z.enum(['mist','fan','light','heater']), enabled: z.boolean(), duration_seconds: z.number().int().min(1).max(60).default(10), dry_run: z.boolean().default(true) }).strict().parse(req.body);
    if (!input.dry_run) return fail(409, 'HARDWARE_NOT_CONFIRMED', 'Chưa nghiệm thu phần cứng và giới hạn an toàn; chỉ cho phép dry-run.');
    const device = (await pool.query('SELECT id FROM devices WHERE id=$1 AND active', [idParam(req)])).rows[0];
    if (!device) return notFound();
    const result = await pool.query(`INSERT INTO device_commands(device_id,actuator,enabled,duration_seconds,dry_run,status,created_by)
      VALUES ($1,$2,$3,$4,true,'dry_run',$5) RETURNING *`, [device.id,input.actuator,input.enabled,input.duration_seconds,req.user.id]);
    res.status(201).json({ data: result.rows[0] });
  });
  router.get('/rooms/:id/environment', async (req, res) => {
    const id = idParam(req);
    const room = await roomAccess(pool, id, req.user);
    const since = req.user.role === 'customer' ? (await pool.query(`SELECT min(n.starts_at) AS since FROM rentals n JOIN rental_items i ON i.rental_id=n.id
      JOIN trays t ON t.id=i.tray_id WHERE t.room_id=$1 AND n.customer_id=$2 AND i.ended_at IS NULL`, [id,req.user.id])).rows[0].since : new Date(0);
    const result = await pool.query(`SELECT s.*,d.name AS device_name FROM sensor_readings s JOIN devices d ON d.id=s.device_id
      WHERE d.room_id=$1 AND s.recorded_at>=$2 ORDER BY s.recorded_at DESC LIMIT $3`, [id,since,limitParam(req,1000)]);
    res.json({ data: { room, measurement_scope: 'room', readings: result.rows } });
  });
  router.get('/rooms/:id/thresholds', staff, async (req, res) => {
    const id = idParam(req);
    await roomAccess(pool, id, req.user);
    res.json({ data: (await pool.query('SELECT * FROM room_thresholds WHERE room_id=$1', [id])).rows[0] ?? { room_id: id, ...defaultThreshold } });
  });
  router.patch('/rooms/:id/thresholds', admin, async (req, res) => {
    const input = thresholdInput.parse(req.body);
    const id = idParam(req);
    await roomAccess(pool, id, req.user);
    const result = await pool.query(`INSERT INTO room_thresholds(room_id,temperature_min,temperature_max,humidity_min,humidity_max,co2_max,notifications_enabled)
      VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(room_id) DO UPDATE SET temperature_min=$2,temperature_max=$3,humidity_min=$4,humidity_max=$5,co2_max=$6,notifications_enabled=$7 RETURNING *`,
    [id,input.temperature_min,input.temperature_max,input.humidity_min,input.humidity_max,input.co2_max,input.notifications_enabled]);
    res.json({ data: result.rows[0] });
  });
  router.get('/rooms/:id/camera', async (req, res) => {
    const id = idParam(req);
    await roomAccess(pool, id, req.user);
    const room = (await pool.query('SELECT camera_url FROM rooms WHERE id=$1', [id])).rows[0];
    res.json({ data: { configured: !!room.camera_url, url: room.camera_url, measurement_scope: 'room', hardware_verified: false } });
  });
  router.patch('/rooms/:id/camera', staff, async (req, res) => {
    const input = z.object({ url: z.url().max(2000).refine(value => { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password; }, 'Cần HTTPS không chứa credentials.').nullable() }).strict().parse(req.body);
    const result = await pool.query('UPDATE rooms SET camera_url=$2 WHERE id=$1 RETURNING id', [idParam(req),input.url]);
    if (!result.rowCount) return notFound();
    res.json({ data: { configured: !!input.url, url: input.url, hardware_verified: false } });
  });
  return router;
}
