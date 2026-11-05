# ĐẶC TẢ ĐỀ TÀI SMART MUSHROOM

> Tài liệu này tóm lược, sắp xếp lại **chính nội dung file `De tai.docx` do người dùng cung cấp**, dùng làm phạm vi ban đầu. Không gộp những quyết định kiến trúc chưa được đề tài quy định vào yêu cầu chính thức.

## 1. Tên đề tài và mục tiêu

**Tiếng Việt:** Xây dựng hệ thống quản lý nuôi trồng nấm thông minh tích hợp chức năng cho thuê và giám sát từ xa.

**English:** Building a Smart Mushroom Cultivation Management System with Rental and Remote Monitoring Features.

Mục tiêu: Quản lý tập trung phòng trồng và khay nấm, khách hàng thuê khay, giám sát môi trường nhiệt độ/độ ẩm/CO₂, tự động điều khiển môi trường, cung cấp web cho quản trị/vận hành và mobile cho khách thuê để theo dõi thông tin cùng quá trình phát triển nấm từ xa.

## 2. Giải pháp được đề xuất

1. Ứng dụng mobile cho Customer, web cho Administrator/Farm Operator, hạ tầng IoT cho giám sát/điều khiển.
2. Thu thập nhiệt độ, độ ẩm và CO₂ trong phòng trồng.
3. Điều khiển phun sương, thông gió và thiết bị điều hòa điều kiện trồng.
4. Quản lý phòng, khay, trạng thái và tỷ lệ sử dụng.
5. Mỗi khay có **mã định danh duy nhất** để liên kết với khách hàng thuê.
6. Xem camera trực tiếp từ xa để quan sát nấm (lưu ý phần cứng camera được mô tả là tùy chọn ở danh mục công nghệ).
7. Xem khay đã thuê, tiến trình, điều kiện môi trường và lịch thu hoạch qua Internet.
8. Thông báo khi bất thường môi trường, đến mốc nuôi trồng, sẵn sàng thu hoạch.
9. Dashboard tài khoản, vận hành, thống kê; lịch sử nuôi trồng và dữ liệu môi trường.

## 3. Yêu cầu chức năng theo vai trò

### 3.1. Administrator

- A01 — Đăng ký tài khoản mới để truy cập các chức năng quản trị (thiết kế phải đảm bảo an toàn; không mặc nhiên mở đăng ký admin công khai).
- A02 — Đăng nhập bảo mật.
- A03 — Quản lý tài khoản người dùng: tạo/sửa/vô hiệu hóa/xóa, vai trò/quyền, đặt lại mật khẩu.
- A04 — CRUD thông tin phòng trồng.
- A05 — Quản lý khay: thông tin, trạng thái, phân công.
- A06 — Quản lý gói thuê và chính sách giá.
- A07 — Quản lý thiết bị IoT, cảm biến và cấu hình camera.
- A08 — Xem thống kê trồng trọt, báo cáo môi trường, cho thuê, thu hoạch.
- A09 — Xuất dữ liệu và báo cáo để lưu trữ/phân tích/in.
- A10 — Thiết lập cấu hình thông báo và ngưỡng môi trường.

### 3.2. Farm Operator

- O01 — Đăng nhập bảo mật.
- O02 — Quản lý phòng/khay trồng.
- O03 — Gán khay cho khách hàng, đảm bảo chính xác nghiệp vụ thuê.
- O04 — Giám sát nhiệt độ/độ ẩm/CO₂ từ cảm biến.
- O05 — Điều khiển phun sương, quạt thông gió, thiết bị kiểm soát môi trường.
- O06 — Quản lý camera và luồng giám sát.
- O07 — Cập nhật tiến trình nuôi trồng và trạng thái khay.
- O08 — Quản lý lịch thu hoạch và bản ghi thu hoạch.
- O09 — Nhận cảnh báo khi vượt ngưỡng môi trường.
- O10 — Xem lịch sử cảm biến và trạng thái thiết bị.

### 3.3. Customer

