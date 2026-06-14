class ProfileModel {
  String? status;
  Data? data;

  ProfileModel({this.status, this.data});

  ProfileModel.fromJson(Map<String, dynamic> json) {
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
  String? sId;
  String? name;
  String? email;
  String? phone;
  String? role;
  String? address;
  String? profileImage;
  bool? isVerified;
  String? createdAt;

  Data(
      {this.sId,
        this.name,
        this.email,
        this.phone,
        this.role,
        this.address,
        this.profileImage,
        this.isVerified,
        this.createdAt});

  Data.fromJson(Map<String, dynamic> json) {
    sId = json['_id'];
    name = json['name'];
    email = json['email'];
    phone = json['phone'];
    role = json['role'];
    address = json['address'];
    profileImage = json['profileImage'];
    isVerified = json['isVerified'];
    createdAt = json['createdAt'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['_id'] = this.sId;
    data['name'] = this.name;
    data['email'] = this.email;
    data['phone'] = this.phone;
    data['role'] = this.role;
    data['address'] = this.address;
    data['profileImage'] = this.profileImage;
    data['isVerified'] = this.isVerified;
    data['createdAt'] = this.createdAt;
    return data;
  }
}
