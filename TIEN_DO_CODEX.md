# TIẾN ĐỘ CODEX — SMART MUSHROOM (DỰ ÁN MỚI)

> **Lịch sử khởi tạo:** ban đầu chỉ có tài liệu. Hiện đã có source ứng dụng mới và bằng chứng dưới đây; không nhập code/data/tiến độ từ dự án cũ.
>
> **Quy tắc:** Codex phải cập nhật sau mỗi batch code/test. Nếu bị ngắt, phải đối chiếu Git diff và code thực tế khi tiếp tục. Không được tự ghi PASS khi chưa chạy.

## 1. Trạng thái nhanh

- **Mốc hiện tại:** P5/P6 — bản phần mềm local và bộ tài liệu ban đầu đã kiểm chứng; còn nghiệm thu môi trường đích.
- **Mốc hiện tại HQTCSDL:** HQ1/HQ2 đã commit/push, CI tương ứng đều PASS3jobs; HQ3 catalog API→Flutter paging/search đã kiểm thử, đang lưu checkpoint. CI mới chỉ được xác nhận theo đúng commit, không suy ra từ CI cũ.
- **Đã kiểm chứng:** Express/PostgreSQL48tests, React build/2tests/11Chrome groups; Flutter analyze sạch/15tests/live Dart API1/1/Chrome5groups và APK+Android UI→API→SQL PASS. Firmware3profiles compile ở checkpoint trước, firmware không đổi. Backup/restore17table counts/graph/routines/roles,9demo SQL HQTCSDL, least-privilege Docker runtime, nâng cấp demo3→4 với backup/rehearsal đều PASS. SQL/API có views/function/procedure/5triggers; tài liệu3NF/data dictionary/EXPLAIN/câu hỏi bảo vệ đã bổ sung.
- **Chưa nghiệm thu:** Paging/search các danh sách staff ngoài rentals; TLS production/phone/signing/sensor/relay/camera thật. Retention/soak là RECOMMENDED, module cycle không thuê OPTIONAL theo PHAM_VI_HQTCSDL, không tự xem là blocker bắt buộc. Không tuyên bố hoàn thành100%.
- **Blocker hiện tại:** Chưa xác nhận BOM/đấu dây/giới hạn/camera và chưa có thiết bị kiểm thử. Android SDK/NDK28.2, Docker Engine, WSL đã chạy, không cần cài lại. GitHub main push được. AVD người dùng5554 có lúc offline; E2E dùng AVD riêng5558 trong .local, không wipe AVD người dùng.
- **NEXT_TASK:** Chốt commit/push HQ3 và kiểm tra CI đúng HEAD; tiếp theo staff lists/search/paging theo SUPPORTING, rồi đối chiếu nghiệm thu/tài liệu demo theo Master HQTCSDL. Không làm lại HQ1/HQ2/cleanup. BOM/flash/cấp tải vẫn cần xác nhận; không chặn phần mềm/SQL.
- **Lệnh tiếp tục:** `Tiếp tục đồ án.`
- **Kiểm kê Windows mới nhất:** Node26.13/npm.cmd11.20/Git2.56/PostgreSQL17.11/Flutter3.47.9/Dart3.13.7/JDK17/Studio JBR25/Android SDK+NDK28.2/Docker Desktop4.98/Engine29.9.2/Compose5.6.1/WSL3.0.3/Arduino CLI1.5.1 đã chạy. CLI cần nhận PATH Machine+User mới; `npm.cmd` tránh npm.ps1 bị Restricted. Không cài/chỉnh phần mềm hệ thống trong master review. Native5432 chưa xác thực SQL; dùng portable55439 và DB demo/test mới. Các bản kiểm kê cũ bên dưới được giữ làm lịch sử.

## 2. Trạng thái các giai đoạn

| Mốc | Nội dung | Tình trạng | Bằng chứng |
|---|---|---|---|
| P0 | Kiến trúc, repo, skeleton, .env.example, tài liệu chạy | Đã kiểm thử | SRS/ADR/ERD + health/readiness PASS |
| P1 | PostgreSQL, Express API, auth/RBAC, quản lý nền tảng | Đã kiểm thử và review regression |48/48 integration tests PASS, SQL integrity/roles/routines, catalog/rental cursor/filter; các staff list khác chưa phân trang |
| P2 | React Web: Administrator và Farm Operator | Đã kiểm thử bản đầu | Vite build PASS; Chrome E2E luồng chính PASS |
| P3 | Flutter App: Customer | Đã kiểm thử Web/VM/Android emulator |Analyze sạch,15 tests +live API/Chrome5groups; APK debug/Android UI+SQL PASS; phone/signing chưa test |
| P4 | ESP32 + cảm biến/điều khiển + camera theo phạm vi khả thi | Đã compile/mô phỏng; chưa nghiệm thu hardware | Simulator HTTP PASS; firmware3 profile/pulse assertions PASS; GPIO source gated, chưa upload/relay/live camera |
| P5 | Tích hợp, bảo mật, kiểm thử, triển khai |Local +CI Linux đầy đủ/Docker smoke đã kiểm thử; chưa nghiệm thu production |32 backend tests, Web/Flutter E2E, backup/restore, benchmark đọc PASS; CI42005126537 PASS; còn TLS/Android/hardware |
| P6 | UML 2.0, SRS, thiết kế, test plan, cài đặt, hướng dẫn | Hoàn thành tài liệu bản đầu | UR/SRS/ADR/ERD/detail/API/test/install/user guide; 6 PlantUML render PASS; cần review học thuật/nghiệm thu đích |

**Trạng thái được dùng:** `Chưa bắt đầu` / `Đang làm` / `Bị chặn` / `Đã kiểm thử` / `Hoàn thành (chưa kiểm thử)`.

## 3. Nhật ký thực hiện (Codex nối thêm sau MỖI batch)

### 2026-11-05 — HQ3 ĐÃ KIỂM THỬ: catalog Customer không bị cắt ở100mục

- HQ2 commit/push `228dc682d3d996a760aa4701453b03d9a15289d4` main/remote trùng hash; GitHub run42056855706 completed success khi kiểm tra (cần xem jobs chi tiết trước chốt). package.json user giữ nguyên.
- Căn cứ: GET/catalog chỉ trả cap100 mặc định, Flutter không có cách duyệt phần còn lại hoặc tìm khay. Scope: keyset paging độc lập plans/trays, query theo mã/tên/phòng; thêm metadata giữ JSON arrays tương thích, Flutter load-more giữ chọn nhiều khay qua trang, search/refresh xử lý cursor/stale response an toàn. Không đổi giá/ownership/booking transaction và không thêm index chưa đo.
- Tiêu chí: fixture>200plans/trays duyệt hết không lặp/lọt, filters/context/cursor validation và isolation; Flutter widget/network/race tests, live API/browser hoặc Android khi cần; regression +checkpoint/Git. NEXT_TASK API tests trước sửa→modulecatalogpagination→Flutter→verify/CI.
- Đã tái hiện baseline FAIL vì catalog không có next-page metadata (`hq3-catalog-before.log`). Sau module catalog-pagination/query hỗ trợ2cursor+literalsearch, full backend **48/48 PASS** (`hq3-backend.log`), fixture205plans/230available trays, không lặp/lọt ở dataset ổn định, validatecursorviewer/kind/filter/limit và availability. Không thêm/sửa schema/index.
- Flutter thêm load-more20rows/plan+tray độc lập, gộp uniqueID/giữ chọn khay, tìm mã/tên/phòng, search/refresh hủy lựa chọn có nhắc, generation chốnglate-response.3widgetregressions (merge/networkfailure/searchrace) +baseline **15/15 PASS** (`hq3-flutter-final.log`). Analyze lần đầu có3lint thiếu braces, đang sửa/chạy lại; chưa ghi analyze sạch. Tiếp theo liveDart/browser/buildAndroid và checkpointCI.
- Analyze sau braces source/test **PASS sạch**, liveDart API1/1 và FlutterWeb UI4nhóm quaChrome/realDB **PASS** (`hq3-analyze-final2.log`,`hq3-dart-live.log`,`hq3-mobile-browser.log`). Web build PASS nhưng báo Expected CupertinoIcons font missing sau cleanup cũ; rà framework Material imports Cupertino và tài liệu Flutter font yêu cầuasset package choCupertinoIcons. Tiêu chí “không direct import” khi cleanup chưa đủ, đang khôi phục đúngcupertino_icons1.0.9 (bản trướccleanup), không upgrade framework hoặc package khác; giữ lịch sử lỗi và xác minhbuild hết cảnh báo, không coi đây là đã test glyph vật lý.
- Sau khôi phục1.0.9: Web build **PASS không còn cảnh báo missingfont**, CupertinoIcons.ttf thực sự được tree-shake còn1472B (`hq3-web-font-fix.log`), lock chỉ thêm lại package đó. Flutter UI E2E mở rộng **5nhóm PASS** (`hq3-paging-e2e.log`): real21stock/22plans, tray001trang1+021trang2 được thuê cùng hợp đồng và SQLxác nhận đúng2codes; plan_cursor trảtrang2, searchtray020 còn1checkbox. Deadline scroll dùngframe/10s choCI, không giảclientdata.
- Theo lệnh tiếp tục mới đã đọc lạiAGENTS/PROMPT/TIEN_DO vàGit: chính xác51tracked paths thay đổi kể từ37a9db6 gồm2batch đãcommit; workingtree tại kiểm tra có10paths chưacommit (kể3file mới), package.json user giữ nguyên/khôngstage. Chưa commitHQ3; đang kiểmAndroid và cập nhậtdocs/stageddiffsecrets trước checkpoint.
- APK build/install +Android UI1/1 và SQLcompleted/2items/linked/paid/delivered **PASS** (`hq3-android-ui.log`), hostGPU1536MB/own5558. Font đã xác minh buildWeb khôngwarning, actualCupertino asset1472B; đính chính DON_DEP và AGENTS để không gỡ lại vì thiếu directimport. Không thay framework/dependency khác.
- Đang chốtHQ3 docs/API/FlutterGuide/checklist/testlog/README, stageddiff/secret scan/commit/push; CI HQ2 `228dc68`/run42056855706 confirmed3jobs success bằngconnector. NEXT_TASK staff lists/search/paging theo phạm vi và acceptance tổng, không làm lạiHQ1/HQ2/cleanup.
- Regression cuối sau khôi phục font: Flutter analyze sạch/15tests PASS (`hq3-analyze-package-final.log`,`hq3-tests-package-final.log`); React2tests/11nhóm realChrome PASS (`hq3-react-regression.log`). Đã dừng đúng AVD test5558 sau kiểm tra tên, giữ userdata/DB/logs. Không còn lỗi đã phát hiện trong phạm vi HQ3; chưa xem CI HQ3 hoặc thiết bị IoT là PASS trước khi có bằng chứng.

