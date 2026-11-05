# AGENTS.md — QUY TẮC DÀI HẠN CHO CODEX

## 0. Phạm vi và nguyên tắc khởi tạo

- Đây là **dự án Smart Mushroom HOÀN TOÀN MỚI**, bắt đầu từ số 0. Không phụ thuộc code, Git history, file tiến độ, cấu trúc hay giải pháp từ dự án cũ.
- Không sao chép, import hay khôi phục code cũ theo suy đoán. Chỉ làm việc với repository hiện tại, tài liệu yêu cầu trong repo và chỉ dẫn mới nhất của người dùng.
- Ưu tiên đúng đề tài trước: Node.js/Express + PostgreSQL + REST API + React Web + Flutter + ESP32.
- Không thêm hệ quản trị CSDL hoặc framework đối lập trừ khi có yêu cầu rõ. Không tự thêm chức năng thanh toán online, SMS, AI vision hoặc tính năng ngoài phạm vi.
- Người dùng viết tiếng Việt: báo cáo, hướng dẫn và giải thích bằng tiếng Việt; tên biến/hàm/API có thể dùng tiếng Anh rõ nghĩa.

## 1. Quy trình bắt buộc mỗi lượt

1. Đọc `TIEN_DO_CODEX.md` trước khi bắt đầu; sau đó đọc `AGENTS.md`, `PROMPT_TIEP_TUC.md`, `docs/DE_TAI_YEU_CAU.md`, `docs/KE_HOACH_THUC_HIEN.md`, `docs/BANG_KIEM_CHUC_NANG.md` và `docs/QUYET_DINH_KIEN_TRUC.md`. Đối chiếu source/build/test thực tế, không chỉ tin nhật ký.
2. Quan sát **trạng thái thực tế** của repo: `git status`, thay đổi chưa commit, các file vừa sửa, cấu trúc project, cấu hình, test có sẵn. Không mặc định file tiến độ luôn chính xác.
3. Xác định đúng **một nhóm việc kế tiếp có thể kiểm thử** (hoặc một lát cắt end-to-end), nêu ngắn gọn trước khi làm. Nếu mới bắt đầu, làm nhiệm vụ đầu tiên trong `PROMPT_BAT_DAU.md`.
4. Thiết kế tối thiểu vừa đủ, viết code thực, thêm test/lệnh xác minh, tự chạy được thì chạy.
5. Cập nhật `TIEN_DO_CODEX.md`, `docs/BANG_KIEM_CHUC_NANG.md`, `docs/KIEM_THU.md`; cập nhật README khi lệnh cài/chạy thay đổi. Ghi chính xác test PASS/FAIL/CHƯA CHẠY.
6. Sau khi một nhóm việc đạt tiêu chí, chuyển sang nhóm tiếp theo nếu còn phạm vi, thời gian và quyền thực thi; không chờ người dùng trả lời nếu không có blocker/hoạt động rủi ro.
7. Sau mỗi giai đoạn đạt tiêu chí, thực hiện quy trình commit/push ở mục 8. Việc lưu Git không thay thế build/test và checkpoint.

## 2. Câu lệnh rút gọn “Tiếp tục đồ án.”

Khi người dùng gửi **`Tiếp tục đồ án`** hoặc **`Tiếp tục đồ án.`**, phải hiểu là:

