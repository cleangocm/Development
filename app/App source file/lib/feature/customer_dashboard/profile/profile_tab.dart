import 'package:flutter/material.dart';
import 'package:ultrawash/feature/customer_dashboard/profile/widgets/account_card.dart';
import 'package:ultrawash/feature/customer_dashboard/profile/widgets/address_card.dart';
import 'package:ultrawash/feature/customer_dashboard/profile/widgets/preferences_card.dart';
import 'package:ultrawash/feature/customer_dashboard/profile/widgets/profile_header_card.dart';
import 'package:ultrawash/feature/customer_dashboard/profile/widgets/subscription_card.dart';
import 'package:ultrawash/feature/customer_dashboard/profile/widgets/support_card.dart';

class ProfileTab extends StatelessWidget {
  const ProfileTab({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 120),
      children: [
        const Text(
          'Profile',
          style: TextStyle(
            color: Color(0xFF0F172A),
            fontSize: 26,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 6),
        const Text(
          'Manage your CLEANGO account, service address, and preferences.',
          style: TextStyle(color: Color(0xFF64748B)),
        ),
        const SizedBox(height: 22),
        const ProfileHeaderCard(
          name: 'Emmanuel Lavet',
          phoneNumber: '+237 6 50 00 00 00',
          email: 'emmanuel@example.com',
          serviceArea: 'Yaounde, Centre Region',
        ),
        const SizedBox(height: 18),
        const _ProfileCardGrid(
          children: [
            SubscriptionCard(
              planName: 'Standard Plan',
              renewalDate: '12 July 2026',
              remainingCollections: 6,
            ),
            AddressCard(
              primaryAddress: 'Bastos, Yaounde, Cameroon',
              serviceZone: 'CLEANGO service zone',
              isWithinServiceZone: true,
            ),
          ],
        ),
        const SizedBox(height: 18),
        const PreferencesCard(),
        const SizedBox(height: 18),
        const _ProfileCardGrid(children: [SupportCard(), AccountCard()]),
      ],
    );
  }
}

class _ProfileCardGrid extends StatelessWidget {
  const _ProfileCardGrid({required this.children});

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
