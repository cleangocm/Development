import 'package:flutter/material.dart';
import 'package:ultrawash/core/cleango/models/payment.dart';

class PaymentDetailsScreen extends StatelessWidget {
  const PaymentDetailsScreen({super.key, required this.payment});

  final Payment payment;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Payment details')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: const Color(0xFF0F172A),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              children: [
                const Text(
                  'CLEANGO payment',
                  style: TextStyle(color: Color(0xFFCBD5E1)),
                ),
                const SizedBox(height: 8),
                Text(
                  _money(payment.amountXaf),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 30,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 8),
                _StatusBadge(status: payment.status),
              ],
            ),
          ),
          const SizedBox(height: 18),
          _DetailCard(
            rows: [
              _DetailRow('Reference', _shortReference(payment.id)),
              _DetailRow('Method', payment.method.label()),
              _DetailRow('Service', payment.relatedServiceLabel),
              _DetailRow('Created', _dateTime(payment.initiatedAt)),
              if (payment.confirmedAt != null)
                _DetailRow('Confirmed', _dateTime(payment.confirmedAt!)),
              _DetailRow(
                'Receipt',
                payment.receiptAvailable
                    ? 'Available'
                    : payment.status == PaymentStatus.paid
                    ? 'Preparing receipt'
                    : 'Available after trusted payment confirmation',
              ),
            ],
          ),
          if (payment.status == PaymentStatus.awaitingCashConfirmation) ...[
            const SizedBox(height: 18),
            const _InformationCard(
              text:
                  'Your cash payment remains pending until an authorized CLEANGO representative confirms receipt. The customer app cannot mark it paid.',
            ),
          ],
          if (payment.failureMessageSafe != null) ...[
            const SizedBox(height: 18),
            _InformationCard(text: payment.failureMessageSafe!),
          ],
        ],
      ),
    );
  }
}

class _DetailCard extends StatelessWidget {
  const _DetailCard({required this.rows});

  final List<_DetailRow> rows;

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
          for (var index = 0; index < rows.length; index++) ...[
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Text(
                    rows[index].label,
                    style: const TextStyle(color: Color(0xFF64748B)),
                  ),
                ),
                const SizedBox(width: 12),
                Flexible(
                  child: Text(
                    rows[index].value,
                    textAlign: TextAlign.end,
                    style: const TextStyle(fontWeight: FontWeight.w800),
                  ),
                ),
              ],
            ),
            if (index < rows.length - 1) const Divider(height: 24),
          ],
        ],
      ),
    );
  }
}

class _InformationCard extends StatelessWidget {
  const _InformationCard({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFBEB),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFFDE68A)),
      ),
      child: Text(text, style: const TextStyle(color: Color(0xFF92400E))),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.status});

  final PaymentStatus status;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: .12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        child: Text(
          status.label,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }
}

class _DetailRow {
  const _DetailRow(this.label, this.value);

  final String label;
  final String value;
}

String _shortReference(String id) {
  final suffix = id.length <= 12 ? id : id.substring(id.length - 12);
  return 'CG-${suffix.toUpperCase()}';
}

String _dateTime(DateTime date) {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  final hour = date.hour.toString().padLeft(2, '0');
  final minute = date.minute.toString().padLeft(2, '0');
  return '${date.day} ${months[date.month - 1]} ${date.year}, $hour:$minute';
}

String _money(int amount) {
  final digits = amount.toString();
  final buffer = StringBuffer();
  for (var index = 0; index < digits.length; index++) {
    if (index > 0 && (digits.length - index) % 3 == 0) buffer.write(' ');
    buffer.write(digits[index]);
  }
  return '${buffer.toString()} FCFA';
}
