class EachOrderMOdel {
  String? status;
  Data? data;

  EachOrderMOdel({this.status, this.data});

  EachOrderMOdel.fromJson(Map<String, dynamic> json) {
    status = json['status'];
    data = json['data'] != null ? new Data.fromJson(json['data']) : null;
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['status'] = this.status;
    if (this.data != null) {
      data['data'] = this.data!.toJson();
    }
    return data;
  }
}

class Data {
  CustomerLocation? customerLocation;
  String? sId;
  String? user;
  List<Items>? items;
  int? itemCount;
  String? itemsSummary;
  String? deliveryDate;
  String? status;
  int? discount;
  int? subtotal;
  int? totalPayment;
  String? couponCode;
  String? paymentMethod;
  String? paymentStatus;
  List<TrackingSteps>? trackingSteps;
  String? notes;
  String? address;
  BillingInfo? billingInfo;
  ShippingInfo? shippingInfo;
  Schedule? schedule;
  String? deliveryType;
  int? deliverySpeedCharge;
  dynamic pickupDeliveryBoy;
  String? pickupAssignedAt;
  String? pickedUpAt;
  dynamic assignedStaff;
  String? staffAssignedAt;
  String? cleaningStartedAt;
  String? cleaningCompletedAt;
  String? cleaningNotes;
  dynamic deliveryBoy;
  String? deliveryAssignedAt;
  String? deliveredAt;
  int? pickupCharge;
  int? deliveryCharge;
  dynamic store;
  String? orderDate;
  String? orderId;
  String? createdAt;
  String? updatedAt;

  Data(
      {this.customerLocation,
        this.sId,
        this.user,
        this.items,
        this.itemCount,
        this.itemsSummary,
        this.deliveryDate,
        this.status,
        this.discount,
        this.subtotal,
        this.totalPayment,
        this.couponCode,
        this.paymentMethod,
        this.paymentStatus,
        this.trackingSteps,
        this.notes,
        this.address,
        this.billingInfo,
        this.shippingInfo,
        this.schedule,
        this.deliveryType,
        this.deliverySpeedCharge,
        this.pickupDeliveryBoy,
        this.pickupAssignedAt,
        this.pickedUpAt,
        this.assignedStaff,
        this.staffAssignedAt,
        this.cleaningStartedAt,
        this.cleaningCompletedAt,
        this.cleaningNotes,
        this.deliveryBoy,
        this.deliveryAssignedAt,
        this.deliveredAt,
        this.pickupCharge,
        this.deliveryCharge,
        this.store,
        this.orderDate,
        this.orderId,
        this.createdAt,
        this.updatedAt});

  Data.fromJson(Map<String, dynamic> json) {
    customerLocation = json['customerLocation'] != null
        ? new CustomerLocation.fromJson(json['customerLocation'])
        : null;
    sId = json['_id'];
    user = json['user'];
    if (json['items'] != null) {
      items = <Items>[];
      json['items'].forEach((v) {
        items!.add(new Items.fromJson(v));
      });
    }
    itemCount = json['itemCount'];
    itemsSummary = json['itemsSummary'];
    deliveryDate = json['deliveryDate'];
    status = json['status'];
    discount = json['discount'];
    subtotal = json['subtotal'];
    totalPayment = json['totalPayment'];
    couponCode = json['couponCode'];
    paymentMethod = json['paymentMethod'];
    paymentStatus = json['paymentStatus'];
    if (json['trackingSteps'] != null) {
      trackingSteps = <TrackingSteps>[];
      json['trackingSteps'].forEach((v) {
        trackingSteps!.add(new TrackingSteps.fromJson(v));
      });
    }
    notes = json['notes'];
    address = json['address'];
    billingInfo = json['billingInfo'] != null
        ? new BillingInfo.fromJson(json['billingInfo'])
        : null;
    shippingInfo = json['shippingInfo'] != null
        ? new ShippingInfo.fromJson(json['shippingInfo'])
        : null;
    schedule = json['schedule'] != null
        ? new Schedule.fromJson(json['schedule'])
        : null;
    deliveryType = json['deliveryType'];
    deliverySpeedCharge = json['deliverySpeedCharge'];
    pickupDeliveryBoy = json['pickupDeliveryBoy'];
    pickupAssignedAt = json['pickupAssignedAt'];
    pickedUpAt = json['pickedUpAt'];
    assignedStaff = json['assignedStaff'];
    staffAssignedAt = json['staffAssignedAt'];
    cleaningStartedAt = json['cleaningStartedAt'];
    cleaningCompletedAt = json['cleaningCompletedAt'];
    cleaningNotes = json['cleaningNotes'];
    deliveryBoy = json['deliveryBoy'];
    deliveryAssignedAt = json['deliveryAssignedAt'];
    deliveredAt = json['deliveredAt'];
    pickupCharge = json['pickupCharge'];
    deliveryCharge = json['deliveryCharge'];
    store = json['store'];
    orderDate = json['orderDate'];
    orderId = json['orderId'];
    createdAt = json['createdAt'];
    updatedAt = json['updatedAt'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    if (this.customerLocation != null) {
      data['customerLocation'] = this.customerLocation!.toJson();
    }
    data['_id'] = this.sId;
    data['user'] = this.user;
    if (this.items != null) {
      data['items'] = this.items!.map((v) => v.toJson()).toList();
    }
    data['itemCount'] = this.itemCount;
    data['itemsSummary'] = this.itemsSummary;
    data['deliveryDate'] = this.deliveryDate;
    data['status'] = this.status;
    data['discount'] = this.discount;
    data['subtotal'] = this.subtotal;
    data['totalPayment'] = this.totalPayment;
    data['couponCode'] = this.couponCode;
    data['paymentMethod'] = this.paymentMethod;
    data['paymentStatus'] = this.paymentStatus;
    if (this.trackingSteps != null) {
      data['trackingSteps'] =
          this.trackingSteps!.map((v) => v.toJson()).toList();
    }
    data['notes'] = this.notes;
    data['address'] = this.address;
    if (this.billingInfo != null) {
      data['billingInfo'] = this.billingInfo!.toJson();
    }
    if (this.shippingInfo != null) {
      data['shippingInfo'] = this.shippingInfo!.toJson();
    }
    if (this.schedule != null) {
      data['schedule'] = this.schedule!.toJson();
    }
    data['deliveryType'] = this.deliveryType;
    data['deliverySpeedCharge'] = this.deliverySpeedCharge;
    data['pickupDeliveryBoy'] = this.pickupDeliveryBoy;
    data['pickupAssignedAt'] = this.pickupAssignedAt;
    data['pickedUpAt'] = this.pickedUpAt;
    data['assignedStaff'] = this.assignedStaff;
    data['staffAssignedAt'] = this.staffAssignedAt;
    data['cleaningStartedAt'] = this.cleaningStartedAt;
    data['cleaningCompletedAt'] = this.cleaningCompletedAt;
    data['cleaningNotes'] = this.cleaningNotes;
    data['deliveryBoy'] = this.deliveryBoy;
    data['deliveryAssignedAt'] = this.deliveryAssignedAt;
    data['deliveredAt'] = this.deliveredAt;
    data['pickupCharge'] = this.pickupCharge;
    data['deliveryCharge'] = this.deliveryCharge;
    data['store'] = this.store;
    data['orderDate'] = this.orderDate;
    data['orderId'] = this.orderId;
    data['createdAt'] = this.createdAt;
    data['updatedAt'] = this.updatedAt;
    return data;
  }
}

class CustomerLocation {
  String? type;
  List<num>? coordinates;

