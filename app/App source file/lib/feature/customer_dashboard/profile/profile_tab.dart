import 'package:flutter/material.dart';

class ProfileTab extends StatelessWidget {
  const ProfileTab({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(child: Padding(padding: EdgeInsets.all(28), child: Column(mainAxisSize: MainAxisSize.min, children: [
      CircleAvatar(radius: 38, backgroundColor: Color(0xFFE8F5E9), child: Icon(Icons.person_outline, size: 44, color: Color(0xFF16A34A))),
      SizedBox(height: 18),
      Text('Profile', style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800)),
      SizedBox(height: 8),
      Text('Your account, addresses, preferences, and support options will appear here.', textAlign: TextAlign.center),
    ])));
  }
}