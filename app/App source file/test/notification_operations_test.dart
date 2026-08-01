import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ultrawash/core/cleango/models/notification.dart';
import 'package:ultrawash/core/cleango/notifications/notification_destination.dart';
import 'package:ultrawash/core/cleango/services/mock_notification_service.dart';
import 'package:ultrawash/core/cleango/session/current_customer_provider.dart';
import 'package:ultrawash/feature/customer_dashboard/notifications/controller/notifications_tab_controller.dart';
import 'package:ultrawash/feature/customer_dashboard/notifications/notifications_tab.dart';

void main() {
  group('Canonical notification contract', () {
    const canonicalTypes = <String, CleanGoNotificationType>{
      'collection_reminder_tomorrow':
          CleanGoNotificationType.collectionReminderTomorrow,
      'collector_on_the_way': CleanGoNotificationType.collectorOnTheWay,
      'collector_arrived': CleanGoNotificationType.collectorArrived,
      'collection_completed': CleanGoNotificationType.collectionCompleted,
      'payment_received': CleanGoNotificationType.paymentReceived,
      'subscription_expiring_5_days':
          CleanGoNotificationType.subscriptionExpiringFiveDays,
    };

    for (final entry in canonicalTypes.entries) {
      test('parses and serializes ${entry.key}', () {
        expect(cleanGoNotificationTypeFromWire(entry.key), entry.value);
        expect(entry.value.wireValue, entry.key);
      });
    }

    test('unknown notification values fail safely', () {
      expect(
        cleanGoNotificationTypeFromWire('unsupported_event'),
        CleanGoNotificationType.unknown,
      );
      expect(
        cleanGoNotificationTypeFromWire(null),
        CleanGoNotificationType.unknown,
      );
    });
  });

  group('Notification destination routing', () {
    test('collection event opens collection details', () {
      final destination = NotificationDestination.fromData(const {
        'type': 'collector_arrived',
        'collectionId': 'collection-a',
      });

      expect(destination.type, NotificationDestinationType.collection);
      expect(destination.collectionId, 'collection-a');
    });

    test('booking and pickup IDs remain compatible collection aliases', () {
      expect(
        NotificationDestination.fromData(const {
          'type': 'collection_completed',
          'bookingId': 'booking-a',
        }).collectionId,
        'booking-a',
      );
      expect(
        NotificationDestination.fromData(const {
          'type': 'collector_on_the_way',
          'pickupId': 'pickup-a',
        }).collectionId,
        'pickup-a',
      );
    });

    test('payment event opens payment details', () {
      final destination = NotificationDestination.fromData(const {
        'type': 'payment_received',
        'paymentId': 'payment-a',
      });

      expect(destination.type, NotificationDestinationType.payment);
      expect(destination.paymentId, 'payment-a');
    });

    test('subscription expiry opens subscription details', () {
      final destination = NotificationDestination.fromData(const {
        'type': 'subscription_expiring_5_days',
        'subscriptionId': 'subscription-a',
      });

      expect(destination.type, NotificationDestinationType.subscription);
      expect(destination.subscriptionId, 'subscription-a');
    });

    test('missing target IDs open notification history safely', () {
      expect(
        NotificationDestination.fromData(const {
          'type': 'collector_arrived',
        }).type,
        NotificationDestinationType.notifications,
      );
      expect(
        NotificationDestination.fromData(const {
          'type': 'payment_received',
        }).type,
        NotificationDestinationType.notifications,
      );
    });

    test('malformed terminated-state payload opens history safely', () {
      final destination = NotificationDestination.fromPayload('not-json');

      expect(destination.type, NotificationDestinationType.notifications);
      expect(destination.notificationType, CleanGoNotificationType.unknown);
    });

    test('foreground/background payload round trip preserves routing', () {
      final original = NotificationDestination.fromData(const {
        'type': 'collection_completed',
        'notificationId': 'notification-a',
        'collectionId': 'collection-a',
      });
      final restored = NotificationDestination.fromPayload(
        original.toPayload(),
      );

      expect(restored.type, NotificationDestinationType.collection);
      expect(restored.notificationId, 'notification-a');
      expect(restored.collectionId, 'collection-a');
    });

    test('notification model fallback IDs produce the same destination', () {
      final destination = NotificationDestination.fromNotification(
        CleanGoNotification(
          id: 'notification-a',
          customerId: 'customer-a',
          title: 'Payment received',
          message: 'Your payment was received.',
          type: CleanGoNotificationType.paymentReceived,
          createdAt: DateTime.utc(2026, 7, 30),
          isRead: false,
          relatedEntityId: 'payment-a',
        ),
      );

      expect(destination.type, NotificationDestinationType.payment);
      expect(destination.paymentId, 'payment-a');
    });
  });

  testWidgets('notification tab reloads when its refresh token changes', (
    tester,
  ) async {
    final customerProvider = _CountingCurrentCustomerProvider();
    final controller = NotificationsTabController(
      currentCustomerProvider: customerProvider,
      notificationRepository: MockNotificationService(),
    );

    Widget buildTab(int refreshToken) {
      return MaterialApp(
        home: Scaffold(
          body: NotificationsTab(
            controller: controller,
            refreshToken: refreshToken,
          ),
        ),
      );
    }

    await tester.pumpWidget(buildTab(0));
    await tester.pumpAndSettle();
    expect(customerProvider.customerIdReads, 1);

    await tester.pumpWidget(buildTab(1));
    await tester.pumpAndSettle();
    expect(customerProvider.customerIdReads, 2);
    expect(find.text('Unable to load notifications'), findsNothing);
  });
}

class _CountingCurrentCustomerProvider implements CurrentCustomerProvider {
  int customerIdReads = 0;

  @override
  Future<String?> getCurrentCustomerId() async {
    customerIdReads += 1;
    return 'customer-demo-001';
  }

  @override
  Future<bool> isLoggedIn() async => true;

  @override
  Future<void> refresh() async {}
}
