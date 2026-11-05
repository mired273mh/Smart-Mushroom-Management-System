# Thiết kế CSDL và từ điển dữ liệu HQTCSDL

Schema chuẩn là migrations001–004; database mới có16 bảng nghiệp vụ +schema_migrations,2views,3functions (2trigger functions) và1procedure. Không dựng bảng chỉ để tăng số lượng. ERD tại [kiến trúc](KIEN_TRUC.md), UML domain tại uml/domain-class.puml. `01_schema.sql` trong bộ demo xuất danh sách cột/type/null/default/constraint/index thực tế, tránh coi bản tóm tắt này thay DDL.

## Từ điển dữ liệu

| Bảng | Dữ liệu chính / khóa | Toàn vẹn và ý nghĩa |
|---|---|---|
| users | UUID PK, email unique/lowercase, name, password_hash, role, active/deleted_at | role CHECK admin/operator/customer; hash không trả API; xóa mềm giữ lịch sử |
| sessions | token_hash PK, user_id FK, expires_at | Chỉ lưu SHA256 token opaque, có hạn; index user_id; không phải JWT |
| rooms | UUID PK, name unique, description, active, camera_url | Một phòng nhiều khay/devices; camera URL là cấu hình, không có video blob |
| trays | UUID PK, room_id FK, code unique, label, status | available/maintenance/retired; thuê được còn phụ thuộc phòng và active rental item |
| rental_plans | UUID PK, name unique, price_vnd, duration_days, active | Giá integer0..1e9, ngày1..365; chỉ active mới thuê qua API |
| rentals | UUID PK, customer_id/plan_id/created_by FK, status, snapshot giá/ngày, starts_at/expected_end_at/completed_at | expected_end>starts; completed tương đương completed_at có giá trị; customer link bất biến, runtime chỉ update status/completed_at |
| rental_items | UUID PK, rental_id/tray_id FK, stage, expected_harvest_at/linked_at/ended_at | UNIQUE(rental_id,tray_id), partial UNIQUE(tray_id) WHERE ended_at IS NULL; liên kết lịch sử bất biến |
| transactions | UUID PK, rental_id FK, amount_vnd bigint, status/method, confirmed_by FK/time | VND nguyên không float; paid bắt buộc actor+time; API tạo1ledger cho thuê mới, schema không giả định UNIQUE rental_id hoặc hỗ trợ thanh toán online |
| growth_events | UUID PK, rental_item_id/created_by FK, stage/note/time | Lưu lịch sử cập nhật; API giữ thứ tự stage và transaction với trạng thái hiện tại |
| harvests | UUID PK, rental_item_id/created_by FK, weight_grams/note/time | Weight1..1e8; API ghi harvest khi ready và chuyển harvested cùng transaction; item link bất biến |
| fulfillment_requests | UUID PK, harvest_id FK+UNIQUE, customer_id FK, method/address/status | Một request/harvest, delivery cần address; trigger kiểm tra customer đúng chủ harvest, links bất biến |
| devices | UUID PK, room_id FK, name, token_hash unique, mode, active/last_seen/automation_enabled | Simulator/hardware do provisioning; token rõ chỉ trả lúc cấp, mode không chứng nhận sensor vật lý |
| sensor_readings | UUID PK, device_id FK, temperature real/humidity real/co2 int/time/simulated | CHECK nhiệt−40..85°C, ẩm0..100%RH, CO₂0..40000ppm; index(device_id,time DESC); dùng real cho đo môi trường, không dùng cho tiền |
| room_thresholds | room_id PK+FK, min/max nhiệt/ẩm, co2_max, notifications_enabled | min<max và range CHECK; API có defaults nếu chưa cấu hình riêng |
| device_commands | UUID PK, device_id/created_by FK, actuator/enabled/duration/dry_run/status/TTL/source/result | CHECK4actuators,1..60s chung; hardware API1..10s, allowlist/freshness; ACK chỉ software, không feedback tải |
| notifications | UUID PK, user_id FK, kind/message, item/reading FK nullable, read_at/time | Scope đúng user trong query; environment dedup5phút/phòng/người ở transaction |
| schema_migrations | filename PK, checksum, applied_at | Owner/migrator dùng để ngăn sửa migration đã apply; runtime không được đọc/ghi |

Các FK đang dùng NO ACTION mặc định cho DELETE/UPDATE; không tự cascade xóa dữ liệu thuê/thu hoạch/tài chính khi xóa user/phòng. UUID sinh bằng gen_random_uuid(), không dùng sequence trong phiên bản này. Unique/PK có index tự tạo; FK không tự đồng nghĩa có index riêng. Chỉ thêm index khi query/EXPLAIN cho thấy cần.

