# SMART MUSHROOM — DỰ ÁN MỚI

Hệ thống quản lý nuôi trồng nấm, cho thuê khay và giám sát từ xa. Mã ứng dụng được tạo mới trong repository này từ ngày 2026-11-05, không nhập code/dữ liệu/tiến độ dự án cũ.

| Thành phần | Công nghệ | Mức đã kiểm chứng |
|---|---|---|
| Database/API | PostgreSQL + Node.js/Express REST | Migration, auth/RBAC, CRUD, thuê/tiến trình/thu hoạch, thông báo, IoT API;32 integration tests PASS |
| Web nhân sự | React + Vite | Build,2 API client tests +8 nhóm Chrome E2E PASS |
| App Customer | Flutter |Analyze/12 tests/Web build; APK debug +Android emulator UI/API/PostgreSQL flow PASS; chưa phone thật |
| IoT | ESP32 Arduino + SCD4x đề xuất | 2 nhánh firmware compile PASS; simulator HTTP PASS; chưa sensor/relay/camera thật |
| Deployment | Docker Compose + Nginx | CI Linux toàn bộ +Docker build/up/smoke PASS run42005126537; chưa production TLS |

Chưa nghiệm thu toàn bộ hệ thống vật lý/production. Các lệnh điều khiển hiện chỉ dry-run. Không có thanh toán online. Camera là contract URL, chưa có live feed đã xác minh. Bằng chứng và giới hạn chi tiết ở [nhật ký kiểm thử](docs/KIEM_THU.md).

## Chạy ứng dụng local

Yêu cầu Node >=22.12, PostgreSQL >=16; phiên bản đã kiểm tra: Node22.23.4, PostgreSQL17.11. Tạo database **mới**, chuẩn bị DATABASE_URL, không dùng database dự án khác.

```powershell
npm ci
Copy-Item server/.env.example server/.env
# Sửa DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD >=12 ký tự, ADMIN_NAME.
npm run db:migrate
npm run admin:create
npm run dev:server
```

Terminal thứ hai:

```powershell
npm run dev:web
# Mở http://localhost:5173, đăng nhập bằng Admin vừa tạo.
```

API ở localhost3000; `/health` kiểm tra tiến trình, `/ready` kiểm tra DB. Vite proxy `/api` đến 127.0.0.1:3000; có thể đặt API_TARGET khi cần. Đăng ký công khai chỉ Customer; Operator/Admin bổ sung được Admin cấp qua Web. Không có tài khoản/mật khẩu mặc định.

Lịch sử hợp đồng trên React/Flutter có20 bản ghi/trang, nút trước/sau và lọc trạng thái; Web nhân sự có thêm lọc khách thuê. API `/rentals` dùng cursor, giữ ownership ở từng trang; các danh sách khác vẫn theo giới hạn tại API.md.

Nếu công cụ portable có sẵn tại `C:/Users/mired/.sm-tools` trên máy Windows hiện tại:

```powershell
$env:PATH = 'C:/Users/mired/.sm-tools/node-v22.23.4-win-x64;' + $env:PATH
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/local-postgres.ps1
$env:DATABASE_URL = (Get-Content .local/database.env).Substring(13)
npm ci
npm run db:migrate
# Đặt ADMIN_* qua môi trường riêng, rồi npm run admin:create.
```

Script tạo cluster mới trong `.local/postgres`, loopback55439, password ngẫu nhiên/SCRAM. Không xóa hay dùng dữ liệu cũ; file credentials bị gitignore. Bypass chỉ theo tiến trình, không đổi PowerShell policy hệ thống.

## Chạy kiểm thử

```powershell
# Windows với cluster local từ script phía trên:
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test.ps1
# Hoặc đặt TEST_DATABASE_URL vào PostgreSQL riêng tên sm_test_* rồi:
npm test
npm run build:web
npm run test:web
npm run test:mobile:api
npm run test:mobile:web
npm run test:backup
npm run test:load
```

TEST_DATABASE_URL cần quyền tạo database test. Mỗi module tạo DB riêng, giữ lại để kiểm tra; không tự dọn/xóa DB. Các lệnh browser/live Dart/backup cần TEST_DATABASE_URL được đặt trong chính terminal đó. `scripts/test.ps1` tạo biến trong tiến trình riêng, không xuất ngược sang terminal cha.

Chrome E2E Windows dùng đường dẫn Chrome chuẩn; có thể đặt CHROME_PATH. Linux cài `npx playwright install --with-deps chromium`. Flutter runner dùng FLUTTER_ROOT hoặc `.sm-tools/flutter`. Backup test dùng PG_BIN hoặc `.sm-tools/pgsql/bin`; phục hồi chỉ vào database test mới.

