# TIẾN ĐỘ CODEX — SMART MUSHROOM (DỰ ÁN MỚI)

> **Lịch sử khởi tạo:** ban đầu chỉ có tài liệu. Hiện đã có source ứng dụng mới và bằng chứng dưới đây; không nhập code/data/tiến độ từ dự án cũ.
>
> **Quy tắc:** Codex phải cập nhật sau mỗi batch code/test. Nếu bị ngắt, phải đối chiếu Git diff và code thực tế khi tiếp tục. Không được tự ghi PASS khi chưa chạy.

## 1. Trạng thái nhanh

- **Mốc hiện tại:** P5/P6 — bản phần mềm local và bộ tài liệu ban đầu đã kiểm chứng; còn nghiệm thu môi trường đích.
- **Đang làm:** Review/kiểm thử toàn bộ theo yêu cầu mới: backend/DB/security, React/Flutter E2E, IoT compile, deployment/CI/tài liệu; sửa lỗi có bằng chứng và chạy regression.
- **Đã hoàn thành:** Thiết kế; Express/PostgreSQL24 tests; React Web6 nhóm E2E; Flutter Customer7 widget/client tests + live API + browser UI E2E4 nhóm; pagination lịch sử thuê; firmware2 mode compile; simulator; backup/restore; tài liệu và6 UML render.
- **Chưa hoàn thành:** Docker runtime/CI remote/TLS production; Android APK/signing/phone E2E; sensor/relay/camera thật, driver GPIO điều khiển thật. Chưa phân trang đầy đủ/retention/benchmark tải.
- **Blocker môi trường:** Thiếu Docker Engine/Android SDK; chưa xác nhận BOM/relay/giới hạn an toàn/camera. Blocker GitHub đã giải quyết: Git Credential Manager có tài khoản mired273mh và push main thành công.
- **Công việc tiếp theo chính xác:** Các danh sách ngoài /rentals (catalog/khách/notifications/telemetry...) còn cần pagination; bổ sung test dữ liệu lớn/đo tải. Sau các batch đã kiểm chứng, tiếp tục commit/push main theo AGENTS mục8. Docker/Android/hardware giữ điều kiện nghiệm thu cũ; không dựng lại phần đã PASS.
- **Lệnh tiếp tục:** `Tiếp tục đồ án.`

## 2. Trạng thái các giai đoạn

| Mốc | Nội dung | Tình trạng | Bằng chứng |
|---|---|---|---|
| P0 | Kiến trúc, repo, skeleton, .env.example, tài liệu chạy | Đã kiểm thử | SRS/ADR/ERD + health/readiness PASS |
| P1 | PostgreSQL, Express API, auth/RBAC, quản lý nền tảng | Đã kiểm thử bản đầu | 24/24 integration tests PASS, cursor/filter lịch sử thuê; các list khác chưa phân trang |
| P2 | React Web: Administrator và Farm Operator | Đã kiểm thử bản đầu | Vite build PASS; Chrome E2E luồng chính PASS |
| P3 | Flutter App: Customer | Đã kiểm thử bản đầu (Web/VM) | Analyze sạch,7 tests + live API1/1 + Chrome UI E2E4 nhóm PASS; Web build PASS; chưa Android SDK |
| P4 | ESP32 + cảm biến/điều khiển + camera theo phạm vi khả thi | Đã compile/mô phỏng; chưa nghiệm thu hardware | Simulator HTTP test PASS; firmware 2 nhánh compile PASS; chưa upload/relay/live camera |
| P5 | Tích hợp, bảo mật, kiểm thử, triển khai | Đang làm; local integration đã kiểm thử | 21 backend tests, Web E2E, Dart live API, backup/restore PASS; Docker/CI remote chưa chạy |
| P6 | UML 2.0, SRS, thiết kế, test plan, cài đặt, hướng dẫn | Hoàn thành tài liệu bản đầu | UR/SRS/ADR/ERD/detail/API/test/install/user guide; 6 PlantUML render PASS; cần review học thuật/nghiệm thu đích |

**Trạng thái được dùng:** `Chưa bắt đầu` / `Đang làm` / `Bị chặn` / `Đã kiểm thử` / `Hoàn thành (chưa kiểm thử)`.

## 3. Nhật ký thực hiện (Codex nối thêm sau MỖI batch)

