import 'package:flutter/material.dart';
import 'package:ultrawash/core/cleango/collectors/collector.dart';
import 'package:ultrawash/core/cleango/di/cleango_service_locator.dart';
import 'package:ultrawash/core/cleango/notifications/firebase_messaging_service.dart';
import 'package:ultrawash/feature/auth/ui/screen/splash_find_screen.dart';

class CollectorAccessStatusScreen extends StatefulWidget {
  const CollectorAccessStatusScreen({
    required this.profile,
    required this.onRefresh,
    super.key,
  });

  final CollectorProfile profile;
  final VoidCallback onRefresh;

  @override
  State<CollectorAccessStatusScreen> createState() =>
      _CollectorAccessStatusScreenState();
}

class _CollectorAccessStatusScreenState
    extends State<CollectorAccessStatusScreen> {
  bool _signingOut = false;

  @override
  Widget build(BuildContext context) {
    final pending =
        widget.profile.approvalStatus == CollectorApprovalStatus.pending &&
        widget.profile.accountStatus == CollectorAccountStatus.active;
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(28),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  pending ? Icons.verified_user_outlined : Icons.block_outlined,
                  size: 64,
                  color: pending
                      ? const Color(0xFFB45309)
                      : const Color(0xFFB91C1C),
                ),
                const SizedBox(height: 18),
                Text(
                  pending
                      ? 'Collector verification pending'
                      : 'Collector access unavailable',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  pending
                      ? 'A CLEANGO administrator must verify and approve this collector profile before assignments become available.'
                      : 'This collector profile is rejected, suspended, inactive, or blocked. Contact CLEANGO support for review.',
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Color(0xFF64748B)),
                ),
                const SizedBox(height: 24),
                if (pending)
                  FilledButton.icon(
                    onPressed: widget.onRefresh,
                    icon: const Icon(Icons.refresh),
                    label: const Text('Check approval status'),
                  ),
                const SizedBox(height: 10),
                TextButton.icon(
                  onPressed: _signingOut ? null : _logout,
                  icon: const Icon(Icons.logout),
                  label: Text(_signingOut ? 'Logging out...' : 'Logout'),
                ),
              ],
            ),
          ),
        ),
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
        // Stale messaging cleanup must not prevent account logout.
      }
      final result = await CleanGoServiceLocator.instance.authService.signOut();
      if (!mounted) return;
      if (!result.isSuccess) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result.failure?.message ?? 'Unable to logout.'),
          ),
        );
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
}
