class BillingInfo {
  String fullName;
  String email;
  String phone;
  String alternativePhone;
  String address;
  String additionalInstruction;

  BillingInfo({
    this.fullName = '',
    this.email = '',
    this.phone = '',
    this.alternativePhone = '',
    this.address = '',
    this.additionalInstruction = '',
  });

  Map<String, dynamic> toJson() => {
    'fullName': fullName,
    'email': email,
    'phone': phone,
    'alternativePhone': alternativePhone,
    'address': address,
    'additionalInstruction': additionalInstruction,
  };
}

class ShippingInfo {
  String fullName;
  String phone;
  String alternativePhone;
  String address;
  String additionalInstruction;

  ShippingInfo({
    this.fullName = '',
    this.phone = '',
    this.alternativePhone = '',
    this.address = '',
    this.additionalInstruction = '',
  });

  Map<String, dynamic> toJson() => {
    'fullName': fullName,
    'phone': phone,
    'alternativePhone': alternativePhone,
    'address': address,
    'additionalInstruction': additionalInstruction,
  };
}

