'use client';

import { useState, useEffect } from 'react';
import DeliveryLayout from '@/components/delivery/DeliveryLayout';
import api from '@/services/api';
import { FiLoader, FiPackage, FiNavigation, FiHome, FiPhone } from 'react-icons/fi';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';

interface PickupOrder {
  _id: string;
  orderId: string;
  user?: { name: string; phone?: string; address?: string };
  status: string;
  totalPayment: number;
  pickupCharge?: number;
  createdAt: string;
  items: { name: string; quantity: number }[];
}

const PickupPage = () => {
  const { showToast } = useToast();
  const { formatPrice } = useTheme();
  const [orders, setOrders] = useState<PickupOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/delivery/pickup-orders');
      if (res.data.status === 'success') {
        setOrders(res.data.data || []);
      }
    } catch {
      // Fallback
      try {
        const res = await api.get('/orders');
        if (res.data.status === 'success') {
          setOrders((res.data.data || []).filter((o: PickupOrder) => ['pickup_assigned', 'picked_up'].includes(o.status)));
        }
      } catch { /* */ }
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleConfirmPickup = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      await api.put(`/delivery/pickup/${orderId}`);
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: 'picked_up' } : o));
    } catch { showToast('Failed to confirm pickup', 'error'); }
    finally { setActionLoading(null); }
  };

  const handleDeliverToWarehouse = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      await api.put(`/delivery/warehouse/${orderId}`);
      setOrders(prev => prev.filter(o => o._id !== orderId));
    } catch { showToast('Failed to update', 'error'); }
    finally { setActionLoading(null); }
  };

  return (
    <DeliveryLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pickup Orders</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Orders assigned to you for pickup from customers</p>

        {loading ? (
          <div className="flex items-center justify-center py-16"><FiLoader className="w-8 h-8 text-[#148f77] animate-spin" /></div>
        ) : orders.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center">
            <FiPackage className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No pickup orders assigned</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Admin will assign pickup orders to you</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order._id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{order.orderId}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{order.user?.name || 'Customer'}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    order.status === 'picked_up' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {order.status === 'picked_up' ? '✅ Picked Up' : '📦 Awaiting Pickup'}
                  </span>
                </div>

                {/* Customer info */}
                <div className="flex flex-wrap gap-3 mb-3 text-sm">
                  {order.user?.phone && (
                    <a href={`tel:${order.user.phone}`} className="flex items-center gap-1 text-[#148f77] hover:underline">
                      <FiPhone className="w-4 h-4" /> {order.user.phone}
                    </a>
                  )}
                  {order.user?.address && (
                    <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400"><FiHome className="w-4 h-4" /> {order.user.address}</span>
                  )}
                </div>

                {/* Items */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 mb-3">
                  {order.items?.map((item, i) => (
                    <p key={i} className="text-sm text-gray-600 dark:text-gray-300">{item.quantity}x {item.name}</p>
                  ))}
                </div>

                {/* Charges */}
                <div className="flex items-center justify-between mb-3 text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Order Total: <strong className="text-gray-900 dark:text-white">{formatPrice(order.totalPayment)}</strong></span>
                  {order.pickupCharge ? <span className="text-green-600 font-medium">Pickup Charge: {formatPrice(order.pickupCharge)}</span> : null}
                </div>

                {/* Actions */}
                {order.status === 'pickup_assigned' && (
                  <button onClick={() => handleConfirmPickup(order._id)} disabled={actionLoading === order._id}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#0e6251] text-white rounded-xl font-medium text-sm hover:bg-[#0b4f42] transition-colors disabled:opacity-50">
                    {actionLoading === order._id ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiNavigation className="w-4 h-4" />} Confirm Pickup
                  </button>
                )}
                {order.status === 'picked_up' && (
                  <button onClick={() => handleDeliverToWarehouse(order._id)} disabled={actionLoading === order._id}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-teal-600 text-white rounded-xl font-medium text-sm hover:bg-teal-700 transition-colors disabled:opacity-50">
                    {actionLoading === order._id ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiHome className="w-4 h-4" />} Delivered to Warehouse
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DeliveryLayout>
  );
};

export default PickupPage;
