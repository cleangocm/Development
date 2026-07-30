enum ServiceZoneFailure { unsupportedArea, missingLocation, inaccurateLocation }

class ServiceZoneResult {
  const ServiceZoneResult.supported({required this.zoneId, required this.city})
    : failure = null;

  const ServiceZoneResult.unsupported()
    : zoneId = null,
      city = null,
      failure = ServiceZoneFailure.unsupportedArea;

  const ServiceZoneResult.missingLocation()
    : zoneId = null,
      city = null,
      failure = ServiceZoneFailure.missingLocation;

  const ServiceZoneResult.inaccurateLocation()
    : zoneId = null,
      city = null,
      failure = ServiceZoneFailure.inaccurateLocation;

  final String? zoneId;
  final String? city;
  final ServiceZoneFailure? failure;

  bool get isSupported => zoneId != null;
}

class ServiceZoneValidator {
  const ServiceZoneValidator();

  static const yaoundeZoneId = 'yaounde';
  static const maximumAccuracyMeters = 500.0;

  ServiceZoneResult validateManualCity(String city) {
    final normalized = _normalize(city);
    if (normalized == 'yaounde') {
      return const ServiceZoneResult.supported(
        zoneId: yaoundeZoneId,
        city: 'Yaoundé',
      );
    }
    if (normalized.isEmpty) return const ServiceZoneResult.missingLocation();
    return const ServiceZoneResult.unsupported();
  }

  ServiceZoneResult validateCoordinates({
    required double? latitude,
    required double? longitude,
    double? accuracyMeters,
  }) {
    if (latitude == null || longitude == null) {
      return const ServiceZoneResult.missingLocation();
    }
    if (accuracyMeters != null &&
        (!accuracyMeters.isFinite ||
            accuracyMeters < 0 ||
            accuracyMeters > maximumAccuracyMeters)) {
      return const ServiceZoneResult.inaccurateLocation();
    }

    // Conservative V1 launch boundary around metropolitan Yaoundé.
    if (latitude >= 3.70 &&
        latitude <= 4.05 &&
        longitude >= 11.35 &&
        longitude <= 11.75) {
      return const ServiceZoneResult.supported(
        zoneId: yaoundeZoneId,
        city: 'Yaoundé',
      );
    }
    return const ServiceZoneResult.unsupported();
  }

  String _normalize(String value) {
    return value
        .trim()
        .toLowerCase()
        .replaceAll('é', 'e')
        .replaceAll(RegExp(r'[^a-z]'), '');
  }
}
