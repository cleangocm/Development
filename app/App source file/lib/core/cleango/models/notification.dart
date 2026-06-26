enum CleanGoNotificationType {
  pickupReminder,
  collectorAssigned,
  pickupCompleted,
  paymentReminder,
  paymentConfirmed,
  subscriptionRenewal,
  serviceAreaUpdate,
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
  final String? actionLabel;
  final String? relatedEntityId;

  CleanGoNotification copyWith({
    String? id,
    String? customerId,
    String? title,
    String? message,
    CleanGoNotificationType? type,
    DateTime? createdAt,
    bool? isRead,
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
      actionLabel: actionLabel ?? this.actionLabel,
      relatedEntityId: relatedEntityId ?? this.relatedEntityId,
    );
  }
}
