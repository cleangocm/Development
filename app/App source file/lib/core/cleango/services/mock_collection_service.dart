import 'package:ultrawash/core/cleango/models/address.dart';
import 'package:ultrawash/core/cleango/models/collection.dart';
import 'package:ultrawash/core/cleango/repositories/collection_repository.dart';

class MockCollectionService implements CollectionRepository {
  final List<WasteCollection> _collections = [
    WasteCollection(
      id: 'collection-demo-001',
      customerId: 'customer-demo-001',
      scheduledDate: DateTime(2026, 6, 27),
      timeWindow: '8:00 AM - 11:00 AM',
      wasteType: WasteType.household,
      address: _primaryAddress,
      status: CollectionStatus.collectorAssigned,
      collectorName: 'Jean Mbarga',
    ),
    WasteCollection(
      id: 'collection-demo-002',
      customerId: 'customer-demo-001',
      scheduledDate: DateTime(2026, 6, 20),
      timeWindow: '8:00 AM - 11:00 AM',
      wasteType: WasteType.household,
      address: _primaryAddress,
      status: CollectionStatus.completed,
      collectorName: 'Jean Mbarga',
      completedAt: DateTime(2026, 6, 20, 10, 15),
    ),
    WasteCollection(
      id: 'collection-demo-003',
      customerId: 'customer-demo-001',
      scheduledDate: DateTime(2026, 6, 13),
      timeWindow: '1:00 PM - 4:00 PM',
      wasteType: WasteType.recyclable,
      address: _primaryAddress,
      status: CollectionStatus.missed,
    ),
  ];

  static const _primaryAddress = Address(
    id: 'address-demo-001',
    label: 'Home',
    street: 'Bastos',
    city: 'Yaounde',
    region: 'Centre',
    country: 'Cameroon',
    latitude: 3.884,
    longitude: 11.502,
    serviceZone: 'Yaounde Central Zone',
    isWithinServiceArea: true,
    isPrimary: true,
  );

  @override
  Future<List<WasteCollection>> getUpcomingCollections(
    String customerId,
  ) async {
    return List.unmodifiable(
      _collections.where(
        (collection) =>
            collection.customerId == customerId && collection.isUpcoming,
      ),
    );
  }

  @override
  Future<List<WasteCollection>> getCollectionHistory(String customerId) async {
    return List.unmodifiable(
      _collections.where(
        (collection) =>
            collection.customerId == customerId && !collection.isUpcoming,
      ),
    );
  }

  @override
  Future<WasteCollection?> getCollectionById(String collectionId) async {
    for (final collection in _collections) {
      if (collection.id == collectionId) return collection;
    }
    return null;
  }

  @override
  Future<WasteCollection> reportMissedCollection(String collectionId) async {
    final collection = _requireCollection(collectionId);
    return _replace(collection.copyWith(status: CollectionStatus.missed));
  }

  @override
  Future<WasteCollection> rescheduleCollection(
    String collectionId,
    DateTime scheduledDate,
    String timeWindow,
  ) async {
    final collection = _requireCollection(collectionId);
    return _replace(
      collection.copyWith(
        scheduledDate: scheduledDate,
        timeWindow: timeWindow,
        status: CollectionStatus.scheduled,
      ),
    );
  }

  WasteCollection _requireCollection(String collectionId) {
    return _collections.firstWhere(
      (collection) => collection.id == collectionId,
      orElse: () => throw StateError('Collection not found: $collectionId'),
    );
  }

  WasteCollection _replace(WasteCollection collection) {
    final index = _collections.indexWhere((item) => item.id == collection.id);
    _collections[index] = collection;
    return collection;
  }
}
