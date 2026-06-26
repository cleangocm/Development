import 'package:ultrawash/core/cleango/models/notification.dart';

abstract interface class NotificationRepository {
  Future<List<CleanGoNotification>> getNotifications(String customerId);

  Future<CleanGoNotification> markAsRead(String notificationId);

  Future<void> markAllAsRead(String customerId);
}
