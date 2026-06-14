import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:ultrawash/app/resource.dart';
import 'package:ultrawash/app/widget_button.dart';
import 'package:ultrawash/app/wtext.dart';
import 'package:ultrawash/feature/Chat Token/UI/controller/chat_token_conteroller.dart';

class AddChatTokenBottomSheet extends StatefulWidget {
  const AddChatTokenBottomSheet({super.key});

  static void show(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const AddChatTokenBottomSheet(),
    );
  }

  @override
  State<AddChatTokenBottomSheet> createState() =>
      _AddChatTokenBottomSheetState();
}

class _AddChatTokenBottomSheetState extends State<AddChatTokenBottomSheet> {
  final ChatTokenControllers _chatController = Get.find<ChatTokenControllers>();

  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();

  String _selectedCategory = 'other';
  String _selectedPriority = 'medium';

  final List<Map<String, String>> _categories = [
    {'value': 'order_issue', 'label': 'Order Issue'},
    {'value': 'payment_issue', 'label': 'Payment Issue'},
    {'value': 'delivery_issue', 'label': 'Delivery Issue'},
    {'value': 'service_quality', 'label': 'Service Quality'},
    {'value': 'other', 'label': 'Other'},
  ];

  final List<Map<String, String>> _priorities = [
    {'value': 'low', 'label': 'Low'},
    {'value': 'medium', 'label': 'Medium'},
    {'value': 'high', 'label': 'High'},
    {'value': 'urgent', 'label': 'Urgent'},
  ];

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Container(
        width: double.infinity,
        padding: EdgeInsets.only(
          top: 32.h,
          right: 32.w,
          bottom: 48.h,
          left: 32.w,
        ),
        decoration: BoxDecoration(
          color: R.color.deepTeal,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(32.r),
            topRight: Radius.circular(32.r),
          ),
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  WText(
                    text: 'New Support Ticket',
                    fontSize: 18.sp,
                    fontWeight: FontWeight.w700,
                    color: R.color.charcoal,
                  ),
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Icon(
                      Icons.close,
                      color: R.color.charcoal,
                      size: 24.sp,
                    ),
                  ),
                ],
              ),
              SizedBox(height: 24.h),

              // Subject Field
              WText(
                text: 'Subject *',
                fontSize: 13.sp,
                fontWeight: FontWeight.w500,
                color: R.color.charcoal,
              ),
              SizedBox(height: 8.h),
              _buildTextField(
                controller: _titleController,
                hintText: 'Brief summary of your issue',
              ),
              SizedBox(height: 16.h),

              // Category and Priority Row
              Row(
                children: [
                  // Category Dropdown
                  Expanded(
                    child: _buildDropdown(
                      label: 'Category',
                      value: _selectedCategory,
                      items: _categories,
                      onChanged: (value) {
                        setState(() => _selectedCategory = value!);
                      },
                    ),
                  ),
                  SizedBox(width: 12.w),
                  // Priority Dropdown
                  Expanded(
                    child: _buildDropdown(
                      label: 'Priority',
                      value: _selectedPriority,
                      items: _priorities,
                      onChanged: (value) {
                        setState(() => _selectedPriority = value!);
                      },
                    ),
                  ),
                ],
              ),
              SizedBox(height: 16.h),

              // Description Field
              WText(
                text: 'Describe your problem *',
                fontSize: 13.sp,
                fontWeight: FontWeight.w500,
                color: R.color.charcoal,
              ),
              SizedBox(height: 8.h),
              _buildTextField(
                controller: _descriptionController,
                hintText: 'Explain your issue in detail...',
                maxLines: 5,
              ),
              SizedBox(height: 16.h),

              // Divider
              Divider(color: Color(0xFFE0E0E0), height: 1),
              SizedBox(height: 16.h),

              // Submit Button
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Obx(() => SizedBox(
                        width: 180.w,
                        child: WButton(
                          onPressed: _chatController.isCreating.value
                              ? () {}
                              : _onSubmit,
                          label: 'Submit Ticket',
                          isLoading: _chatController.isCreating.value,
                          height: 44.h,
                          radius: 8.r,
                          buttonColor: R.color.paleMint,
                          textColor: R.color.charcoal,
                          fontSize: 14.sp,
                          fontWeight: FontWeight.w600,
                          iconWidget: Icon(
                            Icons.add,
                            size: 18.sp,
                            color: R.color.charcoal,
                          ),
                        ),
                      )),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hintText,
    int maxLines = 1,
  }) {
    return TextField(
      controller: controller,
      maxLines: maxLines,
      decoration: InputDecoration(
        hintText: hintText,
        hintStyle: TextStyle(
          fontSize: 13.sp,
          color: R.color.coolGray2,
        ),
        filled: true,
        fillColor: R.color.background,
        contentPadding: EdgeInsets.symmetric(
          horizontal: 16.w,
          vertical: 14.h,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8.r),
          borderSide: BorderSide(color: Color(0xFFE0E0E0)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8.r),
          borderSide: BorderSide(color: Color(0xFFE0E0E0)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8.r),
          borderSide: BorderSide(color: R.color.oceanBlue),
        ),
      ),
    );
  }

  Widget _buildDropdown({
    required String label,
    required String value,
    required List<Map<String, String>> items,
    required ValueChanged<String?> onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        WText(
          text: label,
          fontSize: 13.sp,
          fontWeight: FontWeight.w500,
          color: R.color.charcoal,
        ),
        SizedBox(height: 8.h),
        Container(
          padding: EdgeInsets.symmetric(horizontal: 12.w),
          decoration: BoxDecoration(
            color: R.color.background,
            borderRadius: BorderRadius.circular(8.r),
            border: Border.all(color: Color(0xFFE0E0E0)),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: value,
              isExpanded: true,
              icon: Icon(
                Icons.keyboard_arrow_down,
                color: R.color.charcoal,
              ),
              style: TextStyle(
                fontSize: 13.sp,
                color: R.color.charcoal,
              ),
              dropdownColor: R.color.deepTeal,
              items: items.map((item) {
                return DropdownMenuItem<String>(
                  value: item['value'],
                  child: Text(item['label']!),
                );
              }).toList(),
              onChanged: onChanged,
            ),
          ),
        ),
      ],
    );
  }

  Future<void> _onSubmit() async {
    final subject = _titleController.text.trim();
    final description = _descriptionController.text.trim();

    if (subject.isEmpty) {
      Get.snackbar(
        'Error',
        'Please enter a subject',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red,
        colorText: Colors.white,
      );
      return;
    }
    if (description.isEmpty) {
      Get.snackbar(
        'Error',
        'Please describe your problem',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red,
        colorText: Colors.white,
      );
      return;
    }

    final success = await _chatController.createTicket(
      subject: subject,
      description: description,
      category: _selectedCategory,
      priority: _selectedPriority,
    );

    if (success && mounted) {
      Navigator.pop(context);
    }
  }
}

