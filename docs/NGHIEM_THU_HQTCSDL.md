# Nghiệm thu Smart Mushroom — HQTCSDL, 2026-11-06

**Sẵn sàng trình diễn phần mềm local và9kịch bản PostgreSQL trong phạm vi đã kiểm chứng. Chưa nghiệm thu toàn hệ thống vật lý/production.** Không gán tỷ lệ hoàn thành hoặc thay kết quả mô phỏng bằng sensor/relay/camera thật.

## Phạm vi đã đáp ứng

- Giữ nguyên PostgreSQL/Express REST/React Admin–Operator/Flutter Customer/ESP32. Không xây dựng lại repo, không lấy code dự án cũ, không đổi auth đang chạy chỉ để có JWT.
- [32 yêu cầu A/O/C](DOI_CHIEU_YEU_CAU.md) có source/test/giới hạn riêng: tài khoản/RBAC, phòng/khay/gói, thuê nhiều khay/định danh/ownership, tiến trình/lịch/thu hoạch, giao dịch thủ công/giao nhận, cảnh báo và giám sát có nhãn nguồn. Các yêu cầu giám sát/điều khiển/camera còn phần nghiệm thu thiết bị bên dưới.
- [Thiết kế DB/3NF/data dictionary](THIET_KE_CSDL_HQTCSDL.md), migrations001–004,17bảng gồm16business+schema_migrations;81constraints/35indexes ở lab được runner kiểm kê. Không thêm bảng/index/sequence chỉ để đủ số lượng.
- HQ1 sửa lỗi SQL fulfillment sai Customer; trigger giữ liên kết lịch sử,2view báo cáo, function snapshot và procedure xác nhận tiền có dùng trong API. Transaction/concurrency/rollback và2login PostgreSQL hạn quyền được chạy thật; không nhầm DB role với role nghiệp vụ hoặc tuyên bố có RLS.
- HQ2 [9demo SQL và hỏi đáp bảo vệ](demo-hqtcsdl/README.md), backup/restore vào DB mới, role/ACL sau restore, Docker runtime hạn quyền, nâng cấp demo3→4 với dump/rehearsal và giữ dữ liệu.
- HQ3 catalog Customer keyset/search/selection qua trang; HQ4 directory rooms/trays/plans/customers/users/devices, React paging/search và lookup gán thuê ngoài200. Giữ availability/ownership/transaction ở server, không tin cursor hoặc UI để cấp quyền.

## Bằng chứng thực chạy

Mọi log `.local/` chỉ lưu local và bị Git ignore vì lab chứa credentials/backup. Không đưa private.json/dump/log có bí mật vào GitHub. Kịch bản và assertions được theo dõi để người khác tái chạy.

