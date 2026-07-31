import 'package:flutter/material.dart';
import 'package:ultrawash/core/cleango/di/cleango_service_locator.dart';
import 'package:ultrawash/core/cleango/models/collection.dart';
import 'package:ultrawash/core/cleango/models/subscription.dart';
import 'package:ultrawash/core/cleango/repositories/collection_repository.dart';
import 'package:ultrawash/core/cleango/repositories/customer_repository.dart';
import 'package:ultrawash/core/cleango/repositories/subscription_repository.dart';
import 'package:ultrawash/core/cleango/session/current_customer_provider.dart';

class HomeTabController {
  HomeTabController({
    required this.currentCustomerProvider,
    required this.customerRepository,
    required this.subscriptionRepository,
    required this.collectionRepository,
  });

  factory HomeTabController.mock() {
    final dependencies = CleanGoServiceLocator.instance.dashboardDependencies;
    return HomeTabController(
      currentCustomerProvider: dependencies.currentCustomerProvider,
      customerRepository: dependencies.customerRepository,
      subscriptionRepository: dependencies.subscriptionRepository,
      collectionRepository: dependencies.collectionRepository,
    );
  }

  final CurrentCustomerProvider currentCustomerProvider;
  final CustomerRepository customerRepository;
  final SubscriptionRepository subscriptionRepository;
  final CollectionRepository collectionRepository;

  Future<HomeTabViewData> load() async {
    final customerId = await currentCustomerProvider.getCurrentCustomerId();
    if (customerId == null || customerId.isEmpty) {
      return HomeTabViewData.empty();
    }

    final customer = await customerRepository.getCustomerById(customerId);
    if (customer == null) {
      return HomeTabViewData.empty();
    }

    Subscription? subscription;
    try {
      subscription = await subscriptionRepository.getActiveSubscription(
        customer.id,
      );
    } catch (_) {
      subscription = null;
    }

    var upcomingCollections = <WasteCollection>[];
    try {
      upcomingCollections = List<WasteCollection>.of(
        await collectionRepository.getUpcomingCollections(customer.id),
      );
    } catch (_) {
      upcomingCollections = <WasteCollection>[];
    }

    var collectionHistory = <WasteCollection>[];
    try {
      collectionHistory = List<WasteCollection>.of(
        await collectionRepository.getCollectionHistory(customer.id),
      );
    } catch (_) {
      collectionHistory = <WasteCollection>[];
    }

    upcomingCollections.sort(
      (left, right) => (left.scheduledDate ?? left.createdAt).compareTo(
        right.scheduledDate ?? right.createdAt,
      ),
    );
    collectionHistory.sort(
      (left, right) => (right.scheduledDate ?? right.createdAt).compareTo(
        left.scheduledDate ?? left.createdAt,
      ),
    );

    final nextCollection = upcomingCollections.isEmpty
        ? null
        : upcomingCollections.first;

    return HomeTabViewData(
      customerName: _firstName(customer.fullName),
      avatarUrl: customer.avatarUrl,
      serviceArea: customer.serviceArea,
      subscriptionPlanName: subscription == null
          ? 'No active plan'
          : _subscriptionPlanLabel(subscription.plan),
      renewalDateLabel: subscription?.renewalDate == null
          ? 'Not scheduled'
          : _dateLabel(subscription!.renewalDate!, includeYear: true),
      remainingPickups: subscription?.remainingCollections ?? 0,
      nextCollectionDateLabel: nextCollection?.scheduledDate == null
          ? nextCollection?.isQuotationPending == true
                ? 'Quotation review pending'
                : 'No collection scheduled'
          : _dateLabel(nextCollection!.scheduledDate!),
      nextCollectionStatusLabel: nextCollection == null
          ? 'Pending'
          : _collectionStatusLabel(nextCollection.status),
      nextCollectionAddress:
          nextCollection?.address.formattedAddress ??
          customer.primaryAddress.formattedAddress,
      recentActivities: collectionHistory
          .take(3)
          .map(_recentActivityFromCollection)
          .toList(growable: false),
    );
  }