### 2026-11-05 — P0a: HOÀN THÀNH phân tích thiết kế ban đầu

- Đọc AGENTS, hai prompt, README, tiến độ và toàn bộ 6 tài liệu docs ban đầu. `git status --short` sạch, repo chỉ có tài liệu; không nhập source/dữ liệu/history từ dự án khác.
- Tạo `docs/SRS.md`, `docs/KIEN_TRUC.md`, `docs/uml/use-cases.puml`, `docs/uml/rental-sequence.puml`, `.gitignore`; bổ sung ADR và backlog.
- Đã phân tích đủ 3 vai trò, mapping A/O/C, ràng buộc chống thuê trùng, snapshot giá, liên kết cần ownership, dữ liệu cảm biến theo phòng, camera tùy phần cứng, điều khiển dry-run.
- Kiểm tra môi trường: Node/npm/psql/docker/flutter không ở PATH. Tìm thấy binary Node, PostgreSQL, Flutter, Arduino trong `C:/Users/mired/.sm-tools`; chỉ sử dụng compiler/runtime, không dùng dữ liệu hoặc code có sẵn ngoài repo.
- Kiểm thử ứng dụng: CHƯA CHẠY (chưa có source ở batch này). UML là source PlantUML, chưa render.
- Bước tiếp theo ĐANG LÀM: P0b/P1a tạo backend, migration nền tảng, auth/RBAC. Tiêu chí: migration trên DB mới + health/auth/ownership tests thực tế PASS. Không dùng DB cũ; dữ liệu test sinh mới trong repo `.local/` bị gitignore.

### Mẫu bản ghi

- **Thời điểm:** [nếu xác định được]
- **Mốc / hạng mục:** [P0/P1/...]
- **Việc đã làm thực tế:** ...
- **File mới / sửa:** ...
- **Lệnh đã chạy + kết quả:** `...` → PASS/FAIL/CHƯA CHẠY, lý do
- **Lỗi còn tồn tại / blocker:** ...
- **Công việc tiếp theo nhỏ nhất có thể làm:** ...
- **Git:** các file chưa commit, thay đổi cần review

### 2026-11-05 — P0b/P1a: HOÀN THÀNH skeleton/migration/auth

- Tạo npm workspace, `server/package.json`, lockfile, `.env.example`; `server/src/{app,index,config,db,migrate,cli,auth,security,errors,validation}.js`; migration `001_foundation.sql` gồm các bảng theo ERD; `server/test/{helpers,foundation.test}.js`; `scripts/{local-postgres,test}.ps1`; cập nhật README.
- Node 22.23.4, PostgreSQL 17.11 và Flutter 3.47.9 có sẵn; npm install PASS, audit 0 lỗ hổng tại thời điểm cài.
- Tạo cluster/database hoàn toàn mới ở `.local/postgres`, port 55439, auth SCRAM và mật khẩu ngẫu nhiên. Không dùng code/data cũ.
- Lỗi đã sửa: PowerShell policy chặn script → chạy bypass theo tiến trình; kết quả psql rỗng gây lỗi `.Trim()` → so sánh collection. Lần đầu migration dev FAIL do database chưa tạo; sau sửa script, chạy migration dev 2 lần PASS.
- `npm test` với TEST_DATABASE_URL mới: **4/4 PASS**, không skip; migration idempotent, config validation, đăng ký chỉ Customer, login/logout/profile, hash token, user khóa và phiên hết hạn.
- CLI bootstrap chưa smoke test trực tiếp; password hash đã dùng trong test tạo user. Các vai trò staff/admin sẽ có test trên route nghiệp vụ batch sau.
- ĐANG LÀM P1b: CRUD room/tray/plan + thuê/gán nhiều khay, liên kết ownership, đóng hợp đồng. Tiêu chí: RBAC + tranh chấp thuê + rollback + không lộ tenant PASS trên PostgreSQL thật.

### 2026-11-05 — P1b: HOÀN THÀNH API nền tảng và thuê khay

