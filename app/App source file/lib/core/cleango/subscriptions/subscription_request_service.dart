import 'dart:convert';
import 'dart:math';

import 'package:crypto/crypto.dart';
import 'package:ultrawash/core/cleango/collections/collection_pricing_service.dart';
import 'package:ultrawash/core/cleango/models/address.dart';
import 'package:ultrawash/core/cleango/models/subscription.dart';
import 'package:ultrawash/core/cleango/subscriptions/subscription_pricing_catalogue.dart';

abstract interface class SubscriptionRequestStore {
  Future<Address?> getOwnedSubscriptionAddress({
    required String customerId,
    required String addressId,
  });

  Future<SubscriptionRequestResult> createOrGetSubscription(
    SubscriptionRequestDraft draft,
  );
}

class SubscriptionRequestDraft {
  const SubscriptionRequestDraft({
    required this.documentId,
    required this.customerId,
    required this.plan,
    required this.addressId,
    required this.addressSnapshot,
    required this.status,
    required this.paymentStatus,
    required this.billingCycle,
  });

  final String documentId;
  final String customerId;
  final SubscriptionPlanDefinition plan;
  final String addressId;
  final SubscriptionAddressSnapshot addressSnapshot;
  final SubscriptionStatus status;
  final SubscriptionPaymentStatus paymentStatus;
  final SubscriptionBillingCycle billingCycle;
}

class SubscriptionRequestException implements Exception {
  const SubscriptionRequestException(this.code, this.message);

  final String code;
  final String message;

  @override
  String toString() => message;
}

class SubscriptionRequestService {
  const SubscriptionRequestService({required SubscriptionRequestStore store})
    : _store = store;

  final SubscriptionRequestStore _store;

  Future<SubscriptionRequestResult> request({
    required String customerId,
    required SubscriptionRequest request,
  }) async {
    if (customerId.trim().isEmpty) {
      throw const SubscriptionRequestException(
        'authentication-required',
        'Sign in before requesting a subscription.',
      );
    }
    if (request.requestId.trim().isEmpty) {
      throw const SubscriptionRequestException(
        'invalid-request',
        'Start a new subscription request and try again.',
      );
    }

    late final SubscriptionPlanDefinition plan;
    try {
      plan = SubscriptionPricingCatalogue.requirePlan(request.planId);
    } on ArgumentError {
      throw const SubscriptionRequestException(
        'invalid-plan',
        'Select an active CLEANGO subscription plan.',
      );
    }

    final address = await _store.getOwnedSubscriptionAddress(
      customerId: customerId,
      addressId: request.addressId,
    );
    if (address == null) {
      throw const SubscriptionRequestException(
        'address-not-found',
        'Select one of your saved addresses.',
      );
    }
    if (!address.isWithinServiceArea ||
        address.serviceZone != CollectionPricingService.supportedServiceZone) {
      throw const SubscriptionRequestException(
        'unsupported-service-zone',
        'CLEANGO subscriptions are not available at this address yet.',
      );
    }

    final status = plan.requiresQuotation
        ? SubscriptionStatus.pendingReview
        : SubscriptionStatus.pendingPayment;
    final billingCycle = plan.requiresQuotation
        ? SubscriptionBillingCycle.flexibleReview
        : SubscriptionBillingCycle.monthly;

    return _store.createOrGetSubscription(
      SubscriptionRequestDraft(
        documentId: documentId(
          customerId: customerId,
          requestId: request.requestId,
        ),
        customerId: customerId,
        plan: plan,
        addressId: address.id,
        addressSnapshot: SubscriptionAddressSnapshot.fromAddress(address),
        status: status,
        paymentStatus: SubscriptionPaymentStatus.unpaid,
        billingCycle: billingCycle,
      ),
    );
  }

  static String createRequestId([Random? random]) {
    final generator = random ?? Random.secure();
    final bytes = List<int>.generate(18, (_) => generator.nextInt(256));
    return base64UrlEncode(bytes).replaceAll('=', '');
  }

  static String documentId({
    required String customerId,
    required String requestId,
  }) {
    final digest = sha256.convert(utf8.encode('$customerId:$requestId'));
    return 'subscription_$digest';
  }
}
