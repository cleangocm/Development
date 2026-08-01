import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ultrawash/core/cleango/collections/collection_schedule_service.dart';
import 'package:ultrawash/core/cleango/collectors/collector.dart';
import 'package:ultrawash/core/cleango/collectors/collector_access_policy.dart';
import 'package:ultrawash/core/cleango/collectors/collector_status_policy.dart';
import 'package:ultrawash/core/cleango/models/collection.dart';
import 'package:ultrawash/core/cleango/repositories/collector_repository.dart';
import 'package:ultrawash/feature/collector_dashboard/collector_dashboard_screen.dart';
import 'package:ultrawash/feature/collector_dashboard/controller/collector_dashboard_controller.dart';
import 'package:ultrawash/feature/customer_dashboard/home/widgets/quick_actions_section.dart';

void main() {
  group('Collector access policy', () {
    test('normal customer stays in the customer application', () {
      expect(
        CollectorAccessPolicy.resolve(null),
        CollectorAccessDestination.customer,
      );
    });

    test('approved active collector reaches operations', () {
      expect(
        CollectorAccessPolicy.resolve(_collectorProfile()),
        CollectorAccessDestination.collectorDashboard,
      );
    });

    test('pending collector reaches review state', () {
      expect(
        CollectorAccessPolicy.resolve(
          _collectorProfile(approval: CollectorApprovalStatus.pending),
        ),
        CollectorAccessDestination.pendingReview,
      );
    });

    test('blocked or suspended collector cannot operate', () {
      expect(
        CollectorAccessPolicy.resolve(
          _collectorProfile(account: CollectorAccountStatus.blocked),
        ),
        CollectorAccessDestination.blocked,
      );
      expect(
        CollectorAccessPolicy.resolve(
          _collectorProfile(approval: CollectorApprovalStatus.suspended),
        ),
        CollectorAccessDestination.blocked,
      );
    });
  });

  group('Collector status policy', () {
    test('allows only the ordered operational sequence', () {
      expect(
        CollectorStatusPolicy.canTransition(
          CollectionStatus.assigned,
          CollectionStatus.onTheWay,
        ),
        isTrue,
      );
      expect(
        CollectorStatusPolicy.canTransition(
          CollectionStatus.onTheWay,
          CollectionStatus.arrived,
        ),
        isTrue,
      );
      expect(
        CollectorStatusPolicy.canTransition(
          CollectionStatus.arrived,
          CollectionStatus.inProgress,
        ),
        isTrue,
      );
      expect(
        CollectorStatusPolicy.canTransition(
          CollectionStatus.inProgress,
          CollectionStatus.completed,
        ),
        isTrue,
      );
      expect(
        CollectorStatusPolicy.canTransition(
          CollectionStatus.assigned,
          CollectionStatus.completed,
        ),
        isFalse,
      );
    });

    test('missed status requires a reason on an active assignment', () {
      expect(
        CollectorStatusPolicy.canTransition(
          CollectionStatus.assigned,
          CollectionStatus.missed,
        ),
        isFalse,
      );
      expect(
        CollectorStatusPolicy.canTransition(
          CollectionStatus.assigned,
          CollectionStatus.missed,
          missedReason: 'Customer unavailable',
        ),
        isTrue,
      );
      expect(
        CollectorStatusPolicy.canTransition(
          CollectionStatus.completed,
          CollectionStatus.missed,
          missedReason: 'Late invalid update',
        ),
        isFalse,
      );
    });

    test('available actions do not expose privileged shortcuts', () {
      expect(CollectorStatusPolicy.actionsFor(CollectionStatus.assigned), [
        CollectionStatus.onTheWay,
        CollectionStatus.missed,
      ]);
      expect(
        CollectorStatusPolicy.actionsFor(CollectionStatus.completed),
        isEmpty,
      );
    });
  });

  group('Collector dashboard controller', () {
    test('partitions assigned work into operational groups', () async {
      final serviceToday = const CollectionScheduleService().toServiceLocalDate(
        DateTime.now().toUtc(),
      );
      final controller = CollectorDashboardController(
        repository: _MemoryCollectorRepository(
          assignments: [
            _assignment(
              id: 'today',
              date: serviceToday,
              status: CollectionStatus.assigned,
            ),
            _assignment(
              id: 'complete',
              date: serviceToday,
              status: CollectionStatus.completed,
            ),
            _assignment(
              id: 'future',
              date: serviceToday.add(const Duration(days: 1)),
              status: CollectionStatus.assigned,
            ),
            _assignment(
              id: 'missed',
              date: serviceToday.subtract(const Duration(days: 1)),
              status: CollectionStatus.missed,
            ),
          ],
        ),
      );

      final data = await controller.load();

      expect(data.today.map((item) => item.id), ['today']);
      expect(data.completedToday.map((item) => item.id), ['complete']);
      expect(data.upcoming.map((item) => item.id), ['future']);
      expect(data.missed.map((item) => item.id), ['missed']);
      expect(data.assignedToday, 2);
      expect(data.completedCount, 1);
      expect(data.remainingCount, 1);
      expect(data.missedCount, 1);
    });

    test('rejects an unapproved collector profile', () async {
      final controller = CollectorDashboardController(
        repository: _MemoryCollectorRepository(
          profile: _collectorProfile(approval: CollectorApprovalStatus.pending),
        ),
      );

      await expectLater(controller.load(), throwsStateError);
    });
  });

  testWidgets('all customer quick actions invoke their callbacks', (
    tester,
  ) async {
    final calls = <String>[];
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: QuickActionsSection(
            onRequestPickup: () => calls.add('pickup'),
            onManageSubscription: () => calls.add('subscription'),
            onPaymentHistory: () => calls.add('payments'),
            onContactSupport: () => calls.add('support'),
          ),
        ),
      ),
    );

    for (final label in const [
      'Request Pickup',
      'Manage Subscription',
      'Payment History',
      'Contact Support',
    ]) {
      await tester.tap(find.text(label));
      await tester.pump();
    }

    expect(calls, ['pickup', 'subscription', 'payments', 'support']);
  });

  testWidgets('collector dashboard has a safe empty assignment state', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        home: CollectorDashboardScreen(
          controller: CollectorDashboardController(
            repository: _MemoryCollectorRepository(),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('CLEANGO Collector'), findsOneWidget);
    await tester.drag(find.byType(ListView), const Offset(0, -500));
    await tester.pump();
    expect(
      find.text('No remaining collection is assigned for today.'),
      findsOneWidget,
    );
  });
}

