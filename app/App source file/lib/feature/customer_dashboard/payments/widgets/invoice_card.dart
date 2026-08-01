import 'package:flutter/material.dart';
import 'package:ultrawash/core/cleango/models/payment.dart';

class InvoiceCard extends StatelessWidget {
  const InvoiceCard({required this.payment, this.onViewDetails, super.key});

  final Payment payment;
  final VoidCallback? onViewDetails;

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
          const Row(
            children: [
              Icon(Icons.description_outlined, color: Color(0xFF1073E6)),
              SizedBox(width: 9),
              Text(
                'Receipt foundation',
                style: TextStyle(fontWeight: FontWeight.w800),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _InvoiceDetail(label: 'Payment', value: _shortReference(payment.id)),
          const SizedBox(height: 8),
          _InvoiceDetail(label: 'Amount', value: _formatXaf(payment.amountXaf)),
          const SizedBox(height: 8),
          _InvoiceDetail(
            label: 'Receipt',
            value: payment.receiptAvailable
                ? 'Available'
                : 'Requires trusted confirmation',
          ),
          if (onViewDetails != null) ...[
            const SizedBox(height: 18),
            OutlinedButton.icon(
              onPressed: onViewDetails,
              icon: const Icon(Icons.visibility_outlined),
              label: const Text('View payment'),
            ),
          ],
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
        Flexible(
          child: Text(
            value,
            textAlign: TextAlign.end,
            style: const TextStyle(fontWeight: FontWeight.w700),
          ),
        ),
      ],
    );
  }
}

String _shortReference(String id) {
  final suffix = id.length <= 12 ? id : id.substring(id.length - 12);
  return 'CG-${suffix.toUpperCase()}';
}

String _formatXaf(int amount) {
  return '${amount.toString().replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (match) => ' ')} FCFA';
}
