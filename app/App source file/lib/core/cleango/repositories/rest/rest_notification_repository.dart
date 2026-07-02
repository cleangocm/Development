import 'package:ultrawash/core/cleango/models/notification.dart';
import 'package:ultrawash/core/cleango/repositories/notification_repository.dart';
import 'package:ultrawash/core/service/api_service/api_service.dart';

class RestNotificationRepository implements NotificationRepository {
  RestNotificationRepository({NetworkService? networkService})
    : _networkService = networkService ?? NetworkService();

  final NetworkService _networkService;
  final Map<String, CleanGoNotification> _notificationCache = {};

  @override
  Future<List<CleanGoNotification>> getNotifications(String customerId) async {
    final page = await _getNotificationPage(customerId: customerId);
    for (final notification in page.notifications) {
      _notificationCache[notification.id] = notification;
    }
    return page.notifications;
  }

  @override
  Future<int> getUnreadCount(String customerId) async {
    final page = await _getNotificationPage(customerId: customerId);
    return page.unreadCount;
  }

  @override
  Future<CleanGoNotification> markAsRead(String notificationId) async {
    final existing =
        _notificationCache[notificationId] ??
        await _findNotification(notificationId);
    if (existing == null) {
      throw StateError('Notification not found: $notificationId');
    }

    final response = await _networkService.client.putRequest(
      '/notifications/$notificationId/read',
      body: const {},
    );
    if (!response.isSuccess) {
      throw StateError(
        response.errorMessage ?? 'Unable to mark notification as read',
      );
    }

    final updated = existing.copyWith(isRead: true);
    _notificationCache[notificationId] = updated;
    return updated;
  }

  @override
  Future<void> markAllAsRead(String customerId) async {
    final response = await _networkService.client.putRequest(
      '/notifications/all/read',
      body: const {},
    );
    if (!response.isSuccess) {
      throw StateError(
        response.errorMessage ?? 'Unable to mark notifications as read',
      );
    }

    for (final entry in _notificationCache.entries.toList()) {
      if (entry.value.customerId == customerId ||
          entry.value.customerId.isEmpty) {
        _notificationCache[entry.key] = entry.value.copyWith(isRead: true);
      }
    }
  }

  Future<_NotificationPageDto> _getNotificationPage({
    required String customerId,
  }) async {
    final response = await _networkService.client.getRequest(
      '/notifications',
      query: const {'page': 1, 'limit': 100},
    );
    if (!response.isSuccess) {
      throw StateError(response.errorMessage ?? 'Unable to load notifications');
    }

    return _NotificationPageDto.fromResponse(
      response.responseData,
      fallbackCustomerId: customerId,
    );
  }

  Future<CleanGoNotification?> _findNotification(String notificationId) async {
    final page = await _getNotificationPage(customerId: '');
    for (final notification in page.notifications) {
      _notificationCache[notification.id] = notification;
      if (notification.id == notificationId) return notification;
    }
    return null;
  }
}

class _NotificationPageDto {
  const _NotificationPageDto({
    required this.notifications,
    required this.unreadCount,
  });

  factory _NotificationPageDto.fromResponse(
    dynamic responseData, {
    required String fallbackCustomerId,
  }) {
    final envelope = _asMap(responseData);
    final data = _asMap(envelope?['data']);
    if (data == null) {
      throw const FormatException('Notification response is missing data');
    }

    final rawNotifications = data['notifications'];
    final notifications = rawNotifications is List
        ? rawNotifications
              .map(_asMap)
              .whereType<Map<String, dynamic>>()
              .map(
                (json) => _NotificationDto.fromJson(
                  json,
                  fallbackCustomerId: fallbackCustomerId,
                ).toDomain(),
              )
              .toList(growable: false)
        : const <CleanGoNotification>[];

    return _NotificationPageDto(
      notifications: List.unmodifiable(notifications),
      unreadCount: _intValue(data['unreadCount']) ?? 0,
    );
  }

  final List<CleanGoNotification> notifications;
  final int unreadCount;
}

class _NotificationDto {
  const _NotificationDto({
    required this.id,
    required this.customerId,
    required this.title,
    required this.message,
    required this.type,
    required this.createdAt,
    required this.isRead,
    this.actionLabel,
    this.relatedEntityId,
  });

