import 'package:flutter/material.dart';

class PaymentMethodCard extends StatelessWidget {
  const PaymentMethodCard({super.key});

  static const _methods = [
    _PaymentMethod(
      name: 'MTN Mobile Money',
      icon: Icons.phone_android,
      color: Color(0xFFF59E0B),
    ),
    _PaymentMethod(
      name: 'Orange Money',
      icon: Icons.smartphone,
      color: Color(0xFFF97316),
    ),
    _PaymentMethod(
      name: 'Stripe / Credit Card',
      icon: Icons.credit_card,
      color: Color(0xFF635BFF),
    ),
    _PaymentMethod(
      name: 'Bank Transfer',
      icon: Icons.account_balance_outlined,
      color: Color(0xFF1073E6),
    ),
    _PaymentMethod(
      name: 'Cash on Collection',
      icon: Icons.payments_outlined,
      color: Color(0xFF16A34A),
    ),
  ];

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
            for (final method in _methods)
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
                          method.name,
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

class _PaymentMethod {
  const _PaymentMethod({
    required this.name,
    required this.icon,
    required this.color,
  });

  final String name;
  final IconData icon;
  final Color color;
}
