# NHẬT KÝ KIỂM THỬ / BẰNG CHỨNG

> Lịch sử khởi tạo: repository ban đầu chưa có phần mềm. Kết quả thực tế sau triển khai được nối vào bảng dưới. **Không ghi PASS trước khi chạy thực tế.**

## HQTCSDL HQ1 — 2026-11-05

| Kiểm tra | Kết quả thực tế | Bằng chứng / giới hạn |
|---|---|---|
| Direct SQL fulfillment sai chủ trước sửa | FAIL đã tái hiện | hq1-ownership-before.log: SQL được chấp nhận dù API có ownership guard |
| Backend sau migration004/routines/trigger | PASS45/45 | scripts/test.ps1; hq1-database-full.log;7 DB cases mới, không skip |
| SQL PK/FK/NULL/UNIQUE/CHECK, history ownership, snapshot, view provenance | PASS | server/test/database.test.js; SQL trực tiếp trên PostgreSQL thật |
| Procedure +caller ROLLBACK +confirm race | PASS | SQL invalid actor23514, lỗi cuối transaction rollback payment,2API confirm200/409 |
| Roles hạn quyền thật /API | PASS |2login random sm_test_*, runtime không DDL/TRUNCATE/schema_migrations, report không users/function; runtime API login/rent/confirm/fulfillment/report/logout PASS; roles fixture đã thu hồi/xóa, giữ DB |
| Upgrade3→4, preflight fail/idempotent | PASS | DB legacy riêng, mismatch chặn trước tạoobjects; sau sửa đúng fixture test migrate2lần giữ dữ liệu |
| Backup/Restore | PASS | hq1-backup.log;17table row counts, graph thuê/harvest/snapshot, view/function/procedure/trigger và actual roles sau portable restore; nguồn/dump/DB mới giữ nguyên |
| React | Build +2tests/11nhóm Chrome PASS | hq1-web-build.log, hq1-web-tests.log |
| Flutter live Dart API | PASS1/1 | hq1-dart-api.log; không thay UI, chưa chạy lại Android UI ở HQ1 |
| CI baseline trước HQ1 | PASS | run42045054946/37a9db6 completed success; chưa coi là CI của source HQ1 mới |
| Schema/roles demo/dev/Compose hiện có | NOT APPLIED | Chỉ test DB mới; runtime override chuẩn bị nhưng chưa chạy Docker profile mới |

SQL/API mới đã kiểm thử, không đồng nghĩa nghiệm thu toàn đồ án/hardware. Không sửa migration001–003, không xóa dữ liệu nguồn, không gọi simulator là ESP32 thật.

## Cleanup repository — 2026-11-05

Chi tiết nhóm file và bằng chứng tại [báo cáo cleanup](DON_DEP_REPOSITORY.md). Không xóa tracked source/test/migration/tài liệu/env/dữ liệu; chỉ cache/bundle tái tạo được,3 script local one-off và dependency Cupertino không dùng.

| Lệnh / kiểm tra | Kết quả thực chạy | Log local |
|---|---|---|
| scripts/test.ps1 | PASS38/38 HTTP/PostgreSQL | cleanup-backend.log |
| npm.cmd run build:web | PASS | cleanup-web-build.log |
| npm.cmd run test:web | PASS2 client tests +11 nhóm Chrome E2E | cleanup-web-tests.log |
| flutter analyze / flutter test | PASS không issue /12 tests | cleanup-flutter-analyze.log, cleanup-flutter-test.log |
| flutter build apk --debug --no-pub | PASS native exit0, app-debug.apk tồn tại | cleanup-android-native.log |
| scripts/compile-iot.ps1 | PASS3 profiles (simulation/locked sensing/gated GPIO), không upload | cleanup-iot-compile.log |
| docker compose config --quiet / build | PASS native exit0 cả2 | cleanup-compose-native.log, cleanup-docker-native.log |
| Relative imports/URLs / ignore / user change | PASS117 refs,14 ignore cases, package.json user hash giữ nguyên | cleanup-check-paths.cjs; build/web là output có prerequisite đã ghi rõ |
| Secret/history trước commit | Không phát hiện theo rule đã chạy,151tracked +22commits/300text blobs | cleanup-audit.json; không in credential |
| Demo DB sau cleanup | PASS đọc3users/0rentals, không seed/xóa | node scripts/demo.mjs status |

