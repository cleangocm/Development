import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:ultrawash/core/cleango/collectors/collector.dart';
import 'package:ultrawash/feature/collector_dashboard/collector_assignment_screen.dart';
import 'package:ultrawash/feature/collector_dashboard/collector_profile_screen.dart';
import 'package:ultrawash/feature/collector_dashboard/controller/collector_dashboard_controller.dart';
import 'package:ultrawash/feature/customer_dashboard/collections/widgets/collection_status_card.dart';
import 'package:ultrawash/feature/customer_dashboard/notifications/notifications_tab.dart';

class CollectorDashboardScreen extends StatefulWidget {
  const CollectorDashboardScreen({
    super.key,
    CollectorDashboardController? controller,
  }) : _controller = controller;

  final CollectorDashboardController? _controller;

  @override
  State<CollectorDashboardScreen> createState() =>
      _CollectorDashboardScreenState();
}

class _CollectorDashboardScreenState extends State<CollectorDashboardScreen> {
  late final CollectorDashboardController _controller =
      widget._controller ?? CollectorDashboardController.firebase();
  late Future<CollectorDashboardViewData> _data = _controller.load();
  bool _updatingAvailability = false;

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<CollectorDashboardViewData>(
      future: _data,
      builder: (context, snapshot) {
        final data = snapshot.data;
        return Scaffold(
          appBar: AppBar(
            title: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'CLEANGO Collector',
                  style: TextStyle(fontWeight: FontWeight.w800),
                ),
                Text(
                  'Assigned collection operations',
                  style: TextStyle(fontSize: 12),
                ),
              ],
            ),
            actions: [
              IconButton(
                tooltip: 'Notifications',
                onPressed: data == null ? null : _openNotifications,
                icon: const Icon(Icons.notifications_outlined),
              ),
              IconButton(
                tooltip: 'Collector profile',
                onPressed: data == null
                    ? null
                    : () => _openProfile(data.profile),
                icon: const Icon(Icons.person_outline),
              ),
            ],
          ),
          body: _body(snapshot),
        );
      },
    );
  }

  Widget _body(AsyncSnapshot<CollectorDashboardViewData> snapshot) {
    if (snapshot.connectionState != ConnectionState.done) {
      return const Center(child: CircularProgressIndicator());
    }
    if (snapshot.hasError || snapshot.data == null) {
      return _ErrorState(onRetry: _reload);
    }
    final data = snapshot.data!;
    return RefreshIndicator(
      onRefresh: _refresh,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 18, 16, 100),
        children: [
          Text(
            'Hello, ${data.profile.displayName.split(' ').first}',
            style: const TextStyle(fontSize: 25, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 6),
          const Text(
            'Only collections assigned to your approved account appear here.',
            style: TextStyle(color: Color(0xFF64748B)),
          ),
          const SizedBox(height: 18),
          _SummaryGrid(data: data),
          const SizedBox(height: 20),
          _AvailabilityCard(
            availability: data.profile.currentAvailability,
            updating: _updatingAvailability,
            onChanged: _updateAvailability,
          ),
          const SizedBox(height: 24),
          _AssignmentSection(
            title: "Today's collections",
            emptyMessage: 'No remaining collection is assigned for today.',
            assignments: data.today,
            onOpen: _openAssignment,
          ),
          _AssignmentSection(
            title: 'Upcoming collections',
            emptyMessage: 'No upcoming assignment.',
            assignments: data.upcoming,
            onOpen: _openAssignment,
          ),
          _AssignmentSection(
            title: 'Completed today',
            emptyMessage: 'No collection completed today yet.',
            assignments: data.completedToday,
            onOpen: _openAssignment,
          ),
          _AssignmentSection(
            title: 'Missed collections',
            emptyMessage: 'No missed collection.',
            assignments: data.missed,
            onOpen: _openAssignment,
          ),
        ],
      ),
    );
  }

  Future<void> _updateAvailability(CollectorAvailability availability) async {
    if (_updatingAvailability) return;
    setState(() => _updatingAvailability = true);
    try {
      await _controller.updateAvailability(availability);
      if (mounted) await _refresh();
    } catch (_) {
      if (mounted) {
        _showMessage('Unable to update availability. Please try again.');
      }
    } finally {
      if (mounted) setState(() => _updatingAvailability = false);
    }
  }

  Future<void> _openAssignment(CollectorAssignment assignment) async {
    final changed = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => CollectorAssignmentScreen(
          assignment: assignment,
          controller: _controller,
        ),
      ),
    );
    if (changed == true && mounted) await _refresh();
  }

  void _openNotifications() {
    Navigator.of(context).push<void>(
      MaterialPageRoute(
        builder: (_) =>
            const Scaffold(body: SafeArea(child: NotificationsTab())),
      ),
    );
  }

  void _openProfile(CollectorProfile profile) {
    Navigator.of(context).push<void>(
      MaterialPageRoute(
        builder: (_) => CollectorProfileScreen(profile: profile),
      ),
    );
  }

  Future<void> _refresh() async {
    final future = _controller.load();
    setState(() => _data = future);
    await future;
  }

  void _reload() => setState(() => _data = _controller.load());

  void _showMessage(String message) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }
}

