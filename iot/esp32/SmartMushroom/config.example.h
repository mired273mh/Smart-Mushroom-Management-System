#pragma once
// Copy to config.local.h (ignored by Git), then set the actual values.
#define SM_WIFI_SSID "REPLACE_WIFI_SSID"
#define SM_WIFI_PASSWORD "REPLACE_WIFI_PASSWORD"
#define SM_API_BASE_URL "https://api.example.invalid"
#define SM_DEVICE_TOKEN "REPLACE_WITH_DEVICE_TOKEN"
#define SM_ROOT_CA ""
// 1 = generated samples/dry-run; 0 = SCD4x readings (outputs separately gated).
#ifndef SM_SIMULATION
#define SM_SIMULATION 1
#endif
// Development LAN HTTP only when explicitly enabled; production must use TLS.
#define SM_ALLOW_LOCAL_HTTP 0
#define SM_SDA_PIN 21
#define SM_SCL_PIN 22
// Must stay 0 until BOM/wiring/limits are accepted; simulator never writes GPIO.
#ifndef SM_ENABLE_HARDWARE_OUTPUTS
#define SM_ENABLE_HARDWARE_OUTPUTS 0
#endif
#define SM_MIST_PIN 26
#define SM_FAN_PIN 27
#define SM_LIGHT_PIN 32
#define SM_HEATER_PIN 33