### 2026-11-05 — HQ2 ĐÃ KIỂM THỬ:9demo PostgreSQL, runtime deployment và bảo vệ

- HQ1 đã commit/push `8139aae29fe9cd35a5e2cdc350cf6d7b11735ea0` trên main, ls-remote trùng hash. Giữ package.json user. Không sửa tiếp migration004 đã lưu; các bổ sung sau là demo/tests/deployment/docs hoặc migration mới nếu cần.
- Chuẩn bị docs/demo-hqtcsdl với SQL có thể chạy riêng, runner tạo DB sm_test_* mới và không drop/reset, kết quả thực EXPLAIN/COMMIT/ROLLBACK/concurrency/roles/backup/API/simulator. Không coi REST test là React/Android UI test. Thêm data dictionary/3NF/câu hỏi bảo vệ và hướng dẫn least-privilege Docker/demo upgrade có backup; kiểm tra CI commit HQ1.
- NEXT_TASK: chạy9demo và sửa lỗi phát hiện; lưu bằng chứng/số liệu thật; sau đó runtime Docker profile và tích hợp Android khi môi trường hỗ trợ. Không thêm cycle không thuê/retention ngoài phạm vi đã phân loại.
- HQ2 mid-checkpoint:9/9 demo **PASS** (`hq2-demo-run.log`, sau refactor/prepare/shared tools `hq2-demo-shared-tools.log`);50.000mẫu forcedSeq43.777ms/index0.031ms run đầu,108.019/0.058ms run sau, explain.json thật. Không dùng làm SLA. --prepare PASS nhưng không ghi PASS9demos; psql guard/vars/02SQL preparedlab exit0, NOTICE23514 expected.
- Runtime Docker **PASS** project smhq1793891444822: real sm_runtime current_user, rolsuper=false/schemaCREATE=false/schema_migrationsSELECT=false, bootstrap/login/Nginx/assets/DB/logout PASS; stack riêng stop, giữ volume. Thêm CI deployment step chạy profile sau dừng smoke stack dev; chưa xác nhận CI batch mới.
- Shared pg_dump/restore helper scripts/postgres-tools.mjs dùng trong verify-backup và demo upgrade. `demo.mjs upgrade` đã dump riêng→restore NEW sm_test_demo_upgrade→migrate rehearsal/counts→migrate demo3→4; giữ3users/0rentals và credentials/config. Lặp verify4 PASS. Native5432/DBdev/credentials/phần cứng không đổi. Start chặn schema cũ, tránh API healthy nhưng thiếu routine.
- Docs mới THIET_KE_CSDL_HQTCSDL/9demo SQL/README/BAO_VE, cập nhật SRS/UR/DEMO_WINDOWS/database guide. CI HQ1 `8139aae`/run42049829318 confirmed3jobs success. Đang chạy Android UI regression trên AVD riêng5558, không đụng AVD user/thiết bị thật; tiếp theo Git checkpoint và CI mới.
- Android diagnostic lần đầu **BLOCKED/timeout**35s boot: Windows còn503532KiB free, own qemu17172 gần5GiB dù guest2048MB/Swiftshader, chưa chạy test app. Đã kiểm tra launcher/parent/executable path trong SDK rồi chỉ dừng own AVD; retry hostGPU/1536MB, không wipe/sửa AVD/WSL/Docker hay tắt process user. Chưa ghi AndroidHQ2PASS.
- Android retry **PASS**: hostGPU/1536MB boot_completed1, APK build/install +Customer UI→API→PostgreSQL1/1 test PASS, SQL completed rental/2items/linked/paid/delivered (`hq2-android-ui-retry.log`). Test AVD đã emu kill sau xác minh tênSmartMushroom_Test; giữ userdata, không đụng AVD user. Không phần cứng IoT thật.
- Bổ sung React báo cáo nguồn mẫu: hiển thị simulated/hardware counts từ view và nhắc chưa nghiệm thu sensor; Chrome regression đọc2mẫu/1sim/1hardware fixture **PASS**, build+2tests/11groups PASS (`hq2-report-{build,e2e}.log`). ERD bổ sung các FK creator/optional notification và bảng schema_migrations, domain UML cardinality đã khớp từ trước, không render lại ảnh không đổi.
- Native demo upgraded schema4 start→realChrome/3roles/RBAC/APIready/logout→stop/status **PASS** (`hq2-native-smoke.log`); giữ3users/0rentals, simulator thêm mẫu có nhãn. Toàn bộ wrapper/demo test chạy thật, không có hardware flash/relay/camera. Chuẩn bị staged scan/commit/push và theo dõi CI mới; NEXT_TASK danh sách catalog/trays pagination/search theo SUPPORTING, không làm optionalcycle/retention trước.

### 2026-11-05 — HQ1 ĐÃ KIỂM THỬ: toàn vẹn PostgreSQL và SQL nâng cao thực dụng

- Bắt đầu HEAD37a9db6/main, fetch origin/main PASS ahead0/behind0; package.json user giữ nguyên. CI run42045054946/HEAD37a9db6 completed success đã truy vấn GitHub, không sửa lỗi CI lịch sử.
- Đọc master HQTCSDL đính kèm, schema3 migrations, source thuê/thu hoạch/giao nhận/báo cáo/payment và test hiện có. Không dựng lại, không dọn lại cache hoặc mặc định retention/cycle không thuê là bắt buộc. Phân loại phạm vi sẽ ghi trong docs.
- Tiêu chí HQ1: tái hiện SQL trực tiếp nhận-giao sai customer, thêm migration mới bảo vệ ownership/identity và SQL view/function/procedure có dùng trong API, DB role hạn quyền có test thực tế, kiểm tra rollback/concurrency/migration/backup. Mọi schema/test chỉ áp dụng DB sm_test_* mới; chưa migrate database demo/dev của user, chưa đổi credentials/quyền đang dùng. Không sửa001–003.
- NEXT_TASK: chạy regression SQL ownership trước sửa; hoàn thiện migration004 +API sử dụng routines/views; test direct SQL và regression; checkpoint/Git; tiếp theo bộ9 demo HQTCSDL/ERD-3NF/data dictionary/EXPLAIN/least privilege deployment và acceptance.
- P0 SQL mismatch đã tái hiện FAIL trước sửa (`.local/hq1-ownership-before.log`), migration004 additive thêm preflight/ownership/history triggers; API thuê dùng fn_rental_total_vnd, thu tiền CALL sp_confirm_rental_payment, reports đọc2views có provenance counts. Full45/45 tests PASS (`hq1-database-full.log`), gồm7 DB cases: constraints, SQL mismatch, snapshot, procedure rollback/race, thật sự đăng nhập bằng2 role hạn quyền và API, nâng cấp3→4 giữ dữ liệu/preflight rollback/idempotent.
- `deploy/database/grants.sql` chỉ cho DBA với2 role mới không superuser/owner; test tạo login sm_test_* riêng và thu hồi/xóa đúng role fixture sau kiểm tra, giữ DB/data. Không áp dụng role/credential vào DB demo/dev hiện có hoặc Compose user. Đã phát hiện restore --no-privileges làm mất ACL routines; grants script reapplies REVOKE PUBLIC trước GRANT, backup verification mở rộng thành graph thuê/thu hoạch +row counts +objects +role test. Đang kiểm tra backup/client trước checkpoint; chưa kết luận cả giai đoạn nghiệm thu xong.
- Chốt HQ1: backup/restore thực **PASS17table row counts +graph thuê/harvest/view/function/procedure/trigger/ACL** (`hq1-backup-final.log`); role tests7/7 PASS sau giới hạn UPDATE(status,completed_at) ở rentals, không sửa snapshot bằng runtime (`hq1-roles-final.log`). React build+2tests/11Chrome groups PASS, Dart live1/1 PASS. Các file khác: AGENTS/PROMPT_TIEP_TUC, PHAM_VI_HQTCSDL/ADR016/ERD cardinality correction, deploy/database grants/README/runtime override/.env.example, README/checklist/KIEM_THU. Không đổi001–003; không migrate DB user hiện có; chưa chạy override Docker, chưa chạy lại Android UI ở HQ1.
- Đang staged scan/diff/commit/push; NEXT_TASK HQ2 như trạng thái nhanh. CI baseline37a9db6 confirmed3jobs success qua connector; job FAIL của commit cũ không còn tác động HEAD nên không sửa lại. package.json user không stage/không đổi.

### 2026-11-05 — HOÀN THÀNH cleanup đã kiểm thử và push

