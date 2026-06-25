import 'package:flutter/material.dart';
import 'package:ultrawash/feature/customer_dashboard/payments/widgets/payment_history_card.dart';

class InvoiceCard extends StatelessWidget {
  const InvoiceCard({
    required this.invoiceNumber,
    required this.billingPeriod,
    required this.amount,
    required this.status,
    super.key,
  });

  final String invoiceNumber;
  final String billingPeriod;
  final String amount;
  final PaymentStatus status;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.description_outlined, color: Color(0xFF1073E6)),
              const SizedBox(width: 9),
              Expanded(
                child: Text(
                  invoiceNumber,
                  style: const TextStyle(fontWeight: FontWeight.w800),
                ),
              ),
              PaymentStatusBadge(status: status),
            ],
          ),
          const SizedBox(height: 16),
          _InvoiceDetail(label: 'Billing period', value: billingPeriod),
          const SizedBox(height: 8),
          _InvoiceDetail(label: 'Amount', value: amount),
          const SizedBox(height: 18),
          OutlinedButton.icon(
            onPressed: () {},
            icon: const Icon(Icons.visibility_outlined),
            label: const Text('View Invoice'),
          ),
        ],
      ),
    );
  }
}

class _InvoiceDetail extends StatelessWidget {
  const _InvoiceDetail({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(label, style: const TextStyle(color: Color(0xFF64748B))),
        const Spacer(),
        Text(value, style: const TextStyle(fontWeight: FontWeight.w700)),
      ],
    );
  }
}
