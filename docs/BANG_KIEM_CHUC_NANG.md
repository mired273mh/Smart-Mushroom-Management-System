# BẢNG KIỂM YÊU CẦU CHỨC NĂNG

> Mỗi dòng dựa trên `DE_TAI_YEU_CAU.md`. Chỉ tick khi đã triển khai; ghi bằng chứng trước khi kết luận đã kiểm thử. Ban đầu mọi chức năng chưa triển khai.

## Administrator

| ID | Yêu cầu | Code | Đã test / bằng chứng |
|---|---|---|---|
| A01 | Đăng ký/tạo tài khoản quản trị an toàn | ☐ | — |
| A02 | Đăng nhập an toàn | ☐ | — |
| A03 | Người dùng, vai trò, quyền, vô hiệu hóa, đặt lại mật khẩu | ☐ | — |
| A04 | CRUD phòng trồng | ☐ | — |
| A05 | Quản lý thông tin, trạng thái và phân công khay | ☐ | — |
| A06 | Gói thuê, chính sách giá | ☐ | — |
| A07 | Quản lý thiết bị IoT, cảm biến, cấu hình camera | ☐ | — |
| A08 | Thống kê/báo cáo trồng, môi trường, thuê, thu hoạch | ☐ | — |
| A09 | Xuất dữ liệu và báo cáo | ☐ | — |
| A10 | Cấu hình ngưỡng môi trường và thông báo | ☐ | — |

## Farm Operator

| ID | Yêu cầu | Code | Đã test / bằng chứng |
|---|---|---|---|
| O01 | Đăng nhập | ☐ | — |
| O02 | Quản lý phòng và khay | ☐ | — |
| O03 | Gán khay cho khách thuê | ☐ | — |
| O04 | Xem nhiệt độ, độ ẩm, CO₂ | ☐ | — |
| O05 | Điều khiển phun sương, quạt và thiết bị môi trường | ☐ | — |
| O06 | Quản lý camera/luồng giám sát | ☐ | — |
| O07 | Cập nhật tiến độ, trạng thái khay | ☐ | — |
| O08 | Lịch và bản ghi thu hoạch | ☐ | — |
| O09 | Cảnh báo vượt ngưỡng môi trường | ☐ | — |
| O10 | Lịch sử cảm biến và tình trạng thiết bị | ☐ | — |

## Customer

| ID | Yêu cầu | Code | Đã test / bằng chứng |
|---|---|---|---|
| C01 | Đăng ký | ☐ | — |
| C02 | Đăng nhập | ☐ | — |
| C03 | Hồ sơ cá nhân | ☐ | — |
| C04 | Xem khay trống và gói thuê | ☐ | — |
| C05 | Thuê một hoặc nhiều khay | ☐ | — |
| C06 | Liên kết khay bằng mã khay duy nhất | ☐ | — |
| C07 | Xem trạng thái, giai đoạn, ngày dự kiến thu hoạch | ☐ | — |
| C08 | Xem nhiệt độ/độ ẩm/CO₂ của khay đã thuê | ☐ | — |
| C09 | Xem camera live khi có phần cứng/kênh hỗ trợ | ☐ | — |
| C10 | Nhận thông báo tiến độ/bất thường/sẵn sàng thu hoạch | ☐ | — |
| C11 | Lịch sử thuê và giao dịch | ☐ | — |
| C12 | Yêu cầu thu hoạch tại chỗ hoặc giao hàng | ☐ | — |

## Ngoài chức năng

| Nội dung | Trạng thái / bằng chứng |
|---|---|
| RESTful API chạy được | Chưa kiểm chứng |
| PostgreSQL migration + dữ liệu quan hệ đúng | Chưa kiểm chứng |
| Web React cho 2 vai trò | Chưa kiểm chứng |
| Flutter Customer | Chưa kiểm chứng |
| ESP32 / cảm biến | Chưa kiểm chứng |
| Bảo mật auth / RBAC / dữ liệu khách thuê | Chưa kiểm chứng |
| Tích hợp và triển khai | Chưa kiểm chứng |
| UML 2.0 / SRS / thiết kế / Test Plan / Guides | Chưa kiểm chứng |
