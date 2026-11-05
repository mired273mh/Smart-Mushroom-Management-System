import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:integration_test/integration_test.dart';
import 'package:smart_mushroom_customer/api.dart';
import 'package:smart_mushroom_customer/main.dart';

// Values are generated ONLY for a fresh sm_test_* database by the Node runner.
const base = String.fromEnvironment('ANDROID_TEST_URL');
const email = String.fromEnvironment('ANDROID_TEST_EMAIL');
const password = String.fromEnvironment('ANDROID_TEST_PASSWORD');
const adminEmail = String.fromEnvironment('ANDROID_TEST_ADMIN_EMAIL');
const trayCode = 'ANDROID-UI-001';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  testWidgets('Android Customer UI → Express → PostgreSQL full rental flow', (
    tester,
  ) async {
    expect(base, startsWith('http://10.0.2.2:'));
    final api = MushroomApi(baseUrl: base);
    final client = http.Client();
    Future<Json> request(
      String path, {
      String method = 'GET',
      Json? body,
      String? token,
      int status = 200,
    }) async {
      final req = http.Request(method, Uri.parse('$base/api$path'));
      req.headers['Content-Type'] = 'application/json';
      if (token != null) req.headers['Authorization'] = 'Bearer $token';
      if (body != null) req.body = jsonEncode(body);
      final response = await http.Response.fromStream(await client.send(req));
      expect(response.statusCode, status, reason: '$method $path');
      return response.statusCode == 204
          ? {}
          : jsonDecode(utf8.decode(response.bodyBytes)) as Json;
    }

    Future<void> waitFor(Finder finder) async {
      final until = DateTime.now().add(const Duration(seconds: 35));
      while (finder.evaluate().isEmpty && DateTime.now().isBefore(until)) {
        await tester.pump(const Duration(milliseconds: 100));
        await Future<void>.delayed(const Duration(milliseconds: 100));
      }
      expect(finder, findsWidgets);
    }

    Future<void> tap(Finder finder) async {
      await waitFor(finder);
      await tester.ensureVisible(finder.last);
      await tester.tap(finder.last);
      await tester.pumpAndSettle();
    }

    try {
      final admin =
          (await request(
                '/auth/login',
                method: 'POST',
                body: {'email': adminEmail, 'password': password},
              ))['data']
              as Json;
      final staffToken = admin['token'] as String;
      await tester.pumpWidget(MushroomApp(api: api));
      await tap(find.text('Chưa có tài khoản? Đăng ký'));
      await tester.enterText(find.byType(TextFormField).at(0), 'Khách Android');
      await tester.enterText(find.byType(TextFormField).at(1), email);
      await tester.enterText(find.byType(TextFormField).at(2), password);
      await tap(find.text('Đăng ký & đăng nhập'));
      await waitFor(find.text('Hợp đồng hiện tại và lịch sử thuê của bạn.'));
      await tap(find.text('Thuê khay'));
      await waitFor(find.text(trayCode));
      await tap(find.byType(DropdownButtonFormField<String>));
      await tap(find.textContaining('Gói Android'));
      for (final code in [trayCode, 'ANDROID-UI-002']) {
        await tap(find.widgetWithText(CheckboxListTile, code));
      }
      await tap(find.text('Xác nhận thuê 2 khay'));
      await waitFor(find.text('Chi tiết hợp đồng'));
      final rental = (await api.rentalsPage()).rentals.single;
      final detail = await api.request('/rentals/${rental['id']}') as Json;
      expect(rows(detail['items']), hasLength(2));
      final item = rows(detail['items'])
          .firstWhere((i) => i['code'] == trayCode);
      final devices = rows(
        (await request('/devices', token: staffToken))['data'],
      );
      // Token is rotated for a simulator fixture, never a physical device.
      final rotated =
          (await request(
                '/devices/${devices.single['id']}/rotate-token',
                method: 'POST',
                token: staffToken,
              ))['data']
              as Json;
      await request(
        '/iot/readings',
        method: 'POST',
        token: rotated['token'] as String,
        body: {'temperature': 24, 'humidity': 82, 'co2': 850},
        status: 201,
      );
      await tap(find.text(trayCode));
      await waitFor(find.textContaining('850 ppm'));
      expect(find.textContaining('MÔ PHỎNG'), findsWidgets);
      await waitFor(find.text('Chưa có kênh camera cho phòng này.'));
      await tester.pageBack();
      await tester.pumpAndSettle();
      await tester.pageBack();
      await tester.pumpAndSettle();
      await tap(find.byTooltip('Liên kết mã khay'));
      await tester.enterText(find.byType(TextField).last, trayCode);
      await tap(find.text('Xác nhận'));
      await waitFor(find.text('Theo dõi khay'));
      await tester.pageBack();
      await tester.pumpAndSettle();
      for (final stage in ['fruiting', 'ready']) {
        await request(
          '/rental-items/${item['id']}/progress',
          method: 'POST',
          token: staffToken,
          body: {'stage': stage, 'note': 'Android integration fixture'},
          status: 201,
        );
      }
      final harvest =
          (await request(
                '/rental-items/${item['id']}/harvests',
                method: 'POST',
                token: staffToken,
                body: {'weight_grams': 1250},
                status: 201,
              ))['data']
              as Json;
      await tap(find.text('Nhận nấm'));
      await waitFor(find.text('Yêu cầu nhận / giao'));
      await tap(find.text('Yêu cầu nhận / giao'));
      await tap(find.byType(DropdownButtonFormField<String>));
      await tap(find.text('Giao hàng').last);
      await tester.enterText(
        find.byType(TextField).last,
        'Địa chỉ thử nghiệm Android',
      );
      await tap(find.text('Gửi yêu cầu'));
      final requests = rows(await api.request('/fulfillment-requests'));
      expect(requests.single['harvest_id'], harvest['id']);
      expect(requests.single['method'], 'delivery');
      for (final status in ['processing', 'completed']) {
        await request(
          '/fulfillment-requests/${requests.single['id']}',
          method: 'PATCH',
          token: staffToken,
          body: {'status': status},
        );
      }
      await request(
        '/transactions/${rows(detail['transactions']).single['id']}/confirm',
        method: 'POST',
        token: staffToken,
      );
      await request(
        '/rentals/${rental['id']}/complete',
        method: 'POST',
        token: staffToken,
      );
      await tap(find.text('Thông báo'));
      await waitFor(find.textContaining('thu hoạch'));
      await tap(find.text('Hồ sơ'));
      await waitFor(find.text(email));
      await tap(find.text('Đăng xuất'));
      await waitFor(find.text('Chào bạn trở lại'));
      expect(api.user, isNull);
      expect(tester.takeException(), isNull);
    } finally {
      await tester.pumpWidget(const SizedBox.shrink());
      client.close();
      api.dispose();
    }
  });
}