- Đọc quy tắc, file tiến độ và các tài liệu phạm vi;
- Đọc `PROMPT_TIEP_TUC.md`; ưu tiên phần đang dang dở và lỗi build/test cản trở demo Windows/Android, không khởi tạo lại dự án;
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
- Demo/test dùng database mới có tên/prefix rõ ràng, không tự seed vào database người dùng. Không log credentials; file tài khoản demo riêng phải bị gitignore. Không dùng kết quả simulator/doctor/compile thay cho Android E2E, Docker runtime hoặc hardware test.
- Không cài/repair phần mềm hệ thống cần quyền quản trị hoặc có nguy cơ ảnh hưởng máy khi chưa được người dùng cho phép. Dependency trong project và kiểm thử trên môi trường đã sẵn sàng thuộc phạm vi công việc bình thường.
- Phần cứng chưa được đề tài chốt: nghiên cứu nguồn nhà sản xuất, ghi BOM/model/điện áp/sơ đồ/giới hạn an toàn để người dùng xác nhận trước lắp/flash/điều khiển thật. Có thể hoàn thiện source driver, backend/client và test mô phỏng có nhãn khi chưa có phần cứng; không dừng công việc phần mềm chỉ vì BOM chưa được xác nhận.

## 5. Ranh giới an toàn

- Không xóa file chưa rõ tác dụng; không xóa database, chạy migration phá hủy, ghi đè dữ liệu thật, rebase/reset hay thay đổi hàng loạt mà chưa xin phép. Commit và push thông thường lên nhánh hiện tại đã được người dùng cho phép theo mục 8.
- Không xóa file tiến độ, tài liệu yêu cầu, Git history hay tài liệu nộp bài.
- Không tự khẳng định đã build/test nếu thực tế chưa chạy. Báo nguyên nhân (thiếu dependency, chưa có thiết bị, thiếu cấu hình...) và hướng khắc phục.
- Không kết thúc chỉ với câu “đã xong”: tóm tắt file chỉnh sửa, lệnh test, tình trạng, bước tiếp theo.

## 6. Tiết kiệm token/hạn mức

- Không audit lại toàn repo trong mỗi lượt khi Git diff và nhật ký đã đủ; chỉ mở rộng khi phát hiện sai lệch.
- Chia thành batch nhỏ, giới hạn phạm vi file, không sinh một lần toàn bộ full-stack mà không test.
- Sau mỗi batch, cập nhật checkpoint trước khi đi tiếp. Hạn mức có thể hết bất ngờ nên không được phụ thuộc vào bước lưu cuối cùng.

## 7. Tài liệu và sản phẩm cần có khi hoàn tất

Yêu cầu cần bám `docs/DE_TAI_YEU_CAU.md`, các deliverables: REST APIs; web Admin/Farm Operator; Flutter Customer; hệ thống IoT. Đồng thời cung cấp phân tích thiết kế UML 2.0, user requirements, SRS, kiến trúc, thiết kế chi tiết, tài liệu triển khai, kiểm thử, hướng dẫn cài đặt và sử dụng theo đề tài.

### Duy trì repository gọn gàng

- Khi tạo file mới, xác định có cần Git theo dõi hay chỉ là file local tái tạo được. Source, migrations, test, scripts, cấu hình mẫu và lockfile phải giữ để clone/build được; build artifacts, cache và file tạm phải bị ignore.
- Kiểm tra import, build/CI, tài liệu và tham chiếu trước khi loại bỏ file; không tạo thêm nhiều file trùng chức năng. Không xóa source đang dùng, tài liệu chính thức, tiến độ hoặc bằng chứng kiểm thử.
- Cleanup chỉ tự xóa output/cache đã xác minh tái tạo được. Giữ `.env` đang dùng, database/backup, trạng thái emulator, log/screenshot/bằng chứng và artifact cần bảo vệ; hỏi trước nếu muốn xóa những dữ liệu này hoặc chưa rõ mục đích.
- Trước xóa đệ quy: kiểm tra đường dẫn tuyệt đối nằm trong workspace, không đi qua symlink/junction, không chứa file Git theo dõi hay dữ liệu cần giữ. Không dùng `git clean -fdx`, force push, hard reset hoặc viết lại lịch sử để dọn repo.
- File sinh tự động cần giữ local nhưng không cần Git có thể dùng `git rm --cached` sau kiểm tra; không bỏ theo dõi lockfile/migration/cấu hình cần thiết. Sau cleanup chạy build/test phù hợp, cập nhật `TIEN_DO_CODEX.md`, commit/push checkpoint an toàn theo mục8. Lệnh “Tiếp tục đồ án” vẫn phải đọc tiến độ và kiểm tra Git/source trước làm tiếp.