`test:load` tạo dữ liệu test mới, đo2 endpoint đọc với20 tài khoản đồng thời và lưu số đo tại `.local/review-load.json`. Đây là benchmark ngắn qua loopback, không thay nghiệm thu tải production. `test:deploy` dùng CI Compose riêng đã bootstrap admin qua ADMIN_EMAIL/ADMIN_PASSWORD; không chạy bootstrap lên DB thật để thử lại.

`test:mobile:web` cần bản build mới tại `mobile/build/web`; chạy `flutter build web --no-wasm-dry-run` trong mobile trước. Test tương tác chính UI Flutter qua Chrome và DB thật; không thay thế kiểm thử Android.

## Flutter và ESP32

```powershell
cd mobile
flutter pub get
flutter analyze
flutter test
flutter run -d chrome --web-port=5174 --dart-define=API_BASE_URL=http://localhost:3000
flutter build web --no-wasm-dry-run
```

Đặt WEB_ORIGIN=http://localhost:5174 ở backend cho Flutter Web dev. Android debug mặc định dùng 10.0.2.2:3000; Android SDK và release signing chưa được cấu hình. Chi tiết tại [hướng dẫn Flutter](mobile/HUONG_DAN.md).

IoT: tạo device mode simulator trên Web, đặt API_URL/DEVICE_TOKEN riêng rồi `node iot/simulator.mjs`. Firmware, thư viện, compile, TLS và kế hoạch nghiệm thu phần cứng ở [iot/README.md](iot/README.md). Không upload hay bật relay thật trong phiên này.

## Tài liệu và cấu trúc

- [Yêu cầu gốc](docs/DE_TAI_YEU_CAU.md), [User Requirements](docs/USER_REQUIREMENTS.md), [SRS](docs/SRS.md).
- [Kiến trúc/ERD](docs/KIEN_TRUC.md), [ADR](docs/QUYET_DINH_KIEN_TRUC.md), [thiết kế chi tiết/UML](docs/THIET_KE_CHI_TIET.md), [API](docs/API.md).
- [Cài đặt/triển khai/backup](docs/CAI_DAT_TRIEN_KHAI.md), [hướng dẫn sử dụng](docs/HUONG_DAN_SU_DUNG.md), [Test Plan](docs/TEST_PLAN.md), [kết quả test](docs/KIEM_THU.md).
- [Kế hoạch](docs/KE_HOACH_THUC_HIEN.md), [bảng kiểm](docs/BANG_KIEM_CHUC_NANG.md), [tiến độ/checkpoint](TIEN_DO_CODEX.md).
- [Kiểm kê máy Windows và các bước còn thiếu để demo](docs/KIEM_TRA_MOI_TRUONG_WINDOWS.md): công cụ/PATH, DB profile, Android/JDK/WSL/Docker, ESP32/camera và kết quả kiểm tra thực tế.
- [Chạy demo Windows/Android](docs/DEMO_WINDOWS.md), [truy vết32 yêu cầu theo source/test/việc thiếu](docs/DOI_CHIEU_YEU_CAU.md). Demo: local-postgres.ps1 → `node scripts/demo.mjs init` → `node scripts/demo.mjs start`; account riêng ở `.local/demo/private.json`; dừng bằng `node scripts/demo.mjs stop`.

`server/` API/migrations/tests; `web/` React; `mobile/` Flutter; `iot/` simulator/firmware; `deploy/` proxy; `scripts/` công cụ dev/test; `.github/workflows/` CI Linux và Docker smoke. `compose.yaml` đã chạy trong CI, cổng local8080; máy Windows hiện chưa có Docker Engine. Xem [báo cáo review cuối](docs/REVIEW_CUOI.md) để biết lỗi đã sửa, kết quả CI và giới hạn nghiệm thu.

Khi tiếp tục, gửi **Tiếp tục đồ án.** trong cùng repo. AGENTS.md yêu cầu đối chiếu code/Git với checkpoint trước làm tiếp. Sau giai đoạn đã kiểm chứng, tự commit và push thông thường lên nhánh hiện tại theo mục 8 của AGENTS.md; không force push, không commit secret hoặc xóa lịch sử/dữ liệu/tài liệu yêu cầu. Nếu Git thất bại phải ghi lỗi vào tiến độ. Không có cơ chế tự chạy lại lúc reset token.
