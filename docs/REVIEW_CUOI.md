# Review và kiểm thử cuối — 2026-11-05

Trạng thái: **ĐANG LÀM**. Bản đầu vào: `861f597`. Các kết quả lịch sử không thay thế lần chạy kiểm tra này.

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
| R07 | Chưa kết luận | GitHub CI861f597 FAIL ở assertion Flutter Web staff-login denied; mọi bước trước đó PASS | Đang kiểm tra harness và chờ chạy lại CI sau sửa |

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
