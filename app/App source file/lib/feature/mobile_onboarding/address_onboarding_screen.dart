import 'dart:async';

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:get/get.dart';
import 'package:ultrawash/core/cleango/onboarding/customer_address_service.dart';
import 'package:ultrawash/core/cleango/onboarding/location_onboarding_policy.dart';
import 'package:ultrawash/core/cleango/onboarding/service_zone_validator.dart';
import 'package:ultrawash/feature/customer_dashboard/customer_dashboard_shell.dart';

class AddressOnboardingScreen extends StatefulWidget {
  const AddressOnboardingScreen({super.key});

  @override
  State<AddressOnboardingScreen> createState() =>
      _AddressOnboardingScreenState();
}

class _AddressOnboardingScreenState extends State<AddressOnboardingScreen> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _address = TextEditingController();
  final _district = TextEditingController();
  final _city = TextEditingController(text: 'Yaoundé');
  final _service = CustomerAddressService();
  final _validator = const ServiceZoneValidator();
  final _locationPolicy = const LocationOnboardingPolicy();

  bool _saving = false;
  bool _locating = false;
  double? _latitude;
  double? _longitude;
  double? _accuracyMeters;
  String? _message;
  bool _unsupported = false;

  @override
  void dispose() {
    _name.dispose();
    _address.dispose();
    _district.dispose();
    _city.dispose();
    super.dispose();
  }

  Future<void> _useCurrentLocation() async {
    if (_locating || _saving) return;
    final proceed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Use your current location?'),
        content: const Text(
          'CLEANGO uses your location once to confirm that collection service is available. You can enter your address manually instead.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Enter manually'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Continue'),
          ),
        ],
      ),
    );
    if (proceed != true || !mounted) return;

    setState(() {
      _locating = true;
      _message = null;
      _unsupported = false;
    });
    try {
      final servicesEnabled = await Geolocator.isLocationServiceEnabled();
      if (!servicesEnabled) {
        _applyLocationReadiness(
          _locationPolicy.evaluate(
            servicesEnabled: false,
            permission: CustomerLocationPermission.denied,
          ),
        );
        return;
      }
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      final readiness = _locationPolicy.evaluate(
        servicesEnabled: true,
        permission: _customerLocationPermission(permission),
      );
      if (!readiness.canUseCurrentLocation) {
        _applyLocationReadiness(readiness);
        return;
      }
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 15),
        ),
      );
      final zone = _validator.validateCoordinates(
        latitude: position.latitude,
        longitude: position.longitude,
        accuracyMeters: position.accuracy,
      );
      if (zone.failure == ServiceZoneFailure.inaccurateLocation) {
        _setLocationMessage(
          'Your location is not accurate enough. Try again or enter your address manually.',
        );
        return;
      }
      if (!zone.isSupported) {
        _setUnsupportedArea();
        return;
      }
      setState(() {
        _latitude = position.latitude;
        _longitude = position.longitude;
        _accuracyMeters = position.accuracy;
        _city.text = zone.city!;
        _message = 'Location confirmed for the Yaoundé service zone.';
      });
    } on TimeoutException {
      _setLocationMessage(
        'Location timed out. Please try again or enter your address manually.',
      );
    } catch (_) {
      _setLocationMessage(
        'We could not determine your location. Please enter it manually.',
      );
    } finally {
      if (mounted) setState(() => _locating = false);
    }
  }

  void _setUnsupportedArea() {
    _setLocationMessage(
      'CLEANGO is not yet available in this area.\n'
      'CLEANGO n’est pas encore disponible dans cette zone.',
      unsupported: true,
    );
  }

  void _applyLocationReadiness(LocationReadiness readiness) {
    final message = switch (readiness.failure) {
      LocationReadinessFailure.servicesDisabled =>
        'Location services are off. Turn them on or enter your address manually.',
      LocationReadinessFailure.permissionDenied =>
        'Location permission was denied. You can continue with manual entry.',
      LocationReadinessFailure.permissionDeniedForever =>
        'Location permission is blocked in Settings. You can continue with manual entry.',
      null => null,
    };
    if (message != null) _setLocationMessage(message);
  }

  CustomerLocationPermission _customerLocationPermission(
    LocationPermission permission,
  ) {
    return switch (permission) {
      LocationPermission.denied ||
      LocationPermission.unableToDetermine => CustomerLocationPermission.denied,
      LocationPermission.deniedForever =>
        CustomerLocationPermission.deniedForever,
      LocationPermission.always ||
      LocationPermission.whileInUse => CustomerLocationPermission.granted,
    };
  }

  void _setLocationMessage(String message, {bool unsupported = false}) {
    if (!mounted) return;
    setState(() {
      _message = message;
      _unsupported = unsupported;
      _latitude = null;
      _longitude = null;
      _accuracyMeters = null;
    });
  }

  Future<void> _save() async {
    if (_saving || _locating || !_formKey.currentState!.validate()) return;
    final zone = _latitude != null
        ? _validator.validateCoordinates(
            latitude: _latitude,
            longitude: _longitude,
            accuracyMeters: _accuracyMeters,
          )
        : _validator.validateManualCity(_city.text);
    if (!zone.isSupported) {
      _setUnsupportedArea();
      return;
    }
    setState(() {
      _saving = true;
      _message = null;
      _unsupported = false;
    });
    try {
      await _service.saveDefaultAddress(
        CustomerAddressInput(
          label: 'Home',
          addressLine: _address.text,
          city: zone.city!,
          district: _district.text,
          latitude: _latitude,
          longitude: _longitude,
          serviceZone: zone.zoneId!,
          displayName: _name.text,
          accuracyMeters: _accuracyMeters,
        ),
      );
      if (!mounted) return;
      Get.offAll(() => const CleanGoCustomerDashboardShell());
    } on UnsupportedServiceAreaException {
      _setUnsupportedArea();
    } catch (_) {
      if (mounted) {
        setState(
          () => _message =
              'We could not save your address. Check your connection and retry.',
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Set up your service address')),
      body: SafeArea(
        child: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.all(24),
            children: [
              const Text(
                'CLEANGO currently serves approved areas in Yaoundé.',
                style: TextStyle(fontSize: 16),
              ),
              const SizedBox(height: 20),
              OutlinedButton.icon(
                onPressed: _locating || _saving ? null : _useCurrentLocation,
                icon: _locating
                    ? const SizedBox.square(
                        dimension: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.my_location),
                label: Text(
                  _locating ? 'Checking location...' : 'Use current location',
                ),
              ),
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 18),
                child: Row(
                  children: [
                    Expanded(child: Divider()),
                    Padding(
                      padding: EdgeInsets.symmetric(horizontal: 12),
                      child: Text('or enter manually'),
                    ),
                    Expanded(child: Divider()),
                  ],
                ),
              ),
              TextFormField(
                controller: _name,
                textCapitalization: TextCapitalization.words,
                decoration: const InputDecoration(labelText: 'Full name'),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _address,
                textCapitalization: TextCapitalization.words,
                decoration: const InputDecoration(
                  labelText: 'Address line',
                  hintText: 'Street, landmark, or building',
                ),
                validator: (value) => value == null || value.trim().isEmpty
                    ? 'Enter your address.'
                    : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _district,
                textCapitalization: TextCapitalization.words,
                decoration: const InputDecoration(
                  labelText: 'District or neighborhood',
                ),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _city,
                textCapitalization: TextCapitalization.words,
                decoration: const InputDecoration(labelText: 'City'),
                onChanged: (_) {
                  _latitude = null;
                  _longitude = null;
                  _accuracyMeters = null;
                },
                validator: (value) => value == null || value.trim().isEmpty
                    ? 'Enter your city.'
                    : null,
              ),
              if (_message != null) ...[
                const SizedBox(height: 16),
                Semantics(
                  liveRegion: true,
                  child: Text(
                    _message!,
                    style: TextStyle(
                      color: _unsupported
                          ? Colors.deepOrange
                          : Theme.of(context).colorScheme.primary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 24),
              FilledButton(
                onPressed: _saving || _locating ? null : _save,
                child: _saving
                    ? const SizedBox.square(
                        dimension: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Save address and continue'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
