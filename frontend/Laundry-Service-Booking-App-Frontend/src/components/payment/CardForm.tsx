'use client';

import { FiCreditCard } from 'react-icons/fi';

interface CardFormProps {
  cardDetails: {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    cardHolderName: string;
  };
  errors: { [key: string]: string };
  onChange: (details: CardFormProps['cardDetails']) => void;
}

const formatCardNumber = (value: string) => {
  const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '').slice(0, 16);
  const parts = [];
  for (let i = 0, len = v.length; i < len; i += 4) {
    parts.push(v.substring(i, i + 4));
  }
  return parts.length ? parts.join(' ') : v;
};

const formatExpiryDate = (value: string) => {
  // Allow deletion by checking if user removed the slash
  const raw = value.replace(/[^0-9/]/g, '');
  // If user is deleting (value shorter than formatted), strip slash and re-derive
  const digits = raw.replace(/\//g, '').slice(0, 4);
  if (digits.length >= 2) {
    return digits.substring(0, 2) + '/' + digits.substring(2, 4);
  }
  return digits;
};

const CardForm = ({ cardDetails, errors, onChange }: CardFormProps) => {
  const inputClass = (field: string, overridePadding = false) =>
    `w-full ${overridePadding ? '' : 'px-4'} py-2.5 sm:py-3 border rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 ${
      errors[field]
        ? 'border-red-500 focus:ring-red-200'
        : 'border-gray-200 dark:border-gray-600 focus:border-[#00BFA6] focus:ring-[#00BFA6]/20'
    }`;

  return (
    <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4 animate-fade-in">
      {/* Card Number */}
      <div className="space-y-1.5">
        <label className="block text-xs sm:text-sm font-medium text-[#0f2744] dark:text-gray-200">
          Card Number
        </label>
        <div className="relative">
          <FiCreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4 sm:w-5 sm:h-5" />
          <input
            type="text"
            placeholder="1234 5678 9012 3456"
            value={cardDetails.cardNumber}
            onChange={(e) =>
              onChange({ ...cardDetails, cardNumber: formatCardNumber(e.target.value) })
            }
            maxLength={19}
            className={`pl-10 sm:pl-12 pr-4 ${inputClass('cardNumber', true)}`}
          />
        </div>
        {errors.cardNumber && <p className="text-red-500 text-xs">{errors.cardNumber}</p>}
      </div>

      {/* Expiry & CVV */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs sm:text-sm font-medium text-[#0f2744] dark:text-gray-200">
            Expiry Date
          </label>
          <input
            type="text"
            placeholder="MM/YY"
            value={cardDetails.expiryDate}
            onChange={(e) =>
              onChange({ ...cardDetails, expiryDate: formatExpiryDate(e.target.value) })
            }
            maxLength={5}
            className={inputClass('expiryDate')}
          />
          {errors.expiryDate && <p className="text-red-500 text-xs">{errors.expiryDate}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs sm:text-sm font-medium text-[#0f2744] dark:text-gray-200">
            CVV
          </label>
          <input
            type="password"
            placeholder="•••"
            value={cardDetails.cvv}
            onChange={(e) =>
              onChange({ ...cardDetails, cvv: e.target.value.replace(/\D/g, '') })
            }
            maxLength={4}
            className={inputClass('cvv')}
          />
          {errors.cvv && <p className="text-red-500 text-xs">{errors.cvv}</p>}
        </div>
      </div>

      {/* Card Holder */}
      <div className="space-y-1.5">
        <label className="block text-xs sm:text-sm font-medium text-[#0f2744] dark:text-gray-200">
          Card Holder Name
        </label>
        <input
          type="text"
          placeholder="John Doe"
          value={cardDetails.cardHolderName}
          onChange={(e) =>
            onChange({ ...cardDetails, cardHolderName: e.target.value })
          }
          className={inputClass('cardHolderName')}
        />
        {errors.cardHolderName && (
          <p className="text-red-500 text-xs">{errors.cardHolderName}</p>
        )}
      </div>
    </div>
  );
};

export default CardForm;
