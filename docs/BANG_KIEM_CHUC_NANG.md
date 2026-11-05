# Bảng kiểm chức năng — checkpoint 2026-11-05

Ký hiệu: ☑ có code và kiểm chứng theo bằng chứng ghi; ◐ có một phần hoặc chưa nghiệm thu môi trường đích. Một test API không tự chứng minh mọi nhánh giao diện/hardware. Chi tiết lệnh và lịch sử FAIL/PASS ở KIEM_THU.md.

| ID | Chức năng | Mã thực tế | Bằng chứng / giới hạn |
|---|---|---|---|
| A01 | Tạo tài khoản quản trị an toàn | ☑ CLI + Admin Web tạo bổ sung | security.test: bootstrap thật một lần, không log secret; public register không nâng quyền |
| A02 | Đăng nhập | ☑ API + React | foundation + Chrome E2E, session/hash/revoke/expiry |
| A03 | Tài khoản/vai trò/khóa/xóa/reset | ☑ API + React | security/rentals: create/role/soft-delete/reset/revoke/last admin; chưa browser test mọi nhánh |
| A04 | CRUD phòng | ☑ API + React | Browser create; FK/khóa phòng đang thuê test; code edit/delete |
| A05 | Quản lý/định danh/phân công khay | ☑ API + React | Unique code, ownership, room/status guard, browser phân công |
| A06 | Gói thuê/chính sách giá | ☑ API + React | Tạo/sửa/giá snapshot; browser create |
| A07 | Thiết bị/cảm biến/camera | ◐ API + React + firmware | Provision/rotate/disable/mode/provenance PASS; sensor/camera thật chưa test |
| A08 | Dashboard/báo cáo | ☑ API + React bản cơ bản | DB dashboard/report, room/harvest/rental/env aggregates; chưa benchmark dữ liệu lớn |
| A09 | Xuất dữ liệu | ☑ CSV API + React | Formula escaping test, download Chrome; tối đa10.000 bản ghi |
| A10 | Ngưỡng/thông báo | ☑ API + React | Threshold validation/RBAC/alert dedup tests; ngưỡng dev chưa hiệu chuẩn giống nấm |
| O01 | Đăng nhập | ☑ API + React | Operator browser login/menu đúng quyền |
| O02 | Quản lý phòng/khay | ☑ API + React | CRUD thật, validation/FK; không xóa lịch sử |
| O03 | Gán thuê | ☑ API + React | Nhiều khay atomically, race201/409, browser gán |
| O04 | Giám sát nhiệt/ẩm/CO₂ | ◐ API + React | Room readings từ simulator, browser hiển thị; chưa cảm biến thật |
| O05 | Điều khiển môi trường | ◐ manual/automatic dry-run | Mist/fan/light/heater contract, TTL/ack/replay; relay/GPIO thật CHƯA TRIỂN KHAI |
| O06 | Camera/luồng giám sát | ◐ cấu hình/mở URL | HTTPS/ownership PASS; live feed/gateway chưa nghiệm thu |
| O07 | Tiến trình/trạng thái | ☑ API + React | Stage tuần tự, events, browser update; hiện gắn rental item |
| O08 | Lịch/bản ghi thu hoạch | ☑ API + React | Expected date, ready→harvested/weight; browser ghi thu hoạch |
| O09 | Cảnh báo môi trường | ☑ in-app API + React | Scope đúng người và dedup5phút PASS; dữ liệu mô phỏng |
| O10 | Lịch sử/trạng thái thiết bị | ☑ API + React | History/last seen/mode, browser đọc mẫu mô phỏng |
| C01 | Đăng ký | ☑ API + Flutter | Public role guard test; Flutter form source, đăng ký UI chưa E2E trên điện thoại |
| C02 | Đăng nhập | ☑ API + Flutter | Mock/widget và live Dart API PASS; staff bị từ chối |
| C03 | Hồ sơ | ☑ API + Flutter | API/profile live test, form sửa tên; chưa E2E điện thoại |
| C04 | Khay trống/gói | ☑ API + Flutter | Catalog và live Dart test, selection UI; giới hạn danh sách |
| C05 | Thuê một/nhiều khay | ☑ API + Flutter | API race/rollback, live Dart rent; UI chưa E2E trên điện thoại |
| C06 | Liên kết mã khay | ☑ API + Flutter | Cần đúng chủ active, IDOR test + live Dart link |
| C07 | Chi tiết/giai đoạn/ngày thu hoạch | ☑ API + Flutter | Detail/isolation, live Dart item; Flutter build PASS |
| C08 | Điều kiện môi trường | ◐ API + Flutter | Room/time ownership và live Dart reading PASS; chưa sensor thật |
| C09 | Camera trực tiếp | ◐ contract + mở URL | Chỉ chủ active; chưa live feed/camera thật, không đánh dấu hoàn tất |
| C10 | Thông báo | ☑ in-app API + Flutter | Growth/harvest/environment scope tests; polling khi trang hoạt động, không OS push |
| C11 | Lịch sử thuê/giao dịch | ☑ API + Flutter | Snapshot/ledger/tenant tests; danh sách bounded, chưa pagination đầy đủ |
| C12 | Yêu cầu nhận/giao nấm | ☑ API + Flutter | Ownership/address/status API PASS, Flutter dialog source; chưa phone E2E |

| Sản phẩm | Trạng thái |
|---|---|
| REST API/PostgreSQL | 21/21 tests PASS trên HTTP/PostgreSQL thật; migration dev2 lần/backup restore PASS |
| React Web | Build và Chrome E2E5 nhóm PASS; ảnh local đã xem; responsive390px không tràn |
| Flutter Customer | Analyze sạch,5 mock unit/widget+1 live API test PASS,Web build PASS; APK/emulator chưa chạy |
| ESP32 | Compile2 nhánh PASS; chưa upload/sensor/relay/camera thật |
| Bảo mật | Auth/RBAC/tenant/last admin/CSV/body bounds tested; chưa audit production độc lập |
| Tích hợp/triển khai | Local integration PASS; Compose config validation PASS; Docker runtime/CI remote/TLS chưa chạy |
| Tài liệu | UR/SRS/ADR/ERD/API/detail/test/deploy/user guide và 6 UML source/PNG render PASS |

Chưa nghiệm thu hoàn chỉnh đồ án vật lý/production. Cần Android SDK, Docker Engine và phần cứng/giới hạn an toàn được xác nhận. Những phần mềm có thể phát triển tiếp: phân trang/filter, retention, thêm browser coverage và đo tải; không gọi các mục này là đã hoàn thành.
