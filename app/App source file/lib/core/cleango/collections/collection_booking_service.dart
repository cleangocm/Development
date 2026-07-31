import 'dart:convert';
import 'dart:math';

import 'package:crypto/crypto.dart';
import 'package:ultrawash/core/cleango/collections/collection_booking_policy.dart';
import 'package:ultrawash/core/cleango/collections/collection_pricing_service.dart';
import 'package:ultrawash/core/cleango/collections/collection_schedule_service.dart';
import 'package:ultrawash/core/cleango/models/address.dart';
import 'package:ultrawash/core/cleango/models/collection.dart';

abstract interface class CollectionBookingStore {
  Future<Address?> getOwnedAddress({
    required String customerId,
    required String addressId,
  });

  Future<CollectionBookingResult> createOrGetCollection(
    CollectionBookingDraft draft,
  );
}

class CollectionBookingDraft {
  const CollectionBookingDraft({
    required this.documentId,
    required this.customerId,
    required this.addressId,
    required this.addressSnapshot,
    required this.serviceZone,
    required this.bookingMode,
    required this.collectionType,
    required this.wasteCategory,
    required this.scheduleType,
    required this.scheduledDateUtc,
    required this.scheduledTimeWindow,
    required this.frequency,
    required this.pricing,
    required this.declaredBagCount,
    required this.quotationStatus,
    required this.photoStoragePaths,
    required this.status,
    required this.customerNotes,
  });

  final String documentId;
  final String customerId;
  final String addressId;
  final CollectionAddressSnapshot addressSnapshot;
  final String serviceZone;
  final CollectionBookingMode bookingMode;
  final CollectionType collectionType;
  final WasteCategory wasteCategory;
  final CollectionScheduleType scheduleType;
  final DateTime? scheduledDateUtc;
  final CollectionTimeWindow? scheduledTimeWindow;
  final CollectionFrequency frequency;
  final CollectionPricing pricing;
  final int? declaredBagCount;
  final CollectionQuotationStatus quotationStatus;
  final List<String> photoStoragePaths;
  final CollectionStatus status;
  final String customerNotes;
}

class CollectionBookingException implements Exception {
  const CollectionBookingException(this.code, this.message);

  final String code;
  final String message;

  @override
  String toString() => message;
}

class CollectionBookingService {
  const CollectionBookingService({
    required CollectionBookingStore store,
    CollectionPricingService pricingService = const CollectionPricingService(),
    CollectionScheduleService scheduleService =
        const CollectionScheduleService(),
  }) : _store = store,
       _pricingService = pricingService,
       _scheduleService = scheduleService;

  final CollectionBookingStore _store;
  final CollectionPricingService _pricingService;
  final CollectionScheduleService _scheduleService;

  CollectionPricing quote({
    required CollectionBookingMode bookingMode,
    required int? declaredBagCount,
    required String serviceZone,
  }) {
    return switch (bookingMode) {
      CollectionBookingMode.oneTimeBagCount =>
        _pricingService.quoteOneTimeBagCount(
          declaredBagCount: declaredBagCount ?? 0,
          serviceZone: serviceZone,
        ),
      CollectionBookingMode.oneTimePhotoQuote =>
        _pricingService.pendingPhotoQuotation(serviceZone: serviceZone),
      CollectionBookingMode.subscription =>
        throw const CollectionPricingException(
          'Choose a CLEANGO plan from the subscription plan screen.',
        ),
    };
  }

