import 'package:flutter/material.dart';
import 'package:ultrawash/core/cleango/models/collection.dart';
import 'package:ultrawash/feature/customer_dashboard/collections/collection_booking_screen.dart';
import 'package:ultrawash/feature/customer_dashboard/collections/collection_details_screen.dart';
import 'package:ultrawash/feature/customer_dashboard/collections/controller/collections_tab_controller.dart';
import 'package:ultrawash/feature/customer_dashboard/collections/subscription_plans_screen.dart';
import 'package:ultrawash/feature/customer_dashboard/collections/widgets/collection_history_card.dart';
import 'package:ultrawash/feature/customer_dashboard/collections/widgets/collection_timeline_card.dart';
import 'package:ultrawash/feature/customer_dashboard/collections/widgets/empty_collections_state.dart';

class CollectionsTab extends StatefulWidget {
  const CollectionsTab({super.key, CollectionsTabController? controller})
    : _controller = controller;

  final CollectionsTabController? _controller;

  @override
  State<CollectionsTab> createState() => _CollectionsTabState();
}

class _CollectionsTabState extends State<CollectionsTab> {
  late final CollectionsTabController _controller =
      widget._controller ?? CollectionsTabController.mock();
  late Future<CollectionsTabViewData> _collectionsData = _controller.load();

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<CollectionsTabViewData>(
      future: _collectionsData,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const _CollectionsLoadingState();
        }
        if (snapshot.hasError) {
          return _CollectionsErrorState(onRetry: _retry);
        }
        return _CollectionsContent(
          data: snapshot.data ?? CollectionsTabViewData.empty(),
          onBook: _openBooking,
          onPlans: _openPlans,
          onViewDetails: _openDetails,
          onRefresh: _refresh,
        );
      },
    );
  }

  Future<void> _openBooking() async {
    final changed = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => CollectionBookingScreen(controller: _controller),
      ),
    );
    if (changed == true && mounted) _retry();
  }

  Future<void> _openPlans() async {
    await Navigator.of(context).push<void>(
      MaterialPageRoute(builder: (_) => const SubscriptionPlansScreen()),
    );
  }

  Future<void> _openDetails(WasteCollection collection) async {
    final changed = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => CollectionDetailsScreen(
          controller: _controller,
          initialCollection: collection,
        ),
      ),
    );
    if (changed == true && mounted) _retry();
  }

  Future<void> _refresh() async {
    final future = _controller.load();
    setState(() => _collectionsData = future);
    await future;
  }

  void _retry() {
    setState(() => _collectionsData = _controller.load());
  }
}

class _CollectionsContent extends StatelessWidget {
  const _CollectionsContent({
    required this.data,
    required this.onBook,
    required this.onPlans,
    required this.onViewDetails,
    required this.onRefresh,
  });

  final CollectionsTabViewData data;
  final VoidCallback onBook;
  final VoidCallback onPlans;
  final ValueChanged<WasteCollection> onViewDetails;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 20, 16, 120),
        children: [
          Wrap(
            alignment: WrapAlignment.spaceBetween,
            crossAxisAlignment: WrapCrossAlignment.center,
            spacing: 12,
            runSpacing: 12,
            children: [
              const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'My collections',
                    style: TextStyle(
                      color: Color(0xFF0F172A),
                      fontSize: 26,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  SizedBox(height: 6),
                  Text(
                    'Book, track, and review your CLEANGO collections.',
                    style: TextStyle(color: Color(0xFF64748B)),
                  ),
                ],
              ),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  OutlinedButton.icon(
                    onPressed: onPlans,
                    icon: const Icon(Icons.workspace_premium_outlined),
                    label: const Text('View plans'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFF15803D),
                    ),
                  ),
                  FilledButton.icon(
                    onPressed: onBook,
                    icon: const Icon(Icons.add_circle_outline),
                    label: const Text('Book a collection'),
                    style: FilledButton.styleFrom(
                      backgroundColor: const Color(0xFF16A34A),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 24),
          const _SectionTitle(title: 'Upcoming collections'),
          const SizedBox(height: 12),
          if (data.upcomingCollections.isEmpty)
            const EmptyCollectionsState(
              title: 'No upcoming collections',
              message: 'Book a collection when you are ready.',
            )
          else
            Column(
              children: [
                for (final collection in data.upcomingCollections) ...[
                  CollectionTimelineCard(
                    collection: collection,
                    onViewDetails: () => onViewDetails(collection),
                  ),
                  const SizedBox(height: 14),
                ],
              ],
            ),
          const SizedBox(height: 28),
          const _SectionTitle(title: 'Collection history'),
          const SizedBox(height: 12),
          if (data.collectionHistory.isEmpty)
            const EmptyCollectionsState(
              title: 'No collection history',
              message: 'Completed and cancelled bookings will appear here.',
            )
          else
            LayoutBuilder(
              builder: (context, constraints) {
                final twoColumns = constraints.maxWidth >= 760;
                if (!twoColumns) {
                  return Column(
                    children: [
                      for (final collection in data.collectionHistory) ...[
                        CollectionHistoryCard(
                          collection: collection,
                          onViewDetails: () => onViewDetails(collection),
                        ),
                        const SizedBox(height: 14),
                      ],
                    ],
                  );
                }
                return Wrap(
                  spacing: 16,
                  runSpacing: 16,
                  children: data.collectionHistory
                      .map(
                        (collection) => SizedBox(
                          width: (constraints.maxWidth - 16) / 2,
                          child: CollectionHistoryCard(
                            collection: collection,
                            onViewDetails: () => onViewDetails(collection),
                          ),
                        ),
                      )
                      .toList(growable: false),
                );
              },
            ),
        ],
      ),
    );
  }
}

class _CollectionsLoadingState extends StatelessWidget {
  const _CollectionsLoadingState();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: CircularProgressIndicator(color: Color(0xFF16A34A)),
    );
  }
}

class _CollectionsErrorState extends StatelessWidget {
  const _CollectionsErrorState({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.cloud_off_outlined,
              color: Color(0xFF94A3B8),
              size: 42,
            ),
            const SizedBox(height: 12),
            const Text(
              'Unable to load collections',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 8),
            const Text(
              'Please try again in a moment.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Color(0xFF64748B)),
            ),
            const SizedBox(height: 16),
            FilledButton(onPressed: onRetry, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: const TextStyle(
        color: Color(0xFF0F172A),
        fontSize: 20,
        fontWeight: FontWeight.w800,
      ),
    );
  }
}
