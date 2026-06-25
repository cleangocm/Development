import 'package:flutter/material.dart';
import 'package:ultrawash/feature/customer_dashboard/notifications/widgets/empty_notifications_state.dart';
import 'package:ultrawash/feature/customer_dashboard/notifications/widgets/notification_card.dart';
import 'package:ultrawash/feature/customer_dashboard/notifications/widgets/notification_filter_chips.dart';
import 'package:ultrawash/feature/customer_dashboard/notifications/widgets/notification_summary_card.dart';

class NotificationsTab extends StatefulWidget {
  const NotificationsTab({super.key});

  @override
  State<NotificationsTab> createState() => _NotificationsTabState();
}

class _NotificationsTabState extends State<NotificationsTab> {
  NotificationFilter selectedFilter = NotificationFilter.all;

  static const notifications = [
    NotificationCard(
      title: 'Pickup reminder',
      message: 'Your household waste pickup is scheduled for tomorrow.',
      type: NotificationType.pickupReminder,
      timestamp: '10 minutes ago',
      isRead: false,
      actionLabel: 'View pickup',
    ),
    NotificationCard(
      title: 'Collector assigned',
      message: 'A CLEANGO collector has been assigned to your pickup.',
      type: NotificationType.collectorAssigned,
      timestamp: '1 hour ago',
      isRead: false,
      actionLabel: 'View pickup',
    ),
    NotificationCard(
      title: 'Payment confirmed',
      message: 'Your Standard Plan payment of 5,000 XAF was successful.',
      type: NotificationType.paymentConfirmed,
      timestamp: 'Yesterday',
      isRead: true,
      actionLabel: 'View payment',
    ),
    NotificationCard(
      title: 'Subscription renewal',
      message: 'Your subscription renews on 12 July 2026.',
      type: NotificationType.subscriptionRenewal,
      timestamp: '2 days ago',
      isRead: true,
    ),
    NotificationCard(
      title: 'Service area update',
      message: 'CLEANGO coverage has expanded within Yaounde.',
      type: NotificationType.serviceAreaUpdate,
      timestamp: '5 days ago',
      isRead: true,
    ),
  ];

  List<NotificationCard> get filteredNotifications {
    return notifications.where((notification) {
      return switch (selectedFilter) {
        NotificationFilter.all => true,
        NotificationFilter.unread => !notification.isRead,
        NotificationFilter.collections => notification.type.isCollection,
        NotificationFilter.payments => notification.type.isPayment,
        NotificationFilter.system => notification.type.isSystem,
      };
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final visibleNotifications = filteredNotifications;

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 120),
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Notifications',
                    style: TextStyle(
                      color: Color(0xFF0F172A),
                      fontSize: 26,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  SizedBox(height: 6),
                  Text(
                    'Pickup reminders, payment updates, and service news.',
                    style: TextStyle(color: Color(0xFF64748B)),
                  ),
                ],
              ),
            ),
            TextButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.done_all, size: 18),
              label: const Text('Mark all as read'),
            ),
          ],
        ),
        const SizedBox(height: 20),
        const NotificationSummaryCard(
          unreadCount: 2,
          totalNotifications: 5,
          todaysReminders: 1,
        ),
        const SizedBox(height: 22),
        NotificationFilterChips(
          selectedFilter: selectedFilter,
          onSelected: (filter) {
            setState(() {
              selectedFilter = filter;
            });
          },
        ),
        const SizedBox(height: 18),
        if (visibleNotifications.isEmpty)
          const EmptyNotificationsState()
        else
          LayoutBuilder(
            builder: (context, constraints) {
              final wideLayout = constraints.maxWidth >= 760;
              if (!wideLayout) {
                return Column(
                  children: [
                    for (final notification in visibleNotifications) ...[
                      notification,
                      const SizedBox(height: 14),
                    ],
                  ],
                );
              }

              return Wrap(
                spacing: 16,
                runSpacing: 16,
                children: [
                  for (final notification in visibleNotifications)
                    SizedBox(
                      width: (constraints.maxWidth - 16) / 2,
                      child: notification,
                    ),
                ],
              );
            },
          ),
      ],
    );
  }
}
