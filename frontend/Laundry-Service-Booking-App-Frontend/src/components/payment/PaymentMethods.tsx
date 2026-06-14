'use client';

import { useState, useEffect } from 'react';
import SafeImage from '@/components/ui/SafeImage';
import type { PaymentMethodType } from '@/types/payment';
import api from '@/services/api';

interface EnabledMethods {
  codEnabled?: boolean;
  stripeEnabled?: boolean;
  cardEnabled?: boolean;
  paypalEnabled?: boolean;
  paystackEnabled?: boolean;
}

interface PaymentMethodsProps {
  selected: PaymentMethodType;
  onSelect: (method: PaymentMethodType) => void;
  onPublishableKey?: (key: string) => void;
  onPaypalKey?: (key: string) => void;
}

const methodClass = (isSelected: boolean) =>
  `flex items-center gap-3 p-3 sm:p-4 border-2 rounded-xl cursor-pointer transition-all ${
    isSelected
      ? 'border-[#00BFA6] bg-[#00BFA6]/5 dark:bg-[#00BFA6]/10'
      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
  }`;

const radioClass = 'w-4 h-4 sm:w-5 sm:h-5 text-[#00BFA6] accent-[#00BFA6] focus:ring-[#00BFA6]';

const PaymentMethods = ({ selected, onSelect, onPublishableKey, onPaypalKey }: PaymentMethodsProps) => {
  const [enabled, setEnabled] = useState<EnabledMethods>({
    codEnabled: false,
    stripeEnabled: false,
    cardEnabled: false,
    paypalEnabled: false,
    paystackEnabled: false,
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchGateways = async () => {
      try {
        const res = await api.get('/payment/gateways');
        if (res.data?.status === 'success' && Array.isArray(res.data?.data)) {
          const gwList: { key: string; publishableKey?: string; hasSecretKey?: boolean }[] = res.data.data;
          const map: Record<string, boolean> = {};
          let stripeKey = '';
          let paypalKey = '';
          let paypalHasSecretKey = false;
          for (const gw of gwList) {
            map[gw.key] = true;
            if (gw.key === 'stripe' && gw.publishableKey) stripeKey = gw.publishableKey;
            if (gw.key === 'paypal' && gw.publishableKey) paypalKey = gw.publishableKey;
            if (gw.key === 'paypal' && gw.hasSecretKey) paypalHasSecretKey = true;
          }
          const updatedEnabled: EnabledMethods = {
            codEnabled: !!map['cashOnDelivery'],
            stripeEnabled: !!map['stripe'],
            cardEnabled: !!map['stripe'],
            // PayPal: both Client ID AND App Secret must be configured
            paypalEnabled: !!map['paypal'] && !!paypalKey && paypalHasSecretKey,
            paystackEnabled: !!map['paystack'],
          };
          setEnabled(updatedEnabled);
          if (stripeKey && onPublishableKey) onPublishableKey(stripeKey);
          if (paypalKey && onPaypalKey) onPaypalKey(paypalKey);
          // If the currently selected method is now disabled, switch to first available
          const methods: { key: keyof EnabledMethods; id: PaymentMethodType }[] = [
            { key: 'codEnabled',     id: 'cod' },
            { key: 'stripeEnabled',  id: 'stripe' },
            { key: 'cardEnabled',    id: 'card' },
            { key: 'paypalEnabled',  id: 'paypal' },
            { key: 'paystackEnabled', id: 'paystack' },
          ];
          const isCurrentEnabled = methods.find(m => m.id === selected && updatedEnabled[m.key]);
          if (!isCurrentEnabled) {
            const firstEnabled = methods.find(m => updatedEnabled[m.key]);
            if (firstEnabled) onSelect(firstEnabled.id);
          }
        }
      } catch { /* keep defaults */ }
      setLoaded(true);
    };
    fetchGateways();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!loaded) {
    return (
      <div className="space-y-3 sm:space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-14 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Cash on Delivery */}
      {enabled.codEnabled && (
        <label className={methodClass(selected === 'cod')}>
          <input
            type="radio"
            name="payment"
            checked={selected === 'cod'}
            onChange={() => onSelect('cod')}
            className={radioClass}
          />
          <span className="text-sm sm:text-base font-medium text-[#0f2744] dark:text-white">
            Cash on Delivery
          </span>
        </label>
      )}

      {/* Stripe */}
      {enabled.stripeEnabled && (
        <label className={methodClass(selected === 'stripe')}>
          <input
            type="radio"
            name="payment"
            checked={selected === 'stripe'}
            onChange={() => onSelect('stripe')}
            className={radioClass}
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-medium text-[#0f2744] dark:text-white">
                Pay with Stripe
              </span>
              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                Recommended
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Secure payment with credit/debit card
            </p>
          </div>
          <svg className="w-12 h-auto" viewBox="0 0 60 25" xmlns="http://www.w3.org/2000/svg">
            <path
              fill="#635bff"
              d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.48zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.12.87V5.57h3.76l.08 1.02a4.7 4.7 0 0 1 3.23-1.29c2.9 0 5.62 2.6 5.62 7.4 0 5.23-2.7 7.6-5.65 7.6zM40 8.95c-.95 0-1.54.34-1.97.81l.02 6.12c.4.44.98.78 1.95.78 1.52 0 2.54-1.65 2.54-3.87 0-2.15-1.04-3.84-2.54-3.84zM28.24 5.57h4.13v14.44h-4.13V5.57zm0-4.7L32.37 0v3.36l-4.13.88V.88zm-4.32 9.35v9.79H19.8V5.57h3.7l.12 1.22c1-1.77 3.07-1.41 3.62-1.22v3.79c-.52-.17-2.29-.43-3.32.86zm-8.55 4.72c0 2.43 2.6 1.68 3.12 1.46v3.36c-.55.3-1.54.54-2.89.54a4.15 4.15 0 0 1-4.27-4.24l.01-13.17 4.02-.86v3.54h3.14V9.1h-3.13v5.85zm-4.91.7c0 2.97-2.31 4.66-5.73 4.66a11.2 11.2 0 0 1-4.46-.93v-3.93c1.38.75 3.1 1.31 4.46 1.31.92 0 1.53-.24 1.53-1C6.26 13.77 0 14.51 0 9.95 0 7.04 2.28 5.3 5.62 5.3c1.36 0 2.72.2 4.09.75v3.88a9.23 9.23 0 0 0-4.1-1.06c-.86 0-1.44.25-1.44.9 0 1.85 6.29.97 6.29 5.88z"
            />
          </svg>
        </label>
      )}

      {/* Card */}
      {enabled.cardEnabled && (
        <label className={methodClass(selected === 'card')}>
          <input
            type="radio"
            name="payment"
            checked={selected === 'card'}
            onChange={() => onSelect('card')}
            className={radioClass}
          />
          <span className="text-sm sm:text-base font-medium text-[#0f2744] dark:text-white">
            Credit/Debit Card (Manual)
          </span>
          <div className="ml-auto flex items-center gap-2">
            <SafeImage src="/Images/Home/service/img-1.png" alt="Visa" width={32} height={20} className="h-5 w-auto opacity-60" />
            <SafeImage src="/Images/Home/service/img-2.png" alt="Mastercard" width={32} height={20} className="h-5 w-auto opacity-60" />
          </div>
        </label>
      )}

      {/* PayPal */}
      {enabled.paypalEnabled && (
        <label className={methodClass(selected === 'paypal')}>
          <input
            type="radio"
            name="payment"
            checked={selected === 'paypal'}
            onChange={() => onSelect('paypal')}
            className={radioClass}
          />
          <div className="flex-1">
            <span className="text-sm sm:text-base font-medium text-[#0f2744] dark:text-white">PayPal</span>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Pay securely with your PayPal account
            </p>
          </div>
          <svg className="w-16 h-auto" viewBox="0 0 100 26" xmlns="http://www.w3.org/2000/svg">
            <path fill="#253B80" d="M12.237 2.8h-7.8c-.5 0-1 .4-1.1.9L.524 22.4c-.1.4.3.7.6.7h3.7c.5 0 1-.4 1.1-.9l.8-5.2c.1-.5.5-.9 1.1-.9h2.4c5.1 0 8-2.5 8.8-7.4.4-2.1 0-3.8-1-5-1.2-1.3-3.3-1.9-5.8-1.9z" />
            <path fill="#179BD7" d="M39.837 2.8h-7.8c-.5 0-1 .4-1.1.9l-2.8 18.7c-.1.4.3.7.6.7h4c.4 0 .6-.3.7-.6l.8-5.4c.1-.5.5-.9 1.1-.9h2.4c5.1 0 8-2.5 8.8-7.4.4-2.1 0-3.8-1-5-1.2-1.3-3.3-1.9-5.7-1.9z" />
            <path fill="#253B80" d="M25.137 10.2c.4-2.6-.0-4.3-1.4-5.9-1.6-1.7-4.4-2.5-8-2.5h-10.5c-.7 0-1.3.5-1.4 1.2L.637 23.1c-.1.5.3 1 .8 1h6.3l-.4 2.5c-.1.5.3.9.7.9h5.1c.7 0 1.2-.5 1.3-1.1l.1-.3.9-5.9.1-.4c.1-.6.6-1.1 1.3-1.1h.8c5.3 0 9.4-2.1 10.6-8.3.5-2.6.2-4.7-1.1-6.2z" />
          </svg>
        </label>
      )}

      {/* Paystack */}
      {enabled.paystackEnabled && (
        <label className={methodClass(selected === 'paystack')}>
          <input
            type="radio"
            name="payment"
            checked={selected === 'paystack'}
            onChange={() => onSelect('paystack')}
            className={radioClass}
          />
          <div className="flex-1">
            <span className="text-sm sm:text-base font-medium text-[#0f2744] dark:text-white">Paystack</span>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Pay with cards, bank transfer, mobile money & more
            </p>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
              <path d="M2 7h20M2 12h20M2 17h12" stroke="#00C3F7" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span className="text-xs font-bold text-[#00C3F7]">Paystack</span>
          </div>
        </label>
      )}

      {/* No methods available */}
      {!enabled.codEnabled && !enabled.stripeEnabled && !enabled.cardEnabled &&
       !enabled.paypalEnabled && !enabled.paystackEnabled && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p className="text-sm">No payment methods are currently available. Please contact support.</p>
        </div>
      )}
    </div>
  );
};

export default PaymentMethods;
