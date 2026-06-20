export interface CleanGoSubscriptionPlan {
  id: string;
  name: string;
  priceXaf: number;
  pickupsPerMonth: number;
  pickupsPerWeek: number;
  bags: string;
  description: string;
  bestFor: string;
  featured?: boolean;
}

export interface OneOffPickupOption {
  id: string;
  name: string;
  priceXaf: number;
  description: string;
}

export interface PaymentAccountOption {
  id: string;
  name: string;
  accountNumber: string;
  instructions: string;
}

export const CLEAN_GO_SUBSCRIPTION_PLANS: CleanGoSubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Basic Plan',
    priceXaf: 3000,
    pickupsPerMonth: 4,
    pickupsPerWeek: 1,
    bags: '2 free 60L waste bags every month',
    description: '4 pickups per month with one pickup every week.',
    bestFor: 'Best for small households',
  },
  {
    id: 'standard',
    name: 'Standard Plan',
    priceXaf: 5000,
    pickupsPerMonth: 8,
    pickupsPerWeek: 2,
    bags: '2 free 60L waste bags per pickup, 16 bags monthly',
    description: '8 pickups per month with two pickups every week.',
    bestFor: 'Ideal for medium-sized households',
  },
  {
    id: 'premium',
    name: 'Premium Plan',
    priceXaf: 7000,
    pickupsPerMonth: 8,
    pickupsPerWeek: 2,
    bags: '4 waste bags collected per pickup, 32 bags monthly',
    description: '8 pickups per month with extra bag capacity.',
    bestFor: 'Perfect for larger families',
    featured: true,
  },
  {
    id: 'business',
    name: 'Business Plan',
    priceXaf: 15000,
    pickupsPerMonth: 12,
    pickupsPerWeek: 3,
    bags: '4 free 60L waste bags collected per pickup',
    description: '12 pickups per month for higher-volume addresses.',
    bestFor: 'Best for businesses and apartment buildings',
  },
  {
    id: 'enterprise',
    name: 'Enterprise Plan',
    priceXaf: 30000,
    pickupsPerMonth: 16,
    pickupsPerWeek: 4,
    bags: '8 free 100L waste bags collected per pickup',
    description: '16 pickups per month for high-volume waste producers.',
    bestFor: 'Designed for hotels, restaurants, and large sites',
  },
];

export const ONE_OFF_PICKUP_OPTIONS: OneOffPickupOption[] = [
  { id: 'small', name: 'Small Pickup', priceXaf: 5000, description: 'For light household waste and a few bags.' },
  { id: 'medium', name: 'Medium Pickup', priceXaf: 8000, description: 'For regular extra pickups outside a subscription.' },
  { id: 'large', name: 'Large Pickup', priceXaf: 15000, description: 'For bulky or high-volume one-time collection.' },
];

export const PAYMENT_ACCOUNT_OPTIONS: PaymentAccountOption[] = [
  {
    id: 'mtn_momo',
    name: 'MTN Cameroon Mobile Money',
    accountNumber: '+237 6XX XXX XXX',
    instructions: 'Use your pickup or invoice reference as the transaction note.',
  },
  {
    id: 'orange_money',
    name: 'Orange Cameroon Money',
    accountNumber: '+237 6XX XXX XXX',
    instructions: 'Use your pickup or invoice reference as the transaction note.',
  },
  {
    id: 'bank_transfer',
    name: 'Bank Transfer',
    accountNumber: 'CleanGo Cameroon - Account details pending',
    instructions: 'Upload or send the bank transfer transaction ID after payment.',
  },
  {
    id: 'cash',
    name: 'Cash on Pickup',
    accountNumber: 'Pay assigned collector',
    instructions: 'Cash payments stay pending until CleanGo confirms collection.',
  },
];

export function formatXaf(amount: number) {
  return `${amount.toLocaleString('fr-FR')} XAF`;
}
