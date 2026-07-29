import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:get/get.dart';
import 'package:ultrawash/main.dart';

void main() {
  setUp(() {
    Get.testMode = true;
  });

  tearDown(Get.reset);

  testWidgets('CLEANGO application shell starts without network access', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      const MyApp(home: Scaffold(body: Text('CLEANGO startup ready'))),
    );

    expect(find.text('CLEANGO startup ready'), findsOneWidget);
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
