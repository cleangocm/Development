import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:ultrawash/core/cleango/collectors/collector.dart';
import 'package:ultrawash/core/cleango/collectors/collector_access_policy.dart';
import 'package:ultrawash/core/cleango/onboarding/customer_address_service.dart';
import 'package:ultrawash/core/cleango/onboarding/customer_provisioning_service.dart';
import 'package:ultrawash/core/cleango/onboarding/firebase_customer_provisioning_store.dart';
import 'package:ultrawash/core/cleango/repositories/firebase/firebase_collector_repository.dart';
import 'package:ultrawash/feature/collector_dashboard/collector_access_status_screen.dart';
import 'package:ultrawash/feature/collector_dashboard/collector_dashboard_screen.dart';
import 'package:ultrawash/feature/customer_dashboard/customer_dashboard_shell.dart';
import 'package:ultrawash/feature/mobile_onboarding/address_onboarding_screen.dart';

class CustomerOnboardingGate extends StatefulWidget {
  const CustomerOnboardingGate({super.key});

  @override
  State<CustomerOnboardingGate> createState() => _CustomerOnboardingGateState();
}

class _CustomerOnboardingGateState extends State<CustomerOnboardingGate> {
  late Future<_GateResolution> _resolution;

  @override
  void initState() {
    super.initState();
    _resolution = _resolve();
  }

  Future<_GateResolution> _resolve() async {
    final collector = await FirebaseCollectorRepository().getCurrentCollector();
    switch (CollectorAccessPolicy.resolve(collector)) {
      case CollectorAccessDestination.collectorDashboard:
        await FirebaseAuth.instance.currentUser?.getIdToken(true);
        return const _GateResolution(_GateDestination.collectorDashboard);
      case CollectorAccessDestination.pendingReview:
      case CollectorAccessDestination.blocked:
        return _GateResolution(
          _GateDestination.collectorAccessStatus,
          collector: collector,
        );
      case CollectorAccessDestination.customer:
        break;
    }

    final provisioning = CustomerProvisioningService(
      store: FirebaseCustomerProvisioningStore(),
      firebaseAuth: FirebaseAuth.instance,
    );
    final result = await provisioning.provisionCurrentUser();
    if (result.isDisabled) {
      return const _GateResolution(_GateDestination.disabled);
    }

    final state = await CustomerAddressService().readState();
    if (state.isDisabled) {
      return const _GateResolution(_GateDestination.disabled);
    }
    return _GateResolution(
      state.isComplete ? _GateDestination.dashboard : _GateDestination.address,
    );
  }

  void _retry() => setState(() => _resolution = _resolve());

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<_GateResolution>(
      future: _resolution,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }
        if (snapshot.hasError || snapshot.data == null) {
          return _GateError(onRetry: _retry);
        }

        final resolution = snapshot.data!;
        return switch (resolution.destination) {
          _GateDestination.dashboard => const CleanGoCustomerDashboardShell(),
          _GateDestination.address => const AddressOnboardingScreen(),
          _GateDestination.disabled => const _DisabledAccountScreen(),
          _GateDestination.collectorDashboard =>
            const CollectorDashboardScreen(),
          _GateDestination.collectorAccessStatus => CollectorAccessStatusScreen(
            profile: resolution.collector!,
            onRefresh: _retry,
          ),
        };
      },
    );
  }
}

enum _GateDestination {
  dashboard,
  address,
  disabled,
  collectorDashboard,
  collectorAccessStatus,
}

class _GateResolution {
  const _GateResolution(this.destination, {this.collector});

  final _GateDestination destination;
  final CollectorProfile? collector;
}

class _GateError extends StatelessWidget {
  const _GateError({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.cloud_off_outlined, size: 52),
              const SizedBox(height: 16),
              const Text(
                'We could not load your CLEANGO account.',
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              FilledButton(onPressed: onRetry, child: const Text('Retry')),
            ],
          ),
        ),
      ),
    );
  }
}

class _DisabledAccountScreen extends StatelessWidget {
  const _DisabledAccountScreen();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text(
            'This CLEANGO account is currently unavailable. Please contact support.',
            textAlign: TextAlign.center,
          ),
        ),
      ),
    );
  }
}