- Tạo `server/src/{catalog,users,rentals}.js`, `server/test/rentals.test.js`; nối routes trong app. CRUD room/tray/plan, quản lý user (soft delete, reset password thu hồi session, bảo vệ admin cuối), catalog, thuê/gán nhiều khay, giá snapshot, liên kết đúng chủ, lịch sử và chi tiết item.
- Khay đang thuê không được đổi phòng/trạng thái phục vụ; phòng đang có thuê không được vô hiệu hóa. Đóng hợp đồng có kiểm tra công nợ và yêu cầu nhận/giao; sẽ kiểm thử luồng đóng ở P1c.
- Lần đầu tests FAIL 3/9 do PostgreSQL suy luận tham số duration vừa integer vừa interval; đã thêm cast `::integer`, chạy lại **9/9 PASS** bằng `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test.ps1`.
- Bằng chứng: HTTP thật + PostgreSQL 17.11; race cho một khay trả 201/409, transaction nhiều khay rollback, khách khác nhận 404, mã khay không cho chiếm quyền, giá giữ nguyên sau thay đổi gói, staff/admin RBAC.
- Git: source/tài liệu mới chưa commit; không push, không xóa DB.
- ĐANG LÀM P1c: growth/harvest/fulfillment/notifications/ledger/report. Tiêu chí: luồng từ thuê đến hoàn tất, không vượt quyền/nhảy trạng thái, CSV an toàn PASS.

### 2026-11-05 — P1c: HOÀN THÀNH API vận hành và báo cáo ban đầu

- Thêm `server/src/operations.js`, `server/test/operations.test.js`; sửa `rentals.js` khóa hợp đồng trước item, ngăn đóng khi thu hoạch chưa bàn giao; `helpers.js` tạo DB riêng mỗi file test.
- Tiến trình tuần tự, ngày thu hoạch dự kiến, cân nặng thu hoạch, nhận/giao theo chủ thuê, địa chỉ giao bắt buộc, trạng thái yêu cầu, thông báo/đã đọc, xác nhận tiền thủ công, dashboard/report/CSV có chống công thức.
- `scripts/test.ps1`: **13/13 PASS**, không skip. Có luồng thuê → fruiting → ready → harvest → delivery → xác nhận tiền → hoàn tất → thuê lại; dữ liệu khách trước không xuất hiện ở item mới.
- Chưa phải nghiệm thu UI hoặc tải/hiệu năng; báo cáo đang tổng hợp cơ bản, CSV giới hạn 10.000 dòng/lần.
- ĐANG LÀM P1d/P4a: device provisioning + HTTP ingest + environment ownership + thresholds + dry-run commands + simulator; tiêu chí test bearer device khác session user, telemetry thật trên DB, cảnh báo và không phát lệnh hardware.

### 2026-11-05 — P1d/P4a: HOÀN THÀNH API IoT mức dry-run

- Thêm `server/src/iot.js`, migration `002_iot_automation.sql`, `server/test/iot.test.js`, `iot/simulator.mjs`, `docs/API.md`; cập nhật app/foundation test.
- Cấp/đổi token device; ingest/validate/provenance theo mode; last seen; Customer đọc theo phòng và thời gian thuê; thresholds, cảnh báo in-app chống spam 5 phút; automation và manual commands chỉ dry-run có TTL/ack chống replay; camera HTTPS contract và ownership.
- `scripts/test.ps1`: **17/17 PASS**; migration dev chạy PASS (2 migrations). Tests dùng HTTP/DB thật, không dùng ESP32/cảm biến/camera thật. Không gọi là hardware PASS.
- Simulator CLI đã viết, chưa chạy riêng như một tiến trình; contract của simulator được test trực tiếp bằng HTTP.
- Hạn chế rõ: chưa phân trang đầy đủ; chưa tải/hiệu năng; camera gateway thực tế chưa có; điều khiển thật bị chặn, chưa có phần cứng an toàn được xác nhận. API contract đã ghi rõ.
- ĐANG LÀM P2: React local trong repo theo công nghệ đề tài; không đăng ký/publish/push dịch vụ ngoài. Tiêu chí: build PASS, trình duyệt thực thi login/staff/CRUD/thuê/giám sát và lỗi quyền khi môi trường cho phép.

### 2026-11-05 — P2: HOÀN THÀNH React Web bản đầu

