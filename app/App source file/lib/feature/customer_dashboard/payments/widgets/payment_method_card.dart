import 'package:flutter/material.dart';
import 'package:ultrawash/core/cleango/models/payment.dart';

class PaymentMethodCard extends StatelessWidget {
  const PaymentMethodCard({super.key, required this.methods});

  final List<PaymentMethod> methods;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        children: [
          for (var index = 0; index < methods.length; index++) ...[
            _MethodRow(method: methods[index]),
            if (index < methods.length - 1) const Divider(height: 24),
          ],
        ],
      ),
    );
  }
}

class _MethodRow extends StatelessWidget {
  const _MethodRow({required this.method});

  final PaymentMethod method;

  @override
  Widget build(BuildContext context) {
    final available = method == PaymentMethod.cash;
    return Row(
      children: [
        CircleAvatar(
          backgroundColor: _color(method).withValues(alpha: .12),
          foregroundColor: _color(method),
          child: Icon(_icon(method)),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                method.label(),
                style: const TextStyle(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 3),
              Text(
                available
                    ? 'Available · confirmation required'
                    : 'Integration not configured',
                style: TextStyle(
                  color: available
                      ? const Color(0xFF15803D)
                      : const Color(0xFF64748B),
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
        Icon(
          available ? Icons.check_circle_outline : Icons.lock_clock_outlined,
          color: available ? const Color(0xFF16A34A) : const Color(0xFF94A3B8),
        ),
      ],
    );
  }
}

IconData _icon(PaymentMethod method) => switch (method) {
  PaymentMethod.mtnMobileMoney => Icons.phone_android,
  PaymentMethod.orangeMoney => Icons.phone_iphone,
  PaymentMethod.cash => Icons.payments_outlined,
};

Color _color(PaymentMethod method) => switch (method) {
  PaymentMethod.mtnMobileMoney => const Color(0xFFF5C400),
  PaymentMethod.orangeMoney => const Color(0xFFFF7900),
  PaymentMethod.cash => const Color(0xFF16A34A),
};
