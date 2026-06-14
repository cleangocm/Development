class ChatTickestModel {
  String? status;
  Data? data;

  ChatTickestModel({this.status, this.data});

  ChatTickestModel.fromJson(Map<String, dynamic> json) {
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
  List<Tickets>? tickets;
  int? total;
  int? page;
  int? totalPages;

  Data({this.tickets, this.total, this.page, this.totalPages});

  Data.fromJson(Map<String, dynamic> json) {
    if (json['tickets'] != null) {
      tickets = <Tickets>[];
      json['tickets'].forEach((v) {
        tickets!.add(new Tickets.fromJson(v));
      });
    }
    total = json['total'];
    page = json['page'];
    totalPages = json['totalPages'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    if (this.tickets != null) {
      data['tickets'] = this.tickets!.map((v) => v.toJson()).toList();
    }
    data['total'] = this.total;
    data['page'] = this.page;
    data['totalPages'] = this.totalPages;
    return data;
  }
}

class Tickets {
  StaffReview? staffReview;
  String? sId;
  String? user;
  String? subject;
  String? description;
  String? category;
  String? priority;
  String? status;
  dynamic assignedTo;
  dynamic relatedOrder;
  List<Notes>? notes;
  String? resolvedAt;
  String? closedAt;
  String? tokenNumber;
  String? createdAt;
  String? updatedAt;

  Tickets(
      {this.staffReview,
        this.sId,
        this.user,
        this.subject,
        this.description,
        this.category,
        this.priority,
        this.status,
        this.assignedTo,
        this.relatedOrder,
        this.notes,
        this.resolvedAt,
        this.closedAt,
        this.tokenNumber,
        this.createdAt,
        this.updatedAt});

  Tickets.fromJson(Map<String, dynamic> json) {
    staffReview = json['staffReview'] != null
        ? new StaffReview.fromJson(json['staffReview'])
        : null;
    sId = json['_id'];
    user = json['user'];
    subject = json['subject'];
    description = json['description'];
    category = json['category'];
    priority = json['priority'];
    status = json['status'];
    assignedTo = json['assignedTo'];
    relatedOrder = json['relatedOrder'];
    if (json['notes'] != null) {
      notes = <Notes>[];
      json['notes'].forEach((v) {
        notes!.add(new Notes.fromJson(v));
      });
    }
    resolvedAt = json['resolvedAt'];
    closedAt = json['closedAt'];
    tokenNumber = json['tokenNumber'];
    createdAt = json['createdAt'];
    updatedAt = json['updatedAt'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    if (this.staffReview != null) {
      data['staffReview'] = this.staffReview!.toJson();
    }
    data['_id'] = this.sId;
    data['user'] = this.user;
    data['subject'] = this.subject;
    data['description'] = this.description;
    data['category'] = this.category;
    data['priority'] = this.priority;
    data['status'] = this.status;
    data['assignedTo'] = this.assignedTo;
    data['relatedOrder'] = this.relatedOrder;
    if (this.notes != null) {
      data['notes'] = this.notes!.map((v) => v.toJson()).toList();
    }
    data['resolvedAt'] = this.resolvedAt;
    data['closedAt'] = this.closedAt;
    data['tokenNumber'] = this.tokenNumber;
    data['createdAt'] = this.createdAt;
    data['updatedAt'] = this.updatedAt;
    return data;
  }
}

class StaffReview {
  bool? calledUser;
  String? callNotes;
  bool? resolvedByCall;

  StaffReview({this.calledUser, this.callNotes, this.resolvedByCall});

  StaffReview.fromJson(Map<String, dynamic> json) {
    calledUser = json['calledUser'];
    callNotes = json['callNotes'];
    resolvedByCall = json['resolvedByCall'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['calledUser'] = this.calledUser;
    data['callNotes'] = this.callNotes;
    data['resolvedByCall'] = this.resolvedByCall;
    return data;
  }
}

class Notes {
  String? by;
  String? byRole;
  String? message;
  String? sId;
  String? createdAt;
  String? updatedAt;

  Notes(
      {this.by,
        this.byRole,
        this.message,
        this.sId,
        this.createdAt,
        this.updatedAt});

  Notes.fromJson(Map<String, dynamic> json) {
    by = json['by'];
    byRole = json['byRole'];
    message = json['message'];
    sId = json['_id'];
    createdAt = json['createdAt'];
    updatedAt = json['updatedAt'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['by'] = this.by;
    data['byRole'] = this.byRole;
    data['message'] = this.message;
    data['_id'] = this.sId;
    data['createdAt'] = this.createdAt;
    data['updatedAt'] = this.updatedAt;
    return data;
  }
}
