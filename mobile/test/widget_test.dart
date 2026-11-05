import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:smart_mushroom_customer/api.dart';
import 'package:smart_mushroom_customer/main.dart';

void main() {
  testWidgets('empty login is validated without network traffic', (
    tester,
  ) async {
    var calls = 0;
    final api = MushroomApi(
      client: MockClient((_) async {
        calls++;
        return http.Response('', 500);
      }),
    );
    await tester.pumpWidget(MushroomApp(api: api));
    await tester.tap(find.widgetWithText(FilledButton, 'Đăng nhập'));
    await tester.pumpAndSettle();
    expect(find.text('Email không hợp lệ.'), findsOneWidget);
    expect(calls, 0);
    await tester.pumpWidget(const SizedBox());
    api.dispose();
  });
  testWidgets('customer login shows own rentals and logout returns to login', (
    tester,
  ) async {
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
                  'email': 'customer@example.invalid',
                },
              },
            }),
            200,
          );
        }
        if (req.url.path.endsWith('/logout')) return http.Response('', 204);
        return http.Response(
          jsonEncode({
            'data': [],
            'pagination': {'has_more': false, 'next_cursor': null},
          }),
          200,
        );
      }),
    );
    await tester.pumpWidget(MushroomApp(api: api));
    await tester.enterText(
      find.byType(TextFormField).at(0),
      'customer@example.invalid',
    );
    await tester.enterText(find.byType(TextFormField).at(1), 'TestPassword123');
    await tester.tap(find.widgetWithText(FilledButton, 'Đăng nhập'));
    await tester.pumpAndSettle();
    expect(find.textContaining('Bạn chưa có hợp đồng.'), findsOneWidget);
    await tester.tap(find.text('Hồ sơ'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Đăng xuất'));
    await tester.pumpAndSettle();
    expect(find.text('Chào bạn trở lại'), findsOneWidget);
    await tester.pumpWidget(const SizedBox());
    api.dispose();
  });
}
