# KẾ HOẠCH TRIỂN KHAI TỪ SỐ 0

> Kế hoạch triển khai đề xuất để chia việc nhỏ, tránh hết token rồi mất mạch. Các mã P0–P6 là mốc nội bộ của nhóm, không phải số mục bắt buộc do đề tài đưa ra.

| Mốc | Việc chính | Điều kiện chuyển mốc |
|---|---|---|
| P0 | Repo sạch, quyết định kiến trúc, cấu trúc dự án, môi trường chạy mẫu, tài liệu thiết lập | Khởi động backend tối thiểu được hoặc ghi rõ giới hạn môi trường |
| P1 | PostgreSQL schema/migration, API, tài khoản, phân quyền, phòng/khay/gói thuê/thuê khay/các dữ liệu cốt lõi | Migration và API test quan trọng chạy; không cấp trùng khay |
| P2 | Web React: Admin + Farm Operator, quản lý và dashboard theo quyền | Build thành công, luồng chính gọi API và RBAC đúng |
| P3 | Flutter Customer: đăng ký, thuê khay, theo dõi, yêu cầu thu hoạch/giao hàng, thông báo | `flutter analyze`/test hoặc ghi rõ môi trường thiếu; API luồng chính hoạt động |
| P4 | ESP32 nhận dữ liệu nhiệt/ẩm/CO₂, điều khiển, cảnh báo, camera theo phần cứng có sẵn | Phân biệt test mô phỏng và test hardware; log kết quả gửi dữ liệu |
| P5 | Kiểm thử tích hợp, bảo mật, deployment, báo cáo kết quả | Có hướng dẫn run end-to-end và bằng chứng cho từng luồng |
| P6 | UML 2.0, SRS, kiến trúc, thiết kế chi tiết, test plan, hướng dẫn cài/user | Tài liệu phản ánh đúng code thực tế, không viết theo chức năng chưa có |

## Quy trình theo batch

1. Chọn một đầu việc có thể demo (ví dụ `room CRUD` hoặc `rental transaction`).
2. Ghi `Đang làm` trong tiến độ + tập file dự kiến.
3. Triển khai đầy đủ: DB → API → test; phần giao diện nếu liên quan.
4. Chạy xác minh và lưu kết quả thật.
5. Ghi xong/blocked và mở đầu việc tiếp theo; ưu tiên commit Git theo batch ổn định.

## Các luồng nghiệp vụ nên demo sớm

- Người dùng đăng nhập theo vai trò → không truy cập nhầm API admin.
- Admin tạo phòng → tạo khay và mã định danh duy nhất.
- Khách xem khay/gói thuê → thuê khay → ghi lịch sử, tránh trùng khay.
- Farm Operator cập nhật tiến trình/trạng thái → Customer thấy tiến độ và lịch thu hoạch.
- ESP32 hoặc simulator có nhãn mô phỏng gửi dữ liệu → Operator/Web và Customer thấy nhiệt/ẩm/CO₂ liên quan → cảnh báo ngưỡng → ghi lịch sử.
- Operator quản lý thu hoạch → Customer yêu cầu nhận/giao.

## Quy tắc nghiệm thu

- Mục nào chưa code: `Chưa bắt đầu`; code chưa chạy test: `Hoàn thành (chưa kiểm thử)`.
- Có test: ghi lệnh, PASS/FAIL, bằng chứng (đường dẫn log nếu có).
- Không có cảm biến/camera thật: ghi “chưa kiểm thử trên phần cứng”, không đánh dấu hoàn thành tích hợp thật.
- Khi cần chi tiết kỹ thuật chưa nêu trong đề tài: cập nhật `docs/QUYET_DINH_KIEN_TRUC.md` và lý do chọn.
