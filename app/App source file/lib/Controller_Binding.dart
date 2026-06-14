import 'package:get/get.dart';
import 'package:ultrawash/feature/auth/ui/controller/auth_controller.dart';
import 'package:ultrawash/feature/profile/UI/controller/profile_controller.dart';
import 'package:ultrawash/feature/Add/UI/controller/add_service_controller.dart';
import 'package:ultrawash/feature/order/ui/controller/order_controller.dart';
import 'package:ultrawash/feature/Chat Token/UI/controller/chat_token_conteroller.dart';

class ControllerBinding extends Bindings {
  @override
  void dependencies() {
    /// 🔥 This ensures the controller is created once and available globally
    Get.put<AuthController>(AuthController(), permanent: true);
    Get.put<ProfileControllers>(ProfileControllers(), permanent: true);
    Get.put<AddServiceControllers>(AddServiceControllers(), permanent: true);
    Get.put<OrderControllers>(OrderControllers(), permanent: true);
    Get.put<ChatTokenControllers>(ChatTokenControllers(), permanent: true);
  }
}
