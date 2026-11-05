# Đặc tả và tiêu chí nghiệm thu — bản 1 (2026-11-05)

Nguồn bắt buộc: `DE_TAI_YEU_CAU.md`; các phương án triển khai nằm trong ADR. Không có mã nguồn/dữ liệu của dự án trước được nhập vào repository này.

Bổ sung nghiệm thu HQTCSDL theo yêu cầu người dùng2026-11-05: [phân loại phạm vi](PHAM_VI_HQTCSDL.md), [3NF/data dictionary](THIET_KE_CSDL_HQTCSDL.md), [9demo SQL có bằng chứng](demo-hqtcsdl/README.md). SQL objects phải hỗ trợ nghiệp vụ thực, DB roles không thay RBAC API; không nhập OPTIONAL/RECOMMENDED thành yêu cầu nghiệp vụ gốc.

## Tác nhân và phạm vi

- Administrator: tạo tài khoản nhân sự, quản trị người dùng, phòng, khay, gói giá, thiết bị, ngưỡng và báo cáo.
- Farm Operator: vận hành phòng/khay, gán thuê, ghi tiến trình/thu hoạch, giám sát và điều khiển theo cấu hình an toàn.
- Customer: đăng ký trên Flutter; xem gói/khay trống, thuê nhiều khay, liên kết khay đã được cấp cho mình, xem dữ liệu thuộc quyền, nhận thông báo và yêu cầu nhận/giao nấm.
- ESP32: xác thực thiết bị, gửi nhiệt độ °C/độ ẩm %RH/CO₂ ppm và nhận lệnh có thời hạn. Camera là nguồn riêng nếu phần cứng hỗ trợ.

## Quy tắc nghiệp vụ

1. Mã khay duy nhất và ổn định. Biết mã khay không chứng minh quyền sở hữu. Liên kết chỉ thành công khi đang có hợp đồng cấp cho chính Customer đó.
2. Một khay chỉ thuộc tối đa một rental item đang hoạt động; PostgreSQL bảo vệ cả khi nhiều yêu cầu đồng thời. Thuê nhiều khay phải thành công toàn bộ hoặc rollback toàn bộ.
3. Thuê bắt đầu ngay sau xác nhận API; lưu giá và số ngày tại thời điểm thuê. Hết ngày dự kiến không tự giải phóng khay; nhân viên đóng hợp đồng sau bàn giao. Không triển khai đặt trước theo khoảng ngày ở phiên bản đầu.
4. Khay có trạng thái phục vụ `available`, `maintenance`, `retired`; trạng thái đang thuê suy ra từ hợp đồng. Tiến trình nuôi và thu hoạch gắn rental item để không lộ lịch sử khách trước.
5. Dữ liệu môi trường đo theo phòng, không nhận là cảm biến riêng từng khay. Customer chỉ truy cập phòng chứa khay thuê đang hoạt động, giới hạn lịch sử từ lúc bắt đầu thuê.
6. Giao dịch là bản ghi công nợ/xác nhận thu tiền thủ công, không phải thanh toán online. Lưu tiền VND bằng số nguyên không âm.
7. Thu hoạch do nhân viên ghi; Customer yêu cầu nhận tại cơ sở hoặc giao, phải có địa chỉ khi giao. Trạng thái yêu cầu chuyển theo thứ tự và lưu được lịch sử nghiệp vụ.
8. User vô hiệu hóa mất quyền ngay cả với token cũ; xóa mềm để giữ khóa ngoại và lịch sử. Không được vô hiệu hóa/xóa quản trị viên cuối cùng.
9. Thông báo in-app có trạng thái đã đọc. Bất thường được đánh giá theo ngưỡng phòng; chỉ thông báo khách có thuê đang hoạt động tại thời điểm đo.
10. Chế độ ban đầu là mô phỏng/dry-run. Không điều khiển phần cứng khi chưa xác nhận sơ đồ chân, relay và giới hạn an toàn. Không giả camera nếu chưa cấu hình.

## Nhóm nghiệm thu và truy vết

| Nhóm | ID đề tài | Tiêu chí |
|---|---|---|
| Tài khoản | A01–03, O01, C01–03 | Bootstrap admin qua CLI; đăng ký công khai chỉ Customer; mật khẩu băm; hết hạn/thu hồi phiên; RBAC/ownership test |
| Nền tảng | A04–06, O02 | CRUD có validation; mã khay unique; không chuyển phòng khay đang thuê; phòng có dữ liệu không bị xóa mất lịch sử |
| Thuê | O03, C04–07, C11 | Transaction nhiều khay; tranh chấp song song chỉ một thắng; không chiếm khay bằng mã; giá snapshot; khách khác nhận 404 |
| Nuôi/thu hoạch | O07–08, C07, C10, C12 | Lịch, sự kiện tiến trình, cân nặng thu hoạch, nhận/giao theo chủ thuê và thông báo |
| IoT | A07/A10, O04–06/O09–10, C08–10 | Token thiết bị riêng; dữ liệu hữu hạn/phạm vi vật lý; ngưỡng/cảnh báo; lịch sử; lệnh timeout và dry-run; không rò camera |
| Báo cáo | A08–09 | Tổng hợp từ DB; CSV an toàn công thức; phân trang/giới hạn dữ liệu |
| Giao diện | TP2/TP3 | React chặn Customer; Flutter dùng API Customer; tải/lỗi/trống có thông báo; build/analyze/test thật |
| Triển khai | TP5/TP6 | Health/readiness, cấu hình mẫu, migration, backup/restore, hướng dẫn; UML và test matrix khớp code |

## Phi chức năng định lượng đề xuất

API giới hạn body64KB; lịch sử thuê có cursor/limit, các danh sách khác còn giới hạn100–200 mục; lịch sử cảm biến tối đa1000 mẫu/lần. Phiên người dùng hết hạn sau12 giờ; token chỉ lưu hash trong DB. Truyền HTTPS khi triển khai. Mục tiêu p95 dưới1 giây với20 người đồng thời là tiêu chí đề xuất: benchmark local2 endpoint đọc đã đạt (xem REVIEW_CUOI), chưa nghiệm thu workload/WAN/TLS production. Múi giờ lưu UTC, hiển thị giờ địa phương của thiết bị (môi trường dự kiến Asia/Ho_Chi_Minh). Sao lưu PostgreSQL hàng ngày là đề xuất vận hành, chưa có job production.
