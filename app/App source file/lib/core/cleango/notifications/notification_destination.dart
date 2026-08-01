import 'dart:convert';

import 'package:ultrawash/core/cleango/models/notification.dart';

enum NotificationDestinationType {
  collection,
  payment,
  subscription,
  notifications,
}

class NotificationDestination {
  const NotificationDestination({
    required this.type,
    required this.notificationType,
    this.notificationId,
    this.collectionId,
    this.paymentId,
    this.subscriptionId,
  });

  factory NotificationDestination.fromData(Map<String, dynamic> data) {
    final notificationType = cleanGoNotificationTypeFromWire(data['type']);
    final collectionId = _value(
      data['collectionId'] ?? data['bookingId'] ?? data['pickupId'],
    );
    final paymentId = _value(data['paymentId']);
    final subscriptionId = _value(data['subscriptionId']);

    final destinationType = switch (notificationType) {
      CleanGoNotificationType.collectionReminderTomorrow ||
      CleanGoNotificationType.collectorOnTheWay ||
      CleanGoNotificationType.collectorArrived ||
      CleanGoNotificationType.collectionCompleted when collectionId != null =>
        NotificationDestinationType.collection,
      CleanGoNotificationType.paymentReceived when paymentId != null =>
        NotificationDestinationType.payment,
      CleanGoNotificationType.subscriptionExpiringFiveDays
          when subscriptionId != null =>
        NotificationDestinationType.subscription,
      _ => NotificationDestinationType.notifications,
    };

    return NotificationDestination(
      type: destinationType,
      notificationType: notificationType,
      notificationId: _value(data['notificationId']),
      collectionId: collectionId,
      paymentId: paymentId,
      subscriptionId: subscriptionId,
    );
  }

  factory NotificationDestination.fromNotification(
    CleanGoNotification notification,
  ) {
    return NotificationDestination.fromData(<String, dynamic>{
      'type': notification.type.wireValue,
      'notificationId': notification.id,
      'collectionId':
          notification.collectionId ??
          notification.bookingId ??
          (notification.type.isCollection
              ? notification.relatedEntityId
              : null),
      'paymentId':
          notification.paymentId ??
          (notification.type == CleanGoNotificationType.paymentReceived
              ? notification.relatedEntityId
              : null),
      'subscriptionId':
          notification.subscriptionId ??
          (notification.type ==
                  CleanGoNotificationType.subscriptionExpiringFiveDays
              ? notification.relatedEntityId
              : null),
    });
  }

  factory NotificationDestination.fromPayload(String payload) {
    try {
      final decoded = jsonDecode(payload);
      if (decoded is Map) {
        return NotificationDestination.fromData(
          Map<String, dynamic>.from(decoded),
        );
      }
    } on FormatException {
      // Unknown or malformed payloads safely open notification history.
    }
    return const NotificationDestination(
      type: NotificationDestinationType.notifications,
      notificationType: CleanGoNotificationType.unknown,
    );
  }

  final NotificationDestinationType type;
  final CleanGoNotificationType notificationType;
  final String? notificationId;
  final String? collectionId;
  final String? paymentId;
  final String? subscriptionId;

  String toPayload() {
    return jsonEncode(<String, dynamic>{
      'type': notificationType.wireValue,
      if (notificationId != null) 'notificationId': notificationId,
      if (collectionId != null) 'collectionId': collectionId,
      if (paymentId != null) 'paymentId': paymentId,
      if (subscriptionId != null) 'subscriptionId': subscriptionId,
    });
  }
}

String? _value(Object? value) {
  final text = value?.toString().trim() ?? '';
  return text.isEmpty ? null : text;
}
