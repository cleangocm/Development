import 'package:flutter/material.dart';

class QuickActionsSection extends StatelessWidget {
  const QuickActionsSection({
    required this.onRequestPickup,
    required this.onManageSubscription,
    required this.onPaymentHistory,
    required this.onContactSupport,
    super.key,
  });

  final VoidCallback onRequestPickup;
  final VoidCallback onManageSubscription;
  final VoidCallback onPaymentHistory;
  final VoidCallback onContactSupport;

  @override
  Widget build(BuildContext context) {
    final actions = <_QuickActionData>[
      _QuickActionData(
        label: 'Request Pickup',
        icon: Icons.add_circle_outline,
        color: const Color(0xFF16A34A),
        onTap: onRequestPickup,
      ),
      _QuickActionData(
        label: 'Manage Subscription',
        icon: Icons.autorenew,
        color: const Color(0xFF1073E6),
        onTap: onManageSubscription,
      ),
      _QuickActionData(
        label: 'Payment History',
        icon: Icons.receipt_long_outlined,
        color: const Color(0xFFF59E0B),
        onTap: onPaymentHistory,
      ),
      _QuickActionData(
        label: 'Contact Support',
        icon: Icons.support_agent,
        color: const Color(0xFF7C3AED),
        onTap: onContactSupport,
      ),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _SectionTitle(title: 'Quick actions'),
        const SizedBox(height: 12),
        LayoutBuilder(
          builder: (context, constraints) {
            final columns = constraints.maxWidth >= 700 ? 4 : 2;
            final width =
                (constraints.maxWidth - ((columns - 1) * 12)) / columns;
            return Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                for (final action in actions)
                  SizedBox(
                    width: width,
                    child: _QuickActionCard(action: action),
                  ),
              ],
            );
          },
        ),
      ],
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  const _QuickActionCard({required this.action});

  final _QuickActionData action;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: action.label,
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          onTap: action.onTap,
          borderRadius: BorderRadius.circular(16),
          child: Container(
            constraints: const BoxConstraints(minHeight: 112),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(action.icon, color: action.color, size: 30),
                const SizedBox(height: 14),
                Text(
                  action.label,
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _QuickActionData {
  const _QuickActionData({
    required this.label,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;
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
