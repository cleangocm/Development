import 'package:flutter/material.dart';
import 'package:ultrawash/feature/customer_dashboard/home/controller/home_tab_controller.dart';
import 'package:ultrawash/feature/customer_dashboard/home/widgets/active_subscription_card.dart';
import 'package:ultrawash/feature/customer_dashboard/home/widgets/customer_greeting_card.dart';
import 'package:ultrawash/feature/customer_dashboard/home/widgets/next_collection_card.dart';
import 'package:ultrawash/feature/customer_dashboard/home/widgets/quick_actions_section.dart';
import 'package:ultrawash/feature/customer_dashboard/home/widgets/recent_activity_section.dart';

class HomeTab extends StatefulWidget {
  const HomeTab({super.key, HomeTabController? controller})
    : _controller = controller;

  final HomeTabController? _controller;

  @override
  State<HomeTab> createState() => _HomeTabState();
}

class _HomeTabState extends State<HomeTab> {
  late final HomeTabController _controller =
      widget._controller ?? HomeTabController.mock();
  late Future<HomeTabViewData> _homeData = _controller.load();

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<HomeTabViewData>(
      future: _homeData,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const _HomeLoadingState();
        }

        if (snapshot.hasError) {
          return _HomeErrorState(onRetry: _retry);
        }

        return _HomeContent(data: snapshot.data ?? HomeTabViewData.empty());
      },
    );
  }

  void _retry() {
    setState(() {
      _homeData = _controller.load();
    });
  }
}

class _HomeContent extends StatelessWidget {
  const _HomeContent({required this.data});

  final HomeTabViewData data;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 18, 16, 120),
      children: [
        CustomerGreetingCard(
          customerName: data.customerName,
          serviceArea: data.serviceArea,
          avatarUrl: data.avatarUrl,
        ),
        const SizedBox(height: 16),
        _OverviewCards(data: data),
        const SizedBox(height: 24),
        const QuickActionsSection(),
        const SizedBox(height: 24),
        RecentActivitySection(
          activities: data.recentActivities
              .map(
                (activity) => RecentActivityItem(
                  title: activity.title,
                  subtitle: activity.subtitle,
                  dateLabel: activity.dateLabel,
                  icon: activity.icon,
                ),
              )
              .toList(growable: false),
        ),
      ],
    );
  }
}

class _OverviewCards extends StatelessWidget {
  const _OverviewCards({required this.data});

  final HomeTabViewData data;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final useColumns = constraints.maxWidth >= 720;
        final subscription = ActiveSubscriptionCard(
          planName: data.subscriptionPlanName,
          renewalDate: data.renewalDateLabel,
          remainingPickups: data.remainingPickups,
        );
        final collection = NextCollectionCard(
          scheduledDate: data.nextCollectionDateLabel,
          pickupStatus: data.nextCollectionStatusLabel,
          address: data.nextCollectionAddress,
        );

        if (useColumns) {
          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: subscription),
              const SizedBox(width: 16),
              Expanded(child: collection),
            ],
          );
        }

        return Column(
          children: [subscription, const SizedBox(height: 16), collection],
        );
      },
    );
  }
}

class _HomeLoadingState extends StatelessWidget {
  const _HomeLoadingState();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: CircularProgressIndicator(color: Color(0xFF16A34A)),
    );
  }
}

class _HomeErrorState extends StatelessWidget {
  const _HomeErrorState({required this.onRetry});

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
              'Unable to load dashboard',
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
