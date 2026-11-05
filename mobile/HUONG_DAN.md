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

Android main có INTERNET permission; cleartext chỉ được mở trong debug. Chưa có Android SDK trên máy kiểm thử nên APK/emulator CHƯA CHẠY. Khi cài SDK/JDK phù hợp, dùng `flutter doctor`, `flutter build apk --debug`; release cần cấu hình signing riêng, template hiện chưa có khóa release và chưa được phát hành.

Tại root, đặt TEST_DATABASE_URL tên `sm_test_*` và chạy `npm run test:mobile:api`. Script dựng API và fixtures mới trên PostgreSQL thật, gọi Flutter test riêng `integration/api_live_test.dart`; truyền credentials test qua environment, không ghi source. Có thể đặt `FLUTTER_ROOT` nếu SDK ở chỗ khác.

Luồng dùng: đăng ký Customer → Thuê khay (chọn gói/nhiều khay) → Khay của tôi → hợp đồng → khay → tiến trình/môi trường theo phòng. Mã khay chỉ liên kết được nếu hợp đồng đã cấp cho chính tài khoản. Khi nhân viên thu hoạch, vào Nhận nấm để chọn nhận tại trại/giao hàng, nhập địa chỉ khi giao. Thông báo in-app cập nhật khi trang hoạt động, không phải OS push nền. Hồ sơ cho sửa tên và đăng xuất.

Phiên chỉ giữ RAM, đóng app phải đăng nhập lại; không lưu token trong preferences. Camera chỉ mở URL được cấp khi đang thuê, chưa nghiệm thu live camera. Giới hạn danh sách hiện tại xem `docs/API.md`.
