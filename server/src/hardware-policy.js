// Empty unless the operator has accepted the BOM/wiring/limits for these UUIDs.
// This is deployment configuration, never a public API switch.
export const hardwareAllowed = (config, device) => device.active !== false && device.mode === 'hardware' &&
  (config.HARDWARE_ACTUATION_ALLOWLIST ?? []).includes(device.id);
export const HARDWARE_MAX_SECONDS = 10;

export async function enqueueHardware(db, device, input, actorId, source = 'manual') {
  // Caller holds room then device locks, serializing ingest/manual/disable.
  await db.query("UPDATE device_commands SET status='expired' WHERE device_id=$1 AND actuator=$2 AND status='pending' AND NOT dry_run", [device.id,input.actuator]);
  return (await db.query(`INSERT INTO device_commands(device_id,actuator,enabled,duration_seconds,dry_run,status,created_by,source,expires_at)
    VALUES ($1,$2,$3,$4,false,'pending',$5,$6,clock_timestamp()+interval '15 seconds') RETURNING *`,
  [device.id,input.actuator,input.enabled,input.duration_seconds,actorId,source])).rows[0];
}
