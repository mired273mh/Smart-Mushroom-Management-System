import { randomUUID } from 'node:crypto';
import { transaction } from '../src/db.js';

// Fresh test fixtures only; completed rentals keep their tray/ledger history.
export async function seedRentalHistory(pool, { customerId, actorId, count = 207, roomId, planId }) {
  return transaction(pool, async db => {
    if (!roomId) roomId = (await db.query('INSERT INTO rooms(name) VALUES ($1) RETURNING id', ['History room '+randomUUID()])).rows[0].id;
    if (!planId) planId = (await db.query('INSERT INTO rental_plans(name,duration_days,price_vnd) VALUES ($1,30,100000) RETURNING id', ['History plan '+randomUUID()])).rows[0].id;
    const fixtures = Array.from({ length:count }, (_, index) => ({
      id:randomUUID(), tray_id:randomUUID(), status:index%2 ? 'completed' : 'active',
      starts_at:index%3 ? '2026-01-01T00:00:00.123456Z' : '2026-01-01T00:00:00.123457Z',
    }));
    const encoded = JSON.stringify(fixtures);
    await db.query(`INSERT INTO trays(id,room_id,code,label)
      SELECT tray_id,$2,'H-'||tray_id::text,'History tray' FROM jsonb_to_recordset($1::jsonb) AS f(tray_id uuid)`, [encoded,roomId]);
    await db.query(`INSERT INTO rentals(id,customer_id,plan_id,status,price_per_tray_vnd,duration_days,starts_at,expected_end_at,completed_at,created_by)
      SELECT id,$2,$3,status,100000,30,starts_at,starts_at+interval '30 days',CASE WHEN status='completed' THEN starts_at+interval '30 days' END,$4
      FROM jsonb_to_recordset($1::jsonb) AS f(id uuid,status text,starts_at timestamptz)`, [encoded,customerId,planId,actorId]);
    await db.query(`INSERT INTO rental_items(rental_id,tray_id,ended_at)
      SELECT id,tray_id,CASE WHEN status='completed' THEN starts_at+interval '30 days' END
      FROM jsonb_to_recordset($1::jsonb) AS f(id uuid,tray_id uuid,status text,starts_at timestamptz)`, [encoded]);
    await db.query(`INSERT INTO transactions(rental_id,amount_vnd,status,confirmed_at,confirmed_by)
      SELECT id,100000,CASE WHEN status='completed' THEN 'paid' ELSE 'pending' END,
      CASE WHEN status='completed' THEN starts_at+interval '30 days' END,CASE WHEN status='completed' THEN $2::uuid END
      FROM jsonb_to_recordset($1::jsonb) AS f(id uuid,status text,starts_at timestamptz)`, [encoded,actorId]);
    return fixtures;
  });
}
