import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:smart_mushroom_customer/api.dart';
import 'package:smart_mushroom_customer/screens.dart';

http.Response loginResponse(int index) => http.Response(
  jsonEncode({
    'data': {
      'token': 'token-$index',
      'user': {'id': 'user-$index', 'role': 'customer', 'name': 'User $index'},
    },
  }),
  200,
);

void main() {
  test('HTML 401 still expires the current session', () async {
    final api = MushroomApi(
      baseUrl: 'https://api.example.invalid',
      client: MockClient(
        (request) async => request.url.path.endsWith('/login')
            ? loginResponse(1)
            : http.Response('<html>Unauthorized</html>', 401),
      ),
    );
    await api.login('user@test.invalid', 'TestPassword_123');
    await expectLater(
      api.request('/notifications'),
      throwsA(isA<ApiException>()),
    );
    expect(api.user, isNull);
    api.dispose();
  });
  test('late logout cannot clear a replacement session', () async {
    final pendingLogout = Completer<http.Response>();
    var logins = 0;
    final api = MushroomApi(
      baseUrl: 'https://api.example.invalid',
      client: MockClient((request) async {
        if (request.url.path.endsWith('/login')) return loginResponse(++logins);
        if (request.url.path.endsWith('/logout')) return pendingLogout.future;
        return http.Response('{"error":{"message":"Expired"}}', 401);
      }),
    );
    await api.login('old@test.invalid', 'TestPassword_123');
    final loggingOut = api.logout();
    await expectLater(
      api.request('/notifications'),
      throwsA(isA<ApiException>()),
    );
    await api.login('new@test.invalid', 'TestPassword_123');
    pendingLogout.complete(http.Response('', 204));
    await loggingOut;
    expect(api.user?['id'], 'user-2');
    api.dispose();
  });
  test(
    'late 401 from an old session does not log out the new customer',
    () async {
      final oldResponse = Completer<http.Response>();
      var logins = 0;
      final api = MushroomApi(
        baseUrl: 'https://api.example.invalid',
        client: MockClient((request) async {
          if (request.url.path.endsWith('/login')) {
            return loginResponse(++logins);
          }
          if (request.url.path.endsWith('/logout')) {
            return http.Response('', 204);
          }
          return oldResponse.future;
        }),
      );
      await api.login('old@test.invalid', 'TestPassword_123');
      final failed = expectLater(
        api.request('/notifications'),
        throwsA(isA<ApiException>()),
      );
      await api.logout();
      await api.login('new@test.invalid', 'TestPassword_123');
      oldResponse.complete(
        http.Response(
          jsonEncode({
            'error': {'message': 'Old session expired'},
          }),
          401,
        ),
      );
      await failed;
      expect(api.user?['id'], 'user-2');
      api.dispose();
    },
  );
  test(
    'late profile response cannot restore data from the logged-out user',
    () async {
      final oldProfile = Completer<http.Response>();
      var logins = 0;
      final api = MushroomApi(
        baseUrl: 'https://api.example.invalid',
        client: MockClient((request) async {
          if (request.url.path.endsWith('/login')) {
            return loginResponse(++logins);
          }
          if (request.url.path.endsWith('/logout')) {
            return http.Response('', 204);
          }
          return oldProfile.future;
        }),
      );
      await api.login('old@test.invalid', 'TestPassword_123');
      final updating = api.updateName('Old edited name');
      await api.logout();
      await api.login('new@test.invalid', 'TestPassword_123');
      oldProfile.complete(
        http.Response(
          jsonEncode({
            'data': {
              'id': 'user-1',
              'role': 'customer',
              'name': 'Old edited name',
            },
          }),
          200,
        ),
      );
      await updating;
      expect(api.user?['id'], 'user-2');
      api.dispose();
    },
  );
  testWidgets(
    'catalog refresh removes selections that are no longer available',
    (tester) async {
      var refreshed = false;
      final api = MushroomApi(
        baseUrl: 'https://api.example.invalid',
        client: MockClient(
          (request) async => http.Response(
            jsonEncode({
              'data': {
                'plans': [
                  {
                    'id': refreshed ? 'plan-2' : 'plan-1',
                    'name': refreshed ? 'New Plan' : 'Old Plan',
                    'duration_days': 30,
                    'price_vnd': 100000,
                  },
                ],
                'trays': [
                  {
                    'id': refreshed ? 'tray-2' : 'tray-1',
                    'code': refreshed ? 'NEW-TRAY' : 'OLD-TRAY',
                    'label': 'Tray',
                    'room_name': 'Room',
                  },
                ],
              },
            }),
            200,
          ),
        ),
      );
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: CatalogScreen(api: api)),
        ),
      );
      await tester.pumpAndSettle();
      await tester.tap(find.byType(DropdownButtonFormField<String>));
      await tester.pumpAndSettle();
      await tester.tap(find.textContaining('Old Plan').last);
      await tester.pumpAndSettle();
      await tester.tap(find.byType(CheckboxListTile));
      await tester.pumpAndSettle();
      expect(
        tester
            .widget<FilledButton>(
              find.widgetWithText(FilledButton, 'Xác nhận thuê 1 khay'),
            )
            .onPressed,
        isNotNull,
      );
      refreshed = true;
      await tester.drag(find.byType(ListView), const Offset(0, 350));
      await tester.pumpAndSettle();
      expect(find.text('NEW-TRAY'), findsOneWidget);
      expect(find.text('Xác nhận thuê 0 khay'), findsOneWidget);
      expect(
        tester
            .widget<FilledButton>(
              find.widgetWithText(FilledButton, 'Xác nhận thuê 0 khay'),
            )
            .onPressed,
        isNull,
      );
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox());
      api.dispose();
    },
  );
}
