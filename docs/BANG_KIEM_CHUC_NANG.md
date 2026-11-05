# Bảng kiểm chức năng — checkpoint 2026-11-05

Ký hiệu: ☑ có code và kiểm chứng theo bằng chứng ghi; ◐ có một phần hoặc chưa nghiệm thu môi trường đích. Một test API không tự chứng minh mọi nhánh giao diện/hardware. Chi tiết lệnh và lịch sử FAIL/PASS ở KIEM_THU.md.

Cleanup2026-11-05: giữ toàn bộ source/migration/test/UML và dữ liệu; bỏ cache/local one-off/Cupertino unused. Backend38, React2+11 nhóm, Flutter analyze/12tests/APK, firmware3profiles và Compose config/images đều PASS sau dọn. Không thay trạng thái nghiệm thu hardware/camera/production hoặc đánh dấu xong backlog. [Phân loại, file và bằng chứng cleanup](DON_DEP_REPOSITORY.md).

**Master checkpoint:** bảng6 cột file/trạng thái/bằng chứng/việc tiếp theo cho32 ID tại [DOI_CHIEU_YEU_CAU.md](DOI_CHIEU_YEU_CAU.md). Android APK/emulator UI+SQL và Docker Windows runtime đã PASS; các ghi chú lịch sử chưa Android/Docker bên dưới được thay bởi checkpoint này. Phone/hardware/production còn chưa nghiệm thu.

Master2/master3: GPIO source có khóa hai lớp và pulse/interlock/TTL đã compile3 profile, API38tests/React11 nhóm E2E PASS; lịch sử lệnh có ACK/result/expiry. CI8431262/run42039533054 PASS3jobs;7e13b68 đã push, CI còn chạy tại checkpoint. Chưa flash/nghiệm thu tải điện; [BOM/sơ đồ cần xác nhận](PHUONG_AN_PHAN_CUNG_IOT.md).

| ID | Chức năng | Mã thực tế | Bằng chứng / giới hạn |
|---|---|---|---|
| A01 | Tạo tài khoản quản trị an toàn | ☑ CLI + Admin Web tạo bổ sung | security.test: bootstrap thật một lần, không log secret; public register không nâng quyền |
| A02 | Đăng nhập | ☑ API + React | foundation + Chrome E2E, session/hash/revoke/expiry |
| A03 | Tài khoản/vai trò/khóa/xóa/reset | ☑ API + React | security/rentals: create/role/soft-delete/reset/revoke/last admin; chặn xóa Customer còn thuê; reset/login race regression PASS |
| A04 | CRUD phòng | ☑ API + React | Browser create; FK/khóa phòng đang thuê test; code edit/delete; PATCH không ghi đè trường bỏ qua PASS |
| A05 | Quản lý/định danh/phân công khay | ☑ API + React | Unique code, ownership, room/status guard, browser phân công |
| A06 | Gói thuê/chính sách giá | ☑ API + React | Tạo/sửa/giá snapshot; browser create |
| A07 | Thiết bị/cảm biến/camera | ◐ API + React + firmware | Provision/rotate/disable/mode/provenance PASS; sensor/camera thật chưa test |
| A08 | Dashboard/báo cáo | ☑ API + React bản cơ bản | DB dashboard/report aggregates; benchmark đọc rental/env20 users PASS, chưa tải lớn/production |
| A09 | Xuất dữ liệu | ☑ CSV API + React | Formula escaping test, download Chrome; tối đa10.000 bản ghi |
| A10 | Ngưỡng/thông báo | ☑ API + React | Threshold validation/RBAC/alert dedup tests; ngưỡng dev chưa hiệu chuẩn giống nấm |
| O01 | Đăng nhập | ☑ API + React | Operator browser login/menu đúng quyền |
| O02 | Quản lý phòng/khay | ☑ API + React | CRUD thật, validation/FK; không xóa lịch sử |
| O03 | Gán thuê | ☑ API + React | Nhiều khay atomically, race201/409, browser gán |
| O04 | Giám sát nhiệt/ẩm/CO₂ | ◐ API + React | Room readings từ simulator, browser hiển thị; chưa cảm biến thật |
| O05 | Điều khiển môi trường | ◐ source hardware có khóa, chưa nghiệm thu | Allowlist +pulse10s/TTL/freshness/interlock; backend38 tests, compile3 profile; chưa flash/đo relay |
| O06 | Camera/luồng giám sát | ◐ cấu hình/mở URL | HTTPS/ownership PASS; live feed/gateway chưa nghiệm thu |
| O07 | Tiến trình/trạng thái | ☑ API + React | Stage tuần tự, events, browser update; hiện gắn rental item |
| O08 | Lịch/bản ghi thu hoạch | ☑ API + React | Expected date, ready→harvested/weight; browser ghi thu hoạch |
| O09 | Cảnh báo môi trường | ☑ in-app API + React | Scope đúng người và dedup5phút PASS; dữ liệu mô phỏng |
| O10 | Lịch sử/trạng thái thiết bị | ☑ API + React | Sensor/last seen/mode, lịch sử lệnh100 dòng/poll5s; Chrome pending→fixture ACK/result/scope PASS; chưa feedback tải điện |
| C01 | Đăng ký | ☑ API + Flutter | Public role guard test; Flutter Chrome UI register/login PASS; chưa phone E2E |
| C02 | Đăng nhập | ☑ API + Flutter | Mock/widget và live Dart API PASS; staff bị từ chối |
| C03 | Hồ sơ | ☑ API + Flutter | API/profile live test và Chrome UI sửa tên PASS; chưa phone E2E |
| C04 | Khay trống/gói | ☑ API + Flutter | Catalog và live Dart test, selection UI; giới hạn danh sách |
| C05 | Thuê một/nhiều khay | ☑ API + Flutter | API race/rollback, live Dart rent; Chrome UI thuê2 khay PASS; chưa phone E2E |
| C06 | Liên kết mã khay | ☑ API + Flutter | Cần đúng chủ active, IDOR test + live Dart link |
| C07 | Chi tiết/giai đoạn/ngày thu hoạch | ☑ API + Flutter | Detail/isolation, live Dart item; Flutter build PASS |
| C08 | Điều kiện môi trường | ◐ API + Flutter | Room/time ownership và live Dart reading PASS; chưa sensor thật |
| C09 | Camera trực tiếp | ◐ contract + mở URL | Chỉ chủ active; chưa live feed/camera thật, không đánh dấu hoàn tất |
| C10 | Thông báo | ☑ in-app API + Flutter | Growth/harvest/environment scope tests; polling khi trang hoạt động, không OS push |
| C11 | Lịch sử thuê/giao dịch | ☑ API + Flutter | Snapshot/ledger/tenant tests; cursor/status pagination API+React+Flutter PASS; các danh sách khác còn bounded |
| C12 | Yêu cầu nhận/giao nấm | ☑ API + Flutter | Ownership/address/status API PASS, Flutter Chrome delivery/address/cancel-resubmit PASS; chưa phone E2E |

