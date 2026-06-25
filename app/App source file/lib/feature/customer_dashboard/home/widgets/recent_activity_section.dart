import 'package:flutter/material.dart';

class RecentActivitySection extends StatelessWidget {
  const RecentActivitySection({required this.activities, super.key});

  final List<RecentActivityItem> activities;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Recent activity',
          style: TextStyle(
            color: Color(0xFF0F172A),
            fontSize: 20,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 12),
        if (activities.isEmpty)
          const _EmptyActivityState()
        else
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              children: [
                for (var index = 0; index < activities.length; index++) ...[
                  _ActivityTile(activity: activities[index]),
                  if (index < activities.length - 1)
                    const Divider(height: 1, indent: 68),
                ],
              ],
            ),
          ),
      ],
    );
  }
}

class RecentActivityItem {
  const RecentActivityItem({
    required this.title,
    required this.subtitle,
    required this.dateLabel,
    required this.icon,
  });

  final String title;
  final String subtitle;
  final String dateLabel;
  final IconData icon;
}

class _ActivityTile extends StatelessWidget {
  const _ActivityTile({required this.activity});

  final RecentActivityItem activity;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      leading: CircleAvatar(
        backgroundColor: const Color(0xFFDDF7E5),
        child: Icon(activity.icon, color: const Color(0xFF16A34A)),
      ),
      title: Text(
        activity.title,
        style: const TextStyle(fontWeight: FontWeight.w700),
      ),
      subtitle: Text(activity.subtitle),
      trailing: Text(
        activity.dateLabel,
        style: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
      ),
    );
  }
}

class _EmptyActivityState extends StatelessWidget {
  const _EmptyActivityState();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: const Column(
        children: [
          Icon(Icons.history, color: Color(0xFF94A3B8), size: 34),
          SizedBox(height: 10),
          Text(
            'No recent activity',
            style: TextStyle(fontWeight: FontWeight.w700),
          ),
          SizedBox(height: 4),
          Text(
            'Your collections and payments will appear here.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Color(0xFF64748B)),
          ),
        ],
      ),
    );
  }
}
