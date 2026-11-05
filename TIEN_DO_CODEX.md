# TIẾN ĐỘ CODEX — SMART MUSHROOM (DỰ ÁN MỚI)

> **Trạng thái khởi tạo:** CHƯA CÓ SOURCE CODE ỨNG DỤNG. Đây là repository mới, không nhập tiến độ/bug từ dự án cũ.
>
> **Quy tắc:** Codex phải cập nhật sau mỗi batch code/test. Nếu bị ngắt, phải đối chiếu Git diff và code thực tế khi tiếp tục. Không được tự ghi PASS khi chưa chạy.

## 1. Trạng thái nhanh

- **Mốc hiện tại:** P0 — khởi tạo repo, kiến trúc và project skeleton.
- **Đang làm:** Chưa bắt đầu. Dùng `PROMPT_BAT_DAU.md` trong phiên Codex đầu tiên.
- **Đã hoàn thành:** Bộ tài liệu hướng dẫn ban đầu.
- **Chưa hoàn thành:** Toàn bộ code ứng dụng và kiểm thử.
- **Blocker:** Chưa ghi nhận.
- **Công việc tiếp theo chính xác:** Đọc yêu cầu; quyết định kiến trúc; tạo project skeleton; cấu hình backend PostgreSQL; chạy healthcheck/test đầu tiên.
- **Lệnh tiếp tục:** `Tiếp tục đồ án.`

## 2. Trạng thái các giai đoạn

| Mốc | Nội dung | Tình trạng | Bằng chứng |
|---|---|---|---|
| P0 | Kiến trúc, repo, skeleton, .env.example, tài liệu chạy | Chưa bắt đầu | — |
| P1 | PostgreSQL, Express API, auth/RBAC, quản lý nền tảng | Chưa bắt đầu | — |
| P2 | React Web: Administrator và Farm Operator | Chưa bắt đầu | — |
| P3 | Flutter App: Customer | Chưa bắt đầu | — |
| P4 | ESP32 + cảm biến/điều khiển + camera theo phạm vi khả thi | Chưa bắt đầu | — |
| P5 | Tích hợp, bảo mật, kiểm thử, triển khai | Chưa bắt đầu | — |
| P6 | UML 2.0, SRS, thiết kế, test plan, cài đặt, hướng dẫn | Chưa bắt đầu | — |

**Trạng thái được dùng:** `Chưa bắt đầu` / `Đang làm` / `Bị chặn` / `Đã kiểm thử` / `Hoàn thành (chưa kiểm thử)`.

## 3. Nhật ký thực hiện (Codex nối thêm sau MỖI batch)

### Mẫu bản ghi

- **Thời điểm:** [nếu xác định được]
- **Mốc / hạng mục:** [P0/P1/...]
- **Việc đã làm thực tế:** ...
- **File mới / sửa:** ...
- **Lệnh đã chạy + kết quả:** `...` → PASS/FAIL/CHƯA CHẠY, lý do
- **Lỗi còn tồn tại / blocker:** ...
- **Công việc tiếp theo nhỏ nhất có thể làm:** ...
- **Git:** các file chưa commit, thay đổi cần review

## 4. Nhật ký quyết định, vấn đề cần người dùng xác nhận

- Chưa có.

## 5. Tiêu chí để gọi một phần là hoàn thành

- Có file source/di trú/cấu hình tương ứng và tài liệu chạy.
- Đã chạy kiểm tra phù hợp hoặc nêu rõ giới hạn kiểm thử.
- Đúng quyền truy cập, không dùng dữ liệu giả để giả mạo kết quả thật.
- Checkbox trong `docs/BANG_KIEM_CHUC_NANG.md` được cập nhật có bằng chứng.
