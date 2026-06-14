import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:ultrawash/app/resource.dart';
import 'package:ultrawash/app/widget_button.dart';
import 'package:ultrawash/app/winput_text.dart';
import 'package:ultrawash/app/wtext.dart';
import 'package:ultrawash/feature/profile/UI/controller/profile_controller.dart';

class PersonalInformationBottomSheet extends StatefulWidget {
  const PersonalInformationBottomSheet({super.key});

  @override
  State<PersonalInformationBottomSheet> createState() => _PersonalInformationBottomSheetState();
}

class _PersonalInformationBottomSheetState extends State<PersonalInformationBottomSheet> {
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _addressController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final ProfileControllers _profileController = Get.find<ProfileControllers>();
  final ImagePicker _imagePicker = ImagePicker();
  String? _profileImageUrl;
  File? _selectedImageFile;
  String? _selectedImageName;

  @override
  void initState() {
    super.initState();
    _loadProfileData();
  }

  void _loadProfileData() {
    final profile = _profileController.profileData.value?.data;
    if (profile != null) {
      _nameController.text = profile.name ?? '';
      _phoneController.text = profile.phone ?? '';
      _addressController.text = profile.address ?? '';
      _emailController.text = profile.email ?? '';
      _profileImageUrl = profile.profileImage;
    }
  }

