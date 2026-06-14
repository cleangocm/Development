'use client';

import { useState, useEffect, useRef } from 'react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { useTheme } from '@/context/ThemeContext';
import api from '@/services/api';

export interface StripePaymentItem {
  serviceId: string;
  itemName: string;
  quantity: number;
}

interface CheckoutFormProps {
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

function CheckoutForm({ amount, onSuccess, onError }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { formatPrice } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment/success`,
      },
      redirect: 'if_required',
    });

    if (error) {
      setMessage(error.message || 'An unexpected error occurred.');
      onError(error.message || 'Payment failed');
      setIsLoading(false);
    } else {
      // Payment succeeded
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      
      {message && (
        <div className="text-red-500 text-sm p-3 bg-red-50 rounded-lg">
          {message}
        </div>
      )}

      <button
        disabled={isLoading || !stripe || !elements}
        type="submit"
        className="w-full bg-[#00BFA6] text-white py-3 sm:py-4 rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 hover:bg-[#00A892] hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Processing...</span>
          </>
        ) : (
          `Pay ${formatPrice(amount)}`
        )}
      </button>
    </form>
  );
}

interface StripeCheckoutProps {
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
  publishableKey?: string;
  items?: StripePaymentItem[];
  couponCode?: string;
  deliveryType?: string;
  metadata?: Record<string, string>;
}

export default function StripeCheckout({ amount, onSuccess, onError, publishableKey, items = [], couponCode, deliveryType = 'standard', metadata = {} }: StripeCheckoutProps) {
  const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [displayAmount, setDisplayAmount] = useState(amount);
  const { formatPrice } = useTheme();
  const metadataRef = useRef(metadata);

  // Initialise Stripe SDK with the publishable key from backend (or env var fallback)
  useEffect(() => {
    const key = publishableKey || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (key) {
      setStripePromise(loadStripe(key));
    } else {
      // No key at all — bail out immediately
      onError('Stripe is not configured. Please contact support.');
      setFailed(true);
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publishableKey]);

  useEffect(() => {
    if (amount < 0.50) {
      onError(`Minimum payment amount is ${formatPrice(0.50)}. Please add items to your cart.`);
      setFailed(true);
      setLoading(false);
      return;
    }

    // Call backend /payment/create-intent — validates prices server-side and uses DB Stripe key
    const createIntent = async () => {
      try {
        const res = await api.post('/payment/create-intent', {
          items,
          couponCode: couponCode || undefined,
          deliveryType,
          metadata: metadataRef.current,
        });
        if (res.data?.data?.clientSecret) {
          setClientSecret(res.data.data.clientSecret);
          // Use the server-verified amount for the Pay button (avoids frontend/backend mismatch)
          if (res.data.data.amount && res.data.data.amount > 0) {
            setDisplayAmount(res.data.data.amount);
          }
        } else {
          onError(res.data?.message || 'Failed to initialize payment');
          setFailed(true);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to initialize payment';
        onError(msg);
        setFailed(true);
      } finally {
        setLoading(false);
      }
    };
    createIntent();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount]);

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#00BFA6',
        colorBackground: '#ffffff',
        colorText: '#0f2744',
        colorDanger: '#df1b41',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
  };

  if (failed) return null;

  if (loading || !clientSecret || !stripePromise) {
    return (
      <div className="flex items-center justify-center py-8">
        <svg className="animate-spin h-8 w-8 text-[#00BFA6]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  return (
    <Elements options={options} stripe={stripePromise!}>
      <CheckoutForm amount={displayAmount} onSuccess={onSuccess} onError={onError} />
    </Elements>
  );
} 