  CustomerLocation({this.type, this.coordinates});

  CustomerLocation.fromJson(Map<String, dynamic> json) {
    type = json['type'];
    if (json['coordinates'] != null) {
      coordinates = (json['coordinates'] as List).map((e) => e as num).toList();
    }
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['type'] = this.type;
    data['coordinates'] = this.coordinates;
    return data;
  }
}

class Items {
  String? service;
  String? serviceName;
  int? quantity;
  int? price;
  int? subtotal;

  Items(
      {this.service,
        this.serviceName,
        this.quantity,
        this.price,
        this.subtotal});

  Items.fromJson(Map<String, dynamic> json) {
    service = json['service'];
    serviceName = json['serviceName'];
    quantity = json['quantity'];
    price = json['price'];
    subtotal = json['subtotal'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['service'] = this.service;
    data['serviceName'] = this.serviceName;
    data['quantity'] = this.quantity;
    data['price'] = this.price;
    data['subtotal'] = this.subtotal;
    return data;
  }
}

class TrackingSteps {
  String? title;
  String? date;
  String? status;

  TrackingSteps({this.title, this.date, this.status});

  TrackingSteps.fromJson(Map<String, dynamic> json) {
    title = json['title'];
    date = json['date'];
    status = json['status'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['title'] = this.title;
    data['date'] = this.date;
    data['status'] = this.status;
    return data;
  }
}

class BillingInfo {
  String? fullName;
  String? email;
  String? phone;
  String? alternativePhone;
  String? address;
  String? additionalInstruction;

  BillingInfo(
      {this.fullName,
        this.email,
        this.phone,
        this.alternativePhone,
        this.address,
        this.additionalInstruction});

  BillingInfo.fromJson(Map<String, dynamic> json) {
    fullName = json['fullName'];
    email = json['email'];
    phone = json['phone'];
    alternativePhone = json['alternativePhone'];
    address = json['address'];
    additionalInstruction = json['additionalInstruction'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['fullName'] = this.fullName;
    data['email'] = this.email;
    data['phone'] = this.phone;
    data['alternativePhone'] = this.alternativePhone;
    data['address'] = this.address;
    data['additionalInstruction'] = this.additionalInstruction;
    return data;
  }
}

class ShippingInfo {
  String? fullName;
  String? phone;
  String? alternativePhone;
  String? address;
  String? additionalInstruction;

  ShippingInfo(
      {this.fullName,
        this.phone,
        this.alternativePhone,
        this.address,
        this.additionalInstruction});

  ShippingInfo.fromJson(Map<String, dynamic> json) {
    fullName = json['fullName'];
    phone = json['phone'];
    alternativePhone = json['alternativePhone'];
    address = json['address'];
    additionalInstruction = json['additionalInstruction'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['fullName'] = this.fullName;
    data['phone'] = this.phone;
    data['alternativePhone'] = this.alternativePhone;
    data['address'] = this.address;
    data['additionalInstruction'] = this.additionalInstruction;
    return data;
  }
}

class Schedule {
  String? pickupDate;
  String? pickupSlot;
  String? deliveryDate;
  String? deliverySlot;

  Schedule(
      {this.pickupDate, this.pickupSlot, this.deliveryDate, this.deliverySlot});

  Schedule.fromJson(Map<String, dynamic> json) {
    pickupDate = json['pickupDate'];
    pickupSlot = json['pickupSlot'];
    deliveryDate = json['deliveryDate'];
    deliverySlot = json['deliverySlot'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['pickupDate'] = this.pickupDate;
    data['pickupSlot'] = this.pickupSlot;
    data['deliveryDate'] = this.deliveryDate;
    data['deliverySlot'] = this.deliverySlot;
    return data;
  }
}
