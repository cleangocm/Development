import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:ultrawash/core/cleango/models/notification.dart';
import 'package:ultrawash/core/cleango/repositories/notification_repository.dart';

class FirebaseNotificationRepository implements NotificationRepository {
  FirebaseNotificationRepository({
    FirebaseFirestore? firestore,
    FirebaseAuth? firebaseAuth,
  }) : _firestore = firestore ?? FirebaseFirestore.instance,
       _firebaseAuth = firebaseAuth ?? FirebaseAuth.instance;

  final FirebaseFirestore _firestore;
  final FirebaseAuth _firebaseAuth;

  CollectionReference<Map<String, dynamic>> get _notifications =>
      _firestore.collection('notifications');

  @override
  Future<List<CleanGoNotification>> getNotifications(String customerId) async {
    final uid = _requireCurrentCustomer(customerId: customerId);
    final snapshot = await _notifications.where('userId', isEqualTo: uid).get();
    final notifications = snapshot.docs
        .map(_notificationFromDocument)
        .where((notification) => notification.customerId == uid)
        .toList(growable: false);
    notifications.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    return List.unmodifiable(notifications);
  }

  @override
  Future<int> getUnreadCount(String customerId) async {
    final uid = _requireCurrentCustomer(customerId: customerId);
    try {
      final snapshot = await _notifications
          .where('userId', isEqualTo: uid)
          .where('read', isEqualTo: false)
          .get();
      return snapshot.size;
    } on FirebaseException catch (error) {
      if (error.code != 'failed-precondition') rethrow;
      final notifications = await getNotifications(uid);
      return notifications.where((notification) => !notification.isRead).length;
    }
  }

  @override
  Future<CleanGoNotification> markAsRead(String notificationId) async {
    final uid = _requireSignedInCustomer();
    final reference = _notifications.doc(notificationId);
    final snapshot = await reference.get();
    if (!snapshot.exists) {
      throw StateError('Notification not found: $notificationId');
    }

    final notification = _notificationFromDocument(snapshot);
    if (notification.customerId != uid) {
      throw StateError('Notification does not belong to the current customer');
    }

    await reference.update({
      'read': true,
      'readAt': FieldValue.serverTimestamp(),
    });

    final updatedSnapshot = await reference.get();
    return _notificationFromDocument(updatedSnapshot);
  }

  @override
  Future<void> markAllAsRead(String customerId) async {
    final uid = _requireCurrentCustomer(customerId: customerId);
    final snapshot = await _notifications
        .where('userId', isEqualTo: uid)
        .where('read', isEqualTo: false)
        .get();

    final batch = _firestore.batch();
    for (final document in snapshot.docs) {
      final notification = _notificationFromDocument(document);
      if (notification.customerId != uid) continue;
      batch.update(document.reference, {
        'read': true,
        'readAt': FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();
  }

  String _requireCurrentCustomer({required String customerId}) {
    final uid = _requireSignedInCustomer();
    if (customerId.isNotEmpty && customerId != uid) {
      throw StateError('Customer context does not match Firebase user');
    }
    return uid;
  }

  String _requireSignedInCustomer() {
    final uid = _firebaseAuth.currentUser?.uid;
    if (uid == null || uid.isEmpty) {
      throw StateError('A signed-in Firebase customer is required');
    }
    return uid;
  }
}

CleanGoNotification _notificationFromDocument(
  DocumentSnapshot<Map<String, dynamic>> document,
) {
  final data = document.data() ?? const <String, dynamic>{};
  final type = _notificationType(
    data['type'],
    title: _stringValue(data['title']),
    message: _stringValue(data['message'] ?? data['body']),
  );
  final relatedEntityId = _nullableString(
    data['pickupId'] ??
        data['paymentId'] ??
        data['subscriptionId'] ??
        data['relatedEntityId'],
  );

  return CleanGoNotification(
    id: document.id,
    customerId: _stringValue(data['userId'] ?? data['customerId']),
    title: _fallbackText(data['title'], 'CleanGo update'),
    message: _fallbackText(
      data['message'] ?? data['body'],
      'You have a new update.',
    ),
    type: type,
    createdAt: _dateValue(data['createdAt']),
    isRead: _boolValue(data['read'] ?? data['isRead']) ?? false,
    actionLabel:
        _nullableString(data['actionLabel']) ?? _defaultActionLabel(type),
    relatedEntityId: relatedEntityId,
  );
}

CleanGoNotificationType _notificationType(
  dynamic rawType, {
  required String title,
  required String message,
}) {
  final signal = [
    rawType,
    title,
    message,
  ].map(_stringValue).join(' ').toLowerCase().replaceAll('-', '_');

  if (signal.contains('collector_assigned') ||
      signal.contains('collector') ||
      signal.contains('assigned')) {
    return CleanGoNotificationType.collectorAssigned;
  }
  if (signal.contains('pickup_completed') ||
      signal.contains('collection_completed') ||
      signal.contains('completed')) {
    return CleanGoNotificationType.pickupCompleted;
  }
  if (signal.contains('payment_confirmed') ||
      signal.contains('payment_success') ||
      signal.contains('paid')) {
    return CleanGoNotificationType.paymentConfirmed;
  }
  if (signal.contains('payment')) {
    return CleanGoNotificationType.paymentReminder;
  }
  if (signal.contains('subscription') &&
      (signal.contains('renew') || signal.contains('billing'))) {
    return CleanGoNotificationType.subscriptionRenewal;
  }
  if (signal.contains('service_area') || signal.contains('service area')) {
    return CleanGoNotificationType.serviceAreaUpdate;
  }
  if (signal.contains('pickup') || signal.contains('collection')) {
    return CleanGoNotificationType.pickupReminder;
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

String _fallbackText(dynamic value, String fallback) {
  final text = _stringValue(value);
  return text.isEmpty ? fallback : text;
}

String _stringValue(dynamic value) => value?.toString().trim() ?? '';

String? _nullableString(dynamic value) {
  final string = _stringValue(value);
  return string.isEmpty ? null : string;
}

DateTime _dateValue(dynamic value) {
  if (value is Timestamp) return value.toDate();
  if (value is DateTime) return value;
  if (value is int) return DateTime.fromMillisecondsSinceEpoch(value);
  if (value is String) return DateTime.tryParse(value) ?? DateTime.now();
  return DateTime.now();
}

bool? _boolValue(dynamic value) {
  if (value is bool) return value;
  if (value is num) return value != 0;
  if (value is String) {
    final normalized = value.toLowerCase().trim();
    if (normalized == 'true' || normalized == '1' || normalized == 'yes') {
      return true;
    }
    if (normalized == 'false' || normalized == '0' || normalized == 'no') {
      return false;
    }
  }
  return null;
}
