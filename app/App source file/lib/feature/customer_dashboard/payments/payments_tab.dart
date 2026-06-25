import 'package:flutter/material.dart';
import 'package:ultrawash/feature/customer_dashboard/payments/widgets/empty_payments_state.dart';
import 'package:ultrawash/feature/customer_dashboard/payments/widgets/invoice_card.dart';
import 'package:ultrawash/feature/customer_dashboard/payments/widgets/payment_history_card.dart';
import 'package:ultrawash/feature/customer_dashboard/payments/widgets/payment_method_card.dart';
import 'package:ultrawash/feature/customer_dashboard/payments/widgets/payment_summary_card.dart';

class PaymentsTab extends StatelessWidget {
  const PaymentsTab({super.key});

  static const _transactions = [
    PaymentHistoryCard(
      transactionId: 'CG-2026-0621-1842',
      date: '21 June 2026',
      amount: '5,000 XAF',
      method: 'MTN Mobile Money',
      status: PaymentStatus.paid,
    ),
    PaymentHistoryCard(
      transactionId: 'CG-2026-0612-0918',
      date: '12 June 2026',
      amount: '5,000 XAF',
      method: 'Stripe / Credit Card',
      status: PaymentStatus.refunded,
    ),
  ];

  static const _invoices = [
    InvoiceCard(
      invoiceNumber: 'INV-CG-2026-0071',
      billingPeriod: 'July 2026',
      amount: '5,000 XAF',
      status: PaymentStatus.pending,
    ),
    InvoiceCard(
      invoiceNumber: 'INV-CG-2026-0060',
      billingPeriod: 'June 2026',
      amount: '5,000 XAF',
      status: PaymentStatus.paid,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 120),
      children: [
        const Text(
          'Payments',
          style: TextStyle(
            color: Color(0xFF0F172A),
            fontSize: 26,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 6),
        const Text(
          'Manage balances, payment methods, invoices, and receipts.',
          style: TextStyle(color: Color(0xFF64748B)),
        ),
        const SizedBox(height: 22),
        const PaymentSummaryCard(
          outstandingBalance: '5,000 XAF',
          paidThisMonth: '5,000 XAF',
          subscriptionStatus: 'Active',
        ),
        const SizedBox(height: 24),
        const _SectionTitle(title: 'Payment methods'),
        const SizedBox(height: 12),
        const PaymentMethodCard(),
        const SizedBox(height: 26),
        const _SectionTitle(title: 'Invoices'),
        const SizedBox(height: 12),
        _ResponsiveCardGrid(children: _invoices),
        const SizedBox(height: 26),
        const _SectionTitle(title: 'Payment history'),
        const SizedBox(height: 12),
        if (_transactions.isEmpty)
          const EmptyPaymentsState()
        else
          _ResponsiveCardGrid(children: _transactions),
      ],
    );
  }
}

class _ResponsiveCardGrid extends StatelessWidget {
  const _ResponsiveCardGrid({required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth < 760) {
          return Column(
            children: [
              for (final child in children) ...[
                child,
                const SizedBox(height: 14),
              ],
            ],
          );
        }

        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            for (var index = 0; index < children.length; index++) ...[
              Expanded(child: children[index]),
              if (index < children.length - 1) const SizedBox(width: 16),
            ],
          ],
        );
      },
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: const TextStyle(
        color: Color(0xFF0F172A),
        fontSize: 20,
        fontWeight: FontWeight.w800,
      ),
    );
  }
}
