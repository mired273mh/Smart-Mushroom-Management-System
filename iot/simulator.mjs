// Simulator HTTP, không truy cập chân GPIO hoặc thiết bị thật.
const base = process.env.API_URL ?? 'http://localhost:3000';
const token = process.env.DEVICE_TOKEN;
if (!token) throw new Error('Set DEVICE_TOKEN from POST /api/devices (mode=simulator).');
const count = Number(process.env.SAMPLE_COUNT ?? 5);
if (!Number.isInteger(count) || count < 1 || count > 1000) throw new Error('SAMPLE_COUNT must be 1..1000');
async function call(path, method = 'GET', body) {
  const response = await fetch(base + path, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message ?? `HTTP ${response.status}`);
  return result.data;
}
const identity = await call('/api/iot/me');
if (identity.mode !== 'simulator') throw new Error('Simulator requires a device provisioned with mode=simulator.');
for (let i = 0; i < count; i++) {
  const reading = await call('/api/iot/readings','POST', { temperature: 24 + Math.sin(i), humidity: i % 2 ? 65 : 85, co2: i % 2 ? 1800 : 800 });
  console.log(`MÔ PHỎNG sample=${i+1} saved=${reading.id} simulated=${reading.simulated} abnormal=${reading.abnormal}`);
  const commands = await call('/api/iot/commands');
  for (const command of commands) {
    if (!command.dry_run) throw new Error('Simulator refuses real hardware commands.');
    await call(`/api/iot/commands/${command.id}/ack`,'POST', { success: true, result: 'Mô phỏng; không điều khiển phần cứng.' });
    console.log(`DRY-RUN ${command.actuator} enabled=${command.enabled}`);
  }
  if (i + 1 < count) await new Promise(resolve => setTimeout(resolve, 2000));
}