  static String _firstName(String fullName) {
    final parts = fullName.trim().split(RegExp(r'\s+'));
    return parts.isEmpty || parts.first.isEmpty ? 'Customer' : parts.first;
  }

  static String _subscriptionPlanLabel(SubscriptionPlan plan) {
    switch (plan) {
      case SubscriptionPlan.basic:
        return 'Basic Plan';
      case SubscriptionPlan.standard:
        return 'Standard Plan';
      case SubscriptionPlan.popular:
        return 'Popular Plan';
      case SubscriptionPlan.premium:
        return 'Premium Plan';
      case SubscriptionPlan.apartmentsHotels:
        return 'Apartments & Hotels';
      case SubscriptionPlan.business:
        return 'Business Plan';
      case SubscriptionPlan.enterprise:
        return 'Enterprise Plan';
    }
  }

  static String _collectionStatusLabel(CollectionStatus status) => status.label;

  static String _wasteCategoryLabel(WasteCategory category) => category.label;

  static HomeRecentActivityViewData _recentActivityFromCollection(
    WasteCollection collection,
  ) {
    final status = collection.status;
    return HomeRecentActivityViewData(
      title: status == CollectionStatus.missed
          ? 'Collection missed'
          : status == CollectionStatus.completed
          ? 'Collection completed'
          : 'Collection updated',
      subtitle: _wasteCategoryLabel(collection.wasteCategory),
      dateLabel: _shortDateLabel(
        collection.completedAt ??
            collection.scheduledDate ??
            collection.createdAt,
      ),
      icon: status == CollectionStatus.missed
          ? Icons.report_problem_outlined
          : Icons.check_circle_outline,
    );
  }

  static String _dateLabel(DateTime date, {bool includeYear = false}) {
    final label =
        '${_weekdayName(date.weekday)}, ${date.day} ${_monthName(date.month)}';
    return includeYear ? '$label ${date.year}' : label;
  }

  static String _shortDateLabel(DateTime date) {
    return '${date.day} ${_monthName(date.month)}';
  }

  static String _weekdayName(int weekday) {
    const names = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];
    return names[weekday - 1];
  }

  static String _monthName(int month) {
    const names = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return names[month - 1];
  }
}

class HomeTabViewData {
  const HomeTabViewData({
    required this.customerName,
    required this.serviceArea,
    required this.subscriptionPlanName,
    required this.renewalDateLabel,
    required this.remainingPickups,
    required this.nextCollectionDateLabel,
    required this.nextCollectionStatusLabel,
    required this.nextCollectionAddress,
    required this.recentActivities,
    this.avatarUrl,
  });

  factory HomeTabViewData.empty() {
    return const HomeTabViewData(
      customerName: 'Customer',
      serviceArea: 'Service area pending',
      subscriptionPlanName: 'No active plan',
      renewalDateLabel: 'Not scheduled',
      remainingPickups: 0,
      nextCollectionDateLabel: 'No collection scheduled',
      nextCollectionStatusLabel: 'Pending',
      nextCollectionAddress: 'Address pending',
      recentActivities: [],
    );
  }

  final String customerName;
  final String serviceArea;
  final String? avatarUrl;
  final String subscriptionPlanName;
  final String renewalDateLabel;
  final int remainingPickups;
  final String nextCollectionDateLabel;
  final String nextCollectionStatusLabel;
  final String nextCollectionAddress;
  final List<HomeRecentActivityViewData> recentActivities;
}

class HomeRecentActivityViewData {
  const HomeRecentActivityViewData({
    required this.title,
    required this.subtitle,
    required this.dateLabel,
    required this.icon,
  });

  final String title;
  final String subtitle;
  final String dateLabel;
  final IconData icon;
}
