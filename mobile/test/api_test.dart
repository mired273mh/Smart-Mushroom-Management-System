import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:smart_mushroom_customer/api.dart';

void main() {
  test('customer session sends bearer and is cleared on 401', () async {
    final api = MushroomApi(
      baseUrl: 'https://api.example.invalid',
      client: MockClient((req) async {
        if (req.url.path.endsWith('/login')) {
          return http.Response(
            jsonEncode({
              'data': {
                'token': 'test-token',
                'user': {
                  'id': 'customer-1',
                  'role': 'customer',
                  'name': 'Customer',
                },
              },
            }),
            200,
          );
        }
        expect(req.headers['Authorization'], 'Bearer test-token');
        expect(req.url.path, '/api/rentals');
        return http.Response(
          jsonEncode({
            'error': {'message': 'Session expired'},
          }),
          401,
        );
      }),
    );
    await api.login('customer@example.invalid', 'TestPassword123');
    expect(api.user?['id'], 'customer-1');
    await expectLater(api.request('/rentals'), throwsA(isA<ApiException>()));
    expect(api.user, isNull);
    api.dispose();
  });
  test('staff login is rejected and its session is revoked', () async {
    var loggedOut = false;
    final api = MushroomApi(
      baseUrl: 'https://api.example.invalid',
      client: MockClient((req) async {
        if (req.url.path.endsWith('/login')) {
          return http.Response(
            jsonEncode({
              'data': {
                'token': 'staff-token',
                'user': {'id': 'admin-1', 'role': 'admin'},
              },
            }),
            200,
          );
        }
        expect(req.url.path, '/api/auth/logout');
        loggedOut = true;
        return http.Response('', 204);
      }),
    );
    await expectLater(
      api.login('staff@example.invalid', 'TestPassword123'),
      throwsA(isA<ApiException>()),
    );
    expect(loggedOut, isTrue);
    expect(api.user, isNull);
    api.dispose();
  });
  test('non-JSON network response becomes a readable error', () async {
    final api = MushroomApi(
      baseUrl: 'https://api.example.invalid',
      client: MockClient(
        (_) async => http.Response('<html>gateway failure</html>', 502),
      ),
    );
    await expectLater(api.request('/catalog'), throwsA(isA<ApiException>()));
    api.dispose();
  });
}
