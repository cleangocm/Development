// Model to hold order item data
class OrderItem {
  final String itemId;
  final String itemName;
  final double price;
  final String? image;
  int quantity;

  OrderItem({
    required this.itemId,
    required this.itemName,
    required this.price,
    this.image,
    this.quantity = 0,
  });

  Map<String, dynamic> toMap() {
    return {
      'itemId': itemId,
      'itemName': itemName,
      'price': price,
      'image': image,
      'quantity': quantity,
    };
  }

  factory OrderItem.fromMap(Map<String, dynamic> map) {
    return OrderItem(
      itemId: map['itemId'] ?? '',
      itemName: map['itemName'] ?? '',
      price: (map['price'] ?? 0).toDouble(),
      image: map['image'],
      quantity: map['quantity'] ?? 0,
    );
  }
}

// Model to hold service order data
class ServiceOrder {
  final String serviceId;
  final String serviceName;
  final String serviceSlug;
  final List<OrderItem> items;

  ServiceOrder({
    this.serviceId = '',
    required this.serviceName,
    required this.serviceSlug,
    required this.items,
  });

  int get totalItems => items.fold(0, (sum, item) => sum + item.quantity);
  double get totalPrice => items.fold(0.0, (sum, item) => sum + (item.price * item.quantity));

  Map<String, dynamic> toMap() {
    return {
      'serviceId': serviceId,
      'serviceName': serviceName,
      'serviceSlug': serviceSlug,
      'items': items.map((e) => e.toMap()).toList(),
    };
  }

  factory ServiceOrder.fromMap(Map<String, dynamic> map) {
    return ServiceOrder(
      serviceId: map['serviceId'] ?? '',
      serviceName: map['serviceName'] ?? '',
      serviceSlug: map['serviceSlug'] ?? '',
      items: (map['items'] as List<dynamic>?)
              ?.map((e) => OrderItem.fromMap(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

