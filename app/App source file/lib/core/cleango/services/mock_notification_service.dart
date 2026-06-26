import 'package:ultrawash/core/cleango/models/notification.dart';
import 'package:ultrawash/core/cleango/repositories/notification_repository.dart';

class MockNotificationService implements NotificationRepository {
  final List<CleanGoNotification> _notifications = [
    CleanGoNotification(
      id: 'notification-demo-001',
      customerId: 'customer-demo-001',
      title: 'Pickup reminder',
      message: 'Your household waste pickup is scheduled for tomorrow.',
      type: CleanGoNotificationType.pickupReminder,
      createdAt: DateTime(2026, 6, 25, 9, 30),
      isRead: false,
      actionLabel: 'View pickup',
      relatedEntityId: 'collection-demo-001',
    ),
    CleanGoNotification(
      id: 'notification-demo-002',
      customerId: 'customer-demo-001',
      title: 'Payment confirmed',
      message: 'Your Standard Plan payment of 5,000 XAF was successful.',
      type: CleanGoNotificationType.paymentConfirmed,
      createdAt: DateTime(2026, 6, 24, 14, 10),
      isRead: true,
      actionLabel: 'View payment',
      relatedEntityId: 'payment-demo-001',
    ),
  ];

  @override
  Future<List<CleanGoNotification>> getNotifications(String customerId) async {
    return List.unmodifiable(
      _notifications.where(
        (notification) => notification.customerId == customerId,
      ),
    );
  }

  @override
  Future<void> markAllAsRead(String customerId) async {
    for (var index = 0; index < _notifications.length; index++) {
      final notification = _notifications[index];
      if (notification.customerId == customerId && !notification.isRead) {
        _notifications[index] = notification.copyWith(isRead: true);
      }
    }
  }

  @override
  Future<CleanGoNotification> markAsRead(String notificationId) async {
    final index = _notifications.indexWhere(
      (notification) => notification.id == notificationId,
    );
    if (index == -1) {
      throw StateError('Notification not found: $notificationId');
    }
    final updated = _notifications[index].copyWith(isRead: true);
    _notifications[index] = updated;
    return updated;
  }
}
