import 'package:flutter/material.dart';
import 'package:ultrawash/core/cleango/models/payment.dart';

class PaymentMethodCard extends StatelessWidget {
  const PaymentMethodCard({required this.methods, super.key});

  final List<PaymentMethod> methods;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final columns = constraints.maxWidth >= 760 ? 3 : 2;
        final width = (constraints.maxWidth - ((columns - 1) * 12)) / columns;
        return Wrap(
          spacing: 12,
          runSpacing: 12,
          children: [
            for (final method in methods)
              SizedBox(
                width: width,
                child: Container(
                  constraints: const BoxConstraints(minHeight: 90),
                  padding: const EdgeInsets.all(15),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(9),
                        decoration: BoxDecoration(
                          color: method.color.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(method.icon, color: method.color),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          method.label,
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}

extension PaymentMethodDisplay on PaymentMethod {
  String get label => switch (this) {
    PaymentMethod.mtnMobileMoney => 'MTN Mobile Money',
    PaymentMethod.orangeMoney => 'Orange Money',
    PaymentMethod.stripeCard => 'Stripe / Credit Card',
    PaymentMethod.bankTransfer => 'Bank Transfer',
    PaymentMethod.cashOnCollection => 'Cash on Collection',
  };

  IconData get icon => switch (this) {
    PaymentMethod.mtnMobileMoney => Icons.phone_android,
    PaymentMethod.orangeMoney => Icons.smartphone,
    PaymentMethod.stripeCard => Icons.credit_card,
    PaymentMethod.bankTransfer => Icons.account_balance_outlined,
    PaymentMethod.cashOnCollection => Icons.payments_outlined,
  };

  Color get color => switch (this) {
    PaymentMethod.mtnMobileMoney => const Color(0xFFF59E0B),
    PaymentMethod.orangeMoney => const Color(0xFFF97316),
    PaymentMethod.stripeCard => const Color(0xFF635BFF),
    PaymentMethod.bankTransfer => const Color(0xFF1073E6),
    PaymentMethod.cashOnCollection => const Color(0xFF16A34A),
  };
}
