# Hướng dẫn cài đặt và triển khai

## 1. Môi trường đã xác minh

Windows: Node22.23.4/26.13/npm, PostgreSQL17.11, Flutter3.47.9/Dart3.13.7, Android SDK/NDK28.2 và Chrome đã chạy; Docker Desktop/Engine/Compose/WSL đã hoạt động. Android emulator UI→API→DB và runtime Docker profile đã kiểm thử ở HQ2; firmware ESP32 core3.3.3 compile3profiles, chưa thiết bị thật. Công cụ portable tại `.sm-tools` không phải app/data cũ. Không cần cài lại tool đang hoạt động; production TLS/phone/hardware vẫn chưa nghiệm thu.

## 2. Cài native vào database mới

1. Cài Node >=22.12 và PostgreSQL >=16, đặt binary trong PATH. Tạo **database mới** riêng cho dự án, không trỏ vào database có dữ liệu cũ.
2. Tại root chạy `npm ci`. Copy `server/.env.example` sang `server/.env`, sửa DATABASE_URL. PostgreSQL user ứng dụng nên chỉ có quyền DB/schema này; không dùng superuser khi triển khai.
3. Chạy `npm run db:migrate`. Migration chỉ tiến tới, dùng transaction/checksum; không sửa file SQL đã apply. Nếu checksum lệch, dừng để đối chiếu source, không xóa schema_migrations để vượt kiểm tra.
4. Đặt ADMIN_EMAIL/ADMIN_PASSWORD/ADMIN_NAME trong `server/.env`, chạy `npm run admin:create`. Chỉ tạo admin đầu tiên, không log mật khẩu. Xóa biến bootstrap khỏi môi trường chạy thường sau khi dùng; giữ bí mật trong nơi lưu credentials riêng.
5. Chạy `npm run dev:server`, kiểm tra `/health` và `/ready` ở cổng3000. Chạy terminal khác `npm run dev:web`, mở localhost5173.
6. Đăng nhập admin, tạo nhân sự/khách/phòng/khay/gói. Dữ liệu ban đầu trống có chủ đích, không seed tài khoản/mật khẩu mặc định.

Windows với tool portable đã có:

```powershell
$env:PATH = 'C:/Users/mired/.sm-tools/node-v22.23.4-win-x64;' + $env:PATH
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/local-postgres.ps1
$env:DATABASE_URL = (Get-Content .local/database.env).Substring(13)
npm ci
npm run db:migrate
# Đặt ADMIN_* riêng trước khi chạy admin:create; không in DATABASE_URL ra log.
```

Script local tạo cluster `.local/postgres`, port55439 loopback, SCRAM và mật khẩu ngẫu nhiên. Chạy lại giữ cluster, không tạo lại/xóa dữ liệu. Nếu cần dừng cluster vừa tạo: `pg_ctl -D <repo>/.local/postgres -m fast stop` bằng đúng binary; chỉ áp dụng cho cluster này. Không dừng dịch vụ PostgreSQL khác.

## 3. Flutter và IoT

Xem `mobile/HUONG_DAN.md` và `iot/README.md`. Android debug trên emulator trỏ `10.0.2.2:3000`; thiết bị thật phải truy cập được API, production dùng HTTPS. Flutter Web dev cổng5174 cần WEB_ORIGIN tương ứng; Compose React cùng origin không cần CORS rộng. Không đặt token/user password trong dart-define bản production.

Firmware chỉ compile/dry-run; chưa có lệnh upload được thực hiện. Cần xác nhận phần cứng trước nghiệm thu relay. Camera phải có gateway HTTPS kiểm soát truy cập riêng; không mở trực tiếp URL camera công khai.

## 4. Docker Compose — profile local/dev và runtime hạn quyền

Compose mặc định đã build/up/smoke trên Windows/CI, nhưng API dùng DB owner nên chỉ gọi là dev profile. HQ2 đã chạy profile hạn quyền thật bằng scripts/test-deployment-runtime.mjs; hướng provision/override tại [database guide](../deploy/database/README.md). Script tự dùng project/volume mới và stop đúng stack, không xóa dữ liệu. Không dùng thử trên DB production hoặc tự reset role/password hiện có.

