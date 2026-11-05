# Kiểm tra môi trường Windows — 2026-11-05

Kiểm tra tại repository Smart Mushroom hiện tại, sau review commit `3f53424`. Chỉ kiểm kê, chạy kiểm tra đọc/build/analyze và cập nhật tài liệu. Không cài phần mềm hệ thống; không đổi PATH, policy, registry, firewall; không tạo/xóa/sửa dữ liệu DB; không flash hoặc điều khiển thiết bị. Các API/Vite/Chrome headless tạm dùng để smoke test đã dừng.

**Kết luận cập nhật sau lần kiểm lại:** có thể chuẩn bị demo API + React + PostgreSQL bằng công cụ hiện có. **JDK17.0.21 đã cài và java/javac chạy được bằng đường dẫn đầy đủ**, không cần cài lại. **Machine PATH Flutter đã sửa đúng C:\Users\mired\.sm-tools\flutter\bin**; nạp lại PATH chỉ trong process chẩn đoán thì flutter3.47.9/dart3.13.7 PASS bằng tên lệnh. Phiên ứng dụng cũ cần khởi động lại để nhận PATH. Android/Docker/WSL giữ kết luận lần kiểm tra trước, không test lại trong lần chỉ kiểm tra PATH. IoT/camera thật và driver điều khiển chưa nghiệm thu. Các kết quả SQL/React ở dưới là từ lần kiểm kê đầu.

## 1. Phần mềm, phiên bản và việc cần làm