- Tạo `web/package.json`, Vite config/index, `web/src/{main,App,components}.jsx`, `api.js`, `style.css`, `web/test/e2e.mjs`; npm workspace/root scripts/lockfile. Backend thêm `/customers` chỉ staff xem id/tên/email phục vụ gán thuê.
- UI có login staff, dashboard từ DB, CRUD phòng/khay/gói, gán thuê/chi tiết/progress/harvest/ledger/complete, giao nhận, thiết bị/token/automation dry-run, ngưỡng, cảm biến/biểu đồ/lịch sử theo phòng, camera contract, user management, in-app notifications, reports/CSV.
- `npm run build:web`: PASS. `npm run test:web` với Chrome thật headless và DB mới: PASS 5 nhóm luồng, không pageerror. Ảnh đã kiểm tra ở `.local/web-overview.png`, `.local/web-mobile.png` (không commit dữ liệu test).
- Lần E2E đầu FAIL do accessible label của select chứa text options; đã bổ sung aria-label rõ nghĩa và chạy lại PASS. Không bỏ qua test lỗi.
- Kiểm tra responsive 390px: không tràn ngang; test Customer bị chặn ở Web và thu hồi phiên Web, Operator không có menu admin. Build lại và backend regression **17/17 PASS** sau sửa.
- Chưa kiểm thử browser mọi nhánh user edit/camera thật hoặc tải lớn; giữ giới hạn danh sách ở API doc.
- ĐANG LÀM P3: tạo Flutter từ SDK (không dùng app cũ), Customer register/login/profile/catalog/rent/link/item/environment/camera/notifications/history/fulfillment. Tiêu chí analyze/test/build Web cho Dart; Android build nếu có toolchain.

## 4. Nhật ký quyết định, vấn đề cần người dùng xác nhận

- Chưa có.

### 2026-11-05 — P3 ĐANG LÀM (checkpoint giữa batch)

- Flutter SDK 3.47.9 tạo mới `mobile/` với Android/Web, org vn.edu.smartmushroom. Thêm http và url_launcher; `lib/api.dart`, `widgets.dart`, `screens.dart`, thay template main bằng app Customer; tests client/widget mới.
- Đã viết login/register/role guard, danh sách hợp đồng/lịch sử/giao dịch, catalog/chọn nhiều khay, liên kết, item/env/history/camera contract, harvest/nhận-giao, notifications và profile. Chưa kết luận hoàn thành trước analyze/test/build.
- `flutter doctor -v`: Chrome/Flutter có; **thiếu Android SDK**, nên APK/emulator CHƯA CHẠY; Visual Studio cũng thiếu nhưng Windows desktop không phải target đồ án.
- Analyze đầu tiên FAIL vì test counter của template còn tham chiếu MyApp và lint curly braces. Đã thay test template bằng tests Customer và đang sửa lint, chạy lại analyze/test/build. Một lần ghi test sai thư mục `mobile/mobile/...` thất bại, đã sửa đường dẫn, không ảnh hưởng dữ liệu.
- Nếu phiên ngắt: kiểm tra `mobile/lib`, `mobile/test`, chạy `flutter analyze`, `flutter test`, `flutter build web --no-wasm-dry-run`; chưa đánh dấu P3 PASS.

### 2026-11-05 — P3: HOÀN THÀNH Flutter Customer bản đầu (giới hạn Android)

- Tạo source Flutter hoàn toàn mới bằng SDK; UI và API client ở `mobile/lib/`, unit/widget tests `mobile/test/`, live contract `mobile/integration/api_live_test.dart`; Node runner `scripts/test-mobile-api.mjs` và script root `test:mobile:api`.
- `flutter analyze`: PASS, không issue sau sửa test template/lint. `flutter test`: **5/5 PASS**, client/widget dùng MockClient, ghi đúng là mock. `flutter build web --no-wasm-dry-run`: PASS.
- `npm run test:mobile:api`: **1/1 PASS** — chính MushroomApi/Dart gọi Express/PostgreSQL thật trong DB test mới; login → catalog → rent → link → sensor simulator → environment → profile → notifications → logout. Không giả backend trong bài test này.
- Android INTERNET permission ở main, cleartext HTTP chỉ cho debug; release cần HTTPS. Session giữ RAM, khi mất phiên đổi root navigator để không để màn chi tiết của user cũ trên stack.
- Chưa có Android SDK nên APK/emulator/điện thoại thật CHƯA CHẠY. Flutter Web build chưa browser E2E riêng; widget tests không thay thế nghiệm thu trên điện thoại.
- ĐANG LÀM P4: firmware ESP32 Arduino với SCD4x (nhiệt/ẩm/CO₂), TLS CA, retry có giới hạn, chế độ mô phỏng, không bật relay thật; compile hai nhánh, hướng dẫn wiring/dry-run. Chưa có xác nhận hardware nên không upload/chạy thiết bị.