## 8. Tự động lưu code lên GitHub (được người dùng cho phép)

- **Quyền thực hiện:** sau mỗi giai đoạn hoàn thành, tự tạo commit và push thông thường lên **nhánh hiện tại** nếu có remote GitHub, quyền truy cập và kết nối. Không cần hỏi lại quyền commit/push đã được cho phép. Không tự đổi nhánh/remote hoặc thiết lập danh tính Git theo suy đoán.
- **Trước khi gọi là hoàn thành:** chạy build/test phù hợp với phạm vi thay đổi; ghi kết quả thực tế PASS/FAIL/CHƯA CHẠY và giới hạn môi trường. Không đánh dấu cả giai đoạn hoàn thành nếu vẫn còn tiêu chí bắt buộc chưa kiểm chứng.
- **Checkpoint:** cập nhật `TIEN_DO_CODEX.md` cùng bảng kiểm/nhật ký kiểm thử liên quan trước commit; ghi nội dung giai đoạn, file thay đổi, lệnh/kết quả và bước tiếp theo.
- **Rà soát trước commit:** kiểm tra `git status`, `git diff`, file mới và `git diff --cached`; kiểm tra các file sắp commit không chứa mật khẩu/token/API key thật, private key, `.env` có thông tin thật, backup/database hoặc artifact chứa credentials. `.env.example` chỉ chứa placeholder; dữ liệu test phải được phân biệt rõ với bí mật thực tế. `.gitignore` không thay thế rà soát staged diff.
- **Commit:** chỉ stage những thay đổi đã kiểm tra và thuộc phạm vi được phép; dùng thông báo mô tả đúng giai đoạn/kết quả. Với việc còn dở có thể commit an toàn với tiền tố `WIP:`, nhưng tiến độ/checklist phải giữ trạng thái đang làm và nêu rõ test chưa đạt/chưa chạy.
- **Push:** xác định nhánh và remote/upstream trước khi đẩy; dùng push thông thường chỉ cho nhánh hiện tại, không đẩy tất cả nhánh/tag. Nếu chưa có upstream nhưng có remote GitHub đã cấu hình rõ ràng, có thể thiết lập upstream cùng tên nhánh. Không đưa credentials vào lệnh, URL remote hay log.
- **Tuyệt đối không** force push (`--force`, `--force-with-lease`), xóa/ghi đè lịch sử Git, xóa nhánh remote, reset/rebase để ép push thành công, hoặc bỏ qua hook/chữ ký/quy tắc bảo vệ nhánh. Khi non-fast-forward hoặc có thay đổi remote chưa tích hợp, ghi lỗi và giữ nguyên code; không tự giải quyết bằng thao tác phá hủy.
- **Khi lỗi:** nếu commit/push thất bại, ghi lỗi đã loại bỏ thông tin nhạy cảm vào `TIEN_DO_CODEX.md`, gồm bước thất bại, nhánh, kết quả thật và cách xử lý tiếp. Lưu nhật ký lỗi cục bộ ngay; có thể tạo thêm commit lưu nhật ký nếu commit hoạt động, không lặp commit/push vô hạn chỉ để ghi kết quả của chính thao tác đó. Thiếu mạng/quyền/danh tính Git không đồng nghĩa mất code hoặc giai đoạn đã được push.
- **Báo cáo:** nêu commit hash, nhánh và kết quả push thực tế sau mỗi batch; chỉ xác nhận đã lên GitHub khi push trả về thành công (hoặc đã kiểm tra remote trùng commit). Giữ nguyên nhật ký trước đây để làm lịch sử; quy tắc mới này thay thế các ghi chú cũ hạn chế push thông thường.
