'use client';

import { useState, useEffect, useCallback } from 'react';
import StaffLayout from '@/components/staff/StaffLayout';
import api from '@/services/api';
import { FiSearch, FiLoader, FiPackage, FiRefreshCw, FiPlay, FiCheckCircle } from 'react-icons/fi';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { filterSafeText } from '@/lib/inputValidation';

interface Order {
  _id: string;
  orderId: string;
  user?: { name: string; email: string };
  items: { name: string; quantity: number; price: number }[];
  status: string;
  totalPayment: number;
  createdAt: string;
  cleaningNotes?: string;
}

const StaffOrdersPage = () => {
  const { formatPrice } = useTheme();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [cleaningNotes, setCleaningNotes] = useState<Record<string, string>>({});

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const res = await api.get(`/staff/orders${params}`);
      if (res.data.status === 'success') {
        setOrders(res.data.data || []);
      }
    } catch {
      // Fallback
      try {
        const res = await api.get('/orders');
        if (res.data.status === 'success') setOrders(res.data.data || []);
      } catch { /* */ }
    } finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleStartCleaning = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      await api.put(`/staff/orders/${orderId}/start-cleaning`);
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: 'in_process' } : o));
    } catch { showToast('Failed to start cleaning', 'error'); }
    finally { setActionLoading(null); }
  };

  const handleCompleteCleaning = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      await api.put(`/staff/orders/${orderId}/complete-cleaning`, {
        cleaningNotes: cleaningNotes[orderId] || '',
      });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: 'cleaned' } : o));
    } catch { showToast('Failed to complete cleaning', 'error'); }
    finally { setActionLoading(null); }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'at_warehouse': return 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400';
      case 'in_process': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'cleaned': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchSearch = o.orderId?.toLowerCase().includes(search.toLowerCase()) ||
      o.user?.name?.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <StaffLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cleaning Orders</h1>
          <button onClick={fetchOrders} className="flex items-center gap-2 px-4 py-2 bg-[#1a5276] text-white rounded-xl text-sm hover:bg-[#154360] transition-colors">
            <FiRefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input type="text" placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-[#2e86c1] outline-none text-gray-900 dark:text-white" />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { id: 'all', label: 'All Orders' },
              { id: 'pending', label: 'Pending (Warehouse)' },
              { id: 'in_progress', label: 'Cleaning In Progress' },
              { id: 'completed', label: 'Completed' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setStatusFilter(tab.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  statusFilter === tab.id ? 'bg-[#1a5276] text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}>{tab.label}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><FiLoader className="w-8 h-8 text-[#2e86c1] animate-spin" /></div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-sm">
            <FiPackage className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No orders found</p>
            <p className="text-xs text-gray-400 mt-1">Orders assigned by admin will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order._id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">{order.orderId}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{order.user?.name || 'Customer'}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 mb-3">
                    <p className="text-xs text-gray-400 mb-1 font-medium">Items to Clean</p>
                    {order.items?.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-300">{item.quantity}x {item.name}</span>
                        <span className="text-gray-500 dark:text-gray-400">{formatPrice(item.price)}</span>
                      </div>
                    ))}
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 flex justify-between font-medium text-sm">
                      <span>Total</span><span>{formatPrice(order.totalPayment)}</span>
                    </div>
                  </div>

                  {/* Cleaning Notes Input (for in_process) */}
                  {order.status === 'in_process' && (
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Cleaning Notes (optional)</label>
                      <textarea
                        value={cleaningNotes[order._id] || ''}
                        onChange={(e) => setCleaningNotes(prev => ({ ...prev, [order._id]: filterSafeText(e.target.value) }))}
                        placeholder="Add any notes about the cleaning..."
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white resize-none h-20"
                      />
                    </div>
                  )}

                  {order.cleaningNotes && order.status === 'cleaned' && (
                    <div className="bg-green-50 dark:bg-green-900/10 rounded-xl p-3 mb-3">
                      <p className="text-xs text-green-700 dark:text-green-400 font-medium">Cleaning Notes:</p>
                      <p className="text-sm text-green-600 dark:text-green-300">{order.cleaningNotes}</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {(order.status === 'at_warehouse') && (
                  <div className="border-t border-gray-100 dark:border-gray-700 p-4">
                    <button onClick={() => handleStartCleaning(order._id)} disabled={actionLoading === order._id}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-orange-600 text-white rounded-xl font-medium text-sm hover:bg-orange-700 transition-colors disabled:opacity-50">
                      {actionLoading === order._id ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiPlay className="w-4 h-4" />} Start Cleaning
                    </button>
                  </div>
                )}
                {order.status === 'in_process' && (
                  <div className="border-t border-gray-100 dark:border-gray-700 p-4">
                    <button onClick={() => handleCompleteCleaning(order._id)} disabled={actionLoading === order._id}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl font-medium text-sm hover:bg-green-700 transition-colors disabled:opacity-50">
                      {actionLoading === order._id ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiCheckCircle className="w-4 h-4" />} Mark Cleaning Complete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </StaffLayout>
  );
};

export default StaffOrdersPage;