Yêu cầu Docker Engine/Desktop + Compose v2 có hỗ trợ depends_on condition. [Tài liệu Docker về startup order](https://docs.docker.com/compose/how-tos/startup-order/).

```powershell
Copy-Item .env.example .env
# Tạo mật khẩu hex ngẫu nhiên, điền POSTGRES_PASSWORD; không giữ placeholder.
docker compose config --quiet
docker compose up --build -d
docker compose ps
```

`db` có volume mới thuộc project `smart-mushroom-new`; `migrate` chạy một lần thành công rồi `api` mới start; `web` đợi readiness. Chỉ web được bind loopback8080, PostgreSQL/API không expose host port. DATABASE_URL Compose nội suy mật khẩu, nên dùng hex hoặc mã hóa URL đúng nếu dùng ký tự đặc biệt.

Đặt biến ADMIN_* trong terminal riêng rồi bootstrap vào container đang chạy:

```powershell
docker compose exec -e ADMIN_EMAIL -e ADMIN_PASSWORD -e ADMIN_NAME api node server/src/cli.js admin
```

Không ghi password trực tiếp vào lịch sử lệnh. Mở `http://localhost:8080` để kiểm tra local. Triển khai Internet cần domain/certificate/reverse proxy HTTPS ở phía trước, sửa WEB_ORIGIN, và kiểm tra cấu hình trusted proxy. TRUST_PROXY_HOPS=1 chỉ đúng khi API nhận request qua một proxy tin cậy và không expose trực tiếp; không bật trust proxy tùy ý.

`docker compose stop` dừng mà giữ volume. Không dùng `down -v`, `dropdb`, `--clean` hay xóa `.local/postgres` trong quy trình thông thường. Compose build/up/smoke đã PASS trên Ubuntu CI (job deployment run42003072419); máy Windows hiện chưa có Engine. CI dùng credentials/volume test mới và smoke auth/DB/assets/CSP, không thay nghiệm thu TLS và vận hành trên máy đích.

## 5. Sao lưu và phục hồi

Native: dùng `pg_dump --format=custom --file=<backup.dump>` với PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE qua môi trường riêng hoặc .pgpass. Tránh pipe dump nhị phân qua PowerShell5. Mã hóa/quản lý quyền truy cập file backup vì có thông tin tài khoản và dữ liệu người dùng.

Phục hồi diễn tập vào database **mới**: tạo database mới rồi `pg_restore --exit-on-error --no-owner --no-privileges --dbname=<db_moi> <backup.dump>`, kiểm tra migrations/counts/luồng đọc trước chuyển ứng dụng. Không dùng `--clean` lên database thật. Script `npm run test:backup` đã thực hiện quy trình này chỉ với fixtures test, không phải backup production.

Docker: chạy pg_dump ghi file trong container, sau đó `docker compose cp db:/tmp/backup.dump <thu_muc_backup>`; không đưa backups vào Git. Chính sách đề xuất: sao lưu hàng ngày và diễn tập phục hồi định kỳ; chưa có scheduler production. Tài liệu nêu quy trình, không khẳng định đã có tác vụ backup tự động.

## 6. Xác minh và vận hành

- Dùng DB test tên `sm_test_*`, chạy `npm test`, `npm run test:web`, `npm run test:mobile:api`, `npm run test:backup`; các script giữ DB test để đối chiếu, không tự dọn.
- Kiểm tra đăng nhập đúng vai trò, isolation hai khách, tranh chấp thuê, ngưỡng/cảnh báo, readings có provenance. Xem `KIEM_THU.md`/`TEST_PLAN.md` để phân biệt mock/HTTP/hardware.
- Không log session/device token hay DATABASE_URL. Rotate device token tại Web khi cần. Khóa/reset user thu hồi phiên ngay.
- Session/telemetry/notifications chưa có scheduled retention; theo dõi dung lượng DB, thiết lập chính sách khi triển khai. Không tự xóa lịch sử của khách hàng.
- Android release signing, hardware sensor/relay/live camera, TLS production, tải/hiệu năng và deploy container còn chưa nghiệm thu.
