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
