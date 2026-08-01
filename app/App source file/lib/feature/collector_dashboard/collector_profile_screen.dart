import 'package:flutter/material.dart';
import 'package:ultrawash/core/cleango/collectors/collector.dart';
import 'package:ultrawash/core/cleango/di/cleango_service_locator.dart';
import 'package:ultrawash/core/cleango/notifications/firebase_messaging_service.dart';
import 'package:ultrawash/feature/auth/ui/screen/splash_find_screen.dart';

class CollectorProfileScreen extends StatefulWidget {
  const CollectorProfileScreen({required this.profile, super.key});

  final CollectorProfile profile;

  @override
  State<CollectorProfileScreen> createState() => _CollectorProfileScreenState();
}

class _CollectorProfileScreenState extends State<CollectorProfileScreen> {
  bool _signingOut = false;

  @override
  Widget build(BuildContext context) {
    final profile = widget.profile;
    return Scaffold(
      appBar: AppBar(title: const Text('Collector profile')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          CircleAvatar(
            radius: 38,
            backgroundColor: const Color(0xFFDDF7E5),
            child: Text(
              profile.displayName.trim().isEmpty
                  ? 'C'
                  : profile.displayName.trim().substring(0, 1).toUpperCase(),
              style: const TextStyle(
                color: Color(0xFF15803D),
                fontSize: 28,
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
          const SizedBox(height: 14),
          Text(
            profile.displayName,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 22),
          _ProfileRow('Approval', profile.approvalStatus.name),
          _ProfileRow('Account', profile.accountStatus.name),
          _ProfileRow('Vehicle', profile.vehicleType.name),
          _ProfileRow(
            'Service zones',
            profile.serviceZones.isEmpty
                ? 'Not assigned'
                : profile.serviceZones.join(', '),
          ),
          _ProfileRow('Availability', profile.currentAvailability.label),
          const SizedBox(height: 24),
          if (_signingOut) const LinearProgressIndicator(),
          FilledButton.tonalIcon(
            onPressed: _signingOut ? null : _logout,
            icon: const Icon(Icons.logout),
            label: const Text('Logout'),
          ),
        ],
      ),
    );
  }

  Future<void> _logout() async {
    if (_signingOut) return;
    setState(() => _signingOut = true);
    try {
      try {
        await FirebaseMessagingService.instance.unregisterCurrentDevice();
      } catch (_) {
        // Notification cleanup must not trap a collector in the app.
      }
      final result = await CleanGoServiceLocator.instance.authService.signOut();
      if (!mounted) return;
      if (!result.isSuccess) {
        _showMessage(result.failure?.message ?? 'Unable to log out.');
        return;
      }
      Navigator.of(context, rootNavigator: true).pushAndRemoveUntil<void>(
        MaterialPageRoute(builder: (_) => const SplashFindScreen()),
        (_) => false,
      );
    } finally {
      if (mounted) setState(() => _signingOut = false);
    }
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }
}

class _ProfileRow extends StatelessWidget {
  const _ProfileRow(this.label, this.value);

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(label),
      trailing: Flexible(
        child: Text(
          value,
          textAlign: TextAlign.end,
          style: const TextStyle(fontWeight: FontWeight.w700),
        ),
      ),
    );
  }
}
