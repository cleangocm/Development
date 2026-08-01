import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:ultrawash/core/cleango/models/subscription.dart';
import 'package:ultrawash/core/cleango/payments/payment_request_context.dart';
import 'package:ultrawash/feature/customer_dashboard/collections/controller/subscription_management_controller.dart';
import 'package:ultrawash/feature/customer_dashboard/collections/subscription_plans_screen.dart';
import 'package:ultrawash/feature/customer_dashboard/payments/payment_method_screen.dart';

class SubscriptionManagementScreen extends StatefulWidget {
  const SubscriptionManagementScreen({
    super.key,
    SubscriptionManagementController? controller,
  }) : _controller = controller;

  final SubscriptionManagementController? _controller;

  @override
  State<SubscriptionManagementScreen> createState() =>
      _SubscriptionManagementScreenState();
}

class _SubscriptionManagementScreenState
    extends State<SubscriptionManagementScreen> {
  late final SubscriptionManagementController _controller =
      widget._controller ?? SubscriptionManagementController.fromLocator();
  late Future<SubscriptionManagementViewData> _data = _controller.load();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        title: const Text('Manage subscription'),
      ),
      body: FutureBuilder<SubscriptionManagementViewData>(
        future: _data,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(
              child: CircularProgressIndicator(color: Color(0xFF16A34A)),
            );
          }
          if (snapshot.hasError) {
            return _LoadError(onRetry: _reload);
          }

          final data =
              snapshot.data ??
              const SubscriptionManagementViewData(
                current: null,
                history: <Subscription>[],
              );
          return RefreshIndicator(
            onRefresh: _refresh,
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(16, 20, 16, 36),
              children: [
                const Text(
                  'My CLEANGO plan',
                  style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Review plan limits, payment state, and renewal options.',
                  style: TextStyle(color: Color(0xFF64748B)),
                ),
                const SizedBox(height: 20),
                if (data.current == null)
                  _NoSubscriptionCard(onBrowsePlans: _openPlans)
                else
                  _SubscriptionStateCard(
                    subscription: data.current!,
                    onPrimaryAction: _primaryAction(data.current!),
                    primaryActionLabel: _primaryActionLabel(data.current!),
                    onBrowsePlans: _openPlans,
                  ),
                if (data.history.isNotEmpty) ...[
                  const SizedBox(height: 26),
                  const Text(
                    'Subscription history',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
                  ),
                  const SizedBox(height: 12),
                  for (final subscription in data.history) ...[
                    _HistoryCard(subscription: subscription),
                    const SizedBox(height: 10),
                  ],
                ],
              ],
            ),
          );
        },
      ),
    );
  }

  VoidCallback? _primaryAction(Subscription subscription) {
    return switch (subscription.status) {
      SubscriptionStatus.pendingPayment => () => _openPayment(subscription),
      SubscriptionStatus.active || SubscriptionStatus.expired =>
        () => _openPayment(subscription, renewal: true),
      SubscriptionStatus.pendingReview ||
      SubscriptionStatus.suspended ||
      SubscriptionStatus.cancelled => null,
    };
  }

  String? _primaryActionLabel(Subscription subscription) {
    return switch (subscription.status) {
      SubscriptionStatus.pendingPayment => 'Choose payment method',
      SubscriptionStatus.active => 'Prepare renewal',
      SubscriptionStatus.expired => 'Renew subscription',
      SubscriptionStatus.pendingReview ||
      SubscriptionStatus.suspended ||
      SubscriptionStatus.cancelled => null,
    };
  }

  Future<void> _openPayment(
    Subscription subscription, {
    bool renewal = false,
  }) async {
    await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => PaymentMethodScreen(
          paymentContext: PaymentRequestContext.forSubscription(
            subscription,
            renewal: renewal,
          ),
        ),
      ),
    );
    if (mounted) _reload();
  }

  Future<void> _openPlans() async {
    await Navigator.of(context).push<void>(
      MaterialPageRoute(builder: (_) => const SubscriptionPlansScreen()),
    );
    if (mounted) _reload();
  }

  Future<void> _refresh() async {
    final data = _controller.load();
    setState(() => _data = data);
    await data;
  }

  void _reload() {
    setState(() => _data = _controller.load());
  }
}

class _SubscriptionStateCard extends StatelessWidget {
  const _SubscriptionStateCard({
    required this.subscription,
    required this.onPrimaryAction,
    required this.primaryActionLabel,
    required this.onBrowsePlans,
  });

  final Subscription subscription;
  final VoidCallback? onPrimaryAction;
  final String? primaryActionLabel;
  final VoidCallback onBrowsePlans;

