# User Requirements — Smart Mushroom

Ngày: 2026-11-05. Tài liệu hóa phạm vi `DE_TAI_YEU_CAU.md`, tiêu chí chi tiết tại SRS. Các lựa chọn ADR không thay đổi yêu cầu gốc.

Nhu cầu bảo vệ HQTCSDL bổ sung2026-11-05: giải thích ERD/3NF/constraints/routines/locks/roles/EXPLAIN/backup bằng source và SQL đã test. Xem [9demo](demo-hqtcsdl/README.md) và [hỏi đáp](demo-hqtcsdl/BAO_VE.md); phạm vi OPTIONAL/RECOMMENDED giữ riêng tại PHAM_VI_HQTCSDL.

| Nhóm nhu cầu | Vai trò | ID đề tài | Kết quả người dùng cần |
|---|---|---|---|
| Tài khoản và quyền | Admin/Operator/Customer | A01–03, O01, C01–03 | Truy cập đúng ứng dụng và dữ liệu, khóa tài khoản hoặc đặt lại mật khẩu an toàn |
| Hạ tầng nông trại | Admin/Operator | A04–07, O02 | Quản lý phòng, mã khay duy nhất, tình trạng phục vụ, gói giá và thiết bị |
| Thuê và liên kết | Operator/Customer | O03, C04–07, C11 | Xem khay trống, thuê nhiều khay nhất quán, liên kết đúng chủ, theo dõi lịch sử và giao dịch |
| Theo dõi nuôi trồng | Operator/Customer | O07–08, C07/C10/C12 | Cập nhật tiến trình/ngày thu hoạch; xem sản lượng, yêu cầu nhận hoặc giao |
| Giám sát từ xa | Admin/Operator/Customer | A07/A10, O04–06/O09–10, C08–10 | Nhiệt/ẩm/CO₂, lịch sử, cảnh báo, điều khiển, camera khi được cung cấp |
| Quản trị và báo cáo | Admin | A08–09 | Công suất, thuê, môi trường, sản lượng, xuất dữ liệu |

Ranh giới: React chỉ dành nhân sự; Flutter dành Customer; ESP32 thu thập mẫu theo phòng. Không có thanh toán online/SMS/AI vision. Không công khai đăng ký Admin. Camera optional về phần cứng nhưng nhu cầu live được giữ và đánh dấu chưa nghiệm thu nếu thiếu phần cứng.

Tình trạng bàn giao hiện tại: có bản ứng dụng và integration local; điều khiển thật/cảm biến thật/camera thật và Android build chưa nghiệm thu. Không dùng các test mô phỏng để tuyên bố hoàn thành yêu cầu tích hợp vật lý.