CollectorProfile _collectorProfile({
  CollectorApprovalStatus approval = CollectorApprovalStatus.approved,
  CollectorAccountStatus account = CollectorAccountStatus.active,
}) {
  final now = DateTime.utc(2026, 7, 30);
  return CollectorProfile(
    uid: 'collector-a',
    displayName: 'Test Collector',
    phoneNumber: '',
    email: '',
    profileImageUrl: '',
    role: 'collector',
    approvalStatus: approval,
    accountStatus: account,
    serviceZones: const ['yaounde'],
    vehicleType: CollectorVehicleType.tricycle,
    vehicleId: null,
    employeeReference: null,
    createdAt: now,
    updatedAt: now,
    approvedAt: approval == CollectorApprovalStatus.approved ? now : null,
    approvedBy: approval == CollectorApprovalStatus.approved ? 'admin' : null,
    suspendedAt: approval == CollectorApprovalStatus.suspended ? now : null,
    suspensionReason: approval == CollectorApprovalStatus.suspended
        ? 'Operational review'
        : null,
    lastActiveAt: now,
    currentAvailability: CollectorAvailability.available,
    availabilityReason: null,
  );
}

CollectorAssignment _assignment({
  required String id,
  required DateTime date,
  required CollectionStatus status,
}) {
  return CollectorAssignment(
    id: id,
    customerDisplayName: 'Customer',
    addressLine: 'Service address',
    district: 'Yaounde',
    scheduledDate: date,
    timeWindow: '08:00 - 10:00',
    bagCount: 2,
    bookingMode: CollectionBookingMode.oneTimeBagCount,
    wasteCategory: WasteCategory.household,
    customerNotes: '',
    paymentStatus: CollectionPaymentStatus.paid,
    status: status,
    assignedWorkerId: 'collector-a',
    updatedAt: date,
    missedReason: status == CollectionStatus.missed
        ? 'Customer unavailable'
        : null,
  );
}

class _MemoryCollectorRepository implements CollectorRepository {
  _MemoryCollectorRepository({
    CollectorProfile? profile,
    List<CollectorAssignment>? assignments,
  }) : profile = profile ?? _collectorProfile(),
       assignments = [...?assignments];

  CollectorProfile profile;
  final List<CollectorAssignment> assignments;

  @override
  Future<List<CollectorAssignment>> getAssignedCollections() async =>
      List.unmodifiable(assignments);

  @override
  Future<CollectorProfile?> getCurrentCollector() async => profile;

  @override
  Future<CollectorProfile> updateAvailability(
    CollectorAvailability availability, {
    String? reason,
  }) async => profile;

  @override
  Future<CollectorAssignment> updateCollectionStatus(
    String collectionId,
    CollectionStatus nextStatus, {
    String? missedReason,
  }) async {
    final current = assignments.firstWhere(
      (assignment) => assignment.id == collectionId,
    );
    return _assignment(
      id: current.id,
      date: current.scheduledDate!,
      status: nextStatus,
    );
  }
}
