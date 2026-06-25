import 'package:flutter/material.dart';

enum NotificationType {
  pickupReminder,
  collectorAssigned,
  pickupCompleted,
  paymentReminder,
  paymentConfirmed,
  subscriptionRenewal,
  serviceAreaUpdate,
}

extension NotificationTypeStyle on NotificationType {
  String get label => switch (this) {
    NotificationType.pickupReminder => 'Pickup reminder',
    NotificationType.collectorAssigned => 'Collector assigned',
    NotificationType.pickupCompleted => 'Pickup completed',
    NotificationType.paymentReminder => 'Payment reminder',
    NotificationType.paymentConfirmed => 'Payment confirmed',
    NotificationType.subscriptionRenewal => 'Subscription renewal',
    NotificationType.serviceAreaUpdate => 'Service area update',
  };

  IconData get icon => switch (this) {
    NotificationType.pickupReminder => Icons.event_outlined,
    NotificationType.collectorAssigned => Icons.local_shipping_outlined,
    NotificationType.pickupCompleted => Icons.check_circle_outline,
    NotificationType.paymentReminder => Icons.account_balance_wallet_outlined,
    NotificationType.paymentConfirmed => Icons.receipt_long_outlined,
    NotificationType.subscriptionRenewal => Icons.autorenew,
    NotificationType.serviceAreaUpdate => Icons.location_city_outlined,
  };

  Color get color => switch (this) {
    NotificationType.pickupReminder => const Color(0xFF1073E6),
    NotificationType.collectorAssigned => const Color(0xFF6D28D9),
    NotificationType.pickupCompleted => const Color(0xFF16A34A),
    NotificationType.paymentReminder => const Color(0xFFF59E0B),
    NotificationType.paymentConfirmed => const Color(0xFF15803D),
    NotificationType.subscriptionRenewal => const Color(0xFF0F766E),
    NotificationType.serviceAreaUpdate => const Color(0xFF475569),
  };

  bool get isCollection => switch (this) {
    NotificationType.pickupReminder ||
    NotificationType.collectorAssigned ||
    NotificationType.pickupCompleted => true,
    _ => false,
  };

  bool get isPayment => switch (this) {
    NotificationType.paymentReminder ||
    NotificationType.paymentConfirmed ||
    NotificationType.subscriptionRenewal => true,
    _ => false,
  };

  bool get isSystem => this == NotificationType.serviceAreaUpdate;
}

class NotificationCard extends StatelessWidget {
  const NotificationCard({
    required this.title,
    required this.message,
    required this.type,
    required this.timestamp,
    required this.isRead,
    this.actionLabel,
    super.key,
  });

  final String title;
  final String message;
  final NotificationType type;
  final String timestamp;
  final bool isRead;
  final String? actionLabel;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(17),
      decoration: BoxDecoration(
        color: isRead ? Colors.white : const Color(0xFFF0F7FF),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isRead ? const Color(0xFFE2E8F0) : const Color(0xFFBFDBFE),
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
                            title,
                            style: const TextStyle(
                              color: Color(0xFF0F172A),
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                        if (!isRead)
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
          Text(message, style: const TextStyle(color: Color(0xFF475569))),
          const SizedBox(height: 12),
          Text(
            timestamp,
            style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 10,
            runSpacing: 8,
            children: [
              if (!isRead)
                TextButton.icon(
                  onPressed: () {},
                  icon: const Icon(Icons.done, size: 18),
                  label: const Text('Mark as read'),
                ),
              if (actionLabel != null)
                OutlinedButton(onPressed: () {}, child: Text(actionLabel!)),
            ],
          ),
        ],
      ),
    );
  }
}