- Bắt đầu HEADfe5dbaf/main, remote đã fetch: ahead0/behind0. package.json user có format/allowScripts từ trước, giữ nguyên và không stage. Kiểm kê151 tracked files: không có build/cache/artifact nhầm lên Git, không có file trùng SHA256. Không cần git rm --cached hoặc xóa tracked file chỉ để có thay đổi.
- Đã lập bảng dọn trước khi xóa: cache Vite/Android/Flutter +object cache Arduino5builds, bundle mobile/build/web và3 script one-off .local đã dùng. Giữ APK/firmware đầu ra, mọi log/screenshot/CI artifacts/UML render, database/backup/env/demo profile/tools/AVD; không xóa vùng dữ liệu4.1GiB AVD hoặc1.6GiB PostgreSQL. Thư mục node_modules đang dùng được giữ để không tải lại vô ích.
- Cấu hình: thêm quy tắc cleanup dài hạn vào AGENTS và ignore Node/Vite/Flutter/Gradle/ESP32/editor. Cupertino_icons chưa có tham chiếu trong source/test: sẽ bỏ dependency thừa và cập nhật pubspec.lock bằng Flutter, không xóa lockfile. Chưa ghi test PASS; tiêu chí backend/React/Flutter/APK/3firmwareprofiles/Compose config +links/secret/Git đều xác minh.
- Đã xóa28 target cache/file cho phép,1691 files/980956146B (~935.51MiB) trước rebuild; manifest từng path/count/bytes tại .local/cleanup-deleted.json, không xóa tracked file. Guard chặn PNG ở intermediates trước khi xóa; sau đối chiếu SHA256 tất cả là bản sao icon source thì cho dọn. Script local gặp lỗi thống kê hashtable sau xóa, đã sửa và đối chiếu manifest bằng Node; không coi exit lỗi thống kê là test ứng dụng FAIL. Lần pub remove đầu bị sai đường dẫn log trước khi lệnh chạy, gọi lại đúng ../.local PASS. Dependency duy nhất bỏ là cupertino_icons; lockfile chỉ thay mục này, không nâng cấp package khác.
- Backend38/38, React build +2tests/11 nhóm Chrome E2E, Flutter analyze sạch +12 tests **PASS** sau cleanup. Đang build APK và compile3 firmware profiles; cache có thể được tái tạo bởi kiểm thử, không nhầm tổng bytes đã xóa với dung lượng ròng cuối cùng. Quét working tree151tracked files +22commits/300text blobs reachable không phát hiện mẫu credential/provider/privatekey hoặc giá trị credential local đã biết; không chứng nhận phát hiện mọi loại secret. Không viết lại lịch sử.
- APK debug **PASS native exit0** (`cleanup-android-native.log`), firmware3/3 compile **PASS**, Docker images build **PASS native exit0** với ignore mới. APK/Docker wrapper đầu dùng PowerShell Stop bị stderr warning/progress làm dừng; đã đổi cách gọi native, không sửa app/Java để né cảnh báo. Giữ log lỗi, không coi là PASS trước khi native trả0.
- Build/test tái tạo cache lớn; đã dọn lại đúng nhóm đã kiểm chứng tái tạo được sau test, giữ APK/firmware output/log/bằng chứng. Lượt2:18targets/1199files/~1717.04MiB cache, không cộng với lượt đầu. Đo cuối: workspace giảm ròng886384214B (~845.32MiB), riêng web/mobile/IoT-build giảm978316455B; test DB mới tăng91841278B và vẫn giữ. Snapshot local cleanup-{before,final}-inventory.json/cleanup-size-summary.json; manifest đầu cleanup-deleted-initial.json, cuối cleanup-deleted.json.
- Imports/URLs117 +ignore14cases +package.json user SHA256 **PASS**; mobile/build/web là output cần build trước test-mobile-web theo CI, không phải source mất. Không tracked file nào bị xóa/bỏ theo dõi. Đã tạo docs/DON_DEP_REPOSITORY.md, cập nhật README/AGENTS/.gitignore/.dockerignore/pubspec+lock; docs test/checklist và staged scan đang hoàn tất trước commit/push main. Sau cleanup quay lại backlog catalog/list pagination/search, cycle không thuê/retention; không coi cleanup là hoàn thành đồ án.
- Kiểm tra cuối trước commit: Compose config native exit0; demo status SQL3users/0rentals PASS; staged10files secret scan +whitespace PASS, docs27/36relative links không thiếu,117imports/14ignore cases không lỗi, package.json user không đổi. Build outputs còn lại được giữ; không có thao tác git rm --cached hoặc deleted tracked files. Commit/push đang thực hiện, chỉ xác nhận đồng bộ sau kiểm tra remote.
- Git kết quả: **PASS** commit `c63efbf6d2dc1862a2b394e62e6f642de5513c93`, nhánh main, push origin HEAD:refs/heads/main thành công; ls-remote trả đúng hash local. Working tree chỉ còn package.json user từ trước. Không force/reset/history rewrite, không có lỗi commit/push. Checkpoint tài liệu sau đây chỉ ghi kết quả Git, không thay source/dependency đã test; CI của commit mới chưa được xác minh hoàn tất.
- Cleanup kết thúc trong phạm vi yêu cầu: giữ toàn bộ151 tracked files ban đầu và thêm báo cáo, không xóa/bỏ theo dõi file Git; `.local` chỉ dọn các path cache/one-off đã liệt kê. Không dọn dữ liệu PostgreSQL/AVD/backup/env/log/screenshots vì cần giữ trạng thái/bằng chứng. Khi “Tiếp tục đồ án”, đọc checkpoint/Git rồi quay lại backlog chức năng, không dọn lại hoặc dựng lại source đã PASS.

### 2026-11-05 — HOÀN THÀNH master3 software: lịch sử và kết quả lệnh IoT trên Web

- Master2 commit `8431262d6697ea4c9be0a749f7e2d77cbc78099f`, push main PASS, ls-remote trùng hash. CI run42039533054 đang chạy tại lúc bắt đầu batch3. package.json user giữ nguyên, không stage.
- API có lịch sử lệnh nhưng Web chưa hiển thị ACK/expired/result nên vận hành chưa biết kết quả gửi. Bổ sung lịch sử chọn đúng device, tự refresh khi trang hiện, trạng thái TTL theo server và chú thích không có feedback tải. Tiêu chí: Chrome gửi pending→fixture ACK→Web hiển thị, scope đúng device; API expired khi device offline; build/test/checkpoint/Git. Đây là software fixture, không điều khiển vật lý.
- Đã thêm web/src/CommandHistory.jsx và nút lịch sử trong Monitoring; 100 lệnh gần nhất/auto refresh5s/manual refresh, mode/source/duration/status/expiry/result; API GET history trả effective expired bằng clock_timestamp kể cả khi device offline, giữ trạng thái cuối ACK/failed. Không dùng ACK làm xác nhận relay/tải điện.
- `scripts/test.ps1` **38/38 PASS**; `npm.cmd run build:web` PASS; `npm.cmd run test:web` **2 client tests +11 nhóm Chrome E2E PASS**, gồm pending→HTTP fixture ACK→Web/result, đổi device không lộ kết quả cũ; Customer403 và expired offline API. Logs `.local/master-history-{backend,build,web}.log`. Files sửa: component mới, App.jsx/e2e, iot.js/hardware.test.js, TIEN_DO và docs liên quan. Tiếp theo: Git checkpoint, kiểm tra CI; phần mềm lớn hơn còn catalog/list paging/search, cycle không thuê/retention. Hardware chưa xác nhận, không flash/cấp tải.
- Git **PASS**: `7e13b68b6a5b4818c70c25be0b09e8b07cab207f` commit/push main, ls-remote trùng hash; trước đó `8431262` và `be531fa` cũng đồng bộ. Staged scan10files +relative links26docs/32links +diff check PASS; giữ package.json user chưa stage. Không force push, không chứa env thật/credentials/artifacts.
- CI `8431262`/run42039533054 **PASS3/3 jobs** đã xác minh qua GitHub: API/Web/Flutter, Docker deployment và Android APK build. CI `7e13b68`/run42041036151 còn in_progress khi kiểm tra, chưa ghi PASS. Checkpoint tài liệu tiếp theo chỉ ghi nhận kết quả này, không đổi source đã test.
- Teardown **PASS**: chỉ `docker compose -p smverify20261105200125 stop` (giữ volume) và `adb -s emulator-5558 emu kill` sau khi xác minh tên SmartMushroom_Test. Không đụng AVD5554 của user, không drop DB. Demo đã dừng; `node scripts/demo.mjs status` đọc DB thật thành công,3 users/0rentals, dữ liệu giữ nguyên. Portable PostgreSQL55439 vẫn sẵn để chạy demo.
- Bước tiếp theo cụ thể cho phiên sau: kiểm tra Git/source và CI run42041036151; làm batch catalog/tray pagination/search xuyên API→Flutter/React vì danh sách còn bounded; sau đó cycle không thuê/retention/soak. Không tự cài tool đã chạy tốt. Phần cứng chờ xác nhận BOM/model/nguồn/tải/giới hạn tại PHUONG_AN_PHAN_CUNG_IOT; source software không bị chặn bởi việc chờ này.

### 2026-11-05 — HOÀN THÀNH batch software master2; hardware chưa nghiệm thu

- Master1 commit/push `be531fa` PASS, remote trùng hash; tiếp tục không dừng ở báo cáo. Người dùng yêu cầu tự nghiên cứu/chọn BOM nhưng phải trình cấu hình/điện áp/sơ đồ/giới hạn để xác nhận trước lắp/flash/bật tải; chưa có xác nhận phần cứng.
- Đề xuất ESP32-DevKitC V4 +SCD41 (true CO₂/temp/RH) +4 relay Adafruit STEMMA4409 (3.3V HIGH), chỉ tải DC12V nhỏ cho prototype. Đang đối chiếu datasheet/manufacturer; không mặc định người dùng đã mua. Tiêu chí software: backend allowlist trống mặc định, firmware GPIO compile gate OFF mặc định, xung giới hạn/TTL/fresh sensor/network/watchdog/interlock/replay; test source/API/compile, không gọi hardware PASS. Chưa thay env thật hoặc phát lệnh tới thiết bị.
- Source đã có: server/src/hardware-policy.js +iot/config/app, hardware.test.js +helper config; firmware pulse_policy.h/task GPIO/timer/interlock/cache; React capability +dry-run mặc định; Compose/env example rỗng; scripts/compile-iot.ps1 compile3 profile. Phương án BOM/sơ đồ/nguồn/chân/giới hạn và quy trình xác nhận đã viết trong docs/PHUONG_AN_PHAN_CUNG_IOT.md, nguồn nhà sản xuất.
- Backend37/37 PASS (`scripts/test.ps1`, `.local/master-hardware-tests2.log`), React build PASS +2 client tests/10 nhóm Chrome E2E PASS (`.local/master-hardware-web3.log`). Hai lần E2E harness FAIL: chưa chọn actuator bắt buộc, rồi locator850 không duy nhất khi thêm fixture hardware; sửa fixture/locator, không bỏ qua assertion. Fixture HTTP mode hardware chỉ là test software, không phải sensor thật.
- CI be531fa/run42035426091 success3jobs đã xác nhận; không suy ra CI mới từ kết quả commit cũ. Compile cuối3/3 PASS sau assertions freshness/I²C pin conflict: sim1014319B, sensing1039867B, outputs1040747B flash, RAM45476/46876/46924B. Dart live API1/1 PASS. Docker rebuild/up/migrate/Nginx/auth/DB/logout PASS trên Windows với project riêng, không xóa volume. Logs .local/master-hardware-{compile-final,dart,docker}.log. Chưa flash/allowlist env thật/cấp điện. Bước kế: rà secret/diff, commit/push; hardware BLOCKED chờ xác nhận/thiết bị.
- Rà soát cuối tái hiện TTL race mới: poll chờ room lock nhận lệnh đã hết hạn vì now() cố định ở đầu transaction (`master-hardware-ttl-before.log`, FAIL1). Đổi poll/ack/freshness sang clock_timestamp(), thêm regression thật với PostgreSQL lock. Full38/38 PASS (`master-hardware-ttl-after.log`), không skip. Bản cuối cần Git/check CI; không suy ra hardware PASS từ test này.

