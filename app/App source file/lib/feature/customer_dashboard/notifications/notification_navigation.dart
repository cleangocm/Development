import 'package:flutter/material.dart';
import 'package:ultrawash/core/cleango/di/cleango_service_locator.dart';
import 'package:ultrawash/core/cleango/notifications/notification_destination.dart';
import 'package:ultrawash/feature/customer_dashboard/collections/collection_details_screen.dart';
import 'package:ultrawash/feature/customer_dashboard/collections/controller/collections_tab_controller.dart';
import 'package:ultrawash/feature/customer_dashboard/collections/subscription_management_screen.dart';
import 'package:ultrawash/feature/customer_dashboard/payments/payment_details_screen.dart';

class NotificationNavigator {
  const NotificationNavigator._();

  static Future<void> open(
    BuildContext context,
    NotificationDestination destination, {
    required VoidCallback openNotificationHistory,
  }) async {
    await _markReadSafely(destination.notificationId);
    if (!context.mounted) return;

    switch (destination.type) {
      case NotificationDestinationType.collection:
        final collectionId = destination.collectionId;
        if (collectionId == null) {
          openNotificationHistory();
          return;
        }
        final controller = CollectionsTabController.mock();
        final collection = await controller.getById(collectionId);
        if (!context.mounted) return;
        if (collection == null) {
          _showUnavailable(context, 'This collection is no longer available.');
          openNotificationHistory();
          return;
        }
        await Navigator.of(context).push<void>(
          MaterialPageRoute(
            builder: (_) => CollectionDetailsScreen(
              controller: controller,
              initialCollection: collection,
            ),
          ),
        );

      case NotificationDestinationType.payment:
        final paymentId = destination.paymentId;
        if (paymentId == null) {
          openNotificationHistory();
          return;
        }
        final payment = await CleanGoServiceLocator
            .instance
            .dashboardDependencies
            .paymentRepository
            .getPaymentById(paymentId);
        if (!context.mounted) return;
        if (payment == null) {
          _showUnavailable(context, 'This payment is no longer available.');
          openNotificationHistory();
          return;
        }
        await Navigator.of(context).push<void>(
          MaterialPageRoute(
            builder: (_) => PaymentDetailsScreen(payment: payment),
          ),
        );

      case NotificationDestinationType.subscription:
        await Navigator.of(context).push<void>(
          MaterialPageRoute(
            builder: (_) => const SubscriptionManagementScreen(),
          ),
        );

      case NotificationDestinationType.notifications:
        openNotificationHistory();
    }
  }

  static Future<void> _markReadSafely(String? notificationId) async {
    if (notificationId == null || notificationId.isEmpty) return;
    try {
      await CleanGoServiceLocator
          .instance
          .dashboardDependencies
          .notificationRepository
          .markAsRead(notificationId);
    } catch (_) {
      // Navigation remains available if history synchronization is delayed.
    }
  }

  static void _showUnavailable(BuildContext context, String message) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }
}
