# Phạm vi nghiệm thu HQTCSDL

Nguồn nghiệp vụ: DE_TAI_YEU_CAU.md, SRS/USER_REQUIREMENTS; bổ sung phương pháp nghiệm thu từ master HQTCSDL người dùng gửi2026-11-05. Không suy ra mọi tính năng trong backlog cũ đều bắt buộc.

| Nhóm / ID | Mức | Lý do và phạm vi |
|---|---|---|
| A01–A10, O01–O10, C01–C12 | REQUIRED | Ba vai trò và nghiệp vụ được liệt kê trong đề tài; bằng chứng từng ID ở DOI_CHIEU_YEU_CAU.md |
| PostgreSQL/Express REST/React/Flutter/ESP32, nhiệt/ẩm/CO₂ và điều khiển môi trường | REQUIRED | Stack và chức năng gốc; kiểm thử vật lý không được suy từ simulator |
| C09/O06 xem, cấu hình luồng camera | REQUIRED có điều kiện nguồn video | Không đồng nhất yêu cầu phần mềm với việc đề tài ghi camera vật lý optional; hiện URL/ownership có test, luồng thật BLOCKED |
| Mua camera cụ thể / gateway/vendor cloud | OPTIONAL | Không tự chọn dịch vụ trả phí hoặc mặc định người dùng đã mua |
| Auth/session, RBAC, ownership, validation, constraints, transaction/locking, HTTPS deployment | SUPPORTING | Cần cho chức năng bắt buộc đúng và an toàn; opaque session theo ADR003, không đổi sang JWT ngoài yêu cầu |
| Pagination/search/filter/sort danh sách | SUPPORTING | Bảo đảm truy cập dữ liệu khi vượt cap; rentals đã phân trang, các danh sách khác còn cần batch riêng |
| View/function/procedure/trigger hữu ích, roles hạn quyền, EXPLAIN, test SQL và9demo | REQUIRED theo master HQTCSDL mới | Bổ sung độ sâu DB có dùng thực tế, không dựng đối tượng giả để đủ tên; không coi đây là yêu cầu cụ thể của tài liệu đề tài gốc |
| Chu kỳ nuôi gắn khay thuê | REQUIRED | O07/O08/C07 hiện triển khai qua rental_items, growth_events, harvests |
| Module chu kỳ độc lập cho khay không cho thuê | OPTIONAL chưa được quy định rõ | Không tự thêm bảng/module chỉ từ tên đề tài; cần người hướng dẫn xác nhận nếu muốn bắt buộc |
| Retention tự động/scheduled cleanup/soak production | RECOMMENDED | Hữu ích vận hành và hiệu năng; không được tự xóa sensor history/database để thực hiện |
| Materialized view, partitioning, thêm sequence, PID/AI/thanh toán online/SMS | OPTIONAL hoặc ngoài phạm vi | Chỉ dùng khi có bài toán/số liệu/yêu cầu rõ; hiện UUID đủ sinh khóa, không thêm sequence để đủ checklist |
| Phone thật, calibration, relay/camera vật lý và TLS production | Nghiệm thu phụ thuộc môi trường | Ghi BLOCKED/NOT TESTED chính xác; vẫn tiếp tục phần mềm/SQL có thể làm an toàn |

Thứ tự tiếp tục: P0 toàn vẹn/phân quyền/transaction → P1 yêu cầu bắt buộc và SQL nâng cao có test → P2 demo/EXPLAIN/backup/docs → P3 phần cứng cần xác nhận. Cleanup đã đạt ở checkpoint trước, không làm lại khi không có thay đổi cần dọn.
