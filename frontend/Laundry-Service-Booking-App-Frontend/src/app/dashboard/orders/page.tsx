'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { FiX, FiDownload, FiRefreshCw, FiLoader } from 'react-icons/fi';
import { useTheme } from '@/context/ThemeContext';
import { generateInvoicePDF } from '@/services/invoicePdf';
import { useAuthStore } from '@/store/authStore';
import { listCustomerPickups } from '@/services/cleangoRepository';
import { cancelPickup } from '@/services/cleangoFunctions';
import type { Pickup } from '@/types/cleango';

// Order types
type OrderFilter = 'all' | 'completed' | 'ongoing' | 'cancelled';

interface Order {
  _id: string;
  orderId: string;
  itemsSummary: string;
  itemCount: number;
  orderDate: string;
  deliveryDate: string;
  subtotal: number;
  deliveryCharge: number;
  deliverySpeedCharge: number;
  discount: number;
  totalPayment: number;
  status: string;
}

function toIsoDate(value: Pickup['scheduledDate'] | Pickup['updatedAt']): string {
  if (!value) return new Date().toISOString();
  if (typeof value === 'string') return value;
  return value.toDate().toISOString();
}

function pickupToOrder(pickup: Pickup): Order {
  return {
    _id: pickup.id,
    orderId: pickup.id,
    itemsSummary: pickup.notes || 'CleanGo waste collection pickup',
    itemCount: 1,
    orderDate: toIsoDate(pickup.scheduledDate),
    deliveryDate: toIsoDate(pickup.updatedAt || pickup.scheduledDate),
    subtotal: 0,
    deliveryCharge: 0,
    deliverySpeedCharge: 0,
    discount: 0,
    totalPayment: 0,
    status: pickup.status,
  };
}

