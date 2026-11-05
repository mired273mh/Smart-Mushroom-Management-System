# REST API v0.1 — contrat thực thi

Base `/api`; JSON `{data: ...}`, lỗi `{error:{code,message,fields?}}`. `Authorization: Bearer <token>` cho user, token thiết bị riêng cho `/iot/*`. Không gửi token trong query string. Các input nhạy cảm từ chối trường thừa. Chi tiết validation tại `server/src/`.

Danh sách mặc định100, `?limit=1..200`; environment tối đa1000. **GET /rentals đã có cursor pagination**; các danh sách khác vẫn giới hạn số bản ghi, chưa có pagination đầy đủ. CSV tối đa10.000 dòng; chưa có export bất đồng bộ.

GET /rentals nhận `limit`, `cursor`, `status=active|completed` và `customer_id` (chỉ staff). Trả `{data:[...], pagination:{limit,has_more,next_cursor}}`. Gọi trang đầu không có cursor; trang sau gửi next_cursor với cùng bộ lọc và user. Cursor sai/đổi scope trả422; Customer gửi customer_id bị403. Mảng `data` giữ tương thích client cũ. Cursor không thay thế ownership và không cần lưu bí mật. Không có total/page count; UI lưu stack cursor để quay lại, refresh về đầu. Thứ tự `starts_at DESC,id DESC` giữ chính xác microsecond.

| Method/path | Quyền | Body/ý nghĩa |
|---|---|---|
| GET /health, /ready (ngoài /api) | Public | Liveness / DB readiness |
| POST /auth/register | Public | email, name, password >=12; chỉ Customer |
| POST /auth/login | Public | email, password → token 12 giờ, user |
| POST /auth/logout | User | Thu hồi phiên hiện tại |
| GET/PATCH /auth/me | User | Hồ sơ; sửa name |
| GET/POST /users | Admin | Tạo email/name/password/role; list không trả hash |
| GET /customers | Staff | id/name/email của Customer active, phục vụ gán khay |
| PATCH/DELETE /users/:id | Admin | name/role/active/password; DELETE xóa mềm |
| GET/POST /rooms | Staff | name, description?, active? |
| PATCH/DELETE /rooms/:id | Staff | Không khóa phòng đang thuê; DELETE bị FK chặn khi có dữ liệu |
| GET/POST /trays | Staff | room_id, code (A-Z/0-9/_/-), label, status? |
| PATCH/DELETE /trays/:id | Staff | room_id/label/status; code ổn định, giữ lịch sử |
| GET /plans | User | Customer chỉ xem active |
| POST/PATCH/DELETE /plans[/:id] | Admin | name, duration_days 1..365, price_vnd 0..1e9, active |
| GET /catalog | User | Khay trống/phòng active và gói active |
| GET/POST /rentals | User | plan_id, tray_ids[1..20]; staff phải thêm customer_id, Customer không được thêm |
| GET /rentals/:id | Staff/chủ | Hợp đồng, items, ledger; không phải chủ trả 404 |
| POST /rentals/:id/complete | Staff | Đã thu tiền và bàn giao mọi harvest; giải phóng khay atomically |
| POST /trays/link | Customer | code; cần item đang thuê cấp cho chính mình |
| GET /rental-items/:id | Staff/chủ | Tiến trình/ngày dự kiến/events/harvests |
| POST /rental-items/:id/progress | Staff | stage, note?, expected_harvest_at?; incubation→fruiting→ready |
| POST /rental-items/:id/harvests | Staff | weight_grams, note?; chỉ ready→harvested |
| GET /harvests | User | Theo quyền |
| GET/POST /fulfillment-requests | Customer tạo, staff xem | harvest_id, method pickup/delivery, address nếu giao |
| PATCH /fulfillment-requests/:id | Theo quyền | Staff requested→processing→completed; chủ requested→cancelled→requested |
| POST /transactions/:id/confirm | Staff | Xác nhận thu thủ công một lần |
| GET /notifications | User | Chỉ của chính mình |
| PATCH /notifications/:id/read | Chủ | Đánh dấu đọc |
| GET /dashboard | Staff | Counts/harvest/revenue từ DB |
| GET /reports | Admin | Theo phòng, môi trường 24h |
| GET /reports/export?type=rentals\|harvests\|environment | Admin | Download CSV có chống formula |
| GET /devices | Staff | Trạng thái, không trả token/hash |
| POST /devices | Admin | room_id,name,mode simulator/hardware; token chỉ trả lúc cấp |
| PATCH /devices/:id | Admin | name, active, automation_enabled (chỉ dry-run) |
| POST /devices/:id/rotate-token | Admin | Token mới, token cũ hết hiệu lực |
| GET/POST /devices/:id/commands | Staff | actuator mist/fan/light/heater, enabled, duration_seconds 1..60, dry_run=true |
| GET /rooms/:id/environment | Staff/chủ thuê active | Readings theo phòng; Customer chỉ từ thời điểm thuê đang hoạt động |
| GET/PATCH /rooms/:id/thresholds | Staff xem/Admin sửa | temperature_min/max, humidity_min/max, co2_max, notifications_enabled |
| GET/PATCH /rooms/:id/camera | Staff cấu hình/chủ thuê active xem | `{url: HTTPS hoặc null}`; chưa nghiệm thu live camera |
| POST /iot/readings | Device | temperature °C, humidity %RH, co2 ppm; timestamp/provenance do server gán |
| GET /iot/me | Device | id/room_id/name/mode để firmware/simulator kiểm tra nguồn dữ liệu |
| GET /iot/commands | Device simulator | Dry-run chưa hết TTL 60s; hardware không nhận lệnh vận hành |
| POST /iot/commands/:id/ack | Device simulator đúng chủ | success, result; không replay/ack command hết hạn |

`Staff` = admin/operator. HTTP: 201 tạo, 204 logout/xóa, 401 thiếu phiên, 403 sai role, 404 không tồn tại hoặc sai chủ, 409 xung đột nghiệp vụ/DB, 422 validation, 429 rate limit.

Telemetry bất thường được thông báo tối đa một lần/5 phút/người/phòng; đây là chống spam đơn giản, chưa có cảnh báo đổi mức nghiêm trọng riêng. Automation đề xuất phun sương khi ẩm thấp, quạt khi CO₂/nhiệt cao, sưởi khi nhiệt thấp; chỉ tạo dry-run theo thay đổi trạng thái, chưa phải bộ điều khiển đã hiệu chuẩn. LED chỉ điều khiển dry-run thủ công. Mọi ngưỡng mặc định là dữ liệu phát triển, không phải khuyến nghị trồng cho một giống nấm cụ thể.
