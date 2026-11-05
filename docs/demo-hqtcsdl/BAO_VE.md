# Hỏi đáp bảo vệ theo source

| Câu hỏi | Trả lời gắn với implementation |
|---|---|
| Tại sao PostgreSQL? | Stack đề tài yêu cầu; quan hệ/FK/ACID, partial unique index, row/advisory locks, PLpgSQL và pg_dump/restore đều đang được dùng thật |
| Vì sao3NF? | Tránh lặp user/phòng/gói ở mỗi dòng; rental_items biểu diễn nhiều khay. Snapshot giá/ngày là giá hợp đồng lúc thuê, khác giá plan hiện tại. Xem THIET_KE_CSDL_HQTCSDL |
| PK và FK? | PK UUID định danh và chống NULL/trùng; FK bảo vệ parent tồn tại. Mã tray.code UNIQUE là khóa nghiệp vụ, không thay PK |
| Sequence ở đâu? | Dự án dùng gen_random_uuid, không có sequence. Không thêm sequence để đủ danh mục; UUID thuận tiện cho nhiều client, có đánh đổi kích thước/locality |
| View và materialized view? |2views reports chạy query khi đọc. Materialized view lưu kết quả/cần refresh; chưa triển khai vì chưa có số liệu cần nó |
| Function và procedure? | fn_rental_total_vnd trả bigint snapshot×count, dùng INSERT ledger. sp_confirm_rental_payment dùng CALL, kiểm tra staff/pending; procedure không COMMIT nội bộ và rollback cùng caller |
| Trigger dùng khi nào? | Invariant cần giữ cả SQL trực tiếp: đúng customer của harvest, liên kết lịch sử bất biến. Không nhân đôi toàn bộ validation/notification trong trigger |
| ACID chứng minh thế nào? | Transaction thuê ghi nhiều bảng; fail giữa chừng không có orphan; commit nhìn thấy lại. Có demo/SQL assertions, không nói đã thử mọi lỗi storage vật lý |
| Isolation? | READ COMMITTED mặc định, kết hợp khóa/unique constraint. Không đổi toàn app sang SERIALIZABLE; nếu dùng cần đánh giá retry40001/contention |
| Hai khách cùng khay? | API khóa khay theo UUID rồi kiểm tra/insert; partial UNIQUE(tray_id) WHERE ended_at IS NULL là chốt cuối. API201/409; SQL A COMMIT, B23505/ROLLBACK |
| Hai người confirm cùng giao dịch? | UPDATE WHERE pending trong procedure chỉ1người thành công; P1001→HTTP409. Lỗi sau CALL vẫn rollback paid, đã test |
| Deadlock? | Vòng chờ khóa; dùng thứ tự khóa nhất quán/transaction ngắn và đo/log.40P01 cần cân nhắc retry cảtransaction có giới hạn/idempotent; không tuyên bố app không thể deadlock hoặc đã có retry mọi lỗi |
| RBAC API và DB roles? | users.role là Admin/Operator/Customer. Runtime PostgreSQL dùng chung có DML tối thiểu, report chỉ aggregate views; không tự có RLS theo Customer |
| Runtime có cần owner/superuser? | Không. Login hạn quyền thật đã chạy API, không DDL/TRUNCATE/schema_migrations hoặc UPDATE snapshot. Owner/migrator tách riêng; Compose mặc định dev dùngowner, override runtime được test riêng |
| SQL injection? | Bind $1..$n và validation/allowlist identifier; không ghép input HTTP. Identifier fixture là UUID/regex do test tạo, không từ Customer |
| Index càng nhiều càng tốt? | Không: tốn ghi/dung lượng. Device+time/LIMIT dùng index; EXPLAIN actual rows/time/buffers trên50.000mẫu. ForcedSeq vs normal planner là phép so sánh kiểm soát, không SLA production |
| Backup/Restore? | Custom dump→DBmới, kiểm17table counts/graph/routines/trigger/roles. --no-privileges bỏ ACL nên reapply REVOKE/GRANT; không restore --clean vào DB thật |
| Vì sao Flutter không nối trực tiếp DB? | Không phát DB password cho khách; API tập trung auth/tenant/validation/transaction, dùng chung React/Flutter/ESP32 |
| Dữ liệu ESP32 đã thật chưa? | Server validate range/đơn vị, device token riêng, simulated gán từ mode. Simulator→SQL→client đã test; hardware mode/ACK không chứng minh sensor/relay vật lý |
| Đổi giá plan có đổi lịch sử? | API dùng snapshot rentals; runtime không sửa cột snapshot. Nếu thêm/bớt item/refund/instalment phải thiết kế lại invariant ledger, không mặc định đã hỗ trợ |
| Camera nghiệm thu chưa? | Chưa: URL HTTPS/ownership/client đã có, chưa có luồng camera/gateway thật kiểm chứng. Không coi màn hình trống là livestream PASS |

Khi trình bày mở SQL/source, results.json và explain.json của run đang dùng. PASS9/9 SQL/API demos không đồng nghĩa100% phần cứng/production/toàn bộ yêu cầu. Các giới hạn phải trình bày đúng như bảng kiểm.
