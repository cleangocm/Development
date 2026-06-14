'use client';

import { useState, useEffect } from 'react';
import DeliveryLayout from '@/components/delivery/DeliveryLayout';
import api from '@/services/api';
import { FiLoader, FiPackage, FiMapPin, FiPhone } from 'react-icons/fi';
import { useTheme } from '@/context/ThemeContext';
import Link from 'next/link';

interface AssignedOrder {
  _id: string;
  orderId: string;
  user?: { name: string; phone?: string; address?: string };
  status: string;
  totalPayment: number;
  pickupCharge?: number;
  deliveryCharge?: number;
  createdAt: string;
  items: { name: string; quantity: number }[];
}

const AssignedOrdersPage = () => {
  const { formatPrice } = useTheme();
  const [pickupOrders, setPickupOrders] = useState<AssignedOrder[]>([]);
  const [deliveryOrders, setDeliveryOrders] = useState<AssignedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pickup' | 'delivery'>('pickup');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const [pickupRes, deliveryRes] = await Promise.all([
          api.get('/delivery/pickup-orders').catch(() => null),
          api.get('/delivery/out-orders').catch(() => null),
        ]);
        if (pickupRes?.data?.status === 'success') setPickupOrders(pickupRes.data.data || []);
        if (deliveryRes?.data?.status === 'success') setDeliveryOrders(deliveryRes.data.data || []);
      } catch { /* */ } finally { setLoading(false); }
    };
    fetchOrders();
  }, []);

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; label: string }> = {
      pickup_assigned: { bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', label: '📦 Awaiting Pickup' },
      picked_up: { bg: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: '✅ Picked Up' },
      delivery_assigned: { bg: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400', label: '📋 Delivery Assigned' },
      out_for_delivery: { bg: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', label: '🚚 In Transit' },
    };
    const c = config[status] || { bg: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300', label: status };
    return <span className={`px-3 py-1 rounded-full text-xs font-medium ${c.bg}`}>{c.label}</span>;
  };

  const allOrders = activeTab === 'pickup' ? pickupOrders : deliveryOrders;

  return (
    <DeliveryLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Assigned Orders</h1>

        <div className="flex gap-2">
          <button onClick={() => setActiveTab('pickup')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'pickup' ? 'bg-[#0e6251] text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
            }`}>Pickup ({pickupOrders.length})</button>
          <button onClick={() => setActiveTab('delivery')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'delivery' ? 'bg-[#0e6251] text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
            }`}>Delivery ({deliveryOrders.length})</button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><FiLoader className="w-8 h-8 text-[#148f77] animate-spin" /></div>
        ) : allOrders.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center">
            <FiPackage className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No {activeTab} orders assigned</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Orders assigned by admin will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {allOrders.map((order) => (
              <div key={order._id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">{order.orderId}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{order.user?.name || 'Customer'}</p>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 mb-3">
                    {order.items?.slice(0, 3).map((item, i) => (
                      <p key={i} className="text-sm text-gray-600 dark:text-gray-300">{item.quantity}x {item.name}</p>
                    ))}
                    {(order.items?.length || 0) > 3 && <p className="text-xs text-gray-400">+{order.items.length - 3} more</p>}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {order.user?.phone && (
                        <a href={`tel:${order.user.phone}`} className="flex items-center gap-1 text-sm text-[#148f77] hover:underline"><FiPhone className="w-4 h-4" /> Call</a>
                      )}
                      {order.user?.address && (
                        <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400"><FiMapPin className="w-4 h-4" /> {order.user.address}</span>
                      )}
                    </div>
                    <p className="font-bold text-[#148f77]">{formatPrice(order.totalPayment)}</p>
                  </div>
                </div>
                <div className="border-t border-gray-100 dark:border-gray-700 p-4 flex gap-2">
                  {activeTab === 'pickup' ? (
                    <Link href="/delivery/pickup" className="flex-1 text-center py-2 bg-[#0e6251] text-white rounded-xl font-medium text-sm hover:bg-[#0b4f42] transition-colors">Go to Pickup</Link>
                  ) : (
                    <Link href="/delivery/in-transit" className="flex-1 text-center py-2 bg-[#0e6251] text-white rounded-xl font-medium text-sm hover:bg-[#0b4f42] transition-colors">Go to Delivery</Link>
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

export default AssignedOrdersPage;