### 2026-11-05 — HOÀN THÀNH batch master1: Android/Docker thật và demo Windows cách ly

- Môi trường mới thực chạy: WSL3.0.3/kernel6.18.54, Desktop4.98/Engine29.9.2/Compose5.6.1, NDK28.2 compiler, Studio JBR25. Flutter APK debug PASS; thêm SDK integration_test +customer_android_test.dart +scripts/test-mobile-android.mjs. Android emulator5558 riêng trong .local: UI register/rent2/link/telemetry SIMULATOR/delivery/profile/logout PASS; SQL xác nhận completed/2items/linked/paid/delivered. Không coi là hardware/phone thật.
- Baseline FAIL môi trường/harness: PG chưa chạy; recovery95s vượt script timeout60s; tăng-t180 và chờ pg_isready, không reset dữ liệu. AVD user5554 offline, giữ nguyên; AVD test mới .local không ghi userdata user. Test lần đầu chọn TextFormField ở dialog TextField, sửa locator rồi PASS1/1. DEBUG environment làm Gradle echo args fixture, runner đã xóa DEBUG chỉ trong child để không log thông tin test; không đổi env hệ thống.
- Docker project smverify20261105200125 volume riêng: build/up/migrate/bootstrap/health/Nginx/assets/CSP/auth/DB/logout PASS trên Windows, không dùng project/volume của user. Demo mới scripts/demo.mjs init/start/stop/status: DB sm_demo_* mới,3 roles/password random trong .local/demo/private.json,6trays/1plan/simulator. Init2 lần giữ dữ liệu; Chrome/admin/3role RBAC/API/sim/stop/persist status PASS. Credentials không log/commit. Không sửa server/.env placeholder; demo dùng profile riêng.
- Bug thật mới: Admin logout bị ngoài viewport1280x720; thêm sidebar overflow-y:auto +Chrome regression. React build+2tests+9 nhóm PASS; backend32/32, Flutter analyze+12tests, backup/restore,20users200reads0errors/p95 32,42/45,14ms, firmware2mode compile PASS. Đã cập nhật AGENTS/PROMPT_BAT_DAU/PROMPT_TIEP_TUC để lệnh tiếp tục không dựng lại và thống nhất quyền push. Thêm CI Android build (chưa có kết quả remote tại checkpoint này).
- Files: mobile pubspec/lock/integration_test; scripts/demo.mjs,test-mobile-android.mjs,local-postgres.ps1; web style/E2E; workflow; AGENTS/2prompts; README/mobile guide/DEMO_WINDOWS/DOI_CHIEU_YEU_CAU/BANG_KIEM/KIEM_THU/TIEN_DO. Không stage package.json user. Cần staged scan/commit/push batch, kiểm tra CI. Tiếp theo: hỗ trợ IoT hardware an toàn bằng source/đề xuất BOM chưa flash, xử lý phần mềm còn thiếu; user yêu cầu tự đề xuất phần cứng theo tài liệu, chưa xác nhận đã mua/đấu.

### 2026-11-05 — ĐANG LÀM: master review và hoàn thiện demo Windows/Android

- Bắt đầu HEADaf2a5db; giữ nguyên thay đổi package.json từ người dùng (format/allowScripts), không stage ngoài phạm vi. Đọc tài liệu/source hiện tại, không dựng lại ứng dụng đã PASS. Tiêu chí batch1: AGENTS/PROMPT_TIEP_TUC thống nhất lệnh tiếp tục và quyền Git, Android APK build thật, kế hoạch test emulator và demo cách ly dữ liệu.
- Môi trường đã thay đổi: Docker Desktop4.98/Engine29.9.2/Compose5.6.1 và WSL3.0.3/kernel6.18.54 chạy được; NDK28.2.13676358 compiler chạy; emulator-5554 đang online. Flutter doctor Android PASS. Đã bắt đầu flutter build apk --debug --no-pub; chưa kết luận APK PASS trước khi có kết quả.
- Chỉ dùng DB demo/test mới cho dữ liệu thử; giữ cluster/dữ liệu hiện có. Không cài phần mềm hệ thống, không bật tải vật lý, không reset/unregister hoặc xóa volume. Tiếp tục batch kế tiếp sau kiểm thử/checkpoint; cập nhật checklist truy vết file/test/việc thiếu và hướng dẫn demo thực tế.

### 2026-11-05 — HOÀN THÀNH: kiểm đủ công cụ sau khi người dùng cài Android Studio

- Chỉ kiểm kê, không cài package hoặc đổi cấu hình persistent, không mở emulator/build APK vì có thể tự download SDK/NDK. Giữ package.json thay đổi từ trước. Cập nhật báo cáo Windows, TIEN_DO, BANG_KIEM và KIEM_THU.
- Studio2026.2.2.8 có registry/product-info, JBR25.0.4 chạy; doctor Flutter3.47.9/Android SDK36.0.0 **PASS**, licenses accepted. Sau nạp saved PATH chỉ trong process, node26.13/npm.cmd11.20/git2.56/java+javac17.0.21/flutter đều chạy. Flutter tự chọn JBR Studio, không thiếu JDK/SDK cơ bản nữa.
- sdkmanager list_installed PASS: API36/37.0, Build Tools36.0.0, Platform Tools37.0.1, Command-line23.0.0, emulator37.2.13 và system image37.0. **Thiếu NDK28.2.13676358** dự án chỉ định qua FlutterExtension. CLI có cảnh báo deprecated nhưng không thất bại. Không gọi doctor xanh là APK build PASS.
- AVD Medium_Phone_API_37.0 đã có; adb devices trống, chưa Android chạy. PostgreSQL5432 accepting/Arduino CLI1.5.1 version PASS. Docker Desktop/CLI/Engine chưa tìm thấy qua các nguồn kiểm kê; WSL --version TIMEOUT12s, chỉ dừng process kiểm tra vừa tạo, không repair. Docker là tùy chọn cho native demo.
- Bước tiếp theo: SDK Manager bổ sung đúng NDK, mở AVD/phone và chạy build/test Android; xử lý WSL/Docker riêng nếu cần Compose. Không cần cài lại Node/PostgreSQL/Git/Flutter/JDK/Studio/SDK hiện có. Commit/push riêng4 file tài liệu sau scan; không stage thay đổi package.json của người dùng.

### 2026-11-05 — HOÀN THÀNH: xác minh PATH Flutter sau khi người dùng sửa

- Machine PATH đã đúng `C:\Users\mired\.sm-tools\flutter\bin`, có flutter.bat/dart.bat; process cũ vẫn giữ2 đường dẫn không tồn tại nên where ban đầu FAIL. Chỉ nạp PATH đã lưu Machine+User vào process chẩn đoán, không sửa cấu hình Windows.
- Sau nạp: where.exe flutter/dart và Get-Command đều về SDK .sm-tools; `flutter --version`3.47.9, `dart --version`3.13.7 PASS/exit0. Cần thoát/mở lại VS Code/terminal để nhận environment mới, không cần cài lại hoặc thêm lại PATH.
- Cập nhật báo cáo Windows/TIEN_DO/checklist/nhật ký kiểm thử; không đổi source, không rerun build/test nghiệp vụ, không kết luận Android/WSL/Docker đã đạt từ kiểm tra PATH. package.json local giữ nguyên; commit/push riêng tài liệu theo AGENTS.

### 2026-11-05 — HOÀN THÀNH: kiểm lại phần mềm sau khi người dùng cài thêm

- Nhóm việc: chỉ xác minh executable/PATH/registry/doctor để phân biệt thiếu cài đặt với cấu hình phiên cũ; không cài phần mềm hoặc đổi cấu hình máy. Giữ thay đổi package.json có từ trước.
- Kết quả mới: Temurin JDK17.0.21.9 có registry và java/javac17.0.21 chạy PASS. Machine PATH có JDK bin, process PATH chưa nhận, JAVA_HOME vẫn chưa đặt; cần khởi động lại ứng dụng terminal/VS Code và cấu hình khi cần, không cài lại JDK.
- Node26.13.0/npm.cmd11.20.0/Git2.56.0.windows.4/psql17.11/Arduino CLI1.5.1 version PASS; PostgreSQL5432/55439 accepting. Flutter doctor chạy bằng SDK .sm-tools3.47.9/Dart3.13.7, vẫn báo thiếu Android SDK và PATH; chỉ có Windows/Chrome/Edge. Machine PATH Flutter2 vị trí C:\flutter\bin/C:\src\flutter\bin không chứa flutter.bat; cần trỏ SDK thực tế .sm-tools\flutter\bin.
- Android Studio/SDK/adb và Docker Desktop/CLI/Engine chưa tìm thấy qua PATH/registry/Start Apps/vị trí chuẩn/service. WSL --version TIMEOUT12s, chỉ dừng process chẩn đoán do lượt này tạo; không khẳng định runtime đã sửa và không chạy installer/repair.
- File cập nhật: docs/KIEM_TRA_MOI_TRUONG_WINDOWS.md, TIEN_DO_CODEX.md, docs/BANG_KIEM_CHUC_NANG.md, docs/KIEM_THU.md. Không chạy lại build/test ứng dụng vì không đổi source; chỉ các lệnh kiểm kê nêu trên. Bước tiếp theo: cài Android SDK/Studio, sửa Flutter PATH và mở lại VS Code để nhận JDK; sửa WSL/cài Docker nếu dùng Compose. Commit/push riêng tài liệu sau scan, không stage package.json của người dùng.