### 2026-11-05 14:48 (Asia/Saigon) — P4: HOÀN THÀNH compile/mô phỏng, phần cứng chưa nghiệm thu

- Tạo firmware `iot/esp32/SmartMushroom/{SmartMushroom.ino,config.example.h}`, `iot/README.md`, `scripts/compile-iot.ps1`; ADR-012, API `/iot/me`, simulator kiểm tra mode; thêm `server/test/simulator.test.js`.
- `scripts/compile-iot.ps1`: **PASS 2/2** với ESP32 core 3.3.3, ArduinoJson/Sensirion libs. Nhánh SM_SIMULATION=1: flash 1.014.295 B (77%), RAM 45.476 B (13%); nhánh SCD4x=0: flash 1.039.835 B (79%), RAM 46.876 B (14%). Artifact `.local/iot-build-{1,0}` bị gitignore.
- Backend + executable simulator: **18/18 PASS**. Simulator gửi 2 mẫu qua HTTP, lưu DB, auto dry-run ack, từ chối token hardware. Không xem đây là cảm biến/ESP32 thật.
- Firmware hỗ trợ TLS CA/NTP, timeout/reconnect, sample validation, khớp device mode, không xếp hàng mẫu cũ, không GPIO relay. Không upload; SCD4x/BOM/chân nguồn/relay/camera chưa được người dùng xác nhận.
- `mobile/HUONG_DAN.md` đã ghi cách run/build/live test và giới hạn Android; Flutter analyze lại PASS sau thêm integration test.
- ĐANG LÀM P5/P6: Docker Compose/Nginx, CI/installation/user guide, UML class/state/deployment, rà soát auth/bootstrap/config/test và tính nhất quán checklist. Docker engine chưa có trên máy, phải ghi CHƯA CHẠY container runtime.

### 2026-11-05 — P5: HOÀN THÀNH kiểm thử local và cấu hình triển khai ban đầu

- Thêm `server/test/security.test.js`: CLI bootstrap thực, từ chối admin thứ hai/không log secret, malformed JSON/body limit, user create/role/soft-delete và staff customer projection. Tổng backend **21/21 PASS**.
- Thêm `scripts/verify-backup.mjs`, root `test:backup`: **PASS** `pg_dump -Fc` → `pg_restore` vào database **MỚI** `sm_test_restore_*`, xác minh user và migrations; không xóa/ghi đè DB nào. Dump dữ liệu test ở `.local/backups` gitignore.
- Thêm `compose.yaml`, `server/Dockerfile`, `web/Dockerfile`, `.dockerignore`, `.env.example`, `deploy/nginx.conf`, `.github/workflows/verify.yml`; cấu hình migration one-shot, readiness, API nội bộ, web bind localhost8080, reverse proxy + CSP. Proxy hops mặc định 0, Compose đặt 1 chỉ khi API sau Nginx.
- **CHƯA CHẠY Docker build/compose và GitHub Actions** vì Docker không có và chưa push. File cấu hình không phải bằng chứng deploy thành công. Chưa có domain/TLS production hay signing Android.
- Không tự push, không tạo deploy bên ngoài. Thiết kế còn giới hạn pagination/retention và chưa tải benchmark; phải nêu ở docs/final.
- ĐANG LÀM P6: hoàn thiện user requirements, thiết kế chi tiết/UML, hướng dẫn cài/triển khai/vận hành/test plan và bảng kiểm phản ánh mức thực tế; chạy xác minh cuối sau thay đổi có liên quan.

### 2026-11-05 — P6: HOÀN THÀNH bộ tài liệu bản đầu và kiểm tra cấu hình

