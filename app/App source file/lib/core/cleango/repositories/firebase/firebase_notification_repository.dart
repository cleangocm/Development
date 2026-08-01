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
    final documents = await _ownedDocuments(uid);
    final notifications =
        documents
            .map(_notificationFromDocument)
            .where((notification) => notification.customerId == uid)
            .toList(growable: false)
          ..sort((left, right) => right.createdAt.compareTo(left.createdAt));
    return List.unmodifiable(notifications);
  }

  @override
  Future<int> getUnreadCount(String customerId) async {
    final notifications = await getNotifications(customerId);
    return notifications.where((notification) => !notification.isRead).length;
  }

  @override
  Future<CleanGoNotification> markAsRead(String notificationId) async {
    final uid = _requireSignedInCustomer();
    final reference = _notifications.doc(notificationId);
    final snapshot = await reference.get();
    if (!snapshot.exists) {
      throw StateError('Notification not found.');
    }

    final notification = _notificationFromDocument(snapshot);
    if (notification.customerId != uid) {
      throw StateError('Notification does not belong to the current customer.');
    }

    await reference.update(<String, dynamic>{
      'read': true,
      'readAt': FieldValue.serverTimestamp(),
    });

    final updatedSnapshot = await reference.get();
    return _notificationFromDocument(updatedSnapshot);
  }

  @override
  Future<void> markAllAsRead(String customerId) async {
    final uid = _requireCurrentCustomer(customerId: customerId);
    final documents = await _ownedDocuments(uid);
    final unread = documents
        .where((document) {
          final notification = _notificationFromDocument(document);
          return notification.customerId == uid && !notification.isRead;
        })
        .toList(growable: false);

    const batchLimit = 400;
    for (var offset = 0; offset < unread.length; offset += batchLimit) {
      final batch = _firestore.batch();
      final end = (offset + batchLimit).clamp(0, unread.length);
      for (final document in unread.sublist(offset, end)) {
        batch.update(document.reference, <String, dynamic>{
          'read': true,
          'readAt': FieldValue.serverTimestamp(),
        });
      }
      await batch.commit();
    }
  }

  Future<List<QueryDocumentSnapshot<Map<String, dynamic>>>> _ownedDocuments(
    String uid,
  ) async {
    final byId = <String, QueryDocumentSnapshot<Map<String, dynamic>>>{};

    final canonical = await _notifications
        .where('customerId', isEqualTo: uid)
        .get();
    for (final document in canonical.docs) {
      byId[document.id] = document;
    }

    try {
      final legacy = await _notifications.where('userId', isEqualTo: uid).get();
      for (final document in legacy.docs) {
        byId[document.id] = document;
      }
    } on FirebaseException catch (error) {
      if (error.code != 'permission-denied') rethrow;
      // Canonical customerId records remain available when legacy reads close.
    }

    return List.unmodifiable(byId.values);
  }

  String _requireCurrentCustomer({required String customerId}) {
    final uid = _requireSignedInCustomer();
    if (customerId.isNotEmpty && customerId != uid) {
      throw StateError('Customer context does not match Firebase user.');
    }
    return uid;
  }

  String _requireSignedInCustomer() {
    final uid = _firebaseAuth.currentUser?.uid;
    if (uid == null || uid.isEmpty) {
      throw StateError('A signed-in Firebase customer is required.');
    }
    return uid;
  }
}

CleanGoNotification _notificationFromDocument(
  DocumentSnapshot<Map<String, dynamic>> document,
) {
  final data = document.data() ?? const <String, dynamic>{};
  final title = _string(data['title']);
  final message = _string(data['body'] ?? data['message']);
  final type = _typeFromData(data, title: title, message: message);

  return CleanGoNotification(
    id: document.id,
    customerId: _string(data['customerId'] ?? data['userId']),
    title: title.isEmpty ? 'CLEANGO update' : title,
    message: message.isEmpty ? 'You have a new CLEANGO update.' : message,
    type: type,
    createdAt: _date(data['createdAt']),
    isRead: _bool(data['read'] ?? data['isRead']) ?? false,
    readAt: _nullableDate(data['readAt']),
    collectionId: _nullableString(data['collectionId'] ?? data['pickupId']),
    bookingId: _nullableString(data['bookingId']),
    subscriptionId: _nullableString(data['subscriptionId']),
    paymentId: _nullableString(data['paymentId']),
    collectorId: _nullableString(data['collectorId']),
    deliveryStatus: _nullableString(data['deliveryStatus']) ?? 'recorded',
    dataVersion: _integer(data['dataVersion']) ?? 1,
    actionLabel:
        _nullableString(data['actionLabel']) ?? _defaultActionLabel(type),
  );
}

CleanGoNotificationType _typeFromData(
  Map<String, dynamic> data, {
  required String title,
  required String message,
}) {
  final direct = cleanGoNotificationTypeFromWire(data['type']);
  if (direct != CleanGoNotificationType.unknown) return direct;

  final signal = '${_string(data['type'])} $title $message'.toLowerCase();
  if (signal.contains('on the way') || signal.contains('en route')) {
    return CleanGoNotificationType.collectorOnTheWay;
  }
  if (signal.contains('arrived') || signal.contains('arrive')) {
    return CleanGoNotificationType.collectorArrived;
  }
  if (signal.contains('collect') && signal.contains('complet')) {
    return CleanGoNotificationType.collectionCompleted;
  }
  if (signal.contains('payment') &&
      (signal.contains('received') || signal.contains('confirm'))) {
    return CleanGoNotificationType.paymentReceived;
  }
  if (signal.contains('subscription') || signal.contains('abonnement')) {
    return CleanGoNotificationType.subscriptionExpiringFiveDays;
  }
  if (signal.contains('tomorrow') ||
      signal.contains('reminder') ||
      signal.contains('demain')) {
    return CleanGoNotificationType.collectionReminderTomorrow;
  }
  return CleanGoNotificationType.unknown;
}

String? _defaultActionLabel(CleanGoNotificationType type) {
  return switch (type) {
    CleanGoNotificationType.collectionReminderTomorrow ||
    CleanGoNotificationType.collectorOnTheWay ||
    CleanGoNotificationType.collectorArrived ||
    CleanGoNotificationType.collectionCompleted => 'View collection',
    CleanGoNotificationType.paymentReceived => 'View payment',
    CleanGoNotificationType.subscriptionExpiringFiveDays => 'View subscription',
    CleanGoNotificationType.unknown => 'View notifications',
  };
}

String _string(Object? value) => value?.toString().trim() ?? '';

String? _nullableString(Object? value) {
  final result = _string(value);
  return result.isEmpty ? null : result;
}

DateTime _date(Object? value) =>
    _nullableDate(value) ?? DateTime.fromMillisecondsSinceEpoch(0, isUtc: true);

DateTime? _nullableDate(Object? value) {
  if (value is Timestamp) return value.toDate();
  if (value is DateTime) return value;
  if (value is int) return DateTime.fromMillisecondsSinceEpoch(value);
  if (value is String) return DateTime.tryParse(value);
  return null;
}

bool? _bool(Object? value) {
  if (value is bool) return value;
  if (value is num) return value != 0;
  final normalized = _string(value).toLowerCase();
  if (normalized == 'true' || normalized == '1') return true;
  if (normalized == 'false' || normalized == '0') return false;
  return null;
}

int? _integer(Object? value) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  return int.tryParse(_string(value));
}
