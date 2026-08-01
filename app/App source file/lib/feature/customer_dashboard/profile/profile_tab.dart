import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:ultrawash/core/cleango/di/cleango_service_locator.dart';
import 'package:ultrawash/core/cleango/models/customer.dart';
import 'package:ultrawash/core/cleango/models/support_request.dart';
import 'package:ultrawash/core/cleango/notifications/firebase_messaging_service.dart';
import 'package:ultrawash/core/config/support_config.dart';
import 'package:ultrawash/feature/auth/ui/screen/splash_find_screen.dart';
import 'package:ultrawash/feature/customer_dashboard/collections/subscription_management_screen.dart';
import 'package:ultrawash/feature/customer_dashboard/profile/controller/profile_tab_controller.dart';
import 'package:ultrawash/feature/customer_dashboard/profile/widgets/account_card.dart';
import 'package:ultrawash/feature/customer_dashboard/profile/widgets/address_card.dart';
import 'package:ultrawash/feature/customer_dashboard/profile/widgets/preferences_card.dart';
import 'package:ultrawash/feature/customer_dashboard/profile/widgets/profile_header_card.dart';
import 'package:ultrawash/feature/customer_dashboard/profile/widgets/subscription_card.dart';
import 'package:ultrawash/feature/customer_dashboard/profile/widgets/support_card.dart';
import 'package:ultrawash/feature/customer_dashboard/support/faq_screen.dart';
import 'package:ultrawash/feature/customer_dashboard/support/legal_document_screen.dart';
import 'package:ultrawash/feature/customer_dashboard/support/support_screen.dart';
import 'package:ultrawash/feature/mobile_onboarding/address_onboarding_screen.dart';

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
  final ImagePicker _imagePicker = ImagePicker();
  bool _isUploadingAvatar = false;
  bool _isSigningOut = false;

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

        return _ProfileContent(
          data: data,
          isUploadingAvatar: _isUploadingAvatar,
          isSigningOut: _isSigningOut,
          onChangePhoto: _controller.canUploadProfileImage
              ? _pickAndUploadAvatar
              : null,
          onManageSubscription: _openSubscription,
          onEditAddress: () => _openAddress(customer),
          onContactSupport: () => _openSupport(),
          onReportMissedCollection: () =>
              _openSupport(category: SupportRequestCategory.missedCollection),
          onFaq: _openFaq,
          onPrivacyPolicy: () => _openLegal(
            title: 'Privacy Policy',
            uri: SupportConfig.privacyPolicyUri,
          ),
          onTermsOfService: () => _openLegal(
            title: 'Terms of Service',
            uri: SupportConfig.termsOfServiceUri,
          ),
          onChangePassword: _showPasswordInformation,
          onLogout: _isSigningOut ? null : _logout,
        );
      },
    );
  }

  Future<void> _pickAndUploadAvatar() async {
    if (_isUploadingAvatar) return;

    try {
      final image = await _imagePicker.pickImage(
        source: ImageSource.gallery,
        imageQuality: 85,
        maxWidth: 1600,
      );
      if (image == null || !mounted) return;

      final bytes = await image.readAsBytes();
      final refreshed = await _uploadAvatar(bytes: bytes, fileName: image.name);
      if (!mounted) return;

      setState(() {
        _profileData = Future.value(refreshed);
      });
      _showMessage('Profile photo updated.');
    } catch (_) {
      if (!mounted) return;
      _showMessage('Unable to update profile photo. Please try another image.');
    }
  }

  Future<ProfileTabViewData> _uploadAvatar({
    required List<int> bytes,
    required String fileName,
  }) async {
    setState(() => _isUploadingAvatar = true);
    try {
      return await _controller.uploadProfileImage(
        bytes: bytes is Uint8List ? bytes : Uint8List.fromList(bytes),
        fileName: fileName,
      );
    } finally {
      if (mounted) setState(() => _isUploadingAvatar = false);
    }
  }

  Future<void> _openSubscription() async {
    await Navigator.of(context).push<void>(
      MaterialPageRoute(builder: (_) => const SubscriptionManagementScreen()),
    );
    if (mounted) _reload();
  }

  Future<void> _openAddress(Customer customer) async {
    final changed = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) =>
            AddressOnboardingScreen(customer: customer, editing: true),
      ),
    );
    if (changed == true && mounted) _reload();
  }

  void _openSupport({
    SupportRequestCategory category = SupportRequestCategory.general,
  }) {
    Navigator.of(context).push<void>(
      MaterialPageRoute(
        builder: (_) => SupportScreen(initialCategory: category),
      ),
    );
  }

  void _openFaq() {
    Navigator.of(
      context,
    ).push<void>(MaterialPageRoute(builder: (_) => const FaqScreen()));
  }

  void _openLegal({required String title, required Uri? uri}) {
    Navigator.of(context).push<void>(
      MaterialPageRoute(
        builder: (_) => LegalDocumentScreen(title: title, uri: uri),
      ),
    );
  }

  Future<void> _showPasswordInformation() {
    return showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Account sign-in security'),
        content: const Text(
          'CLEANGO Firebase accounts use verified phone or Google sign-in. There is no app password to change for these providers.',
        ),
        actions: [
          FilledButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Understood'),
          ),
        ],
      ),
    );
  }

  Future<void> _logout() async {
    if (_isSigningOut) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Log out of CLEANGO?'),
        content: const Text(
          'This device will return to the CLEANGO sign-in screen.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Stay signed in'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Logout'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    setState(() => _isSigningOut = true);
    try {
      try {
        await FirebaseMessagingService.instance.unregisterCurrentDevice();
      } catch (_) {
        // A stale notification registration must not prevent account logout.
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
      if (mounted) setState(() => _isSigningOut = false);
    }
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  void _reload() {
    setState(() {
      _profileData = _controller.load();
    });
  }
}

class _ProfileContent extends StatelessWidget {
  const _ProfileContent({
    required this.data,
    required this.isUploadingAvatar,
    required this.isSigningOut,
    required this.onManageSubscription,
    required this.onEditAddress,
    required this.onContactSupport,
    required this.onReportMissedCollection,
    required this.onFaq,
    required this.onPrivacyPolicy,
    required this.onTermsOfService,
    required this.onChangePassword,
    required this.onLogout,
    this.onChangePhoto,
  });

  final ProfileTabViewData data;
  final bool isUploadingAvatar;
  final bool isSigningOut;
  final VoidCallback? onChangePhoto;
  final VoidCallback onManageSubscription;
  final VoidCallback onEditAddress;
  final VoidCallback onContactSupport;
  final VoidCallback onReportMissedCollection;
  final VoidCallback onFaq;
  final VoidCallback onPrivacyPolicy;
  final VoidCallback onTermsOfService;
  final VoidCallback onChangePassword;
  final VoidCallback? onLogout;

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
        ProfileHeaderCard(
          customer: customer,
          onChangePhoto: onChangePhoto,
          isUploadingAvatar: isUploadingAvatar,
        ),
        const SizedBox(height: 18),
        _ProfileCardGrid(
          children: [
            SubscriptionCard(
              subscription: data.subscription,
              onManage: onManageSubscription,
            ),
            AddressCard(
              address: customer.primaryAddress,
              onEdit: onEditAddress,
            ),
          ],
        ),
        const SizedBox(height: 18),
        const PreferencesCard(),
        const SizedBox(height: 18),
        _ProfileCardGrid(
          children: [
            SupportCard(
              onContactSupport: onContactSupport,
              onReportMissedCollection: onReportMissedCollection,
              onFaq: onFaq,
            ),
            AccountCard(
              onPrivacyPolicy: onPrivacyPolicy,
              onTermsOfService: onTermsOfService,
              onChangePassword: onChangePassword,
              onLogout: onLogout,
            ),
          ],
        ),
        if (isSigningOut) ...[
          const SizedBox(height: 12),
          const LinearProgressIndicator(),
        ],
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
