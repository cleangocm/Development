import 'package:flutter/material.dart';

enum NotificationFilter { all, unread, collections, payments, system }

extension NotificationFilterLabel on NotificationFilter {
  String get label => switch (this) {
    NotificationFilter.all => 'All',
    NotificationFilter.unread => 'Unread',
    NotificationFilter.collections => 'Collections',
    NotificationFilter.payments => 'Payments',
    NotificationFilter.system => 'System',
  };
}

class NotificationFilterChips extends StatelessWidget {
  const NotificationFilterChips({
    required this.selectedFilter,
    required this.onSelected,
    super.key,
  });

  final NotificationFilter selectedFilter;
  final ValueChanged<NotificationFilter> onSelected;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          for (final filter in NotificationFilter.values) ...[
            ChoiceChip(
              label: Text(filter.label),
              selected: selectedFilter == filter,
              onSelected: (_) => onSelected(filter),
              selectedColor: const Color(0xFFDDF7E5),
              side: const BorderSide(color: Color(0xFFE2E8F0)),
              labelStyle: TextStyle(
                color: selectedFilter == filter
                    ? const Color(0xFF15803D)
                    : const Color(0xFF475569),
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(width: 8),
          ],
        ],
      ),
    );
  }
}
