# QUYẾT ĐỊNH KIẾN TRÚC (ADR — GHI NHẬN DẦN)

**Đây là dự án từ số 0. Chưa chọn chi tiết kỹ thuật.** Đề tài chỉ định Node.js/Express, PostgreSQL, REST, ReactJS, Flutter, ESP32 và các loại cảm biến/thiết bị. Những mục sau **chưa được đề bài xác định** nên Codex cần cân nhắc trước khi code:

| Quyết định | Trạng thái lúc khởi tạo |
|---|---|
| Cấu trúc monorepo (ví dụ `server/`, `web/`, `mobile/`, `iot/`) | Đề xuất, chưa chốt |
| ORM/query builder & migration | Chưa chốt |
| Hệ thống auth (JWT/session) và refresh token | Chưa chốt |
| Cơ chế tạo tài khoản Administrator an toàn | Chưa chốt |
| Phương thức truyền ESP32 ↔ server (MQTT/HTTP/...) | Chưa chốt |
| Dữ liệu real-time web/mobile (polling/WebSocket/...) | Chưa chốt |
| Nguồn dữ liệu camera khi có thiết bị hỗ trợ | Chưa chốt |
| Kênh thông báo | Chưa chốt |
| Docker/triển khai và môi trường chạy | Chưa chốt |

## Cấu trúc bản ghi quyết định

### ADR-001 — [Tên quyết định]

- **Ngày:** [ghi khi chốt]
- **Ngữ cảnh:** ...
- **Các phương án:** ...
- **Quyết định:** ...
- **Lý do và hệ quả:** ...
- **Được nêu trong đề tài hay quyết định thiết kế?** ...

Giữ lịch sử khi đổi phương án; không âm thầm sửa quyết định đã dẫn đến code triển khai.

## Các quyết định chốt ngày 2026-11-05

Các dòng “chưa chốt” phía trên là lịch sử khởi tạo. Bảng dưới là quyết định hiện hành, đều là lựa chọn thiết kế, không phải yêu cầu bổ sung của đề tài.

| ADR | Phương án cân nhắc | Quyết định và hệ quả |
|---|---|---|
| 001 | Multi-repo / monorepo | Monorepo `server/`, `web/`, `mobile/`, `iot/`, `docs/`; npm workspaces cho server/web, Flutter và firmware độc lập |
| 002 | ORM / SQL trực tiếp | `pg` + SQL tham số hóa, migration SQL đánh số, checksum và advisory lock; nhìn rõ transaction/ràng buộc PostgreSQL, không thêm ORM |
| 003 | JWT / session opaque | Bearer token ngẫu nhiên 256 bit, lưu SHA-256 trong bảng sessions, hết hạn 12h. Mỗi request đọc user/role/active từ DB; logout/khóa user có hiệu lực ngay. Web giữ token trong bộ nhớ, Flutter phiên bản đầu giữ trong bộ nhớ, đăng nhập lại khi đóng app; không refresh token |
| 004 | Admin đăng ký công khai / bootstrap | CLI tạo admin đầu tiên từ biến môi trường; chỉ admin đã đăng nhập được tạo nhân sự. Public register luôn là Customer, từ chối trường role |
| 005 | Khóa app / khóa DB | Thuê nhiều khay trong transaction, khóa khay theo UUID đã sắp xếp, partial unique index `rental_items(tray_id) WHERE ended_at IS NULL`; snapshot giá, không tự giải phóng khi tới ngày dự kiến |
| 006 | MQTT / HTTP | REST HTTPS cho ESP32, token riêng theo device lưu hash; polling lệnh có TTL; chưa cần broker. Simulator tách và ghi nhãn. Không tự bật thiết bị thật |
| 007 | WebSocket / polling | Web/mobile polling khi trang hoạt động; thông báo in-app trong PostgreSQL. Không SMS, email/push trả phí. Truy vấn có giới hạn |
| 008 | Camera trực tiếp / proxy | Camera có URL HTTPS do nhân viên cấu hình và chỉ trả cho người đủ quyền; chỉ URL không chứa userinfo, không server-fetch (tránh SSRF). Cần gateway/camera kiểm soát truy cập riêng; không đưa camera công khai vào production. Không có hardware thì trả trạng thái chưa cấu hình |
| 009 | Docker / cài native | Node >=22.12, PostgreSQL >=16; dev có thể portable, production Docker Compose + reverse proxy HTTPS. Tạo DB dev/test mới, không dùng database có sẵn hay dữ liệu cũ |
| 010 | Mật khẩu | Node crypto scrypt với salt ngẫu nhiên; không hardcode secret, password 12–128 ký tự; rate-limit đăng nhập; lỗi auth không phân biệt email tồn tại |
| 011 | Xóa cứng / giữ lịch sử | Người dùng xóa mềm; room/tray/plan/device ưu tiên archive hoặc DB RESTRICT. Chưa có retention/xóa telemetry tự động, sẽ hướng dẫn vận hành |