class _SummaryGrid extends StatelessWidget {
  const _SummaryGrid({required this.data});

  final CollectorDashboardViewData data;

  @override
  Widget build(BuildContext context) {
    final items = [
      ('Assigned today', data.assignedToday, Icons.assignment_outlined),
      ('Completed', data.completedCount, Icons.check_circle_outline),
      ('Remaining', data.remainingCount, Icons.route_outlined),
      ('Missed', data.missedCount, Icons.report_problem_outlined),
    ];
    return LayoutBuilder(
      builder: (context, constraints) {
        final width = (constraints.maxWidth - 12) / 2;
        return Wrap(
          spacing: 12,
          runSpacing: 12,
          children: [
            for (final item in items)
              SizedBox(
                width: width,
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(15),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(item.$3, color: const Color(0xFF15803D)),
                        const SizedBox(height: 10),
                        Text(
                          item.$2.toString(),
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        Text(
                          item.$1,
                          style: const TextStyle(color: Color(0xFF64748B)),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}

class _AvailabilityCard extends StatelessWidget {
  const _AvailabilityCard({
    required this.availability,
    required this.updating,
    required this.onChanged,
  });

  final CollectorAvailability availability;
  final bool updating;
  final ValueChanged<CollectorAvailability> onChanged;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(17),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Collector availability',
              style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 6),
            const Text(
              'Set your current operational availability. This is not attendance tracking.',
              style: TextStyle(color: Color(0xFF64748B)),
            ),
            const SizedBox(height: 14),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final option in CollectorAvailability.values)
                  ChoiceChip(
                    label: Text(option.label),
                    selected: option == availability,
                    onSelected: updating ? null : (_) => onChanged(option),
                  ),
              ],
            ),
            if (updating) ...[
              const SizedBox(height: 12),
              const LinearProgressIndicator(),
            ],
          ],
        ),
      ),
    );
  }
}

class _AssignmentSection extends StatelessWidget {
  const _AssignmentSection({
    required this.title,
    required this.emptyMessage,
    required this.assignments,
    required this.onOpen,
  });

  final String title;
  final String emptyMessage;
  final List<CollectorAssignment> assignments;
  final ValueChanged<CollectorAssignment> onOpen;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 22),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 10),
          if (assignments.isEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(17),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Text(
                emptyMessage,
                style: const TextStyle(color: Color(0xFF64748B)),
              ),
            )
          else
            for (final assignment in assignments) ...[
              _AssignmentCard(
                assignment: assignment,
                onTap: () => onOpen(assignment),
              ),
              const SizedBox(height: 10),
            ],
        ],
      ),
    );
  }
}

class _AssignmentCard extends StatelessWidget {
  const _AssignmentCard({required this.assignment, required this.onTap});

  final CollectorAssignment assignment;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final date = assignment.scheduledDate;
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'Collection ${assignment.reference}',
                      style: const TextStyle(fontWeight: FontWeight.w800),
                    ),
                  ),
                  CollectionStatusCard(status: assignment.status),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                assignment.customerDisplayName,
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 4),
              Text(
                [
                  assignment.addressLine,
                  assignment.district,
                ].where((part) => part.isNotEmpty).join(', '),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(color: Color(0xFF64748B)),
              ),
              const SizedBox(height: 8),
              Text(
                '${date == null ? 'Schedule pending' : DateFormat('d MMM').format(date)} - ${assignment.timeWindow}',
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.cloud_off_outlined, size: 46),
            const SizedBox(height: 12),
            const Text(
              'Unable to load collector operations.',
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 14),
            FilledButton(onPressed: onRetry, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }
}
