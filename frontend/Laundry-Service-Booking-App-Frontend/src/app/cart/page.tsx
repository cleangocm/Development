'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiTrash2, FiPlus, FiMinus, FiTag } from 'react-icons/fi';
import { useTheme } from '@/context/ThemeContext';
import api from '@/services/api';

interface CartItem {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface CartGroup {
  serviceType: string;
  serviceId?: string;
  items: CartItem[];
}

const CartPage = () => {
  const { formatPrice } = useTheme();
  const router = useRouter();
  
  // Initialize cart data from localStorage
  const initializeCart = () => {
    if (typeof window === 'undefined') return [];
    
    // Try new cartGroups format first
    const savedGroups = localStorage.getItem('cartGroups');
    if (savedGroups) {
      try {
        const groups = JSON.parse(savedGroups);
        if (Array.isArray(groups) && groups.length > 0) {
          return groups.map((g: { serviceType: string; serviceId?: string; items: CartItem[] }) => ({
            serviceType: g.serviceType,
            serviceId: g.serviceId || '',
            items: g.items,
          }));
        }
      } catch {
        // fall through to legacy format
      }
    }
    
    // Fallback: legacy single-group format
    const savedItems = localStorage.getItem('cartItems');
    const serviceType = localStorage.getItem('serviceType') || 'Wash & Fold';
    const serviceId = localStorage.getItem('serviceId') || '';
    
    if (savedItems) {
      const items: CartItem[] = JSON.parse(savedItems);
      const groups = [{ serviceType, serviceId, items }];
      // Migrate to new format
      localStorage.setItem('cartGroups', JSON.stringify(groups));
      return groups;
    }
    return [];
  };
  
  const [cartGroups, setCartGroups] = useState<CartGroup[]>(initializeCart);
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountType: string; discountValue: number; discount: number } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  // Sync cart to localStorage whenever it changes + notify Header
  useEffect(() => {
    if (cartGroups.length > 0) {
      localStorage.setItem('cartGroups', JSON.stringify(cartGroups));
    } else {
      localStorage.removeItem('cartGroups');
      localStorage.removeItem('cartItems');
      localStorage.removeItem('serviceType');
      localStorage.removeItem('serviceId');
    }
    // Notify Header (and any listener) that cart changed — no polling needed
    window.dispatchEvent(new Event('cart-updated'));
  }, [cartGroups]);
  
  const [selectedGroups, setSelectedGroups] = useState<Set<number>>(() => {
    const groups = new Set<number>();
    cartGroups.forEach((_, i) => groups.add(i));
    return groups;
  });
  const [selectedItems, setSelectedItems] = useState<Set<string>>(() => {
    const items = new Set<string>();
    cartGroups.forEach((group, groupIndex) => {
      group.items.forEach((item) => items.add(`${groupIndex}-${item.id}`));
    });
    return items;
  });

  const handleQuantityChange = (groupIndex: number, itemId: string | number, delta: number) => {
    setCartGroups((prev) => {
      const newGroups = prev.map((g, i) => {
        if (i !== groupIndex) return g;
        const updatedItems = g.items
          .map((item) =>
            item.id === itemId ? { ...item, quantity: item.quantity + delta } : item
          )
          .filter((item) => item.quantity > 0);
        return { ...g, items: updatedItems };
      });
      return newGroups.filter((g) => g.items.length > 0);
    });
  };

  const handleDeleteItem = (groupIndex: number, itemId: string | number) => {
    setCartGroups((prev) =>
      prev
        .map((g, i) =>
          i === groupIndex
            ? { ...g, items: g.items.filter((item) => item.id !== itemId) }
            : g
        )
        .filter((g) => g.items.length > 0)
    );
  };

  const handleDeleteGroup = (groupIndex: number) => {
    setCartGroups((prev) => prev.filter((_, index) => index !== groupIndex));
  };

  const handleGroupCheckbox = (groupIndex: number, checked: boolean) => {
    const newSelectedGroups = new Set(selectedGroups);
    const newSelectedItems = new Set(selectedItems);
    
    if (checked) {
      newSelectedGroups.add(groupIndex);
      // Select all items in this group
      cartGroups[groupIndex].items.forEach((item) => {
        newSelectedItems.add(`${groupIndex}-${item.id}`);
      });
    } else {
      newSelectedGroups.delete(groupIndex);
      // Deselect all items in this group
      cartGroups[groupIndex].items.forEach((item) => {
        newSelectedItems.delete(`${groupIndex}-${item.id}`);
      });
    }
    
    setSelectedGroups(newSelectedGroups);
    setSelectedItems(newSelectedItems);
  };

