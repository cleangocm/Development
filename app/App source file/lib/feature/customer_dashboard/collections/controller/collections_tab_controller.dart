import 'package:ultrawash/core/cleango/collections/collection_booking_service.dart';
import 'package:ultrawash/core/cleango/collections/collection_schedule_service.dart';
import 'package:ultrawash/core/cleango/di/cleango_service_locator.dart';
import 'package:ultrawash/core/cleango/models/address.dart';
import 'package:ultrawash/core/cleango/models/collection.dart';
import 'package:ultrawash/core/cleango/repositories/collection_repository.dart';
import 'package:ultrawash/core/cleango/session/current_customer_provider.dart';
import 'package:ultrawash/core/cleango/storage/collection_quote_image_storage.dart';

class CollectionsTabController {
  CollectionsTabController({
    required this.currentCustomerProvider,
    required this.collectionRepository,
    this.collectionQuoteImageStorage,
    CollectionScheduleService scheduleService =
        const CollectionScheduleService(),
  }) : _scheduleService = scheduleService;

  factory CollectionsTabController.mock() {
    final dependencies = CleanGoServiceLocator.instance.dashboardDependencies;
    return CollectionsTabController(
      currentCustomerProvider: dependencies.currentCustomerProvider,
      collectionRepository: dependencies.collectionRepository,
      collectionQuoteImageStorage: dependencies.collectionQuoteImageStorage,
    );
  }

  final CurrentCustomerProvider currentCustomerProvider;
  final CollectionRepository collectionRepository;
  final CollectionQuoteImageStorage? collectionQuoteImageStorage;
  final CollectionScheduleService _scheduleService;

  List<CollectionTimeWindow> get timeWindows => _scheduleService.timeWindows;

  bool get photoQuotationEnabled => collectionQuoteImageStorage != null;

  int get maxQuoteImageCount => collectionQuoteImageStorage?.maxImageCount ?? 0;

  int get maxQuoteImageBytes =>
      collectionQuoteImageStorage?.maxFileSizeBytes ?? 0;

  Set<String> get supportedQuoteImageExtensions =>
      collectionQuoteImageStorage?.supportedExtensions ?? const {};

  String createRequestId() => CollectionBookingService.createRequestId();

  DateTime firstAvailableDate() => _scheduleService.firstAvailableDate();

  bool isAvailableDate(DateTime date) => _scheduleService.isAvailableDate(date);

  Future<CollectionsTabViewData> load() async {
    final customerId = await _customerId();
    if (customerId == null) return CollectionsTabViewData.empty();

    final upcoming = await collectionRepository.getUpcomingCollections(
      customerId,
    );
    final history = await collectionRepository.getCollectionHistory(customerId);

    final sortedUpcoming = [...upcoming]
      ..sort((left, right) => _sortDate(left).compareTo(_sortDate(right)));
    final sortedHistory = [...history]
      ..sort((left, right) => right.createdAt.compareTo(left.createdAt));

    return CollectionsTabViewData(
      upcomingCollections: List.unmodifiable(sortedUpcoming),
      collectionHistory: List.unmodifiable(sortedHistory),
    );
  }

  Future<CollectionBookingViewData> loadBooking() async {
    final customerId = await _customerId();
    if (customerId == null) {
      return CollectionBookingViewData.empty(
        firstAvailableDate: firstAvailableDate(),
      );
    }
    final addresses = await collectionRepository.getSavedAddresses(customerId);
    return CollectionBookingViewData(
      addresses: addresses,
      firstAvailableDate: firstAvailableDate(),
    );
  }

  CollectionPricing quoteBagCount({
    required Address address,
    required int declaredBagCount,
  }) {
    return collectionRepository.quoteCollection(
      bookingMode: CollectionBookingMode.oneTimeBagCount,
      declaredBagCount: declaredBagCount,
      serviceZone: address.serviceZone,
    );
  }

