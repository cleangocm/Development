'use client';

import { useState, useEffect } from 'react';
import DeliveryLayout from '@/components/delivery/DeliveryLayout';
import api from '@/services/api';
import { FiLoader, FiCheckCircle, FiCalendar, FiDollarSign } from 'react-icons/fi';
import { useTheme } from '@/context/ThemeContext';

interface Order {
  _id: string;
  orderId: string;
  user?: { name: string; phone?: string };
  status: string;
  totalPayment: number;
  pickupCharge?: number;
  deliveryCharge?: number;
  deliveredAt?: string;
  createdAt: string;
  items: { name: string; quantity: number }[];
}

const CompletedPage = () => {
  const { formatPrice } = useTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/delivery/completed?page=${page}&limit=20`);
        if (res.data.status === 'success') {
          setOrders(res.data.data.orders || res.data.data || []);
          if (res.data.data.totalPages) setTotalPages(res.data.data.totalPages);
        }
      } catch {
        try {
          const res = await api.get('/orders');
          if (res.data.status === 'success') {
            setOrders((res.data.data || []).filter((o: Order) => o.status === 'delivered'));
          }
        } catch { /* */ }
      } finally { setLoading(false); }
    };
    fetchOrders();
  }, [page]);

  const totalEarned = orders.reduce((sum, o) => sum + (o.pickupCharge || 0) + (o.deliveryCharge || 0), 0);

  return (
    <DeliveryLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FiCheckCircle className="w-6 h-6 text-[#148f77]" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Completed Deliveries</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{orders.length} deliveries completed</p>
            </div>
          </div>
        </div>

        {/* Earnings Summary */}
        <div className="bg-linear-to-r from-emerald-500 to-teal-500 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3">
            <FiDollarSign className="w-8 h-8" />
            <div>
              <p className="text-sm text-emerald-100">Total Earned (this page)</p>
              <h3 className="text-2xl font-bold">{formatPrice(totalEarned)}</h3>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><FiLoader className="w-8 h-8 text-[#148f77] animate-spin" /></div>
        ) : orders.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center">
            <FiCheckCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No completed deliveries yet</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order._id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">{order.orderId}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{order.user?.name}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">✅ Delivered</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <FiCalendar className="w-3 h-3" />
                      <span>{new Date(order.deliveredAt || order.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {order.pickupCharge ? <span className="text-blue-600">P: {formatPrice(order.pickupCharge)}</span> : null}
                      {order.deliveryCharge ? <span className="text-purple-600">D: {formatPrice(order.deliveryCharge)}</span> : null}
                      <span className="font-semibold text-gray-900 dark:text-white">{formatPrice(order.totalPayment)}</span>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                    {order.items?.map((item, i) => (
                      <span key={i} className="text-xs text-gray-400 mr-2">{item.quantity}x {item.name}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm disabled:opacity-50">Previous</button>
                <span className="text-sm text-gray-500 dark:text-gray-400">Page {page} of {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm disabled:opacity-50">Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </DeliveryLayout>
  );
};

export default CompletedPage;