const OrdersPage = () => {
  const { formatPrice } = useTheme();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<OrderFilter>('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const tabs: { id: OrderFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'completed', label: 'Completed' },
    { id: 'ongoing', label: 'Ongoing' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      if (!user) {
        setOrders([]);
        return;
      }
      const pickups = await listCustomerPickups(user.id);
      const filtered = pickups.filter((pickup) => {
        if (activeTab === 'all') return true;
        if (activeTab === 'completed') return pickup.status === 'completed';
        if (activeTab === 'cancelled') return pickup.status === 'cancelled';
        return !['completed', 'cancelled'].includes(pickup.status);
      });
      setOrders(filtered.map(pickupToOrder));
      setError('');
    } catch {
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, user]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const getStatusColor = (status: string) => {
    if (['assigned', 'en_route', 'arrived', 'rescheduled'].includes(status))
      return 'bg-[#00BFA6] text-white';
    if (status === 'completed') return 'bg-green-500 text-white';
    if (status === 'cancelled') return 'bg-red-500 text-white';
    return 'bg-gray-500 text-white';
  };

  const formatStatus = (status: string) => status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  const isOngoing = (status: string) => !['completed', 'cancelled'].includes(status);

  const handleCancelOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowCancelModal(true);
  };

  const confirmCancelOrder = async () => {
    if (selectedOrderId) {
      try {
        await cancelPickup(selectedOrderId);
        fetchOrders();
      } catch {
        setError('Failed to cancel order. Please try again.');
      }
    }
    setShowCancelModal(false);
    setSelectedOrderId(null);
  };

  return (
    <DashboardLayout>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700">
          <h1 className="text-lg font-semibold text-[#0F2744] dark:text-white border-b-2 border-[#00BFA6] pb-2 inline-block">My Pickups</h1>
        </div>

        {/* Tabs */}
        <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-medium text-sm sm:text-base transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-[#0F2744] dark:bg-[#00BFA6] text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm flex items-center justify-between">
              <span>{error}</span>
              <button onClick={fetchOrders} className="text-red-600 dark:text-red-400 hover:underline font-medium">Retry</button>
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <FiLoader className="w-8 h-8 text-[#00BFA6] animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <FiX className="w-10 h-10 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No pickups found</h3>
              <p className="text-gray-500 dark:text-gray-400">You don&apos;t have any {activeTab !== 'all' ? activeTab : ''} pickups yet.</p>
            </div>
          ) : (
            orders.map((order, index) => (
              <div
                key={order._id}
                className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 sm:p-6 hover:border-[#00BFA6]/30 hover:shadow-md transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Order Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <span className={`inline-flex px-3 py-1 rounded-md text-xs sm:text-sm font-semibold capitalize w-fit ${getStatusColor(order.status)}`}>
                    {formatStatus(order.status)}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Pickup ID: <span className="font-semibold text-[#0F2744] dark:text-white">{order.orderId}</span>
                  </span>
                </div>

                {/* Order Details */}
                <h3 className="text-base sm:text-lg font-bold text-[#0F2744] dark:text-white mb-4">
                  {order.itemsSummary}
                </h3>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Scheduled Date</p>
                    <p className="text-sm sm:text-base font-semibold text-[#0F2744] dark:text-white">{formatDate(order.orderDate)}</p>
                  </div>
                  <div className="text-right lg:text-left">
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Updated Date</p>
                    <p className="text-sm sm:text-base font-semibold text-[#0F2744] dark:text-white">{formatDate(order.deliveryDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Subtotal</p>
                    <p className="text-sm sm:text-base font-semibold text-[#0F2744] dark:text-white">{formatPrice(order.subtotal ?? 0)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Delivery Fee</p>
                    <p className="text-sm sm:text-base font-semibold text-[#0F2744] dark:text-white">{formatPrice((order.deliveryCharge ?? 0) + (order.deliverySpeedCharge ?? 0))}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Discount</p>
                    <p className="text-sm sm:text-base font-semibold text-green-600 dark:text-green-400">{order.discount > 0 ? `-${formatPrice(order.discount)}` : formatPrice(0)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Total Payment</p>
                    <p className="text-sm sm:text-base font-bold text-[#00BFA6]">{formatPrice(order.totalPayment)}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                  {isOngoing(order.status) && (
                    <button
                      onClick={() => handleCancelOrder(order._id)}
                      className="flex-1 sm:flex-none px-5 py-2.5 border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg font-medium hover:border-red-500 hover:text-red-500 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  )}
                  {order.status === 'completed' && (
                    <>
                      <button
                        onClick={async () => {
                          generateInvoicePDF(order as unknown as Parameters<typeof generateInvoicePDF>[0], formatPrice);
                        }}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg font-medium hover:border-[#00BFA6] hover:text-[#00BFA6] transition-colors text-sm"
                      >
                        <FiDownload className="w-4 h-4" />
                        Invoice
                      </button>
                      <Link
                        href="/dashboard/book-pickup"
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 border-2 border-[#00BFA6] text-[#00BFA6] rounded-lg font-medium hover:bg-[#00BFA6] hover:text-white transition-colors text-sm"
                      >
                        <FiRefreshCw className="w-4 h-4" />
                        Schedule again
                      </Link>
                    </>
                  )}
                  <Link
                    href={`/dashboard/orders/${order._id}`}
                    className="flex-1 sm:flex-none px-5 py-2.5 bg-[#0F2744] dark:bg-[#00BFA6] text-white rounded-lg font-medium hover:bg-[#1a3a5c] dark:hover:bg-[#00A892] transition-colors text-center text-sm"
                  >
                    Track Pickup
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-9998 animate-fade-in"
            onClick={() => setShowCancelModal(false)}
          />
          <div 
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-9999 animate-scale-in"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 w-[90vw] sm:w-96 shadow-2xl">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">
                  Do you want to cancel this order?
                </h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="flex-1 px-6 py-2.5 border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    No
                  </button>
                  <button
                    onClick={confirmCancelOrder}
                    className="flex-1 px-6 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
                  >
                    Yes, Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default OrdersPage;