## Chuẩn hóa và dữ liệu lịch sử

1NF: mỗi ô scalar, không lưu danh sách tray IDs trong một cột; rental_items biểu diễn nhiều khay. 2NF: PK UUID đơn; UNIQUE(rental_id,tray_id) ngăn lặp item. 3NF: tách user/phòng/khay/plan/hợp đồng/item/event/harvest/fulfillment/device/sample thay vì lặp tên phòng/gói/customer trong mọi record. Tên hiện tại được JOIN khi hiển thị, không sao chép tự do vào bảng con.

Snapshot giá/ngày của rentals có ý nghĩa **giá hợp đồng tại lúc thuê**, khác giá hiện tại của plan; thay giá plan không làm thay lịch sử. Đây là thuộc tính theo sự kiện/hợp đồng, được giữ có chủ đích để bảo toàn lịch sử. Transaction amount là ledger đã lập, không tính lại bằng giá plan mỗi lần xem. Function fn_rental_total_vnd tính snapshot×số item khi API tạo ledger, trả bigint để tránh tràn integer. Nếu mở rộng thêm/bớt item, installment/refund thì phải thiết kế lại invariant ledger, không giả định schema hiện tại hỗ trợ sẵn.

fulfillment.customer_id là bản sao quan hệ sở hữu để truy vấn tenant thuận tiện; DB trigger bảo đảm khớp harvest→item→rental.customer_id. Trigger identity ngăn rewiring các liên kết sau khi tạo. growth_events giữ lịch sử còn rental_items.stage là trạng thái hiện tại phục vụ query; API transaction cập nhật cả hai. Không tuyên bố mọi chuyển stage/tổng tiền đều được DB kiểm tra bằng constraint: thứ tự stage và nhiều chính sách vẫn ở trusted Backend.

## ACID và xử lý đồng thời

PostgreSQL mặc định READ COMMITTED. Đặt thuê lấy SHARE customer/plan/phòng, khóa khay theo UUID tăng dần, rồi kiểm tra available/busy và ghi rental/items/ledger/notification trong1transaction. Partial unique index là chốt cuối chống2 active item cùng khay. SQL demo2session có1COMMIT và1unique violation/ROLLBACK; API trả201/409 theo kiểm tra nghiệp vụ. Lock ordering giảm deadlock, không tuyên bố loại hết deadlock; khi phát triển luồng mới phải giữ thứ tự và cân nhắc retry40P01/40001 có giới hạn nếu cần.

Tiến trình/harvest khóa parent rental rồi item; complete kiểm tra ledger/fulfillment và đóng items cùng transaction. Procedure confirm chỉ UPDATE pending,2caller đồng thời chỉ1thành công; lỗi phía caller sau CALL vẫn rollback được vì procedure không COMMIT nội bộ. API/migration tự COMMIT/ROLLBACK qua transaction helper. Migration checksum +advisory transaction lock ngăn apply song song/sửa SQL cũ.

## SQL nâng cao đang dùng thực tế

- v_room_cultivation_summary và v_room_environment_24h là nguồn GET /reports; view môi trường có số mẫu simulated/hardware, tránh gọi aggregate mô phỏng là sensor thật.
- fn_rental_total_vnd(uuid): PLpgSQL STABLE/STRICT, dùng khi INSERT ledger. Trả NULL nếu không có rental, không tự tạo hàng tài chính.
- sp_confirm_rental_payment(uuid,uuid): SECURITY INVOKER, kiểm tra staff active, conditional UPDATE, lỗi P1001 nếu không pending; API ánh xạ409. Tham số actor không thay thế authentication; API runtime là trusted connection.
- guard_historical_identity /guard_fulfillment_owner và5triggers: invariant cross-table mà CHECK thông thường không nên truy vấn bảng khác.
- CTE/JOIN/GROUP BY/HAVING/filter/keyset dùng ở schema/report/demo. Không thêm materialized view/partition/sequence hoặc index chỉ để đủ tên kỹ thuật.

[Privileges](https://www.postgresql.org/docs/17/ddl-priv.html), [READ COMMITTED](https://www.postgresql.org/docs/17/transaction-iso.html), [VIEW](https://www.postgresql.org/docs/17/sql-createview.html). [Least privilege/restore ACL](../deploy/database/README.md) và [demo thực chạy](demo-hqtcsdl/README.md) có lệnh/bằng chứng; không gọi profile Compose mặc định là least privilege production.