### 2026-11-05 — ĐANG LÀM: kiểm kê môi trường Windows và điều kiện trình diễn end-to-end

- Theo yêu cầu chỉ kiểm tra/báo cáo: không cài phần mềm hệ thống, không đổi PATH/registry/firewall, không migration/bootstrap hay ghi dữ liệu DB, không flash/điều khiển thiết bị. Kiểm tra bằng executable, kết nối và source thực tế; không suy ra hoạt động từ thư mục.
- HEAD3f53424 trùng origin/main; GCM có tài khoản mired273mh. Có thay đổi `package.json` từ trước lượt này (format +allowScripts esbuild); giữ nguyên, không tự stage/commit thay đổi của người dùng.
- Phạm vi: phiên bản/PATH/dependencies; PostgreSQL portable55439 và service5432; cấu hình Backend/React/Flutter/ESP32; Android/JDK/Docker/WSL/USB/camera; hướng dẫn bước thủ công +link chính thức. Tiêu chí: báo cáo bảng trạng thái có bằng chứng, phân biệt dữ liệu thật/simulator/chưa test; chỉ sửa tài liệu kiểm kê/tiến độ liên quan.

### 2026-11-05 (ICT) — HOÀN THÀNH: kiểm kê và hướng dẫn phần còn thiếu (không phải hoàn thành triển khai)

- Thêm `docs/KIEM_TRA_MOI_TRUONG_WINDOWS.md`: bảng công cụ/version/PATH/bắt buộc/link chính thức/hướng dẫn; profile DB, trình tự chạy Backend/React/Flutter/ESP32/Docker, phần thủ công, lỗi và phân loại bằng chứng. Cập nhật TIEN_DO, BANG_KIEM_CHUC_NANG, KIEM_THU và link README. Không sửa chức năng ứng dụng hoặc thay đổi package.json của người dùng.
- Thực chạy: Node26.13.0/npm.cmd11.20.0/Git2.56.0.windows.4; portable Node22.23.4; PostgreSQL binaries17.11, pg_isready5432 và55439 PASS. SQL xác thực read-only trên55439 PASS,3 checksum migration khớp, toàn bộ bảng nghiệp vụ kiểm tra trống/0 Admin/0 thiết bị/camera. SQL auth5432 CHƯA TEST vì không có credentials dùng được; không dùng credentials portable cho cluster khác.
- `server/.env` có file nhưng DATABASE_URL/ADMIN_* còn placeholder; đã kiểm tra giá trị dạng boolean/redacted, không in password/token. API smoke với profile portable đúng:200 health/200 ready/401 protected. `npm.cmd ls --all` exit0, React build PASS, Vite+Chrome login/proxy401/no pageerror PASS trên Node26. Các tiến trình smoke tạm đã dừng, DB hiện có giữ nguyên.
- Flutter3.47.9/Dart3.13.7 executable PASS, pub deps PASS, analyze sạch; doctor báo thiếu PATH/Android SDK và Visual Studio target desktop. Devices chỉ Windows/Chrome/Edge; chưa Android. JRE21.0.13 chạy java, không có javac/JDK dùng được. Arduino CLI1.5.1/core3.3.3/lib list/board details/compiler14.2 PASS; USB COM3/4 là Bluetooth, chưa nhận diện board ESP32; chưa config.local.h/camera/sensor thật.
- Lỗi thực tế: `npm` bị Restricted chặn npm.ps1, `npm.cmd` hoạt động (không đổi policy). WSL Appx2.6.2 hiện diện nhưng CLI báo `Wsl/CallMsi/Install/REGDB_E_CLASSNOTREG`; lệnh list bị kẹt, đã chỉ dừng PID chẩn đoán do lượt này tạo. Docker executable/Desktop/Engine chưa thấy qua PATH/registry/service/pipe; Compose standalone5.7.0 không thay Engine. Chưa tự repair/cài đặt WSL/Docker/JDK/SDK.
- Git: đầu lượt HEAD3f53424 trùng remote/main; GCM user mired273mh, không cần login lại hiện tại. GitHub connector xác nhận run42005908332 cả2 jobs success; không chạy lại32 tests/12 widget/ESP32 compile trong lượt chỉ kiểm kê này và không coi CI Linux là Windows Docker/Android/hardware PASS. package.json còn thay đổi local chưa commit từ trước, không tự stage. Commit/push riêng tài liệu kiểm kê sau staged scan; kết quả/hash báo cuối phiên để tránh vòng lặp commit ghi chính nó.
- Bước tiếp theo thủ công: dùng DB55439 hiện có hoặc chủ động cấu hình DB5432, thay ADMIN_* mẫu/bootstrap/tạo dữ liệu demo; dùng npm.cmd. Thêm User PATH nếu muốn; cài SDK/JDK/phone hoặc emulator; sửa WSL/cài Docker chỉ nếu demo Compose. Cắm board/chốt BOM/cấu hình token/camera; driver GPIO/fail-safe vẫn cần phát triển và nghiệm thu an toàn. Không coi việc cài tool là hoàn thành đồ án vật lý.

### 2026-11-05 — P0a: HOÀN THÀNH phân tích thiết kế ban đầu

- Đọc AGENTS, hai prompt, README, tiến độ và toàn bộ 6 tài liệu docs ban đầu. `git status --short` sạch, repo chỉ có tài liệu; không nhập source/dữ liệu/history từ dự án khác.
- Tạo `docs/SRS.md`, `docs/KIEN_TRUC.md`, `docs/uml/use-cases.puml`, `docs/uml/rental-sequence.puml`, `.gitignore`; bổ sung ADR và backlog.
- Đã phân tích đủ 3 vai trò, mapping A/O/C, ràng buộc chống thuê trùng, snapshot giá, liên kết cần ownership, dữ liệu cảm biến theo phòng, camera tùy phần cứng, điều khiển dry-run.
- Kiểm tra môi trường: Node/npm/psql/docker/flutter không ở PATH. Tìm thấy binary Node, PostgreSQL, Flutter, Arduino trong `C:/Users/mired/.sm-tools`; chỉ sử dụng compiler/runtime, không dùng dữ liệu hoặc code có sẵn ngoài repo.
- Kiểm thử ứng dụng: CHƯA CHẠY (chưa có source ở batch này). UML là source PlantUML, chưa render.
- Bước tiếp theo ĐANG LÀM: P0b/P1a tạo backend, migration nền tảng, auth/RBAC. Tiêu chí: migration trên DB mới + health/auth/ownership tests thực tế PASS. Không dùng DB cũ; dữ liệu test sinh mới trong repo `.local/` bị gitignore.

### Mẫu bản ghi

- **Thời điểm:** [nếu xác định được]
- **Mốc / hạng mục:** [P0/P1/...]
- **Việc đã làm thực tế:** ...
- **File mới / sửa:** ...
- **Lệnh đã chạy + kết quả:** `...` → PASS/FAIL/CHƯA CHẠY, lý do
- **Lỗi còn tồn tại / blocker:** ...
- **Công việc tiếp theo nhỏ nhất có thể làm:** ...
- **Git:** các file chưa commit, thay đổi cần review

### 2026-11-05 — P0b/P1a: HOÀN THÀNH skeleton/migration/auth

- Tạo npm workspace, `server/package.json`, lockfile, `.env.example`; `server/src/{app,index,config,db,migrate,cli,auth,security,errors,validation}.js`; migration `001_foundation.sql` gồm các bảng theo ERD; `server/test/{helpers,foundation.test}.js`; `scripts/{local-postgres,test}.ps1`; cập nhật README.
- Node 22.23.4, PostgreSQL 17.11 và Flutter 3.47.9 có sẵn; npm install PASS, audit 0 lỗ hổng tại thời điểm cài.
- Tạo cluster/database hoàn toàn mới ở `.local/postgres`, port 55439, auth SCRAM và mật khẩu ngẫu nhiên. Không dùng code/data cũ.
- Lỗi đã sửa: PowerShell policy chặn script → chạy bypass theo tiến trình; kết quả psql rỗng gây lỗi `.Trim()` → so sánh collection. Lần đầu migration dev FAIL do database chưa tạo; sau sửa script, chạy migration dev 2 lần PASS.
- `npm test` với TEST_DATABASE_URL mới: **4/4 PASS**, không skip; migration idempotent, config validation, đăng ký chỉ Customer, login/logout/profile, hash token, user khóa và phiên hết hạn.
- CLI bootstrap chưa smoke test trực tiếp; password hash đã dùng trong test tạo user. Các vai trò staff/admin sẽ có test trên route nghiệp vụ batch sau.
- ĐANG LÀM P1b: CRUD room/tray/plan + thuê/gán nhiều khay, liên kết ownership, đóng hợp đồng. Tiêu chí: RBAC + tranh chấp thuê + rollback + không lộ tenant PASS trên PostgreSQL thật.

### 2026-11-05 — P1b: HOÀN THÀNH API nền tảng và thuê khay

