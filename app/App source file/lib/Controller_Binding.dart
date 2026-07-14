import 'package:get/get.dart';
import 'package:ultrawash/feature/Add/UI/controller/add_service_controller.dart';
import 'package:ultrawash/feature/Chat Token/UI/controller/chat_token_conteroller.dart';
import 'package:ultrawash/feature/auth/ui/controller/auth_controller.dart';
import 'package:ultrawash/feature/order/ui/controller/order_controller.dart';
import 'package:ultrawash/feature/profile/UI/controller/profile_controller.dart';

class CleangoCoreBinding extends Bindings {
  @override
  void dependencies() {
    if (!Get.isRegistered<AuthController>()) {
      Get.put<AuthController>(AuthController(), permanent: true);
    }
  }
}

class LegacyLaundryBinding extends Bindings {
  @override
  void dependencies() {
    if (!Get.isRegistered<ProfileControllers>()) {
      Get.put<ProfileControllers>(ProfileControllers(), permanent: true);
    }
    if (!Get.isRegistered<AddServiceControllers>()) {
      Get.put<AddServiceControllers>(AddServiceControllers(), permanent: true);
    }
    if (!Get.isRegistered<OrderControllers>()) {
      Get.put<OrderControllers>(OrderControllers(), permanent: true);
    }
    if (!Get.isRegistered<ChatTokenControllers>()) {
      Get.put<ChatTokenControllers>(ChatTokenControllers(), permanent: true);
    }
  }
}

class ControllerBinding extends CleangoCoreBinding {}