  CollectionPricing pendingPhotoQuote({required Address address}) {
    return collectionRepository.quoteCollection(
      bookingMode: CollectionBookingMode.oneTimePhotoQuote,
      declaredBagCount: null,
      serviceZone: address.serviceZone,
    );
  }

  Future<CollectionBookingResult> bookBagCount(
    CollectionBookingRequest request,
  ) async {
    await _requireCustomerId();
    if (request.bookingMode != CollectionBookingMode.oneTimeBagCount) {
      throw const CollectionBookingException(
        'invalid-booking-mode',
        'Use the bag-count booking form for this request.',
      );
    }
    return collectionRepository.bookCollection(request);
  }

  Future<CollectionBookingResult> bookPhotoQuotation({
    required String requestId,
    required String addressId,
    required WasteCategory wasteCategory,
    required List<CollectionQuoteImageInput> images,
    String customerNotes = '',
  }) async {
    final customerId = await _requireCustomerId();
    final storage = collectionQuoteImageStorage;
    if (storage == null) {
      throw const CollectionBookingException(
        'photo-storage-unavailable',
        'Photo quotations require Firebase data mode.',
      );
    }

    final bookingId = CollectionBookingService.bookingDocumentId(
      customerId: customerId,
      requestId: requestId,
    );
    final paths = await storage.uploadQuoteImages(
      bookingId: bookingId,
      images: images,
    );
    try {
      return await collectionRepository.bookCollection(
        CollectionBookingRequest(
          requestId: requestId,
          addressId: addressId,
          bookingMode: CollectionBookingMode.oneTimePhotoQuote,
          wasteCategory: wasteCategory,
          photoStoragePaths: paths,
          customerNotes: customerNotes,
        ),
      );
    } catch (error) {
      if (!_isAmbiguousCreateFailure(error)) {
        await storage.deleteQuoteImages(paths);
      }
      rethrow;
    }
  }

  Future<WasteCollection?> getById(String collectionId) {
    return collectionRepository.getCollectionById(collectionId);
  }

  Future<WasteCollection> cancel(String collectionId) {
    return collectionRepository.cancelCollection(collectionId);
  }

  Future<WasteCollection> acceptQuotation(String collectionId) {
    return collectionRepository.acceptQuotation(collectionId);
  }

  DateTime _sortDate(WasteCollection collection) {
    return collection.scheduledDate ?? collection.createdAt;
  }

  bool _isAmbiguousCreateFailure(Object error) {
    return error is CollectionBookingException &&
        const {
          'aborted',
          'deadline-exceeded',
          'unavailable',
          'unknown',
        }.contains(error.code);
  }

  Future<String> _requireCustomerId() async {
    final customerId = await _customerId();
    if (customerId == null) {
      throw const CollectionBookingException(
        'authentication-required',
        'Sign in before booking a collection.',
      );
    }
    return customerId;
  }

  Future<String?> _customerId() async {
    final customerId = await currentCustomerProvider.getCurrentCustomerId();
    if (customerId == null || customerId.isEmpty) return null;
    return customerId;
  }
}

class CollectionsTabViewData {
  const CollectionsTabViewData({
    required this.upcomingCollections,
    required this.collectionHistory,
  });

  factory CollectionsTabViewData.empty() {
    return const CollectionsTabViewData(
      upcomingCollections: [],
      collectionHistory: [],
    );
  }

  final List<WasteCollection> upcomingCollections;
  final List<WasteCollection> collectionHistory;
}

class CollectionBookingViewData {
  const CollectionBookingViewData({
    required this.addresses,
    required this.firstAvailableDate,
  });

  factory CollectionBookingViewData.empty({
    required DateTime firstAvailableDate,
  }) {
    return CollectionBookingViewData(
      addresses: const [],
      firstAvailableDate: firstAvailableDate,
    );
  }

  final List<Address> addresses;
  final DateTime firstAvailableDate;
}