Lỗi wrapper đã sửa: pub remove redirection sai path trước khi chạy; guard PNG chặn trước khi đối chiếu hash; lỗi thống kê hashtable sau xóa; PowerShell Stop coi stderr Java warning/Docker progress là lỗi. Đã kiểm tra native exit0 trước ghi PASS. Test đã dựng lại cache rồi cache được dọn lại, giữ APK/firmware/log/screenshot. Không chạy lại emulator/phone/IoT vật lý/camera/production trong phạm vi cleanup này. Các giới hạn chức năng trước cleanup giữ nguyên.

## Master2 — source IoT có khóa, 2026-11-05

Master3 sau đó: `scripts/test.ps1` **38/38 PASS** (`.local/master-history-backend.log`); React build PASS +2 tests/11 nhóm Chrome E2E PASS (`.local/master-history-build.log`, `master-history-web.log`). Kiểm tra mới: Web history đúng device, pending→ACK/result qua HTTP fixture, đổi thiết bị không giữ kết quả trước; API tính expired khi device offline, giữ ACK cuối và chặn Customer. Không sensor/relay thật. Source `web/src/CommandHistory.jsx`, App/e2e, iot.js/hardware.test.js.

Git master3 `7e13b68` push/main +remote equality PASS. CI master2 `8431262`/run42039533054 success3jobs (api-web/deployment/android-build), xác minh sau commit master3. Run42041036151 cho7e13b68 còn đang chạy lúc ghi nhận. Teardown test Compose/emulator riêng PASS, giữ DB/volume và AVD user; `demo.mjs status` SQL3users/0rentals PASS. Không chạy lại app test chỉ vì cập nhật tài liệu.

| Phạm vi | Kết quả thực tế | Bằng chứng / giới hạn |
|---|---|---|
| Backend allowlist/freshness/duration/TTL/ACK/rotate/automation/interlock | PASS38/38 cuối cùng | `powershell -NoProfile -File scripts/test.ps1`, `.local/master-hardware-ttl-after.log`; PostgreSQL/HTTP thật, device HTTP fixture, không board vật lý |
| TTL sau khi chờ database lock | FAIL → ĐÃ SỬA, PASS hồi quy | `.local/master-hardware-ttl-before.log`: poll trả1 thay vì0; now() cố định đầu transaction. Đổi sang clock_timestamp(), poll và ACK sau room-lock/expiry PASS trong full38tests |
| React production build | PASS | `npm.cmd run build:web`, `.local/master-hardware-web-build.log` |
| React client/Chrome E2E | PASS2 tests +10 nhóm | `npm.cmd run test:web`, `.local/master-hardware-web3.log`; mặc định dry-run/khóa GPIO, test allowlist fixture gửi pending bounded, không điều khiển thiết bị |
| E2E harness thử lần đầu | FAIL → ĐÃ SỬA | Chưa chọn actuator required; sau đó locator850 trùng do2 mẫu test. Chọn field và xác định cell đầu; chạy lại đủ suite PASS, không bỏ assertion |
| Flutter live Dart API | PASS1/1 | `node scripts/test-mobile-api.mjs`, `.local/master-hardware-dart.log`; client→HTTP→PostgreSQL, không sensor thật |
| ESP32 compile | PASS3/3 profiles | `scripts/compile-iot.ps1`, `.local/master-hardware-compile-final.log`; sim/locked sensing/gated outputs, URL +pulse constexpr assertions. Flash1014319/1039867/1040747B; RAM45476/46876/46924B. Không upload, không đo GPIO/relay |
| Docker Windows rebuild/up/smoke | PASS | Compose project riêng smverify20261105200125, config/build/up +`node scripts/test-deployment.mjs`; DB/migration/Nginx/assets/CSP/login/read/logout. Volume giữ nguyên, allowlist trống |
| CI master1 | PASS3jobs | be531fa/run42035426091: api-web/deployment/android-build success; không dùng làm kết quả CI của commit tiếp theo |
| Hardware/camera | BLOCKED | Chưa có xác nhận BOM/nguồn/đấu dây/giới hạn và thiết bị; xem PHUONG_AN_PHAN_CUNG_IOT.md. Compile/API fixture không thay kiểm thử vật lý |


