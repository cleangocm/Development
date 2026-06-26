import 'package:ultrawash/core/cleango/models/notification.dart';
import 'package:ultrawash/core/cleango/repositories/notification_repository.dart';
import 'package:ultrawash/core/cleango/services/mock_notification_service.dart';

class NotificationsTabController {
  NotificationsTabController({
    required this.notificationRepository,
    this.customerId = _demoCustomerId,
  });

  factory NotificationsTabController.mock() {
    return NotificationsTabController(
      notificationRepository: MockNotificationService(),
    );
  }

  static const _demoCustomerId = 'customer-demo-001';

  final NotificationRepository notificationRepository;
  final String customerId;

  Future<NotificationsTabViewData> load() async {
    final notifications = await notificationRepository.getNotifications(
      customerId,
    );
    final sortedNotifications = [...notifications]
      ..sort((left, right) => right.createdAt.compareTo(left.createdAt));

    final unreadCount = sortedNotifications
        .where((notification) => !notification.isRead)
        .length;
    final todaysReminders = sortedNotifications
        .where(
          (notification) =>
              notification.type == CleanGoNotificationType.pickupReminder &&
              _isToday(notification.createdAt),
        )
        .length;

    return NotificationsTabViewData(
      notifications: List.unmodifiable(sortedNotifications),
      unreadCount: unreadCount,
      totalNotifications: sortedNotifications.length,
      todaysReminders: todaysReminders,
    );
  }

  Future<void> markAsRead(String notificationId) async {
    await notificationRepository.markAsRead(notificationId);
  }

  Future<void> markAllAsRead() async {
    await notificationRepository.markAllAsRead(customerId);
  }

  bool _isToday(DateTime date) {
    final now = DateTime.now();
    return date.year == now.year &&
        date.month == now.month &&
        date.day == now.day;
  }
}

class NotificationsTabViewData {
  const NotificationsTabViewData({
    required this.notifications,
    required this.unreadCount,
    required this.totalNotifications,
    required this.todaysReminders,
  });

  factory NotificationsTabViewData.empty() {
    return const NotificationsTabViewData(
      notifications: [],
      unreadCount: 0,
      totalNotifications: 0,
      todaysReminders: 0,
    );
  }

  final List<CleanGoNotification> notifications;
  final int unreadCount;
  final int totalNotifications;
  final int todaysReminders;
}
