# Truy vết yêu cầu — master checkpoint2026-11-05

HQTCSDL: SQL objects/roles/9demo và Android/Docker runtime được cập nhật tại [kết quả test](KIEM_THU.md), [demo](demo-hqtcsdl/README.md), [phạm vi](PHAM_VI_HQTCSDL.md). Các khoảng trống cuối bảng là backlog; cycle không thuê OPTIONAL, retention RECOMMENDED, không tự coi bắt buộc. Yêu cầu phần mềm camera vẫn chưa có luồng thật nghiệm thu.

Nguồn: DE_TAI_YEU_CAU, SRS, User Requirements; không coi JWT hay public admin registration là yêu cầu bắt buộc. Phiên opaque/RBAC và CLI bootstrap hiện có được giữ theo ADR003/004. Trạng thái **HOÀN THÀNH** bên dưới chỉ áp dụng phạm vi phần mềm đã có bằng chứng; hardware/production không suy ra từ API/simulator. Test log chi tiết ở KIEM_THU/TIEN_DO; bảng này không thay lịch sử FAIL.

| ID | Chức năng | File triển khai chính | Trạng thái | Bằng chứng | Việc tiếp theo |
|---|---|---|---|---|---|
| A01 | Tạo Admin an toàn | server/src/cli.js,users.js; web/src/App.jsx | HOÀN THÀNH phần mềm | security.test.js bootstrap/public role guard; React E2E | Giữ credentials riêng khi deploy |
| A02 | Đăng nhập Admin | server/src/auth.js,security.js; web/src/App.jsx | HOÀN THÀNH phần mềm | foundation/security/review-regression; Chrome E2E | HTTPS staging |
| A03 | User/role/lock/delete/reset | server/src/users.js; web/src/App.jsx | HOÀN THÀNH phần mềm | rentals/security/review tests: last admin/reset/active rentals | Audit vận hành/retention |
| A04 | CRUD phòng | server/src/catalog.js; web/src/App.jsx | HOÀN THÀNH phần mềm | rentals/review tests, browser CRUD | HQ4 paging/search Chrome+SQL PASS; theo dõi quy mô lớn |
| A05 | Khay/định danh/phân công | server/src/catalog.js,rentals.js; web/src/App.jsx | HOÀN THÀNH phần mềm | unique/FK/race/ownership, browser gán | HQ4 paging/search và gán ngoài200 PASS; theo dõi quy mô lớn |
| A06 | Gói/chính sách giá | server/src/catalog.js,rentals.js; web/src/App.jsx | HOÀN THÀNH phần mềm | snapshot giá, CRUD/E2E | HQ4 paging/search PASS; theo dõi quy mô lớn |
| A07 | Device/sensor/camera | server/src/iot.js; web/src/App.jsx; iot/esp32/SmartMushroom | CHƯA KIỂM THỬ hardware | iot tests/provision/rotate; firmware compile3/3 | Kết nối sensor/camera thực |
| A08 | Thống kê/báo cáo | server/src/operations.js; web/src/App.jsx | HOÀN THÀNH bản cơ bản | operations tests; Chrome dashboard | Dataset lớn/downsampling |
| A09 | Xuất dữ liệu | server/src/operations.js; web/src/App.jsx | HOÀN THÀNH bản CSV bounded | CSV formula guard/download E2E | Export đủ dữ liệu khi vượt10000 |
| A10 | Ngưỡng/thông báo | server/src/iot.js; web/src/App.jsx | HOÀN THÀNH phần mềm | validation/RBAC/dedup iot tests | Hiệu chuẩn ngưỡng với giống nấm |
| O01 | Đăng nhập Operator | server/src/auth.js; web/src/App.jsx | HOÀN THÀNH phần mềm | browser đúng menu/RBAC API | HTTPS staging |
| O02 | Phòng/khay | server/src/catalog.js; web/src/App.jsx | HOÀN THÀNH phần mềm | CRUD/constraints/PATCH regression | Paging/tìm kiếm đầy đủ |
| O03 | Gán thuê | server/src/rentals.js; web/src/App.jsx | HOÀN THÀNH phần mềm | many-tray atomic/race201-409, browser | Kiểm thử workload thực |
| O04 | Giám sát sensor | server/src/iot.js; web/src/App.jsx | CHƯA KIỂM THỬ sensor thật | simulator→SQL→React/Android PASS | Đối chiếu phép đo sensor |
| O05 | Điều khiển manual/automatic | server/src/iot.js; iot/esp32/SmartMushroom/SmartMushroom.ino | CÓ source gated; hardware BLOCKED | hardware.test.js +Chrome control UI +compile3 profile/pulse assertions PASS (software) | Xác nhận PHUONG_AN_PHAN_CUNG_IOT, flash/đo pulse/fail-safe/tải thật |
| O06 | Camera live | server/src/iot.js; web/src/App.jsx | CHƯA KIỂM THỬ live feed | URL HTTPS/ownership tests | Camera/gateway có quyền xem |
| O07 | Tiến trình nuôi | server/src/operations.js; web/src/App.jsx | HOÀN THÀNH theo rental item; THIẾU cycle khay không thuê | stage/events tests; browser/Android | Mở rộng cycle độc lập nếu dùng khay không hợp đồng |
| O08 | Lịch/thu hoạch | server/src/operations.js; web/src/App.jsx | HOÀN THÀNH theo rental item | weight/ready/date/tenant tests, E2E | Nghiệm thu lịch canh tác thực |
| O09 | Cảnh báo môi trường | server/src/iot.js; web/src/App.jsx | HOÀN THÀNH in-app, dữ liệu mô phỏng | threshold/dedup/scope tests | Sensor thật/soak/mất mạng |
| O10 | Lịch sử/device status | server/src/iot.js; web/src/App.jsx,CommandHistory.jsx | HOÀN THÀNH phần mềm bounded100 lệnh | readings/status/mode; Chrome pending→fixture ACK/result; API expired offline | Hardware/soak, paging lịch sử dài/offline alert |
| C01 | Đăng ký Customer | server/src/auth.js; mobile/lib/screens.dart | HOÀN THÀNH phần mềm/Android emulator | public role guard; Android UI register | Phone thật |
| C02 | Đăng nhập Customer | server/src/auth.js; mobile/lib/api.dart,screens.dart | HOÀN THÀNH phần mềm/Android emulator | unit/live API/browser/Android | Phone/network thực |
| C03 | Hồ sơ | server/src/auth.js; mobile/lib/api.dart,screens.dart | HOÀN THÀNH phần mềm | live API/browser sửa tên, Android xem/logout | Phone/test session nền |
| C04 | Khay/gói khả dụng | server/src/catalog.js,catalog-pagination.js; mobile/lib/screens.dart | HOÀN THÀNH phần mềm với keyset paging/search |205plans/230stock API; widgetmerge/race; realChrome21stock/22plans/paging/search; Android coreflow | Nghiệm thu data/phone thực, các staff lists riêng |
| C05 | Thuê nhiều khay | server/src/rentals.js; mobile/lib/screens.dart | HOÀN THÀNH phần mềm/Android emulator | DB atomic/race; AndroidUI+SQL2items | Phone/network/retry |
| C06 | Liên kết mã | server/src/rentals.js; mobile/lib/screens.dart | HOÀN THÀNH phần mềm/Android emulator | IDOR API; Android link+SQL linked_at | Phone/camera QR nếu yêu cầu sau |
| C07 | Trạng thái/lịch | server/src/rentals.js,operations.js; mobile/lib/screens.dart | HOÀN THÀNH phần mềm | stage/date/details API+UI | Nghiệm thu lịch thực |
| C08 | Nhiệt/ẩm/CO₂ | server/src/iot.js; mobile/lib/screens.dart | CHƯA KIỂM THỬ sensor thật | Android thấy simulator/ownership/time API | Sensor thật+đối chiếu |
| C09 | Xem camera | server/src/iot.js; mobile/lib/screens.dart | CHƯA KIỂM THỬ luồng thật | URL contract/ownership, UI empty đúng | Gateway/live feed/phone |
| C10 | Thông báo | server/src/operations.js,iot.js; mobile/lib/screens.dart | HOÀN THÀNH in-app | scope/growth/harvest tests, Android xem | Polling khi hoạt động, không OS push |
| C11 | Lịch sử thuê/giao dịch | server/src/rentals.js,rental-pagination.js; mobile/lib/screens.dart | HOÀN THÀNH phần mềm | cursor207/tenant/VM+UI paging; Android SQLpaid/completed | Phone/list khác paging |
| C12 | Nhận/giao nấm | server/src/operations.js; mobile/lib/screens.dart | HOÀN THÀNH phần mềm/Android emulator | validation/ownership/cancel API+browser; Android delivery→DBcompleted | Phone/địa chỉ thực |

Các khoảng trống chung: pagination/search ngoài rentals còn bounded; retention/scheduled cleanup/chính sách backup production chưa triển khai; cycle nuôi khay không hợp đồng chưa có; TLS production/phone thật/hardware chưa nghiệm thu. Docker Windows/Android emulator đã có bằng chứng riêng ở batch master, không đánh dấu thay cho phần thiếu. Không có lỗi nghiêm trọng đã biết trong luồng phần mềm đã test sau sửa; đây không phải chứng nhận không còn lỗi hoặc hoàn thành100%.