  Future<void> _pickImageFromGallery() async {
    try {
      final XFile? image = await _imagePicker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 512,
        maxHeight: 512,
        imageQuality: 80,
      );

      if (image != null) {
        setState(() {
          _selectedImageFile = File(image.path);
          _selectedImageName = image.name;
        });

        // Upload image and get URL
        await _uploadImage(image);

        Get.snackbar(
          'Success',
          'Image selected from gallery',
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.green,
          colorText: Colors.white,
        );
      }
    } catch (e) {
      Get.snackbar(
        'Error',
        'Failed to pick image: $e',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red,
        colorText: Colors.white,
      );
    }
  }

  Future<void> _pickImageFromCamera() async {
    try {
      final XFile? image = await _imagePicker.pickImage(
        source: ImageSource.camera,
        maxWidth: 512,
        maxHeight: 512,
        imageQuality: 80,
      );

      if (image != null) {
        setState(() {
          _selectedImageFile = File(image.path);
          _selectedImageName = image.name;
        });

        // Upload image and get URL
        await _uploadImage(image);

        Get.snackbar(
          'Success',
          'Image captured from camera',
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.green,
          colorText: Colors.white,
        );
      }
    } catch (e) {
      Get.snackbar(
        'Error',
        'Failed to capture image: $e',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red,
        colorText: Colors.white,
      );
    }
  }

  Future<void> _uploadImage(XFile image) async {
    final imageUrl = await _profileController.uploadImage(File(image.path));
    if (imageUrl != null) {
      setState(() {
        _profileImageUrl = imageUrl;
      });
    }
  }

  Future<void> _handleUpdate() async {
    if (_nameController.text.isEmpty) {
      Get.snackbar(
        'Error',
        'Please enter your name',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red,
        colorText: Colors.white,
      );
      return;
    }
    if (_phoneController.text.isEmpty) {
      Get.snackbar(
        'Error',
        'Please enter your phone number',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red,
        colorText: Colors.white,
      );
      return;
    }

    final success = await _profileController.updateProfile(
      name: _nameController.text.trim(),
      phone: _phoneController.text.trim(),
      address: _addressController.text.trim(),
      profileImage: _profileImageUrl,
    );

    if (success && mounted) {
      Navigator.pop(context);
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Container(
        width: 412.w,
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
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Title
              WText(
                text: 'Update your personal Information',
                fontSize: 16.sp,
                fontWeight: FontWeight.w600,
                color: R.color.charcoal,
              ),
              SizedBox(height: 24.h),

              // Profile Image Card with border
              Container(
                width: 348.w,
                padding: EdgeInsets.all(20.w),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(10.r),
                  border: Border.all(
                    color: Color(0xFF8D99AE),
                    width: 1,
                  ),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Profile Image
                    Container(
                      width: 100.w,
                      height: 100.h,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: R.color.oceanBlue,
                          width: 2,
                        ),
                      ),
                      child: ClipOval(
                        child: _selectedImageFile != null
                          ? Image.file(
                              _selectedImageFile!,
                              fit: BoxFit.cover,
                              width: 100.w,
                              height: 100.h,
                            )
                          : (_profileImageUrl != null && _profileImageUrl!.isNotEmpty)
                            ? Image.network(
                                _profileImageUrl!,
                                fit: BoxFit.cover,
                                width: 100.w,
                                height: 100.h,
                                errorBuilder: (context, error, stackTrace) {
                                  return Image.network(
                                    'https://i.pravatar.cc/150?img=3',
                                    fit: BoxFit.cover,
                                  );
                                },
                              )
                            : Image.network(
                                'https://i.pravatar.cc/150?img=3',
                                fit: BoxFit.cover,
                              ),
                      ),
                    ),
                    SizedBox(height: 12.h),

                    // Upload Complete
                    WText(
                      text: _selectedImageFile != null ? 'Upload Complete' : 'No image selected',
                      fontSize: 14.sp,
                      fontWeight: FontWeight.w600,
                      color: R.color.charcoal,
                    ),
                    SizedBox(height: 4.h),
                    WText(
                      text: _selectedImageName ?? 'Select an image',
                      fontSize: 12.sp,
                      fontWeight: FontWeight.w400,
                      color: R.color.coolGray2,
                    ),
                    SizedBox(height: 16.h),

                    // OR Divider
                    Row(
                      children: [
                        Expanded(
                          child: Container(
                            height: 1,
                            color: Color(0xFFE5E7EB),
                          ),
                        ),
                        Padding(
                          padding: EdgeInsets.symmetric(horizontal: 16.w),
                          child: WText(
                            text: 'OR',
                            fontSize: 12.sp,
                            fontWeight: FontWeight.w400,
                            color: R.color.coolGray2,
                          ),
                        ),
                        Expanded(
                          child: Container(
                            height: 1,
                            color: Color(0xFFE5E7EB),
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 16.h),

                    // Open Gallery and Open Camera Buttons
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // Open Gallery Button
                        Expanded(
                          child: WButton(
                            onPressed: () => _pickImageFromGallery(),
                            label: 'Open Gallery',
                            height: 38.h,
                            decorationType: DecorationType.stroke,
                            buttonColor: R.color.charcoal,
                          ),
                        ),
                        SizedBox(width: 12.w),
                        // Open Camera Button
                        Expanded(
                          child: WButton(
                            onPressed: () => _pickImageFromCamera(),
                            label: 'Open Camera',
                            height: 38.h,
                            decorationType: DecorationType.solid,
                            buttonColor: R.color.coral,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              SizedBox(height: 24.h),

              // Name Field
              InputFieldText(
                textEditingController: _nameController,
                labelText: 'Full Name',
                hintText: 'Enter your name',
                height: 56,
              ),
              SizedBox(height: 16.h),

              // Phone Field
              InputFieldText(
                textEditingController: _phoneController,
                labelText: 'Phone',
                hintText: 'Enter your phone number',
                keyboardType: TextInputType.phone,
                height: 56,
              ),
              SizedBox(height: 16.h),

              // Address Field
              InputFieldText(
                textEditingController: _addressController,
                labelText: 'Address',
                hintText: 'Enter your address',
                height: 56,
              ),
              SizedBox(height: 16.h),

              // Email Field (read-only)
              InputFieldText(
                textEditingController: _emailController,
                labelText: 'Email',
                hintText: 'Your email',
                keyboardType: TextInputType.emailAddress,
                height: 56,
                readOnly: true,
              ),
              SizedBox(height: 24.h),

              // Update Button
              Obx(() => WButton(
                onPressed: () => _handleUpdate(),
                label: 'Update',
                isLoading: _profileController.isUpdating.value,
              )),
            ],
          ),
        ),
      ),
    );
  }
}

