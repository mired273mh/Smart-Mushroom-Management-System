# Review và kiểm thử cuối — 2026-11-05

**Checkpoint HQTCSDL2026-11-06:** xem [báo cáo nghiệm thu mới nhất](NGHIEM_THU_HQTCSDL.md). Backend50/50, React4tests/13Chrome groups, Flutter15tests/Dart/browser/Android,9SQLdemo và native smoke đã kiểm chứng theo từng phạm vi. Lịch sử dưới đây giữ nguyên; không dùng số test/CI cũ thay trạng thái HEAD hoặc suy hardware/production PASS.

Trạng thái: **ĐÃ REVIEW/SỬA LỖI VÀ KIỂM THỬ PHẦN MỀM; CHƯA NGHIỆM THU TOÀN ĐỀ TÀI VẬT LÝ/PRODUCTION**. Bản đầu vào: `861f597`. Các kết quả lịch sử không thay thế lần chạy kiểm tra này.

Đã phát hiện và sửa các lỗi phân quyền theo thời gian, race reset/token, PATCH ghi đè trạng thái, vòng đời tài khoản đang thuê, session giữa2 client, catalog selection và dữ liệu đổi trang. Đã thêm regression thay vì chỉ dựa vào bộ test cũ. **CI toàn bộ PASS** trên Linux tại [run42005126537](https://github.com/mired273mh/Smart-Mushroom-Management-System/actions/runs/42005126537), bản `3c14bc8`, gồm cả2 job api-web và deployment. Các lần FAIL phía dưới được giữ làm bằng chứng xử lý lỗi, không phải kết quả cuối.

Phạm vi: PostgreSQL/migration/invariants, API/auth/RBAC/ownership/concurrency, React/Flutter UI và client, ESP32/simulator, dependency/security, cấu hình triển khai/CI và tính đúng của tài liệu.

Không chạy lệnh điều khiển thiết bị thật, không xóa DB/lịch sử Git, không ghi đè dữ liệu thật. Kiểm thử DB dùng `sm_test_*` mới. Các phần thiếu môi trường/phần cứng phải ghi CHƯA CHẠY.

## Phát hiện đã tái hiện

| Mã | Mức | Phát hiện / bằng chứng ban đầu | Xử lý |
|---|---|---|---|
| R01 | Cao | Login đang chờ có thể tạo session bằng mật khẩu cũ sau reset; regression nhận200 thay vì401 | Serialize kiểm tra mật khẩu/cấp phiên với user row lock trong transaction |
| R02 | Cao | Date JavaScript làm mất microsecond, API trả mẫu phòng sớm hơn lúc thuê; regression thấy2 mẫu thay vì1 | So ranh giới thời gian trực tiếp trong PostgreSQL |
| R03 | Vừa | Zod defaults trong PATCH partial tự bật lại room/plan và đổi tray maintenance thành available | Defaults chỉ áp dụng lúc tạo; PATCH chỉ cập nhật trường được gửi |
| R04 | Vừa | Form sửa tên khay đang thuê bị409 vì gửi room_id không đổi | Chỉ chặn khi room/status thực sự thay đổi |
| R05 | Vừa | Xóa mềm Customer còn hợp đồng active khiến không thể đăng nhập hoàn tất yêu cầu nhận/giao | Từ chối xóa mềm khi còn thuê active; khóa tạm vẫn có thể bật lại |
| R06 | Vừa | Ingest chờ room lock vẫn nhận token vừa bị rotate; regression201 thay vì401 | Revalidate token/active room/device trong transaction, khóa device |
| R07 | Harness, đã xử lý | GitHub CI861f597 FAIL ở assertion Flutter Web staff-login denied; các run sau xác định sai editor/focus | Focus đúng input/đợi frame/xác nhận payload; CI3c14bc8 toàn bộ PASS |

Tái hiện tại `server/test/review-regression.test.js`. Lần test đầu có một fixture mã khay lowercase bị422; đã sửa fixture thành uppercase và chạy riêng tái hiện đúng bug maintenance→available. Không xem lỗi fixture là lỗi sản phẩm.

Baseline trước sửa: backend24/24 PASS; npm audit0 lỗ hổng được báo. Baseline PASS không phát hiện các trường hợp regression mới phía trên.

R01–R06 **ĐÃ SỬA**, full backend **32/32 PASS** sau sửa, gồm8 regression cases (R03 kiểm tra riêng room/plan/tray). Không có migration phá hủy hoặc thay đổi dữ liệu thật. Firmware baseline compile **2/2 PASS**, chưa upload/hardware test. Review UI/CI tiếp tục, chưa kết luận toàn đồ án đạt nghiệm thu.

## Review UI/session state

- **R08 (Cao, đã tái hiện):** Flutter nhận401 từ request phiên cũ sau khi người dùng khác đăng nhập sẽ xóa phiên mới; phản hồi sửa hồ sơ cũ còn có thể gán lại dữ liệu user cũ. Đã scope request/profile theo token phát hành request; có2 regression tests trước sửa FAIL.
- **R09 (Vừa, đã tái hiện):** catalog refresh vẫn giữ khay/gói không còn khả dụng, dẫn đến nút thuê gửi lựa chọn không thể bỏ trong danh sách. Đã đồng bộ selection với catalog mới; widget regression trước sửa FAIL.
- **R10 (Vừa, đã tái hiện):** React không xóa được mô tả phòng vì bỏ qua optional text rỗng. Đã phân biệt text rỗng cần lưu với password/date cần bỏ qua; browser assertion trước sửa FAIL.
- **R11 (Cao, đã tái hiện):** React nhận401 từ request cũ làm đăng xuất tài khoản mới. Browser fault-injection đã tái hiện; scope expired handler theo token hiện hành.
- Web build +2 API client tests +7 nhóm Chrome E2E PASS sau sửa; error HTML gateway được báo đọc được, callback401 vẫn gắn token request. Flutter analyze sạch; đang tổng hợp kết quả test/build/UI E2E.
- Bổ sung R08/R11: logout cũ đến sau401 và đăng nhập mới không còn xóa phiên mới (Dart regression trước sửa FAIL; Chrome E2E riêng PASS). Flutter401 có HTML thay JSON vẫn phải hết phiên; regression trước sửa FAIL, đã chuyển xử lý401 trước parse body.
- Kết quả UI cuối batch: React build,2 client tests +8 nhóm Chrome E2E **PASS**; Flutter analyze sạch, **12/12** unit/widget tests, Web build, **1/1** live Dart API test và **4 nhóm** Chrome UI E2E **PASS**. Chưa kết luận Android/điện thoại thật. R07 sửa locator chịu được whitespace của Semantics và thêm assertion login role/logout204; đang chờ CI Linux thực tế.

## Firmware, triển khai và đo tải

- **R12 (Vừa, chế độ dev, phát hiện qua code review):** allowlist HTTP dùng startsWith nên nhận cả `http://10.evil.invalid` hoặc `http://10.0.0.1@evil.invalid`, có thể gửi device token plaintext ra ngoài LAN khi chủ động bật HTTP. Default HTTP vẫn tắt. Thay bằng parser literal IPv4 RFC1918/port, từ chối hostname/userinfo/octet sai/leading zero/path;17 static assertions chạy qua compiler ESP32 ở cả2 mode PASS. Không gọi là kiểm thử mạng/thiết bị thật.
- Firmware sau sửa: `compile-iot.ps1` **2/2 PASS**; mô phỏng1014295 bytes flash/45476 RAM, sensing1039835/46876. Compose config và render6 UML **PASS**. Không upload, không GPIO.
- `npm run test:load` **PASS**:20 tài khoản khác nhau,400 rentals,1000 samples,200 request đọc,0 lỗi. Windows/Node22.23.4/HTTP loopback/PostgreSQL17; p95 `/rentals?limit=20`33,42ms, environment100 mẫu42,07ms.100 mẫu đo/route sau warmup; không đo login, WAN/TLS, ghi đồng thời hoặc tải kéo dài; không suy ra capacity production.
- **R07 vẫn đang xử lý:** CI85fb2b2 run42001922428 FAIL. Artifact cho thấy login401/sai thông tin; assertion lỗi bị promise chờ logout ghi đè trong teardown. Đã chuyển helper nhập qua native editor sau Semantics focus, xác nhận payload khớp fixture và xử lý promise teardown.4 nhóm Flutter UI local PASS lại; cần CI Linux để kết luận. Không gọi sửa locator whitespace trước đó là đã xử lý dứt điểm.
- Bổ sung CI job build/up Compose và smoke PostgreSQL/migration/Express/Nginx/assets/auth; chưa chạy được trên máy Windows thiếu Engine. Chỉ đánh dấu PASS sau run remote thực tế.
- CI740ea61 run42003072419: **deployment job PASS** — đã thực sự build image, up PostgreSQL/migration/API/Nginx/React và smoke login/DB/CSP/logout trên Linux Docker. API-Web job FAIL trước Flutter ở responsive pager390px (e2e dòng147), font Linux làm controls vượt chiều ngang. **R13 (Vừa):** thêm flex-wrap cho pager; giữ nguyên assertion không tràn, đang chạy lại local/CI. Không coi lần run này là CI tổng PASS.
- CIa34bd38 run42003530326: deployment PASS tiếp, Web FAIL tại dòng140: đã thấy nhãn Trang1 nhưng chưa có table rows khi assertion chạy. **R14 (Vừa):** useData trả dữ liệu query trước trong render mới trước khi useEffect chuyển loading, có thể gắn nhầm dữ liệu cũ vào trang/filter mới. Đã gắn state với scope query ngay lúc render, giữ cleanup chống response cũ; React build/2 tests/8 nhóm E2E local PASS. R13 là hardening layout, nguyên nhân font của lần trước là suy luận chưa chứng minh; thêm artifact screenshot/layout nếu còn lỗi.
- CIbcc138a run42004176690: backend/React/benchmark/Flutter analyze+test+build/live API và deployment **PASS**, Flutter UI FAIL tại staff login (không có request). Artifact thấy Email rỗng/validation; helper generic `input:focus` vẫn có thể trỏ editor trước khi Flutter chuyển focus. Đã target chính input có aria-label, chờ focus đúng nhãn và2 animation frames, kiểm tra giá trị sau blur, không log giá trị. Cần run mới để kết luận R07; không bỏ assertion nghiệp vụ.

## Ma trận kiểm tra cuối

| Hạng mục / lệnh | Kết quả đã quan sát | Phạm vi |
|---|---|---|
| `scripts/test.ps1` / `npm test` |32/32 PASS | HTTP/PostgreSQL thật,8 regression mới; không skip |
| `npm run build:web`, `npm run test:web` |Build +2 tests +8 nhóm E2E PASS | Chrome, DB thật; ownership, CRUD, thuê/thu hoạch/giao nhận, paging, session race,390px |
| `flutter analyze`, `flutter test` |Sạch +12/12 PASS | Unit/widget dùng MockClient; không gọi là test thiết bị |
| `flutter build web --no-wasm-dry-run` |PASS | Flutter Web production build |
| `npm run test:mobile:api` |1/1 PASS | Dart client → Express → PostgreSQL thật |
| `npm run test:mobile:web` |4 nhóm local +Linux CI PASS | UI Flutter Web, DB thật, mẫu IoT simulator; staff login/logout được xác nhận HTTP |
| `npm run db:migrate` lặp2 lần |Verified3/3 cả2 lần | Không xóa DB, migration idempotent |
| `npm run test:backup` |PASS | pg_dump custom → pg_restore DB mới, dữ liệu/migrations đúng |
| `scripts/compile-iot.ps1` |2/2 PASS +17 URL assertions | Compile ESP32 sim/sensing; không flash/đọc sensor/relay |
| Compose config + deployment CI job |PASS | Docker image build/up, migrate/bootstrap, Nginx/assets/CSP, auth/DB/logout thật trên Ubuntu |
| `npm run test:load` |200 request/20 users,0 lỗi |2 route đọc, p95 local33,42–42,07ms; dataset400 rentals/1000 readings |
| `npm audit --json` |0 vulnerabilities được báo | Chỉ advisory dependencies npm tại thời điểm chạy; không phải pentest/OS image scan |
| `scripts/render-uml.ps1`, Markdown links |6/6 render;22 docs/21 links không thiếu đích | Không thay đánh giá UML học thuật |
| Scan tracked/staged + `git diff --check` |PASS ở các checkpoint | Không thấy secret thật/.env thật/dump/private key trong file commit; `.local` giữ riêng |
| GitHub Actions đầy đủ |**PASS** run42005126537/3c14bc8 | Cả api-web và deployment success; không skip test để đạt CI |

Thử bổ sung Chrome CPU throttle6x: lần đầu **FAIL** timeout15s tại Back thứ2; screenshot đã về đúng chi tiết hợp đồng, tooltip/focus làm accessible name thay đổi trong chuyển route. Harness chờ heading của route đích, dùng prefix Back và đưa pointer ra ngoài tooltip; chạy lại **4 nhóm PASS** dưới6x. Không thay đổi app, không coi đây là soak test hoặc benchmark mobile. Bản chốt docs/harness sẽ được push theo AGENTS; CI run nói trên gắn rõ commit đã xác minh, không gán nhầm sang commit chưa chạy.

## Những việc còn thiếu trước nghiệm thu toàn đề tài

1. **Điều khiển vật lý chưa triển khai:** không có driver GPIO/relay; manual/automatic hiện là dry-run. Cần BOM/sơ đồ/giới hạn an toàn, fail-safe và thử từng tải sau xác nhận phần cứng.
2. **Sensor/camera thật chưa nghiệm thu:** SCD4x mới compile, telemetry test là simulator; camera mới contract URL HTTPS, chưa live feed/gateway bảo vệ quyền xem.
3. **Android chưa build/chạy:** máy kiểm thử thiếu Android SDK; Web E2E không thay APK/emulator/phone, signing hoặc kiểm thử mạng/nền trên mobile.
4. **Vận hành production chưa nghiệm thu:** domain/TLS, lịch backup/retention, theo dõi dung lượng, mất DB/Wi-Fi kéo dài, soak/restore RTO/RPO và workload production. Docker smoke CI chỉ dùng DB test mới; Windows local thiếu Engine.
5. **Giới hạn phần mềm đã biết:** chỉ lịch sử thuê có cursor đầy đủ; catalog/users/notifications/telemetry và các list khác còn bounded, chưa UI truy cập mọi bản ghi khi vượt cap. Tiến trình nuôi trồng hiện gắn rental item, chưa có chu kỳ nuôi cho khay không cho thuê. Thông báo in-app/polling khi trang hoạt động, không OS push.

Các mục trên phải giữ trạng thái thiếu/chưa kiểm chứng trong bảng kiểm; không dùng kết quả PASS phần mềm để tuyên bố đồ án vật lý/production hoàn chỉnh.

## File thay đổi trong lượt review

- Backend: `server/src/{auth,catalog,iot,users}.js`, `server/test/review-regression.test.js`.
- React: `web/src/{App,api,components,style}`, `web/test/{api.test,e2e}.mjs`, `web/package.json`.
- Flutter: `mobile/lib/{api,screens}.dart`, `mobile/test/review_session_catalog_test.dart`; harness `scripts/test-mobile-web.mjs`.
- IoT: `iot/esp32/SmartMushroom/{SmartMushroom.ino,url_policy.h}`, `iot/README.md`.
- Xác minh/CI: `scripts/{test-load,test-deployment}.mjs`, `package.json`, `.github/workflows/verify.yml`.
- Tài liệu: `README.md`, `TIEN_DO_CODEX.md`, `docs/{REVIEW_CUOI,KIEM_THU,BANG_KIEM_CHUC_NANG,TEST_PLAN,SRS,CAI_DAT_TRIEN_KHAI}.md`. Không đổi migration/schema hoặc dữ liệu thật trong lượt review.