- Tạo `server/src/{catalog,users,rentals}.js`, `server/test/rentals.test.js`; nối routes trong app. CRUD room/tray/plan, quản lý user (soft delete, reset password thu hồi session, bảo vệ admin cuối), catalog, thuê/gán nhiều khay, giá snapshot, liên kết đúng chủ, lịch sử và chi tiết item.
- Khay đang thuê không được đổi phòng/trạng thái phục vụ; phòng đang có thuê không được vô hiệu hóa. Đóng hợp đồng có kiểm tra công nợ và yêu cầu nhận/giao; sẽ kiểm thử luồng đóng ở P1c.
- Lần đầu tests FAIL 3/9 do PostgreSQL suy luận tham số duration vừa integer vừa interval; đã thêm cast `::integer`, chạy lại **9/9 PASS** bằng `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test.ps1`.
- Bằng chứng: HTTP thật + PostgreSQL 17.11; race cho một khay trả 201/409, transaction nhiều khay rollback, khách khác nhận 404, mã khay không cho chiếm quyền, giá giữ nguyên sau thay đổi gói, staff/admin RBAC.
- Git: source/tài liệu mới chưa commit; không push, không xóa DB.
- ĐANG LÀM P1c: growth/harvest/fulfillment/notifications/ledger/report. Tiêu chí: luồng từ thuê đến hoàn tất, không vượt quyền/nhảy trạng thái, CSV an toàn PASS.

### 2026-11-05 — P1c: HOÀN THÀNH API vận hành và báo cáo ban đầu

- Thêm `server/src/operations.js`, `server/test/operations.test.js`; sửa `rentals.js` khóa hợp đồng trước item, ngăn đóng khi thu hoạch chưa bàn giao; `helpers.js` tạo DB riêng mỗi file test.
- Tiến trình tuần tự, ngày thu hoạch dự kiến, cân nặng thu hoạch, nhận/giao theo chủ thuê, địa chỉ giao bắt buộc, trạng thái yêu cầu, thông báo/đã đọc, xác nhận tiền thủ công, dashboard/report/CSV có chống công thức.
- `scripts/test.ps1`: **13/13 PASS**, không skip. Có luồng thuê → fruiting → ready → harvest → delivery → xác nhận tiền → hoàn tất → thuê lại; dữ liệu khách trước không xuất hiện ở item mới.
- Chưa phải nghiệm thu UI hoặc tải/hiệu năng; báo cáo đang tổng hợp cơ bản, CSV giới hạn 10.000 dòng/lần.
- ĐANG LÀM P1d/P4a: device provisioning + HTTP ingest + environment ownership + thresholds + dry-run commands + simulator; tiêu chí test bearer device khác session user, telemetry thật trên DB, cảnh báo và không phát lệnh hardware.

### 2026-11-05 — P1d/P4a: HOÀN THÀNH API IoT mức dry-run

- Thêm `server/src/iot.js`, migration `002_iot_automation.sql`, `server/test/iot.test.js`, `iot/simulator.mjs`, `docs/API.md`; cập nhật app/foundation test.
- Cấp/đổi token device; ingest/validate/provenance theo mode; last seen; Customer đọc theo phòng và thời gian thuê; thresholds, cảnh báo in-app chống spam 5 phút; automation và manual commands chỉ dry-run có TTL/ack chống replay; camera HTTPS contract và ownership.
- `scripts/test.ps1`: **17/17 PASS**; migration dev chạy PASS (2 migrations). Tests dùng HTTP/DB thật, không dùng ESP32/cảm biến/camera thật. Không gọi là hardware PASS.
- Simulator CLI đã viết, chưa chạy riêng như một tiến trình; contract của simulator được test trực tiếp bằng HTTP.
- Hạn chế rõ: chưa phân trang đầy đủ; chưa tải/hiệu năng; camera gateway thực tế chưa có; điều khiển thật bị chặn, chưa có phần cứng an toàn được xác nhận. API contract đã ghi rõ.
- ĐANG LÀM P2: React local trong repo theo công nghệ đề tài; không đăng ký/publish/push dịch vụ ngoài. Tiêu chí: build PASS, trình duyệt thực thi login/staff/CRUD/thuê/giám sát và lỗi quyền khi môi trường cho phép.

### 2026-11-05 — P2: HOÀN THÀNH React Web bản đầu

- Tạo `web/package.json`, Vite config/index, `web/src/{main,App,components}.jsx`, `api.js`, `style.css`, `web/test/e2e.mjs`; npm workspace/root scripts/lockfile. Backend thêm `/customers` chỉ staff xem id/tên/email phục vụ gán thuê.
- UI có login staff, dashboard từ DB, CRUD phòng/khay/gói, gán thuê/chi tiết/progress/harvest/ledger/complete, giao nhận, thiết bị/token/automation dry-run, ngưỡng, cảm biến/biểu đồ/lịch sử theo phòng, camera contract, user management, in-app notifications, reports/CSV.
- `npm run build:web`: PASS. `npm run test:web` với Chrome thật headless và DB mới: PASS 5 nhóm luồng, không pageerror. Ảnh đã kiểm tra ở `.local/web-overview.png`, `.local/web-mobile.png` (không commit dữ liệu test).
- Lần E2E đầu FAIL do accessible label của select chứa text options; đã bổ sung aria-label rõ nghĩa và chạy lại PASS. Không bỏ qua test lỗi.
- Kiểm tra responsive 390px: không tràn ngang; test Customer bị chặn ở Web và thu hồi phiên Web, Operator không có menu admin. Build lại và backend regression **17/17 PASS** sau sửa.
- Chưa kiểm thử browser mọi nhánh user edit/camera thật hoặc tải lớn; giữ giới hạn danh sách ở API doc.
- ĐANG LÀM P3: tạo Flutter từ SDK (không dùng app cũ), Customer register/login/profile/catalog/rent/link/item/environment/camera/notifications/history/fulfillment. Tiêu chí analyze/test/build Web cho Dart; Android build nếu có toolchain.

## 4. Nhật ký quyết định, vấn đề cần người dùng xác nhận

- Chưa có.

### 2026-11-05 — P3 ĐANG LÀM (checkpoint giữa batch)

- Flutter SDK 3.47.9 tạo mới `mobile/` với Android/Web, org vn.edu.smartmushroom. Thêm http và url_launcher; `lib/api.dart`, `widgets.dart`, `screens.dart`, thay template main bằng app Customer; tests client/widget mới.
- Đã viết login/register/role guard, danh sách hợp đồng/lịch sử/giao dịch, catalog/chọn nhiều khay, liên kết, item/env/history/camera contract, harvest/nhận-giao, notifications và profile. Chưa kết luận hoàn thành trước analyze/test/build.
- `flutter doctor -v`: Chrome/Flutter có; **thiếu Android SDK**, nên APK/emulator CHƯA CHẠY; Visual Studio cũng thiếu nhưng Windows desktop không phải target đồ án.
- Analyze đầu tiên FAIL vì test counter của template còn tham chiếu MyApp và lint curly braces. Đã thay test template bằng tests Customer và đang sửa lint, chạy lại analyze/test/build. Một lần ghi test sai thư mục `mobile/mobile/...` thất bại, đã sửa đường dẫn, không ảnh hưởng dữ liệu.
- Nếu phiên ngắt: kiểm tra `mobile/lib`, `mobile/test`, chạy `flutter analyze`, `flutter test`, `flutter build web --no-wasm-dry-run`; chưa đánh dấu P3 PASS.

### 2026-11-05 — P3: HOÀN THÀNH Flutter Customer bản đầu (giới hạn Android)

- Tạo source Flutter hoàn toàn mới bằng SDK; UI và API client ở `mobile/lib/`, unit/widget tests `mobile/test/`, live contract `mobile/integration/api_live_test.dart`; Node runner `scripts/test-mobile-api.mjs` và script root `test:mobile:api`.
- `flutter analyze`: PASS, không issue sau sửa test template/lint. `flutter test`: **5/5 PASS**, client/widget dùng MockClient, ghi đúng là mock. `flutter build web --no-wasm-dry-run`: PASS.
- `npm run test:mobile:api`: **1/1 PASS** — chính MushroomApi/Dart gọi Express/PostgreSQL thật trong DB test mới; login → catalog → rent → link → sensor simulator → environment → profile → notifications → logout. Không giả backend trong bài test này.
- Android INTERNET permission ở main, cleartext HTTP chỉ cho debug; release cần HTTPS. Session giữ RAM, khi mất phiên đổi root navigator để không để màn chi tiết của user cũ trên stack.
- Chưa có Android SDK nên APK/emulator/điện thoại thật CHƯA CHẠY. Flutter Web build chưa browser E2E riêng; widget tests không thay thế nghiệm thu trên điện thoại.
- ĐANG LÀM P4: firmware ESP32 Arduino với SCD4x (nhiệt/ẩm/CO₂), TLS CA, retry có giới hạn, chế độ mô phỏng, không bật relay thật; compile hai nhánh, hướng dẫn wiring/dry-run. Chưa có xác nhận hardware nên không upload/chạy thiết bị.

### 2026-11-05 14:48 (Asia/Saigon) — P4: HOÀN THÀNH compile/mô phỏng, phần cứng chưa nghiệm thu

- Tạo firmware `iot/esp32/SmartMushroom/{SmartMushroom.ino,config.example.h}`, `iot/README.md`, `scripts/compile-iot.ps1`; ADR-012, API `/iot/me`, simulator kiểm tra mode; thêm `server/test/simulator.test.js`.
- `scripts/compile-iot.ps1`: **PASS 2/2** với ESP32 core 3.3.3, ArduinoJson/Sensirion libs. Nhánh SM_SIMULATION=1: flash 1.014.295 B (77%), RAM 45.476 B (13%); nhánh SCD4x=0: flash 1.039.835 B (79%), RAM 46.876 B (14%). Artifact `.local/iot-build-{1,0}` bị gitignore.
- Backend + executable simulator: **18/18 PASS**. Simulator gửi 2 mẫu qua HTTP, lưu DB, auto dry-run ack, từ chối token hardware. Không xem đây là cảm biến/ESP32 thật.
- Firmware hỗ trợ TLS CA/NTP, timeout/reconnect, sample validation, khớp device mode, không xếp hàng mẫu cũ, không GPIO relay. Không upload; SCD4x/BOM/chân nguồn/relay/camera chưa được người dùng xác nhận.
- `mobile/HUONG_DAN.md` đã ghi cách run/build/live test và giới hạn Android; Flutter analyze lại PASS sau thêm integration test.
- ĐANG LÀM P5/P6: Docker Compose/Nginx, CI/installation/user guide, UML class/state/deployment, rà soát auth/bootstrap/config/test và tính nhất quán checklist. Docker engine chưa có trên máy, phải ghi CHƯA CHẠY container runtime.

