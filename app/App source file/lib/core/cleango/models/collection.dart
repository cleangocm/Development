import 'package:ultrawash/core/cleango/models/address.dart';

enum CollectionType { oneTime, subscription }

enum CollectionBookingMode { subscription, oneTimeBagCount, oneTimePhotoQuote }

enum WasteCategory { household, officeBusiness, other }

enum CollectionScheduleType { customerSelected, quotationPending }

enum CollectionFrequency { once, weekly, twiceWeekly, monthly }

enum CollectionStatus {
  quotationRequested,
  pending,
  confirmed,
  assigned,
  onTheWay,
  arrived,
  inProgress,
  completed,
  missed,
  cancelled,
}

enum CollectionPaymentStatus { unpaid, pending, paid, failed, refunded }

enum CollectionQuotationStatus {
  notRequired,
  requested,
  underReview,
  quoted,
  accepted,
  rejected,
  expired,
}

enum CollectionTimeWindow {
  morningEarly('08:00-10:00', '08:00 - 10:00', 8, 10),
  morningLate('10:00-12:00', '10:00 - 12:00', 10, 12),
  afternoonEarly('14:00-16:00', '14:00 - 16:00', 14, 16),
  afternoonLate('16:00-18:00', '16:00 - 18:00', 16, 18);

  const CollectionTimeWindow(
    this.wireValue,
    this.label,
    this.startHour,
    this.endHour,
  );

  final String wireValue;
  final String label;
  final int startHour;
  final int endHour;

  static CollectionTimeWindow? fromWireValue(Object? value) {
    final normalized = value?.toString().trim();
    for (final window in values) {
      if (window.wireValue == normalized) return window;
    }
    return null;
  }
}

extension CollectionTypeLabel on CollectionType {
  String get wireValue => switch (this) {
    CollectionType.oneTime => 'oneTime',
    CollectionType.subscription => 'subscription',
  };

  String get label => switch (this) {
    CollectionType.oneTime => 'One-time collection',
    CollectionType.subscription => 'Subscription collection',
  };
}

extension CollectionBookingModeLabel on CollectionBookingMode {
  String get wireValue => switch (this) {
    CollectionBookingMode.subscription => 'subscription',
    CollectionBookingMode.oneTimeBagCount => 'oneTimeBagCount',
    CollectionBookingMode.oneTimePhotoQuote => 'oneTimePhotoQuote',
  };

  String get label => switch (this) {
    CollectionBookingMode.subscription => 'Subscription collection',
    CollectionBookingMode.oneTimeBagCount => 'Declare 60L bags',
    CollectionBookingMode.oneTimePhotoQuote => 'Request a photo quotation',
  };

  CollectionType get collectionType =>
      this == CollectionBookingMode.subscription
      ? CollectionType.subscription
      : CollectionType.oneTime;
}

extension WasteCategoryLabel on WasteCategory {
  String get wireValue => switch (this) {
    WasteCategory.household => 'household',
    WasteCategory.officeBusiness => 'officeBusiness',
    WasteCategory.other => 'other',
  };

  String get label => switch (this) {
    WasteCategory.household => 'Household waste',
    WasteCategory.officeBusiness => 'Office or business waste',
    WasteCategory.other => 'Other',
  };
}

extension CollectionScheduleTypeValue on CollectionScheduleType {
  String get wireValue => switch (this) {
    CollectionScheduleType.customerSelected => 'customerSelected',
    CollectionScheduleType.quotationPending => 'quotationPending',
  };
}

extension CollectionFrequencyLabel on CollectionFrequency {
  String get wireValue => switch (this) {
    CollectionFrequency.once => 'once',
    CollectionFrequency.weekly => 'weekly',
    CollectionFrequency.twiceWeekly => 'twiceWeekly',
    CollectionFrequency.monthly => 'monthly',
  };

  String get label => switch (this) {
    CollectionFrequency.once => 'Once',
    CollectionFrequency.weekly => 'Weekly',
    CollectionFrequency.twiceWeekly => 'Twice weekly',
    CollectionFrequency.monthly => 'Monthly',
  };
}

