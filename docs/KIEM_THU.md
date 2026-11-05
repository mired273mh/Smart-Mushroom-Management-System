# NHẬT KÝ KIỂM THỬ / BẰNG CHỨNG

> Dự án mới chưa có phần mềm để test. **Không ghi PASS trước khi chạy thực tế.** Mỗi batch, Codex thêm kết quả của lệnh được chạy.

## Mẫu bản ghi

| Thời điểm | Module / chức năng | Lệnh test | Kết quả | Bằng chứng / lý do không chạy |
|---|---|---|---|---|
| Chưa bắt đầu | Chưa có | — | CHƯA CHẠY | Repo mới, chưa có ứng dụng |

## Nhóm kiểm thử cần có trước khi hoàn thành

- Migration/DB integrity: unique tray code; không gán trùng khay; transaction thuê nhất quán.
- Auth/RBAC: Admin/Operator/Customer không truy cập trái quyền; Customer không xem khay người khác.
- API validation và handling: dữ liệu sai, thiếu, truy cập bị từ chối.
- Web React: build, route, form, biểu đồ thật, cập nhật phản hồi API.
- Flutter: `flutter analyze`, widget/test khi phù hợp, luồng Customer.
- IoT: dữ liệu cảm biến, ngưỡng cảnh báo, điều khiển và trạng thái thiết bị; tách mô phỏng và phần cứng thật.
- Tích hợp end-to-end, kiểm tra hướng dẫn cài đặt, sao lưu/cấu hình bảo mật.

## Quy ước

- `PASS`: đã chạy, có kết quả tốt.
- `FAIL`: đã chạy, lỗi còn tồn tại; dẫn đến task sửa lỗi.
- `CHƯA CHẠY`: thiếu môi trường, thiếu thiết bị, hoặc chưa tới giai đoạn; ghi rõ lý do.
- `MOCK/PASS`: chỉ phần mô phỏng PASS, không tương đương kiểm thử phần cứng.
