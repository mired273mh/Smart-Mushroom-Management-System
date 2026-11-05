import { Router } from 'express';
import { z } from 'zod';
import { admin, staff } from './auth.js';
import { transaction } from './db.js';
import { idParam, limitParam, name, uuid } from './validation.js';
import {directoryPage} from './directory-pagination.js';
import { fail, notFound } from './errors.js';
import { newToken, tokenHash } from './security.js';
import { hardwareAllowed, HARDWARE_MAX_SECONDS, enqueueHardware } from './hardware-policy.js';

const thresholdInput = z.object({
  temperature_min: z.number().min(-40).max(85), temperature_max: z.number().min(-40).max(85),
  humidity_min: z.number().min(0).max(100), humidity_max: z.number().min(0).max(100),
  co2_max: z.number().int().min(0).max(40000), notifications_enabled: z.boolean(),
}).strict().refine(v => v.temperature_min < v.temperature_max && v.humidity_min < v.humidity_max);
const defaultThreshold = { temperature_min: 15, temperature_max: 30, humidity_min: 70, humidity_max: 95, co2_max: 1500, notifications_enabled: true };

async function lockedDevice(db, snapshot) {
  const room=await db.query('SELECT id FROM rooms WHERE id=$1 AND active FOR SHARE',[snapshot.room_id]);
  const current=(await db.query('SELECT * FROM devices WHERE id=$1 AND active AND token_hash=$2 FOR UPDATE',[snapshot.id,snapshot.token_hash])).rows[0];
  if(!room.rowCount||!current)return fail(401,'INVALID_DEVICE_TOKEN','Thiết bị/phòng/token không còn hiệu lực.');
  return current;
}

async function roomAccess(db, id, user) {
  const room = (await db.query(`SELECT r.id,r.name FROM rooms r WHERE r.id=$1 AND ($2 <> 'customer' OR EXISTS (
    SELECT 1 FROM trays t JOIN rental_items i ON i.tray_id=t.id JOIN rentals n ON n.id=i.rental_id
    WHERE t.room_id=r.id AND i.ended_at IS NULL AND n.customer_id=$3))`, [id,user.role,user.id])).rows[0];
  if (!room) return notFound();
  return room;
}

export function deviceRouter(pool, config = {}) {
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
      const room = await db.query('SELECT id FROM rooms WHERE id=$1 AND active FOR UPDATE', [req.device.room_id]);
      if (!room.rowCount) return fail(401, 'INVALID_DEVICE_TOKEN', 'Phòng đã ngừng hoạt động.');
      const currentDevice = (await db.query('SELECT * FROM devices WHERE id=$1 AND active AND token_hash=$2 FOR UPDATE', [req.device.id,req.device.token_hash])).rows[0];
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
        const ventilate = sample.co2 > threshold.co2_max || sample.temperature > threshold.temperature_max;
        const actuators = [
          ['mist', sample.humidity < threshold.humidity_min],
          ['fan', ventilate],
          ['heater', sample.temperature < threshold.temperature_min && !ventilate],
        ];
        for (const [actuator, enabled] of actuators) {
          const previous = (await db.query("SELECT enabled,(created_at>now()-interval '30 seconds') AS recent FROM device_commands WHERE device_id=$1 AND actuator=$2 AND source='automatic' ORDER BY created_at DESC LIMIT 1", [currentDevice.id,actuator])).rows[0];
          const armed = hardwareAllowed(config,currentDevice);
          if (previous && previous.enabled === enabled && (!armed || !enabled || previous.recent)) continue;
          if (armed) {
            const actor = (await db.query("SELECT id FROM users WHERE role='admin' AND active AND deleted_at IS NULL ORDER BY created_at LIMIT 1")).rows[0];
            if (actor) await enqueueHardware(db,currentDevice,{actuator,enabled,duration_seconds:HARDWARE_MAX_SECONDS},actor.id,'automatic');
            continue;
          }
          // Automation is observable dry-run only until hardware acceptance.
          await db.query(`INSERT INTO device_commands(device_id,actuator,enabled,duration_seconds,dry_run,status,source,created_by)
            SELECT $1,$2,$3,10,true,'dry_run','automatic',id FROM users WHERE role='admin' AND active AND deleted_at IS NULL ORDER BY created_at LIMIT 1`, [currentDevice.id,actuator,enabled]);
        }
      }
      return { ...reading, abnormal };
    });
    res.status(201).json({ data: result });
  });
  router.get('/me', (req, res) => res.json({ data: { id:req.device.id, room_id:req.device.room_id, name:req.device.name, mode:req.device.mode, hardware_control_available:hardwareAllowed(config,req.device) } }));
  router.get('/commands', async (req, res) => {
    const payload=await transaction(pool,async db=>{
      const current=await lockedDevice(db,req.device);
      await db.query("UPDATE device_commands SET status='expired' WHERE device_id=$1 AND status IN ('pending','dry_run') AND expires_at<=clock_timestamp()", [current.id]);
      await db.query('UPDATE devices SET last_seen_at=now() WHERE id=$1', [current.id]);
      const armed=hardwareAllowed(config,current);
      const result = await db.query(`SELECT id,actuator,enabled,duration_seconds,dry_run,expires_at,source,floor(extract(epoch FROM expires_at))::bigint AS expires_epoch FROM device_commands
        WHERE device_id=$1 AND expires_at>clock_timestamp() AND ((status='dry_run' AND dry_run AND $2='simulator') OR (status='pending' AND NOT dry_run AND $3)) ORDER BY created_at LIMIT 20`, [current.id,current.mode,armed]);
      return {data:result.rows,meta:{hardware_control_available:armed,max_duration_seconds:HARDWARE_MAX_SECONDS}};
    });
    res.json(payload);
  });
  router.post('/commands/:id/ack', async (req, res) => {
    const input = z.object({ success: z.boolean(), result: z.string().trim().max(500) }).strict().parse(req.body);
    const result = await transaction(pool,async db=>{
      const current=await lockedDevice(db,req.device);
      return db.query(`UPDATE device_commands SET status=$3,result=$4 WHERE id=$1 AND device_id=$2
        AND expires_at>clock_timestamp() AND ((status='dry_run' AND dry_run AND $5='simulator') OR (status='pending' AND NOT dry_run AND $6)) RETURNING id,status,dry_run`, [idParam(req),current.id,input.success ? 'acknowledged' : 'failed',input.result,current.mode,hardwareAllowed(config,current)]);
    });
    if (!result.rowCount) return notFound();
    res.json({ data: result.rows[0] });
  });
  return router;
}

