import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:ultrawash/app/resource.dart';
import 'package:ultrawash/app/wtext.dart';
import 'package:ultrawash/feature/Add/UI/controller/add_service_controller.dart';
import 'package:ultrawash/feature/Add/model/add_service_model.dart';
import 'package:ultrawash/feature/Cloth type/model/service_order_model.dart';
import 'package:ultrawash/feature/Cloth type/UI/screen/Select_Cloth_type_screen.dart';
import '../widget/service_card_widget.dart';

class AddScreen extends StatefulWidget {
  final List<ServiceOrder>? existingOrders;

  const AddScreen({super.key, this.existingOrders});

  @override
  State<AddScreen> createState() => _AddScreenState();
}

class _AddScreenState extends State<AddScreen> {
  final AddServiceControllers _serviceController = Get.find<AddServiceControllers>();

  // Gradient colors for services
  final List<String> _gradientKeys = ['lightSkyBlue', 'lavender', 'paleBlue', 'creamYellow'];

  @override
  void initState() {
    super.initState();
    // Load services if not already loaded
    if (_serviceController.servicesData.value == null) {
      _serviceController.getAllServices();
    }
  }

  List<Color> _getGradientColors(String gradient) {
    switch (gradient) {
      case 'lightSkyBlue':
        return R.color.lightSkyBlue;
      case 'lavender':
        return R.color.lavender;
      case 'paleBlue':
        return R.color.paleBlue;
      case 'creamYellow':
        return R.color.creamYellow;
      default:
        return R.color.lightSkyBlue;
    }
  }

  String _getGradientKeyForIndex(int index) {
    return _gradientKeys[index % _gradientKeys.length];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: R.color.background,
      body: Obx(() {
        // Show loading state
        if (_serviceController.isLoading.value && _serviceController.servicesData.value == null) {
          return Center(
            child: CircularProgressIndicator(
              color: R.color.oceanBlue,
            ),
          );
        }

        return SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Container(
                width: double.infinity,
                padding: EdgeInsets.only(
                  top: MediaQuery.of(context).padding.top + 16.h,
                  bottom: 16.h,
                  left: 16.w,
                  right: 16.w,
                ),
                decoration: BoxDecoration(
                  color: R.color.iceBlue2,
                  borderRadius: BorderRadius.only(
                    bottomLeft: Radius.circular(16.r),
                    bottomRight: Radius.circular(16.r),
                  ),
                ),
                child: Row(
                  children: [
                    // GestureDetector(
                    //   // onTap: () => Get.back(),
                    //   child: Icon(
                    //     Icons.arrow_back_ios,
                    //     color: R.color.charcoal,
                    //     size: 18.sp,
                    //   ),
                    // ),
                    SizedBox(width: 8.w),
                    WText(
                      text: "Select Services",
                      color: R.color.charcoal,
                    ),
                  ],
                ),
              ),
              SizedBox(height: 16.h),

              // Regular Services Section
              if (_serviceController.regularServices.isNotEmpty) ...[
                _buildSectionHeader('Regular Services', R.color.tealBlue),
                _buildServicesGridFromData(_serviceController.regularServices.toList()),
              ],

              // Special Services Section
              if (_serviceController.specialServices.isNotEmpty) ...[
                _buildSectionHeader('Special Services', R.color.tealBlue),
                _buildServicesGridFromData(_serviceController.specialServices.toList()),
              ],

              SizedBox(height: 120.h),
            ],
          ),
        );
      }),
    );
  }

  Widget _buildSectionHeader(String title, Color backgroundColor) {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: 16.w),
      child: Container(
        width: 380.w,
        height: 39.h,
        padding: EdgeInsets.all(10.w),
        decoration: BoxDecoration(
          color: backgroundColor,
          borderRadius: BorderRadius.circular(8.r),
        ),
        child: WText(
          text: title,
          fontSize: 14.sp,
          fontWeight: FontWeight.w600,
          color: R.color.white2,
        ),
      ),
    );
  }

  Widget _buildServicesGridFromData(List<Data> services) {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: 16.w),
      child: GridView.builder(
        shrinkWrap: true,
        padding: EdgeInsets.only(top: 10.h, bottom: 20.h),
        physics: NeverScrollableScrollPhysics(),
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 8.w,
          mainAxisSpacing: 8.h,
          childAspectRatio: 182 / 177,
        ),
        itemCount: services.length,
        itemBuilder: (context, index) {
          final service = services[index];
          final gradientKey = _getGradientKeyForIndex(index);
          return ServiceCardWidget(
            service: service,
            gradientColors: _getGradientColors(gradientKey),
            onTap: () {
              Get.to(() => SelectClothTypeScreen(
                serviceSlug: service.slug ?? '',
                existingOrders: widget.existingOrders,
              ));
            },
          );
        },
      ),
    );
  }

}
