# Dọn repository — 2026-11-05

Phạm vi: repository hiện tại, bắt đầu từ `fe5dbaf` trên `main`. Chỉ dọn cache/output tái tạo được và dependency không dùng; không thay nghiệp vụ. `package.json` có thay đổi của người dùng từ trước, được giữ nguyên và không đưa vào commit cleanup.

## Phân loại và quyết định trước khi xóa

| Nhóm | Phân loại / kiểm tra | Quyết định / mức an toàn |
|---|---|---|
| server/, web/src, mobile/lib, iot/ | Source/backend/client/firmware đang dùng qua import, API và build | Giữ toàn bộ |
| server/migrations, test, integration, integration_test | Schema và bằng chứng kiểm thử nghiệp vụ | Giữ toàn bộ |
| deploy/, scripts/, .github/ | Docker/Nginx, demo, test, compile và CI được tham chiếu trong hướng dẫn | Giữ toàn bộ |
| docs/, docs/uml/rendered, README và AGENTS/2PROMPT/TIEN_DO | Yêu cầu/SRS/UML, bằng chứng và ngữ cảnh để tiếp tục đồ án | Giữ toàn bộ; PNG UML là sản phẩm nộp bài, không coi là rác |
| package-lock.json, mobile/pubspec.lock | Khóa dependency để tái lập build | Giữ; pubspec.lock chỉ bỏ dependency Cupertino không dùng |
| Android manifest/Gradle wrapper properties, mobile/web icons, .metadata | Platform bootstrap, theme/icon và cấu hình Flutter cần khi clone/build | Giữ; không xóa vì trông giống template |
| web/node_modules/.vite, .vite-temp, web/dist | Cache Vite và bundle có thể build lại; không có app đang phục vụ từ đây | Xóa, an toàn cao; build React sẽ tạo lại dist |
| mobile/build/app/{intermediates,kotlin,tmp}, build/{test_cache,unit_test_assets,web}, .dart_tool/flutter_build | Compiler/kernel/test cache và bundle Flutter Web sinh tự động | Xóa, an toàn cao; giữ app/outputs chứa APK. Icon PNG trong output được đối chiếu hash với source trước xóa |
| .local/iot-build-{0,1,0-0,0-1,1-0}/{core,libraries,sketch} | Object/dependency/sketch cache Arduino CLI | Xóa cache, an toàn cao; giữ file firmware đầu ra ở thư mục build gốc; compile lại3 profile |
| .local/{add-command-history,update-iot-web,update-master-docs}.cjs | Script thay thế text một lần từ checkpoint trước, không có tham chiếu vận hành | Xóa3 file, an toàn cao; không xóa script kiểm tra/demo/triển khai |
| cupertino_icons | Không có import/CupertinoIcons/resource reference trong lib/test/integration | Bỏ khỏi pubspec bằng Flutter, cập nhật lock; kiểm chứng analyze/test/APK |
| node_modules/, Android .gradle, .local/tools | Dependency/toolchain đang dùng | Giữ để không tải lại/cài lại vô ích; đã bị Git ignore |
| .local/postgres (~1.6GiB), android-avd (~4.1GiB), backups, demo, database.env, các .env khác | Database, trạng thái emulator, backup và cấu hình riêng | Giữ; không drop database, wipe AVD hoặc xóa credentials |
| .local/*.log, screenshots, CI archives/artifacts, báo cáo lỗi | Bằng chứng test/review và bảo vệ | Giữ; không tự quyết là log cũ không còn giá trị |

## Thực hiện và kiểm tra Git

- Ban đầu151 tracked files; không có cache/build/temp nhầm lên Git, không có hai tracked file trùng SHA256. Không có tracked file bị xóa và không cần `git rm --cached`.
- Lượt đầu xóa28 target,1691 file sinh tự động/one-off,980956146 bytes (~935.51MiB), manifest `.local/cleanup-deleted-initial.json`. Build/test thành công đã tạo lại cache; sau kiểm chứng dọn lại18 target/1199 file cache (~1717.04MiB), manifest `.local/cleanup-deleted.json`. Không cộng hai số thành dung lượng tiết kiệm vì có file được tạo lại giữa hai lượt; APK/firmware đầu ra vẫn giữ.
- Đo trước/sau cùng phạm vi, không theo junction: **giảm ròng886384214B (~845.32MiB)** trong workspace; riêng nhóm web/mobile/IoT-build giảm978316455B (~933MiB). DB test mới làm PostgreSQL tăng91841278B (~87.59MiB), được giữ theo quy tắc không tự xóa database. Metadata/log kiểm chứng mới cũng chiếm một phần nhỏ. Đây là tổng kích thước file logic, không phải phép đo block vật lý/ổ C: (AVD sparse/dedup có thể khác).
- Trước xóa kiểm tra mọi đường dẫn tuyệt đối trong workspace, không đi qua symlink/junction, không chứa tracked files/.env/keystore/APK/backup/log. Không dùng glob xóa cả `.local`, `git clean -fdx`, hard reset, force push hoặc sửa lịch sử.
- Bổ sung `.gitignore` cho Vite/Node/test output, Flutter/Gradle/Kotlin/CXX, ESP32 binary/output và OS/editor temp. Bổ sung `.dockerignore` cho cache/log/test output để tránh đưa vào build context; không che source/header, lockfile hoặc env example.
- Đã quét151 tracked files hiện tại và22 commits/300 text blobs trong lịch sử reachable: không phát hiện mẫu provider token/private key hoặc khớp credential local đã biết. Đây là kết quả của các mẫu/quy tắc đã chạy; không xác nhận phát hiện mọi secret chưa biết. Không in giá trị bí mật, không đưa `.env`/database lên Git.
- Lỗi tooling giữ lại: redirection lần pub remove đầu sai thư mục, lệnh chưa thực thi; sửa path rồi thành công. Guard cache chặn PNG trước xóa, chỉ cho qua khi hash khớp icon source. Thống kê PowerShell hashtable lỗi sau xóa; sửa và xác minh bằng manifest/Node, không có source/data bị xóa ngoài danh sách.

## Kiểm thử sau cleanup

| Kiểm tra | Trạng thái | Bằng chứng |
|---|---|---|
| Backend/PostgreSQL | PASS38/38 | scripts/test.ps1; .local/cleanup-backend.log; DB test mới, không drop DB |
| React build | PASS | npm.cmd run build:web; .local/cleanup-web-build.log |
| React test | PASS2 client tests +11 nhóm Chrome E2E | npm.cmd run test:web; .local/cleanup-web-tests.log |
| Flutter analyze | PASS, không issue | .local/cleanup-flutter-analyze.log |
| Flutter unit/widget | PASS12/12 | .local/cleanup-flutter-test.log |
| Android APK debug | PASS, native exit0 | .local/cleanup-android-native.log; APK tại mobile/build/app/outputs/flutter-apk/app-debug.apk |
| ESP32 compile3 profile | PASS3/3 | .local/cleanup-iot-compile.log; không upload |
| Compose config / Docker build | PASS, native exit0 cả2 | .local/cleanup-compose-native.log, cleanup-docker-native.log; credentials chỉ trong process env |
| Imports/ignore/user change | PASS | 117 relative imports/URLs,14 ignore cases, không tracked source bị ignore; SHA256 package.json user không đổi |
| Generated test prerequisite | ĐÃ PHÂN LOẠI | scripts/test-mobile-web.mjs cần mobile/build/web; chạy flutter build web --no-wasm-dry-run trước theo CI/hướng dẫn. Bundle build không phải source bị thiếu |
| Docs links/secret/diff | PASS | Staged10files scan;27docs/36relative links không thiếu; diff check sạch; không stage package.json user |

Lần gọi APK/Docker đầu qua PowerShell với ErrorActionPreference=Stop dừng ở stderr warning/progress, chưa phải build app FAIL. Đã chạy lại native qua Node, kiểm tra exit0 và output thực tế. JBR25 cảnh báo restricted native access nhưng APK build thành công; không tự đổi Java hay cấu hình máy.

Cleanup không nghiệm thu lại điện thoại, ESP32/cảm biến/relay/camera vật lý hay production TLS. Các phần chức năng còn thiếu trước cleanup vẫn giữ trạng thái tại bảng truy vết yêu cầu.
