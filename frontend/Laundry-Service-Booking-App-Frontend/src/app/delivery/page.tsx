'use client';

import { useState, useEffect } from 'react';
import DeliveryLayout from '@/components/delivery/DeliveryLayout';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import { FiPackage, FiTruck, FiCheckCircle, FiClock, FiLoader, FiMapPin, FiDollarSign, FiPhone, FiArrowRight } from 'react-icons/fi';
import { useTheme } from '@/context/ThemeContext';
import Link from 'next/link';

interface TodayOrder {
  _id: string;
  orderId: string;
  status: string;
  user?: { name: string; phone?: string; address?: string };
  totalPayment: number;
  pickupCharge?: number;
  deliveryCharge?: number;
}

const DeliveryDashboardPage = () => {
  const { formatPrice } = useTheme();
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ assigned: 0, pickedUp: 0, inTransit: 0, completed: 0 });
  const [earnings, setEarnings] = useState({ totalEarnings: 0, pendingEarnings: 0 });
  const [todayOrders, setTodayOrders] = useState<TodayOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/delivery/dashboard-stats');
        if (res.data.status === 'success') {
          const d = res.data.data;
          setStats({
            assigned: d.assigned || 0,
            pickedUp: d.pickedUp || 0,
            inTransit: d.inTransit || 0,
            completed: d.completed || 0,
          });
          setEarnings({
            totalEarnings: d.totalEarnings || 0,
            pendingEarnings: d.pendingEarnings || 0,
          });
          setTodayOrders(d.todayOrders || []);
        }
      } catch {
        try {
          const res = await api.get('/orders/dashboard-stats');
          if (res.data.status === 'success') {
            const d = res.data.data;
            setStats({ assigned: d.activeOrders || 0, pickedUp: 0, inTransit: 0, completed: d.completedOrders || 0 });
          }
        } catch { /* */ }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getStatusConfig = (status: string) => {
    const map: Record<string, { label: string; bg: string; text: string; icon: string }> = {
      pickup_assigned: { label: 'Pickup', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', icon: '📦' },
      picked_up: { label: 'Picked Up', bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', icon: '✅' },
      delivery_assigned: { label: 'Delivery', bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-400', icon: '📋' },
      out_for_delivery: { label: 'In Transit', bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', icon: '🚚' },
    };
    return map[status] || { label: status, bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-400', icon: '📌' };
  };

  return (
    <DeliveryLayout>
      <div className="space-y-6">
        {/* Greeting Banner */}
        <div className="bg-linear-to-r from-[#0e6251] to-[#148f77] rounded-2xl p-6 sm:p-8 text-white shadow-lg">
          <h1 className="text-xl sm:text-2xl font-bold">{getGreeting()}, {user?.name || 'Delivery Partner'}! 🚚</h1>
          <p className="text-green-100 mt-1 text-sm">Here&apos;s your delivery overview for today</p>
          <div className="flex gap-3 mt-4">
            <Link href="/delivery/pickup" className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors">View Pickups</Link>
            <Link href="/delivery/route" className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors">Order Info</Link>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><FiLoader className="w-8 h-8 text-[#148f77] animate-spin" /></div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/delivery/assigned" className="group bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"><FiPackage className="w-6 h-6 text-blue-600" /></div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Assigned</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.assigned}</h3>
                  </div>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">View all <FiArrowRight className="w-3 h-3" /></p>
              </Link>
              <Link href="/delivery/pickup" className="group bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:border-yellow-300 dark:hover:border-yellow-700 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center"><FiClock className="w-6 h-6 text-yellow-600" /></div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Picked Up</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pickedUp}</h3>
                  </div>
                </div>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">View all <FiArrowRight className="w-3 h-3" /></p>
              </Link>
              <Link href="/delivery/in-transit" className="group bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center"><FiTruck className="w-6 h-6 text-purple-600" /></div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">In Transit</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.inTransit}</h3>
                  </div>
                </div>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">View all <FiArrowRight className="w-3 h-3" /></p>
              </Link>
              <Link href="/delivery/completed" className="group bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center"><FiCheckCircle className="w-6 h-6 text-green-600" /></div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completed}</h3>
                  </div>
                </div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">View all <FiArrowRight className="w-3 h-3" /></p>
              </Link>
            </div>

            {/* Earnings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"><FiDollarSign className="w-6 h-6 text-emerald-600" /></div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Earnings</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{formatPrice(earnings.totalEarnings)}</h3>
                  </div>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Accumulated from all completed deliveries</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center"><FiDollarSign className="w-6 h-6 text-amber-600" /></div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Pending Earnings</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{formatPrice(earnings.pendingEarnings)}</h3>
                  </div>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Will be settled by admin after delivery</p>
              </div>
            </div>

            {/* Today's Orders - Improved Cards */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Today&apos;s Orders</h2>
                <Link href="/delivery/assigned" className="text-sm text-[#148f77] hover:underline flex items-center gap-1">View All <FiArrowRight className="w-3.5 h-3.5" /></Link>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {todayOrders.length === 0 ? (
                  <div className="p-8 text-center">
                    <FiTruck className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No deliveries assigned for today</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">New deliveries will appear here when admin assigns them</p>
                  </div>
                ) : (
                  todayOrders.slice(0, 5).map((order) => {
                    const sc = getStatusConfig(order.status);
                    const charge = order.pickupCharge || order.deliveryCharge || 0;
                    return (
                      <div key={order._id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-[#148f77]/10 flex items-center justify-center shrink-0 text-lg">
                            {sc.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-bold text-sm text-gray-900 dark:text-white">{order.orderId}</h3>
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>{sc.label}</span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{order.user?.name || 'Customer'}</p>
                            {order.user?.address && (
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1 truncate">
                                <FiMapPin className="w-3 h-3 shrink-0" /> {order.user.address}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                              {charge > 0 && (
                                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                  <FiDollarSign className="w-3 h-3" /> {formatPrice(charge)}
                                </span>
                              )}
                              {order.user?.phone && (
                                <a href={`tel:${order.user.phone}`} className="text-xs text-[#148f77] hover:underline flex items-center gap-1">
                                  <FiPhone className="w-3 h-3" /> Call
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DeliveryLayout>
  );
};

export default DeliveryDashboardPage;
