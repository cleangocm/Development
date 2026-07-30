enum CustomerLocationPermission { granted, denied, deniedForever }

enum LocationReadinessFailure {
  servicesDisabled,
  permissionDenied,
  permissionDeniedForever,
}

class LocationReadiness {
  const LocationReadiness.ready() : failure = null;

  const LocationReadiness.manualEntry(this.failure);

  final LocationReadinessFailure? failure;

  bool get canUseCurrentLocation => failure == null;
  bool get manualEntryAvailable => true;
}

class LocationOnboardingPolicy {
  const LocationOnboardingPolicy();

  LocationReadiness evaluate({
    required bool servicesEnabled,
    required CustomerLocationPermission permission,
  }) {
    if (!servicesEnabled) {
      return const LocationReadiness.manualEntry(
        LocationReadinessFailure.servicesDisabled,
      );
    }
    return switch (permission) {
      CustomerLocationPermission.granted => const LocationReadiness.ready(),
      CustomerLocationPermission.denied => const LocationReadiness.manualEntry(
        LocationReadinessFailure.permissionDenied,
      ),
      CustomerLocationPermission.deniedForever =>
        const LocationReadiness.manualEntry(
          LocationReadinessFailure.permissionDeniedForever,
        ),
    };
  }
}
