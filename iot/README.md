# IoT Smart Mushroom

Hai chương trình trong repo: `simulator.mjs` chạy trên máy phát triển và `esp32/SmartMushroom/SmartMushroom.ino` cho ESP32. Mặc định **dry-run/GPIO khóa**; đã có source output active-HIGH có giới hạn và kiểm tra an toàn, chưa flash/test cảm biến/relay/camera thật. Xem [BOM, sơ đồ và quy trình xác nhận](../docs/PHUONG_AN_PHAN_CUNG_IOT.md) trước triển khai vật lý.

## Chạy simulator HTTP

1. Đăng nhập Admin trên Web, tạo phòng; thêm thiết bị mode **Mô phỏng** tại Môi trường & IoT. Token chỉ hiện lúc cấp, lưu riêng.
2. Nếu cần test tự động, bật “Đổi tự động” cho device; đây chỉ là automation dry-run.
3. Trong terminal có Node, đặt `API_URL=http://localhost:3000`, `DEVICE_TOKEN` từ bước 1, `SAMPLE_COUNT=5`; chạy `node iot/simulator.mjs` từ root. Không đưa token vào URL hoặc commit.
4. Web chọn phòng giám sát; Customer đang thuê khay trong phòng sẽ xem được dữ liệu và nhận cảnh báo nếu vượt ngưỡng. Simulator tự poll/ack lệnh dry-run.

Script kiểm tra `/api/iot/me` và từ chối token hardware. Telemetry không được tự khai báo `simulated`; server gán theo provisioning. Bảo vệ token hardware vẫn là trách nhiệm vận hành; server không thể tự chứng minh mẫu là từ cảm biến vật lý.

## Build firmware

Đã chọn để phát triển: Arduino ESP32 core 3.3.3, board `esp32:esp32:esp32`; ArduinoJson 7.x, Sensirion I2C SCD4x 1.1.0, Sensirion Core. Cần chốt BOM thực tế trước lắp ráp.

```powershell
arduino-cli core update-index --additional-urls https://espressif.github.io/arduino-esp32/package_esp32_index.json
arduino-cli core install esp32:esp32@3.3.3
arduino-cli lib install ArduinoJson "Sensirion I2C SCD4x@1.1.0"
arduino-cli compile --fqbn esp32:esp32:esp32 iot/esp32/SmartMushroom
# Với bộ tool portable trên máy hiện tại, compile 3 profile (không upload):
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/compile-iot.ps1
```

Copy `config.example.h` thành `config.local.h` (gitignore), nhập Wi-Fi/token/URL và root CA PEM của server HTTPS. Mặc định nhánh mô phỏng dùng token simulator; nhánh `SM_SIMULATION=0` dùng token hardware. Cấu hình mặc định có placeholder nên compile được nhưng không tự kết nối/vận hành.

Firmware gửi mỗi 15 giây, poll lệnh mỗi 5 giây; không gửi mẫu cũ khi mất mạng, không gửi NaN/phép đo lỗi, kết nối có timeout, vòng reconnect không chờ vô hạn. TLS cần CA và thời gian NTP; không tắt xác minh certificate. HTTP chỉ dành LAN riêng, phải bật `SM_ALLOW_LOCAL_HTTP=1`, hiện giới hạn IP 192.168.*, 10.* hoặc 172.16.*.

## Phương án đấu cảm biến đề xuất, chưa xác nhận phần cứng

| Module SCD4x breakout tương thích 3.3V | ESP32 DevKit |
|---|---|
| VDD (theo datasheet module thực tế) | Nguồn phù hợp module; không suy đoán dùng 5V |
| GND | GND |
| SDA | GPIO21 |
| SCL | GPIO22 |

Driver dùng I²C 0x62, start periodic, kiểm tra ready rồi đọc CO₂/nhiệt/ẩm. Phải kiểm tra mức điện áp, pull-up, nguồn, offset nhiệt/độ ẩm, thời gian ổn định và hiệu chuẩn theo module thực tế. [Driver của nhà sản xuất](https://github.com/Sensirion/arduino-i2c-scd4x).

## Checklist nghiệm thu phần cứng còn lại

- Xác nhận ESP32/module cảm biến, chân và nguồn bằng sơ đồ điện; đọc mẫu đối chiếu thiết bị tham chiếu, log Serial/API và nhãn hardware.
- Chạy simulator/dry-run trước; kiểm tra mất Wi-Fi, API lỗi, token hết hiệu lực, sensor lỗi, lệch giờ/certificate.
- Chỉ sau khi người dùng xác nhận BOM/đấu dây/giới hạn: cho phép flash profile `SM_SIMULATION=0`, `SM_ENABLE_HARDWARE_OUTPUTS=1` và cấu hình UUID hardware vào `HARDWARE_ACTUATION_ALLOWLIST` của server. Mặc định cả hai cổng khóa vẫn tắt. Driver đề xuất active-HIGH GPIO26/27/32/33; tối đa10s/pulse, task timer riêng, stale network/sensor OFF, fan ưu tiên heater. Không áp dụng cho relay active-LOW hoặc tải khác chưa đánh giá; chi tiết và giới hạn trong phương án phần cứng.
- Camera cần IP camera/gateway HTTPS có kiểm soát truy cập riêng; URL contract không tự cung cấp video và không bảo vệ camera công khai.

Không có lệnh upload trong quy trình đã chạy. Không coi compile PASS là ESP32/cảm biến/relay PASS.

HTTP dev chỉ nhận URL dạng `http://<IPv4 RFC1918>[:port]` không kèm đường dẫn; parser từ chối hostname, userinfo, octet/port sai và octet leading-zero. `url_policy.h` có17 static assertions được compiler xác minh ở cả2 mode. Mặc định vẫn yêu cầu HTTPS; compile không xác minh kết nối LAN/TLS trên board thật.
