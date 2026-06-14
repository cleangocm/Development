'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { FiUser, FiPhone, FiMail, FiMapPin, FiCalendar, FiClock, FiZap, FiStar, FiTruck } from 'react-icons/fi';
import { useTheme } from '@/context/ThemeContext';
import api from '@/services/api';
import { filterNameInput, filterPhoneInput, filterSafeText } from '@/lib/inputValidation';

type DeliveryType = 'standard' | 'fast' | 'premium';

interface OrderItem {
  serviceType: string;
  itemName: string;
  quantity: number;
  totalPrice: number;
}

interface OrderData {
  cartGroups: {
    serviceType: string;
    items: {
      id: string | number;
      name: string;
      price: number;
      quantity: number;
    }[];
  }[];
  subtotal: number;
  deliveryCost: number;
  discount: number;
  total: number;
}

// Helper: format date as YYYY-MM-DD
const toDateStr = (d: Date) => d.toISOString().split('T')[0];

// Helper: add days to a date
const addDays = (d: Date, n: number) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

// Helper: format date for display
const formatDateLabel = (dateStr: string) => {
  if (!dateStr) return 'No date selected';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

// Delivery speed extra charges
const DELIVERY_SPEED_CHARGES: Record<DeliveryType, number> = {
  standard: 0,
  fast: 5.99,
  premium: 12.99,
};

const DELIVERY_OPTIONS: {
  id: DeliveryType;
  label: string;
  icon: typeof FiTruck;
  pickupInfo: string;
  deliveryInfo: string;
  extraCharge: number;
  badge?: string;
  badgeColor?: string;
}[] = [
  {
    id: 'standard',
    label: 'Standard',
    icon: FiTruck,
    pickupInfo: 'Pickup from tomorrow',
    deliveryInfo: 'Delivery min 4 days after pickup',
    extraCharge: 0,
  },
  {
    id: 'fast',
    label: 'Fast',
    icon: FiZap,
    pickupInfo: 'Pickup from tomorrow',
    deliveryInfo: 'Delivery min 3 days after pickup',
    extraCharge: 5.99,
    badge: 'Popular',
    badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    id: 'premium',
    label: 'Premium',
    icon: FiStar,
    pickupInfo: 'Pickup from tomorrow',
    deliveryInfo: 'Delivery min 2 days after pickup',
    extraCharge: 12.99,
    badge: 'Fastest',
    badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
];

const CheckoutPage = () => {
  const { formatPrice } = useTheme();
  const router = useRouter();
  const { checkAuth } = useAuthStore();
  
  // Check authentication
  useEffect(() => {
    checkAuth();
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
    }
  }, [checkAuth, router]);
  
  // Initialize order data from localStorage
  const initializeOrderData = (): OrderData | null => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem('orderData');
    return saved ? JSON.parse(saved) : null;
  };
  
  const [orderData] = useState<OrderData | null>(initializeOrderData);
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('standard');
  const [useProfileInfo, setUseProfileInfo] = useState(true);
  const [profileData, setProfileData] = useState<{ name?: string; email?: string; phone?: string; address?: string } | null>(null);
  
  // Coupon from cart page (passed via orderData in localStorage)
  const [couponFromCart] = useState<{ code: string; discountType: string; discountValue: number; discount: number } | null>(() => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem('orderData');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        return data.coupon || null;
      } catch { return null; }
    }
    return null;
  });
  
  const [billingInfo, setBillingInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    alternativePhone: '',
    address: '',
    additionalInstruction: '',
  });

  // Fetch user profile for auto-fill
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) return;
        const res = await api.get('/auth/profile');
        if (res.data?.status === 'success' && res.data?.data) {
          const p = res.data.data;
          setProfileData(p);
          if (useProfileInfo) {
            setBillingInfo(prev => ({
              ...prev,
              fullName: p.name || '',
              email: p.email || '',
              phone: p.phone || '',
              address: p.address || '',
            }));
          }
        }
      } catch { /* profile fetch failed, user enters manually */ }
    };
    fetchProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toggle between profile info and manual entry
  const handleToggleProfileInfo = (checked: boolean) => {
    setUseProfileInfo(checked);
    if (checked && profileData) {
      setBillingInfo(prev => ({
        ...prev,
        fullName: profileData.name || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        address: profileData.address || '',
      }));
    } else if (!checked) {
      setBillingInfo(prev => ({
        ...prev,
        fullName: '',
        email: '',
        phone: '',
        address: '',
      }));
    }
  };

  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    phone: '',
    alternativePhone: '',
    address: '',
    additionalInstruction: '',
  });

  const [schedule, setSchedule] = useState({
    pickupDate: '',
    pickupSlot: '',
    deliveryDate: '',
    deliverySlot: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // ===== Date constraints based on delivery type =====
  const today = useMemo(() => new Date(), []);

  // Pickup: always from tomorrow onwards, no upper limit
  const pickupMinDate = useMemo(() => toDateStr(addDays(today, 1)), [today]);

  // Delivery min date based on delivery type (no max limit)
  const deliveryMinDate = useMemo(() => {
    if (!schedule.pickupDate) return '';
    const pickupD = new Date(schedule.pickupDate + 'T00:00:00');
    if (deliveryType === 'premium') {
      return toDateStr(addDays(pickupD, 2)); // minimum 2 days after pickup
    }
    if (deliveryType === 'fast') {
      return toDateStr(addDays(pickupD, 3)); // minimum 3 days after pickup
    }
    return toDateStr(addDays(pickupD, 4)); // standard: minimum 4 days after pickup
  }, [schedule.pickupDate, deliveryType]);

  // Calculate delivery speed charge (coupon discount already included in orderData.total from cart)
  const deliverySpeedCharge = DELIVERY_SPEED_CHARGES[deliveryType];
  const grandTotal = Math.max((orderData?.total || 0) + deliverySpeedCharge, 0);

  // Handle delivery type change — reset dates
  const handleDeliveryTypeChange = (type: DeliveryType) => {
    setDeliveryType(type);
    setSchedule({ pickupDate: '', pickupSlot: '', deliveryDate: '', deliverySlot: '' });
  };

  // Handle pickup date change — also reset delivery fields
  const handlePickupDateChange = (date: string) => {
    setSchedule(prev => ({ ...prev, pickupDate: date, deliveryDate: '', deliverySlot: '' }));
  };

  const timeSlots = [
    '9:00 AM - 11:00 AM',
    '11:00 AM - 1:00 PM',
    '1:00 PM - 3:00 PM',
    '3:00 PM - 5:00 PM',
    '5:00 PM - 7:00 PM',
  ];

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!billingInfo.fullName) newErrors.billingFullName = 'Full name is required';
    if (!billingInfo.email) newErrors.billingEmail = 'Email is required';
    if (!billingInfo.phone) newErrors.billingPhone = 'Phone number is required';
    if (!billingInfo.address) newErrors.billingAddress = 'Address is required';

    if (!sameAsBilling) {
      if (!shippingInfo.fullName) newErrors.shippingFullName = 'Full name is required';
      if (!shippingInfo.phone) newErrors.shippingPhone = 'Phone number is required';
      if (!shippingInfo.address) newErrors.shippingAddress = 'Address is required';
    }

    if (!schedule.pickupDate) newErrors.pickupDate = 'Pickup date is required';
    if (!schedule.pickupSlot) newErrors.pickupSlot = 'Pickup time slot is required';
    if (!schedule.deliveryDate) newErrors.deliveryDate = 'Delivery date is required';
    if (!schedule.deliverySlot) newErrors.deliverySlot = 'Delivery time slot is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCheckout = () => {
    if (validateForm()) {
      const checkoutData = {
        orderData,
        billingInfo,
        shippingInfo: sameAsBilling ? billingInfo : shippingInfo,
        schedule,
        deliveryType,
        deliverySpeedCharge,
        coupon: couponFromCart || null,
        finalTotal: grandTotal
      };
      localStorage.setItem('checkoutData', JSON.stringify(checkoutData));
      router.push('/payment');
    }
  };

  const getOrderItems = useMemo((): OrderItem[] => {
    if (!orderData) return [];
    
    return orderData.cartGroups.flatMap((group) =>
      group.items.map((item) => ({
        serviceType: group.serviceType,
        itemName: item.name,
        quantity: item.quantity,
        totalPrice: item.price * item.quantity,
      }))
    );
  }, [orderData]);

  const orderItems = getOrderItems;

  return (
    <>
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 sm:pt-24 pb-16 sm:pb-20">
        <div className="container-custom px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Order Summary - Left Side */}
            <div className="lg:col-span-1 order-2 lg:order-1">
              <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl overflow-hidden shadow-sm sticky top-24 animate-fade-in-up">
                <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700">
                  <h2 className="text-base sm:text-lg font-bold text-[#0f2744] dark:text-white">Order Summary</h2>
                </div>

                {/* Table Header */}
                <div className="hidden sm:grid grid-cols-4 gap-2 px-4 sm:px-6 py-3 bg-[#0f2744] dark:bg-[#00BFA6] border-2 border-[#0f2744] dark:border-[#00BFA6] text-white text-xs sm:text-sm font-medium">
                  <span>Service Type</span>
                  <span>Item Name</span>
                  <span className="text-center">Quantity</span>
                  <span className="text-right">Total Price</span>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-64 overflow-y-auto">
                  {orderItems.map((item, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-4 sm:px-6 py-3 text-xs sm:text-sm"
                    >
                      <span className="text-[#5a6a7a] dark:text-gray-400 sm:text-[#0f2744] sm:dark:text-gray-200">{item.serviceType}</span>
                      <span className="text-[#0f2744] dark:text-white font-medium">{item.itemName}</span>
                      <span className="text-[#5a6a7a] dark:text-gray-400 text-left sm:text-center">{item.quantity}</span>
                      <span className="text-[#0f2744] dark:text-white font-medium text-right">{formatPrice(item.totalPrice)}</span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-gray-700 space-y-2 sm:space-y-3">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-[#5a6a7a] dark:text-gray-400">Subtotal</span>
                    <span className="text-[#0f2744] dark:text-white font-medium">{formatPrice(orderData?.subtotal ?? 0)}</span>
                  </div>

                  {(orderData?.discount ?? 0) > 0 && (
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-green-600 dark:text-green-400">Coupon Discount</span>
                      <span className="text-green-600 dark:text-green-400 font-medium">-{formatPrice(orderData?.discount ?? 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-[#5a6a7a] dark:text-gray-400">Delivery Fee</span>
                    <span className="text-[#0f2744] dark:text-white font-medium">{formatPrice(orderData?.deliveryCost ?? 0)}</span>
                  </div>
                  {deliverySpeedCharge > 0 && (
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-[#5a6a7a] dark:text-gray-400">
                        {deliveryType === 'premium' ? 'Premium' : 'Fast'} Delivery Charge
                      </span>
                      <span className="text-orange-600 dark:text-orange-400 font-medium">{formatPrice(deliverySpeedCharge)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm sm:text-base pt-2 border-t border-gray-100 dark:border-gray-700">
                    <span className="font-bold text-[#0f2744] dark:text-white">Total</span>
                    <span className="font-bold text-[#00BFA6]">{formatPrice(grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Form - Right Side */}
            <div className="lg:col-span-2 order-1 lg:order-2 space-y-6">
              {/* Billing Info */}
              <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm animate-fade-in-up">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h2 className="text-base sm:text-lg font-bold text-[#0f2744] dark:text-white">Billing Info</h2>
                  {profileData && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useProfileInfo}
                        onChange={(e) => handleToggleProfileInfo(e.target.checked)}
                        className="w-5 h-5"
                      />
                      <span className="text-xs sm:text-sm text-[#5a6a7a] dark:text-gray-300">Use my account info</span>
                    </label>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs sm:text-sm font-medium text-[#0f2744] dark:text-gray-200">Full Name</label>
                    <div className="relative">
                      <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={billingInfo.fullName}
                        onChange={(e) => setBillingInfo({ ...billingInfo, fullName: filterNameInput(e.target.value) })}
                        className={`w-full pl-10 pr-4 py-2.5 sm:py-3 border rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 ${
                          errors.billingFullName ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 dark:border-gray-600 focus:border-[#00BFA6] focus:ring-[#00BFA6]/20'
                        }`}
                      />
                    </div>
                    {errors.billingFullName && <p className="text-red-500 text-xs">{errors.billingFullName}</p>}
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="block text-xs sm:text-sm font-medium text-[#0f2744] dark:text-gray-200">Email Address</label>
                    <div className="relative">
                      <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="email"
                        placeholder="name@example.com"
                        value={billingInfo.email}
                        onChange={(e) => setBillingInfo({ ...billingInfo, email: filterSafeText(e.target.value) })}
                        className={`w-full pl-10 pr-4 py-2.5 sm:py-3 border rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 ${
                          errors.billingEmail ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 dark:border-gray-600 focus:border-[#00BFA6] focus:ring-[#00BFA6]/20'
                        }`}
                      />
                    </div>
                    {errors.billingEmail && <p className="text-red-500 text-xs">{errors.billingEmail}</p>}
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="block text-xs sm:text-sm font-medium text-[#0f2744] dark:text-gray-200">Phone Number</label>
                    <div className="relative">
                      <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        value={billingInfo.phone}
                        onChange={(e) => setBillingInfo({ ...billingInfo, phone: filterPhoneInput(e.target.value) })}
                        className={`w-full pl-10 pr-4 py-2.5 sm:py-3 border rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 ${
                          errors.billingPhone ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 dark:border-gray-600 focus:border-[#00BFA6] focus:ring-[#00BFA6]/20'
                        }`}
                      />
                    </div>
                    {errors.billingPhone && <p className="text-red-500 text-xs">{errors.billingPhone}</p>}
                  </div>

                  {/* Alternative Phone */}
                  <div className="space-y-1.5">
                    <label className="block text-xs sm:text-sm font-medium text-[#0f2744] dark:text-gray-200">Alternative Phone Number</label>
                    <div className="relative">
                      <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="tel"
                        placeholder="Alternative Phone Number"
                        value={billingInfo.alternativePhone}
                        onChange={(e) => setBillingInfo({ ...billingInfo, alternativePhone: filterPhoneInput(e.target.value) })}
                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-[#00BFA6] focus:ring-2 focus:ring-[#00BFA6]/20"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-xs sm:text-sm font-medium text-[#0f2744] dark:text-gray-200">Address</label>
                    <div className="relative">
                      <FiMapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                      <textarea
                        placeholder="Type here..."
                        rows={2}
                        value={billingInfo.address}
                        onChange={(e) => setBillingInfo({ ...billingInfo, address: filterSafeText(e.target.value) })}
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 resize-none ${
                          errors.billingAddress ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 dark:border-gray-600 focus:border-[#00BFA6] focus:ring-[#00BFA6]/20'
                        }`}
                      />
                    </div>
                    {errors.billingAddress && <p className="text-red-500 text-xs">{errors.billingAddress}</p>}
                  </div>

                  {/* Additional Instructions */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-xs sm:text-sm font-medium text-[#0f2744] dark:text-gray-200">Additional Instruction</label>
                    <textarea
                      placeholder="For e.g. Contactless delivery"
                      rows={2}
                      value={billingInfo.additionalInstruction}
                      onChange={(e) => setBillingInfo({ ...billingInfo, additionalInstruction: filterSafeText(e.target.value) })}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-[#00BFA6] focus:ring-2 focus:ring-[#00BFA6]/20 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Info */}
              <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h2 className="text-base sm:text-lg font-bold text-[#0f2744] dark:text-white">Shipping Info</h2>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sameAsBilling}
                      onChange={(e) => setSameAsBilling(e.target.checked)}
                      className="w-5 h-5"
                    />
                    <span className="text-xs sm:text-sm text-[#5a6a7a] dark:text-gray-300">Same as Billing info</span>
                  </label>
                </div>

                {!sameAsBilling && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <label className="block text-xs sm:text-sm font-medium text-[#0f2744] dark:text-gray-200">Full Name</label>
                      <div className="relative">
                        <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Full Name"
                          value={shippingInfo.fullName}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, fullName: filterNameInput(e.target.value) })}
                          className={`w-full pl-10 pr-4 py-2.5 sm:py-3 border rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 ${
                            errors.shippingFullName ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 dark:border-gray-600 focus:border-[#00BFA6] focus:ring-[#00BFA6]/20'
                          }`}
                        />
                      </div>
                      {errors.shippingFullName && <p className="text-red-500 text-xs">{errors.shippingFullName}</p>}
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                      <label className="block text-xs sm:text-sm font-medium text-[#0f2744] dark:text-gray-200">Phone Number</label>
                      <div className="relative">
                        <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="tel"
                          placeholder="Phone Number"
                          value={shippingInfo.phone}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, phone: filterPhoneInput(e.target.value) })}
                          className={`w-full pl-10 pr-4 py-2.5 sm:py-3 border rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 ${
                            errors.shippingPhone ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 dark:border-gray-600 focus:border-[#00BFA6] focus:ring-[#00BFA6]/20'
                          }`}
                        />
                      </div>
                      {errors.shippingPhone && <p className="text-red-500 text-xs">{errors.shippingPhone}</p>}
                    </div>

                    {/* Alternative Phone */}
                    <div className="space-y-1.5">
                      <label className="block text-xs sm:text-sm font-medium text-[#0f2744] dark:text-gray-200">Alternative Phone Number</label>
                      <div className="relative">
                        <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="tel"
                          placeholder="Alternative Phone Number"
                          value={shippingInfo.alternativePhone}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, alternativePhone: filterPhoneInput(e.target.value) })}
                          className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-[#00BFA6] focus:ring-2 focus:ring-[#00BFA6]/20"
                        />
                      </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="block text-xs sm:text-sm font-medium text-[#0f2744] dark:text-gray-200">Address</label>
                      <div className="relative">
                        <FiMapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                        <textarea
                          placeholder="Type here..."
                          rows={2}
                          value={shippingInfo.address}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, address: filterSafeText(e.target.value) })}
                          className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 resize-none ${
                            errors.shippingAddress ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 dark:border-gray-600 focus:border-[#00BFA6] focus:ring-[#00BFA6]/20'
                          }`}
                        />
                      </div>
                      {errors.shippingAddress && <p className="text-red-500 text-xs">{errors.shippingAddress}</p>}
                    </div>

                    {/* Additional Instructions */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="block text-xs sm:text-sm font-medium text-[#0f2744] dark:text-gray-200">Additional Instruction</label>
                      <textarea
                        placeholder="For e.g. Contactless delivery"
                        rows={2}
                        value={shippingInfo.additionalInstruction}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, additionalInstruction: filterSafeText(e.target.value) })}
                        className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-[#00BFA6] focus:ring-2 focus:ring-[#00BFA6]/20 resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Delivery Type Selection */}
              <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm animate-fade-in-up" style={{ animationDelay: '150ms' }}>
                <h2 className="text-base sm:text-lg font-bold text-[#0f2744] dark:text-white mb-4 sm:mb-5">Delivery Speed</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {DELIVERY_OPTIONS.map((opt) => {
                    const isSelected = deliveryType === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleDeliveryTypeChange(opt.id)}
                        className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                          isSelected
                            ? 'border-[#00BFA6] bg-[#00BFA6]/5 dark:bg-[#00BFA6]/10 shadow-md'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700'
                        }`}
                      >
                        {opt.badge && (
                          <span className={`absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold ${opt.badgeColor}`}>
                            {opt.badge}
                          </span>
                        )}
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            isSelected ? 'bg-[#00BFA6] text-white' : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-300'
                          }`}>
                            <opt.icon className="w-4.5 h-4.5" />
                          </div>
                          <span className={`font-bold text-sm ${isSelected ? 'text-[#00BFA6]' : 'text-[#0f2744] dark:text-white'}`}>
                            {opt.label}
                          </span>
                          {isSelected && (
                            <div className="ml-auto w-5 h-5 rounded-full bg-[#00BFA6] flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-[#5a6a7a] dark:text-gray-400 leading-relaxed">{opt.pickupInfo}</p>
                        <p className="text-xs text-[#5a6a7a] dark:text-gray-400 leading-relaxed">{opt.deliveryInfo}</p>
                        {opt.extraCharge > 0 && (
                          <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 mt-1">+ {formatPrice(opt.extraCharge)} extra</p>
                        )}
                        {opt.extraCharge === 0 && (
                          <p className="text-xs font-semibold text-green-600 dark:text-green-400 mt-1">Free</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Schedule */}
              <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {/* Pickup Schedule */}
                  <div className="space-y-4">
                    <h3 className="text-sm sm:text-base font-bold text-[#0f2744] dark:text-white">Pickup Schedule</h3>
                    
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 text-xs sm:text-sm text-[#5a6a7a] dark:text-gray-400">
                        <FiCalendar className="w-4 h-4" />
                        {schedule.pickupDate ? formatDateLabel(schedule.pickupDate) : 'Select pickup date'}
                      </label>
                      <input
                        type="date"
                        value={schedule.pickupDate}
                        min={pickupMinDate}
                        onChange={(e) => handlePickupDateChange(e.target.value)}
                        className={`w-full px-4 py-2.5 border rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 date-input ${
                          errors.pickupDate ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 dark:border-gray-600 focus:border-[#00BFA6] focus:ring-[#00BFA6]/20'
                        }`}
                      />
                      <p className="text-xs text-[#00BFA6]">
                        Tomorrow or any day after
                      </p>
                      {errors.pickupDate && <p className="text-red-500 text-xs">{errors.pickupDate}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 text-xs sm:text-sm text-[#5a6a7a] dark:text-gray-400">
                        <FiClock className="w-4 h-4" />
                        Select pick up slot
                      </label>
                      <select
                        value={schedule.pickupSlot}
                        onChange={(e) => setSchedule({ ...schedule, pickupSlot: e.target.value })}
                        className={`w-full px-4 py-2.5 border rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 ${
                          errors.pickupSlot ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 dark:border-gray-600 focus:border-[#00BFA6] focus:ring-[#00BFA6]/20'
                        }`}
                      >
                        <option value="">Select time slot</option>
                        {timeSlots.map((slot) => (
                          <option key={slot} value={slot}>{slot}</option>
                        ))}
                      </select>
                      {errors.pickupSlot && <p className="text-red-500 text-xs">{errors.pickupSlot}</p>}
                    </div>
                  </div>

                  {/* Delivery Schedule */}
                  <div className="space-y-4">
                    <h3 className="text-sm sm:text-base font-bold text-[#0f2744] dark:text-white">Delivery Schedule</h3>
                    
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 text-xs sm:text-sm text-[#5a6a7a] dark:text-gray-400">
                        <FiCalendar className="w-4 h-4" />
                        {schedule.deliveryDate ? formatDateLabel(schedule.deliveryDate) : 'Select delivery date'}
                      </label>
                      <input
                        type="date"
                        value={schedule.deliveryDate}
                        min={deliveryMinDate}
                        disabled={!schedule.pickupDate}
                        onChange={(e) => setSchedule({ ...schedule, deliveryDate: e.target.value })}
                        className={`w-full px-4 py-2.5 border rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed date-input ${
                          errors.deliveryDate ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 dark:border-gray-600 focus:border-[#00BFA6] focus:ring-[#00BFA6]/20'
                        }`}
                      />
                      <p className="text-xs text-[#00BFA6]">
                        {!schedule.pickupDate 
                          ? 'Select pickup date first'
                          : deliveryType === 'premium' 
                            ? 'Min 2 days after pickup or any later date' 
                            : deliveryType === 'fast' 
                              ? 'Min 3 days after pickup or any later date' 
                              : 'Min 4 days after pickup or any later date'}
                      </p>
                      {errors.deliveryDate && <p className="text-red-500 text-xs">{errors.deliveryDate}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 text-xs sm:text-sm text-[#5a6a7a] dark:text-gray-400">
                        <FiClock className="w-4 h-4" />
                        Select delivery slot
                      </label>
                      <select
                        value={schedule.deliverySlot}
                        disabled={!schedule.deliveryDate}
                        onChange={(e) => setSchedule({ ...schedule, deliverySlot: e.target.value })}
                        className={`w-full px-4 py-2.5 border rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                          errors.deliverySlot ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 dark:border-gray-600 focus:border-[#00BFA6] focus:ring-[#00BFA6]/20'
                        }`}
                      >
                        <option value="">Select delivery slot</option>
                        {timeSlots.map((slot) => (
                          <option key={slot} value={slot}>{slot}</option>
                        ))}
                      </select>
                      {errors.deliverySlot && <p className="text-red-500 text-xs">{errors.deliverySlot}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                className="w-full bg-[#162e4b] dark:bg-[#00BFA6] text-white py-3 sm:py-4 rounded-xl border-2 border-[#162e4b] dark:border-[#00BFA6] font-semibold text-sm sm:text-base transition-all duration-300 hover:bg-[#0d223c] dark:hover:bg-[#00A892] hover:border-[#0d223c] dark:hover:border-[#00A892] hover:shadow-lg animate-fade-in-up"
                style={{ animationDelay: '300ms' }}
              >
                Checkout
              </button>
            </div>
          </div>
        </div>
      </main>
    
    </>
  );
};

export default CheckoutPage;