export function monitoringRouter(pool, config = {}) {
  const router = Router();
  const deviceColumns = 'id,room_id,name,mode,active,last_seen_at,created_at,automation_enabled';
  router.get('/devices', staff, async (req, res) => {
    const page=await directoryPage(pool,req,{kind:'devices',select:`${deviceColumns},(last_seen_at>now()-interval '2 minutes') AS online`,from:'devices',order:'created_at',timestamp:true});
    res.json({...page,data:page.data.map(device=>({...device,hardware_control_available:hardwareAllowed(config,device)}))});
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
    // Device may be offline and never poll to persist expiry. Report effective
    // TTL status using the server clock, preserving final acknowledged/failed.
    const result = await pool.query(`SELECT id,device_id,actuator,enabled,duration_seconds,dry_run,
      CASE WHEN status IN ('pending','dry_run') AND expires_at<=clock_timestamp() THEN 'expired' ELSE status END AS status,
      source,result,expires_at,created_at FROM device_commands WHERE device_id=$1 ORDER BY created_at DESC,id DESC LIMIT $2`, [idParam(req),limitParam(req)]);
    res.json({ data: result.rows });
  });
  router.post('/devices/:id/commands', staff, async (req, res) => {
    const input = z.object({ actuator: z.enum(['mist','fan','light','heater']), enabled: z.boolean(), duration_seconds: z.number().int().min(1).max(60).default(10), dry_run: z.boolean().default(true) }).strict().parse(req.body);
    const device = (await pool.query('SELECT * FROM devices WHERE id=$1 AND active', [idParam(req)])).rows[0];
    if (!device) return notFound();
    if (!input.dry_run) {
      if (!hardwareAllowed(config,device)) return fail(409, 'HARDWARE_NOT_CONFIRMED', 'Chưa xác nhận BOM/giới hạn hoặc thiết bị chưa được allowlist; chỉ dry-run.');
      if (input.duration_seconds>HARDWARE_MAX_SECONDS) return fail(422,'HARDWARE_DURATION_LIMIT','Xung hardware tối đa10 giây.');
      const command=await transaction(pool,async db=>{
        const room=await db.query('SELECT id FROM rooms WHERE id=$1 AND active FOR UPDATE',[device.room_id]);
        const current=(await db.query('SELECT * FROM devices WHERE id=$1 AND active FOR UPDATE',[device.id])).rows[0];
        if(!room.rowCount||!current)return notFound();
        if(input.enabled && !(await db.query("SELECT 1 FROM sensor_readings WHERE device_id=$1 AND NOT simulated AND recorded_at>clock_timestamp()-interval '30 seconds' LIMIT 1",[device.id])).rowCount) return fail(409,'SENSOR_STALE','Cần mẫu hardware mới trong30 giây trước khi bật tải.');
        return enqueueHardware(db,current,input,req.user.id);
      });
      return res.status(201).json({data:command});
    }
    const result = await pool.query(`INSERT INTO device_commands(device_id,actuator,enabled,duration_seconds,dry_run,status,created_by)
      VALUES ($1,$2,$3,$4,true,'dry_run',$5) RETURNING *`, [device.id,input.actuator,input.enabled,input.duration_seconds,req.user.id]);
    res.status(201).json({ data: result.rows[0] });
  });
  router.get('/rooms/:id/environment', async (req, res) => {
    const id = idParam(req);
    const room = await roomAccess(pool, id, req.user);
    const result = await pool.query(`SELECT s.*,d.name AS device_name FROM sensor_readings s JOIN devices d ON d.id=s.device_id
      WHERE d.room_id=$1 AND ($2<>'customer' OR s.recorded_at >= (
        SELECT min(n.starts_at) FROM rentals n JOIN rental_items i ON i.rental_id=n.id JOIN trays t ON t.id=i.tray_id
        WHERE t.room_id=$1 AND n.customer_id=$3 AND i.ended_at IS NULL))
      ORDER BY s.recorded_at DESC,s.id DESC LIMIT $4`, [id,req.user.role,req.user.id,limitParam(req,1000)]);
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