## Mẫu bản ghi

| Thời điểm | Module / chức năng | Lệnh test | Kết quả | Bằng chứng / lý do không chạy |
|---|---|---|---|---|
| Chưa bắt đầu | Chưa có | — | CHƯA CHẠY | Repo mới, chưa có ứng dụng |
| 2026-11-05 | P0a — repo/môi trường | `git status --short`, liệt kê file, kiểm tra runtime | PASS khảo sát | Git sạch; chưa có app; công cụ ở `.sm-tools`, chưa ở PATH |
| 2026-11-05 | P0a — SRS/ERD/UML/ADR | Đối chiếu A01–A10/O01–O10/C01–C12 | Rà soát tài liệu | Có tiêu chí từng nhóm, chưa phải test phần mềm; PlantUML chưa render |
| 2026-11-05 | Toolchain | `npm install` | PASS | 87 packages, audit 0 vulnerabilities |
| 2026-11-05 | Script PostgreSQL lần đầu | `scripts/local-postgres.ps1` | FAIL → ĐÃ SỬA | Policy tiến trình và xử lý kết quả rỗng; không thay policy máy |
| 2026-11-05 | Migration dev | `npm run db:migrate` (2 lần sau sửa script) | PASS | PostgreSQL 17.11 mới, 1 migration verified ở cả hai lần |
| 2026-11-05 | Foundation | `npm test` với TEST_DATABASE_URL riêng | PASS 4/4 | `server/test/foundation.test.js`; PostgreSQL thật, HTTP thật trên cổng ngẫu nhiên, không mock |
| 2026-11-05 | P1b lần đầu | `scripts/test.ps1` | FAIL 3/9 → ĐÃ SỬA | SQLSTATE 42P08 tại duration/interval, đã cast tham số integer |
| 2026-11-05 | P1b + regression | `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test.ps1` | PASS 9/9 | Race 201/409, rollback nhiều khay, ownership, unique, FK, snapshot giá, RBAC, session revoke; `server/test/rentals.test.js` |
| 2026-11-05 | P1c + regression | `scripts/test.ps1` | PASS 13/13 | `operations.test.js`: lifecycle, notification ownership, delivery/address/transitions, ledger, close/re-rent isolation, DB dashboard/CSV injection |
| 2026-11-05 | P1d/P4a + regression | `scripts/test.ps1` | PASS 17/17 | `iot.test.js`: identity/provenance, validation, tenant/time scope, alert dedup, thresholds, automation dry-run, ack/TTL/replay, camera contract, token rotation |
| 2026-11-05 | Migration 002 dev | `npm run db:migrate` | PASS | 2 migrations verified trên cluster mới |
| 2026-11-05 | Hardware/live camera | Chưa có thiết bị được xác nhận | CHƯA CHẠY | HTTP tests là telemetry mô phỏng, tuyệt đối không tương đương ESP32 thật |
| 2026-11-05 | P2 Web | `npm run build:web` | PASS | Vite 7.3.7, React 19, bundle build thành công |
| 2026-11-05 | P2 Chrome E2E lần đầu | `npm run test:web` | FAIL → ĐÃ SỬA | Label select chưa xác định rõ; bổ sung aria-label |
| 2026-11-05 | P2 Chrome E2E sau sửa | `npm run test:web` với TEST_DATABASE_URL mới | PASS 5 nhóm | Chrome installed, HTTP/PostgreSQL thật: staff login/Customer denied, CRUD, rental→harvest→delivery, telemetry/CSV/responsive390, Operator menu; không pageerror |
| 2026-11-05 | Regression sau P2 | `scripts/test.ps1`, `git diff --check` | PASS 17/17 và diff sạch whitespace | Screenshot local được xem trực tiếp; không dùng ảnh giả làm bằng chứng dữ liệu |
| 2026-11-05 | P3 analyze ban đầu | `flutter analyze` | FAIL → ĐÃ SỬA | Test counter template MyApp và curly braces; thay test Customer/sửa lint |
| 2026-11-05 | P3 static/unit/widget | `flutter analyze`, `flutter test` | PASS, 5/5 | Không issue; MockClient cho client/widget, không gọi là integration thật |
| 2026-11-05 | P3 build | `flutter build web --no-wasm-dry-run` | PASS | Flutter 3.47.9/Dart 3.13.7, output mobile/build/web |
| 2026-11-05 | P3 live client | `npm run test:mobile:api` | PASS 1/1 | Client Dart → Express → PostgreSQL mới, thuê/liên kết/env/profile/notifications/logout |
| 2026-11-05 | P3 Android | `flutter doctor -v` | CHƯA CHẠY build APK | Thiếu Android SDK, chưa có emulator/thiết bị được xác nhận |
| 2026-11-05 | P4 simulator executable + backend | `scripts/test.ps1` | PASS 18/18 | Simulator riêng gửi 2 mẫu/ack dry-run vào DB; từ chối token hardware; `/iot/me` test |
| 2026-11-05 | P4 firmware | `scripts/compile-iot.ps1` | PASS compile 2/2 | ESP32 core 3.3.3; mô phỏng flash77%/RAM13%, SCD4x flash79%/RAM14%; không upload |
| 2026-11-05 | P4 physical sensor/relay/camera | Không chạy | CHƯA CHẠY | Chưa xác nhận BOM/sơ đồ/giới hạn tải; firmware không có GPIO điều khiển relay |
| 2026-11-05 | P5 security + regression | `scripts/test.ps1` | PASS 21/21 | CLI bootstrap thật, user lifecycle, JSON/body bound, auth/RBAC/tenant/race/simulator; không skip |
| 2026-11-05 | P5 backup recovery | `npm run test:backup` | PASS | pg_dump custom/pg_restore vào DB test MỚI; xác minh data/migrations, giữ nguồn và dump |
| 2026-11-05 | Docker / remote CI / production TLS | Chưa chạy | CHƯA CHẠY | Không có Docker, chưa push CI hay domain/certificate triển khai |
| 2026-11-05 | P6 Compose config | CLI5.7.0 `config --quiet` | PASS | Binary SHA256 khớp official release; chỉ kiểm config, không phải chạy Docker Engine |
| 2026-11-05 | P6 công cụ checksum/Java | Lần gọi đầu | FAIL → ĐÃ SỬA | Decode checksum byte[] thành UTF8; quote tham số Java -D trong PowerShell; chỉ execute binary sau hash PASS |
| 2026-11-05 | P6 UML | `scripts/render-uml.ps1` | PASS6/6 | PlantUML1.2026.9/JRE21.0.13/Smetana, PNG trong docs/uml/rendered; đã xem sequence |
| 2026-11-05 | Checkpoint cuối | `git diff --check`, `git check-ignore` | PASS | Không lỗi whitespace; credentials/runtime/local DB/dump bị ignore; có cảnh báo chuyển LF/CRLF cho Markdown, không phải test failure |
| 2026-11-05 | Baseline trước lưu Git theo quy tắc mới | `scripts/test.ps1`, `npm run build:web`, `npm run test:web`, Flutter analyze/test/build, `npm run test:mobile:api` | PASS | Backend21/21; Chrome5 nhóm; Flutter5/5 + live API1/1; không tuyên bố hardware/Android/container đã chạy |
| 2026-11-05 | Pagination API + regression | `scripts/test.ps1` | PASS24/24 | 207 hợp đồng, timestamp ties/microsecond, không lặp/mất; lọc đúng chủ, cursor scope/input validation; migration003 |
| 2026-11-05 | Pagination React | `npm run build:web`, `npm run test:web` | PASS6 nhóm | 122 hợp đồng, trang trước/sau, lọc reset cursor, hết trang; responsive390px và browser luồng cũ PASS |
| 2026-11-05 | Pagination Flutter lần đầu | `flutter analyze`, `flutter test` | FAIL → ĐÃ SỬA | Lint null-aware; callback setState trả Future; HTTP lỗi nhanh trước UI subscribe. Sửa screen/load/helper và thêm paging/retry/pull-refresh regression |
| 2026-11-05 | Pagination Flutter sau sửa | `flutter test`, `flutter analyze`, `flutter build web --no-wasm-dry-run` | PASS7/7 + analyze/build | Widget paging/previous/filter/retry và shared pull-refresh PASS; test không bỏ qua lỗi HTTP |
| 2026-11-05 | Pagination Dart live + migration/backup | `npm run test:mobile:api`, `npm run db:migrate`, `npm run test:backup` | PASS1/1 + migration3/restore | Client Dart gọi API/DB thật với25 rentals fixtures; cursor/filter/ownership; restore DB mới xác minh3 migrations |
| 2026-11-05 | Flutter browser harness ban đầu | `npm run test:mobile:web` | FAIL selector → ĐÃ SỬA | Flutter Semantics dùng tab/menuitem/merged accessible names khác DOM Text; sửa locator theo role/name, không bỏ assertion nghiệp vụ |
| 2026-11-05 | Flutter UI E2E | `npm run test:mobile:web` | PASS4 nhóm | Chrome thật + build Flutter Web + API/PostgreSQL mới; register/rent2/env/link/delivery/cancel-resubmit/notification read/profile/logout/staff denied; không JS/Flutter exception; simulator không phải hardware |
| 2026-11-05 | Đồng bộ GitHub sau đăng nhập | GCM list, `git fetch origin main`, `git diff --check`, `git push origin HEAD:refs/heads/main` | PASS | Push5756f5b..03cccf6, ahead4/behind0 trước push; source ứng dụng không đổi nên không chạy lại build/test; chưa xác nhận CI remote |
| 2026-11-05 | Review cuối baseline | `scripts/test.ps1`, `npm audit --json` | PASS24/24; audit0 | Chạy lại baseline thực tế, trước thêm regression; không đủ để kết luận không có bug |
| 2026-11-05 | Review regression trước sửa | `node --test server/test/review-regression.test.js` | FAIL → ĐANG SỬA | R01–R06 tái hiện. Một fixture lowercase sai validation đã sửa và chạy riêng chứng minh tray maintenance bị reset |
| 2026-11-05 | CI remote baseline | API jobs/log của run41997537676 | FAIL xác nhận | Backend/React/build/Flutter analyze/unit/live API PASS trên Linux; Flutter UI staff-denied assertion cuối bị timeout |
| 2026-11-05 | Review backend sau sửa | `scripts/test.ps1` | PASS32/32 | R01–R06 +8 regression cases đã PASS; original24 tests giữ PASS; không skip |
| 2026-11-05 | Review firmware baseline | `scripts/compile-iot.ps1` | PASS compile2/2 | Mô phỏng77%flash/13%RAM, SCD4x79%flash/14%RAM; không upload/hardware |
| 2026-11-05 | Review UI trước sửa | Flutter review_session_catalog_test, React E2E | FAIL → ĐÃ SỬA SOURCE | Flutter stale401/profile/catalog3 ca; React empty description và late401 sau đổi user tái hiện; không bỏ test |
| 2026-11-05 | Review React sau sửa | `npm run build:web`, `npm run test:web` | PASS2 client tests +7 nhóm E2E | HTML gateway/error token scope, clear description, cross-session401, các luồng cũ giữ PASS |

