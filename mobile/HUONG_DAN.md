# Flutter Customer

Flutter 3.47.9 / Dart 3.13.7 đã dùng để verify. App dùng REST API thật; unit/widget tests dùng MockClient và live API test tách riêng.

```powershell
cd mobile
flutter pub get
flutter analyze
flutter test
flutter run -d chrome --web-port=5174 --dart-define=API_BASE_URL=http://localhost:3000
flutter build web --no-wasm-dry-run
```

Khi chạy Web dev khác origin, đặt `WEB_ORIGIN=http://localhost:5174` trong `server/.env` rồi restart API. Bản Web build mặc định dùng origin hiện tại và cần reverse proxy `/api` đến backend. Bản Android debug mặc định truy cập host emulator qua `http://10.0.2.2:3000`; điện thoại thật cần `--dart-define=API_BASE_URL=https://ten-mien-api` phù hợp mạng và certificate.

Android main có INTERNET permission; cleartext chỉ mở trong debug. Master batch2026-11-05 đã build APK debug và chạy integration_test Android17/API37 emulator với Express/PostgreSQL thật PASS. Dùng `flutter build apk --debug --no-pub`; release vẫn dùng debug signing, chưa phát hành. Xem docs/DEMO_WINDOWS.md để phân biệt APK main với APK integration test.

Tại root, đặt TEST_DATABASE_URL tên `sm_test_*` và chạy `npm run test:mobile:api`. Script dựng API và fixtures mới trên PostgreSQL thật, gọi Flutter test riêng `integration/api_live_test.dart`; truyền credentials test qua environment, không ghi source. Có thể đặt `FLUTTER_ROOT` nếu SDK ở chỗ khác.

Sau `flutter build web --no-wasm-dry-run`, chạy `npm run test:mobile:web` tại root với TEST_DATABASE_URL mới. Test mở chính Flutter Web đã build bằng Chrome/Playwright, bật accessibility Semantics và thao tác UI đăng ký/thuê2 khay/liên kết/đọc môi trường/nhận-giao/thông báo/hồ sơ/logout. Backend và PostgreSQL thật, mẫu IoT là simulator. Windows dùng Chrome chuẩn hoặc CHROME_PATH, Linux dùng browser Playwright đã cài. Ảnh/diagnostic chỉ ghi `.local/`, server/browser test tự dừng. Đây là browser E2E của source Flutter, không phải test APK/điện thoại thật.

Luồng dùng: đăng ký Customer → Thuê khay (chọn gói/nhiều khay) → Khay của tôi → hợp đồng → khay → tiến trình/môi trường theo phòng. Mã khay chỉ liên kết được nếu hợp đồng đã cấp cho chính tài khoản. Khi nhân viên thu hoạch, vào Nhận nấm để chọn nhận tại trại/giao hàng, nhập địa chỉ khi giao. Thông báo in-app cập nhật khi trang hoạt động, không phải OS push nền. Hồ sơ cho sửa tên và đăng xuất.

Phiên chỉ giữ RAM, đóng app phải đăng nhập lại; không lưu token trong preferences. Camera chỉ mở URL được cấp khi đang thuê, chưa nghiệm thu live camera. Giới hạn danh sách hiện tại xem `docs/API.md`.

Android E2E: root đặt TEST_DATABASE_URL tên sm_test_* và ANDROID_TEST_DEVICE=emulator-<port> online, chạy `node scripts/test-mobile-android.mjs`. Runner chỉ nhận emulator, tạo DB mới/file fixture .local; Android dùng10.0.2.2 tới API host. SDK integration_test là dev dependency, không MockClient. Lần đầu harness chọn TextFormField trong dialog TextField đã sửa locator, rerun PASS; không gọi lỗi fixture là bug ứng dụng. Runner không chạy lên phone thật.
