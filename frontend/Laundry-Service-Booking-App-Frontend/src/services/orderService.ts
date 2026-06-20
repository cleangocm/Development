import { auth } from '@/lib/firebase';
import { createPendingPayment, createPickup } from '@/services/cleangoRepository';
import type { CheckoutData, OrderPayload } from '@/types/payment';

export const buildOrderPayload = (
  checkoutData: CheckoutData,
  paymentMethod: string,
): OrderPayload => {
  const fallbackServiceId = localStorage.getItem('serviceId') || '';
  const items = checkoutData.orderData.cartGroups.flatMap((group) =>
    group.items.map((item) => ({
      service: group.serviceId || fallbackServiceId,
      serviceName: `${group.serviceType} - ${item.name}`,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.price * item.quantity,
    })),
  );
  const speedCharge = checkoutData.deliverySpeedCharge || 0;
  const deliveryCharge = checkoutData.orderData?.deliveryCost || 0;
  const subtotal = checkoutData.orderData?.subtotal || 0;
  const discount = checkoutData.orderData?.discount || 0;
  const totalPayment = checkoutData.finalTotal
    || Math.max(subtotal - discount + deliveryCharge + speedCharge, 0);

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

export const createOrder = async (
  checkoutData: CheckoutData,
  paymentMethod: string,
): Promise<{ success: boolean; orderId?: string; totalPayment?: number; error?: string }> => {
  try {
    const user = auth.currentUser;
    if (!user) return { success: false, error: 'Please sign in before scheduling a pickup.' };

    const payload = buildOrderPayload(checkoutData, paymentMethod);
    const pickupId = await createPickup({
      customerId: user.uid,
      scheduledDate: payload.schedule.pickupDate,
      notes: payload.notes,
      addressText: payload.address,
      contactName: payload.billingInfo.fullName,
      contactPhone: payload.billingInfo.phone,
    });

    if (payload.totalPayment > 0) {
      await createPendingPayment({
        customerId: user.uid,
        subscriptionId: null,
        provider: paymentMethod === 'cash' || paymentMethod === 'cod' ? 'cash' : 'manual',
        amountXaf: payload.totalPayment,
        reference: `pickup:${pickupId}`,
      });
    }

    return { success: true, orderId: pickupId, totalPayment: payload.totalPayment };
  } catch (error: unknown) {
    const message = error instanceof Error
      ? error.message
      : 'Failed to schedule pickup. Please contact support.';
    return { success: false, error: message };
  }
};

export const clearCheckoutData = () => {
  localStorage.removeItem('cartItems');
  localStorage.removeItem('cartGroups');
  localStorage.removeItem('serviceType');
  localStorage.removeItem('serviceId');
  localStorage.removeItem('orderData');
  localStorage.removeItem('checkoutData');
  localStorage.removeItem('appliedCoupon');
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('cart-updated'));
};
