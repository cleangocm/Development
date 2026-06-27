import 'package:ultrawash/core/cleango/session/current_customer_provider.dart';

class MockCurrentCustomerProvider implements CurrentCustomerProvider {
  MockCurrentCustomerProvider({this.customerId = 'customer-demo-001'});

  final String customerId;

  @override
  Future<String?> getCurrentCustomerId() async => customerId;

  @override
  Future<bool> isLoggedIn() async => customerId.isNotEmpty;

  @override
  Future<void> refresh() async {}
}
