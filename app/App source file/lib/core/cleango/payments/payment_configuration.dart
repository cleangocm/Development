import 'package:ultrawash/core/cleango/models/payment.dart';

class PaymentConfiguration {
  const PaymentConfiguration({this.showUnavailableMobileMoneyMethods = true});

  factory PaymentConfiguration.fromEnvironment() {
    return const PaymentConfiguration(
      showUnavailableMobileMoneyMethods: bool.fromEnvironment(
        'CLEANGO_SHOW_UNAVAILABLE_MOBILE_MONEY',
        defaultValue: true,
      ),
    );
  }

  final bool showUnavailableMobileMoneyMethods;

  List<PaymentMethod> get visibleMethods => List.unmodifiable([
    if (showUnavailableMobileMoneyMethods) ...[
      PaymentMethod.mtnMobileMoney,
      PaymentMethod.orangeMoney,
    ],
    PaymentMethod.cash,
  ]);

  bool isAvailable(PaymentMethod method) => method == PaymentMethod.cash;

  String availabilityMessage(PaymentMethod method) => switch (method) {
    PaymentMethod.mtnMobileMoney =>
      'MTN Mobile Money is not configured yet. No payment has been created.',
    PaymentMethod.orangeMoney =>
      'Orange Money is not configured yet. No payment has been created.',
    PaymentMethod.cash =>
      'Cash is confirmed only after an authorized CLEANGO representative receives it.',
  };
}
