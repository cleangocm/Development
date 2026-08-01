import 'package:flutter/material.dart';
import 'package:ultrawash/core/cleango/models/payment.dart';
import 'package:ultrawash/feature/customer_dashboard/payments/controller/payments_tab_controller.dart';
import 'package:ultrawash/feature/customer_dashboard/payments/payment_details_screen.dart';
import 'package:ultrawash/feature/customer_dashboard/payments/widgets/empty_payments_state.dart';
import 'package:ultrawash/feature/customer_dashboard/payments/widgets/payment_history_card.dart';
import 'package:ultrawash/feature/customer_dashboard/payments/widgets/payment_method_card.dart';
import 'package:ultrawash/feature/customer_dashboard/payments/widgets/payment_summary_card.dart';

class PaymentsTab extends StatefulWidget {
  const PaymentsTab({
    super.key,
    PaymentsTabController? controller,
    this.refreshToken = 0,
  }) : _controller = controller;

  final PaymentsTabController? _controller;
  final int refreshToken;

  @override
  State<PaymentsTab> createState() => _PaymentsTabState();
}

class _PaymentsTabState extends State<PaymentsTab> {
  late final PaymentsTabController _controller =
      widget._controller ?? PaymentsTabController.mock();
  late Future<PaymentsTabViewData> _paymentsData = _controller.load();
  PaymentHistoryFilter _filter = PaymentHistoryFilter.all;

  @override
  void didUpdateWidget(covariant PaymentsTab oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.refreshToken != widget.refreshToken) {
      _paymentsData = _controller.load();
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<PaymentsTabViewData>(
      future: _paymentsData,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const _PaymentsLoadingState();
        }
        if (snapshot.hasError) return _PaymentsErrorState(onRetry: _retry);
        final data = snapshot.data ?? PaymentsTabViewData.empty();
        return _PaymentsContent(
          data: data,
          filter: _filter,
          onFilterChanged: (filter) => setState(() => _filter = filter),
          onReviewOutstanding: () =>
              setState(() => _filter = PaymentHistoryFilter.pending),
          onViewDetails: _openDetails,
          onRefresh: _refresh,
        );
      },
    );
  }

  void _openDetails(Payment payment) {
    Navigator.of(context).push<void>(
      MaterialPageRoute(builder: (_) => PaymentDetailsScreen(payment: payment)),
    );
  }

  Future<void> _refresh() async {
    final future = _controller.load();
    setState(() => _paymentsData = future);
    await future;
  }

  void _retry() => setState(() => _paymentsData = _controller.load());
}

class _PaymentsContent extends StatelessWidget {
  const _PaymentsContent({
    required this.data,
    required this.filter,
    required this.onFilterChanged,
    required this.onReviewOutstanding,
    required this.onViewDetails,
    required this.onRefresh,
  });

  final PaymentsTabViewData data;
  final PaymentHistoryFilter filter;
  final ValueChanged<PaymentHistoryFilter> onFilterChanged;
  final VoidCallback onReviewOutstanding;
  final ValueChanged<Payment> onViewDetails;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context) {
    final visiblePayments = data.payments.where(filter.matches).toList();
    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
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
            'Track secure CLEANGO payment requests and confirmed receipts.',
            style: TextStyle(color: Color(0xFF64748B)),
          ),
          const SizedBox(height: 22),
          PaymentSummaryCard(
            outstandingBalanceXaf: data.outstandingBalanceXaf,
            paidThisMonthXaf: data.paidThisMonthXaf,
            subscriptionStatus: data.subscriptionStatus,
            onReviewOutstanding: data.outstandingBalanceXaf > 0
                ? onReviewOutstanding
                : null,
          ),
          const SizedBox(height: 24),
          const _SectionTitle(title: 'Payment methods'),
          const SizedBox(height: 12),
          PaymentMethodCard(methods: data.supportedMethods),
          const SizedBox(height: 26),
          const _SectionTitle(title: 'Payment history'),
          const SizedBox(height: 12),
          _PaymentFilterChips(selected: filter, onSelected: onFilterChanged),
          const SizedBox(height: 16),
          if (visiblePayments.isEmpty)
            const EmptyPaymentsState()
          else
            _ResponsiveCardGrid(
              children: visiblePayments
                  .map(
                    (payment) => PaymentHistoryCard(
                      payment: payment,
                      onViewDetails: () => onViewDetails(payment),
                    ),
                  )
                  .toList(growable: false),
            ),
        ],
      ),
    );
  }
}

enum PaymentHistoryFilter { all, paid, pending, failed, cash, mtn, orange }

extension on PaymentHistoryFilter {
  String get label => switch (this) {
    PaymentHistoryFilter.all => 'All',
    PaymentHistoryFilter.paid => 'Paid',
    PaymentHistoryFilter.pending => 'Pending',
    PaymentHistoryFilter.failed => 'Failed',
    PaymentHistoryFilter.cash => 'Cash',
    PaymentHistoryFilter.mtn => 'MTN',
    PaymentHistoryFilter.orange => 'Orange',
  };

  bool matches(Payment payment) => switch (this) {
    PaymentHistoryFilter.all => true,
    PaymentHistoryFilter.paid => payment.status == PaymentStatus.paid,
    PaymentHistoryFilter.pending => payment.status.isOutstanding,
    PaymentHistoryFilter.failed =>
      payment.status == PaymentStatus.failed ||
          payment.status == PaymentStatus.cancelled ||
          payment.status == PaymentStatus.expired,
    PaymentHistoryFilter.cash => payment.method == PaymentMethod.cash,
    PaymentHistoryFilter.mtn => payment.method == PaymentMethod.mtnMobileMoney,
    PaymentHistoryFilter.orange => payment.method == PaymentMethod.orangeMoney,
  };
}

class _PaymentFilterChips extends StatelessWidget {
  const _PaymentFilterChips({required this.selected, required this.onSelected});

  final PaymentHistoryFilter selected;
  final ValueChanged<PaymentHistoryFilter> onSelected;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          for (final filter in PaymentHistoryFilter.values) ...[
            ChoiceChip(
              label: Text(filter.label),
              selected: filter == selected,
              onSelected: (_) => onSelected(filter),
            ),
            const SizedBox(width: 8),
          ],
        ],
      ),
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
            const Icon(Icons.cloud_off_outlined, size: 42),
            const SizedBox(height: 12),
            const Text(
              'Unable to load payments',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 8),
            const Text('Please try again in a moment.'),
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
        return Wrap(
          spacing: 16,
          runSpacing: 16,
          children: [
            for (final child in children)
              SizedBox(width: (constraints.maxWidth - 16) / 2, child: child),
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
