import 'package:flutter/material.dart';
import 'package:ultrawash/core/cleango/models/notification.dart';
import 'package:ultrawash/core/cleango/notifications/notification_destination.dart';
import 'package:ultrawash/feature/customer_dashboard/notifications/controller/notifications_tab_controller.dart';
import 'package:ultrawash/feature/customer_dashboard/notifications/notification_navigation.dart';
import 'package:ultrawash/feature/customer_dashboard/notifications/widgets/empty_notifications_state.dart';
import 'package:ultrawash/feature/customer_dashboard/notifications/widgets/notification_card.dart';
import 'package:ultrawash/feature/customer_dashboard/notifications/widgets/notification_filter_chips.dart';
import 'package:ultrawash/feature/customer_dashboard/notifications/widgets/notification_summary_card.dart';

class NotificationsTab extends StatefulWidget {
  const NotificationsTab({
    super.key,
    NotificationsTabController? controller,
    this.refreshToken = 0,
  }) : _controller = controller;

  final NotificationsTabController? _controller;
  final int refreshToken;

  @override
  State<NotificationsTab> createState() => _NotificationsTabState();
}

class _NotificationsTabState extends State<NotificationsTab> {
  late final NotificationsTabController _controller =
      widget._controller ?? NotificationsTabController.mock();
  late Future<NotificationsTabViewData> _notificationsData = _controller.load();

  NotificationFilter selectedFilter = NotificationFilter.all;

  @override
  void didUpdateWidget(covariant NotificationsTab oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.refreshToken != widget.refreshToken) {
      _notificationsData = _controller.load();
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<NotificationsTabViewData>(
      future: _notificationsData,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const _NotificationsLoadingState();
        }

        if (snapshot.hasError) {
          return _NotificationsErrorState(onRetry: _reload);
        }

        return _NotificationsContent(
          data: snapshot.data ?? NotificationsTabViewData.empty(),
          selectedFilter: selectedFilter,
          onFilterSelected: (filter) {
            setState(() {
              selectedFilter = filter;
            });
          },
          onMarkAsRead: _markAsRead,
          onMarkAllAsRead: _markAllAsRead,
          onOpenNotification: _openNotification,
        );
      },
    );
  }

  Future<void> _markAsRead(String notificationId) async {
    await _controller.markAsRead(notificationId);
    _reload();
  }

  Future<void> _markAllAsRead() async {
    try {
      await _controller.markAllAsRead();
      _reload();
    } catch (_) {
      _showMessage('Unable to update notifications. Please try again.');
    }
  }

  Future<void> _openNotification(CleanGoNotification notification) async {
    await NotificationNavigator.open(
      context,
      NotificationDestination.fromNotification(notification),
      openNotificationHistory: () {
        if (!mounted) return;
        setState(() => selectedFilter = NotificationFilter.all);
      },
    );
    if (mounted) _reload();
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  void _reload() {
    setState(() {
      _notificationsData = _controller.load();
    });
  }
}

class _NotificationsContent extends StatelessWidget {
  const _NotificationsContent({
    required this.data,
    required this.selectedFilter,
    required this.onFilterSelected,
    required this.onMarkAsRead,
    required this.onMarkAllAsRead,
    required this.onOpenNotification,
  });

  final NotificationsTabViewData data;
  final NotificationFilter selectedFilter;
  final ValueChanged<NotificationFilter> onFilterSelected;
  final ValueChanged<String> onMarkAsRead;
  final VoidCallback onMarkAllAsRead;
  final ValueChanged<CleanGoNotification> onOpenNotification;

  @override
  Widget build(BuildContext context) {
    final visibleNotifications = data.notifications
        .where((notification) {
          return switch (selectedFilter) {
            NotificationFilter.all => true,
            NotificationFilter.unread => !notification.isRead,
            NotificationFilter.collections => notification.type.isCollection,
            NotificationFilter.payments => notification.type.isPayment,
            NotificationFilter.system => notification.type.isSystem,
          };
        })
        .toList(growable: false);

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
              onPressed: onMarkAllAsRead,
              icon: const Icon(Icons.done_all, size: 18),
              label: const Text('Mark all as read'),
            ),
          ],
        ),
        const SizedBox(height: 20),
        NotificationSummaryCard(
          unreadCount: data.unreadCount,
          totalNotifications: data.totalNotifications,
          todaysReminders: data.todaysReminders,
        ),
        const SizedBox(height: 22),
        NotificationFilterChips(
          selectedFilter: selectedFilter,
          onSelected: onFilterSelected,
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
                      NotificationCard(
                        notification: notification,
                        onMarkAsRead: () => onMarkAsRead(notification.id),
                        onAction: () => onOpenNotification(notification),
                      ),
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
                      child: NotificationCard(
                        notification: notification,
                        onMarkAsRead: () => onMarkAsRead(notification.id),
                        onAction: () => onOpenNotification(notification),
                      ),
                    ),
                ],
              );
            },
          ),
      ],
    );
  }
}

class _NotificationsLoadingState extends StatelessWidget {
  const _NotificationsLoadingState();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: CircularProgressIndicator(color: Color(0xFF16A34A)),
    );
  }
}

class _NotificationsErrorState extends StatelessWidget {
  const _NotificationsErrorState({required this.onRetry});

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
              'Unable to load notifications',
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
