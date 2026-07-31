import 'package:flutter/material.dart';
import 'package:ultrawash/core/cleango/models/subscription.dart';

class SubscriptionCard extends StatelessWidget {
  const SubscriptionCard({required this.subscription, super.key});

  final Subscription? subscription;

  @override
  Widget build(BuildContext context) {
    final activeSubscription = subscription;
    return _ProfileSectionCard(
      icon: Icons.recycling,
      title: 'My subscription',
      child: Column(
        children: [
          _DetailRow(
            label: 'Current plan',
            value: activeSubscription == null
                ? 'No active plan'
                : _planLabel(activeSubscription.plan),
          ),
          const SizedBox(height: 10),
          _DetailRow(
            label: 'Renewal date',
            value: activeSubscription?.renewalDate == null
                ? 'Not scheduled'
                : _dateLabel(activeSubscription!.renewalDate!),
          ),
          const SizedBox(height: 10),
          _DetailRow(
            label: 'Collections left',
            value: '${activeSubscription?.remainingCollections ?? 0}',
          ),
          const SizedBox(height: 18),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.settings_outlined),
              label: const Text('Manage Subscription'),
            ),
          ),
        ],
      ),
    );
  }
}

class _ProfileSectionCard extends StatelessWidget {
  const _ProfileSectionCard({
    required this.icon,
    required this.title,
    required this.child,
  });

  final IconData icon;
  final String title;
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(9),
                decoration: BoxDecoration(
                  color: const Color(0xFFDDF7E5),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: const Color(0xFF16A34A)),
              ),
              const SizedBox(width: 10),
              Text(
                title,
                style: const TextStyle(
                  color: Color(0xFF0F172A),
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          child,
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({required this.label, required this.value});

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

String _planLabel(SubscriptionPlan plan) {
  return switch (plan) {
    SubscriptionPlan.basic => 'Basic Plan',
    SubscriptionPlan.standard => 'Standard Plan',
    SubscriptionPlan.popular => 'Popular Plan',
    SubscriptionPlan.premium => 'Premium Plan',
    SubscriptionPlan.apartmentsHotels => 'Apartments & Hotels',
    SubscriptionPlan.business => 'Business Plan',
    SubscriptionPlan.enterprise => 'Enterprise Plan',
  };
}

String _dateLabel(DateTime date) {
  return '${date.day} ${_monthName(date.month)} ${date.year}';
}

String _monthName(int month) {
  const names = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  return names[month - 1];
}
