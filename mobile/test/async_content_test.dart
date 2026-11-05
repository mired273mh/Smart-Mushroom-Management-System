import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smart_mushroom_customer/widgets.dart';

void main() {
  testWidgets(
    'pull refresh updates the async list without returning a Future from setState',
    (tester) async {
      var loads = 0;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AsyncContent<int>(
              load: () async => ++loads,
              builder: (count) => ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                children: [Text('Load $count')],
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.text('Load 1'), findsOneWidget);
      await tester.drag(find.byType(ListView), const Offset(0, 350));
      await tester.pumpAndSettle();
      expect(find.text('Load 2'), findsOneWidget);
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox());
    },
  );
}
