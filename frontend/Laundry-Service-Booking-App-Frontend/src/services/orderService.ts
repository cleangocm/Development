import api from '@/services/api';
import type { CheckoutData, OrderPayload } from '@/types/payment';

/**
 * Build the order payload from checkout data
 */
export const buildOrderPayload = (
  checkoutData: CheckoutData,
  paymentMethod: string
): OrderPayload => {
  const fallbackServiceId = localStorage.getItem('serviceId') || '';

  const items = checkoutData.orderData.cartGroups.flatMap((group) =>
    group.items.map((item) => ({
      service: group.serviceId || fallbackServiceId,
      serviceName: `${group.serviceType} - ${item.name}`,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.price * item.quantity,
    }))
  );

  const speedCharge = checkoutData.deliverySpeedCharge || 0;
  const deliveryCharge = checkoutData.orderData?.deliveryCost || 0;
  const subtotal = checkoutData.orderData?.subtotal || 0;
  const discount = checkoutData.orderData?.discount || 0;
  const totalPayment = checkoutData.finalTotal || Math.max(subtotal - discount + deliveryCharge + speedCharge, 0);

  return {
    items,
    billingInfo: {
      fullName: checkoutData.billingInfo?.fullName || '',
      email: checkoutData.billingInfo?.email || '',
      phone: checkoutData.billingInfo?.phone || '',
      alternativePhone: checkoutData.billingInfo?.alternativePhone || '',
      address: checkoutData.billingInfo?.address || '',
      additionalInstruction: checkoutData.billingInfo?.additionalInstruction || '',
    },
    shippingInfo: {
      fullName: checkoutData.shippingInfo?.fullName || '',
      phone: checkoutData.shippingInfo?.phone || '',
      alternativePhone: checkoutData.shippingInfo?.alternativePhone || '',
      address: checkoutData.shippingInfo?.address || '',
      additionalInstruction: checkoutData.shippingInfo?.additionalInstruction || '',
    },
    schedule: {
      pickupDate: checkoutData.schedule?.pickupDate || '',
      pickupSlot: checkoutData.schedule?.pickupSlot || '',
      deliveryDate: checkoutData.schedule?.deliveryDate || '',
      deliverySlot: checkoutData.schedule?.deliverySlot || '',
    },
    deliveryType: checkoutData.deliveryType || 'standard',
    deliverySpeedCharge: speedCharge,
    deliveryCharge,
    subtotal,
    discount,
    totalPayment,
    address: checkoutData.billingInfo?.address || checkoutData.shippingInfo?.address || '',
    notes: checkoutData.billingInfo?.additionalInstruction || '',
    couponCode: checkoutData.coupon?.code || localStorage.getItem('appliedCoupon') || undefined,
    couponDiscount: checkoutData.coupon?.discount || undefined,
    paymentMethod,
  };
};

/**
 * Create order in the backend
 */
export const createOrder = async (
  checkoutData: CheckoutData,
  paymentMethod: string
): Promise<{ success: boolean; orderId?: string; totalPayment?: number; error?: string }> => {
  try {
    const payload = buildOrderPayload(checkoutData, paymentMethod);
    const res = await api.post('/orders', payload);

    if (res.data?.status === 'success') {
      // Backend returns _id (MongoDB ObjectId), not orderId
      const orderId = res.data.data?._id || res.data.data?.orderId || '';
      const totalPayment: number = res.data.data?.totalPayment ?? 0;
      
      // Create notification for user about order confirmation
      try {
        await api.post('/notifications', {
          title: 'Order Placed Successfully',
          message: `Your order #${orderId} has been placed successfully. We'll notify you once it's confirmed.`,
          type: 'order',
          orderId: orderId
        });
      } catch {
        // Don't fail the order if notification fails
      }
      
      return {
        success: true,
        orderId,
        totalPayment,
      };
    }
    return {
      success: false,
      error: res.data?.message || 'Failed to create order',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create order. Please contact support.';
    return { success: false, error: message };
  }
};

/**
 * Clear all cart/checkout data from localStorage after successful order
 */
export const clearCheckoutData = () => {
  localStorage.removeItem('cartItems');
  localStorage.removeItem('cartGroups');
  localStorage.removeItem('serviceType');
  localStorage.removeItem('serviceId');
  localStorage.removeItem('orderData');
  localStorage.removeItem('checkoutData');
  localStorage.removeItem('appliedCoupon');
  // Notify Header about cart cleared
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('cart-updated'));
  }
};
