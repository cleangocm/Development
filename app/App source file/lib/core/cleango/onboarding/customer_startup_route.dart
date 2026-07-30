import 'package:ultrawash/core/cleango/onboarding/customer_address_service.dart';

enum CustomerStartupRoute {
  authentication,
  provisioning,
  addressOnboarding,
  dashboard,
  disabled,
  retry,
}

class CustomerStartupRouteResolver {
  const CustomerStartupRouteResolver();

  CustomerStartupRoute resolve({
    required bool authenticated,
    CustomerOnboardingState? state,
    bool readFailed = false,
  }) {
    if (!authenticated) return CustomerStartupRoute.authentication;
    if (readFailed) return CustomerStartupRoute.retry;
    if (state == null || !state.customerExists) {
      return CustomerStartupRoute.provisioning;
    }
    if (state.isDisabled) return CustomerStartupRoute.disabled;
    if (!state.isComplete) return CustomerStartupRoute.addressOnboarding;
    return CustomerStartupRoute.dashboard;
  }
}
