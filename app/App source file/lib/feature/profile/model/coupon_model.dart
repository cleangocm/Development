class CoupomModel {
  String? status;
  List<Data>? data;

  CoupomModel({this.status, this.data});

  CoupomModel.fromJson(Map<String, dynamic> json) {
    status = json['status'];
    if (json['data'] != null) {
      data = <Data>[];
      json['data'].forEach((v) {
        data!.add(Data.fromJson(v));
      });
    }
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['status'] = this.status;
    if (this.data != null) {
      data['data'] = this.data!.map((v) => v.toJson()).toList();
    }
    return data;
  }
}

class Data {
  String? sId;
  String? code;
  String? title;
  String? description;
  String? discountType;
  int? discountValue;
  int? minOrderValue;
  int? maxDiscount;
  String? expiryDate;
  int? usageLimit;
  int? usedCount;
  int? perUserLimit;
  bool? isActive;
  List<dynamic>? usedBy;
  String? createdAt;
  String? updatedAt;

  Data({
    this.sId,
    this.code,
    this.title,
    this.description,
    this.discountType,
    this.discountValue,
    this.minOrderValue,
    this.maxDiscount,
    this.expiryDate,
    this.usageLimit,
    this.usedCount,
    this.perUserLimit,
    this.isActive,
    this.usedBy,
    this.createdAt,
    this.updatedAt,
  });

  Data.fromJson(Map<String, dynamic> json) {
    sId = json['_id'];
    code = json['code'];
    title = json['title'];
    description = json['description'];
    discountType = json['discountType'];
    discountValue = json['discountValue'];
    minOrderValue = json['minOrderValue'];
    maxDiscount = json['maxDiscount'];
    expiryDate = json['expiryDate'];
    usageLimit = json['usageLimit'];
    usedCount = json['usedCount'];
    perUserLimit = json['perUserLimit'];
    isActive = json['isActive'];
    usedBy = json['usedBy'];
    createdAt = json['createdAt'];
    updatedAt = json['updatedAt'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['_id'] = sId;
    data['code'] = code;
    data['title'] = title;
    data['description'] = description;
    data['discountType'] = discountType;
    data['discountValue'] = discountValue;
    data['minOrderValue'] = minOrderValue;
    data['maxDiscount'] = maxDiscount;
    data['expiryDate'] = expiryDate;
    data['usageLimit'] = usageLimit;
    data['usedCount'] = usedCount;
    data['perUserLimit'] = perUserLimit;
    data['isActive'] = isActive;
    data['usedBy'] = usedBy;
    data['createdAt'] = createdAt;
    data['updatedAt'] = updatedAt;
    return data;
  }
}