### 2026-11-05 — P5: HOÀN THÀNH kiểm thử local và cấu hình triển khai ban đầu

- Thêm `server/test/security.test.js`: CLI bootstrap thực, từ chối admin thứ hai/không log secret, malformed JSON/body limit, user create/role/soft-delete và staff customer projection. Tổng backend **21/21 PASS**.
- Thêm `scripts/verify-backup.mjs`, root `test:backup`: **PASS** `pg_dump -Fc` → `pg_restore` vào database **MỚI** `sm_test_restore_*`, xác minh user và migrations; không xóa/ghi đè DB nào. Dump dữ liệu test ở `.local/backups` gitignore.
- Thêm `compose.yaml`, `server/Dockerfile`, `web/Dockerfile`, `.dockerignore`, `.env.example`, `deploy/nginx.conf`, `.github/workflows/verify.yml`; cấu hình migration one-shot, readiness, API nội bộ, web bind localhost8080, reverse proxy + CSP. Proxy hops mặc định 0, Compose đặt 1 chỉ khi API sau Nginx.
- **CHƯA CHẠY Docker build/compose và GitHub Actions** vì Docker không có và chưa push. File cấu hình không phải bằng chứng deploy thành công. Chưa có domain/TLS production hay signing Android.
- Không tự push, không tạo deploy bên ngoài. Thiết kế còn giới hạn pagination/retention và chưa tải benchmark; phải nêu ở docs/final.
- ĐANG LÀM P6: hoàn thiện user requirements, thiết kế chi tiết/UML, hướng dẫn cài/triển khai/vận hành/test plan và bảng kiểm phản ánh mức thực tế; chạy xác minh cuối sau thay đổi có liên quan.

### 2026-11-05 — P6: HOÀN THÀNH bộ tài liệu bản đầu và kiểm tra cấu hình

- Thêm `docs/{USER_REQUIREMENTS,THIET_KE_CHI_TIET,CAI_DAT_TRIEN_KHAI,HUONG_DAN_SU_DUNG,TEST_PLAN}.md`; source UML class/state/activity/deployment; render đủ 6 diagram PNG ở `docs/uml/rendered/`. Viết lại README/checklist theo code thực tế, giữ tài liệu yêu cầu và nhật ký lỗi cũ.
- Thêm `.gitattributes` cố định LF cho source/migration để checksum không lệch khi checkout khác nền tảng; script `render-uml.ps1`. Không đưa binary runtime/credentials/dump vào Git.
- Tải Compose CLI5.7.0, Temurin JRE21.0.13 và PlantUML1.2026.9 từ publisher chính thức vào `.local/tools`; kiểm tra SHA256 trước thực thi. Chỉ là công cụ mới, không lấy app/code/data cũ.
- Compose `config --quiet`: **PASS**, không kết nối Engine/DB. Lần kiểm checksum đầu FAIL do PowerShell trả byte[] mà bị ép chuỗi; đã giải mã UTF8 và so khớp PASS trước khi chạy binary. **Docker build/up vẫn CHƯA CHẠY**.
- `scripts/render-uml.ps1`: **PASS 6/6**, đã xem ảnh sequence. Lần gọi Java đầu FAIL do PowerShell phân tách tham số -D; quote tham số, render lại PASS. Không coi lỗi công cụ là đã test app.
- Bộ docs phân biệt API/browser/mock/live-Dart/firmwarecompile/hardware; nêu rõ production/Android/relay/live camera chưa nghiệm thu và các giới hạn phiên bản.
- Source/tài liệu chưa commit; không push. DB dev mới còn chạy tại127.0.0.1:55439; test API/Vite/Chrome đã được teardown. Test DB/dump/artifacts chỉ ở vùng local bị ignore. Không có phần mềm cũ được phục hồi.
- Checkpoint cuối: `git diff --check` PASS; `git check-ignore` xác nhận `.local/database.env`, tool binaries và Android local.properties bị ignore. Cảnh báo Git LF/CRLF ở Markdown không phải lỗi whitespace. Không có test đang chạy cần poll tiếp.

## 5. Tiêu chí để gọi một phần là hoàn thành

### 2026-11-05 — ĐANG LÀM: review và kiểm thử cuối toàn đồ án

- Bắt đầu từ HEAD `861f597`, working tree sạch; không làm lại source hoặc nhập dữ liệu dự án khác.
- Phạm vi: đọc source và rà soát invariants DB/ownership/concurrency, auth/session, vòng đời thuê/thu hoạch/nhận-giao, UI states, firmware safety, Docker/CI và tài liệu; chạy toàn bộ bộ test/build có môi trường.
- Tiêu chí: lỗi tái hiện được phải có test regression và sửa; ghi báo cáo kết quả thực tế, giới hạn Android/Docker/hardware, commit/push an toàn. Không suy ra mọi yêu cầu đã hoàn thành chỉ vì các test hiện có PASS.
- Đã tái hiện lỗi backend R01–R06 (báo cáo `docs/REVIEW_CUOI.md`): password reset/login race, mất microsecond ở ranh giới tenant, PATCH default ghi đè, sửa label khay thuê bị chặn, xóa mềm Customer còn thuê, token device rotate/ingest race. Có8 regression cases, đã sửa source và đang xác minh full suite.
- Baseline24/24 PASS và npm audit0 vulnerabilities. CI remote861f597 thực tế FAIL ở bước Flutter UI E2E cuối (staff denied assertion), đang điều tra; không giữ nhận định CI chưa chạy như trước.
- Batch sửa backend R01–R06 **HOÀN THÀNH**, `scripts/test.ps1` **32/32 PASS**, không skip; không đổi migration đã apply. Cập nhật catalog/auth/users/iot và8 regression cases. Firmware baseline compile **2/2 PASS**. Review toàn đồ án vẫn ĐANG LÀM, tiếp theo UI/session state và CI.
- Đã commit/push backend `fd130d5` PASS. Tiếp tục tái hiện/sửa UI R08–R11: Flutter stale401/profile sau logout, selection catalog lỗi sau refresh; React xóa mô tả rỗng/stale401 làm mất phiên mới. Web build +2 client tests +7 nhóm E2E PASS; Flutter analyze sạch, đang chạy test/build và UI E2E. Chi tiết FAIL→fix ở REVIEW_CUOI, chưa đánh dấu toàn review hoàn thành.
- **HOÀN THÀNH batch UI review:** sửa thêm logout race và HTML401 (Dart2 regression mới trước sửa FAIL), scope phiên cho logout cả2 client. React build +2 tests +8 nhóm Chrome E2E PASS; Flutter analyze sạch,12/12 unit/widget, Web build, live Dart1/1 và Chrome UI4 nhóm PASS. Backup/restore vào DB mới PASS; migrate2 lần verified3. File: mobile api/screens/review tests; web App/api/components/client tests/E2E/package; mobile browser harness/CI failure artifact và3 tài liệu kiểm thử/checklist/review. Cần commit/push batch và chờ CI; tiếp tục rà cấu hình/tài liệu/hiệu năng, không đánh dấu Android/Docker/hardware đạt.
- Batch UI **commit/push85fb2b2 PASS**. **ĐANG LÀM batch cuối:** chạy đo tải đọc20 users, validate Compose/UML/tài liệu, khắc phục allowlist URL HTTP dev firmware (prefix cũ cho phép DNS giả dạng IP private). Tiêu chí: kiểm tra IPv4/port đầy đủ bằng compile-time assertions trên2 firmware, không upload/relay; cập nhật báo cáo và kiểm tra CI remote thực tế trước kết luận.
- Firmware/benchmark sub-batch đạt: thêm `url_policy.h`, đổi kiểm tra trong sketch,17 static assertions và compile2/2 PASS; `test-load.mjs`/root script PASS200 request20 users/0 lỗi/p95 33,42–42,07ms (local chỉ2 route đọc); Compose config/UML6/6 PASS. CI85fb2b2 vẫn FAIL: artifact cho thấy staff login401; sửa native editor helper +payload assertions/teardown, local Flutter UI4 nhóm PASS lại. Thêm workflow Compose job và `test-deployment.mjs`/test:deploy nhưng chưa chạy remote. Lưu WIP an toàn, chưa đánh dấu CI/review cuối hoàn thành; bước tiếp theo xem run GitHub và sửa nếu còn FAIL.
- WIP740ea61 commit/push PASS. CI42003072419: Docker deployment job **PASS thực tế** (build/up/bootstrap/HTTP assets+auth+DB/CSP); API-Web FAIL responsive pager390px dòng147 trước Flutter. R13 đang sửa flex-wrap; lần này chưa kiểm chứng native editor trên Linux vì bước Flutter bị skip. Full tracked secret scan140 files PASS;22 Markdown/20 relative links không thiếu đích.
- a34bd38 commit/push PASS; CI42003530326 deployment PASS, Web FAIL dòng140 do nhãn trang render trước table dữ liệu. Đã sửa scope state trong useData để query mới không dùng data cũ trước effect, local build/2 client tests/8 E2E PASS. Bổ sung artifact Web; đồng bộ README/TEST_PLAN/SRS/cài đặt/IoT guide với test counts, Docker thực tế và giới hạn benchmark. CI tổng vẫn đang xác minh; lỗi/font assumption giữ dấu vết trong REVIEW_CUOI.
- bcc138a commit/push PASS; CI42004176690 backend/React/load/Flutter analyze+12 tests+build/live API/deployment PASS, Flutter UI cuối FAIL: Email rỗng nên không gửi staff login. Generic input:focus có thể vẫn là editor trước; helper đã dùng đúng input theo aria-label, đợi focus/frame và assert sau blur,4 nhóm local PASS lại. Cần run Linux kế tiếp; không đánh dấu toàn review hoàn thành.
- **HOÀN THÀNH review phần mềm trong môi trường hiện có:**3c14bc8 commit/push PASS, CI run42005126537 **PASS2/2 jobs** api-web +deployment; đã xem trạng thái từng job, mọi bước test nghiệp vụ success, không skip để đạt CI. Full kết quả/14 mã review (R07 là harness), các lần FAIL và phần chưa nghiệm thu ở REVIEW_CUOI. Android APK/phone, sensor/relay/live camera, GPIO driver và production TLS vẫn chưa đạt; bounded lists/retention/chu kỳ khay không thuê còn thiếu.
- Thử thêm CPU Chrome6x: lần đầu FAIL Back thứ2/tooltip trong chuyển route; chỉnh harness chờ heading/prefix Back/di chuyển pointer,4 nhóm PASS khi rerun6x. File chốt: scripts/test-mobile-web.mjs, README,TIEN_DO và docs REVIEW_CUOI/KIEM_THU/TEST_PLAN/BANG_KIEM. Cần commit/push bản chốt sau scan diff/secret; CI đầy đủ đã chứng minh ở3c14bc8, sẽ kiểm tra run của bản chốt riêng. Không xóa lịch sử lỗi hay dữ liệu test.

