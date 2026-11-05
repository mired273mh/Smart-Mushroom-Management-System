# Hướng dẫn sử dụng bản ứng dụng hiện tại

## Administrator trên Web

1. Dùng tài khoản bootstrap do người cài đặt tạo, đăng nhập cổng React. Không có đăng ký Admin công khai.
2. Tài khoản: tạo Operator/Customer/Admin bổ sung; sửa tên/vai trò, vô hiệu hóa, đặt mật khẩu mới hoặc xóa mềm. Không loại bỏ được Admin hoạt động cuối. Đổi mật khẩu/vai trò sẽ đăng xuất các phiên của tài khoản đó.
3. Phòng trồng → Thêm phòng; Khay nấm → Thêm khay, chọn phòng và đặt mã duy nhất (chữ hoa/số/-/_). Mã ổn định; dùng Bảo trì/Ngừng dùng thay vì xóa khay có lịch sử.
4. Gói thuê: tên, số ngày, giá VND/khay và trạng thái mở. Thay giá không đổi các hợp đồng đã xác nhận.
5. Môi trường & IoT: tạo device đúng mode; lưu token lúc cấp; có thể đổi token/vô hiệu hóa. Chọn phòng để xem dữ liệu/ngưỡng/camera. Chỉ thao tác dry-run, chưa có điều khiển tải thật.
6. Báo cáo: xem công suất/sản lượng, trung bình môi trường24h; tải CSV thuê/thu hoạch/môi trường. Giới hạn bản ghi xem API doc.

## Farm Operator trên Web

1. Đăng nhập bằng tài khoản được cấp; các mục Tài khoản/Báo cáo admin không xuất hiện. API vẫn tự kiểm tra quyền, việc ẩn menu không thay thế RBAC.
2. Tạo/sửa phòng/khay theo công việc. Phòng có khay đang thuê không được tạm ngưng, khay đang thuê không được chuyển phòng/trạng thái phục vụ.
3. Hợp đồng thuê → Gán khay cho khách → chọn Customer, gói và một hoặc nhiều khay trống. Toàn bộ yêu cầu thành công cùng lúc hoặc bị từ chối; làm mới catalog khi khay bị người khác thuê trước.
4. Chi tiết hợp đồng → Tiến trình: Ủ phôi → Ra quả thể → Sẵn sàng thu hoạch, thêm ghi chú/ngày dự kiến. Không nhảy hoặc quay ngược giai đoạn. Khi sẵn sàng, Ghi thu hoạch theo gram; hệ thống thông báo Customer.
5. Xác nhận đã thu chỉ sau khi thực tế đã thu đủ tiền ngoài hệ thống. Không có cổng thanh toán online.
6. Thu hoạch & giao nhận: tiếp nhận yêu cầu, sau khi bàn giao chọn Đã bàn giao. Hoàn tất hợp đồng chỉ khi đã thu tiền và mọi bản thu hoạch được bàn giao; khay sau đó có thể cho thuê tiếp.
7. Môi trường & IoT: xem nhiệt/ẩm/CO₂ theo phòng và nhãn mô phỏng; lệnh phun sương/quạt/LED/sưởi hiện chỉ dry-run. URL camera không đồng nghĩa camera đã hoạt động.

## Customer trên Flutter

1. Đăng ký email/tên/mật khẩu ít nhất12 ký tự, sau đó đăng nhập. Tài khoản nhân sự không dùng Flutter Customer.
2. Thuê khay → chọn gói và các khay (tối đa20) → Xác nhận thuê. Khay của tôi hiển thị hợp đồng hiện tại và lịch sử; chi tiết có giao dịch, ngày dự kiến và từng khay.
3. Biểu tượng mã khay để liên kết khay đã được cấp. Chỉ biết mã không thể nhận khay của khách khác hoặc bỏ qua quy trình thuê.
4. Mở khay để xem giai đoạn, nhật ký, ngày dự kiến và điều kiện phòng trong thời gian thuê. Hợp đồng đã hoàn tất không được xem môi trường/camera hiện tại. Không có dữ liệu người thuê trước.
5. Khi có thu hoạch, Nhận nấm → Yêu cầu nhận/giao → nhận tại trại hoặc nhập địa chỉ giao. Có thể hủy khi chưa được nhân viên tiếp nhận, hoặc gửi lại yêu cầu đã hủy.
6. Thông báo là in-app, cập nhật khi trang hoạt động; không phải OS push khi app đóng. Hồ sơ cho sửa tên và đăng xuất. Đóng app phải đăng nhập lại vì token chỉ giữ trong bộ nhớ.

## Tình huống thường gặp

| Tình huống | Xử lý |
|---|---|
| 401/phiên hết hạn | Đăng nhập lại; hỏi Admin nếu tài khoản bị khóa |
| 409/khay đã thuê | Làm mới catalog và chọn khay khác; không thử chiếm bằng mã |
| Không đóng được hợp đồng | Kiểm tra công nợ và các harvest chưa bàn giao, kể cả harvest chưa có yêu cầu nhận/giao |
| Chưa có mẫu môi trường | Kiểm tra device, Wi-Fi/API và thời gian thuê; không dùng mẫu của khách trước thay thế |
| Không có live camera | Chưa được cấu hình hoặc chưa có phần cứng; liên hệ Operator |
| Không gửi được lệnh thật | Bản hiện tại chỉ dry-run, chờ nghiệm thu phần cứng/giới hạn an toàn |
| Lịch sử hợp đồng dài | Dùng Trang trước/Trang sau và lọc trạng thái, Web có thêm lọc khách; đổi lọc/làm mới về trang đầu. Các danh sách khác vẫn có giới hạn bản đầu |

Thao tác xóa trên Web yêu cầu người dùng xác nhận và bị FK chặn nếu có lịch sử; không cần xóa database để sửa lỗi nghiệp vụ.
