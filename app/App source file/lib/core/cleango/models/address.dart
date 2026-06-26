class Address {
  const Address({
    required this.id,
    required this.label,
    required this.street,
    required this.city,
    required this.region,
    required this.country,
    required this.latitude,
    required this.longitude,
    required this.serviceZone,
    required this.isWithinServiceArea,
    this.isPrimary = false,
  });

  final String id;
  final String label;
  final String street;
  final String city;
  final String region;
  final String country;
  final double latitude;
  final double longitude;
  final String serviceZone;
  final bool isWithinServiceArea;
  final bool isPrimary;

  String get formattedAddress => '$street, $city, $country';

  Address copyWith({
    String? id,
    String? label,
    String? street,
    String? city,
    String? region,
    String? country,
    double? latitude,
    double? longitude,
    String? serviceZone,
    bool? isWithinServiceArea,
    bool? isPrimary,
  }) {
    return Address(
      id: id ?? this.id,
      label: label ?? this.label,
      street: street ?? this.street,
      city: city ?? this.city,
      region: region ?? this.region,
      country: country ?? this.country,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      serviceZone: serviceZone ?? this.serviceZone,
      isWithinServiceArea: isWithinServiceArea ?? this.isWithinServiceArea,
      isPrimary: isPrimary ?? this.isPrimary,
    );
  }
}
