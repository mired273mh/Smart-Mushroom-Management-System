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
