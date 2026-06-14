import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ultrawash/core/service/api_service/api_service.dart';
import 'package:ultrawash/feature/Chat Token/model/chat_model.dart';

class ChatTokenControllers extends GetxController {
  final NetworkService _networkService = NetworkService();

  // Observable states
  final RxBool isLoading = false.obs;
  final RxBool isCreating = false.obs;
  final RxString errorMessage = ''.obs;

  // Tickets data
  final Rx<ChatTickestModel?> ticketsData = Rx<ChatTickestModel?>(null);

  /// Clear all cached data (call on logout or before new login)
  void clearData() {
    ticketsData.value = null;
    errorMessage.value = '';
  }

  // GET /tickets/my-tickets - Get all user tickets
  Future<bool> getMyTickets() async {
    try {
      isLoading.value = true;
      errorMessage.value = '';

      final response = await _networkService.client.getRequest('/tickets/my-tickets');

      if (response.isSuccess && response.responseData != null) {
        ticketsData.value = ChatTickestModel.fromJson(response.responseData);
        return true;
      }

      errorMessage.value = response.errorMessage ?? 'Failed to get tickets';
      _showErrorSnackbar(errorMessage.value);
      return false;
    } catch (e) {
      errorMessage.value = e.toString();
      _showErrorSnackbar(errorMessage.value);
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  // POST /tickets - Create a new ticket
  Future<bool> createTicket({
    required String subject,
    required String description,
    String category = 'order',
    String priority = 'medium',
  }) async {
    try {
      isCreating.value = true;
      errorMessage.value = '';

      final response = await _networkService.client.postRequest(
        '/tickets',
        body: {
          'subject': subject,
          'description': description,
          'category': category,
          'priority': priority,
        },
      );

      if (response.isSuccess && response.responseData != null) {
        final status = response.responseData['status'];
        if (status == 'success') {
          // Refresh tickets list
          await getMyTickets();
          _showSuccessSnackbar('Chat token created successfully');
          return true;
        }
      }

      errorMessage.value = response.errorMessage ?? 'Failed to create ticket';
      _showErrorSnackbar(errorMessage.value);
      return false;
    } catch (e) {
      errorMessage.value = e.toString();
      _showErrorSnackbar(errorMessage.value);
      return false;
    } finally {
      isCreating.value = false;
    }
  }

  // Helper getters
  List<Tickets> get allTickets => ticketsData.value?.data?.tickets ?? [];

  void _showSuccessSnackbar(String message) {
    Get.snackbar(
      'Success',
      message,
      snackPosition: SnackPosition.BOTTOM,
      backgroundColor: Colors.green,
      colorText: Colors.white,
      duration: const Duration(seconds: 2),
    );
  }

  void _showErrorSnackbar(String message) {
    Get.snackbar(
      'Error',
      message,
      snackPosition: SnackPosition.BOTTOM,
      backgroundColor: Colors.red,
      colorText: Colors.white,
      duration: const Duration(seconds: 3),
    );
  }
}

