# Test Plan và báo cáo nghiệm thu

Phạm vi: kiểm chứng đúng đề tài và các ràng buộc SRS trên source mới. Bằng chứng từng lần chạy và lỗi đã sửa tại `KIEM_THU.md`, không xóa lịch sử FAIL.

## Các mức kiểm thử

| Mức | Dữ liệu/môi trường | Lệnh | Đã chạy |
|---|---|---|---|
| PostgreSQL + HTTP integration | DB `sm_test_*` mới, không mock DB | `npm test` / Windows `scripts/test.ps1` | PASS24/24 |
| React browser E2E | Chrome headless, API+DB thật | `npm run test:web` | PASS6 nhóm |
| React production build | Vite/React | `npm run build:web` | PASS |
| Flutter unit/widget | MockClient, không sensor/API thật | `flutter test` trong mobile | PASS7/7 |
| Flutter client integration | Dart/MushroomApi gọi API/DB thật | `npm run test:mobile:api` | PASS1/1 |
| Flutter browser UI E2E | Flutter Web build, Chrome, API/DB thật | `npm run test:mobile:web` | PASS4 nhóm; không phải Android |
| Flutter static/build | SDK3.47.9, Dart3.13.7 | `flutter analyze`, `flutter build web --no-wasm-dry-run` | PASS |
| Simulator executable | Node HTTP → PostgreSQL, dry-run ack | Nằm trong `npm test` | PASS |
| Firmware compile | ESP32 core3.3.3, cả2 mode | `scripts/compile-iot.ps1` | PASS2/2, không upload |
| Backup/restore | Fixtures test → DB mới | `npm run test:backup` | PASS |
| Compose cấu hình | Standalone CLI5.7.0, không Engine | `docker-compose -f compose.yaml config --quiet` | PASS |
| UML render | PlantUML1.2026.9/JRE21/Smetana | `scripts/render-uml.ps1` | PASS6/6 |
| Docker/CI remote/TLS production | Chưa có môi trường/chưa push | compose/Actions/deployment | CHƯA CHẠY |
| Android APK/emulator/điện thoại | Thiếu Android SDK | doctor/build/install | CHƯA CHẠY |
| Sensor/relay/camera thực | Chưa có phần cứng được xác nhận | Theo IoT checklist | CHƯA CHẠY |

## Matrix các tình huống rủi ro chính

| ID | Trường hợp | Kết quả mong đợi | Bằng chứng |
|---|---|---|---|
| SEC01 | Public register gửi role=admin | 422, không tạo admin | foundation |
| SEC02 | Session hết hạn/khóa/logout/reset | 401 ngay, token DB là hash | foundation/rentals/security |
| SEC03 | Operator gọi admin, Customer gọi staff | 403 | rentals/iot/browser |
| TEN01 | Khách khác đọc rental/item/link code | 404, không lộ tenant | rentals |
| TEN02 | Environment/camera phòng không thuê | 404; history không trước thuê | iot |
| TEN03 | Cùng khay thuê lại | Item mới không thấy growth/harvest cũ | operations |
| DB01 | Hai yêu cầu đồng thời thuê cùng khay | Một201, một409; chỉ một active item | rentals |
| DB02 | Nhiều khay có một khay bận | Không tạo hợp đồng/items một phần | rentals |
| DB03 | Code trùng/FK có lịch sử | 409 và dữ liệu giữ nguyên | rentals |
| BIZ01 | Nhảy stage/harvest chưa ready | 409; luồng đúng ghi event/notification | operations |
| BIZ02 | Khách khác yêu cầu delivery/thiếu address | 404/422 | operations |
| BIZ03 | Confirm payment/customer, close pending | 403/409; close đúng giải phóng khay | operations |
| IOT01 | Dùng session user làm device/sai provenance | 401/422, timestamp/mode server gán | iot |
| IOT02 | Đổi token/ack sai device/replay/expired | 401/404, không phát hardware command | iot |
| IOT03 | Abnormal liên tiếp | Cảnh báo đúng chủ, dedup5phút | iot |
| EXP01 | CSV có công thức | Prefix an toàn, quoting đúng | operations |
| UI01 | Login→CRUD→gán→progress→harvest→giao | Lưu DB thật, không pageerror | web/test/e2e.mjs |
| MOB01 | Staff vào Customer app, invalid input/network | Từ chối, thông báo đọc được | mobile tests |
| REC01 | Phục hồi dump | DB mới có dữ liệu/migrations đúng | verify-backup |
| PAGE01 | >100 hợp đồng, timestamp ties/microsecond | Duyệt207 bản ghi không mất/lặp, giữ ownership/filter | pagination.test.js |
| PAGE02 | UI đổi trang/filter/HTTP lỗi | Reset cursor, prev/next chính xác, lỗi có retry | React E2E + Flutter widget + live API |
| MOB02 | UI Flutter register→rent2→item/env→link→delivery→notifications/profile/logout | DB thật, đúng chủ, validate địa chỉ, hủy/gửi lại, staff denied | scripts/test-mobile-web.mjs |

## Điều kiện nghiệm thu còn thiếu

- Rà soát học thuật UML đã render với người hướng dẫn; browser test thêm mọi nhánh account/camera/config.
- Android build/signing và kiểm thử trên điện thoại/emulator. Flutter UI browser E2E đã PASS luồng chính, vẫn chưa thay thế kiểm thử mobile đích.
- Docker build/compose, GitHub Actions thực tế, staging HTTPS và backup lịch vận hành.
- Cảm biến hiệu chuẩn, soak test kết nối, fail-safe relay sau xác nhận phần cứng, live camera bảo vệ truy cập.
- Đo p95/tải20 người dùng, dung lượng retention, pagination các danh sách ngoài lịch sử thuê. Đã test207 rentals và UI122 rentals; chưa có benchmark, không suy ra mục tiêu1giây từ test chức năng.

Chỉ nghiệm thu toàn bộ hệ thống sau khi các mục môi trường/thực địa được chạy và ghi bằng chứng. Bản hiện tại đủ kiểm chứng nhiều luồng phần mềm local, chưa phải nghiệm thu triển khai vật lý/production.
