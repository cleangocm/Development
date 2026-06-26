import 'package:flutter/material.dart';
import 'package:ultrawash/feature/customer_dashboard/payments/controller/payments_tab_controller.dart';
import 'package:ultrawash/feature/customer_dashboard/payments/widgets/empty_payments_state.dart';
import 'package:ultrawash/feature/customer_dashboard/payments/widgets/invoice_card.dart';
import 'package:ultrawash/feature/customer_dashboard/payments/widgets/payment_history_card.dart';
import 'package:ultrawash/feature/customer_dashboard/payments/widgets/payment_method_card.dart';
import 'package:ultrawash/feature/customer_dashboard/payments/widgets/payment_summary_card.dart';

class PaymentsTab extends StatefulWidget {
  const PaymentsTab({super.key, PaymentsTabController? controller})
    : _controller = controller;

  final PaymentsTabController? _controller;

  @override
  State<PaymentsTab> createState() => _PaymentsTabState();
}

class _PaymentsTabState extends State<PaymentsTab> {
  late final PaymentsTabController _controller =
      widget._controller ?? PaymentsTabController.mock();
  late Future<PaymentsTabViewData> _paymentsData = _controller.load();

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<PaymentsTabViewData>(
      future: _paymentsData,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const _PaymentsLoadingState();
        }

        if (snapshot.hasError) {
          return _PaymentsErrorState(onRetry: _retry);
        }

        return _PaymentsContent(
          data: snapshot.data ?? PaymentsTabViewData.empty(),
        );
      },
    );
  }

  void _retry() {
    setState(() {
      _paymentsData = _controller.load();
    });
  }
}

class _PaymentsContent extends StatelessWidget {
  const _PaymentsContent({required this.data});

  final PaymentsTabViewData data;

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
        PaymentSummaryCard(
          outstandingBalanceXaf: data.outstandingBalanceXaf,
          paidThisMonthXaf: data.paidThisMonthXaf,
          subscriptionStatus: data.subscriptionStatus,
        ),
        const SizedBox(height: 24),
        const _SectionTitle(title: 'Payment methods'),
        const SizedBox(height: 12),
        PaymentMethodCard(methods: data.supportedMethods),
        const SizedBox(height: 26),
        const _SectionTitle(title: 'Invoices'),
        const SizedBox(height: 12),
        if (data.invoices.isEmpty)
          const EmptyPaymentsState()
        else
          _ResponsiveCardGrid(
            children: data.invoices
                .map((payment) => InvoiceCard(payment: payment))
                .toList(growable: false),
          ),
        const SizedBox(height: 26),
        const _SectionTitle(title: 'Payment history'),
        const SizedBox(height: 12),
        if (data.payments.isEmpty)
          const EmptyPaymentsState()
        else
          _ResponsiveCardGrid(
            children: data.payments
                .map((payment) => PaymentHistoryCard(payment: payment))
                .toList(growable: false),
          ),
      ],
    );
  }
}

class _PaymentsLoadingState extends StatelessWidget {
  const _PaymentsLoadingState();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: CircularProgressIndicator(color: Color(0xFF16A34A)),
    );
  }
}

class _PaymentsErrorState extends StatelessWidget {
  const _PaymentsErrorState({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.cloud_off_outlined,
              color: Color(0xFF94A3B8),
              size: 42,
            ),
            const SizedBox(height: 12),
            const Text(
              'Unable to load payments',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 8),
            const Text(
              'Please try again in a moment.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Color(0xFF64748B)),
            ),
            const SizedBox(height: 16),
            FilledButton(onPressed: onRetry, child: const Text('Retry')),
          ],
        ),
      ),
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