## Nhóm kiểm thử cần có trước khi hoàn thành

**Master batch2026-11-05:** backend32/32 PASS; React build/2 client tests/9 Chrome groups PASS; Flutter analyze sạch/12 tests PASS, APK debug PASS; Android emulator integration1/1 PASS với API/SQL thật (register/rent2/link/simulated telemetry/harvest/delivery/paid/complete/profile/logout). Docker Windows Desktop4.98/Engine29.9.2/Compose5.6.1, project smverify20261105200125 build/up/health/migrate/bootstrap/auth/CSP/assets/DB/logout PASS. WSL3.0.3/NDK28.2 compiler chạy; firmware compile2/2 PASS, không upload. Backup/restore PASS; benchmark20users/200reads0errors p95 32,42/45,14ms. Demo init lặp giữ3user/6tray/DB riêng, start/3role RBAC/Chrome login/simulator/stop/persist status PASS; guide DEMO_WINDOWS.

FAIL giữ lịch sử: Android test đầu ECONNREFUSED55439 vì portable PG chưa chạy; script PG timeout60s trong recovery95s, đã tăng180s/chờ readiness, không xóa WAL/data. Emulator user5554 offline, không kill/wipe; tạo AVD test .local/emulator5558. Harness lần đầu sai TextFormField trong dialog TextField, sửa locator rồi fullrerun PASS. Demo smoke phát hiện bug thật: Admin logout ngoài viewport1280x720, sửa sidebar overflow-y:auto; browser regression PASS. Không gọi lỗi harness/môi trường là bug chức năng; không coi simulator là sensor thật.

