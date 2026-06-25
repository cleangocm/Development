import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ultrawash/feature/customer_dashboard/collections/collections_tab.dart';
import 'package:ultrawash/feature/customer_dashboard/controller/customer_dashboard_controller.dart';
import 'package:ultrawash/feature/customer_dashboard/home/home_tab.dart';
import 'package:ultrawash/feature/customer_dashboard/notifications/notifications_tab.dart';
import 'package:ultrawash/feature/customer_dashboard/payments/payments_tab.dart';
import 'package:ultrawash/feature/customer_dashboard/profile/profile_tab.dart';

class CleanGoCustomerDashboardShell extends StatefulWidget {
  const CleanGoCustomerDashboardShell({super.key});

  @override
  State<CleanGoCustomerDashboardShell> createState() => _CleanGoCustomerDashboardShellState();
}

class _CleanGoCustomerDashboardShellState extends State<CleanGoCustomerDashboardShell> {
  late final CustomerDashboardController controller;

  static const _tabs = [
    HomeTab(),
    CollectionsTab(),
    PaymentsTab(),
    NotificationsTab(),
    ProfileTab(),
  ];

  @override
  void initState() {
    super.initState();
    controller = Get.put(CustomerDashboardController());
  }

  @override
  void dispose() {
    if (Get.isRegistered<CustomerDashboardController>()) {
      Get.delete<CustomerDashboardController>();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Obx(() => Scaffold(
      appBar: AppBar(
        title: const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('CLEANGO CM', style: TextStyle(fontWeight: FontWeight.w800)),
          Text('Simple. Reliable. Clean.', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w400)),
        ]),
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
      ),
      body: IndexedStack(index: controller.selectedIndex.value, children: _tabs),
      bottomNavigationBar: NavigationBar(
        selectedIndex: controller.selectedIndex.value,
        onDestinationSelected: controller.selectTab,
        indicatorColor: const Color(0xFFDDF7E5),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.local_shipping_outlined), selectedIcon: Icon(Icons.local_shipping), label: 'Collections'),
          NavigationDestination(icon: Icon(Icons.account_balance_wallet_outlined), selectedIcon: Icon(Icons.account_balance_wallet), label: 'Payments'),
          NavigationDestination(icon: Icon(Icons.notifications_none), selectedIcon: Icon(Icons.notifications), label: 'Notifications'),
          NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    ));
  }
}