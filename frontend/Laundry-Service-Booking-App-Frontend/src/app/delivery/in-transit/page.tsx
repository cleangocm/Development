'use client';

import { useState, useEffect } from 'react';
import DeliveryLayout from '@/components/delivery/DeliveryLayout';
import api from '@/services/api';
import { FiLoader, FiTruck, FiCheckCircle, FiPhone, FiNavigation } from 'react-icons/fi';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';

interface Order {
  _id: string;
  orderId: string;
  user?: { name: string; phone?: string; address?: string };
  status: string;
  totalPayment: number;
  deliveryCharge?: number;
  createdAt: string;
  items: { name: string; quantity: number }[];
}

const InTransitPage = () => {
  const { showToast } = useToast();
  const { formatPrice } = useTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/delivery/out-orders');
      if (res.data.status === 'success') {
        setOrders(res.data.data || []);
      }
    } catch {
      try {
        const res = await api.get('/orders');
        if (res.data.status === 'success') {
          setOrders((res.data.data || []).filter((o: Order) => ['delivery_assigned', 'out_for_delivery'].includes(o.status)));
        }
      } catch { /* */ }
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleStartDelivery = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      await api.put(`/delivery/start-delivery/${orderId}`);
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: 'out_for_delivery' } : o));
    } catch { showToast('Failed to start delivery', 'error'); }
    finally { setActionLoading(null); }
  };

  const handleConfirmDelivery = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      await api.put(`/delivery/confirm-delivery/${orderId}`);
      setOrders(prev => prev.filter(o => o._id !== orderId));
    } catch { showToast('Failed to confirm delivery', 'error'); }
    finally { setActionLoading(null); }
  };

  return (
    <DeliveryLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <FiTruck className="w-6 h-6 text-[#148f77]" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Delivery Orders</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Orders to deliver cleaned clothes back to customers</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><FiLoader className="w-8 h-8 text-[#148f77] animate-spin" /></div>
        ) : orders.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center">
            <FiTruck className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No delivery orders</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Orders will appear here when admin assigns delivery to you</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order._id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{order.orderId}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{order.user?.name}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    order.status === 'out_for_delivery' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                  }`}>
                    {order.status === 'out_for_delivery' ? '🚚 In Transit' : '📋 Assigned'}
                  </span>
                </div>

                {order.user?.address && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 mb-3">
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Delivery Address</p>
                    <p className="text-sm text-gray-700 dark:text-gray-200">{order.user.address}</p>
                  </div>
                )}

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 mb-3">
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Items</p>
                  {order.items?.map((item, i) => (
                    <p key={i} className="text-sm text-gray-600 dark:text-gray-300">{item.quantity}x {item.name}</p>
                  ))}
                </div>

                <div className="flex items-center justify-between mb-3 text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Order Total: <strong className="dark:text-white">{formatPrice(order.totalPayment)}</strong></span>
                  {order.deliveryCharge ? <span className="text-green-600 font-medium">Delivery Charge: {formatPrice(order.deliveryCharge)}</span> : null}
                </div>

                <div className="flex gap-3">
                  {order.user?.phone && (
                    <a href={`tel:${order.user.phone}`}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors">
                      <FiPhone className="w-4 h-4" /> Call Customer
                    </a>
                  )}
                  {order.status === 'delivery_assigned' && (
                    <button onClick={() => handleStartDelivery(order._id)} disabled={actionLoading === order._id}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#0e6251] text-white rounded-xl font-medium text-sm hover:bg-[#0b4f42] transition-colors disabled:opacity-50">
                      {actionLoading === order._id ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiNavigation className="w-4 h-4" />} Start Delivery
                    </button>
                  )}
                  {order.status === 'out_for_delivery' && (
                    <button onClick={() => handleConfirmDelivery(order._id)} disabled={actionLoading === order._id}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl font-medium text-sm hover:bg-green-700 transition-colors disabled:opacity-50">
                      {actionLoading === order._id ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiCheckCircle className="w-4 h-4" />} Confirm Delivered
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DeliveryLayout>
  );
};

export default InTransitPage;
