# Chạy demo Smart Mushroom trên Windows

Ngày xác minh:2026-11-05. Dùng source hiện tại, database demo mới và tài khoản ngẫu nhiên; không dùng dữ liệu dự án khác. API/React/Flutter Android đã chạy với PostgreSQL thật; nhiệt/ẩm/CO₂ trong demo là **SIMULATOR**, lệnh **DRY-RUN**, không có live camera/relay thật.

## 1. Chuẩn bị và kiểm tra

Mở VS Code tại root repository. Mở PowerShell mới sau khi thay PATH. Node>=22.12, npm, PostgreSQL17, Flutter3.47.9/Dart3.13.7 đã có. Dùng `npm.cmd` nếu npm.ps1 bị policy chặn. Android cần Studio/SDK API36, Build Tools36.0.0, NDK28.2.13676358; `flutter doctor -v` phải nhận Android. Gradle9.3.1/AGP9.1 nằm trong project, không cài Gradle toàn máy. Flutter tự dùng JBR của Studio; JDK17 cũng đã cài.

```powershell
node --version
npm.cmd --version
flutter --version
flutter doctor -v
```

Nếu chưa có dependency project, chạy `npm.cmd ci` tại root và `flutter pub get` trong mobile. Không cài lại tool hoạt động tốt, không upgrade framework để thử sửa lỗi. File `.env` mẫu không phải tài khoản dùng được.

## 2. Khởi tạo demo riêng — một lần