- Thêm `docs/{USER_REQUIREMENTS,THIET_KE_CHI_TIET,CAI_DAT_TRIEN_KHAI,HUONG_DAN_SU_DUNG,TEST_PLAN}.md`; source UML class/state/activity/deployment; render đủ 6 diagram PNG ở `docs/uml/rendered/`. Viết lại README/checklist theo code thực tế, giữ tài liệu yêu cầu và nhật ký lỗi cũ.
- Thêm `.gitattributes` cố định LF cho source/migration để checksum không lệch khi checkout khác nền tảng; script `render-uml.ps1`. Không đưa binary runtime/credentials/dump vào Git.
- Tải Compose CLI5.7.0, Temurin JRE21.0.13 và PlantUML1.2026.9 từ publisher chính thức vào `.local/tools`; kiểm tra SHA256 trước thực thi. Chỉ là công cụ mới, không lấy app/code/data cũ.
- Compose `config --quiet`: **PASS**, không kết nối Engine/DB. Lần kiểm checksum đầu FAIL do PowerShell trả byte[] mà bị ép chuỗi; đã giải mã UTF8 và so khớp PASS trước khi chạy binary. **Docker build/up vẫn CHƯA CHẠY**.
- `scripts/render-uml.ps1`: **PASS 6/6**, đã xem ảnh sequence. Lần gọi Java đầu FAIL do PowerShell phân tách tham số -D; quote tham số, render lại PASS. Không coi lỗi công cụ là đã test app.
- Bộ docs phân biệt API/browser/mock/live-Dart/firmwarecompile/hardware; nêu rõ production/Android/relay/live camera chưa nghiệm thu và các giới hạn phiên bản.
- Source/tài liệu chưa commit; không push. DB dev mới còn chạy tại127.0.0.1:55439; test API/Vite/Chrome đã được teardown. Test DB/dump/artifacts chỉ ở vùng local bị ignore. Không có phần mềm cũ được phục hồi.
- Checkpoint cuối: `git diff --check` PASS; `git check-ignore` xác nhận `.local/database.env`, tool binaries và Android local.properties bị ignore. Cảnh báo Git LF/CRLF ở Markdown không phải lỗi whitespace. Không có test đang chạy cần poll tiếp.

## 5. Tiêu chí để gọi một phần là hoàn thành

### 2026-11-05 — ĐANG LÀM: review và kiểm thử cuối toàn đồ án

- Bắt đầu từ HEAD `861f597`, working tree sạch; không làm lại source hoặc nhập dữ liệu dự án khác.
- Phạm vi: đọc source và rà soát invariants DB/ownership/concurrency, auth/session, vòng đời thuê/thu hoạch/nhận-giao, UI states, firmware safety, Docker/CI và tài liệu; chạy toàn bộ bộ test/build có môi trường.
- Tiêu chí: lỗi tái hiện được phải có test regression và sửa; ghi báo cáo kết quả thực tế, giới hạn Android/Docker/hardware, commit/push an toàn. Không suy ra mọi yêu cầu đã hoàn thành chỉ vì các test hiện có PASS.
- Đã tái hiện lỗi backend R01–R06 (báo cáo `docs/REVIEW_CUOI.md`): password reset/login race, mất microsecond ở ranh giới tenant, PATCH default ghi đè, sửa label khay thuê bị chặn, xóa mềm Customer còn thuê, token device rotate/ingest race. Có8 regression cases, đã sửa source và đang xác minh full suite.
- Baseline24/24 PASS và npm audit0 vulnerabilities. CI remote861f597 thực tế FAIL ở bước Flutter UI E2E cuối (staff denied assertion), đang điều tra; không giữ nhận định CI chưa chạy như trước.
- Batch sửa backend R01–R06 **HOÀN THÀNH**, `scripts/test.ps1` **32/32 PASS**, không skip; không đổi migration đã apply. Cập nhật catalog/auth/users/iot và8 regression cases. Firmware baseline compile **2/2 PASS**. Review toàn đồ án vẫn ĐANG LÀM, tiếp theo UI/session state và CI.

### 2026-11-05 — ĐANG LÀM: quy tắc lưu Git và baseline hiện tại

