import 'package:ultrawash/core/cleango/session/current_customer_provider.dart';
import 'package:ultrawash/core/cleango/session/mock_current_customer_provider.dart';

class CurrentCustomerContext {
  CurrentCustomerContext({required this.provider});

  factory CurrentCustomerContext.mock() {
    return CurrentCustomerContext(provider: MockCurrentCustomerProvider());
  }

  final CurrentCustomerProvider provider;

  String? currentCustomerId;
  bool loggedIn = false;

  Future<void> refresh() async {
    await provider.refresh();
    currentCustomerId = await provider.getCurrentCustomerId();
    loggedIn = await provider.isLoggedIn();
  }
}