extension CollectionStatusLabel on CollectionStatus {
  String get wireValue => switch (this) {
    CollectionStatus.quotationRequested => 'quotationRequested',
    CollectionStatus.pending => 'pending',
    CollectionStatus.confirmed => 'confirmed',
    CollectionStatus.assigned => 'assigned',
    CollectionStatus.onTheWay => 'onTheWay',
    CollectionStatus.arrived => 'arrived',
    CollectionStatus.inProgress => 'inProgress',
    CollectionStatus.completed => 'completed',
    CollectionStatus.missed => 'missed',
    CollectionStatus.cancelled => 'cancelled',
  };

  String get label => switch (this) {
    CollectionStatus.quotationRequested => 'Quotation requested',
    CollectionStatus.pending => 'Pending',
    CollectionStatus.confirmed => 'Confirmed',
    CollectionStatus.assigned => 'Collector assigned',
    CollectionStatus.onTheWay => 'Collector on the way',
    CollectionStatus.arrived => 'Collector arrived',
    CollectionStatus.inProgress => 'In progress',
    CollectionStatus.completed => 'Completed',
    CollectionStatus.missed => 'Missed',
    CollectionStatus.cancelled => 'Cancelled',
  };
}

extension CollectionPaymentStatusLabel on CollectionPaymentStatus {
  String get wireValue => switch (this) {
    CollectionPaymentStatus.unpaid => 'unpaid',
    CollectionPaymentStatus.pending => 'pending',
    CollectionPaymentStatus.paid => 'paid',
    CollectionPaymentStatus.failed => 'failed',
    CollectionPaymentStatus.refunded => 'refunded',
  };

  String get label => switch (this) {
    CollectionPaymentStatus.unpaid => 'Unpaid',
    CollectionPaymentStatus.pending => 'Payment pending',
    CollectionPaymentStatus.paid => 'Paid',
    CollectionPaymentStatus.failed => 'Payment failed',
    CollectionPaymentStatus.refunded => 'Refunded',
  };
}

extension CollectionQuotationStatusLabel on CollectionQuotationStatus {
  String get wireValue => switch (this) {
    CollectionQuotationStatus.notRequired => 'notRequired',
    CollectionQuotationStatus.requested => 'requested',
    CollectionQuotationStatus.underReview => 'underReview',
    CollectionQuotationStatus.quoted => 'quoted',
    CollectionQuotationStatus.accepted => 'accepted',
    CollectionQuotationStatus.rejected => 'rejected',
    CollectionQuotationStatus.expired => 'expired',
  };

  String get label => switch (this) {
    CollectionQuotationStatus.notRequired => 'Not required',
    CollectionQuotationStatus.requested => 'Quotation requested',
    CollectionQuotationStatus.underReview => 'Under review',
    CollectionQuotationStatus.quoted => 'Quotation ready',
    CollectionQuotationStatus.accepted => 'Quotation accepted',
    CollectionQuotationStatus.rejected => 'Quotation rejected',
    CollectionQuotationStatus.expired => 'Quotation expired',
  };
}

class CollectionAddressSnapshot {
  const CollectionAddressSnapshot({
    required this.label,
    required this.addressLine,
    required this.city,
    required this.district,
    required this.latitude,
    required this.longitude,
  });

  factory CollectionAddressSnapshot.fromAddress(Address address) {
    return CollectionAddressSnapshot(
      label: address.label,
      addressLine: address.street,
      city: address.city,
      district: address.region,
      latitude: address.latitude,
      longitude: address.longitude,
    );
  }

  final String label;
  final String addressLine;
  final String city;
  final String district;
  final double? latitude;
  final double? longitude;

  String get formattedAddress {
    return [
      addressLine,
      district,
      city,
    ].where((part) => part.trim().isNotEmpty).join(', ');
  }

  Address toAddress({
    required String id,
    required String serviceZone,
    bool isWithinServiceArea = true,
  }) {
    return Address(
      id: id,
      label: label,
      street: addressLine,
      city: city,
      region: district,
      country: 'Cameroon',
      latitude: latitude,
      longitude: longitude,
      serviceZone: serviceZone,
      isWithinServiceArea: isWithinServiceArea,
    );
  }
}