- Người dùng cho phép tự commit/push lên nhánh hiện tại sau mỗi giai đoạn đã kiểm chứng; WIP được phép khi cần, không đánh dấu hoàn thành sai. Đã bổ sung mục 8 AGENTS, điều chỉnh ranh giới push cũ và README cho thống nhất.
- Khảo sát thực tế: nhánh `main`, remote `origin` là GitHub repo hiện tại; HEAD còn là commit tài liệu khởi tạo, toàn bộ source mới từ phiên trước chưa commit. Không dùng source/dữ liệu dự án khác.
- Tiêu chí batch: rà soát code/staged diff/secret, chạy lại test/build phù hợp rồi commit baseline mới và thử push thông thường. Nếu lỗi sẽ lưu nguyên nhân đã loại bỏ secret tại đây.
- Batch tiếp theo: pagination/filter lịch sử thuê, giữ ownership trên từng trang, có UI React/Flutter và test dữ liệu vượt giới hạn trang. Không làm lại source đã có.
- Đã chạy lại baseline: backend21/21 PASS, React build + Chrome E2E5 nhóm PASS, Flutter analyze/5 tests/Web build PASS và Dart live API1/1 PASS. Chưa sửa các module nghiệp vụ trong batch này.
- Preflight Git ban đầu báo `Author identity unknown`; người dùng cung cấp username `mired273mh`. Đã xác minh GitHub ID247734525, chọn địa chỉ noreply chuẩn GitHub cho tài khoản để cấu hình local (không suy đoán email cá nhân).
- Fetch cho thấy `origin/main` có commit `5756f5b` chỉ sửa tiêu đề README. Giữ tiêu đề đó trong README hiện tại; sẽ tích hợp commit remote bằng merge thông thường, không force/rebase/reset hay xóa lịch sử.
- **Commit baseline thành công:** `afc0a23` — source ứng dụng đã kiểm chứng và quy tắc Git mới; staged diff/whitespace/123 file đã kiểm tra. Scan đầu báo nhầm biến PowerShell `$pgPassword` là literal, đã rà soát đây là mật khẩu ngẫu nhiên runtime và điều chỉnh kiểm tra; không có secret thật được stage. `.env`, DB/dump/local tools giữ ngoài Git.
- **Tích hợp remote:** merge thông thường `origin/main` thành công, giữ commit tiêu đề README của người dùng; không rewrite history.
- **Push main THẤT BẠI:** `git push origin HEAD:refs/heads/main` báo `could not read Username for https://github.com: terminal prompts disabled` (chưa có credential GitHub cho Git). Không hỏi token trong chat, không force push; code đã nằm trong commit local. Đang kiểm tra credential helper có sẵn, phần pagination tiếp tục độc lập.

### 2026-11-05 — HOÀN THÀNH: phân trang/filter lịch sử thuê xuyên suốt

- Phạm vi nhỏ: GET /rentals có cursor ổn định theo starts_at/id, lọc trạng thái và customer_id cho staff; Customer vẫn chỉ thấy của mình. React/Flutter có điều hướng trang và lọc trạng thái; giữ shape `data` để không phá client cũ.
- Tiêu chí: dữ liệu >100 hợp đồng, timestamp trùng/microsecond không mất/lặp bản ghi, kiểm tra ownership/filter/cursor sai; React browser paging, Flutter widget/live API và build PASS trước commit giai đoạn.
- Đã có migration003/index, `server/src/rental-pagination.js`, route giữ ownership + metadata; fixtures lịch sử và test mới. Backend **24/24 PASS**, React build + Chrome E2E **6 nhóm PASS** (122 hợp đồng, pager390px).
- Flutter test đầu phát hiện callback setState trả về Future trong load và helper refresh chung; đã đổi sang block đồng bộ, thêm regression pull-refresh. Analyze sạch trước lỗi widget; đang chạy lại Flutter test/build, chưa ghi giai đoạn hoàn thành.
- Kết quả sau sửa: Flutter **7/7 PASS**, analyze sạch, Web build PASS. Test lỗi HTTP nhanh còn phát hiện Future chưa được UI subscribe; đã quan sát Future ngay, vẫn hiển thị lỗi/retry qua FutureBuilder và test đã PASS. Không bỏ qua lỗi.
- `npm run test:mobile:api`: **1/1 PASS** sau thêm25 hợp đồng fixtures; client Dart kiểm tra cursor, lọc completed12 hợp đồng và không lộ chủ thuê khác. Migration dev3 verified và `npm run test:backup` PASS với3 migrations trên DB phục hồi mới.
- File chính: rental-pagination.js, migration003, route/tests/fixtures backend; React api/App/components/style/E2E; Flutter api/screens/widgets + paging/pull-refresh tests; runner live API và docs. Cần commit/push theo mục8; không đánh dấu Docker/Android/hardware hoàn thành.
- **Đã commit:** `8e0092a` trên main sau staged scan29 file/whitespace PASS. **Push thất bại lần batch này:** cùng lỗi thiếu credential GitHub (`could not read Username ... terminal prompts disabled`). Không force push hay đổi remote; giữ commit local. Cần người dùng đăng nhập GitHub qua Git Credential Manager/VS Code trên máy, không gửi mật khẩu/token trong chat. Không tiếp tục retry cùng lỗi nếu chưa có thay đổi xác thực.

