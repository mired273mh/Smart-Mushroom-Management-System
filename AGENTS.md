# AGENTS.md — QUY TẮC DÀI HẠN CHO CODEX

## 0. Phạm vi và nguyên tắc khởi tạo

- Đây là **dự án Smart Mushroom HOÀN TOÀN MỚI**, bắt đầu từ số 0. Không phụ thuộc code, Git history, file tiến độ, cấu trúc hay giải pháp từ dự án cũ.
- Không sao chép, import hay khôi phục code cũ theo suy đoán. Chỉ làm việc với repository hiện tại, tài liệu yêu cầu trong repo và chỉ dẫn mới nhất của người dùng.
- Ưu tiên đúng đề tài trước: Node.js/Express + PostgreSQL + REST API + React Web + Flutter + ESP32.
- Không thêm hệ quản trị CSDL hoặc framework đối lập trừ khi có yêu cầu rõ. Không tự thêm chức năng thanh toán online, SMS, AI vision hoặc tính năng ngoài phạm vi.
- Người dùng viết tiếng Việt: báo cáo, hướng dẫn và giải thích bằng tiếng Việt; tên biến/hàm/API có thể dùng tiếng Anh rõ nghĩa.

## 1. Quy trình bắt buộc mỗi lượt

1. Đọc `AGENTS.md`, `docs/DE_TAI_YEU_CAU.md`, `docs/KE_HOACH_THUC_HIEN.md`, `docs/BANG_KIEM_CHUC_NANG.md`, `TIEN_DO_CODEX.md` và `docs/QUYET_DINH_KIEN_TRUC.md`.
2. Quan sát **trạng thái thực tế** của repo: `git status`, thay đổi chưa commit, các file vừa sửa, cấu trúc project, cấu hình, test có sẵn. Không mặc định file tiến độ luôn chính xác.
3. Xác định đúng **một nhóm việc kế tiếp có thể kiểm thử** (hoặc một lát cắt end-to-end), nêu ngắn gọn trước khi làm. Nếu mới bắt đầu, làm nhiệm vụ đầu tiên trong `PROMPT_BAT_DAU.md`.
4. Thiết kế tối thiểu vừa đủ, viết code thực, thêm test/lệnh xác minh, tự chạy được thì chạy.
5. Cập nhật `TIEN_DO_CODEX.md`, `docs/BANG_KIEM_CHUC_NANG.md`, `docs/KIEM_THU.md`; cập nhật README khi lệnh cài/chạy thay đổi. Ghi chính xác test PASS/FAIL/CHƯA CHẠY.
6. Sau khi một nhóm việc đạt tiêu chí, chuyển sang nhóm tiếp theo nếu còn phạm vi, thời gian và quyền thực thi; không chờ người dùng trả lời nếu không có blocker/hoạt động rủi ro.

## 2. Câu lệnh rút gọn “Tiếp tục đồ án.”

Khi người dùng chỉ gửi **`Tiếp tục đồ án.`**, phải hiểu là:

- Đọc quy tắc, file tiến độ và các tài liệu phạm vi;
- Kiểm tra code đang có và thay đổi Git chưa commit;
- Xác minh những ghi chú chưa chắc chắn do lần trước bị hết token;
- Hoàn thiện việc đang dở trước, sau đó chọn hạng mục tiếp theo theo kế hoạch;
- Tiếp tục code + test + ghi tiến độ; tránh dựng lại mọi thứ và tránh câu hỏi không cần thiết.

**Không tự tuyên bố có thể tự động chạy đúng giờ reset token.** Chỉ chạy khi phiên Codex được khởi động hoặc nhận yêu cầu mới.

## 3. Quy ước lưu tiến độ (bắt buộc)