  factory _NotificationDto.fromJson(
    Map<String, dynamic> json, {
    required String fallbackCustomerId,
  }) {
    final metadata = _asMap(json['metadata']);
    final title = _stringValue(json['title']);
    final message = _stringValue(json['message']);
    final type = _notificationType(
      json['type'],
      title: title,
      message: message,
      metadata: metadata,
    );

    return _NotificationDto(
      id: _stringValue(json['_id'] ?? json['id']),
      customerId: _userId(json['user']) ?? fallbackCustomerId,
      title: title,
      message: message,
      type: type,
      createdAt: _dateValue(json['createdAt']),
      isRead: _boolValue(json['isRead']) ?? false,
      actionLabel:
          _nullableString(json['actionLabel'] ?? metadata?['actionLabel']) ??
          _defaultActionLabel(type),
      relatedEntityId: _nullableString(
        json['orderId'] ??
            metadata?['collectionId'] ??
            metadata?['paymentId'] ??
            metadata?['subscriptionId'] ??
            metadata?['relatedEntityId'],
      ),
    );
  }

  final String id;
  final String customerId;
  final String title;
  final String message;
  final CleanGoNotificationType type;
  final DateTime createdAt;
  final bool isRead;
  final String? actionLabel;
  final String? relatedEntityId;

  CleanGoNotification toDomain() {
    if (id.isEmpty) {
      throw const FormatException('Notification is missing an id');
    }
    return CleanGoNotification(
      id: id,
      customerId: customerId,
      title: title,
      message: message,
      type: type,
      createdAt: createdAt,
      isRead: isRead,
      actionLabel: actionLabel,
      relatedEntityId: relatedEntityId,
    );
  }
}

CleanGoNotificationType _notificationType(
  dynamic rawType, {
  required String title,
  required String message,
  required Map<String, dynamic>? metadata,
}) {
  final signal = [
    rawType,
    title,
    message,
    metadata?['type'],
    metadata?['event'],
    metadata?['status'],
  ].map(_stringValue).join(' ').toLowerCase().replaceAll('-', '_');

  if (signal.contains('collector_assigned') ||
      signal.contains('pickup assigned') ||
      signal.contains('delivery assigned')) {
    return CleanGoNotificationType.collectorAssigned;
  }
  if (signal.contains('pickup_completed') ||
      signal.contains('pickup completed') ||
      signal.contains('collection completed')) {
    return CleanGoNotificationType.pickupCompleted;
  }
  if (signal.contains('payment_confirmed') ||
      signal.contains('payment confirmed') ||
      signal.contains('payment successful') ||
      signal.contains('payment paid')) {
    return CleanGoNotificationType.paymentConfirmed;
  }
  if (signal.contains('payment')) {
    return CleanGoNotificationType.paymentReminder;
  }
  if (signal.contains('subscription') && signal.contains('renew')) {
    return CleanGoNotificationType.subscriptionRenewal;
  }
  if (signal.contains('pickup') ||
      signal.contains('collection') ||
      signal.contains('order')) {
    return CleanGoNotificationType.pickupReminder;
  }
  if (signal.contains('service area') || signal.contains('service_area')) {
    return CleanGoNotificationType.serviceAreaUpdate;
  }

  return CleanGoNotificationType.serviceAreaUpdate;
}

String? _defaultActionLabel(CleanGoNotificationType type) {
  return switch (type) {
    CleanGoNotificationType.pickupReminder ||
    CleanGoNotificationType.collectorAssigned ||
    CleanGoNotificationType.pickupCompleted => 'View pickup',
    CleanGoNotificationType.paymentReminder ||
    CleanGoNotificationType.paymentConfirmed => 'View payment',
    CleanGoNotificationType.subscriptionRenewal => 'View subscription',
    CleanGoNotificationType.serviceAreaUpdate => null,
  };
}

Map<String, dynamic>? _asMap(dynamic value) {
  if (value is Map<String, dynamic>) return value;
  if (value is Map) return Map<String, dynamic>.from(value);
  return null;
}

String _stringValue(dynamic value) => value?.toString().trim() ?? '';

String? _nullableString(dynamic value) {
  final string = _stringValue(value);
  return string.isEmpty ? null : string;
}

String? _userId(dynamic value) {
  final user = _asMap(value);
  if (user != null) {
    return _nullableString(user['_id'] ?? user['id']);
  }
  return _nullableString(value);
}

DateTime _dateValue(dynamic value) {
  if (value is DateTime) return value;
  if (value is String) {
    return DateTime.tryParse(value) ??
        DateTime.fromMillisecondsSinceEpoch(0, isUtc: true);
  }
  return DateTime.fromMillisecondsSinceEpoch(0, isUtc: true);
}

bool? _boolValue(dynamic value) {
  if (value is bool) return value;
  if (value is String) {
    if (value.toLowerCase() == 'true') return true;
    if (value.toLowerCase() == 'false') return false;
  }
  return null;
}

int? _intValue(dynamic value) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  if (value is String) return int.tryParse(value);
  return null;
}
