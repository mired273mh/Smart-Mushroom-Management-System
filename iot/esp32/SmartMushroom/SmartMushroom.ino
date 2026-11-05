#include <Arduino.h>
#include <WiFi.h>
#include <NetworkClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <time.h>
#include <math.h>
#include "url_policy.h"
#if __has_include("config.local.h")
#include "config.local.h"
#else
#include "config.example.h"
#endif
#if !SM_SIMULATION
#include <Wire.h>
#include <SensirionI2cScd4x.h>
SensirionI2cScd4x scd4x;
bool sensorReady = false;
#endif

// No relay pins or GPIO writes: hardware actuation awaits acceptance.
static bool identityVerified = false;
static bool timeConfigured = false;
static uint32_t lastReconnect = 0;
static uint32_t lastSample = 0;
static uint32_t lastPoll = 0;
static uint32_t sampleIndex = 0;
static const uint32_t SAMPLE_MS = 15000;
static const uint32_t POLL_MS = 5000;

int apiCall(const String &path, const char *method, const String &payload, String &response) {
  NetworkClient plain;
  NetworkClientSecure secure;
  HTTPClient http;
  String base = SM_API_BASE_URL;
  if (WiFi.status() != WL_CONNECTED) return -1;
  if (base.startsWith("https://")) {
    if (strlen(SM_ROOT_CA) == 0 || time(nullptr) < 1700000000) {
      Serial.println("TLS blocked: configure root CA and wait for NTP time.");
      return -1;
    }
    secure.setCACert(SM_ROOT_CA);
    secure.setHandshakeTimeout(5);
    if (!http.begin(secure, base + path)) return -1;
  } else {
#if SM_ALLOW_LOCAL_HTTP
    // Restrict plaintext development traffic to private IPv4 addresses.
    if (!isPrivateHttpBase(base.c_str())) return -1;
    if (!http.begin(plain, base + path)) return -1;
#else
    Serial.println("Non-HTTPS URL refused.");
    return -1;
#endif
  }
  http.setConnectTimeout(5000);
  http.setTimeout(5000);
  http.setFollowRedirects(HTTPC_DISABLE_FOLLOW_REDIRECTS);
  http.addHeader("Authorization", String("Bearer ") + SM_DEVICE_TOKEN);
  http.addHeader("Content-Type", "application/json");
  int status = http.sendRequest(method, payload);
  if (status > 0) {
    if (http.getSize() > 16384) { http.end(); return -1; }
    response = http.getString();
    if (response.length() > 16384) { http.end(); return -1; }
  }
  http.end();
  if (status == 401) identityVerified = false;
  return status;
}

bool verifyIdentity() {
  String response;
  if (apiCall("/api/iot/me", "GET", "", response) != 200) return false;
  JsonDocument document;
  if (deserializeJson(document, response)) return false;
  const char *mode = document["data"]["mode"] | "";
  const char *expected = SM_SIMULATION ? "simulator" : "hardware";
  if (strcmp(mode, expected) != 0) {
    Serial.println("Device mode mismatch; refusing to send misleading samples.");
    return false;
  }
  Serial.println(SM_SIMULATION ? "SIMULATION identity verified." : "HARDWARE sensing identity verified; relays disabled.");
  return true;
}

bool collectSample(float &temperature, float &humidity, uint16_t &co2) {
#if SM_SIMULATION
  temperature = 24.0f + sinf(sampleIndex * 0.25f);
  humidity = (sampleIndex % 2) ? 65.0f : 85.0f;
  co2 = (sampleIndex % 2) ? 1800 : 800;
  sampleIndex++;
#else
  if (!sensorReady) return false;
  bool ready = false;
  if (scd4x.getDataReadyStatus(ready) != 0 || !ready) return false;
  if (scd4x.readMeasurement(co2, temperature, humidity) != 0 || co2 == 0) return false;
#endif
  return isfinite(temperature) && isfinite(humidity) && temperature >= -40 && temperature <= 85 && humidity >= 0 && humidity <= 100 && co2 > 0 && co2 <= 40000;
}

void sendSample() {
  float temperature, humidity;
  uint16_t co2;
  if (!collectSample(temperature, humidity, co2)) { Serial.println("No valid fresh sensor sample; nothing sent."); return; }
  JsonDocument document;
  document["temperature"] = temperature;
  document["humidity"] = humidity;
  document["co2"] = co2;
  String payload, response;
  serializeJson(document, payload);
  int status = apiCall("/api/iot/readings", "POST", payload, response);
  Serial.printf("%s telemetry HTTP=%d\n", SM_SIMULATION ? "SIMULATION" : "SCD4x", status);
  // Offline samples are not queued as fresh measurements when connectivity returns.
}

void pollCommands() {
  String response;
  if (apiCall("/api/iot/commands", "GET", "", response) != 200) return;
  JsonDocument document;
  if (deserializeJson(document, response)) return;
  for (JsonObject command : document["data"].as<JsonArray>()) {
    const char *id = command["id"] | "";
    if (strlen(id) != 36) continue;
    if (!SM_SIMULATION || command["dry_run"] != true) {
      Serial.println("Command refused: hardware actuation has not been accepted.");
      continue;
    }
    Serial.printf("DRY-RUN actuator=%s enabled=%d (no GPIO)\n", command["actuator"].as<const char *>(), command["enabled"].as<bool>());
    JsonDocument ack;
    ack["success"] = true;
    ack["result"] = "ESP32 simulation; no GPIO outputs.";
    String payload, ignored;
    serializeJson(ack, payload);
    apiCall(String("/api/iot/commands/") + id + "/ack", "POST", payload, ignored);
  }
}

void setup() {
  Serial.begin(115200);
  Serial.println("Smart Mushroom: relay outputs disabled.");
  WiFi.mode(WIFI_STA);
  WiFi.begin(SM_WIFI_SSID, SM_WIFI_PASSWORD);
#if !SM_SIMULATION
  Wire.begin(SM_SDA_PIN, SM_SCL_PIN);
  scd4x.begin(Wire, 0x62);
  scd4x.stopPeriodicMeasurement();
  delay(500);
  sensorReady = scd4x.startPeriodicMeasurement() == 0;
  Serial.println(sensorReady ? "SCD4x periodic measurement initialized." : "SCD4x initialization failed.");
#endif
}

void loop() {
  uint32_t nowMs = millis();
  if (WiFi.status() != WL_CONNECTED) {
    identityVerified = false;
    if ((uint32_t)(nowMs-lastReconnect) >= 5000) { lastReconnect = nowMs; WiFi.reconnect(); }
    delay(10);
    return;
  }
  if (!timeConfigured) { configTime(0, 0, "pool.ntp.org", "time.nist.gov"); timeConfigured = true; }
  if (!identityVerified) {
    if ((uint32_t)(nowMs-lastPoll) >= POLL_MS) { lastPoll = nowMs; identityVerified = verifyIdentity(); }
    delay(10);
    return;
  }
  if ((uint32_t)(nowMs-lastSample) >= SAMPLE_MS) { lastSample = nowMs; sendSample(); }
  if ((uint32_t)(nowMs-lastPoll) >= POLL_MS) { lastPoll = nowMs; pollCommands(); }
  delay(10);
}