- Sau **mỗi nhóm thay đổi có thể kiểm chứng** (ví dụ migration+test, endpoint+test, trang web+test), cập nhật ngay `TIEN_DO_CODEX.md`, không chờ cuối phiên.
- Ghi: ngày/giờ nếu biết, việc đã làm, file đã thêm/sửa, lệnh đã chạy + kết quả thật, blocker, lựa chọn thiết kế, bước tiếp theo cụ thể.
- Trước tác vụ dài, cập nhật `ĐANG LÀM` và tiêu chí hoàn thành; khi hoàn tất đổi thành `HOÀN THÀNH`.
- Nếu lỡ ngắt khi đang sửa, ở lần sau ưu tiên kiểm tra `git diff`, trạng thái file và chạy test để khôi phục ngữ cảnh; không dựa duy nhất nhật ký.
- Không sửa lịch sử theo kiểu xóa dấu vết lỗi; đánh dấu lỗi đã xử lý và bằng chứng xác minh.

## 4. Kỷ luật triển khai

- Ưu tiên tiến trình: đặc tả/kiến trúc → DB/API/auth/RBAC → Web quản trị/vận hành → Flutter khách hàng → IoT → tích hợp/test/triển khai → bộ tài liệu hoàn chỉnh. Có thể chọn lát cắt xuyên suốt để chứng minh hoạt động sớm.
- Mọi chức năng liên quan thuê khay phải xác định quyền sở hữu và tránh đặt thuê trùng/chiếm trùng khay.
- Web chỉ dành cho Admin/Farm Operator theo đề tài; Flutter phục vụ Customer. Quản trị viên được đề xuất cơ chế tạo tài khoản an toàn thay vì mở đăng ký admin công khai.
- Các lựa chọn đề tài KHÔNG chỉ rõ (ORM, MQTT/HTTP, JWT/session, cloud, camera streaming, định dạng thông báo...) cần phân tích và ghi trong `docs/QUYET_DINH_KIEN_TRUC.md` trước khi dùng. Không tuyên bố đây là yêu cầu trong tài liệu gốc.
- Dữ liệu thật, code chạy được và bằng chứng test ưu tiên hơn giao diện giả. Mock/simulator có thể dùng để phát triển khi chưa có phần cứng, nhưng phải ghi rõ là mô phỏng, không gọi là kiểm thử ESP32 thật.
- Với thiết bị vật lý, thử nghiệm dry-run trước. Không ra lệnh điều khiển quạt/sưởi/bơm trên thiết bị thật nếu chưa có xác nhận về phần cứng và giới hạn an toàn.
- Không hardcode secrets; dùng `.env.example` với placeholder; validate input, phân quyền API, tránh lộ dữ liệu của khách thuê khác.

## 5. Ranh giới an toàn

- Không xóa file chưa rõ tác dụng; không xóa database, chạy migration phá hủy, ghi đè dữ liệu thật, thực hiện remote push/rebase/reset hay thay đổi hàng loạt mà chưa xin phép.
- Không xóa file tiến độ, tài liệu yêu cầu, Git history hay tài liệu nộp bài.
- Không tự khẳng định đã build/test nếu thực tế chưa chạy. Báo nguyên nhân (thiếu dependency, chưa có thiết bị, thiếu cấu hình...) và hướng khắc phục.
- Không kết thúc chỉ với câu “đã xong”: tóm tắt file chỉnh sửa, lệnh test, tình trạng, bước tiếp theo.

## 6. Tiết kiệm token/hạn mức

- Không audit lại toàn repo trong mỗi lượt khi Git diff và nhật ký đã đủ; chỉ mở rộng khi phát hiện sai lệch.
- Chia thành batch nhỏ, giới hạn phạm vi file, không sinh một lần toàn bộ full-stack mà không test.
- Sau mỗi batch, cập nhật checkpoint trước khi đi tiếp. Hạn mức có thể hết bất ngờ nên không được phụ thuộc vào bước lưu cuối cùng.

## 7. Tài liệu và sản phẩm cần có khi hoàn tất

Yêu cầu cần bám `docs/DE_TAI_YEU_CAU.md`, các deliverables: REST APIs; web Admin/Farm Operator; Flutter Customer; hệ thống IoT. Đồng thời cung cấp phân tích thiết kế UML 2.0, user requirements, SRS, kiến trúc, thiết kế chi tiết, tài liệu triển khai, kiểm thử, hướng dẫn cài đặt và sử dụng theo đề tài.
