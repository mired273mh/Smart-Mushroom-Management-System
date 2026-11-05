import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:smart_mushroom_customer/api.dart';
import 'package:smart_mushroom_customer/screens.dart';

Json plan(String id, String name) => {
  'id': id,
  'name': name,
  'duration_days': 30,
  'price_vnd': 100000,
};
Json tray(String id, String code) => {
  'id': id,
  'code': code,
  'label': 'Tray',
  'room_name': 'Room',
};
http.Response page({List<Json>? plans, List<Json>? trays, bool more = false}) =>
    http.Response(
      jsonEncode({
        'data': {
          'plans': plans ?? [plan('p1', 'First Plan')],
          'trays': trays ?? [tray('t1', 'T-ONE')],
          'pagination': {
            'plans': {'has_more': more, 'next_cursor': more ? 'p2' : null},
            'trays': {'has_more': more, 'next_cursor': more ? 't2' : null},
          },
        },
      }),
      200,
    );

Future<void> mount(
  WidgetTester tester,
  Future<http.Response> Function(http.Request) handler,
) async {
  tester.view.physicalSize = const Size(1000, 1600);
  tester.view.devicePixelRatio = 1;
  addTearDown(() {
    tester.view.resetPhysicalSize();
    tester.view.resetDevicePixelRatio();
  });
  final api = MushroomApi(
    baseUrl: 'https://api.example.invalid',
    client: MockClient(handler),
  );
  addTearDown(api.dispose);
  await tester.pumpWidget(
    MaterialApp(
      home: Scaffold(body: CatalogScreen(api: api)),
    ),
  );
  await tester.pumpAndSettle();
}

void main() {
  testWidgets(
    'load more retains cross-page tray selections and independently adds plans',
    (tester) async {
      final queries = <Map<String, String>>[];
      await mount(tester, (request) async {
        queries.add(request.url.queryParameters);
        if (request.url.queryParameters.containsKey('tray_cursor')) {
          return page(trays: [tray('t1', 'T-ONE'), tray('t2', 'T-TWO')]);
        }
        if (request.url.queryParameters.containsKey('plan_cursor')) {
          return page(plans: [plan('p2', 'Second Plan')]);
        }
        return page(more: true);
      });
      await tester.tap(find.byType(DropdownButtonFormField<String>));
      await tester.pumpAndSettle();
      await tester.tap(find.textContaining('First Plan').last);
      await tester.pumpAndSettle();
      await tester.tap(find.widgetWithText(CheckboxListTile, 'T-ONE'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Xem thêm khay'));
      await tester.pumpAndSettle();
      expect(find.byType(CheckboxListTile), findsNWidgets(2));
      expect(
        tester
            .widget<CheckboxListTile>(
              find.widgetWithText(CheckboxListTile, 'T-ONE'),
            )
            .value,
        true,
      );
      await tester.tap(find.widgetWithText(CheckboxListTile, 'T-TWO'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Xem thêm gói thuê'));
      await tester.pumpAndSettle();
      expect(
        tester
            .widget<FilledButton>(
              find.widgetWithText(FilledButton, 'Xác nhận thuê 2 khay'),
            )
            .onPressed,
        isNotNull,
      );
      expect(queries.any((q) => q['tray_cursor'] == 't2'), true);
      expect(queries.any((q) => q['plan_cursor'] == 'p2'), true);
      expect(tester.takeException(), isNull);
    },
  );
  testWidgets('failed next page keeps existing stock and selection for retry', (
    tester,
  ) async {
    await mount(
      tester,
      (request) async => request.url.queryParameters.containsKey('tray_cursor')
          ? http.Response(
              jsonEncode({
                'error': {'message': 'Next page fixture unavailable'},
              }),
              503,
            )
          : page(more: true),
    );
    await tester.tap(find.widgetWithText(CheckboxListTile, 'T-ONE'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Xem thêm khay'));
    await tester.pumpAndSettle();
    expect(find.text('Next page fixture unavailable'), findsOneWidget);
    expect(
      tester
          .widget<CheckboxListTile>(
            find.widgetWithText(CheckboxListTile, 'T-ONE'),
          )
          .value,
      true,
    );
    expect(find.text('Xác nhận thuê 1 khay'), findsOneWidget);
    expect(find.text('Xem thêm khay'), findsOneWidget);
  });
  testWidgets(
    'search resets selection and ignores a late old next-page response',
    (tester) async {
      final pending = Completer<http.Response>();
      await mount(tester, (request) async {
        if (request.url.queryParameters['tray_q'] == 'NEW') {
          return page(trays: [tray('new', 'T-NEW')]);
        }
        if (request.url.queryParameters.containsKey('tray_cursor')) {
          return pending.future;
        }
        return page(more: true);
      });
      await tester.tap(find.widgetWithText(CheckboxListTile, 'T-ONE'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Xem thêm khay'));
      await tester.pump();
      await tester.enterText(find.byType(TextField), 'NEW');
      await tester.tap(find.byTooltip('Tìm khay'));
      await tester.pumpAndSettle();
      expect(find.text('T-NEW'), findsOneWidget);
      expect(find.text('Xác nhận thuê 0 khay'), findsOneWidget);
      pending.complete(page(trays: [tray('old-late', 'T-LATE')]));
      await tester.pumpAndSettle();
      expect(find.text('T-LATE'), findsNothing);
      expect(find.text('T-NEW'), findsOneWidget);
      expect(tester.takeException(), isNull);
    },
  );
}