  @override
  Widget build(BuildContext context) {
    final plan = subscription.planSnapshot;
    return _Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  plan.englishName,
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              _StatusPill(status: subscription.status),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            plan.frenchName,
            style: const TextStyle(color: Color(0xFF64748B)),
          ),
          const Divider(height: 28),
          _Detail(
            label: 'Monthly price',
            value: subscription.monthlyPriceXaf == null
                ? 'CLEANGO review required'
                : _money(subscription.monthlyPriceXaf!),
          ),
          _Detail(
            label: 'Included collections',
            value: '${subscription.includedPickupsPerMonth} per month',
          ),
          _Detail(
            label: 'Included volume',
            value:
                '${subscription.includedBagsPerPickup} CLEANGO 60L bags per collection',
          ),
          _Detail(
            label: 'Extra 60L bag',
            value: _money(subscription.extraBagRate),
          ),
          _Detail(
            label: 'Remaining collections',
            value: '${subscription.remainingCollections}',
          ),
          _Detail(
            label: 'Payment',
            value: subscription.paymentStatus.wireValue,
          ),
          _Detail(label: 'Start date', value: _date(subscription.startDate)),
          _Detail(label: 'Expiry date', value: _date(subscription.endDate)),
          const SizedBox(height: 16),
          if (subscription.status == SubscriptionStatus.pendingReview)
            const _Notice(
              text:
                  'CLEANGO is reviewing this flexible plan. No payment or activation occurs until a trusted quotation is ready.',
            ),
          if (subscription.status == SubscriptionStatus.pendingPayment)
            const _Notice(
              text:
                  'This plan remains inactive until CLEANGO receives trusted payment confirmation.',
            ),
          if (onPrimaryAction != null && primaryActionLabel != null) ...[
            const SizedBox(height: 14),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: onPrimaryAction,
                icon: const Icon(Icons.payments_outlined),
                label: Text(primaryActionLabel!),
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFF16A34A),
                ),
              ),
            ),
          ],
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: onBrowsePlans,
              child: const Text('View all plans'),
            ),
          ),
        ],
      ),
    );
  }
}

class _NoSubscriptionCard extends StatelessWidget {
  const _NoSubscriptionCard({required this.onBrowsePlans});

  final VoidCallback onBrowsePlans;

  @override
  Widget build(BuildContext context) {
    return _Card(
      child: Column(
        children: [
          const Icon(
            Icons.workspace_premium_outlined,
            size: 48,
            color: Color(0xFF16A34A),
          ),
          const SizedBox(height: 12),
          const Text(
            'No subscription yet',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 6),
          const Text(
            'Choose a CLEANGO plan or continue booking one-time collections.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Color(0xFF64748B)),
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: onBrowsePlans,
            child: const Text('Browse plans'),
          ),
        ],
      ),
    );
  }
}

class _HistoryCard extends StatelessWidget {
  const _HistoryCard({required this.subscription});

  final Subscription subscription;

  @override
  Widget build(BuildContext context) {
    return _Card(
      child: Row(
        children: [
          const CircleAvatar(
            backgroundColor: Color(0xFFDCFCE7),
            child: Icon(Icons.recycling, color: Color(0xFF15803D)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  subscription.planSnapshot.englishName,
                  style: const TextStyle(fontWeight: FontWeight.w900),
                ),
                Text(
                  'Updated ${_date(subscription.updatedAt)}',
                  style: const TextStyle(
                    color: Color(0xFF64748B),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          _StatusPill(status: subscription.status),
        ],
      ),
    );
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.status});

  final SubscriptionStatus status;

  @override
  Widget build(BuildContext context) {
    final color = switch (status) {
      SubscriptionStatus.active => const Color(0xFF15803D),
      SubscriptionStatus.pendingPayment ||
      SubscriptionStatus.pendingReview => const Color(0xFFB45309),
      SubscriptionStatus.expired ||
      SubscriptionStatus.cancelled ||
      SubscriptionStatus.suspended => const Color(0xFFB91C1C),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: .1),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        status.label,
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}

class _Detail extends StatelessWidget {
  const _Detail({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Text(
              label,
              style: const TextStyle(color: Color(0xFF64748B)),
            ),
          ),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.end,
              style: const TextStyle(fontWeight: FontWeight.w800),
            ),
          ),
        ],
      ),
    );
  }
}

class _Notice extends StatelessWidget {
  const _Notice({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFBEB),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        text,
        style: const TextStyle(color: Color(0xFF92400E), height: 1.35),
      ),
    );
  }
}

class _Card extends StatelessWidget {
  const _Card({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: const Color(0xFFE2E8F0)),
        borderRadius: BorderRadius.circular(18),
      ),
      child: child,
    );
  }
}

class _LoadError extends StatelessWidget {
  const _LoadError({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.cloud_off_outlined, size: 44),
            const SizedBox(height: 12),
            const Text('Unable to load subscriptions.'),
            const SizedBox(height: 14),
            FilledButton(onPressed: onRetry, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }
}

String _date(DateTime? value) {
  if (value == null) return 'Not scheduled';
  return DateFormat('d MMM yyyy').format(value);
}

String _money(int amount) =>
    '${NumberFormat.decimalPattern('fr').format(amount)} FCFA';
