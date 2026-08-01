import 'package:flutter/material.dart';
import 'package:ultrawash/core/cleango/models/notification.dart';

extension NotificationTypeStyle on CleanGoNotificationType {
  String get label => switch (this) {
    CleanGoNotificationType.collectionReminderTomorrow => 'Collection reminder',
    CleanGoNotificationType.collectorOnTheWay => 'Collector on the way',
    CleanGoNotificationType.collectorArrived => 'Collector arrived',
    CleanGoNotificationType.collectionCompleted => 'Collection completed',
    CleanGoNotificationType.paymentReceived => 'Payment received',
    CleanGoNotificationType.subscriptionExpiringFiveDays =>
      'Subscription expiring',
    CleanGoNotificationType.unknown => 'CLEANGO update',
  };

  IconData get icon => switch (this) {
    CleanGoNotificationType.collectionReminderTomorrow => Icons.event_outlined,
    CleanGoNotificationType.collectorOnTheWay => Icons.route_outlined,
    CleanGoNotificationType.collectorArrived => Icons.location_on_outlined,
    CleanGoNotificationType.collectionCompleted => Icons.check_circle_outline,
    CleanGoNotificationType.paymentReceived => Icons.receipt_long_outlined,
    CleanGoNotificationType.subscriptionExpiringFiveDays => Icons.autorenew,
    CleanGoNotificationType.unknown => Icons.notifications_outlined,
  };

  Color get color => switch (this) {
    CleanGoNotificationType.collectionReminderTomorrow => const Color(
      0xFF1073E6,
    ),
    CleanGoNotificationType.collectorOnTheWay => const Color(0xFF6D28D9),
    CleanGoNotificationType.collectorArrived => const Color(0xFFB45309),
    CleanGoNotificationType.collectionCompleted => const Color(0xFF16A34A),
    CleanGoNotificationType.paymentReceived => const Color(0xFF15803D),
    CleanGoNotificationType.subscriptionExpiringFiveDays => const Color(
      0xFF0F766E,
    ),
    CleanGoNotificationType.unknown => const Color(0xFF475569),
  };
}

class NotificationCard extends StatelessWidget {
  const NotificationCard({
    required this.notification,
    this.onMarkAsRead,
    this.onAction,
    super.key,
  });

  final CleanGoNotification notification;
  final VoidCallback? onMarkAsRead;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    final type = notification.type;
    return Container(
      padding: const EdgeInsets.all(17),
      decoration: BoxDecoration(
        color: notification.isRead ? Colors.white : const Color(0xFFF0F7FF),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: notification.isRead
              ? const Color(0xFFE2E8F0)
              : const Color(0xFFBFDBFE),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(9),
                decoration: BoxDecoration(
                  color: type.color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(type.icon, color: type.color),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            notification.title,
                            style: const TextStyle(
                              color: Color(0xFF0F172A),
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                        if (!notification.isRead)
                          const CircleAvatar(
                            radius: 4,
                            backgroundColor: Color(0xFF1073E6),
                          ),
                      ],
                    ),
                    const SizedBox(height: 5),
                    Text(
                      type.label,
                      style: TextStyle(
                        color: type.color,
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 13),
          Text(
            notification.message,
            style: const TextStyle(color: Color(0xFF475569)),
          ),
          const SizedBox(height: 12),
          Text(
            _relativeTimestamp(notification.createdAt),
            style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 10,
            runSpacing: 8,
            children: [
              if (!notification.isRead)
                TextButton.icon(
                  onPressed: onMarkAsRead,
                  icon: const Icon(Icons.done, size: 18),
                  label: const Text('Mark as read'),
                ),
              if (notification.actionLabel != null)
                OutlinedButton(
                  onPressed: onAction,
                  child: Text(notification.actionLabel!),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

String _relativeTimestamp(DateTime createdAt) {
  final difference = DateTime.now().difference(createdAt);
  if (difference.inMinutes < 1) return 'Just now';
  if (difference.inMinutes < 60) return '${difference.inMinutes} minutes ago';
  if (difference.inHours < 24) return '${difference.inHours} hours ago';
  if (difference.inDays == 1) return 'Yesterday';
  return '${difference.inDays} days ago';
}
