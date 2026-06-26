import 'package:flutter/material.dart';
import 'package:ultrawash/feature/customer_dashboard/profile/controller/profile_tab_controller.dart';
import 'package:ultrawash/feature/customer_dashboard/profile/widgets/account_card.dart';
import 'package:ultrawash/feature/customer_dashboard/profile/widgets/address_card.dart';
import 'package:ultrawash/feature/customer_dashboard/profile/widgets/preferences_card.dart';
import 'package:ultrawash/feature/customer_dashboard/profile/widgets/profile_header_card.dart';
import 'package:ultrawash/feature/customer_dashboard/profile/widgets/subscription_card.dart';
import 'package:ultrawash/feature/customer_dashboard/profile/widgets/support_card.dart';

class ProfileTab extends StatefulWidget {
  const ProfileTab({super.key, ProfileTabController? controller})
    : _controller = controller;

  final ProfileTabController? _controller;

  @override
  State<ProfileTab> createState() => _ProfileTabState();
}

class _ProfileTabState extends State<ProfileTab> {
  late final ProfileTabController _controller =
      widget._controller ?? ProfileTabController.mock();
  late Future<ProfileTabViewData> _profileData = _controller.load();

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<ProfileTabViewData>(
      future: _profileData,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const _ProfileLoadingState();
        }

        if (snapshot.hasError) {
          return _ProfileErrorState(onRetry: _reload);
        }

        final data = snapshot.data ?? ProfileTabViewData.empty();
        final customer = data.customer;
        if (customer == null) return const _ProfileEmptyState();

        return _ProfileContent(data: data);
      },
    );
  }

  void _reload() {
    setState(() {
      _profileData = _controller.load();
    });
  }
}

class _ProfileContent extends StatelessWidget {
  const _ProfileContent({required this.data});

  final ProfileTabViewData data;

  @override
  Widget build(BuildContext context) {
    final customer = data.customer!;
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 120),
      children: [
        const Text(
          'Profile',
          style: TextStyle(
            color: Color(0xFF0F172A),
            fontSize: 26,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 6),
        const Text(
          'Manage your CLEANGO account, service address, and preferences.',
          style: TextStyle(color: Color(0xFF64748B)),
        ),
        const SizedBox(height: 22),
        ProfileHeaderCard(customer: customer),
        const SizedBox(height: 18),
        _ProfileCardGrid(
          children: [
            SubscriptionCard(subscription: data.subscription),
            AddressCard(address: customer.primaryAddress),
          ],
        ),
        const SizedBox(height: 18),
        const PreferencesCard(),
        const SizedBox(height: 18),
        const _ProfileCardGrid(children: [SupportCard(), AccountCard()]),
      ],
    );
  }
}

class _ProfileLoadingState extends StatelessWidget {
  const _ProfileLoadingState();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: CircularProgressIndicator(color: Color(0xFF16A34A)),
    );
  }
}

class _ProfileErrorState extends StatelessWidget {
  const _ProfileErrorState({required this.onRetry});

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
              'Unable to load profile',
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

class _ProfileEmptyState extends StatelessWidget {
  const _ProfileEmptyState();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Padding(
        padding: EdgeInsets.all(24),
        child: Text('Profile information is not available yet.'),
      ),
    );
  }
}

class _ProfileCardGrid extends StatelessWidget {
  const _ProfileCardGrid({required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth < 760) {
          return Column(
            children: [
              for (final child in children) ...[
                child,
                const SizedBox(height: 14),
              ],
            ],
          );
        }

        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            for (var index = 0; index < children.length; index++) ...[
              Expanded(child: children[index]),
              if (index < children.length - 1) const SizedBox(width: 16),
            ],
          ],
        );
      },
    );
  }
}
