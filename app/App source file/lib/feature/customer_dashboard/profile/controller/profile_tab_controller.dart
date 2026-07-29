import 'package:flutter/foundation.dart';

import 'package:ultrawash/core/cleango/models/customer.dart';
import 'package:ultrawash/core/cleango/di/cleango_service_locator.dart';
import 'package:ultrawash/core/cleango/models/subscription.dart';
import 'package:ultrawash/core/cleango/repositories/customer_repository.dart';
import 'package:ultrawash/core/cleango/repositories/subscription_repository.dart';
import 'package:ultrawash/core/cleango/session/current_customer_provider.dart';
import 'package:ultrawash/core/cleango/storage/profile_image_storage.dart';

class ProfileTabController {
  ProfileTabController({
    required this.currentCustomerProvider,
    required this.customerRepository,
    required this.subscriptionRepository,
    this.profileImageStorage,
  });

  factory ProfileTabController.mock() {
    final dependencies = CleanGoServiceLocator.instance.dashboardDependencies;
    return ProfileTabController(
      currentCustomerProvider: dependencies.currentCustomerProvider,
      customerRepository: dependencies.customerRepository,
      subscriptionRepository: dependencies.subscriptionRepository,
      profileImageStorage: dependencies.profileImageStorage,
    );
  }

  final CurrentCustomerProvider currentCustomerProvider;
  final CustomerRepository customerRepository;
  final SubscriptionRepository subscriptionRepository;
  final ProfileImageStorage? profileImageStorage;

  bool get canUploadProfileImage => profileImageStorage != null;

  int? get maxProfileImageBytes => profileImageStorage?.maxFileSizeBytes;

  Set<String> get supportedProfileImageExtensions =>
      profileImageStorage?.supportedExtensions ?? const <String>{};

  Future<ProfileTabViewData> uploadProfileImage({
    required Uint8List bytes,
    required String fileName,
  }) async {
    final storage = profileImageStorage;
    if (storage == null) {
      throw StateError('Profile image upload is not enabled.');
    }

    await storage.uploadCurrentCustomerAvatar(bytes: bytes, fileName: fileName);
    return load();
  }

  Future<ProfileTabViewData> load() async {
    final customerId = await currentCustomerProvider.getCurrentCustomerId();
    if (customerId == null || customerId.isEmpty) {
      return ProfileTabViewData.empty();
    }

    final customer = await customerRepository.getCustomerById(customerId);
    if (customer == null) return ProfileTabViewData.empty();

    Subscription? subscription;
    try {
      subscription = await subscriptionRepository.getActiveSubscription(
        customer.id,
      );
    } catch (_) {
      subscription = null;
    }

    return ProfileTabViewData(customer: customer, subscription: subscription);
  }
}

class ProfileTabViewData {
  const ProfileTabViewData({
    required this.customer,
    required this.subscription,
  });

  factory ProfileTabViewData.empty() {
    return const ProfileTabViewData(customer: null, subscription: null);
  }

  final Customer? customer;
  final Subscription? subscription;
}