Kiểm đủ công cụ sau cài Android Studio2026-11-05: flutter doctor3.47.9 **Android PASS**, licenses accepted, JBR25.0.4; java/javac17.0.21/Node26/npm.cmd/Git/Arduino versions PASS. sdkmanager list_installed PASS (API36/37, Build Tools36.0.0); **NDK28.2.13676358 chưa có** so với FlutterExtension của project. AVD Medium_Phone_API_37.0 tồn tại trong emulator list, adb devices trống. WSL --version TIMEOUT12s, Docker chưa tìm thấy. Không install/download/boot AVD/build APK/test hardware; đây là kiểm kê toolchain, không phải Android E2E PASS.

Xác minh PATH Flutter2026-11-05: Machine PATH đúng .sm-tools\flutter\bin, process cũ vẫn giữ2 path sai. Nạp Machine+User PATH chỉ trong process chẩn đoán: where.exe/Get-Command đúngSDK, flutter3.47.9/dart3.13.7 **PASS/exit0**. Không ghi EnvironmentVariable hệ thống, không build/test lại ứng dụng. Cần khởi động lại ứng dụng terminal cũ.

Kiểm lại phần mềm2026-11-05: java/javac Temurin17.0.21 absolute path **PASS mới**, Machine PATH đã có nhưng process chưa nhận. node/npm.cmd/git/psql/Arduino CLI versions và pg_isready2 cổng PASS; flutter doctor chạy được nhưng Android SDK chưa tìm thấy. Hai PATH Flutter C:\flutter/C:\src\flutter không có executable. wsl --version **TIMEOUT12s**, không suy ra runtime hoạt động; Docker/Android vẫn chưa phát hiện qua các nguồn kiểm kê. Không đổi source hoặc chạy lại build/test nghiệp vụ; không cài/repair cấu hình máy.

