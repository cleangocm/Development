enum CleanGoNotificationType {
  collectionReminderTomorrow,
  collectorOnTheWay,
  collectorArrived,
  collectionCompleted,
  paymentReceived,
  subscriptionExpiringFiveDays,
  unknown,
}

extension CleanGoNotificationTypeValue on CleanGoNotificationType {
  String get wireValue => switch (this) {
    CleanGoNotificationType.collectionReminderTomorrow =>
      'collection_reminder_tomorrow',
    CleanGoNotificationType.collectorOnTheWay => 'collector_on_the_way',
    CleanGoNotificationType.collectorArrived => 'collector_arrived',
    CleanGoNotificationType.collectionCompleted => 'collection_completed',
    CleanGoNotificationType.paymentReceived => 'payment_received',
    CleanGoNotificationType.subscriptionExpiringFiveDays =>
      'subscription_expiring_5_days',
    CleanGoNotificationType.unknown => 'unknown',
  };

  bool get isCollection => switch (this) {
    CleanGoNotificationType.collectionReminderTomorrow ||
    CleanGoNotificationType.collectorOnTheWay ||
    CleanGoNotificationType.collectorArrived ||
    CleanGoNotificationType.collectionCompleted => true,
    _ => false,
  };

  bool get isPayment =>
      this == CleanGoNotificationType.paymentReceived ||
      this == CleanGoNotificationType.subscriptionExpiringFiveDays;

  bool get isSystem => this == CleanGoNotificationType.unknown;
}

CleanGoNotificationType cleanGoNotificationTypeFromWire(Object? value) {
  final normalized = value?.toString().trim().toLowerCase().replaceAll(
    RegExp(r'[\s-]+'),
    '_',
  );

  return switch (normalized) {
    'collection_reminder_tomorrow' ||
    'pickup_reminder' ||
    'pickupreminder' => CleanGoNotificationType.collectionReminderTomorrow,
    'collector_on_the_way' ||
    'collectorontheway' ||
    'on_the_way' => CleanGoNotificationType.collectorOnTheWay,
    'collector_arrived' ||
    'collectorarrived' ||
    'arrived' => CleanGoNotificationType.collectorArrived,
    'collection_completed' ||
    'pickup_completed' ||
    'pickupcompleted' => CleanGoNotificationType.collectionCompleted,
    'payment_received' ||
    'payment_confirmed' ||
    'paymentconfirmed' => CleanGoNotificationType.paymentReceived,
    'subscription_expiring_5_days' ||
    'subscription_renewal' ||
    'subscriptionrenewal' =>
      CleanGoNotificationType.subscriptionExpiringFiveDays,
    _ => CleanGoNotificationType.unknown,
  };
}

class CleanGoNotification {
  const CleanGoNotification({
    required this.id,
    required this.customerId,
    required this.title,
    required this.message,
    required this.type,
    required this.createdAt,
    required this.isRead,
    this.readAt,
    this.collectionId,
    this.bookingId,
    this.subscriptionId,
    this.paymentId,
    this.collectorId,
    this.deliveryStatus = 'recorded',
    this.dataVersion = 1,
    this.actionLabel,
    this.relatedEntityId,
  });

  final String id;
  final String customerId;
  final String title;
  final String message;
  final CleanGoNotificationType type;
  final DateTime createdAt;
  final bool isRead;
  final DateTime? readAt;
  final String? collectionId;
  final String? bookingId;
  final String? subscriptionId;
  final String? paymentId;
  final String? collectorId;
  final String deliveryStatus;
  final int dataVersion;
  final String? actionLabel;
  final String? relatedEntityId;

  String get body => message;

  CleanGoNotification copyWith({
    String? id,
    String? customerId,
    String? title,
    String? message,
    CleanGoNotificationType? type,
    DateTime? createdAt,
    bool? isRead,
    DateTime? readAt,
    String? collectionId,
    String? bookingId,
    String? subscriptionId,
    String? paymentId,
    String? collectorId,
    String? deliveryStatus,
    int? dataVersion,
    String? actionLabel,
    String? relatedEntityId,
  }) {
    return CleanGoNotification(
      id: id ?? this.id,
      customerId: customerId ?? this.customerId,
      title: title ?? this.title,
      message: message ?? this.message,
      type: type ?? this.type,
      createdAt: createdAt ?? this.createdAt,
      isRead: isRead ?? this.isRead,
      readAt: readAt ?? this.readAt,
      collectionId: collectionId ?? this.collectionId,
      bookingId: bookingId ?? this.bookingId,
      subscriptionId: subscriptionId ?? this.subscriptionId,
      paymentId: paymentId ?? this.paymentId,
      collectorId: collectorId ?? this.collectorId,
      deliveryStatus: deliveryStatus ?? this.deliveryStatus,
      dataVersion: dataVersion ?? this.dataVersion,
      actionLabel: actionLabel ?? this.actionLabel,
      relatedEntityId: relatedEntityId ?? this.relatedEntityId,
    );
  }
}
