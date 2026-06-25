import 'package:get/get.dart';

class CustomerDashboardController extends GetxController {
  final selectedIndex = 0.obs;

  void selectTab(int index) {
    if (index >= 0 && index < 5) selectedIndex.value = index;
  }
}