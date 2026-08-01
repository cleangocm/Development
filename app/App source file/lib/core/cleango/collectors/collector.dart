import 'package:ultrawash/core/cleango/models/collection.dart';

enum CollectorApprovalStatus { pending, approved, rejected, suspended }

enum CollectorAccountStatus { active, inactive, blocked }

enum CollectorVehicleType { bicycle, tricycle, motorcycle, van, truck, unknown }

enum CollectorAvailability { available, unavailable, onBreak, offDuty }

class CollectorProfile {
  const CollectorProfile({
    required this.uid,
    required this.displayName,
    required this.phoneNumber,
    required this.email,
    required this.profileImageUrl,
    required this.role,
    required this.approvalStatus,
    required this.accountStatus,
    required this.serviceZones,
    required this.vehicleType,
    required this.vehicleId,
    required this.employeeReference,
    required this.createdAt,
    required this.updatedAt,
    required this.approvedAt,
    required this.approvedBy,
    required this.suspendedAt,
    required this.suspensionReason,
    required this.lastActiveAt,
    required this.currentAvailability,
    required this.availabilityReason,
  });

  final String uid;
  final String displayName;
  final String phoneNumber;
  final String email;
  final String profileImageUrl;
  final String role;
  final CollectorApprovalStatus approvalStatus;
  final CollectorAccountStatus accountStatus;
  final List<String> serviceZones;
  final CollectorVehicleType vehicleType;
  final String? vehicleId;
  final String? employeeReference;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? approvedAt;
  final String? approvedBy;
  final DateTime? suspendedAt;
  final String? suspensionReason;
  final DateTime? lastActiveAt;
  final CollectorAvailability currentAvailability;
  final String? availabilityReason;

  bool get isApproved =>
      role == 'collector' && approvalStatus == CollectorApprovalStatus.approved;

  bool get canOperate =>
      isApproved && accountStatus == CollectorAccountStatus.active;
}

class CollectorAssignment {
  const CollectorAssignment({
    required this.id,
    required this.customerDisplayName,
    required this.addressLine,
    required this.district,
    required this.scheduledDate,
    required this.timeWindow,
    required this.bagCount,
    required this.bookingMode,
    required this.wasteCategory,
    required this.customerNotes,
    required this.paymentStatus,
    required this.status,
    required this.assignedWorkerId,
    required this.updatedAt,
    this.missedReason,
  });

  final String id;
  final String customerDisplayName;
  final String addressLine;
  final String district;
  final DateTime? scheduledDate;
  final String timeWindow;
  final int? bagCount;
  final CollectionBookingMode bookingMode;
  final WasteCategory wasteCategory;
  final String customerNotes;
  final CollectionPaymentStatus paymentStatus;
  final CollectionStatus status;
  final String assignedWorkerId;
  final DateTime updatedAt;
  final String? missedReason;

  String get reference =>
      id.length <= 8 ? id : id.substring(0, 8).toUpperCase();

  bool get isCompleted => status == CollectionStatus.completed;

  bool get isMissed => status == CollectionStatus.missed;
}

CollectorApprovalStatus collectorApprovalStatusFromWire(Object? value) {
  return switch (_wire(value)) {
    'approved' => CollectorApprovalStatus.approved,
    'rejected' => CollectorApprovalStatus.rejected,
    'suspended' => CollectorApprovalStatus.suspended,
    _ => CollectorApprovalStatus.pending,
  };
}

CollectorAccountStatus collectorAccountStatusFromWire(Object? value) {
  return switch (_wire(value)) {
    'inactive' => CollectorAccountStatus.inactive,
    'blocked' => CollectorAccountStatus.blocked,
    _ => CollectorAccountStatus.active,
  };
}

CollectorVehicleType collectorVehicleTypeFromWire(Object? value) {
  return switch (_wire(value)) {
    'bicycle' => CollectorVehicleType.bicycle,
    'tricycle' => CollectorVehicleType.tricycle,
    'motorcycle' => CollectorVehicleType.motorcycle,
    'van' => CollectorVehicleType.van,
    'truck' => CollectorVehicleType.truck,
    _ => CollectorVehicleType.unknown,
  };
}

CollectorAvailability collectorAvailabilityFromWire(Object? value) {
  return switch (_wire(value)) {
    'available' => CollectorAvailability.available,
    'onbreak' || 'on_break' => CollectorAvailability.onBreak,
    'offduty' || 'off_duty' => CollectorAvailability.offDuty,
    _ => CollectorAvailability.unavailable,
  };
}

extension CollectorAvailabilityValue on CollectorAvailability {
  String get wireValue => switch (this) {
    CollectorAvailability.available => 'available',
    CollectorAvailability.unavailable => 'unavailable',
    CollectorAvailability.onBreak => 'onBreak',
    CollectorAvailability.offDuty => 'offDuty',
  };

  String get label => switch (this) {
    CollectorAvailability.available => 'Available',
    CollectorAvailability.unavailable => 'Unavailable',
    CollectorAvailability.onBreak => 'On break',
    CollectorAvailability.offDuty => 'Off duty',
  };
}

String _wire(Object? value) => value?.toString().trim().toLowerCase() ?? '';