  const handleItemCheckbox = (groupIndex: number, itemId: string | number, checked: boolean) => {
    const newSelectedItems = new Set(selectedItems);
    const itemKey = `${groupIndex}-${itemId}`;
    
    if (checked) {
      newSelectedItems.add(itemKey);
      
      // Check if all items in group are now selected
      const allItemsSelected = cartGroups[groupIndex].items.every((item) =>
        newSelectedItems.has(`${groupIndex}-${item.id}`)
      );
      
      if (allItemsSelected) {
        const newSelectedGroups = new Set(selectedGroups);
        newSelectedGroups.add(groupIndex);
        setSelectedGroups(newSelectedGroups);
      }
    } else {
      newSelectedItems.delete(itemKey);
      
      // Uncheck group checkbox
      const newSelectedGroups = new Set(selectedGroups);
      newSelectedGroups.delete(groupIndex);
      setSelectedGroups(newSelectedGroups);
    }
    
    setSelectedItems(newSelectedItems);
  };

  const handleApplyCoupon = async () => {
    const trimmedCode = couponCode.trim();
    if (!trimmedCode) {
      setCouponError('Please enter a coupon code');
      return;
    }
    
    try {
      setCouponLoading(true);
      setCouponError('');
      
      const cleanCode = trimmedCode.toUpperCase();
      const currentSubtotal = calculateSubtotal();
      
      const res = await api.post('/coupons/validate', {
        code: cleanCode,
        orderTotal: currentSubtotal
      });
      
      if (res.data?.status === 'success' && res.data?.data) {
        const couponData = res.data.data;
        setAppliedCoupon({
          code: couponData.code,
          discountType: couponData.discountType,
          discountValue: couponData.discountValue,
          discount: couponData.discount
        });
        setDiscountAmount(couponData.discount);
        setCouponCode('');
        setCouponError('');
      } else {
        setCouponError(res.data?.message || 'Invalid coupon code');
        setAppliedCoupon(null);
        setDiscountAmount(0);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const errorMessage = error.response?.data?.message || 'Invalid or expired coupon';
      setCouponError(errorMessage);
      setAppliedCoupon(null);
      setDiscountAmount(0);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
    setDiscountAmount(0);
  };

  const calculateSubtotal = useCallback(() => {
    return cartGroups.reduce((total, group, groupIndex) => {
      return total + group.items.reduce((sum, item) => {
        const isSelected = selectedItems.has(`${groupIndex}-${item.id}`);
        return sum + (isSelected ? item.price * item.quantity : 0);
      }, 0);
    }, 0);
  }, [cartGroups, selectedItems]);

  const subtotal = useMemo(() => calculateSubtotal(), [calculateSubtotal]);
  const deliveryCost = subtotal > 0 ? 5.99 : 0;
  const couponDiscountAmount = appliedCoupon?.discount || discountAmount;
  const totalPayable = Math.max(subtotal + deliveryCost - couponDiscountAmount, 0);

  const handleCheckout = () => {
    const orderData = {
      cartGroups,
      subtotal,
      deliveryCost,
      discount: couponDiscountAmount,
      total: totalPayable,
      coupon: appliedCoupon ? {
        code: appliedCoupon.code,
        discountType: appliedCoupon.discountType,
        discountValue: appliedCoupon.discountValue,
        discount: appliedCoupon.discount
      } : null,
    };
    localStorage.setItem('orderData', JSON.stringify(orderData));
    if (appliedCoupon) {
      localStorage.setItem('appliedCoupon', appliedCoupon.code);
    }
    router.push('/checkout');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 sm:pt-24">
        <div className="container-custom px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {cartGroups.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center animate-fade-in-up">
                  <p className="text-[#5a6a7a] dark:text-gray-400 text-sm sm:text-base mb-4">Your cart is empty</p>
                  <Link
                    href="/services"
                    className="inline-block bg-[#00BFA6] text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-[#00A892] transition-colors"
                  >
                    Browse Services
                  </Link>
                </div>
              ) : (
                cartGroups.map((group, groupIndex) => (
                  <div
                    key={groupIndex}
                    className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl overflow-hidden shadow-sm animate-fade-in-up"
                    style={{ animationDelay: `${groupIndex * 100}ms` }}
                  >
                    {/* Group Header */}
                    <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedGroups.has(groupIndex)}
                          onChange={(e) => handleGroupCheckbox(groupIndex, e.target.checked)}
                          className="w-5 h-5"
                        />
                        <h3 className="text-sm sm:text-base md:text-lg font-bold text-[#0f2744] dark:text-white">
                          {group.serviceType} ({group.items.length})
                        </h3>
                      </div>
                      <button
                        onClick={() => handleDeleteGroup(groupIndex)}
                        className="flex items-center gap-1 text-red-500 text-xs sm:text-sm hover:text-red-600 transition-colors"
                      >
                        <FiTrash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>

                    {/* Items */}
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                      {group.items.map((item) => {
                        const itemKey = `${groupIndex}-${item.id}`;
                        const isSelected = selectedItems.has(itemKey);
                        
                        return (
                          <div
                            key={item.id}
                            className={`flex items-start sm:items-center gap-3 sm:gap-4 p-4 sm:p-5 transition-opacity ${
                              !isSelected ? 'opacity-40' : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => handleItemCheckbox(groupIndex, item.id, e.target.checked)}
                              className="w-5 h-5 mt-1 sm:mt-0"
                            />

                            {/* Item Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[#5a6a7a] dark:text-gray-400 text-xs sm:text-sm">
                                  {item.quantity} X
                                </span>
                                <span className="text-[#0f2744] dark:text-white text-sm sm:text-base font-medium truncate">
                                  {item.name}
                                </span>
                              </div>
                            </div>

                            {/* Price & Controls */}
                            <div className="flex items-center gap-3 sm:gap-4">
                              <span className={`font-bold text-sm sm:text-base ${
                                isSelected ? 'text-[#0f2744] dark:text-white' : 'text-gray-400 line-through'
                              }`}>
                                {formatPrice(item.price * item.quantity)}
                              </span>
                            
                            <div className="flex items-center gap-1 sm:gap-2">
                              <button
                                onClick={() => handleQuantityChange(groupIndex, item.id, -1)}
                                className="p-1 sm:p-1.5 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                              >
                                <FiMinus className="w-3 h-3 sm:w-4 sm:h-4 text-[#0f2744] dark:text-gray-300" />
                              </button>
                              <span className="text-sm font-medium min-w-5 text-center dark:text-white">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleQuantityChange(groupIndex, item.id, 1)}
                                className="p-1 sm:p-1.5 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                              >
                                <FiPlus className="w-3 h-3 sm:w-4 sm:h-4 text-[#0f2744] dark:text-gray-300" />
                              </button>
                            </div>

                            <button
                              onClick={() => handleDeleteItem(groupIndex, item.id)}
                              className="p-1 sm:p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                      })}
                    </div>

                    {/* Add More Items */}
                    <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-gray-700">
                      <Link
                        href="/services"
                        className="flex items-center justify-center gap-2 w-full py-2.5 sm:py-3 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg text-[#5a6a7a] dark:text-gray-400 text-xs sm:text-sm font-medium hover:border-[#00BFA6] hover:text-[#00BFA6] transition-colors"
                      >
                        <FiPlus className="w-4 h-4" />
                        Add More Item
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm sticky top-24 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                {/* Coupon */}
                <div className="mb-6">
                  <h3 className="text-sm sm:text-base font-bold text-[#0f2744] dark:text-white mb-3 flex items-center gap-2">
                    <FiTag className="w-4 h-4" />
                    Coupon Code
                  </h3>
                  {!appliedCoupon ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Enter coupon code here"
                          value={couponCode}
                          onChange={(e) => {
                            setCouponCode(e.target.value.toUpperCase());
                            setCouponError('');
                          }}
                          onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                          className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#00BFA6] focus:ring-2 focus:ring-[#00BFA6]/20"
                          disabled={couponLoading}
                        />
                        <button
                          onClick={handleApplyCoupon}
                          disabled={couponLoading || !couponCode.trim()}
                          className="px-4 sm:px-6 py-2 sm:py-2.5 bg-[#0F2744] dark:bg-[#00BFA6] text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-[#1a3a5c] dark:hover:bg-[#00A892] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {couponLoading ? 'Applying...' : 'Apply'}
                        </button>
                      </div>
                      {couponError && (
                        <p className="text-xs text-red-500 dark:text-red-400">{couponError}</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-green-700 dark:text-green-400">{appliedCoupon.code}</p>
                        <p className="text-xs text-green-600 dark:text-green-500">
                          {appliedCoupon.discountType === 'percentage' 
                            ? `${appliedCoupon.discountValue}% off` 
                            : `${formatPrice(appliedCoupon.discountValue)} off`}
                          {' '}&mdash; You save {formatPrice(appliedCoupon.discount)}
                        </p>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Summary */}
                <div className="space-y-3 sm:space-y-4 mb-6">
                  <h3 className="text-sm sm:text-base font-bold text-[#0f2744] dark:text-white">Order Summary</h3>
                  
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-[#5a6a7a] dark:text-gray-400">Sub Total</span>
                    <span className="text-[#0f2744] dark:text-white font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-[#5a6a7a] dark:text-gray-400">Delivery Cost</span>
                    <span className="text-[#0f2744] dark:text-white font-medium">{formatPrice(deliveryCost)}</span>
                  </div>

                  {couponDiscountAmount > 0 && (
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-green-600">
                        Discount {appliedCoupon ? `(${appliedCoupon.code})` : ''}
                      </span>
                      <span className="text-green-600 font-medium">-{formatPrice(couponDiscountAmount)}</span>
                    </div>
                  )}

                  <div className="border-t border-gray-100 dark:border-gray-700 pt-3 sm:pt-4">
                    <div className="flex justify-between">
                      <span className="text-sm sm:text-base font-bold text-[#0f2744] dark:text-white">Total Payable</span>
                      <span className="text-base sm:text-lg font-bold text-[#00BFA6]">{formatPrice(totalPayable)}</span>
                    </div>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  disabled={cartGroups.length === 0 || subtotal === 0}
                  className="w-full bg-[#0F2744] dark:bg-[#00BFA6] text-white py-3 sm:py-3.5 rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 hover:bg-[#1a3a5c] dark:hover:bg-[#00A892] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Go To Check Out
                </button>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
};

export default CartPage;