| Sản phẩm | Trạng thái |
|---|---|
| REST API/PostgreSQL | 38/38 tests PASS trên HTTP/PostgreSQL thật; migration dev2 lần/backup restore PASS |
| React Web |Build,2 API client tests +11 Chrome E2E PASS; session/paging/history/390px và Admin logout1280x720 |
| Flutter Customer |Analyze sạch/12 tests; APK debug +Android emulator UI→API→PostgreSQL PASS; chưa phone thật |
| ESP32 | Compile3 profile +pulse/URL assertions PASS; GPIO gate mặc định0, chưa upload/sensor/relay/camera thật |
| Bảo mật | Auth/RBAC/tenant/last admin/CSV/body bounds tested; chưa audit production độc lập |
| Tích hợp/triển khai |Local +CI toàn bộ PASS run42005126537/3c14bc8, gồm Docker build/up/smoke; TLS production/Android/hardware chưa nghiệm thu |
| Tài liệu | UR/SRS/ADR/ERD/API/detail/test/deploy/user guide và 6 UML source/PNG render PASS |

Chưa nghiệm thu hoàn chỉnh đồ án vật lý/production. Android SDK/Docker Engine đã chạy; còn xác nhận phần cứng/giới hạn an toàn. Các bản kiểm kê tiếp theo là lịch sử trước khi cài thêm. Những phần mềm có thể phát triển tiếp: phân trang/filter, retention, thêm browser coverage và đo tải; không gọi các mục này là đã hoàn thành.

Kiểm kê Windows2026-11-05: xem [báo cáo môi trường](KIEM_TRA_MOI_TRUONG_WINDOWS.md). SQL read-only55439/schema3/3 và Node26 API/React smoke PASS; DB dev trống/chưa Admin, server/.env còn placeholder. Android SDK/JDK thiếu; WSL lỗi Class not registered, Docker Windows chưa dùng được. COM3/4 là Bluetooth; sensor/camera/relay chưa test thật. CI3f53424/run42005908332 đã xác nhận success2 jobs, không thay kiểm thử hardware. Không đổi trạng thái chức năng thành hoàn tất chỉ từ kiểm kê/cài tool.

Kiểm lại sau cài thêm: **JDK17.0.21 java/javac PASS**, không còn thiếu JDK; process cần nhận lại Machine PATH. Android SDK vẫn chưa tìm thấy, WSL CLI timeout12s, Docker chưa tìm thấy. Flutter SDK có nhưng PATH2 vị trí mới sai; không đánh dấu Android/ESP32 thật hoàn thành từ kiểm tra executable.

Kiểm PATH tiếp theo: Machine PATH Flutter **đã đúng** .sm-tools\flutter\bin; sau nạp environment chỉ trong process, where/flutter3.47.9/dart3.13.7 PASS. Phiên VS Code/terminal cũ cần mở lại; không cần cài lại Flutter. Không test lại Android/Docker/WSL trong lượt này.

Kiểm đủ công cụ sau cài Studio: **doctor Android PASS/licenses accepted**, SDK API36/37 và AVD đã cài; còn thiếu NDK28.2.13676358 theo source. ADB chưa có Android device chạy, chưa build APK/E2E. Docker chưa tìm thấy, WSL vẫn timeout; không chuyển trạng thái Flutter thành nghiệm thu Android chỉ vì doctor xanh.
