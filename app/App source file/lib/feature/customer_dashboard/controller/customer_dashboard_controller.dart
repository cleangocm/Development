import 'package:get/get.dart';

class CustomerDashboardController extends GetxController {
  final selectedIndex = 0.obs;
  final paymentsRefreshToken = 0.obs;
  final notificationsRefreshToken = 0.obs;

  void selectTab(int index) {
    if (index < 0 || index >= 5) return;
    if (index == 2) paymentsRefreshToken.value++;
    if (index == 3) notificationsRefreshToken.value++;
    selectedIndex.value = index;
  }
}
