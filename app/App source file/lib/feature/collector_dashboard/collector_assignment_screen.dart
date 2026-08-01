import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:ultrawash/core/cleango/collectors/collector.dart';
import 'package:ultrawash/core/cleango/collectors/collector_status_policy.dart';
import 'package:ultrawash/core/cleango/models/collection.dart';
import 'package:ultrawash/feature/collector_dashboard/controller/collector_dashboard_controller.dart';
import 'package:ultrawash/feature/customer_dashboard/collections/widgets/collection_status_card.dart';

class CollectorAssignmentScreen extends StatefulWidget {
  const CollectorAssignmentScreen({
    required this.assignment,
    required this.controller,
    super.key,
  });

  final CollectorAssignment assignment;
  final CollectorDashboardController controller;

  @override
  State<CollectorAssignmentScreen> createState() =>
      _CollectorAssignmentScreenState();
}

class _CollectorAssignmentScreenState extends State<CollectorAssignmentScreen> {
  late CollectorAssignment _assignment = widget.assignment;
  bool _updating = false;
  bool _changed = false;

  @override
  Widget build(BuildContext context) {
    final actions = CollectorStatusPolicy.actionsFor(_assignment.status);
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) Navigator.of(context).pop(_changed);
      },
      child: Scaffold(
        appBar: AppBar(title: Text('Collection ${_assignment.reference}')),
        body: ListView(
          padding: const EdgeInsets.fromLTRB(18, 18, 18, 120),
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    _assignment.customerDisplayName,
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                CollectionStatusCard(status: _assignment.status),
              ],
            ),
            const SizedBox(height: 20),
            _InformationCard(
              title: 'Schedule and location',
              rows: [
                _Row(
                  'Date',
                  _assignment.scheduledDate == null
                      ? 'Schedule pending'
                      : DateFormat(
                          'EEE, d MMM yyyy',
                        ).format(_assignment.scheduledDate!),
                ),
                _Row('Time window', _assignment.timeWindow),
                _Row('Address', _assignment.addressLine),
                _Row(
                  'District',
                  _assignment.district.isEmpty
                      ? 'Not specified'
                      : _assignment.district,
                ),
              ],
            ),
            const SizedBox(height: 14),
            _InformationCard(
              title: 'Collection details',
              rows: [
                _Row('Booking type', _assignment.bookingMode.label),
                _Row('Waste category', _assignment.wasteCategory.label),
                _Row(
                  '60L bags',
                  _assignment.bagCount?.toString() ?? 'To be confirmed',
                ),
                _Row('Payment state', _assignment.paymentStatus.label),
                _Row(
                  'Customer notes',
                  _assignment.customerNotes.isEmpty
                      ? 'No notes'
                      : _assignment.customerNotes,
                ),
              ],
            ),
            if (_assignment.missedReason != null) ...[
              const SizedBox(height: 14),
              _InformationCard(
                title: 'Missed collection',
                rows: [_Row('Reason', _assignment.missedReason!)],
              ),
            ],
            const SizedBox(height: 24),
            if (_updating) const LinearProgressIndicator(),
            if (actions.isEmpty)
              const Text(
                'No further collector action is available for this collection.',
                style: TextStyle(color: Color(0xFF64748B)),
              )
            else
              for (final status in actions) ...[
                if (status == CollectionStatus.missed)
                  OutlinedButton.icon(
                    onPressed: _updating ? null : _markMissed,
                    icon: const Icon(Icons.report_problem_outlined),
                    label: const Text('Mark collection missed'),
                  )
                else
                  FilledButton.icon(
                    onPressed: _updating ? null : () => _transition(status),
                    icon: Icon(_actionIcon(status)),
                    label: Text(_actionLabel(status)),
                  ),
                const SizedBox(height: 10),
              ],
          ],
        ),
      ),
    );
  }

  Future<void> _transition(
    CollectionStatus next, {
    String? missedReason,
  }) async {
    if (_updating) return;
    setState(() => _updating = true);
    try {
      final updated = await widget.controller.updateCollectionStatus(
        _assignment.id,
        next,
        missedReason: missedReason,
      );
      if (!mounted) return;
      setState(() {
        _assignment = updated;
        _changed = true;
      });
      _showMessage('Collection updated to ${next.label}.');
    } catch (_) {
      if (mounted) {
        _showMessage('Unable to update this collection. Please try again.');
      }
    } finally {
      if (mounted) setState(() => _updating = false);
    }
  }

  Future<void> _markMissed() async {
    final controller = TextEditingController();
    final reason = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Why was the collection missed?'),
        content: TextField(
          controller: controller,
          minLines: 2,
          maxLines: 4,
          maxLength: 300,
          decoration: const InputDecoration(
            labelText: 'Required reason',
            hintText: 'Give a short operational reason.',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Back'),
          ),
          FilledButton(
            onPressed: () {
              final value = controller.text.trim();
              if (value.isNotEmpty) Navigator.of(context).pop(value);
            },
            child: const Text('Confirm missed'),
          ),
        ],
      ),
    );
    controller.dispose();
    if (reason == null || !mounted) return;
    await _transition(CollectionStatus.missed, missedReason: reason);
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }
}

class _InformationCard extends StatelessWidget {
  const _InformationCard({required this.title, required this.rows});

  final String title;
  final List<_Row> rows;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 12),
            for (final row in rows) ...[
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(
                    width: 112,
                    child: Text(
                      row.label,
                      style: const TextStyle(color: Color(0xFF64748B)),
                    ),
                  ),
                  Expanded(
                    child: Text(
                      row.value,
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 9),
            ],
          ],
        ),
      ),
    );
  }
}

class _Row {
  const _Row(this.label, this.value);

  final String label;
  final String value;
}

String _actionLabel(CollectionStatus status) => switch (status) {
  CollectionStatus.onTheWay => 'Start route to customer',
  CollectionStatus.arrived => 'Confirm arrival',
  CollectionStatus.inProgress => 'Start collection',
  CollectionStatus.completed => 'Complete collection',
  _ => status.label,
};

IconData _actionIcon(CollectionStatus status) => switch (status) {
  CollectionStatus.onTheWay => Icons.route_outlined,
  CollectionStatus.arrived => Icons.location_on_outlined,
  CollectionStatus.inProgress => Icons.play_arrow,
  CollectionStatus.completed => Icons.check_circle_outline,
  _ => Icons.arrow_forward,
};
