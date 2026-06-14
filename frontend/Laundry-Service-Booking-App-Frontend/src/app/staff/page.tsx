'use client';

import { useState, useEffect } from 'react';
import StaffLayout from '@/components/staff/StaffLayout';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import { FiShoppingBag, FiCheckCircle, FiClock, FiLoader, FiPackage, FiRefreshCw } from 'react-icons/fi';
import Link from 'next/link';

const StaffDashboardPage = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ assignedOrders: 0, cleaningInProgress: 0, completedToday: 0, totalCompleted: 0 });
  const [recentOrders, setRecentOrders] = useState<{ _id: string; orderId: string; status: string; user?: { name: string } }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/staff/dashboard-stats');
      if (res.data.status === 'success') {
        const d = res.data.data;
        setStats({
          assignedOrders: d.assignedOrders || 0,
          cleaningInProgress: d.cleaningInProgress || 0,
          completedToday: d.completedToday || 0,
          totalCompleted: d.totalCompleted || 0,
        });
        setRecentOrders(d.recentOrders || []);
      }
    } catch {
      // Fallback to general stats
      try {
        const res = await api.get('/orders/dashboard-stats');
        if (res.data.status === 'success') {
          const d = res.data.data;
          setStats({
            assignedOrders: d.activeOrders || 0,
            cleaningInProgress: 0,
            completedToday: 0,
            totalCompleted: d.completedOrders || 0,
          });
        }
      } catch { /* */ }
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'at_warehouse': return 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400';
      case 'in_process': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'cleaned': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <StaffLayout>
      <div className="space-y-6">
        <div className="bg-linear-to-r from-[#1a5276] to-[#2e86c1] rounded-2xl p-6 sm:p-8 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">{getGreeting()}, {user?.name || 'Staff'}! 🧹</h1>
              <p className="text-blue-100 mt-1 text-sm">Here&apos;s your cleaning work overview</p>
            </div>
            <button onClick={fetchData} className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
              <FiRefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><FiLoader className="w-8 h-8 text-[#2e86c1] animate-spin" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"><FiShoppingBag className="w-6 h-6 text-blue-600" /></div>
                  <div><p className="text-sm text-gray-500 dark:text-gray-400">Assigned</p><h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.assignedOrders}</h3></div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center"><FiClock className="w-6 h-6 text-orange-600" /></div>
                  <div><p className="text-sm text-gray-500 dark:text-gray-400">Cleaning</p><h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.cleaningInProgress}</h3></div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center"><FiCheckCircle className="w-6 h-6 text-green-600" /></div>
                  <div><p className="text-sm text-gray-500 dark:text-gray-400">Today Done</p><h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completedToday}</h3></div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center"><FiPackage className="w-6 h-6 text-purple-600" /></div>
                  <div><p className="text-sm text-gray-500 dark:text-gray-400">Total Done</p><h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCompleted}</h3></div>
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Your Orders</h2>
                <Link href="/staff/orders" className="text-sm text-[#2e86c1] hover:underline">View All</Link>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {recentOrders.length === 0 ? (
                  <div className="p-8 text-center">
                    <FiPackage className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No orders assigned yet</p>
                    <p className="text-xs text-gray-400 mt-1">Admin will assign cleaning orders to you</p>
                  </div>
                ) : (
                  recentOrders.slice(0, 5).map((order) => (
                    <div key={order._id} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{order.orderId}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{order.user?.name || 'Customer'}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </StaffLayout>
  );
};

export default StaffDashboardPage;