class CollectionPricing {
  const CollectionPricing({
    required this.currency,
    required this.baseAmount,
    required this.includedBagCount,
    required this.extraBagCount,
    required this.extraBagRate,
    required this.extraBagAmount,
    required this.serviceFee,
    required this.discount,
    required this.totalAmount,
    required this.pricingVersion,
    required this.calculationSource,
  });

  final String currency;
  final int? baseAmount;
  final int includedBagCount;
  final int extraBagCount;
  final int extraBagRate;
  final int extraBagAmount;
  final int serviceFee;
  final int discount;
  final int? totalAmount;
  final String pricingVersion;
  final String calculationSource;

  bool get hasFinalAmount => totalAmount != null;
}

class CollectionBookingRequest {
  const CollectionBookingRequest({
    required this.requestId,
    required this.addressId,
    required this.bookingMode,
    required this.wasteCategory,
    this.scheduledDate,
    this.scheduledTimeWindow,
    this.frequency = CollectionFrequency.once,
    this.declaredBagCount,
    this.photoStoragePaths = const [],
    this.customerNotes = '',
  });

  final String requestId;
  final String addressId;
  final CollectionBookingMode bookingMode;
  final WasteCategory wasteCategory;
  final DateTime? scheduledDate;
  final CollectionTimeWindow? scheduledTimeWindow;
  final CollectionFrequency frequency;
  final int? declaredBagCount;
  final List<String> photoStoragePaths;
  final String customerNotes;

  CollectionType get collectionType => bookingMode.collectionType;
  CollectionScheduleType get scheduleType =>
      bookingMode == CollectionBookingMode.oneTimePhotoQuote
      ? CollectionScheduleType.quotationPending
      : CollectionScheduleType.customerSelected;
}

class CollectionBookingResult {
  const CollectionBookingResult({
    required this.collection,
    required this.wasDuplicate,
  });

  final WasteCollection collection;
  final bool wasDuplicate;
}

class WasteCollection {
  const WasteCollection({
    required this.id,
    required this.customerId,
    required this.addressId,
    required this.addressSnapshot,
    required this.serviceZone,
    required this.bookingMode,
    required this.collectionType,
    required this.wasteCategory,
    required this.scheduleType,
    required this.scheduledDate,
    required this.scheduledTimeWindow,
    required this.frequency,
    required this.status,
    required this.paymentStatus,
    required this.pricing,
    required this.declaredBagCount,
    required this.includedBagCount,
    required this.extraBagCount,
    required this.extraBagRate,
    required this.quotationStatus,
    required this.quotedAmount,
    required this.quotationReviewedBy,
    required this.quotationReviewedAt,
    required this.quotationAcceptedAt,
    required this.photoStoragePaths,
    required this.customerNotes,
    required this.createdAt,
    required this.updatedAt,
    this.subscriptionId,
    this.includedInSubscription = false,
    this.assignedWorkerId,
    this.onTheWayAt,
    this.arrivedAt,
    this.startedAt,
    this.missedAt,
    this.missedReason,
    this.cancelledAt,
    this.completedAt,
  });

  final String id;
  final String customerId;
  final String addressId;
  final CollectionAddressSnapshot addressSnapshot;
  final String serviceZone;
  final CollectionBookingMode bookingMode;
  final CollectionType collectionType;
  final WasteCategory wasteCategory;
  final CollectionScheduleType scheduleType;
  final DateTime? scheduledDate;
  final CollectionTimeWindow? scheduledTimeWindow;
  final CollectionFrequency frequency;
  final CollectionStatus status;
  final CollectionPaymentStatus paymentStatus;
  final CollectionPricing pricing;
  final int? declaredBagCount;
  final int includedBagCount;
  final int extraBagCount;
  final int extraBagRate;
  final CollectionQuotationStatus quotationStatus;
  final int? quotedAmount;
  final String? quotationReviewedBy;
  final DateTime? quotationReviewedAt;
  final DateTime? quotationAcceptedAt;
  final List<String> photoStoragePaths;
  final String? subscriptionId;
  final bool includedInSubscription;
  final String customerNotes;
  final String? assignedWorkerId;
  final DateTime? onTheWayAt;
  final DateTime? arrivedAt;
  final DateTime? startedAt;
  final DateTime? missedAt;
  final String? missedReason;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? cancelledAt;
  final DateTime? completedAt;