Tại root:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/local-postgres.ps1
node scripts/demo.mjs init
node scripts/demo.mjs status
```

Script PostgreSQL dùng cluster `.local/postgres`, loopback55439, giữ dữ liệu hiện có và chờ recovery/readiness tối đa180 giây (có thể truyền StartupTimeoutSeconds). Không xóa WAL/data khi recovery chậm. Nó không thay dịch vụ PostgreSQL5432 của Windows.

Demo init tạo **DB mới tên sm_demo_...**, chạy migrations chỉ trên DB đó; tạo Admin/Operator/Customer,6 khay,1 gói và1 thiết bị simulator. Mỗi tài khoản có password ngẫu nhiên; không có mật khẩu demo hardcode trong Git. Mở `.local/demo/private.json` **trên máy của bạn** để xem account/password; không dán file vào chat/slide hoặc commit. File này còn có DB credential/device token/control key và bị gitignore.

Chạy init lần nữa giữ nguyên DB/accounts; không reset/seed thêm. Nếu file cấu hình bị mất, giữ DB và kiểm tra thủ công, không xóa database để làm lại. Luồng native demo này không cần sửa server/.env placeholder vì script dùng profile demo riêng.

## 3. Khởi động API + Web + simulator

Terminal1 tại root:

```powershell
node scripts/demo.mjs start
```

- API: http://127.0.0.1:3000; `/health` và `/ready` phải200.
- Web: http://localhost:5173; đăng nhập Admin hoặc Operator từ private.json.
- Simulator ghi mẫu mỗi2 giây, tối đa1000 mẫu mỗi lần chạy (~33 phút), kiểm tra mode và chỉ ack dry-run. Có thể dừng/chạy lại sau khi hết lượt; không tạo thêm thiết bị/account.
- Script chỉ bind loopback. Nếu cổng3000/5173 bận, dừng đúng ứng dụng đang dùng cổng hoặc chọn kế hoạch cổng riêng; script không kill tiến trình lạ để lấy cổng.

## 4. Flutter trên Android Emulator

Android Studio→Device Manager→Start AVD. Emulator user đã từng offline trong kiểm thử; nếu adb không nhận online, khởi động lại AVD có chủ đích. Không wipe data. Có thể dùng điện thoại nhưng chưa được kiểm thử trong bằng chứng này.

Terminal2 tại root:

```powershell
& "$env:LOCALAPPDATA/Android/Sdk/platform-tools/adb.exe" devices -l
cd mobile
flutter run -d emulator-5554 --dart-define=API_BASE_URL=http://10.0.2.2:3000
```

Thay emulator-5554 bằng ID **online** trên máy. `10.0.2.2` là host Windows nhìn từ emulator; không dùng localhost của Android để gọi Windows. Đăng nhập Customer trong private.json; Admin/Operator bị ứng dụng Customer từ chối theo thiết kế. App giữ session trong RAM, mở lại cần đăng nhập.

APK debug có thể build bằng `flutter build apk --debug --no-pub`, file `mobile/build/app/outputs/flutter-apk/app-debug.apk`. Sau khi chạy integration_test, build lại target main.dart trước khi cài APK demo vì APK test không phải bản trình diễn. Bản release/signing/HTTPS public chưa nghiệm thu; không phát hành APK test hoặc debug key làm production.

## 5. Kịch bản bảo vệ

1. Admin Web xem phòng,6 khay/gói, tài khoản Operator/Customer, thiết bị tên SIMULATOR; không tuyên bố đang đo sensor thật.
2. Customer Android chọn gói +2 khay→xác nhận thuê. Web mở hợp đồng để kiểm tra đúng Customer,2 khay và giá snapshot.
3. Customer mở hợp đồng/khay, xem môi trường theo phòng và nhãn MÔ PHỎNG; liên kết mã DEMO-001 nếu thuộc khay vừa thuê. Tài khoản khác không được chiếm bằng mã khay.
4. Operator Web cập nhật fruiting→ready, lịch thu hoạch dự kiến, rồi ghi cân nặng thu hoạch. Customer mở Thông báo và Nhận nấm.
5. Customer chọn nhận tại trại/giao hàng (giao cần địa chỉ); Operator xử lý tiếp nhận→bàn giao. Nhân viên chỉ xác nhận đã thu tiền khi thực sự trình diễn thu thủ công, không có online payment.
6. Hoàn tất hợp đồng sau khi đã thu/bàn giao; Customer xem lịch sử. Admin xem dashboard/báo cáo và tải CSV. Kiểm tra cả logout và đăng nhập sai vai trò.
7. Có thể trình diễn ngưỡng/cảnh báo và lệnh dry-run; chưa có driver GPIO/camera thật. Giải thích giới hạn này rõ với hội đồng.

## 6. Dừng và chạy lại

Terminal3 tại root:

```powershell
node scripts/demo.mjs stop
node scripts/demo.mjs status
```

Stop dùng control key của chính demo, dừng API/Web/simulator do script tạo, giữ PostgreSQL/database/accounts. Cũng có thể Ctrl+C ở terminal demo. Không dùng taskkill toàn bộ Node, dropdb, reset WAL hoặc `docker compose down -v`.

Lần sau chạy PostgreSQL script rồi `node scripts/demo.mjs start`; không cần init hoặc migrate lại. Sau khi Windows tắt bất thường, chờ PostgreSQL recovery hoàn tất. Nếu mất điện/mất mạng khi đang ghi dữ liệu, cần kiểm tra readiness và dữ liệu trước demo, không giả định chỉ thấy process là DB sẵn sàng.

## 7. Tự kiểm thử và phạm vi bằng chứng

- `scripts/test.ps1`: DB sm_test_* mới,32 integration cases; giữ DB, không xóa.
- `npm.cmd run build:web`, `npm.cmd run test:web`:2 client tests +9 nhóm Chrome E2E, gồm1280x720/390px và session race.
- Trong mobile: `flutter analyze`, `flutter test`:12 tests dùng MockClient/widget.
- `node scripts/test-mobile-android.mjs`: đặt TEST_DATABASE_URL tên sm_test_* và ANDROID_TEST_DEVICE trỏ emulator online. Runner tạo DB riêng, dùng fixture test/10.0.2.2; Android UI thật và SQL hậu kiểm, **không sensor/relay/camera thật**. Có thể nạp TEST_DATABASE_URL từ .local/database.env vào biến chỉ trong terminal rồi đổi pathname thành sm_test_android; không in credential.
- `npm.cmd run test:mobile:api`, `test:mobile:web` là VM/browser, tách khỏi Android.
- `npm.cmd run test:backup` phục hồi DB mới; `test:load` chỉ benchmark đọc local; firmware compile2 mode không flash.

Docker Windows cũng đã build/up/smoke thành công trong project xác minh riêng; đó không phải DB/accounts của native demo. Nếu dùng Compose, xem CAI_DAT_TRIEN_KHAI và tạo root.env riêng, bootstrap admin trong container. Bằng chứng Windows Docker/Android không chứng minh production TLS hoặc phần cứng vật lý.