### 2026-11-05 — HOÀN THÀNH: Flutter UI E2E trên browser

- Dùng bản Flutter Web vừa build, Chrome headless, API/DB test mới; không gọi là test Android/điện thoại thật.
- Tiêu chí: tương tác UI Customer đăng ký/thuê/theo dõi/nhận-giao/thông báo/hồ sơ, API lưu thật, không Flutter/page exception. Tách khỏi mock widget và live Dart contract.
- Thêm `scripts/test-mobile-web.mjs`, root script `test:mobile:web` và CI step sau Flutter build; cập nhật hướng dẫn/checklist/test plan. Harness tự tạo API/DB test và static proxy cùng origin, Chrome dùng Semantics. Không upload/deploy, không test Android.
- Lần đầu E2E đầy đủ FAIL do selector text không khớp Semantics tab/menuitem/merged text; đã kiểm tra screenshot/labels và sửa locator theo accessible role/name. Không thay đổi app để né test, không bỏ các assertion nghiệp vụ.
- `npm run test:mobile:web`: **PASS4 nhóm**, đăng ký/login → thuê2 khay → theo dõi nhiệt/ẩm/CO₂ simulator/camera trống → liên kết đúng chủ → giao hàng/address validation/hủy-gửi lại → đánh dấu thông báo đọc → sửa hồ sơ → logout → staff login denied. Kiểm tra DB thật sau hành động và không Flutter/JS exception.
- Ảnh QA `.local/flutter-customer.png`, diagnostics failures `.local/flutter-failure.png`/`flutter-semantics.json`, đều gitignore. Không dùng dữ liệu app thật. Browser/server test đã teardown. Các giới hạn Android/hardware/production giữ nguyên.
- Preflight Git cuối batch: `git credential-manager github list` vẫn không có tài khoản; không retry push cùng lỗi khi xác thực chưa thay đổi. Hai lỗi push trước đã ghi rõ ở trên. Batch UI E2E được lưu bằng commit local sau rà soát staged diff/secret/whitespace; cần đăng nhập GitHub trên máy rồi push các commit main đang ahead. Không dùng force/rebase/reset.

### 2026-11-05 — HOÀN THÀNH: đồng bộ GitHub sau khi người dùng đăng nhập

- Người dùng xác nhận đã đăng nhập; kiểm tra GCM thấy tài khoản `mired273mh`. Working tree/index sạch, HEAD03cccf6 đúng bản đã kiểm chứng ở batch trước, không có thay đổi ứng dụng mới.
- `git fetch origin main` PASS; trước push local ahead4/behind0. Đã kiểm tra diff/whitespace và danh sách tracked không có `.env` thật, `.local`, dump, keystore hoặc config.local.h.
- `git push origin HEAD:refs/heads/main` **PASS**, GitHub cập nhật `5756f5b..03cccf6`. Bao gồm baseline/AGENTS (`afc0a23`), merge giữ thay đổi README (`18dac28`), pagination (`8e0092a`), Flutter UI E2E (`03cccf6`). Không force push, không sửa/xóa lịch sử.
- Hai lỗi push thiếu credential trước đây **ĐÃ XỬ LÝ**; giữ nguyên bản ghi lỗi làm lịch sử. Không lưu token/mật khẩu GitHub trong repo hay log.
- Chỉ cập nhật tiến độ/bằng chứng Git trong lượt này; không chạy lại build/test ứng dụng vì source không thay đổi so với bản24 backend tests/7 Flutter tests/React6 nhóm/Flutter UI4 nhóm đã PASS. Push thành công không phải bằng chứng CI remote/Android/hardware đã PASS.

- Có file source/di trú/cấu hình tương ứng và tài liệu chạy.
- Đã chạy kiểm tra phù hợp hoặc nêu rõ giới hạn kiểm thử.
- Đúng quyền truy cập, không dùng dữ liệu giả để giả mạo kết quả thật.
- Checkbox trong `docs/BANG_KIEM_CHUC_NANG.md` được cập nhật có bằng chứng.
