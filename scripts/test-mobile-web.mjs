import { createServer } from 'node:http';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import { resolve, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { setup } from '../server/test/helpers.js';

const ctx = await setup();
const root = fileURLToPath(new URL('../mobile/build/web/',import.meta.url));
const local = fileURLToPath(new URL('../.local/',import.meta.url));
const mime = {'.html':'text/html','.js':'application/javascript','.json':'application/json','.wasm':'application/wasm','.png':'image/png','.ttf':'font/ttf','.otf':'font/otf','.woff2':'font/woff2'};
const server = createServer(async (req,res) => {
  try {
    const pathname = new URL(req.url,'http://localhost').pathname;
    if (pathname.startsWith('/api/')) {
      const chunks = []; for await (const chunk of req) chunks.push(chunk);
      const upstream = await fetch(ctx.base+req.url,{method:req.method,headers:{'Content-Type':'application/json',...(req.headers.authorization ? {Authorization:req.headers.authorization} : {})},body:['GET','HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks)});
      res.writeHead(upstream.status,{'Content-Type':upstream.headers.get('content-type') ?? 'application/json'});
      res.end(await upstream.text()); return;
    }
    const file = resolve(root,'.'+decodeURIComponent(pathname === '/' ? '/index.html' : pathname));
    if (relative(root,file).startsWith('..') || !(await stat(file)).isFile()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200,{'Content-Type':mime[extname(file)] ?? 'application/octet-stream','Cache-Control':'no-store'}); res.end(await readFile(file));
  } catch { res.writeHead(404); res.end(); }
});
let browser, page;
try {
  await readFile(resolve(root,'main.dart.js'));
  const admin = await ctx.user('admin');
  const post = async (path,body) => {
    const result = await ctx.request('/api'+path,{token:admin.token,method:'POST',body});
    assert.equal(result.status,201,JSON.stringify(result.body)); return result.body.data;
  };
  const room = await post('/rooms',{name:'Flutter browser test room'});
  const plan = await post('/plans',{name:'Gói UI Flutter',duration_days:30,price_vnd:130000});
  const tray = await post('/trays',{room_id:room.id,code:'FLUTTER-UI-001',label:'Khay browser mới'});
  const secondTray = await post('/trays',{room_id:room.id,code:'FLUTTER-UI-002',label:'Khay browser thứ hai'});
  const device = await post('/devices',{room_id:room.id,name:'UI simulator',mode:'simulator'});
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const base = 'http://127.0.0.1:'+server.address().port;
  const executable = process.env.CHROME_PATH ?? (process.platform==='win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined);
  browser = await chromium.launch({headless:true,...(executable ? {executablePath:executable} : {})});
  page = await browser.newPage({viewport:{width:412,height:915}});
  page.setDefaultTimeout(15000);
  const errors = []; page.on('pageerror',error => errors.push(error.message));
  page.on('console',message => { if (message.type()==='error' && /EXCEPTION CAUGHT|Another exception was thrown|RenderFlex overflowed|Unhandled Exception|setState\(\)/i.test(message.text())) errors.push(message.text()); });
  await page.goto(base);
  await page.locator('flt-semantics-placeholder').waitFor({state:'attached',timeout:45000});
  await page.locator('flt-semantics-placeholder').evaluate(element => element.click());
  await page.getByRole('button',{name:'Chưa có tài khoản? Đăng ký',exact:true}).click();
  const input = async (label,value) => {
    const field = page.getByRole('textbox',{name:label,exact:true});
    await field.click(); await page.keyboard.press('Control+A'); await page.keyboard.type(value);
  };
  const email = `flutter-ui-${Date.now()}@test.invalid`, password='UIOnlyTestPassword_123!';
  await input('Họ tên','Khách UI Flutter');
  await input('Email',email);
  await input('Mật khẩu',password);
  await page.getByRole('button',{name:'Đăng ký & đăng nhập',exact:true}).click();
  await page.getByText('Hợp đồng hiện tại và lịch sử thuê của bạn.',{exact:true}).waitFor();
  const customer = (await ctx.pool.query('SELECT id,role FROM users WHERE email=$1',[email])).rows[0];
  assert.equal(customer.role,'customer');
  console.log('PASS: Flutter Web UI đăng ký/đăng nhập Customer qua Chrome và PostgreSQL thật.');
  await page.getByRole('tab',{name:/Thuê khay/}).click();
  await page.getByText('Gói thuê',{exact:true}).click();
  await page.getByRole('menuitem',{name:'Gói UI Flutter · 30 ngày · 130000 ₫',exact:true}).click();
  await page.getByRole('checkbox',{name:new RegExp(tray.code)}).click();
  await page.getByRole('checkbox',{name:new RegExp(secondTray.code)}).click();
  await page.getByRole('button',{name:'Xác nhận thuê 2 khay',exact:true}).click();
  await page.getByText('Chi tiết hợp đồng',{exact:true}).waitFor();
  const rental = (await ctx.request('/api/rentals',{token:admin.token})).body.data.find(r => r.customer_id===customer.id);
  const detail = (await ctx.request('/api/rentals/'+rental.id,{token:admin.token})).body.data;
  assert.equal(detail.items.length,2);
  const item = detail.items.find(i => i.tray_id===tray.id);
  const reading = await ctx.request('/api/iot/readings',{token:device.token,method:'POST',body:{temperature:32,humidity:65,co2:1800}});
  assert.equal(reading.status,201);
  await page.getByLabel(new RegExp(tray.code)).last().click();
  await page.getByText('32 °C · 65 %RH · 1800 ppm',{exact:false}).last().waitFor();
  await page.getByText('Chưa có kênh camera cho phòng này.',{exact:true}).waitFor();
  console.log('PASS: Flutter UI thuê2 khay, mở item và đọc telemetry theo phòng (mô phỏng), camera trống đúng trạng thái.');
  await page.getByRole('button',{name:'Back',exact:true}).click();
  await page.getByRole('button',{name:'Back',exact:true}).click();
  await page.getByRole('button',{name:'Liên kết mã khay',exact:true}).click();
  await input('Mã khay',tray.code);
  await page.getByRole('button',{name:'Xác nhận',exact:true}).click();
  await page.getByText('Theo dõi khay',{exact:true}).waitFor();
  await page.getByText('32 °C · 65 %RH · 1800 ppm',{exact:false}).last().waitFor();
  assert.ok((await ctx.pool.query('SELECT linked_at FROM rental_items WHERE id=$1',[item.id])).rows[0].linked_at);
  await page.getByRole('button',{name:'Back',exact:true}).click();
  for (const stage of ['fruiting','ready']) assert.equal((await ctx.request(`/api/rental-items/${item.id}/progress`,{token:admin.token,method:'POST',body:{stage,note:'Mốc cập nhật cho Flutter UI E2E'}})).status,201);
  const harvest = (await ctx.request(`/api/rental-items/${item.id}/harvests`,{token:admin.token,method:'POST',body:{weight_grams:1350}})).body.data;
  await page.getByRole('tab',{name:/Nhận nấm/}).click();
  await page.getByRole('button',{name:'Yêu cầu nhận / giao',exact:true}).click();
  await page.getByRole('button',{name:/Hình thức nhận/}).click();
  await page.getByRole('menuitem',{name:'Giao hàng',exact:true}).click();
  await page.getByRole('button',{name:'Gửi yêu cầu',exact:true}).click();
  await page.getByText('Cần địa chỉ giao hàng.',{exact:true}).waitFor();
  await input('Địa chỉ giao hàng','123 đường kiểm thử Flutter');
  await page.getByRole('button',{name:'Gửi yêu cầu',exact:true}).click();
  await page.getByRole('button',{name:'Hủy yêu cầu',exact:true}).waitFor();
  const fulfillment = (await ctx.pool.query('SELECT * FROM fulfillment_requests WHERE harvest_id=$1',[harvest.id])).rows[0];
  assert.equal(fulfillment.customer_id,customer.id);
  assert.equal(fulfillment.method,'delivery');
  assert.equal(fulfillment.address,'123 đường kiểm thử Flutter');
  await page.getByRole('button',{name:'Hủy yêu cầu',exact:true}).click();
  await page.getByRole('button',{name:'Gửi lại yêu cầu',exact:true}).click();
  await page.getByRole('button',{name:'Hủy yêu cầu',exact:true}).waitFor();
  assert.equal((await ctx.pool.query('SELECT status FROM fulfillment_requests WHERE id=$1',[fulfillment.id])).rows[0].status,'requested');
  console.log('PASS: Flutter UI liên kết đúng chủ, yêu cầu giao có validate địa chỉ, hủy/gửi lại lưu DB thật.');
  await page.getByRole('tab',{name:/Thông báo/}).click();
  await page.getByRole('button',{name:/đã thu hoạch 1350 g/}).waitFor();
  await page.getByRole('button',{name:/đã thu hoạch 1350 g/}).click();
  await page.getByRole('tab',{name:/Thông báo/}).waitFor();
  await page.getByRole('tab',{name:/Hồ sơ/}).click();
  await page.getByRole('button',{name:'Sửa họ tên',exact:true}).click();
  await input('Họ tên','Tên mới Flutter UI');
  await page.getByRole('button',{name:'Xác nhận',exact:true}).click();
  await page.getByText('Tên mới Flutter UI',{exact:true}).waitFor();
  assert.equal((await ctx.pool.query('SELECT name FROM users WHERE id=$1',[customer.id])).rows[0].name,'Tên mới Flutter UI');
  assert.ok((await ctx.pool.query("SELECT read_at FROM notifications WHERE user_id=$1 AND kind='harvest'",[customer.id])).rows[0].read_at);
  await mkdir(local,{recursive:true});
  await page.screenshot({path:resolve(local,'flutter-customer.png'),fullPage:true});
  await page.getByRole('button',{name:'Đăng xuất',exact:true}).click();
  await page.getByText('Chào bạn trở lại',{exact:true}).waitFor();
  await input('Email',admin.email); await input('Mật khẩu',admin.password);
  await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();
  await page.getByText('Ứng dụng dành cho Customer. Nhân viên sử dụng Web.',{exact:true}).waitFor();
  assert.deepEqual(errors,[]);
  console.log('PASS: Flutter UI thông báo/hồ sơ/logout và chặn tài khoản staff; không JavaScript pageerror.');
} catch (error) {
  if (page) {
    await mkdir(local,{recursive:true});
    await page.screenshot({path:resolve(local,'flutter-failure.png'),fullPage:true}).catch(()=>{});
    const semantics = await page.locator('flt-semantics, [role]').evaluateAll(nodes => nodes.map(node => ({role:node.getAttribute('role'),label:node.getAttribute('aria-label'),text:node.textContent})).filter(node => node.role || node.label)).catch(()=>[]);
    await writeFile(resolve(local,'flutter-semantics.json'),JSON.stringify(semantics,null,2));
  }
  throw error;
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
  await ctx.close();
}
