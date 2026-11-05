# SMART MUSHROOM — DỰ ÁN MỚI TỪ SỐ 0

**Tên đề tài:** Xây dựng hệ thống quản lý nuôi trồng nấm thông minh tích hợp chức năng cho thuê và giám sát từ xa.

**English:** Building a Smart Mushroom Cultivation Management System with Rental and Remote Monitoring Features.

> Đây là bộ tài liệu điều khiển AI/Codex cho một **repository mới**. Không chứa, kế thừa, hoặc tái sử dụng code/tiến độ của dự án cũ. Hiện tại đây **chưa phải là ứng dụng đã chạy được**.

## Công nghệ theo đề tài

- **Server:** Node.js + ExpressJS, RESTful API.
- **Database:** PostgreSQL.
- **Web quản trị/vận hành:** ReactJS.
- **Mobile khách hàng:** Flutter.
- **IoT:** ESP32, cảm biến nhiệt độ/độ ẩm/CO₂; hệ thống phun sương, quạt thông gió, LED trồng, sưởi.
- **Camera:** module/IP camera là phần cứng tùy chọn trong đề tài, nhưng nhu cầu xem trực tiếp vẫn phải được phân tích và báo cáo mức độ triển khai thực tế.

## Dùng lần đầu với Codex trong VS Code

1. Tạo một thư mục/repository GitHub **mới, sạch**.
2. Chép **toàn bộ** các file trong gói này vào thư mục gốc, giữ nguyên cấu trúc `docs/` và `.github/`.
3. Mở đúng thư mục đó bằng VS Code (File → Open Folder).
4. Mở Codex, dán nội dung `PROMPT_BAT_DAU.md` hoặc gửi: **`Bắt đầu đồ án mới theo AGENTS.md và PROMPT_BAT_DAU.md.`**
5. Kiểm tra các thay đổi và chạy thử theo hướng dẫn Codex; commit theo giai đoạn lên GitHub.

## Khi Codex bị hết token / hết lượt

Sau khi có lại hạn mức, mở **cùng repository** và nhập đúng câu:

> **Tiếp tục đồ án.**

`AGENTS.md` yêu cầu Codex đọc `TIEN_DO_CODEX.md`, kiểm tra Git và code hiện tại rồi tự tiếp tục việc kế tiếp. **Không có cơ chế tự chạy lại chỉ vì hạn mức vừa được đặt lại.** Trường hợp bị cắt đột ngột, file tiến độ có thể chưa kịp cập nhật; mã nguồn và lịch sử Git mới là căn cứ kiểm chứng.

Nếu mở chat mới, bạn vẫn có thể nói **`Tiếp tục đồ án.`** miễn là đang mở đúng thư mục repo có `AGENTS.md` và `TIEN_DO_CODEX.md`.

## Các file quan trọng

| File | Mục đích |
|---|---|
| `AGENTS.md` | Quy tắc làm việc dài hạn dành cho Codex |
| `PROMPT_BAT_DAU.md` | Lệnh dựng dự án sạch từ đầu |
| `PROMPT_TIEP_TUC.md` | Lệnh tiếp tục khi ngắt giữa chừng |
| `TIEN_DO_CODEX.md` | Nhật ký trạng thái được cập nhật thường xuyên |
| `docs/DE_TAI_YEU_CAU.md` | Đặc tả bám sát file đề tài gốc |
| `docs/KE_HOACH_THUC_HIEN.md` | Mốc triển khai, tiêu chí hoàn thành |
| `docs/BANG_KIEM_CHUC_NANG.md` | Checklist theo nhóm vai trò và yêu cầu |
| `docs/QUYET_DINH_KIEN_TRUC.md` | Ghi lại lựa chọn kiến trúc (không tự nhận là yêu cầu đề tài) |
| `docs/KIEM_THU.md` | Khung test và bằng chứng xác minh |
| `.github/copilot-instructions.md` | Hướng dẫn cùng mục đích cho GitHub Copilot |
| `.gitignore` | Tránh đưa file build, secret, dữ liệu máy cá nhân lên GitHub |

## Quy tắc GitHub

- Không commit `.env`, khóa API, mật khẩu, token, dữ liệu cá nhân hay file database thật.
- Review `git status` và `git diff` trước khi commit.
- Commit nhỏ theo từng tính năng ổn định; không để Codex tự push lên remote hoặc xóa nhánh nếu chưa hỏi.
- Khi chưa có source code, README này là tài liệu khởi đầu. Sau khi tạo app, Codex phải bổ sung lệnh chạy thực tế, yêu cầu phiên bản và hướng dẫn setup vào README.

**Nguồn phạm vi:** File `De tai.docx` người dùng cung cấp. Những lựa chọn thiết kế cụ thể chưa có trong đề tài phải được ghi là đề xuất trong `docs/QUYET_DINH_KIEN_TRUC.md`, không tự nhận là yêu cầu bắt buộc.
