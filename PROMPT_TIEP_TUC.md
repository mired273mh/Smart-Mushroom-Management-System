# PROMPT TIẾP TỤC SAU KHI HẾT TOKEN / ĐỔI CHAT

**Câu lệnh ngắn chỉ cần gửi cho Codex trong repo này:**

> Tiếp tục đồ án

Dấu chấm cuối câu cũng được chấp nhận. Không dựng lại source đã hoàn thành.

## Nội dung đầy đủ nếu cần

Đây là dự án Smart Mushroom hiện tại, không liên quan code cũ. Đọc `TIEN_DO_CODEX.md` trước, rồi `AGENTS.md`, prompt này, `docs/KE_HOACH_THUC_HIEN.md`, `docs/BANG_KIEM_CHUC_NANG.md`, `docs/DE_TAI_YEU_CAU.md` và ADR. Kiểm tra `git status`, `git diff`, file mới, source/config và test thực tế để đối chiếu nhật ký; xác minh lại những việc chưa có bằng chứng khi phiên trước bị ngắt.

1. Xác định công việc đang dở và kết quả test xác minh được.
2. Hoàn thiện phần đang dở; nếu đã xong thì thực hiện đầu việc chưa hoàn tất có ưu tiên cao nhất trong kế hoạch.
3. Viết code thật, kiểm thử, ghi kết quả và checkpoint sau từng nhóm việc.
4. Giữ nguyên mọi phần đã hoạt động tốt, không làm lại từ số 0, không dựa vào code của dự án cũ.
5. Không tự xóa/ghi đè dữ liệu hoặc file quan trọng. Sau checkpoint an toàn: chạy test liên quan, cập nhật tiến độ/checklist/KIEM_THU, kiểm tra staged diff/secrets rồi commit/push thông thường lên nhánh hiện tại theo AGENTS mục8. Quyền push này đã được người dùng cho phép; không force/reset/rebase, không stage thay đổi của người dùng ngoài phạm vi.
6. Tiếp tục sang hạng mục tiếp theo nếu không gặp blocker cần xác nhận.
7. Ưu tiên lỗi cản chạy demo Windows/Android/Docker và thiếu chức năng bắt buộc. Phân biệt PASS/FAIL/BLOCKED/NOT TESTED, ghi file sửa/lệnh/kết quả thật/việc còn thiếu. Hardware chưa kết nối không được đánh dấu PASS; trước tác vụ dài phải có checkpoint ĐANG LÀM.

Định hướng mới nhất: đồ án môn **HQTCSDL**. Đọc NEXT_TASK ở tiến độ, ưu tiên PostgreSQL/constraint/transaction/concurrency/least privilege/SQL nâng cao có lợi ích thật, rồi nghiệp vụ bắt buộc và tích hợp. Đối chiếu phân loại REQUIRED/SUPPORTING/RECOMMENDED/OPTIONAL trước thêm tính năng; cycle không thuê/retention không tự trở thành bắt buộc. Bộ demo trong docs/demo-hqtcsdl phải có lệnh, dữ liệu riêng/rollback, bằng chứng và giải thích đúng implementation. Không cần lặp cleanup/full build khi Git/source không đổi hoặc test liên quan đã đủ.

Lưu ý: Yêu cầu này **không tự kích hoạt lúc token reset**. Người dùng phải mở repo và gửi lệnh, hoặc dùng một hệ thống tự động bên ngoài được cấu hình riêng.
