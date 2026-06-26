import 'package:ultrawash/core/cleango/models/address.dart';

enum WasteType { household, recyclable, organic, commercial, medical, bulky }

enum CollectionStatus {
  scheduled,
  collectorAssigned,
  inProgress,
  completed,
  missed,
  cancelled,
}

class WasteCollection {
  const WasteCollection({
    required this.id,
    required this.customerId,
    required this.scheduledDate,
    required this.timeWindow,
    required this.wasteType,
    required this.address,
    required this.status,
    this.collectorName,
    this.completedAt,
  });

  final String id;
  final String customerId;
  final DateTime scheduledDate;
  final String timeWindow;
  final WasteType wasteType;
  final Address address;
  final CollectionStatus status;
  final String? collectorName;
  final DateTime? completedAt;

  bool get isUpcoming =>
      status == CollectionStatus.scheduled ||
      status == CollectionStatus.collectorAssigned ||
      status == CollectionStatus.inProgress;

  WasteCollection copyWith({
    String? id,
    String? customerId,
    DateTime? scheduledDate,
    String? timeWindow,
    WasteType? wasteType,
    Address? address,
    CollectionStatus? status,
    String? collectorName,
    DateTime? completedAt,
  }) {
    return WasteCollection(
      id: id ?? this.id,
      customerId: customerId ?? this.customerId,
      scheduledDate: scheduledDate ?? this.scheduledDate,
      timeWindow: timeWindow ?? this.timeWindow,
      wasteType: wasteType ?? this.wasteType,
      address: address ?? this.address,
      status: status ?? this.status,
      collectorName: collectorName ?? this.collectorName,
      completedAt: completedAt ?? this.completedAt,
    );
  }
}
