import 'package:flutter/material.dart';
import 'package:flutter_app/counter_app.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('each tap increments the counter', (tester) async {
    await tester.pumpWidget(const CounterApp());
    expect(find.text('0'), findsOneWidget);
    await tester.tap(find.byIcon(Icons.add));
    await tester.pump();
    expect(find.text('1'), findsOneWidget);
  });
}
