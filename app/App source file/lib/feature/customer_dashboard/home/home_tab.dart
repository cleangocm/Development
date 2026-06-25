import 'package:flutter/material.dart';
import 'package:ultrawash/feature/customer_dashboard/home/widgets/active_subscription_card.dart';
import 'package:ultrawash/feature/customer_dashboard/home/widgets/customer_greeting_card.dart';
import 'package:ultrawash/feature/customer_dashboard/home/widgets/next_collection_card.dart';
import 'package:ultrawash/feature/customer_dashboard/home/widgets/quick_actions_section.dart';
import 'package:ultrawash/feature/customer_dashboard/home/widgets/recent_activity_section.dart';

class HomeTab extends StatelessWidget {
  const HomeTab({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 18, 16, 120),
      children: const [
        CustomerGreetingCard(
          customerName: 'Emmanuel',
          serviceArea: 'Yaounde, Centre Region',
        ),
        SizedBox(height: 16),
        _OverviewCards(),
        SizedBox(height: 24),
        QuickActionsSection(),
        SizedBox(height: 24),
        RecentActivitySection(
          activities: [
            RecentActivityItem(
              title: 'Weekly pickup completed',
              subtitle: 'Household waste collected',
              dateLabel: '18 June',
              icon: Icons.check_circle_outline,
            ),
            RecentActivityItem(
              title: 'Subscription renewed',
              subtitle: 'Standard Plan payment confirmed',
              dateLabel: '12 June',
              icon: Icons.receipt_long_outlined,
            ),
          ],
        ),
      ],
    );
  }
}

class _OverviewCards extends StatelessWidget {
  const _OverviewCards();

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final useColumns = constraints.maxWidth >= 720;
        const subscription = ActiveSubscriptionCard(
          planName: 'Standard Plan',
          renewalDate: '12 July 2026',
          remainingPickups: 6,
        );
        const collection = NextCollectionCard(
          scheduledDate: 'Saturday, 27 June',
          pickupStatus: 'Scheduled',
          address: 'Bastos, Yaounde',
        );

        if (useColumns) {
          return const Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: subscription),
              SizedBox(width: 16),
              Expanded(child: collection),
            ],
          );
        }

        return const Column(
          children: [subscription, SizedBox(height: 16), collection],
        );
      },
    );
  }
}