| Phạm vi | Trạng thái | Lệnh/bằng chứng và giới hạn |
|---|---|---|
| PostgreSQL/Backend | PASS50/50 | `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/test.ps1`; hq4-backend.log. DB test riêng: PK/FK/NULL/CHECK/unique, ownership, transaction/race, roles/migration/preflight, cursor/search |
| React | PASS build +4tests/13Chrome groups | `npm.cmd run build:web`, `npm.cmd run test:web`; hq4-build.log/hq4-web.log. CRUD/gán/nuôi/thu/tiền/giao, session race, paging/search/lookup>200 và responsive |
| Flutter analyze/widget | PASS sạch +15/15 | hq3-analyze-package-final.log/hq3-tests-package-final.log; mobile source/dependencies giữ nguyên ở HQ4/HQ5 |
| Flutter API/browser | PASS Dart1/1 +Chrome5groups | hq4-dart-live.log/hq3-paging-e2e.log; real HTTP→SQL, cross-page rent2/search/load-next, không suy ra Android chỉ từ browser |
| Android emulator | PASS UI1/1 +SQL ở HQ3 | hq3-android-ui.log; ownAVD5558/10.0.2.2, đăng ký/thuê2/link/SIMULATOR/thu hoạch/giao/hồ sơ/logout. AVD đã dừng đúng tên, giữ userdata; không phone thật |
| APK trình diễn | PASS build target lib/main.dart | hq5-demo-apk.log; `flutter build apk --debug --no-pub -t lib/main.dart`. APK cuối ở mobile/build/app/outputs/flutter-apk/app-debug.apk, không commit artifact. Chưa cài/chạy riêng bản APK cuối sau đổi target; Android UI source đã chạy ở HQ3. JBR native-access warnings không làm build fail, native exit0 |
| HQTCSDL9demo | PASS9/9 sau HQ4 | `node scripts/test-hqtcsdl.mjs`; hq5-sql-demos.log, .local/hq-demo/run-1793898420962-df4eb8/{results,schema,explain}.json. Có SQL2session thật/42501roles/COMMIT/ROLLBACK/backup/API/SIMULATOR |
| EXPLAIN | PASS2plans trên50.000 mẫu mô phỏng | HQ5 forced sequential49.727ms/normal indexed0.044ms; actual JSON. Phép so sánh có kiểm soát ở1run local, không SLA/tải production hoặc giả “trước/sau sửa index” |
| Backup/restore | PASS17table counts/graph/routines/trigger/ACL | Demo7 runner gọi verify-backup vào DB mới. Giữ source/restore/dump, không overwrite DB; reapply PUBLIC REVOKE/grants vì --no-privileges bỏ ACL |
| Docker | PASS Windows runtime HQ2; CI theo commit | hq2-docker-runtime.log: real sm_runtime/no superuser/schemaDDL/migration access; build/up/health/Nginx/login/DB/logout. CI chạy dev smoke rồi runtime profile riêng; xem trạng thái Git/CI dưới |
| Native Windows demo | PASS sau HQ4 | `node scripts/demo.mjs start` → `node scripts/test-demo-smoke.mjs` → stop/status; hq5-demo-smoke.log. API schema4/3role/RBAC/Chrome/directory và mẫu SIMULATOR mới; users3/rentals0 giữ nguyên. Không sửa dữ liệu nghiệp vụ để smoke |
| ESP32 firmware | PASS compile3profiles ở checkpoint trước | Firmware source không đổi trong HQ1–HQ5. Compile/static assertions/simulator/dry-run không chứng minh phần cứng vật lý |

## Phần chưa nghiệm thu và thao tác cần người dùng

| Phần | Trạng thái | Việc cần làm |
|---|---|---|
| A07/O04/C08 đo sensor thực | BLOCKED bởi thiết bị | Xác nhận [BOM/sơ đồ/điện áp/giới hạn](PHUONG_AN_PHAN_CUNG_IOT.md), mua/kết nối theo cấu hình đã duyệt, flash có chủ đích rồi đối chiếu sensor chuẩn và SQL/client |
| O05 điều khiển manual/automatic | BLOCKED phần cứng | Xác nhận relay/GPIO/mức kích/tải/nguồn/cầu chì/thời gian bật trước mở gate/allowlist; dry-run trước, đo pulse/fail-off/mất mạng/reboot/interlock thật. ACK chỉ xác nhận xử lý lệnh, không xác nhận tải điện |
| O06/C09 camera | BLOCKED nguồn video/gateway | Cung cấp luồng HTTPS có quyền xem, thử Web/Android/LAN rồi mạng ngoài; URL contract/ownership đã test, chưa có live feed chứng minh |
| Phone/release/TLS public | NOT TESTED | Chọn máy/domain/cert/signing riêng, cấu hình API thực và CORS, không dùng localhost Android. Không publish APK test/debug như production |
| Native PostgreSQL Windows5432 | Chưa xác thực SQL | Không cần đổi/cài lại để demo hiện tại: portable55439 đã hoạt động. Chỉ dùng5432 sau cấu hình credentials riêng trên máy, không gửi mật khẩu vào chat |
| Production operations | NOT TESTED | Dedicated owner/migrator/runtime/report, backup schedule/off-machine/restore drill, logging/rate/network/firewall theo môi trường đích. Compose mặc định dev dùngowner; runtime override đã test riêng |

