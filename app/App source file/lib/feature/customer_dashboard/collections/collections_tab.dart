import 'package:flutter/material.dart';

class CollectionsTab extends StatelessWidget {
  const CollectionsTab({super.key});

  @override
  Widget build(BuildContext context) {
    return const _PlaceholderTab(
      icon: Icons.local_shipping_outlined,
      title: 'Collections',
      message: 'Upcoming and completed waste pickups will appear here.',
    );
  }
}

class _PlaceholderTab extends StatelessWidget {
  const _PlaceholderTab({required this.icon, required this.title, required this.message});
  final IconData icon;
  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(child: Padding(padding: const EdgeInsets.all(28), child: Column(mainAxisSize: MainAxisSize.min, children: [
      Icon(icon, size: 64, color: const Color(0xFF1073E6)),
      const SizedBox(height: 18),
      Text(title, style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800)),
      const SizedBox(height: 8),
      Text(message, textAlign: TextAlign.center),
    ])));
  }
}