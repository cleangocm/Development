'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiCheck } from 'react-icons/fi';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Clear cart data on success
    localStorage.removeItem('cartItems');
    localStorage.removeItem('cartGroups');
    localStorage.removeItem('serviceType');
    localStorage.removeItem('orderData');
    localStorage.removeItem('checkoutData');

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const paymentIntent = searchParams.get('payment_intent');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 sm:pt-24 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 sm:p-12 text-center max-w-md w-full shadow-xl animate-scale-in">
        <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center animate-pulse">
          <FiCheck className="w-10 h-10 sm:w-12 sm:h-12 text-green-500" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#0f2744] dark:text-white mb-3">
          Payment Successful!
        </h2>
        <p className="text-sm sm:text-base text-[#5a6a7a] dark:text-gray-400 mb-6">
          Your order has been placed successfully. You will receive a confirmation email shortly.
        </p>
        {paymentIntent && (
          <p className="text-xs text-gray-500 mb-4 font-mono bg-gray-50 dark:bg-gray-700 p-2 rounded">
            Payment ID: {paymentIntent.substring(0, 20)}...
          </p>
        )}
        <p className="text-xs text-[#5a6a7a] dark:text-gray-500">
          Redirecting to home page in {countdown} seconds...
        </p>
        <button
          onClick={() => router.push('/')}
          className="mt-6 w-full bg-[#00BFA6] text-white py-3 rounded-xl font-semibold text-sm transition-all duration-300 hover:bg-[#00A892]"
        >
          Go to Home Now
        </button>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-[#00BFA6] border-t-transparent rounded-full"></div></div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
