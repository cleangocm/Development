'use client';

import type { CheckoutData } from '@/types/payment';

interface OrderSummaryProps {
  checkoutData: CheckoutData;
  formatPrice: (amountInUSD: number) => string;
}

const OrderSummary = ({ checkoutData, formatPrice }: OrderSummaryProps) => {
  const subtotal = checkoutData.orderData?.subtotal || 0;
  const discount = checkoutData.orderData?.discount || 0;
  const deliveryFee = checkoutData.orderData?.deliveryCost || 0;
  const speedCharge = checkoutData.deliverySpeedCharge || 0;
  const total = (checkoutData.orderData?.total || 0) + speedCharge;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm animate-fade-in-up">
      <h2 className="text-base sm:text-lg font-bold text-[#0f2744] dark:text-white mb-4 sm:mb-6">
        Order Summary
      </h2>

      <div className="space-y-3 sm:space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-[#5a6a7a] dark:text-gray-400">Sub Total</span>
          <span className="text-[#0f2744] dark:text-white font-medium">
            {formatPrice(subtotal)}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-[#5a6a7a] dark:text-gray-400">Discount</span>
          <span className="text-green-600 font-medium">
            {discount > 0 ? `-${formatPrice(discount)}` : '-'}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-[#5a6a7a] dark:text-gray-400">Delivery Fee</span>
          <span className="text-[#0f2744] dark:text-white font-medium">
            {formatPrice(deliveryFee)}
          </span>
        </div>

        {speedCharge > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-[#5a6a7a] dark:text-gray-400">
              {checkoutData.deliveryType === 'premium' ? 'Premium' : 'Fast'} Delivery Charge
            </span>
            <span className="text-orange-600 dark:text-orange-400 font-medium">
              {formatPrice(speedCharge)}
            </span>
          </div>
        )}

        {checkoutData.deliveryType && checkoutData.deliveryType !== 'standard' && (
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`px-2 py-0.5 rounded-full font-medium ${
                checkoutData.deliveryType === 'premium'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              }`}
            >
              {checkoutData.deliveryType === 'premium' ? '⭐ Premium Delivery' : '⚡ Fast Delivery'}
            </span>
          </div>
        )}

        <div className="border-t border-gray-100 dark:border-gray-700 pt-3 sm:pt-4">
          <div className="flex justify-between">
            <span className="text-base font-bold text-[#0f2744] dark:text-white">Total Payable</span>
            <span className="text-lg sm:text-xl font-bold text-[#00BFA6]">
              {formatPrice(total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
