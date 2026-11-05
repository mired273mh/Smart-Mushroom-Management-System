import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:smart_mushroom_customer/api.dart';

void main() {
  test(
    'Customer Dart client → Express → PostgreSQL, rental and room telemetry',
    () async {
      final env = Platform.environment;
      final base = env['API_TEST_URL'];
      if (base == null) {
        throw StateError(
          'Run npm run test:mobile:api from the repository root. Real test database is required.',
        );
      }
      final api = MushroomApi(baseUrl: base);
      try {
        await api.login(env['API_TEST_EMAIL']!, env['API_TEST_PASSWORD']!);
        final catalog = await api.request('/catalog') as Json;
        expect(
          rows(catalog['trays']).any((t) => t['id'] == env['API_TEST_TRAY_ID']),
          isTrue,
        );
        final rental = await api.request(
          '/rentals',
          method: 'POST',
          body: {
            'plan_id': env['API_TEST_PLAN_ID'],
            'tray_ids': [env['API_TEST_TRAY_ID']],
          },
        ) as Json;
        final itemId = rows(rental['items']).single['id'];
        final linked = await api.request(
          '/trays/link',
          method: 'POST',
          body: {'code': env['API_TEST_TRAY_CODE']},
        ) as Json;
        expect(linked['id'], itemId);
        final firstPage = await api.rentalsPage(limit: 1);
        expect(firstPage.rentals.single['id'], rental['id']);
        expect(firstPage.hasMore, isTrue);
        final nextPage = await api.rentalsPage(
          limit: 5,
          cursor: firstPage.nextCursor,
        );
        expect(
          nextPage.rentals.every(
            (entry) => entry['customer_id'] == api.user?['id'],
          ),
          isTrue,
        );
        expect(
          nextPage.rentals.any((entry) => entry['id'] == rental['id']),
          isFalse,
        );
        final completed = await api.rentalsPage(
          status: 'completed',
          limit: 200,
        );
        expect(completed.rentals.length, 12);
        expect(completed.hasMore, isFalse);
        final reading = await http.post(
          Uri.parse('$base/api/iot/readings'),
          headers: {
            'Authorization': 'Bearer ${env['API_TEST_DEVICE_TOKEN']}',
            'Content-Type': 'application/json',
          },
          body: jsonEncode({'temperature': 32, 'humidity': 65, 'co2': 1800}),
        );
        expect(reading.statusCode, 201);
        final environment = await api.request(
          '/rooms/${env['API_TEST_ROOM_ID']}/environment',
        ) as Json;
        expect(environment['measurement_scope'], 'room');
        expect(rows(environment['readings']).single['simulated'], isTrue);
        final item = await api.request('/rental-items/$itemId') as Json;
        expect(item['code'], env['API_TEST_TRAY_CODE']);
        await api.updateName('Khách kiểm thử Flutter thật');
        expect(api.user?['name'], 'Khách kiểm thử Flutter thật');
        final notes = rows(await api.request('/notifications'));
        expect(notes.any((n) => n['kind'] == 'environment'), isTrue);
        await api.logout();
        expect(api.user, isNull);
      } finally {
        api.dispose();
      }
    },
  );
}