  Future<CollectionBookingResult> book({
    required String customerId,
    required CollectionBookingRequest request,
    DateTime? nowUtc,
  }) async {
    if (customerId.trim().isEmpty) {
      throw const CollectionBookingException(
        'authentication-required',
        'Sign in before booking a collection.',
      );
    }
    if (request.requestId.trim().isEmpty) {
      throw const CollectionBookingException(
        'invalid-request',
        'Start a new booking and try again.',
      );
    }
    if (request.bookingMode == CollectionBookingMode.subscription) {
      throw const CollectionBookingException(
        'invalid-booking-mode',
        'Choose a CLEANGO plan from the subscription plan screen.',
      );
    }

    final address = await _store.getOwnedAddress(
      customerId: customerId,
      addressId: request.addressId,
    );
    if (address == null) {
      throw const CollectionBookingException(
        'address-not-found',
        'Select one of your saved addresses.',
      );
    }
    if (!address.isWithinServiceArea ||
        address.serviceZone != CollectionPricingService.supportedServiceZone) {
      throw const CollectionBookingException(
        'unsupported-service-zone',
        'CLEANGO collection is not available at this address yet.',
      );
    }

    final notes = request.customerNotes.trim();
    if (notes.length > CollectionBookingPolicy.maxCustomerNotesLength) {
      throw const CollectionBookingException(
        'notes-too-long',
        'Collection notes must be 500 characters or fewer.',
      );
    }

    final documentId = bookingDocumentId(
      customerId: customerId,
      requestId: request.requestId,
    );

    DateTime? scheduledDateUtc;
    CollectionPricing pricing;
    CollectionQuotationStatus quotationStatus;
    CollectionStatus status;
    try {
      if (request.bookingMode == CollectionBookingMode.oneTimeBagCount) {
        if (request.scheduledDate == null ||
            request.scheduledTimeWindow == null ||
            request.frequency != CollectionFrequency.once ||
            request.photoStoragePaths.isNotEmpty) {
          throw const CollectionBookingException(
            'invalid-bag-booking',
            'Choose a valid date, time, and 60L bag count.',
          );
        }
        scheduledDateUtc = _scheduleService.validateAndResolveUtc(
          date: request.scheduledDate!,
          timeWindow: request.scheduledTimeWindow!,
          nowUtc: nowUtc,
        );
        pricing = quote(
          bookingMode: request.bookingMode,
          declaredBagCount: request.declaredBagCount,
          serviceZone: address.serviceZone,
        );
        quotationStatus = CollectionQuotationStatus.notRequired;
        status = CollectionStatus.pending;
      } else {
        _validatePhotoPaths(
          customerId: customerId,
          documentId: documentId,
          paths: request.photoStoragePaths,
        );
        if (request.declaredBagCount != null ||
            request.scheduledDate != null ||
            request.scheduledTimeWindow != null ||
            request.frequency != CollectionFrequency.once) {
          throw const CollectionBookingException(
            'invalid-photo-quotation',
            'A photo quotation cannot include a client price or schedule.',
          );
        }
        pricing = quote(
          bookingMode: request.bookingMode,
          declaredBagCount: null,
          serviceZone: address.serviceZone,
        );
        quotationStatus = CollectionQuotationStatus.requested;
        status = CollectionStatus.quotationRequested;
      }
    } on CollectionScheduleException catch (error) {
      throw CollectionBookingException('invalid-schedule', error.message);
    } on CollectionPricingException catch (error) {
      throw CollectionBookingException('invalid-pricing', error.message);
    }

    return _store.createOrGetCollection(
      CollectionBookingDraft(
        documentId: documentId,
        customerId: customerId,
        addressId: address.id,
        addressSnapshot: CollectionAddressSnapshot.fromAddress(address),
        serviceZone: address.serviceZone,
        bookingMode: request.bookingMode,
        collectionType: request.collectionType,
        wasteCategory: request.wasteCategory,
        scheduleType: request.scheduleType,
        scheduledDateUtc: scheduledDateUtc,
        scheduledTimeWindow: request.scheduledTimeWindow,
        frequency: request.frequency,
        pricing: pricing,
        declaredBagCount: request.declaredBagCount,
        quotationStatus: quotationStatus,
        photoStoragePaths: List.unmodifiable(request.photoStoragePaths),
        status: status,
        customerNotes: notes,
      ),
    );
  }

  void _validatePhotoPaths({
    required String customerId,
    required String documentId,
    required List<String> paths,
  }) {
    if (paths.isEmpty ||
        paths.length > CollectionBookingPolicy.maxQuoteImageCount) {
      throw const CollectionBookingException(
        'invalid-photo-count',
        'Select between 1 and 4 quotation photos.',
      );
    }
    if (paths.toSet().length != paths.length) {
      throw const CollectionBookingException(
        'invalid-photo-path',
        'Quotation photo references must be unique.',
      );
    }
    final prefix = 'collection-quotes/$customerId/$documentId/';
    for (final path in paths) {
      final fileName = path.startsWith(prefix)
          ? path.substring(prefix.length)
          : '';
      if (fileName.isEmpty ||
          fileName.contains('/') ||
          fileName.contains('..')) {
        throw const CollectionBookingException(
          'invalid-photo-path',
          'A quotation photo does not belong to this booking.',
        );
      }
    }
  }

  static String createRequestId([Random? random]) {
    final generator = random ?? Random.secure();
    final bytes = List<int>.generate(18, (_) => generator.nextInt(256));
    return base64UrlEncode(bytes).replaceAll('=', '');
  }

  static String bookingDocumentId({
    required String customerId,
    required String requestId,
  }) {
    final digest = sha256.convert(utf8.encode('$customerId:$requestId'));
    return 'collection_$digest';
  }
}
