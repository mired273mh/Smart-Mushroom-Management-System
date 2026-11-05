import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { setup } from '../../server/test/helpers.js';
import { seedRentalHistory } from '../../server/test/history-fixtures.js';

const ctx = await setup();
const [admin,operator,customer] = await Promise.all(['admin','operator','customer'].map(ctx.user));
const vite = spawn(process.execPath, [fileURLToPath(new URL('../../node_modules/vite/bin/vite.js',import.meta.url)), '--host','127.0.0.1','--port','5177','--strictPort'], {
  cwd:fileURLToPath(new URL('../',import.meta.url)), env:{ ...process.env, API_TARGET:ctx.base }, stdio:'pipe', windowsHide:true,
});
let viteOutput = '';
vite.stderr.on('data',chunk => { viteOutput += chunk; });
const base = 'http://127.0.0.1:5177';
let browser;
try {
  let ready = false;
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(base)).ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve,200));
  }
  if (!ready) throw new Error('Vite did not start: ' + viteOutput);
  const installedChrome = process.env.CHROME_PATH ?? (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined);
  if (installedChrome) await access(installedChrome);
  browser = await chromium.launch({ headless:true, ...(installedChrome ? { executablePath:installedChrome } : {}) });
  const page = await browser.newPage({ viewport:{ width:1440,height:1000 } });
  const errors = [];
  page.on('pageerror',error => errors.push(error.message));
  page.on('dialog',dialog => dialog.accept());
  await page.goto(base);
  async function login(user) {
    await page.getByLabel('Email',{ exact:true }).fill(user.email);
    await page.getByLabel('Mật khẩu',{ exact:true }).fill(user.password);
    await page.getByRole('button',{ name:'Đăng nhập',exact:true }).click();
  }
  async function nav(label) { await page.getByRole('navigation').getByRole('button',{ name:label,exact:true }).click(); }
  async function saveModal() { await page.getByRole('dialog').getByRole('button',{ name:'Lưu',exact:true }).click(); await page.getByRole('dialog').waitFor({ state:'hidden' }); }
  await login(customer);
  await page.getByRole('alert').filter({ hasText:'Customer sử dụng ứng dụng Flutter' }).waitFor();
  console.log('PASS: Customer bị chặn tại Web và session được thu hồi.');
  await login(admin);
  await page.getByRole('heading',{ name:'Tổng quan',exact:true }).waitFor();
  const suffix = Date.now().toString();
  const roomName = `Phòng E2E ${suffix}`, planName = `Gói E2E ${suffix}`, trayCode = `E2E-${suffix}`;
  await nav('Phòng trồng');
  await page.getByRole('button',{ name:'+ Thêm phòng',exact:true }).click();
  await page.getByLabel('Tên phòng',{ exact:true }).fill(roomName);
  await saveModal();
  await page.getByRole('cell',{ name:roomName,exact:true }).waitFor();
  await nav('Khay nấm');
  await page.getByRole('button',{ name:'+ Thêm khay',exact:true }).click();
  await page.getByLabel('Phòng trồng',{ exact:true }).selectOption({ label:roomName });
  await page.getByLabel('Mã khay').fill(trayCode);
  await page.getByLabel('Tên khay',{ exact:true }).fill('Khay trình duyệt');
  await saveModal();
  await page.getByRole('cell',{ name:trayCode,exact:true }).waitFor();
  await nav('Gói thuê');
  await page.getByRole('button',{ name:'+ Thêm gói',exact:true }).click();
  await page.getByLabel('Tên gói',{ exact:true }).fill(planName);
  await page.getByLabel('Thời hạn (ngày)',{ exact:true }).fill('30');
  await page.getByLabel('Giá VND / khay',{ exact:true }).fill('120000');
  await saveModal();
  await page.getByRole('cell',{ name:planName,exact:true }).waitFor();
  console.log('PASS: CRUD phòng/khay/gói qua Chrome, lưu PostgreSQL thật.');
  const catalog = (await ctx.request('/api/catalog',{ token:admin.token })).body.data;
  const tray = catalog.trays.find(t => t.code === trayCode), plan = catalog.plans.find(p => p.name === planName);
  await nav('Hợp đồng thuê');
  await page.getByRole('button',{ name:'+ Gán khay cho khách',exact:true }).click();
  await page.getByLabel('Khách hàng',{ exact:true }).selectOption(customer.id);
  await page.getByLabel('Gói thuê',{ exact:true }).selectOption(plan.id);
  await page.getByLabel('Các khay trống').selectOption([tray.id]);
  await saveModal();
  await page.getByRole('heading',{ name:'Chi tiết hợp đồng',exact:true }).waitFor();
  for (const stage of ['fruiting','ready']) {
    await page.getByRole('button',{ name:'Tiến trình',exact:true }).click();
    await page.getByLabel('Giai đoạn',{ exact:true }).selectOption(stage);
    await saveModal();
    await page.getByText(stage === 'fruiting' ? 'Ra quả thể' : 'Sẵn sàng thu hoạch',{ exact:true }).waitFor();
  }
  await page.getByRole('button',{ name:'Ghi thu hoạch',exact:true }).click();
  await page.getByLabel('Khối lượng (g)',{ exact:true }).fill('1350');
  await saveModal();
  await page.getByText('Đã thu hoạch',{ exact:true }).waitFor();
  await page.getByRole('button',{ name:'Xác nhận đã thu',exact:true }).click();
  await page.getByText('Đã thu',{ exact:true }).waitFor();
  const harvest = (await ctx.request('/api/harvests',{ token:customer.token })).body.data[0];
  // The rejected Web login logged out only its own session; this fixture session remains valid.
  assert.equal((await ctx.request('/api/fulfillment-requests',{ token:customer.token,method:'POST',body:{ harvest_id:harvest.id,method:'pickup' } })).status,201);
  await nav('Thu hoạch & giao nhận');
  await page.getByRole('button',{ name:'Tiếp nhận',exact:true }).click();
  await page.getByRole('button',{ name:'Đã bàn giao',exact:true }).click();
  await page.getByText('Hoàn tất',{ exact:true }).waitFor();
  console.log('PASS: Gán thuê → tiến trình → thu hoạch → thu tiền thủ công → bàn giao.');
  await nav('Môi trường & IoT');
  await page.getByRole('button',{ name:'+ Thêm thiết bị',exact:true }).click();
  await page.getByLabel('Tên thiết bị',{ exact:true }).fill('Simulator E2E');
  await page.getByLabel('Phòng trồng',{ exact:true }).selectOption({ label:roomName });
  await page.getByLabel('Nguồn dữ liệu',{ exact:true }).selectOption('simulator');
  await page.getByRole('dialog').getByRole('button',{ name:'Lưu',exact:true }).click();
  await page.getByRole('dialog',{ name:'Token thiết bị' }).waitFor();
  const deviceToken = await page.locator('.token').innerText();
  await page.getByRole('button',{ name:'Đã lưu riêng',exact:true }).click();
  assert.equal((await ctx.request('/api/iot/readings',{ token:deviceToken,method:'POST',body:{ temperature:24,humidity:82,co2:850 } })).status,201);
  const roomId = (await ctx.request('/api/rooms',{ token:admin.token })).body.data.find(r => r.name === roomName).id;
  await page.getByLabel('Chọn phòng giám sát').selectOption(roomId);
  await page.getByRole('table',{ name:'Lịch sử cảm biến' }).getByRole('cell',{ name:'850',exact:true }).waitFor();
  await nav('Báo cáo');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button',{ name:'Thu hoạch CSV ↓',exact:true }).click();
  const download = await downloadPromise;
  assert.equal(download.suggestedFilename(),'harvests.csv');
  await nav('Tổng quan');
  await page.getByText('Simulator E2E',{ exact:true }).waitFor();
  await mkdir(new URL('../../.local/',import.meta.url),{ recursive:true });
  await page.screenshot({ path:fileURLToPath(new URL('../../.local/web-overview.png',import.meta.url)),fullPage:true });
  await page.setViewportSize({ width:390,height:844 });
  await page.screenshot({ path:fileURLToPath(new URL('../../.local/web-mobile.png',import.meta.url)),fullPage:true });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),true);
  console.log('PASS: Telemetry mô phỏng, tải CSV, responsive 390px không tràn ngang.');
  // Bulk fixtures are explicitly test data, beyond the old 100-row cap.
  await seedRentalHistory(ctx.pool,{customerId:customer.id,actorId:admin.id,count:121});
  await nav('Hợp đồng thuê');
  const table = page.getByRole('table',{name:'Danh sách hợp đồng'});
  await table.locator('tbody tr').first().waitFor();
  assert.equal(await table.locator('tbody tr').count(),20);
  const firstIds = await table.locator('tbody tr').evaluateAll(rows => rows.map(row => row.dataset.recordId));
  await page.getByRole('button',{name:'Trang sau',exact:true}).click();
  await page.getByText('Trang 2 · 20 hợp đồng',{exact:true}).waitFor();
  const nextIds = await table.locator('tbody tr').evaluateAll(rows => rows.map(row => row.dataset.recordId));
  assert.equal(nextIds.some(id => firstIds.includes(id)),false);
  await page.getByRole('button',{name:'Trang trước',exact:true}).click();
  await page.getByText('Trang 1 · 20 hợp đồng',{exact:true}).waitFor();
  assert.deepEqual(await table.locator('tbody tr').evaluateAll(rows => rows.map(row => row.dataset.recordId)),firstIds);
  await page.getByRole('button',{name:'Trang sau',exact:true}).click();
  await page.getByText('Trang 2 · 20 hợp đồng',{exact:true}).waitFor();
  await page.getByLabel('Trạng thái hợp đồng',{exact:true}).selectOption('completed');
  await page.getByText('Trang 1 · 20 hợp đồng',{exact:true}).waitFor();
  assert.equal(await table.getByText('Hoàn tất',{exact:true}).count(),20);
  for (let n=0;n<2;n++) { await page.getByRole('button',{name:'Trang sau',exact:true}).click(); await page.getByText(`Trang ${n+2} · 20 hợp đồng`,{exact:true}).waitFor(); }
  assert.equal(await page.getByRole('button',{name:'Trang sau',exact:true}).isDisabled(),true);
  await page.getByLabel('Lọc khách thuê',{exact:true}).selectOption(customer.id);
  await page.getByText('Trang 1 · 20 hợp đồng',{exact:true}).waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),true);
  console.log('PASS: 122 hợp đồng, next/previous không lặp, lọc status/customer reset trang và hết trang đúng; responsive pager390px.');
  await page.getByRole('button',{ name:'Đăng xuất',exact:true }).click();
  await login(operator);
  await page.getByRole('heading',{ name:'Tổng quan',exact:true }).waitFor();
  assert.equal(await page.getByRole('navigation').getByRole('button',{ name:'Tài khoản',exact:true }).count(),0);
  assert.equal(await page.getByRole('navigation').getByRole('button',{ name:'Báo cáo',exact:true }).count(),0);
  assert.deepEqual(errors,[]);
  console.log('PASS: Operator đúng menu quyền; không có JavaScript pageerror.');
} finally {
  await browser?.close();
  vite.kill();
  await ctx.close();
}