Kiểm kê Windows2026-11-05 (không tạo DB/test fixtures): `node/npm.cmd/git --version`, `npm.cmd ls --all` PASS; pg_isready2 cổng accepting, SQL read-only55439/3 checksum migration PASS nhưng0 Admin/data; SQL5432 chưa auth. Node26 API smoke health/ready200/protected401; React build +Chrome login/Vite proxy401/no pageerror PASS; Flutter pub deps/analyze sạch, doctor xác nhận thiếu Android/PATH/JDK. CLI/core/library/board/compiler ESP32 chạy, chưa flash. `npm --version` FAIL do Restricted/npm.ps1, npm.cmd PASS; WSL CLI FAIL Class not registered/REGDB_E_CLASSNOTREG, không repair. GitHub connector xác nhận CI3f53424/run42005908332 success cả2 jobs từ lượt review trước. Chi tiết executable paths, lỗi và hướng dẫn ở KIEM_TRA_MOI_TRUONG_WINDOWS.md; không rerun bộ test nghiệp vụ/firmware hoặc gọi là sensor/camera/Android/Windows Docker PASS trong lượt này.

**Kết quả review cuối 2026-11-05:** run42005126537/3c14bc8 **PASS cả2 jobs api-web/deployment**, gồm32 backend tests, React2+8 nhóm, benchmark đọc, Flutter analyze/12 tests/build/live API/4 nhóm UI, Docker build/up/smoke. R07 đã xử lý focus/editor, không skip assertions. Thử Chrome CPU6x bổ sung ban đầu FAIL Back tooltip/route; sửa locator/chờ heading/di chuyển pointer, rerun4 nhóm PASS. Không thay source app để né test. Bản chốt docs/harness cần được lưu/push và xem CI tương ứng; không tuyên bố Android/hardware/TLS đã đạt.