Tham chiếu kỹ thuật: [PostgreSQL constraints](https://www.postgresql.org/docs/current/ddl-constraints.html), [Node.js crypto](https://nodejs.org/api/crypto.html). Kiểm thử sẽ dùng binary công cụ có sẵn trên máy, không sử dụng mã nguồn/dữ liệu dự án khác.

### ADR-012 — Sensor/firmware và giới hạn vận hành (2026-11-05)

- Chọn Arduino framework cho ESP32, SCD4x I²C làm phương án cảm biến nhiệt độ/độ ẩm/CO₂ tích hợp; có thể thay driver khi chốt BOM. Đây là đề xuất phần cứng, không khẳng định người dùng đã có SCD41.
- Firmware kiểm tra `/iot/me` để mode biên dịch khớp mode server; simulator không được dùng token hardware. HTTPS xác minh root CA, đồng bộ NTP, không setInsecure/redirect token; HTTP chỉ mở riêng cho LAN khi dev chủ động cấu hình.
- Relay chưa có sơ đồ/giới hạn an toàn được xác nhận nên firmware không chứa GPIO điều khiển tải; lệnh thật bị server chặn. Compile không phải kiểm thử cảm biến thật. Chưa upload lên ESP32.
- Thư viện chuẩn nhà sản xuất: [Sensirion Arduino SCD4x](https://github.com/Sensirion/arduino-i2c-scd4x), [Espressif TLS example](https://github.com/espressif/arduino-esp32/tree/master/libraries/NetworkClientSecure/examples).

### ADR-013 — Phân trang lịch sử thuê (2026-11-05)

- Chọn keyset `(starts_at DESC, id DESC)` cho GET /rentals thay vì OFFSET, tránh dịch vị trí bản ghi khi có hợp đồng mới. Trả thêm `pagination` bên cạnh mảng `data` để client cũ không bị đổi cấu trúc dữ liệu.
- Cursor base64url chứa vị trí, phiên bản, viewer và bộ lọc; giới hạn độ dài, validate chặt. Cursor không phải secret hay chứng cứ cấp quyền: mỗi trang vẫn lọc customer_id từ user đăng nhập bằng SQL. Cursor đổi viewer/bộ lọc bị từ chối; client phải về trang đầu.
- Giữ timestamp PostgreSQL đủ microsecond khi tạo cursor, vì JavaScript Date chỉ giữ millisecond. Migration003 thêm index hỗ trợ truy vấn; không đổi/xóa lịch sử.
- React/Flutter dùng20 dòng/trang, nút trước/sau và bộ lọc trạng thái; staff thêm filter customer_id. Quay về dùng stack cursor, làm mới/bộ lọc thay đổi xóa stack. Các danh sách khác còn giới hạn bản đầu, cần từng batch riêng.

### ADR-014 — Demo và Android E2E không tác động dữ liệu thật

- Native demo scripts/demo.mjs tạo DB sm_demo_* mới trên local cluster riêng, account/password random lưu .local/demo/private.json (ignored), không seed vào DB dev hoặc lấy .env user làm đích. Init lặp giữ dữ liệu; start/stop điều khiển đúng process demo bằng control key riêng, giữ PostgreSQL/data.
- Android integration_test chạy trên emulator được chỉ định, fixture/DB sm_test_* mới; 10.0.2.2 trỏ API host qua loopback. Ngưỡng/sensor là simulator có nhãn, không gọi hardware test. AVD test riêng trong .local tránh wipe/ghi đè AVD đang dùng của người dùng. App production không thêm backdoor/test route.
- Không đổi auth opaque đang hoạt động sang JWT chỉ vì checklist master nhắc tên JWT: đề tài không bắt buộc định dạng token, ADR003 và tests vẫn là cơ sở.

### ADR-015 — Source điều khiển thật, mặc định khóa hai lớp

- Người dùng cho phép phát triển software khi chưa có thiết bị, nhưng yêu cầu BOM/sơ đồ/điện áp/giới hạn để xác nhận trước triển khai vật lý. [Phương án phần cứng](PHUONG_AN_PHAN_CUNG_IOT.md) đề xuất DevKitC V4/WROOM32E +SCD41 +4 relay4409 active-HIGH, tải prototype12VDC. Không giả định đã mua hoặc được phép flash/cấp tải.
- Giữ REST/HTTP và data model hiện có; server allowlist UUID rỗng mặc định, firmware compile gate0 mặc định. Không thêm công tắc API tự mở quyền hardware. Web mặc định dry-run, Flutter Customer chỉ quan sát. Không thay sensor thật bằng simulator để nghiệm thu.
- Pending physical command TTL15s, duration1–10s, sample freshness30s, poll/ack revalidate token trong transaction; pending cùng actuator bị thay thế. Firmware pure pulse policy có constexpr assertions, task FreeRTOS riêng, fail-off15s server/30s sample, không kéo dài ON đang bật, fan/heater interlock và cache ID chống áp dụng lặp. Automation ON chỉ yêu cầu lại sau30s; không phải bộ điều khiển PID hoặc chứng nhận an toàn điện.
- ACK chỉ xác nhận lịch GPIO, chưa có feedback điện. Hardware/electrical/condensation/calibration/camera và giới hạn tải chưa kiểm thử; nguồn/cầu chì/thermostat độc lập vẫn cần xác nhận. Biên dịch cả3 profile không upload thiết bị.

### ADR-016 — HQTCSDL: integrity ở DB, routines thực dụng và least privilege

- Migration004 giữ schema/bảng và API contract; preflight dừng khi fulfillment.customer_id khác chủ harvest. Không tự sửa/xóa dữ liệu, không thay001–003. Trigger giữ các liên kết lịch sử rentals.customer_id, rental_items.rental_id/tray_id, harvests.rental_item_id và fulfillment.harvest_id/customer_id; trigger owner kiểm tra insert/update. Bảo vệ SQL trực tiếp, không chỉ UI/API. Không phải RLS toàn hệ thống hoặc xác thực danh tính người gọi SQL.
- Hai view thay SQL reports cũ, bổ sung simulated/hardware counts; PLpgSQL function tính tiền từ snapshot hợp đồng, procedure thay UPDATE thu tiền trong API. Procedure SECURITY INVOKER, không COMMIT nội bộ, caller transaction giữ nguyên rollback. Custom P1001 ánh xạ409 như behavior cũ. Không giữ hai bản logic thu tiền song song.
- UUID vẫn là khóa chính mặc định; không thêm sequence giả. Không thêm bảng/index khi chưa có bài toán/số liệu. Các FK mặc định NO ACTION và partial unique active tray giữ nguyên; cross-row ownership dùng trigger vì CHECK không nên truy vấn bảng khác.
- deploy/database/grants.sql dành cho DBA trên dedicated DB với2 role mới không privileged/owner: runtime có DML theo bảng cần dùng, không schema_migrations/DDL/TRUNCATE; report chỉ2views aggregate không PII. 3 vai trò nghiệp vụ vẫn ở Backend, không tự biến thành3 PostgreSQL login. Test dùng login/password random sm_test_* và thu hồi/xóa đúng role fixture, giữ DB/data. Chưa đổi credentials/quyền dev/demo/Compose có sẵn.
- pg_restore --no-owner --no-privileges là restore portable nhưng bỏ ACL; phải reapply routine PUBLIC REVOKE và grants trước dùng runtime/report. Backup test kiểm chứng17table row counts, graph thuê/harvest, views/function/procedure/trigger và role sau restore vào DB mới.
- [PostgreSQL17 privileges](https://www.postgresql.org/docs/17/ddl-priv.html), [CREATE TRIGGER](https://www.postgresql.org/docs/17/sql-createtrigger.html), [procedure](https://www.postgresql.org/docs/17/sql-createprocedure.html). Mục tiêu kỹ thuật và mức bắt buộc theo [phân loại HQTCSDL](PHAM_VI_HQTCSDL.md).
