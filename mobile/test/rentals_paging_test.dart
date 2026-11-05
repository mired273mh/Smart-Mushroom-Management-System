import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:smart_mushroom_customer/api.dart';
import 'package:smart_mushroom_customer/screens.dart';

void main() {
  testWidgets(
    'rentals next/previous, status reset and retry keep cursor scope',
    (tester) async {
      final requests = <Uri>[];
      var failOnce = false;
      final api = MushroomApi(
        baseUrl: 'https://api.example.invalid',
        client: MockClient((request) async {
          requests.add(request.url);
          if (failOnce) {
            failOnce = false;
            return http.Response(
              jsonEncode({
                'error': {'message': 'Temporary failure'},
              }),
              503,
            );
          }
          final query = request.url.queryParameters;
          final second = query['cursor'] != null;
          return http.Response(
            jsonEncode({
              'data': [
                {
                  'id': second ? 'second' : 'first',
                  'status': query['status'] ?? 'active',
                  'tray_count': second ? 2 : 1,
                  'duration_days': 30,
                  'price_per_tray_vnd': 100000,
                  'starts_at': '2026-01-01T00:00:00Z',
                },
              ],
              'pagination': {
                'has_more': !second,
                'next_cursor': second ? null : 'opaque-cursor',
              },
            }),
            200,
          );
        }),
      );
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: RentalsScreen(api: api)),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.text('1 khay · 30 ngày'), findsOneWidget);
      await tester.tap(find.text('Trang sau'));
      await tester.pumpAndSettle();
      expect(requests.last.queryParameters['cursor'], 'opaque-cursor');
      expect(find.text('2 khay · 30 ngày'), findsOneWidget);
      expect(
        tester
            .widget<TextButton>(find.widgetWithText(TextButton, 'Trang sau'))
            .onPressed,
        isNull,
      );
      await tester.tap(find.text('Trang trước'));
      await tester.pumpAndSettle();
      expect(requests.last.queryParameters.containsKey('cursor'), isFalse);
      await tester.tap(find.byType(DropdownButtonFormField<String>));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Hoàn tất').last);
      await tester.pumpAndSettle();
      expect(requests.last.queryParameters['status'], 'completed');
      expect(requests.last.queryParameters.containsKey('cursor'), isFalse);
      failOnce = true;
      await tester.tap(find.text('Trang sau'));
      await tester.pumpAndSettle();
      expect(find.text('Temporary failure'), findsOneWidget);
      await tester.tap(find.text('Thử lại'));
      await tester.pumpAndSettle();
      expect(requests.last.queryParameters['cursor'], 'opaque-cursor');
      expect(requests.last.queryParameters['status'], 'completed');
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox());
      api.dispose();
    },
  );
}