### 2026-11-05 — ĐANG LÀM: quy tắc lưu Git và baseline hiện tại

- Người dùng cho phép tự commit/push lên nhánh hiện tại sau mỗi giai đoạn đã kiểm chứng; WIP được phép khi cần, không đánh dấu hoàn thành sai. Đã bổ sung mục 8 AGENTS, điều chỉnh ranh giới push cũ và README cho thống nhất.
- Khảo sát thực tế: nhánh `main`, remote `origin` là GitHub repo hiện tại; HEAD còn là commit tài liệu khởi tạo, toàn bộ source mới từ phiên trước chưa commit. Không dùng source/dữ liệu dự án khác.
- Tiêu chí batch: rà soát code/staged diff/secret, chạy lại test/build phù hợp rồi commit baseline mới và thử push thông thường. Nếu lỗi sẽ lưu nguyên nhân đã loại bỏ secret tại đây.
- Batch tiếp theo: pagination/filter lịch sử thuê, giữ ownership trên từng trang, có UI React/Flutter và test dữ liệu vượt giới hạn trang. Không làm lại source đã có.
- Đã chạy lại baseline: backend21/21 PASS, React build + Chrome E2E5 nhóm PASS, Flutter analyze/5 tests/Web build PASS và Dart live API1/1 PASS. Chưa sửa các module nghiệp vụ trong batch này.
- Preflight Git ban đầu báo `Author identity unknown`; người dùng cung cấp username `mired273mh`. Đã xác minh GitHub ID247734525, chọn địa chỉ noreply chuẩn GitHub cho tài khoản để cấu hình local (không suy đoán email cá nhân).
- Fetch cho thấy `origin/main` có commit `5756f5b` chỉ sửa tiêu đề README. Giữ tiêu đề đó trong README hiện tại; sẽ tích hợp commit remote bằng merge thông thường, không force/rebase/reset hay xóa lịch sử.
- **Commit baseline thành công:** `afc0a23` — source ứng dụng đã kiểm chứng và quy tắc Git mới; staged diff/whitespace/123 file đã kiểm tra. Scan đầu báo nhầm biến PowerShell `$pgPassword` là literal, đã rà soát đây là mật khẩu ngẫu nhiên runtime và điều chỉnh kiểm tra; không có secret thật được stage. `.env`, DB/dump/local tools giữ ngoài Git.
- **Tích hợp remote:** merge thông thường `origin/main` thành công, giữ commit tiêu đề README của người dùng; không rewrite history.
- **Push main THẤT BẠI:** `git push origin HEAD:refs/heads/main` báo `could not read Username for https://github.com: terminal prompts disabled` (chưa có credential GitHub cho Git). Không hỏi token trong chat, không force push; code đã nằm trong commit local. Đang kiểm tra credential helper có sẵn, phần pagination tiếp tục độc lập.

### 2026-11-05 — HOÀN THÀNH: phân trang/filter lịch sử thuê xuyên suốt

- Phạm vi nhỏ: GET /rentals có cursor ổn định theo starts_at/id, lọc trạng thái và customer_id cho staff; Customer vẫn chỉ thấy của mình. React/Flutter có điều hướng trang và lọc trạng thái; giữ shape `data` để không phá client cũ.
- Tiêu chí: dữ liệu >100 hợp đồng, timestamp trùng/microsecond không mất/lặp bản ghi, kiểm tra ownership/filter/cursor sai; React browser paging, Flutter widget/live API và build PASS trước commit giai đoạn.
- Đã có migration003/index, `server/src/rental-pagination.js`, route giữ ownership + metadata; fixtures lịch sử và test mới. Backend **24/24 PASS**, React build + Chrome E2E **6 nhóm PASS** (122 hợp đồng, pager390px).
- Flutter test đầu phát hiện callback setState trả về Future trong load và helper refresh chung; đã đổi sang block đồng bộ, thêm regression pull-refresh. Analyze sạch trước lỗi widget; đang chạy lại Flutter test/build, chưa ghi giai đoạn hoàn thành.
- Kết quả sau sửa: Flutter **7/7 PASS**, analyze sạch, Web build PASS. Test lỗi HTTP nhanh còn phát hiện Future chưa được UI subscribe; đã quan sát Future ngay, vẫn hiển thị lỗi/retry qua FutureBuilder và test đã PASS. Không bỏ qua lỗi.
- `npm run test:mobile:api`: **1/1 PASS** sau thêm25 hợp đồng fixtures; client Dart kiểm tra cursor, lọc completed12 hợp đồng và không lộ chủ thuê khác. Migration dev3 verified và `npm run test:backup` PASS với3 migrations trên DB phục hồi mới.
- File chính: rental-pagination.js, migration003, route/tests/fixtures backend; React api/App/components/style/E2E; Flutter api/screens/widgets + paging/pull-refresh tests; runner live API và docs. Cần commit/push theo mục8; không đánh dấu Docker/Android/hardware hoàn thành.
- **Đã commit:** `8e0092a` trên main sau staged scan29 file/whitespace PASS. **Push thất bại lần batch này:** cùng lỗi thiếu credential GitHub (`could not read Username ... terminal prompts disabled`). Không force push hay đổi remote; giữ commit local. Cần người dùng đăng nhập GitHub qua Git Credential Manager/VS Code trên máy, không gửi mật khẩu/token trong chat. Không tiếp tục retry cùng lỗi nếu chưa có thay đổi xác thực.

### 2026-11-05 — HOÀN THÀNH: Flutter UI E2E trên browser

- Dùng bản Flutter Web vừa build, Chrome headless, API/DB test mới; không gọi là test Android/điện thoại thật.
- Tiêu chí: tương tác UI Customer đăng ký/thuê/theo dõi/nhận-giao/thông báo/hồ sơ, API lưu thật, không Flutter/page exception. Tách khỏi mock widget và live Dart contract.
- Thêm `scripts/test-mobile-web.mjs`, root script `test:mobile:web` và CI step sau Flutter build; cập nhật hướng dẫn/checklist/test plan. Harness tự tạo API/DB test và static proxy cùng origin, Chrome dùng Semantics. Không upload/deploy, không test Android.
- Lần đầu E2E đầy đủ FAIL do selector text không khớp Semantics tab/menuitem/merged text; đã kiểm tra screenshot/labels và sửa locator theo accessible role/name. Không thay đổi app để né test, không bỏ các assertion nghiệp vụ.
- `npm run test:mobile:web`: **PASS4 nhóm**, đăng ký/login → thuê2 khay → theo dõi nhiệt/ẩm/CO₂ simulator/camera trống → liên kết đúng chủ → giao hàng/address validation/hủy-gửi lại → đánh dấu thông báo đọc → sửa hồ sơ → logout → staff login denied. Kiểm tra DB thật sau hành động và không Flutter/JS exception.
- Ảnh QA `.local/flutter-customer.png`, diagnostics failures `.local/flutter-failure.png`/`flutter-semantics.json`, đều gitignore. Không dùng dữ liệu app thật. Browser/server test đã teardown. Các giới hạn Android/hardware/production giữ nguyên.
- Preflight Git cuối batch: `git credential-manager github list` vẫn không có tài khoản; không retry push cùng lỗi khi xác thực chưa thay đổi. Hai lỗi push trước đã ghi rõ ở trên. Batch UI E2E được lưu bằng commit local sau rà soát staged diff/secret/whitespace; cần đăng nhập GitHub trên máy rồi push các commit main đang ahead. Không dùng force/rebase/reset.

### 2026-11-05 — HOÀN THÀNH: đồng bộ GitHub sau khi người dùng đăng nhập

- Người dùng xác nhận đã đăng nhập; kiểm tra GCM thấy tài khoản `mired273mh`. Working tree/index sạch, HEAD03cccf6 đúng bản đã kiểm chứng ở batch trước, không có thay đổi ứng dụng mới.
- `git fetch origin main` PASS; trước push local ahead4/behind0. Đã kiểm tra diff/whitespace và danh sách tracked không có `.env` thật, `.local`, dump, keystore hoặc config.local.h.
- `git push origin HEAD:refs/heads/main` **PASS**, GitHub cập nhật `5756f5b..03cccf6`. Bao gồm baseline/AGENTS (`afc0a23`), merge giữ thay đổi README (`18dac28`), pagination (`8e0092a`), Flutter UI E2E (`03cccf6`). Không force push, không sửa/xóa lịch sử.
- Hai lỗi push thiếu credential trước đây **ĐÃ XỬ LÝ**; giữ nguyên bản ghi lỗi làm lịch sử. Không lưu token/mật khẩu GitHub trong repo hay log.
- Chỉ cập nhật tiến độ/bằng chứng Git trong lượt này; không chạy lại build/test ứng dụng vì source không thay đổi so với bản24 backend tests/7 Flutter tests/React6 nhóm/Flutter UI4 nhóm đã PASS. Push thành công không phải bằng chứng CI remote/Android/hardware đã PASS.

- Có file source/di trú/cấu hình tương ứng và tài liệu chạy.
- Đã chạy kiểm tra phù hợp hoặc nêu rõ giới hạn kiểm thử.
- Đúng quyền truy cập, không dùng dữ liệu giả để giả mạo kết quả thật.
- Checkbox trong `docs/BANG_KIEM_CHUC_NANG.md` được cập nhật có bằng chứng.
