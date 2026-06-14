'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { FiCheck } from 'react-icons/fi';
import dynamic from 'next/dynamic';
import { useTheme } from '@/context/ThemeContext';
import type { CheckoutData, PaymentMethodType } from '@/types/payment';
import { createOrder, clearCheckoutData } from '@/services/orderService';
import OrderSummary from '@/components/payment/OrderSummary';
import PaymentMethods from '@/components/payment/PaymentMethods';
import CardForm from '@/components/payment/CardForm';
import type { StripePaymentItem } from '@/components/payment/StripeCheckout';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import api from '@/services/api';

// Dynamically import StripeCheckout to avoid SSR issues
const StripeCheckout = dynamic(
  () => import('@/components/payment/StripeCheckout'),
  { ssr: false }
);

const PaymentPage = () => {
  const { formatPrice } = useTheme();
  const router = useRouter();
  const { checkAuth } = useAuthStore();

  // Initialize checkout data from localStorage
  const initCheckoutData = (): CheckoutData | null => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem('checkoutData');
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      localStorage.removeItem('checkoutData');
      return null;
    }
  };

  const [checkoutData] = useState<CheckoutData | null>(initCheckoutData);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('cod');
  const [stripePublishableKey, setStripePublishableKey] = useState('');
  const [paypalPublishableKey, setPaypalPublishableKey] = useState('');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardHolderName: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [paymentError, setPaymentError] = useState('');
  const [createdOrderId, setCreatedOrderId] = useState('');
  const [serverTotal, setServerTotal] = useState<number | null>(null);

  useEffect(() => {
    checkAuth();
    const token = localStorage.getItem('auth_token');
    if (!token) router.push('/login');
  }, [checkAuth, router]);

  // ─── Validation ───
  const validateCard = () => {
    const newErrors: { [key: string]: string } = {};
    if (paymentMethod === 'card') {
      if (!cardDetails.cardNumber || cardDetails.cardNumber.replace(/\s/g, '').length < 16)
        newErrors.cardNumber = 'Valid card number is required';
      if (!cardDetails.expiryDate || cardDetails.expiryDate.length < 5)
        newErrors.expiryDate = 'Valid expiry date is required';
      if (!cardDetails.cvv || cardDetails.cvv.length < 3)
        newErrors.cvv = 'Valid CVV is required';
      if (!cardDetails.cardHolderName)
        newErrors.cardHolderName = 'Card holder name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Order Creation ───
  const submitOrder = async (method: string) => {
    if (!checkoutData) return;
    const result = await createOrder(checkoutData, method);
    if (result.success) {
      setCreatedOrderId(result.orderId || '');
      if (result.totalPayment) setServerTotal(result.totalPayment);
      handlePaymentSuccess();
    } else {
      setPaymentError(result.error || 'Failed to create order');
    }
  };

  // ─── Payment Handler ───
  const handlePayment = async () => {
    if (paymentMethod === 'card' && !validateCard()) return;
    if (paymentMethod === 'stripe') return; // handled by StripeCheckout
    if (paymentMethod === 'paypal') return;  // handled by PayPalButtons

    if (paymentMethod === 'paystack') {
      setPaymentError('Paystack is not yet configured for this region.');
      return;
    }

    setIsLoading(true);
    setPaymentError('');
    const methodMap: Record<string, string> = {
      cod: 'cash',
      card: 'card',
    };
    await submitOrder(methodMap[paymentMethod] || 'cash');
    setIsLoading(false);
  };

  const handlePaymentSuccess = () => {
    setShowSuccess(true);
    clearCheckoutData();
    setTimeout(() => router.push('/dashboard/orders'), 3000);
  };

  const handleStripeSuccess = async () => {
    await submitOrder('stripe');
  };

  const handlePaymentError = (error: string) => {
    setPaymentError(error);
    setTimeout(() => setPaymentError(''), 5000);
  };

  // ── Formatted items for Stripe/PayPal backend calls ──
  const stripeItems = useMemo((): StripePaymentItem[] => {
    if (!checkoutData?.orderData?.cartGroups) return [];
    return checkoutData.orderData.cartGroups.flatMap(group =>
      group.items.map(item => ({
        serviceId: (group.serviceId || String(item.id)) as string,
        itemName: item.name,
        quantity: item.quantity,
      }))
    );
  }, [checkoutData]);

  // ── PayPal helpers ──
  const handlePaypalCreateOrder = async (): Promise<string> => {
    const res = await api.post('/payment/paypal/create-order', {
      items: stripeItems,
      couponCode: checkoutData?.coupon?.code,
      deliveryType: checkoutData?.deliveryType || 'standard',
    });
    if (res.data?.status !== 'success') {
      throw new Error(res.data?.message || 'Failed to create PayPal order');
    }
    return res.data.data.orderId as string;
  };

  const handlePaypalApprove = async (data: { orderID: string }) => {
    try {
      const res = await api.post('/payment/paypal/capture-order', { orderId: data.orderID });
      if (res.data?.status === 'success') {
        await submitOrder('paypal');
      } else {
        handlePaymentError(res.data?.message || 'PayPal capture failed');
      }
    } catch (err: unknown) {
      handlePaymentError(err instanceof Error ? err.message : 'PayPal capture failed');
    }
  };
  // ─── Totals ───
  const speedCharge = checkoutData?.deliverySpeedCharge || 0;
  const total = (checkoutData?.orderData?.total || 0) + speedCharge;

  // ─── Empty Cart Screen ───
  if (!checkoutData || total === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 sm:pt-24 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 sm:p-12 text-center max-w-md w-full shadow-xl">
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0f2744] dark:text-white mb-3">No Items in Cart</h2>
          <p className="text-sm sm:text-base text-[#5a6a7a] dark:text-gray-400 mb-6">
            Your cart is empty. Please add items to your cart before proceeding to payment.
          </p>
          <button
            onClick={() => router.push('/services')}
            className="w-full bg-[#00BFA6] text-white py-3 rounded-xl font-semibold text-sm transition-all duration-300 hover:bg-[#00A892]"
          >
            Browse Services
            </button>
          </div>
        </div>
    );
  }

  // ─── Success Screen ───
  if (showSuccess) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 sm:pt-24 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 sm:p-12 text-center max-w-md w-full shadow-xl animate-scale-in">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center animate-pulse">
              <FiCheck className="w-10 h-10 sm:w-12 sm:h-12 text-green-500" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0f2744] dark:text-white mb-3">Payment Successful!</h2>
            <p className="text-sm sm:text-base text-[#5a6a7a] dark:text-gray-400 mb-2">
              Your order has been placed successfully. You will receive a confirmation email shortly.
            </p>
            {serverTotal !== null && (
              <p className="text-lg font-bold text-[#00BFA6] mb-2">
                Total Charged: {formatPrice(serverTotal)}
              </p>
            )}
            {createdOrderId && (
              <p className="text-xs font-semibold text-[#5a6a7a] dark:text-gray-400 mb-4">
                Order ID: #{createdOrderId.slice(-6).toUpperCase()}
              </p>
            )}
            <p className="text-xs text-[#5a6a7a] dark:text-gray-500">Redirecting to your orders...</p>
          </div>
        </div>
    );
  }

  // ─── Main Payment Layout ───
  return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 sm:pt-24">
        <div className="container-custom px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">

            {/* Left — Order Summary */}
            <div className="order-2 lg:order-1">
              <OrderSummary checkoutData={checkoutData} formatPrice={formatPrice} />
            </div>

            {/* Right — Payment Methods + Card / Stripe */}
            <div className="order-1 lg:order-2 space-y-4 sm:space-y-6 pb-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm animate-fade-in-up">
                <h2 className="text-base sm:text-lg font-bold text-[#0f2744] dark:text-white mb-4 sm:mb-6">Payment Method</h2>

                <PaymentMethods
                  selected={paymentMethod}
                  onSelect={setPaymentMethod}
                  onPublishableKey={setStripePublishableKey}
                  onPaypalKey={setPaypalPublishableKey}
                />

                {/* Card Details */}
                {paymentMethod === 'card' && (
                  <div className="mt-4 sm:mt-6 animate-fade-in">
                    <CardForm
                      cardDetails={cardDetails}
                      errors={errors}
                      onChange={setCardDetails}
                    />
                  </div>
                )}

                {/* Stripe Checkout */}
                {paymentMethod === 'stripe' && (
                  <div className="mt-4 sm:mt-6 animate-fade-in">
                    {paymentError && (
                      <div className="mb-4 text-red-500 text-sm p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        {paymentError}
                      </div>
                    )}
                    <StripeCheckout
                      amount={total}
                      onSuccess={handleStripeSuccess}
                      onError={handlePaymentError}
                      publishableKey={stripePublishableKey}
                      items={stripeItems}
                      couponCode={checkoutData?.coupon?.code}
                      deliveryType={checkoutData?.deliveryType}
                      metadata={{
                        customerName: checkoutData?.billingInfo?.fullName || '',
                        customerEmail: checkoutData?.billingInfo?.email || '',
                      }}
                    />
                  </div>
                )}

                {/* PayPal Checkout */}
                {paymentMethod === 'paypal' && paypalPublishableKey && (
                  <div className="mt-4 sm:mt-6 animate-fade-in">
                    {paymentError && (
                      <div className="mb-4 text-red-500 text-sm p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        {paymentError}
                      </div>
                    )}
                    <PayPalScriptProvider
                      options={{
                        clientId: paypalPublishableKey,
                        currency: 'USD',
                        intent: 'capture',
                      }}
                    >
                      <PayPalButtons
                        style={{ layout: 'vertical', color: 'blue', shape: 'rect', label: 'pay' }}
                        createOrder={handlePaypalCreateOrder}
                        onApprove={handlePaypalApprove}
                        onError={(err) => handlePaymentError('PayPal error: ' + String(err))}
                        onCancel={() => handlePaymentError('PayPal payment was cancelled.')}
                      />
                    </PayPalScriptProvider>
                  </div>
                )}

                {paymentMethod === 'paypal' && !paypalPublishableKey && (
                  <div className="mt-4 sm:mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-yellow-700 dark:text-yellow-400 text-sm">
                    PayPal is not yet configured. Please contact support or choose another payment method.
                  </div>
                )}
              </div>

              {/* Pay Button (non-Stripe, non-PayPal methods) */}
              {paymentMethod !== 'stripe' && paymentMethod !== 'paypal' && (
                <>
                  {paymentError && (
                    <div className="text-red-500 text-sm p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      {paymentError}
                    </div>
                  )}
                  <button
                    onClick={handlePayment}
                    disabled={isLoading}
                    className="w-full bg-[#00BFA6] text-white py-3 sm:py-4 rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 hover:bg-[#00A892] hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 animate-fade-in-up"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Processing...</span>
                      </>
                    ) : paymentMethod === 'paystack' ? (
                      'Pay with Paystack'
                    ) : (
                      'Pay Now'
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
  );
};

export default PaymentPage;
