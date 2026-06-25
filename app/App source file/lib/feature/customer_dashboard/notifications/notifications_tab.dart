import 'package:flutter/material.dart';

class NotificationsTab extends StatelessWidget {
  const NotificationsTab({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(child: Padding(padding: EdgeInsets.all(28), child: Column(mainAxisSize: MainAxisSize.min, children: [
      Icon(Icons.notifications_none_rounded, size: 64, color: Color(0xFF1073E6)),
      SizedBox(height: 18),
      Text('Notifications', style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800)),
      SizedBox(height: 8),
      Text('Pickup reminders, payment updates, and service news will appear here.', textAlign: TextAlign.center),
    ])));
  }
}