import 'package:flutter/material.dart';

enum PaymentStatus { paid, pending, processing, failed, refunded }

extension PaymentStatusStyle on PaymentStatus {
  String get label => switch (this) {
    PaymentStatus.paid => 'Paid',
    PaymentStatus.pending => 'Pending',
    PaymentStatus.processing => 'Processing',
    PaymentStatus.failed => 'Failed',
    PaymentStatus.refunded => 'Refunded',
  };

  Color get foreground => switch (this) {
    PaymentStatus.paid => const Color(0xFF15803D),
    PaymentStatus.pending => const Color(0xFFB45309),
    PaymentStatus.processing => const Color(0xFF1D4ED8),
    PaymentStatus.failed => const Color(0xFFB91C1C),
    PaymentStatus.refunded => const Color(0xFF6D28D9),
  };

  Color get background => switch (this) {
    PaymentStatus.paid => const Color(0xFFDDF7E5),
    PaymentStatus.pending => const Color(0xFFFEF3C7),
    PaymentStatus.processing => const Color(0xFFDBEAFE),
    PaymentStatus.failed => const Color(0xFFFEE2E2),
    PaymentStatus.refunded => const Color(0xFFEDE9FE),
  };
}

class PaymentStatusBadge extends StatelessWidget {
  const PaymentStatusBadge({required this.status, super.key});

  final PaymentStatus status;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: status.background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        status.label,
        style: TextStyle(
          color: status.foreground,
          fontSize: 12,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}

class PaymentHistoryCard extends StatelessWidget {
  const PaymentHistoryCard({
    required this.transactionId,
    required this.date,
    required this.amount,
    required this.method,
    required this.status,
    super.key,
  });

  final String transactionId;
  final String date;
  final String amount;
  final String method;
  final PaymentStatus status;

  @override
  Widget build(BuildContext context) {
    return _PaymentCardFrame(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  transactionId,
                  style: const TextStyle(
                    color: Color(0xFF0F172A),
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              PaymentStatusBadge(status: status),
            ],
          ),
          const SizedBox(height: 16),
          _PaymentDetail(label: 'Date', value: date),
          const SizedBox(height: 8),
          _PaymentDetail(label: 'Amount', value: amount),
          const SizedBox(height: 8),
          _PaymentDetail(label: 'Method', value: method),
          const SizedBox(height: 18),
          OutlinedButton.icon(
            onPressed: () {},
            icon: const Icon(Icons.download_outlined),
            label: const Text('Download Receipt'),
          ),
        ],
      ),
    );
  }
}

class _PaymentCardFrame extends StatelessWidget {
  const _PaymentCardFrame({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: child,
    );
  }
}

class _PaymentDetail extends StatelessWidget {
  const _PaymentDetail({required this.label, required this.value});

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