  Address get address =>
      addressSnapshot.toAddress(id: addressId, serviceZone: serviceZone);

  String get timeWindow => scheduledTimeWindow?.label ?? 'Schedule pending';

  int? get displayAmount => quotedAmount ?? pricing.totalAmount;

  bool get isQuotationPending =>
      bookingMode == CollectionBookingMode.oneTimePhotoQuote &&
      (quotationStatus == CollectionQuotationStatus.requested ||
          quotationStatus == CollectionQuotationStatus.underReview);

  bool get canAcceptQuotation =>
      quotationStatus == CollectionQuotationStatus.quoted &&
      quotedAmount != null &&
      quotedAmount! > 0;

  bool get isUpcoming =>
      status == CollectionStatus.quotationRequested ||
      status == CollectionStatus.pending ||
      status == CollectionStatus.confirmed ||
      status == CollectionStatus.assigned ||
      status == CollectionStatus.onTheWay ||
      status == CollectionStatus.arrived ||
      status == CollectionStatus.inProgress;

  bool get canCancel =>
      status == CollectionStatus.quotationRequested ||
      status == CollectionStatus.pending ||
      status == CollectionStatus.confirmed;

  WasteCollection copyWith({
    CollectionStatus? status,
    CollectionPaymentStatus? paymentStatus,
    CollectionQuotationStatus? quotationStatus,
    int? quotedAmount,
    DateTime? quotationAcceptedAt,
    DateTime? scheduledDate,
    CollectionTimeWindow? scheduledTimeWindow,
    DateTime? updatedAt,
    DateTime? onTheWayAt,
    DateTime? arrivedAt,
    DateTime? startedAt,
    DateTime? missedAt,
    String? missedReason,
    DateTime? cancelledAt,
    DateTime? completedAt,
  }) {
    return WasteCollection(
      id: id,
      customerId: customerId,
      addressId: addressId,
      addressSnapshot: addressSnapshot,
      serviceZone: serviceZone,
      bookingMode: bookingMode,
      collectionType: collectionType,
      wasteCategory: wasteCategory,
      scheduleType: scheduleType,
      scheduledDate: scheduledDate ?? this.scheduledDate,
      scheduledTimeWindow: scheduledTimeWindow ?? this.scheduledTimeWindow,
      frequency: frequency,
      status: status ?? this.status,
      paymentStatus: paymentStatus ?? this.paymentStatus,
      pricing: pricing,
      declaredBagCount: declaredBagCount,
      includedBagCount: includedBagCount,
      extraBagCount: extraBagCount,
      extraBagRate: extraBagRate,
      quotationStatus: quotationStatus ?? this.quotationStatus,
      quotedAmount: quotedAmount ?? this.quotedAmount,
      quotationReviewedBy: quotationReviewedBy,
      quotationReviewedAt: quotationReviewedAt,
      quotationAcceptedAt: quotationAcceptedAt ?? this.quotationAcceptedAt,
      photoStoragePaths: photoStoragePaths,
      subscriptionId: subscriptionId,
      includedInSubscription: includedInSubscription,
      customerNotes: customerNotes,
      assignedWorkerId: assignedWorkerId,
      onTheWayAt: onTheWayAt ?? this.onTheWayAt,
      arrivedAt: arrivedAt ?? this.arrivedAt,
      startedAt: startedAt ?? this.startedAt,
      missedAt: missedAt ?? this.missedAt,
      missedReason: missedReason ?? this.missedReason,
      createdAt: createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      cancelledAt: cancelledAt ?? this.cancelledAt,
      completedAt: completedAt ?? this.completedAt,
    );
  }
}
