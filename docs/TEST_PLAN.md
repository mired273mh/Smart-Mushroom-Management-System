# Test Plan và báo cáo nghiệm thu

Phạm vi: kiểm chứng đúng đề tài và các ràng buộc SRS trên source mới. Bằng chứng từng lần chạy và lỗi đã sửa tại `KIEM_THU.md`, không xóa lịch sử FAIL.

## Các mức kiểm thử

| Mức | Dữ liệu/môi trường | Lệnh | Đã chạy |
|---|---|---|---|
| PostgreSQL + HTTP integration | DB `sm_test_*` mới, không mock DB | `npm test` / Windows `scripts/test.ps1` | PASS32/32 |
| React browser E2E |Chrome headless, API+DB thật | `npm run test:web` |PASS2 client tests +9 nhóm, gồm Admin logout1280x720 |
| React production build | Vite/React | `npm run build:web` | PASS |
| Flutter unit/widget | MockClient, không sensor/API thật | `flutter test` trong mobile | PASS12/12 |
| Flutter client integration | Dart/MushroomApi gọi API/DB thật | `npm run test:mobile:api` | PASS1/1 |
| Flutter browser UI E2E | Flutter Web build, Chrome, API/DB thật | `npm run test:mobile:web` | PASS4 nhóm; không phải Android |
| Flutter static/build | SDK3.47.9, Dart3.13.7 | `flutter analyze`, `flutter build web --no-wasm-dry-run` | PASS |
| Simulator executable | Node HTTP → PostgreSQL, dry-run ack | Nằm trong `npm test` | PASS |
| Firmware compile | ESP32 core3.3.3, cả2 mode | `scripts/compile-iot.ps1` | PASS2/2, không upload |
| Backup/restore | Fixtures test → DB mới | `npm run test:backup` | PASS |
| Compose cấu hình | Standalone CLI5.7.0, không Engine | `docker-compose -f compose.yaml config --quiet` | PASS |
| UML render | PlantUML1.2026.9/JRE21/Smetana | `scripts/render-uml.ps1` | PASS6/6 |
| Docker runtime | Ubuntu CI, DB mới mỗi runner | Compose build/up + `npm run test:deploy` | PASS job deployment42005126537 |
| CI đầy đủ | Ubuntu/PostgreSQL/Chrome/Flutter/Docker | `.github/workflows/verify.yml` | PASS2 jobs run42005126537/3c14bc8 |
| Tải đọc local |20 sessions,400 rentals,1000 readings | `npm run test:load` | PASS200 request/0 lỗi; p95 33,42–42,07ms |
| TLS production | Chưa domain/certificate môi trường đích | deployment acceptance | CHƯA CHẠY |
| Android APK +emulator |SDK36/NDK28.2/Android17 API37 emulator5558, DB mới |flutter build apk; node scripts/test-mobile-android.mjs |PASS build +1 UI flow với SQL hậu kiểm; không phone thật |
| Android phone/release |Chưa phone/signing/HTTPS public |device acceptance |NOT TESTED |
| Docker Windows |Desktop4.98/WSL3.0.3/Engine29.9.2, project riêng |compose build/up +test:deploy |PASS master batch |
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
| REV01 | Reset/login race, rotate/ingest race, timestamp microsecond boundary |401 sau reset/rotate; không lộ mẫu trước lúc thuê | review-regression.test.js |
| REV02 | PATCH room/plan/tray, sửa label khay thuê, xóa Customer còn thuê | Giữ trường bỏ qua; sửa label được; không xóa Customer active rental | review-regression.test.js |
| REV03 |401/logout/profile cũ sau đăng nhập mới; catalog bị thay đổi | Không mất/đổi user mới; selection hết hạn bị loại | review_session_catalog_test.dart + React E2E |
| REV04 | HTTP dev URL giả dạng private IP | Từ chối hostname/userinfo/invalid octets/port | ESP32 url_policy.h static assertions |

## Điều kiện nghiệm thu còn thiếu

Master mới nhất đã build APK debug và chạy Android emulator UI→API→PostgreSQL; phần Android/signing bên dưới còn phone/release, không còn thiếu SDK/NDK. Thêm `server/test/hardware.test.js` cho config khóa, auth, freshness, pulse limits, TTL/ACK/supersede, automation và room-lock expiry. Firmware pulse_policy.h kiểm chứng logic constexpr ở3 profile; không thay thử nghiệm điện/board. BOM và acceptance procedure tại [phương án IoT](PHUONG_AN_PHAN_CUNG_IOT.md).

- Rà soát học thuật UML đã render với người hướng dẫn; browser test thêm mọi nhánh account/camera/config.
- Android build/signing và kiểm thử trên điện thoại/emulator. Flutter UI browser E2E đã PASS luồng chính, vẫn chưa thay thế kiểm thử mobile đích.
- Workflow Linux tổng và Docker build/compose smoke đã PASS run42005126537. Staging HTTPS và backup lịch vận hành chưa nghiệm thu.
- Cảm biến hiệu chuẩn, soak test kết nối, fail-safe relay sau xác nhận phần cứng, live camera bảo vệ truy cập.
- Benchmark đọc local20 người đã PASS với400 rentals/1000 samples; còn đo dữ liệu lớn, ghi đồng thời, WAN/TLS và soak test. Retention và pagination ngoài lịch sử thuê chưa hoàn thiện; không suy ra capacity production từ benchmark ngắn.

Chỉ nghiệm thu toàn bộ hệ thống sau khi các mục môi trường/thực địa được chạy và ghi bằng chứng. Bản hiện tại đủ kiểm chứng nhiều luồng phần mềm local, chưa phải nghiệm thu triển khai vật lý/production.
