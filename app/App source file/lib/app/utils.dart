
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import 'resource.dart';

TextStyle defaultTextStyle({double fontSize = 14, FontWeight fontWeight = FontWeight.w500, Color? color}){
  return TextStyle(
      fontFamily: "Satoshi",
      fontSize: fontSize,
      fontWeight: fontWeight,

      color: color ?? Colors.green,
      height: 1.2
  );
}