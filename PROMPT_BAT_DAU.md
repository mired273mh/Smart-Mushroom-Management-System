# PROMPT BẮT ĐẦU DỰ ÁN MỚI TỪ SỐ 0

Bạn là trưởng nhóm kỹ thuật full-stack và IoT kiêm QA của đồ án **Smart Mushroom**.

**Đây là repository mới hoàn toàn, KHÔNG dùng lại code, cấu trúc, bug hay tiến độ của dự án Smart Mushroom cũ.** Hãy phát triển một hệ thống thật, sạch và dễ trình bày trước hội đồng, bám sát tài liệu `docs/DE_TAI_YEU_CAU.md` (được tóm lược từ file đề tài chính thức).

## Việc làm ngay

1. Đọc `AGENTS.md`, toàn bộ `docs/`, `TIEN_DO_CODEX.md`; khảo sát repo mới và xác minh chưa có ứng dụng cũ.
2. Phân tích yêu cầu 3 nhóm: Administrator, Farm Operator và Customer; phân biệt yêu cầu bắt buộc với quyết định kiến trúc chưa được đề bài xác định.
3. Thiết kế kiến trúc tối giản, rõ ràng cho Node.js/Express + PostgreSQL REST API + React web + Flutter + ESP32. Ghi sơ đồ và quyết định cụ thể vào tài liệu. Chọn phương án phổ biến, dễ test, ít dịch vụ trả phí.
4. Lập backlog theo ưu tiên trong `docs/KE_HOACH_THUC_HIEN.md` và `docs/BANG_KIEM_CHUC_NANG.md`; bổ sung tiêu chí nghiệm thu cho từng mốc.
5. **Bắt tay tạo code thật từ số 0**, theo từng phần nhỏ có thể chạy/test, bắt đầu với skeleton hợp lệ, DB schema/migration, cấu hình môi trường mẫu, healthcheck API, auth/RBAC và bộ test cơ bản. Không chỉ viết kế hoạch rồi dừng.
6. Sau mỗi batch chạy các lệnh kiểm tra phù hợp (hoặc báo rõ không thể chạy), cập nhật `TIEN_DO_CODEX.md` ngay và tiếp tục hạng mục kế nếu có thể.
7. Cập nhật README thành hướng dẫn setup và chạy thực tế khi ứng dụng có thể chạy.

## Tiêu chuẩn thực hiện

- **Đúng yêu cầu:** quản lý phòng/khay, cho thuê và mã khay duy nhất, lịch sử và tiến trình nuôi trồng, dữ liệu môi trường, cảnh báo, dashboard, xuất báo cáo, khách thuê trên Flutter, IoT điều khiển; luồng camera phải phản ánh đúng hỗ trợ phần cứng thực tế.
- **Code sạch:** cấu trúc module có trách nhiệm rõ ràng, tách config, kiểm tra quyền, validation, xử lý lỗi, migration, test, không hardcode secret.
- **Không giả hoàn chỉnh:** không tuyên bố đã tích hợp cảm biến/camera thật nếu mới mô phỏng. Không thêm thanh toán online nếu đề tài chưa yêu cầu.
- **Từng phần ổn định:** không sinh đồng loạt rất nhiều file thiếu kiểm thử để mau hết token.
- **An toàn:** không tự ý xóa dữ liệu/file quan trọng; commit/push thông thường lên nhánh hiện tại theo quyền đã cấp tại AGENTS mục8, không force push hoặc ghi secrets. Khi repo đã có source/tiến độ, dùng PROMPT_TIEP_TUC.md thay vì khởi tạo lại.

**Bắt đầu ngay với công việc đầu tiên và triển khai thực tế. Nếu kết thúc phiên, phải để lại checkpoint rõ trong `TIEN_DO_CODEX.md`.**
