import 'package:flutter/material.dart';

class NotificationSummaryCard extends StatelessWidget {
  const NotificationSummaryCard({
    required this.unreadCount,
    required this.totalNotifications,
    required this.todaysReminders,
    super.key,
  });

  final int unreadCount;
  final int totalNotifications;
  final int todaysReminders;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF0F172A), Color(0xFF123B68)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Wrap(
        spacing: 14,
        runSpacing: 14,
        children: [
          _SummaryMetric(
            icon: Icons.mark_email_unread_outlined,
            label: 'Unread',
            value: '$unreadCount',
            accent: const Color(0xFF86EFAC),
          ),
          _SummaryMetric(
            icon: Icons.notifications_none,
            label: 'Total',
            value: '$totalNotifications',
            accent: const Color(0xFF93C5FD),
          ),
          _SummaryMetric(
            icon: Icons.today_outlined,
            label: "Today's reminders",
            value: '$todaysReminders',
            accent: const Color(0xFFFDE68A),
          ),
        ],
      ),
    );
  }
}

class _SummaryMetric extends StatelessWidget {
  const _SummaryMetric({
    required this.icon,
    required this.label,
    required this.value,
    required this.accent,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return ConstrainedBox(
      constraints: const BoxConstraints(minWidth: 150),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(13),
            ),
            child: Icon(icon, color: accent),
          ),
          const SizedBox(width: 11),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 21,
                  fontWeight: FontWeight.w800,
                ),
              ),
              Text(label, style: const TextStyle(color: Color(0xFFCBD5E1))),
            ],
          ),
        ],
      ),
    );
  }
}
