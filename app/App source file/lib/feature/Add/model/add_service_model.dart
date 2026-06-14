class ServiceModel {
  String? status;
  List<Data>? data;

  ServiceModel({this.status, this.data});

  ServiceModel.fromJson(Map<String, dynamic> json) {
    status = json['status'];
    if (json['data'] != null) {
      data = <Data>[];
      json['data'].forEach((v) {
        data!.add(new Data.fromJson(v));
      });
    }
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['status'] = this.status;
    if (this.data != null) {
      data['data'] = this.data!.map((v) => v.toJson()).toList();
    }
    return data;
  }
}

class Data {
  String? sId;
  String? name;
  String? slug;
  String? description;
  String? shortDescription;
  String? image;
  String? pricingType;
  double? pricePerKg;
  double? pricePerItem;
  int? estimatedDays;
  String? category;
  List<Items>? items;
  List<String>? features;
  bool? isActive;
  int? sortOrder;
  String? createdAt;
  String? updatedAt;

  Data(
      {this.sId,
        this.name,
        this.slug,
        this.description,
        this.shortDescription,
        this.image,
        this.pricingType,
        this.pricePerKg,
        this.pricePerItem,
        this.estimatedDays,
        this.category,
        this.items,
        this.features,
        this.isActive,
        this.sortOrder,
        this.createdAt,
        this.updatedAt});

  Data.fromJson(Map<String, dynamic> json) {
    sId = json['_id'];
    name = json['name'];
    slug = json['slug'];
    description = json['description'];
    shortDescription = json['shortDescription'];
    image = json['image'];
    pricingType = json['pricingType'];
    pricePerKg = (json['pricePerKg'] is int)
        ? (json['pricePerKg'] as int).toDouble()
        : json['pricePerKg']?.toDouble();
    pricePerItem = (json['pricePerItem'] is int)
        ? (json['pricePerItem'] as int).toDouble()
        : json['pricePerItem']?.toDouble();
    estimatedDays = json['estimatedDays'];
    category = json['category'];
    if (json['items'] != null) {
      items = <Items>[];
      json['items'].forEach((v) {
        items!.add(Items.fromJson(v));
      });
    }
    if (json['features'] != null) {
      features = json['features'].cast<String>();
    }
    isActive = json['isActive'];
    sortOrder = json['sortOrder'];
    createdAt = json['createdAt'];
    updatedAt = json['updatedAt'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['_id'] = this.sId;
    data['name'] = this.name;
    data['slug'] = this.slug;
    data['description'] = this.description;
    data['shortDescription'] = this.shortDescription;
    data['image'] = this.image;
    data['pricingType'] = this.pricingType;
    data['pricePerKg'] = this.pricePerKg;
    data['pricePerItem'] = this.pricePerItem;
    data['estimatedDays'] = this.estimatedDays;
    data['category'] = this.category;
    if (this.items != null) {
      data['items'] = this.items!.map((v) => v.toJson()).toList();
    }
    data['features'] = this.features;
    data['isActive'] = this.isActive;
    data['sortOrder'] = this.sortOrder;
    data['createdAt'] = this.createdAt;
    data['updatedAt'] = this.updatedAt;
    return data;
  }
}

class Items {
  String? name;
  String? description;
  double? price;
  String? image;
  String? sId;

  Items({this.name, this.description, this.price, this.image, this.sId});

  Items.fromJson(Map<String, dynamic> json) {
    name = json['name'];
    description = json['description'];
    price = (json['price'] is int)
        ? (json['price'] as int).toDouble()
        : json['price']?.toDouble();
    image = json['image'];
    sId = json['_id'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['name'] = this.name;
    data['description'] = this.description;
    data['price'] = this.price;
    data['image'] = this.image;
    data['_id'] = this.sId;
    return data;
  }
}