| Phần mềm/công cụ | Trạng thái đã xác minh | Bắt buộc cài thêm? | Phiên bản phù hợp | Link chính thức | Cài đặt/cấu hình cần làm thủ công |
|---|---|---|---|---|---|
| Node.js | `node --version`:26.13.0, PATH tại Program Files; portable22.23.4 cũng chạy được | Không |26.13.0 hiện tại chạy smoke/build tốt;22.23.4 để tái lập CI cũ, project yêu cầu>=22.12 |[Node.js](https://nodejs.org/en/download) | Giữ bản hiện có; tránh vô tình đổi Node giữa terminal. Không tự upgrade/downgrade |
| npm | `npm.cmd --version`:11.20.0; dependency tree đầy đủ, exit0. `npm` trong PowerShell FAIL do npm.ps1 bị policy Restricted chặn | Không | npm đi kèm Node hiện có |[Node.js/npm](https://nodejs.org/en/download) | Dùng `npm.cmd` trong PowerShell hoặc npm trong CMD; không cần hạ policy toàn máy. Chỉ chạy npm ci khi cần cài lại dependency từ lockfile |
| PostgreSQL | Binary portable và bản Program Files đều17.11; service5432 và portable55439 đều accepting connections. SQL xác thực thực tế thành công trên55439 | Không, đã có |17.11 đã kiểm chứng; project>=16 |[Windows installer](https://www.postgresql.org/download/windows/) | Chọn một DB cho demo. Nên tận dụng smart_mushroom_dev:55439 đã có schema. Cổng5432 chưa kiểm tra SQL/auth vì chưa có credentials dùng được |
| Git/GitHub | Git2.56.0.windows.4 trong PATH; GCM có mired273mh; ls-remote thành công; HEAD3f53424 trùng main trên GitHub | Không | Giữ2.56.0 hiện có |[Git for Windows](https://git-scm.com/install/windows) | Không cần đăng nhập lại hiện tại. package.json có thay đổi local từ trước audit, chưa commit/push; cần review riêng |
| Flutter SDK |3.47.9; Machine PATH đã đúng, where/flutter --version PASS sau nạp lại environment trong process chẩn đoán | Không | Giữ3.47.9 stable đã dùng với source/CI |[Flutter SDK archive](https://docs.flutter.dev/install/archive) | Thoát hẳn/mở lại VS Code và terminal để process nhận PATH mới, không cần thêm lại hoặc cài lại |
| Dart |3.13.7, where/dart --version PASS khi nạp lại PATH đã lưu | Không cài riêng |3.13.7 đi kèm Flutter3.47.9; pubspec yêu cầu^3.13.7 |[Dart/Flutter bundle](https://dart.dev/get-dart) | Mở lại ứng dụng terminal; dùng Dart trong Flutter SDK |
| Android Studio/Android SDK/ADB | Không có executable trong PATH/vị trí chuẩn, không thấy registry Android Studio; doctor báo Unable to locate Android SDK; không thấy Android device/emulator | SDK bắt buộc để chạy Android; Studio là cách cài đề xuất | API36; Build Tools36.0.0; Platform Tools/Command-line Tools; NDK28.2.13676358 theo FlutterExtension hiện có |[Android Studio](https://developer.android.com/studio), [Flutter Android setup](https://docs.flutter.dev/platform-integration/android/setup) | Cài Studio/SDK Manager, SDK components và CMake/NDK phù hợp; xác định SDK path, cấu hình Flutter, đọc/chấp nhận licenses; kết nối phone hoặc tạo emulator |
| Java JDK | **Đã cài Temurin17.0.21+9**, java và javac PASS tại C:\Program Files\Eclipse Adoptium\jdk-17.0.21.9-hotspot\bin; Machine PATH đã chứa bin nhưng process hiện tại chưa nhận; JAVA_HOME chưa đặt | Không cài lại | JDK17 hiện có phù hợp mức tối thiểu AGP9.1; Gradle wrapper9.3.1 |[Temurin JDK17](https://adoptium.net/temurin/releases/?version=17), [AGP compatibility](https://developer.android.com/build/releases/agp-9-1-0-release-notes) | Thoát/mở lại VS Code/Codex/terminal để nhận PATH mới; cấu hình JAVA_HOME/Flutter JDK nếu cần. Kiểm tra java -version và javac -version sau khi mở lại |
| Docker Desktop/Engine | docker không có trong PATH/vị trí chuẩn, không thấy Desktop trong registry/service/pipe; chỉ standalone Compose5.7.0 chạy được | Không cho chạy native; có nếu demo Compose trên máy này | Docker Desktop stable Windows x64, Linux containers +WSL2 backend |[Docker Desktop Windows](https://docs.docker.com/desktop/setup/install/windows-install/) | Sửa WSL trước; cài/mở Desktop, chờ Engine Running; kiểm tra docker version có cả Client/Server và docker compose version. Compose.exe đơn lẻ không cung cấp Engine |
| WSL2 | Appx WSL2.6.2.0 hiện diện nhưng lệnh thực tế báo Class not registered: Wsl/CallMsi/Install/REGDB_E_CLASSNOTREG; chưa dùng được runtime | Chỉ cần sửa để dùng Docker WSL backend/emulator Linux khác, không cần cho native API | WSL>=2.1.5 theo Docker; gói2.6.2 hiện có chưa chứng minh hoạt động |[Microsoft troubleshooting](https://learn.microsoft.com/en-us/windows/wsl/troubleshooting), [WSL releases](https://github.com/microsoft/WSL/releases) | Kiểm tra/repair cài đặt WSL bằng hướng dẫn Microsoft và quyền quản trị khi cần; xác minh lại wsl --version/status/list. Chưa xác định nguyên nhân sâu của đăng ký MSI/COM, không tự sửa registry hoặc xóa distro |
| Arduino CLI/ESP32 toolchain | CLI1.5.1 chạy được; core esp32:esp32 3.3.3, board ESP32 Dev Module nhận diện trong core; compiler14.2.0 chạy được; thư viện đã liệt kê | Không cần cài lại CLI; cần phần cứng/cấu hình để chạy thật | Giữ core3.3.3, ArduinoJson7.4.3, Sensirion I2C SCD4x1.1.0, Core0.7.3 |[Arduino CLI](https://docs.arduino.cc/arduino-cli/installation/), [Espressif setup](https://docs.espressif.com/projects/arduino-esp32/en/latest/installing.html) | Gọi CLI bằng đường dẫn đầy đủ +arduino-cli.yaml hiện có hoặc thêm CLI vào User PATH. Chọn đúng board/port sau khi cắm; chưa upload |
| USB driver ESP32 | Chỉ COM3/COM4 Bluetooth; không có board ESP32 được discovery nhận diện, không thấy thiết bị CP210/CH340 hiện gắn | Tùy chip USB trên board, chỉ cài nếu Windows cần | Driver đúng chip của board thực tế |[Silicon Labs CP210x](https://www.silabs.com/software-and-tools/usb-to-uart-bridge-vcp-drivers), [WCH CH34x](https://www.wch-ic.com/downloads/CH341SER_EXE.html) | Cắm cáp có dữ liệu, kiểm tra Device Manager/VID/PID; không coi mọi COM là ESP32 hoặc cài tất cả driver theo suy đoán |
| Chrome |156.0.8078.80, doctor nhận diện và headless smoke thực tế PASS | Không | Bản đang dùng |[Chrome](https://www.google.com/chrome/) | Dùng để demo Web/Flutter Web; Android vẫn cần kiểm thử riêng |

Windows11 Home Single Language25H2/build26200, x64, RAM15,7GiB, HypervisorPresent=true. Điều này không chứng minh WSL/Android emulator đã hoạt động. Docker cho luồng này dùng Linux containers. Cảnh báo thiếu Visual Studio trong flutter doctor liên quan target Windows desktop; không bắt buộc cài Visual Studio/C++ chỉ để chạy Android hoặc Web.

Đường dẫn portable là công cụ đã kiểm chứng bằng lệnh, không phải code/dữ liệu ứng dụng từ dự án khác. Link tải được đối chiếu trang chính thức trong lượt kiểm tra; không yêu cầu đổi lên bản mới nhất khi bản hiện có đã phù hợp.

## 2. Kết nối và cấu hình dự án thực tế

| Thành phần | Bằng chứng trong lượt này | Cần làm trước demo |
|---|---|---|
| PostgreSQL portable | SQL authenticated vào smart_mushroom_dev:55439, server17.11;3 migration checksum khớp source; users/rooms/trays/plans/rentals/devices/readings/camera đều0 | Giữ DB hiện có, không init/reset/migrate lại chỉ để sửa dữ liệu trống. Tạo Admin đầu tiên và dữ liệu demo sau khi điền credentials riêng |
| PostgreSQL service5432 | Dịch vụ postgresql-x64-17 Running, TCP5432/pg_isready accepting | Chưa biết credentials/schema/database của service; không thể kết luận ứng dụng kết nối được. Không dùng mật khẩu portable cho service này |
| server/.env | Có file nhưng DATABASE_URL trỏ5432/smart_mushroom với credentials placeholder; ADMIN_EMAIL/PASSWORD cũng còn mẫu | Điền giá trị đúng hoặc override DATABASE_URL qua terminal dùng55439. Không gửi mật khẩu trong chat/commit |
| Backend | Với DB portable đúng: /health200, /ready200, /api/rooms401 khi chưa đăng nhập. Smoke qua app Express thực, Node26; server tạm đã đóng | Chạy npm.cmd run dev:server ở root sau khi chọn DB. Cần Admin thật; chưa demo login bằng dữ liệu dev vì chưa có user |
| React | npm.cmd run build:web PASS trên Node26; Vite+Chrome hiển thị Đăng nhập, proxy /api/rooms→Express trả401, không pageerror | Terminal riêng npm.cmd run dev:web; localhost5173; dùng tài khoản staff đã tạo |
| Flutter | doctor/network/Chrome/devices và pub deps chạy; analyze sạch; chỉ thấy Windows/Chrome/Edge; Android chưa có | Có thể demo Web ở5174 với API_BASE_URL và WEB_ORIGIN đúng. Android phải cài SDK/JDK rồi build/run trước khi khẳng định PASS |
| ESP32/cảm biến | CLI/core/compiler có; config.local.h chưa có, config.example.h chỉ placeholder; DB không có hardware device/token được provision | Chốt board/sensor, Wi-Fi/API URL/device token/root CA/NTP, đấu nối và kiểm tra Serial, ghi mẫu hardware thật rồi đối chiếu Web/Customer |
| Camera | Không có room/camera_url trong dev DB, chưa có URL/credentials để kiểm tra | Cung cấp camera/gateway HTTPS bảo vệ quyền xem, cấu hình cho phòng và kiểm tra live feed. Không scan LAN hoặc suy ra không có camera vật lý từ DB trống |
| Điều khiển | Theo source hiện có, manual/automatic đều dry-run; không driver relay/GPIO | Phải phát triển driver/fail-safe theo BOM và giới hạn an toàn đã xác nhận, rồi nghiệm thu tải thật; cài tool không giải quyết phần này |

Không có listener tại3000/5173/5174/8080 khi kết thúc smoke; PostgreSQL55439 và service5432 được giữ nguyên. Native service5432 hiện bind0.0.0.0/::; chưa kiểm tra firewall/pg_hba và chưa thay cấu hình. Không cần mở thêm cổng DB ra mạng để demo.

## 3. Thứ tự chạy và phần thao tác thủ công

Các lệnh sau là hướng dẫn để người dùng thực hiện sau khi chuẩn bị, không phải những thao tác đã được chạy trong lượt kiểm kê.

### A. Demo API + React bằng bộ hiện có

1. Giữ PostgreSQL portable55439 đang chạy; dùng DB hiện có. Trong server/.env thay ADMIN_* mẫu bằng thông tin riêng, password mạnh>=12 ký tự. Không có tài khoản mặc định.
2. Mở PowerShell tại root repository, nạp DATABASE_URL mà không in credentials:

```powershell
$env:DATABASE_URL = (Get-Content -LiteralPath .local/database.env |
  Where-Object { $_.StartsWith('DATABASE_URL=') }).Substring(13)
npm.cmd run admin:create
npm.cmd run dev:server
```

CLI admin chỉ dùng lần đầu khi chưa có Admin; kiểm kê thấy0 Admin nên bước này còn cần. Biến môi trường trên chỉ thuộc terminal, không sửa cấu hình máy. npm workspace chạy ở server nên đọc server/.env; DATABASE_URL môi trường được ưu tiên hơn file mặc định. Không ghi đè file .env đã tồn tại bằng lệnh Copy-Item từ example.

3. Terminal thứ2 tại root: `npm.cmd run dev:web`; mở http://localhost:5173. API3000 cần /health và /ready200. Đăng nhập Admin, tạo Operator/phòng/khay/gói; tạo Customer qua ứng dụng và dùng cùng DB. Việc cấp thuê/cập nhật tiến trình/giao nhận dùng đúng vai trò.
4. Chỉ khi chọn PostgreSQL service5432 thay cho portable mới cần cấu hình user/database/schema riêng và chạy migrations theo guide. Chưa thực hiện lựa chọn này; không chuyển/copy dữ liệu giữa2 cluster.

### B. Flutter Customer

Lần kiểm lại: Machine PATH có `C:\flutter\bin` và `C:\src\flutter\bin`, nhưng cả2 không có flutter.bat. SDK đang chạy thực tế là `C:\Users\mired\.sm-tools\flutter`; thêm bin của SDK này thủ công vào User PATH rồi mở lại ứng dụng terminal. JDK17 đã có, không cần lặp bước cài JDK phía dưới; Android SDK vẫn cần chuẩn bị.

Web demo (terminal riêng, sau khi backend WEB_ORIGIN được đặt http://localhost:5174 và khởi động lại có chủ đích):

```powershell
cd mobile
& "$env:USERPROFILE/.sm-tools/flutter/bin/flutter.bat" run -d chrome --web-port=5174 --dart-define=API_BASE_URL=http://localhost:3000
```

Android: cài Android Studio/SDK Manager và JDK phù hợp trước; SDK API36/Build Tools36.0.0/NDK28.2.13676358 tương ứng source SDK hiện có. Cài Command-line/Platform Tools, CMake và emulator/image nếu dùng giả lập. Cấu hình SDK/JDK vào Flutter, PATH/JAVA_HOME khi cần, mở terminal mới, đọc và chấp nhận `flutter doctor --android-licenses`; chạy lại `flutter doctor -v`, `adb devices`, `flutter devices`, `flutter analyze`, `flutter test`, `flutter build apk --debug` và `flutter run -d <device-id>`. Chưa chạy build APK hoặc Gradle download trong lượt này.

Emulator mặc định API http://10.0.2.2:3000; điện thoại thật phải dùng IP LAN/API HTTPS truy cập được qua `--dart-define=API_BASE_URL=...`. Backend phải lắng nghe địa chỉ phù hợp và firewall Private cho phép khi người dùng cấu hình. localhost trên điện thoại không phải máy Windows. Debug cho phép cleartext, bản release cần HTTPS/certificate phù hợp; release signing riêng chưa cấu hình, Gradle hiện còn dùng debug signing cho release nên chưa phát hành production.

### C. ESP32, cảm biến, camera và điều khiển

Kết nối board/cáp/nguồn, xác minh driver/COM; chọn đúng FQBN, chưa mặc định mọi ESP32 là Dev Module. Firmware hiện đề xuất SCD4x I2C SDA21/SCL22, phải xác nhận module/điện áp trước đấu. Tạo phòng và device mode hardware trong Web, lưu token riêng; tạo config.local.h từ example và cấu hình Wi-Fi/API HTTPS/root CA. SM_SIMULATION=0 mới đọc sensor;1 tạo mẫu mô phỏng. HTTP dev chỉ cho literal IPv4 private khi chủ động bật, không phải cấu hình production. Compile2 mode đã PASS ở lượt review trước; upload/Serial/API mẫu thật chưa test.

Đối chiếu sensor với thiết bị tham chiếu, kiểm tra nhãn simulated=false/mode hardware và mẫu hiển thị ở Web/Customer đúng phòng. Nhãn hardware trên server không tự chứng minh mẫu vật lý. Camera phải có HTTPS gateway/live URL và kiểm soát truy cập riêng; URL contract không biến thành video tự động. Không bật quạt/bơm/sưởi/LED thật cho tới khi có driver, sơ đồ, giới hạn an toàn và dry-run đạt.

### D. Docker tùy chọn

Native demo không cần Docker. Nếu trình diễn Compose trên Windows, xử lý lỗi WSL/MSI trước theo Microsoft, không tự xóa/reset distro. Sau khi WSL CLI hoạt động, cài và mở Docker Desktop Linux engine. Khi `docker version` có Server, chuẩn bị root .env mới (hiện chưa có) với POSTGRES_PASSWORD riêng/đủ mạnh và WEB_ORIGIN đúng; rồi chạy Compose theo CAI_DAT_TRIEN_KHAI. Volume/container DB khác DB portable; cần bootstrap trong container riêng. Compose Linux đã PASS trên GitHub CI, chưa PASS trên máy Windows này. Không dùng down -v/reset database để xử lý lỗi.

## 4. Phân loại bằng chứng và Git

- **Chạy thành công trong lượt này:** executable versions; npm tree toàn bộ exit0; SQL read-only/schema checksum3/3 trên55439; API200/200/401; React build +Chrome login/proxy401; Flutter analyze sạch/pub deps/devices; Arduino core/lib/board/compiler. Không chạy lại toàn bộ bộ test nghiệp vụ vì không viết lại chức năng hoặc tạo dữ liệu test.
- **Lịch sử đã kiểm chứng, xác nhận lại trên GitHub:** CI run[42005908332](https://github.com/mired273mh/Smart-Mushroom-Management-System/actions/runs/42005908332), commit3f53424, cả2 jobs api-web/deployment success. Backend32 tests, React2+8 nhóm, Flutter12+live API+4 nhóm UI, Docker Linux là kết quả review trước; không gọi đây là test Node26/Windows Docker/Android trong lượt này.
- **Mô phỏng:** telemetry trong các E2E/simulator; dry-run manual/automatic. Flutter unit/widget dùng MockClient. Không đồng nhất với ESP32/sensor/relay/camera thật.
- **Chưa kiểm thử:** SQL auth/schema trên service5432; Android/APK/emulator/phone; WSL runtime đang lỗi/Docker Windows; board upload/sensor/live camera/relay; HTTPS production.
- **Git đầu lượt:** HEAD3f53424 bằng remote main; GCM có user và ls-remote thành công. package.json đã có sửa local trước lượt này, chưa commit/push. Không sửa hoặc đưa thay đổi này vào commit kiểm kê. Báo cáo/tiến độ/checklist/test log được commit/push riêng theo AGENTS; kết quả/hash báo ở cuối phiên.

## 5. Lỗi cụ thể và cách xử lý

| Lỗi/thiếu | Nguyên nhân đã xác định | Xử lý tiếp theo |
|---|---|---|
| npm.ps1 bị chặn | Get-ExecutionPolicy=Restricted; npm trong PowerShell chọn script.ps1 | Dùng npm.cmd, không cần thay policy hệ thống |
| Lệnh flutter/dart/psql/arduino-cli không nhận | Binary chạy bằng absolute path nhưng chưa vào PATH | Dùng absolute path hoặc thêm đúng thư mục vào User PATH thủ công |
| Backend không sẵn sàng với cấu hình mặc định | server/.env còn credentials mẫu, sai profile DB so với portable đã chuẩn bị; DB dev chưa có Admin/data | Chọn profile đúng, thay ADMIN_* mẫu, bootstrap và tạo dữ liệu demo |
| Android chưa chạy | Không tìm được SDK/adb; JAVA_HOME/ANDROID_HOME chưa đặt, local.properties chưa có sdk.dir; JDK17 mới đã chạy được nhưng phiên hiện tại chưa nhận PATH | Cài SDK, dùng JDK17 đã có và xác minh doctor/adb/build thực tế; không chỉ sửa biến trỏ thư mục rỗng |
| WSL không dùng được | Lệnh báo Class not registered tại CallMsi/Install; package hiện diện không đủ | Repair/kiểm tra cài đặt WSL theo Microsoft; cần chẩn đoán thêm nếu còn lỗi. Chưa khẳng định nguyên nhân sâu hay cách repair chắc chắn thành công |
| Chưa có IoT/camera demo thật | Không có thiết bị/token/camera được cấu hình; USB discovery chỉ có Bluetooth | Xác nhận thiết bị và cấu hình riêng; không suy ra có phần cứng từ kết quả compile |

Không phát hiện lỗi mới của các chức năng ứng dụng đã chạy trong lượt kiểm kê; các vấn đề trên là môi trường/cấu hình hoặc phần chưa triển khai/chưa nghiệm thu. Không viết lại tính năng đã PASS.

## 6. Lần kiểm lại phần mềm — 2026-11-05

- **Thay đổi mới:** registry ghi Temurin JDK17.0.21.9; đã chạy java17.0.21 và javac17.0.21 thành công. PATH Machine đã có JDK bin; process hiện tại chưa nhận biến mới. Không tự đổi JAVA_HOME/PATH.
- **Còn thiếu:** Android Studio/SDK chưa tìm thấy qua PATH/registry/Start Apps/vị trí chuẩn và flutter doctor; Docker Desktop/CLI/Engine chưa tìm thấy qua các kiểm tra tương ứng. SDK là bắt buộc cho Android; Docker chỉ cần khi chọn demo Compose trên Windows.
- **Đã có nhưng cần cấu hình:** Flutter3.47.9/Dart3.13.7 chạy từ .sm-tools; hai PATH Flutter ở C:\flutter và C:\src\flutter không có executable. Arduino CLI1.5.1 chạy bằng absolute path. Node26.13/npm.cmd11.20/Git2.56/psql17.11 đều trả version;2 cổng PostgreSQL accepting.
- **WSL:** lần trước lỗi REGDB_E_CLASSNOTREG; lần này wsl --version không hoàn tất trong12 giây. Đã chỉ dừng process chẩn đoán được tạo trong lượt này, không repair/install/reset WSL; chưa coi WSL đã được sửa.
- Flutter doctor vẫn chỉ nhận Windows/Chrome/Edge, chưa Android; thiếu Visual Studio chỉ liên quan target Windows desktop. Không yêu cầu cài Visual Studio để chạy Web/Android.
- Chỉ kiểm kê executable/doctor/PATH, không chạy lại test nghiệp vụ, build APK/firmware, migration hoặc sửa dữ liệu. package.json local từ trước được giữ nguyên.

### Kiểm tra PATH tiếp theo theo yêu cầu người dùng

Machine PATH hiện chỉ có đường dẫn Flutter đúng `C:\Users\mired\.sm-tools\flutter\bin`, chứa cả flutter.bat và dart.bat. Process cũ vẫn giữ C:\flutter\bin/C:\src\flutter\bin nên where ban đầu không tìm thấy. Nạp PATH Machine+User chỉ vào process chẩn đoán (không ghi cài đặt Windows): where tìm đúng SDK, `flutter --version`3.47.9 và `dart --version`3.13.7 đều exit0. PATH đã sửa thành công; cần khởi động lại ứng dụng giữ environment cũ, không cài lại SDK. Đây là kết quả mới thay kết luận PATH sai ở lần kiểm trước.