- C01 — Đăng ký tài khoản.
- C02 — Đăng nhập bảo mật.
- C03 — Xem/cập nhật hồ sơ cá nhân.
- C04 — Xem khay còn trống và các gói thuê.
- C05 — Thuê một hoặc nhiều khay.
- C06 — Đăng ký liên kết khay vào tài khoản bằng mã khay duy nhất.
- C07 — Xem chi tiết khay đang thuê: giai đoạn, trạng thái, ngày dự kiến thu hoạch.
- C08 — Xem nhiệt độ/độ ẩm/CO₂ liên quan tới khay đang thuê.
- C09 — Xem camera live của khay khi được cung cấp.
- C10 — Nhận thông báo tiến trình, môi trường bất thường, sẵn sàng thu hoạch.
- C11 — Xem lịch sử thuê và bản ghi giao dịch.
- C12 — Yêu cầu nhận nấm tại cơ sở hoặc giao hàng.

## 4. Yêu cầu phi chức năng

- **Hiệu năng:** thao tác quản lý khay, xem thông tin và giám sát phản hồi nhanh.
- **Dễ dùng:** web/mobile trực quan cho từng nhóm vai trò.
- **Bảo mật:** xác thực và phân quyền ngăn truy cập trái phép.
- **Khả năng mở rộng:** thêm phòng, khay, người dùng, thiết bị không cần sửa đổi lớn.
- **Khả dụng:** truy cập qua thiết bị có Internet, giám sát/vận hành ổn định.
- **Tin cậy:** dữ liệu trồng nấm, thuê khay, môi trường chính xác trong điều kiện vận hành bình thường.

## 5. Công nghệ bắt buộc / được nêu trong đề tài

| Thành phần | Công nghệ |
|---|---|
| Server | Node.js (ExpressJS) |
| Database | PostgreSQL |
| API | RESTful API |
| Web quản trị | ReactJS |
| Mobile | Flutter |
| Microcontroller | ESP32 |
| Sensor | Nhiệt độ, độ ẩm, CO₂ |
| Camera | Camera Module / IP Camera (**optional** ở mục thiết bị) |
| Điều khiển môi trường | Phun sương, quạt thông gió, LED trồng, hệ thống sưởi |

Không có yêu cầu chính thức về ORM, JWT hay session, MQTT so với HTTP, cloud hosting, cổng thanh toán, thư viện UI hoặc loại camera cụ thể. Đó là **quyết định thiết kế** phải được ghi riêng.

## 6. Sản phẩm bàn giao

1. RESTful APIs cho hệ thống quản lý nuôi trồng nấm.
2. Web Application cho Administrator và Farm Operator.
3. Mobile Application cho Customer.
4. Hệ thống IoT giám sát môi trường và điều khiển.
5. Bộ tài liệu: User Requirements, Software Requirement Specification, Architecture Design, Detail Design, System Implementation and Testing Document, Installation Guide; source code và gói có thể triển khai.
6. Mô hình hóa bằng quy trình phát triển phần mềm và **UML 2.0**.

## 7. Các nhóm việc theo đề tài

- TP1: Phát triển RESTful API và database.
- TP2: Web Administrator & Farm Operator.
- TP3: Mobile Customer.
- TP4: IoT giám sát và điều khiển.
- TP5: Build, deploy, tích hợp và kiểm thử hệ thống.
- TP6: Bộ tài liệu phân tích, SRS, test plan, cài đặt, user manual.

## 8. Các điểm cần xác định trong quá trình phân tích

- Cơ chế đăng ký/quản trị tài khoản Administrator để bảo vệ hệ thống.
- Trạng thái thuê/gán khay, ngăn cấp trùng khay, xử lý vòng đời thuê và thu hoạch.
- Mức dữ liệu môi trường trên phòng so với trên từng khay; không nhận vơ là cảm biến gắn tại từng khay nếu thực tế chỉ đặt theo phòng.
- Phương án camera khi không có phần cứng: giao diện/contract có thể có, nhưng phải ghi rõ chưa nghiệm thu live feed thực tế.
- Kênh gửi thông báo, kênh truyền dữ liệu IoT, cách lưu lịch sử; đây là quyết định kỹ thuật, không phải văn bản đề tài đã chọn sẵn.