Các tool đã chạy: Node/npm.cmd/Git/PostgreSQL/Flutter/Dart/AndroidSDK+NDK/JBR/JDK/Docker+Compose/WSL/ArduinoCLI+ESP32core; không cần cài lại chỉ vì ghi chú kiểm kê cũ. [Báo cáo Windows](KIEM_TRA_MOI_TRUONG_WINDOWS.md) phân biệt lịch sử và checkpoint mới.

## Giới hạn phần mềm được công khai

- History/readings/notifications/harvests/fulfillment/reports còn cap theo [API](API.md), CSV10.000dòng; chưa export bất đồng bộ/retention/soak dài hạn. Dashboard chỉ preview danh sách đầu; dùng trang quản lý để duyệt directory. Không tuyên bố đã phân trang mọi endpoint hoặc production scale.
- Lookup cấu hình/gán thuê theo tiếp trang200 và giữ lựa chọn trong RAM, phù hợp demo; chưa remote/virtualized selector ở quy mô rất lớn. Keyset không tạo snapshot bất biến khi dữ liệu đổi giữa HTTP requests.
- Session giữ trong bộ nhớ, thông báo in-app/polling khi trang hoạt động; không OS push, không online payment/SMS/AI. Những tính năng này không tự trở thành yêu cầu bổ sung.
- Cycle nuôi gắn rental item đã có; cycle cho khay không thuê OPTIONAL, retention/soak RECOMMENDED theo [phân loại phạm vi](PHAM_VI_HQTCSDL.md). Cần giảng viên xác nhận trước mở rộng, không đánh dấu “thiếu bắt buộc” từ backlog cũ.
- Chưa có chứng nhận bảo mật độc lập/tải WAN/calibration/an toàn điện. Không kết luận bảo vệ chắc chắn đạt điểm hoặc đủ nghiệm thu vật lý chỉ từ test phần mềm.

## Chạy trình diễn và khôi phục ngữ cảnh

Theo [Windows demo](DEMO_WINDOWS.md): local-postgres.ps1 → demo init (nếu chưa có) hoặc upgrade (nếu schema cũ) → demo start → smoke → Flutter emulator với10.0.2.2:3000 → luồng thuê/nuôi/thu/giao → demo stop/status. Account ở private.json local, không đưa lên slide/chat. SQLlab dùng test-hqtcsdl.mjs hoặc --prepare và9SQLfiles; --prepare không phải PASS9demo.

Git/CI từng checkpoint nằm ở TIEN_DO_CODEX.md/KIEM_THU.md. HQ1 `8139aae`, HQ2 `228dc68`, HQ3 `be4a174`, HQ4 `338dda1` đã push main/remote trùng hash và CI3jobs success. HQ4 [run42071329560](https://github.com/mired273mh/Smart-Mushroom-Management-System/actions/runs/42071329560) đã xác minh api-web/deployment/android-build success. HQ5 `44a90d96684ee2bc1df1e00b1af00ba5a111b5ba` đã push/ls-remote trùng; run42072667937 đang chạy lúc ghi checkpoint tài liệu, không tự xem là PASS. Xem [CI main mới nhất](https://github.com/mired273mh/Smart-Mushroom-Management-System/actions/workflows/verify.yml?query=branch%3Amain) và đối chiếu head_sha với git rev-parse HEAD; các bản ghi trong tài liệu chỉ phản ánh thời điểm kiểm tra. Không gộp package.json user ngoài phạm vi vào checkpoint; không force/reset/xóa lịch sử.

Khi tiếp tục: đọc AGENTS/PROMPT_TIEP_TUC/TIEN_DO, đối chiếu Git/source/CI HEAD và NEXT_TASK, không làm lại SQL/demo/cleanup đã PASS. Khi chưa có thiết bị, tiếp tục lỗi phần mềm có căn cứ; không tự flash hoặc mở tải.
