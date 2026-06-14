// Shared types for checkout & payment flow

export type DeliveryType = 'standard' | 'fast' | 'premium';

export type PaymentMethodType = 'cod' | 'card' | 'stripe' | 'paypal' | 'paystack';

export interface CartItem {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
}

export interface CartGroup {
  serviceType: string;
  serviceId?: string;
  items: CartItem[];
}

export interface OrderData {
  cartGroups: CartGroup[];
  subtotal: number;
  deliveryCost: number;
  discount: number;
  total: number;
}

export interface BillingInfo {
  fullName: string;
  email: string;
  phone: string;
  alternativePhone?: string;
  address: string;
  additionalInstruction: string;
}

export interface ShippingInfo {
  fullName: string;
  phone: string;
  alternativePhone?: string;
  address: string;
  additionalInstruction?: string;
}

export interface Schedule {
  pickupDate: string;
  pickupSlot: string;
  deliveryDate: string;
  deliverySlot: string;
}

export interface CouponData {
  code: string;
  discountType: string;
  discountValue: number;
  discount: number;
}

export interface CheckoutData {
  orderData: OrderData;
  billingInfo: BillingInfo;
  shippingInfo: ShippingInfo;
  schedule: Schedule;
  deliveryType?: DeliveryType;
  deliverySpeedCharge?: number;
  coupon?: CouponData | null;
  finalTotal?: number;
}

export interface OrderPayload {
  items: {
    service: string;
    serviceName: string;
    quantity: number;
    price: number;
    subtotal: number;
  }[];
  billingInfo: BillingInfo;
  shippingInfo: ShippingInfo;
  schedule: Schedule;
  deliveryType: string;
  deliverySpeedCharge: number;
  deliveryCharge: number;
  subtotal: number;
  discount: number;
  totalPayment: number;
  address: string;
  notes: string;
  couponCode?: string;
  couponDiscount?: number;
  paymentMethod: string;
}