CI42004176690/bcc138a: mọi bước trước Flutter UI và deployment PASS; Flutter UI staff login không gửi request, artifact Email rỗng. Sửa helper focus theo đúng label +đợi frame +assert sau blur; local4 nhóm PASS. Tiếp tục CI Linux, không sửa app/skip kiểm tra để che lỗi harness.

CI42003530326/a34bd38: deployment PASS; Web FAIL pagination assertion dòng140 (nhãn trang mới xuất hiện trước table data). Sửa useData scope theo dependencies ngay trong render; local React build/2 client tests/8 E2E PASS. Không skip assertion, bổ sung artifact Web layout nếu lỗi. CI tổng vẫn chưa PASS ở checkpoint này.

CI42003072419/740ea61: deployment Docker **PASS**, API-Web FAIL responsive pager390px; thêm flex-wrap, React build +2 client tests +8 E2E local PASS lại. Chưa gọi tổng workflow PASS, Flutter Linux native-editor fix chưa tới bước chạy.

Review batch cuối 2026-11-05: firmware sửa allowlist HTTP dev,2 mode compile PASS với17 static assertions; Compose config PASS; UML render6/6 PASS. `test:load`200 request/20 users/0 lỗi, p95 rentals33,42ms/environment42,07ms trên loopback. CI85fb2b2 **FAIL** ở staff login Flutter UI; diagnostics xác nhận401, helper đã đổi nhập native editor, local4 nhóm PASS lại; đang chờ CI. CI Compose smoke mới **CHƯA CHẠY**. Chi tiết/giới hạn tại REVIEW_CUOI.

Review UI bổ sung 2026-11-05: Flutter HTML401 và logout race **FAIL trước sửa → PASS sau sửa**; `flutter analyze` sạch, `flutter test` **12/12 PASS**, Flutter Web build PASS; `test:mobile:api`1/1 và `test:mobile:web`4 nhóm PASS trên Chrome/PostgreSQL thật. React build +2 API client tests +8 nhóm E2E PASS, gồm logout race. `test:backup` PASS, migration CLI chạy2 lần đều verified3. Chưa coi local PASS là CI Linux PASS.

- Migration/DB integrity: unique tray code; không gán trùng khay; transaction thuê nhất quán.
- Auth/RBAC: Admin/Operator/Customer không truy cập trái quyền; Customer không xem khay người khác.
- API validation và handling: dữ liệu sai, thiếu, truy cập bị từ chối.
- Web React: build, route, form, biểu đồ thật, cập nhật phản hồi API.
- Flutter: `flutter analyze`, widget/test khi phù hợp, luồng Customer.
- IoT: dữ liệu cảm biến, ngưỡng cảnh báo, điều khiển và trạng thái thiết bị; tách mô phỏng và phần cứng thật.
- Tích hợp end-to-end, kiểm tra hướng dẫn cài đặt, sao lưu/cấu hình bảo mật.

## Quy ước

- `PASS`: đã chạy, có kết quả tốt.
- `FAIL`: đã chạy, lỗi còn tồn tại; dẫn đến task sửa lỗi.
- `CHƯA CHẠY`: thiếu môi trường, thiếu thiết bị, hoặc chưa tới giai đoạn; ghi rõ lý do.
- `MOCK/PASS`: chỉ phần mô phỏng PASS, không tương đương kiểm thử phần cứng.
