import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

class KColors {
  static KColors instance = KColors();

  // Get current theme mode
  bool get isDarkMode {
    try {
      return Get.isDarkMode;
    } catch (e) {
      return false;
    }
  }

  // Primary colors (same for both themes)
  Color get mintGreen => const Color(0xFF98D8C8);
  Color get coral => const Color(0xFFFF6B6B);
  Color get oceanBlue => const Color(0xFF0F7BA0);
  Color get tealOcean => const Color(0xFF1B7F8F);
  Color get tealDeep => const Color(0xFF1A535C);
  Color get white2 => const Color(0xFFFFFFFF);
  Color get crimsonRed => const Color(0xFFD20000);
  Color get emeraldGreen => const Color(0xFF0FA02A);
  Color get coolGray2 => const Color(0xFF9BAAC0);
  Color get charcoal1 => const Color(0xFF171A20);
  Color get slateGray => const Color(0xFF414B5B);
  Color get paleMint => const Color(0xFFD2FFC4);
  Color get oceanBlue1 => const Color(0xFF0D8AB4);
  Color get cadetGray => const Color(0xFF8D99AE);
  Color get silver => const Color(0xFFD4D4D4);

  Color get softTeal =>isDarkMode ? const Color(0xFF000000): const Color(0xFF2A8B9B);
  Color get primaryIndigo => isDarkMode ?const Color(0xFF0F7BA0):const Color(0xFF757ADB);
  Color get charcoal =>isDarkMode ?const Color(0xFFFFFFFF): const Color(0xFF171A20);
  Color get lightSkyBlue2 => const Color(0xFF8FD4FF);
  Color get coolGray12 =>isDarkMode ?const Color(0xFF9BAAC0): const Color(0xFF0F7BA0);
  Color get darkGray1 =>isDarkMode ?const Color(0xFFFFFFFF): const Color(0xFF333333);

  // Service card gradient colors
  List<Color> get lightSkyBlue => isDarkMode
      ? [const Color(0xFF8FD4FF), const Color(0xFFB8E4FF)]
      : [const Color(0xFF8FD4FF), const Color(0xFFB8E4FF)];
  List<Color> get lavender => isDarkMode
      ? [const Color(0xFFE4C9FF), const Color(0xFFF0DEFF)]
      : [const Color(0xFFE4C9FF), const Color(0xFFF0DEFF)];
  List<Color> get paleBlue => isDarkMode
      ? [const Color(0xFFDBE5FF), const Color(0xFFECF1FF)]
      : [const Color(0xFFDBE5FF), const Color(0xFFECF1FF)];
  List<Color> get creamYellow => isDarkMode
      ? [const Color(0xFFFFF9C7), const Color(0xFFFFFBDB)]
      : [const Color(0xFFFFF9C7), const Color(0xFFFFFBDB)];

  // Dynamic colors that change based on theme
  Color get white => isDarkMode ? const Color(0xFF121212) : const Color(0xFFFFFFFF);
  Color get black => isDarkMode ? const Color(0xFFFFFFFF) : const Color(0xFF000000);
  Color get iceBlue => isDarkMode ? const Color(0xFF1E1E1E) : const Color(0xFFF3F7FF);
  Color get iceBlue2 => isDarkMode ?const Color(0xFF000000): const Color(0xFFF3F7FF);
  Color get tealBlue => const Color(0xFF317C96);
  Color get deepTeal1 =>isDarkMode ?const Color(0xFF043242): const Color(0xFFF3F7FF);
  Color get cyanBlue => const Color(0xFF00C0E8);
  Color get blackOverlay => const Color(0x33000000);
  Color get emeraldGreen1 => const Color(0xFF109D58);
  Color get iceCyan => const Color(0xFFF3FCFF);
  Color get lightGray1 => const Color(0xFFEDEDED);
  Color get royalBlue => const Color(0xFF1A1F71);

  // Background colors
  Color get background => isDarkMode ? const Color(0xFF022531) : const Color(0xFFFDFDFD);
  Color get cardBackground => isDarkMode ? const Color(0xFF1E1E1E) : const Color(0xFFFFFFFF);
  Color get snowWhite =>isDarkMode ?const Color(0xFFFDFDFD): const Color(0xFFFDFDFD);
  Color get deepTeal => isDarkMode ?const Color(0xFF043242): const Color(0xFFFFFFFF);
  Color get mintGreen2 => const Color(0xFF94EDA1);
  Color get paleBlue2 => const Color(0xFFD5DEEB);
  Color get midnightBlue =>isDarkMode ? const Color(0xFF141B34):const Color(0xFF062556);
  Color get midnightBlue1 => isDarkMode ? const Color(0xFFFFFFFF):const Color(0xFF062556);
  Color get darkTeal =>isDarkMode ?const Color(0xFF022531): const Color(0xFFFFFFFF);
  Color get darkTeal1 =>isDarkMode ? Colors.transparent: const Color(0xFFB0B8C4);

  // Text colors
  Color get primaryText => isDarkMode ? const Color(0xFFFFFFFF) : const Color(0xFF333333);
  Color get secondaryText => isDarkMode ? const Color(0xB3FFFFFF) : const Color(0xFF666666);
  Color get grey1 => isDarkMode ? const Color(0xFFE5E7EB) : const Color(0xFF333333);
  Color get deepNavyBlue2 => isDarkMode ? const Color(0xFF0F7BA0) : const Color(0xFF062556);
  // Navigation & UI colors
  Color get navySlate => isDarkMode ? const Color(0xFFFAFCFE) : const Color(0xFF2D3E50);
  Color get darkGray => isDarkMode ? const Color(0xFFE5E7EB) : const Color(0xFF5A5A5A);
  Color get coolGray => isDarkMode ? const Color(0xFF9CA3AF) : const Color(0xFF9E9E9E);
  Color get lightBlue => isDarkMode ? const Color(0xFF374151) : const Color(0xFFE8F4F8);
  Color get deepNavy => isDarkMode ? const Color(0xFFFAFCFE) : const Color(0xFF1B2B4B);
  Color get lightGray => isDarkMode ? const Color(0xFF1E1E1E) : const Color(0xFFF5F5F5);
  Color get deepNavyBlue => isDarkMode ? const Color(0xFFFAFCFE) : const Color(0xFF062556);
  Color get charcoalNavy => isDarkMode ? const Color(0xFFE5E7EB) : const Color(0xFF171A20);
  Color get slateBlueGrey => isDarkMode ? const Color(0xFF9BAAC0) : const Color(0xFF414B5B);
  Color get mutedIndigo => isDarkMode ? const Color(0xFF9CA3AF) : const Color(0xFF616A88);
  Color get coolBlueGrey => isDarkMode ? const Color(0xFFB0B8C4) : const Color(0xFF8D99AE);

  // Header colors
  Color get header => isDarkMode ? const Color(0xFF5A4FCF) : const Color(0xFF8B7FE8);

  // Shadow color
  Color get shadowColor => isDarkMode ? const Color(0x40000000) : const Color(0x1A000000);


}
