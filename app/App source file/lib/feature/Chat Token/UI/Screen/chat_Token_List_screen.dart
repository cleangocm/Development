import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:ultrawash/app/resource.dart';
import 'package:ultrawash/app/widget_button.dart';
import 'package:ultrawash/app/wtext.dart';
import 'package:ultrawash/feature/Chat Token/UI/controller/chat_token_conteroller.dart';
import 'package:ultrawash/feature/Chat Token/model/chat_model.dart';
import 'package:ultrawash/feature/Chat Token/UI/widget/add_chat_token_bottom_sheet.dart';

class ChatTokenListScreen extends StatefulWidget {
  const ChatTokenListScreen({super.key});

  @override
  State<ChatTokenListScreen> createState() => _ChatTokenListScreenState();
}

class _ChatTokenListScreenState extends State<ChatTokenListScreen> {
  final ChatTokenControllers _chatController = Get.find<ChatTokenControllers>();

  @override
  void initState() {
    super.initState();
    _chatController.getMyTickets();
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return '';
    try {
      final date = DateTime.parse(dateStr);
      return DateFormat('HH:mm, dd MMM yyyy').format(date);
    } catch (e) {
      return dateStr;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: R.color.background,
      body: Column(
        children: [
          // Header
          _buildHeader(),
          // Chat Token List
          Expanded(
            child: Obx(() {
              if (_chatController.isLoading.value) {
                return Center(
                  child: CircularProgressIndicator(
                    color: R.color.oceanBlue,
                  ),
                );
              }

              final tickets = _chatController.allTickets;

              if (tickets.isEmpty) {
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.chat_bubble_outline,
                        size: 48.sp,
                        color: Colors.grey,
                      ),
                      SizedBox(height: 12.h),
                      WText(
                        text: 'No chat tokens found',
                        fontSize: 14.sp,
                        color: Colors.grey,
                      ),
                    ],
                  ),
                );
              }

              return RefreshIndicator(
                onRefresh: () => _chatController.getMyTickets(),
                color: R.color.oceanBlue,
                child: ListView.builder(
                  padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 16.h),
                  itemCount: tickets.length,
                  itemBuilder: (context, index) {
                    return _buildChatTokenCard(tickets[index]);
                  },
                ),
              );
            }),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 16.h,
        left: 16.w,
        right: 16.w,
        bottom: 16.h,
      ),
      decoration: BoxDecoration(
        color: R.color.iceBlue,
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(16.r),
          bottomRight: Radius.circular(16.r),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              // GestureDetector(
              //   onTap: () => Get.back(),
              //   child: Icon(
              //     Icons.arrow_back_ios,
              //     color: R.color.charcoal,
              //     size: 20.sp,
              //   ),
              // ),
              SizedBox(width: 8.w),
              WText(
                text: 'Chat Token List',
                fontSize: 16.sp,
                fontWeight: FontWeight.w600,
                color: R.color.charcoal,
              ),
            ],
          ),
          // Add Button
          GestureDetector(
            onTap: () => AddChatTokenBottomSheet.show(context),
            child: Icon(
              Icons.add,
              color: R.color.charcoal,
              size: 24.sp,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildChatTokenCard(Tickets ticket) {
    final status = (ticket.status ?? '').toLowerCase();
    final isNew = status == 'open';
    final priority = (ticket.priority ?? '').toLowerCase();

    // Priority color
    Color priorityColor;
    switch (priority) {
      case 'urgent':
        priorityColor = Color(0xFFE53935);
        break;
      case 'high':
        priorityColor = Color(0xFFFF9800);
        break;
      case 'medium':
        priorityColor = Color(0xFF0F7BA0);
        break;
      case 'low':
        priorityColor = Color(0xFF4CAF50);
        break;
      default:
        priorityColor = R.color.coolGray2;
    }

    String priorityLabel = priority.isNotEmpty
        ? priority[0].toUpperCase() + priority.substring(1)
        : '';

    return Container(
      width: 380.w,
      margin: EdgeInsets.only(bottom: 8.h),
      padding: EdgeInsets.all(8.w),
      decoration: BoxDecoration(
        color: R.color.deepTeal,
        borderRadius: BorderRadius.circular(8.r),
        boxShadow: [
          BoxShadow(
            color: Color(0x33000000),
            blurRadius: 4,
            offset: Offset(0, 0),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Content
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Time
                WText(
                  text: _formatDate(ticket.createdAt),
                  fontSize: 10.sp,
                  fontWeight: FontWeight.w400,
                  color: R.color.coolGray2,
                ),
                SizedBox(height: 4.h),
                // Title
                WText(
                  text: ticket.subject ?? '',
                  fontSize: 12.sp,
                  fontWeight: FontWeight.w600,
                  color: R.color.charcoal,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                SizedBox(height: 4.h),
                // Message
                WText(
                  text: ticket.description ?? '',
                  fontSize: 10.sp,
                  fontWeight: FontWeight.w400,
                  color: R.color.slateBlueGrey,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          SizedBox(width: 8.w),
          // Badges Column
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              // New Badge
              if (isNew)
                Container(
                  padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 4.h),
                  decoration: BoxDecoration(
                    color: R.color.paleMint,
                    borderRadius: BorderRadius.circular(4.r),
                  ),
                  child: WText(
                    text: 'New',
                    fontSize: 10.sp,
                    fontWeight: FontWeight.w400,
                    color: R.color.coolGray2,
                  ),
                ),
              if (isNew) SizedBox(height: 4.h),
              // Priority Badge
              if (priorityLabel.isNotEmpty)
                Container(
                  padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 4.h),
                  decoration: BoxDecoration(
                    color: priorityColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(4.r),
                  ),
                  child: WText(
                    text: priorityLabel,
                    fontSize: 10.sp,
                    fontWeight: FontWeight.w500,
                    color: priorityColor,
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

}

