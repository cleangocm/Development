'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  FiShoppingBag, 
  FiUsers, 
  FiDollarSign, 
  FiTruck, 
  FiTrendingUp, 
  FiTrendingDown,
  FiPackage,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiMoreVertical,
  FiEye,
  FiLoader
} from 'react-icons/fi';
import Link from 'next/link';
import api from '@/services/api';
import { useTheme } from '@/context/ThemeContext';

// Stats Card Component
const StatCard = ({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon, 
  color 
}: {
  title: string;
  value: string;
  change: string;
  changeType: 'up' | 'down';
  icon: React.ElementType;
  color: string;
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1 truncate">{value}</h3>
        {change ? (
          <div className={`flex items-center gap-1 mt-2 text-sm ${changeType === 'up' ? 'text-green-500' : 'text-red-500'}`}>
            {changeType === 'up' ? <FiTrendingUp className="w-4 h-4" /> : <FiTrendingDown className="w-4 h-4" />}
            <span>{change} from last month</span>
          </div>
        ) : (
          <div className="mt-2 text-sm text-transparent select-none">&nbsp;</div>
        )}
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

// Order Status Badge
const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig: Record<string, { bg: string; text: string }> = {
    pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400' },
    confirmed: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
    picked_up: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400' },
    in_process: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400' },
    ready: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-400' },
    out_for_delivery: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-400' },
    delivered: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },
    cancelled: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${config.bg} ${config.text}`}>
      {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
    </span>
  );
};

interface DashboardData {
  totalOrders: number;
  todaysOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalDeliveryBoys?: number;
  totalStaff?: number;
  totalCustomers?: number;
  recentOrders: Array<{
    _id: string;
    orderId: string;
    itemsSummary: string;
    totalPayment: number;
    status: string;
    createdAt: string;
    user?: { name: string; email: string };
  }>;
}

const AdminDashboard = () => {
  const { formatPrice } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/dashboard-stats');
      if (res.data.status === 'success') {
        setData(res.data.data);
      }
    } catch (err) {

    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const formatDate = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hour${Math.floor(diff / 3600000) > 1 ? 's' : ''} ago`;
    return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };

  const stats = data ? [
    { title: 'Total Orders', value: (data.totalOrders ?? 0).toLocaleString(), change: '', changeType: 'up' as const, icon: FiShoppingBag, color: 'bg-blue-500' },
    { title: "Today's Orders", value: (data.todaysOrders ?? 0).toLocaleString(), change: '', changeType: 'up' as const, icon: FiPackage, color: 'bg-purple-500' },
    { title: 'Total Revenue', value: formatPrice(data.totalRevenue ?? 0), change: '', changeType: 'up' as const, icon: FiDollarSign, color: 'bg-green-500' },
    { title: 'Pending Orders', value: (data.pendingOrders ?? 0).toLocaleString(), change: '', changeType: 'up' as const, icon: FiClock, color: 'bg-orange-500' },
  ] : [];

  const teamStats = data ? [
    { label: 'Customers', count: data.totalCustomers || 0, icon: FiUsers, color: 'text-blue-500' },
    { label: 'Delivery Boys', count: data.totalDeliveryBoys || 0, icon: FiTruck, color: 'text-indigo-500' },
    { label: 'Staff', count: data.totalStaff || 0, icon: FiPackage, color: 'text-teal-500' },
  ] : [];

  const orderStats = data ? [
    { label: 'Pending', count: data.pendingOrders ?? 0, icon: FiClock, color: 'text-yellow-500' },
    { label: 'Completed', count: data.completedOrders ?? 0, icon: FiCheckCircle, color: 'text-green-500' },
    { label: 'Cancelled', count: data.cancelledOrders ?? 0, icon: FiXCircle, color: 'text-red-500' },
    { label: 'In Delivery', count: (data.totalOrders ?? 0) - (data.completedOrders ?? 0) - (data.cancelledOrders ?? 0) - (data.pendingOrders ?? 0), icon: FiTruck, color: 'text-blue-500' },
  ] : [];

  return (
    <AdminLayout>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back! Here&apos;s what&apos;s happening today.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <FiLoader className="w-8 h-8 text-[#00BFA6] animate-spin" />
        </div>
      ) : (
      <>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {teamStats.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.count}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Order Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {orderStats.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.count}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders - Takes 2 columns */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-4 lg:p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Orders</h2>
            <Link href="/admin/orders" className="text-sm text-[#00BFA6] hover:underline">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Order ID</th>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Customer</th>
                  <th className="hidden md:table-cell px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Items</th>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Amount</th>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {(data?.recentOrders || []).map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900 dark:text-white text-sm">{order.orderId}</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 md:hidden truncate max-w-[120px]">{order.itemsSummary}</p>
                    </td>
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-700 dark:text-gray-300 text-sm truncate block max-w-[100px]">{order.user?.name || 'N/A'}</span>
                    </td>
                    <td className="hidden md:table-cell px-3 lg:px-6 py-4">
                      <span className="text-gray-600 dark:text-gray-400 text-sm truncate block max-w-[180px]">{order.itemsSummary}</span>
                    </td>
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900 dark:text-white text-sm">{formatPrice(order.totalPayment ?? 0)}</span>
                    </td>
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                      <Link 
                        href={`/admin/orders/${order._id}`}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors inline-flex"
                      >
                        <FiEye className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Bookings (shows last 3 recent orders) */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-4 lg:p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Bookings</h2>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <FiMoreVertical className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <div className="p-4 lg:p-6 space-y-4">
            {(data?.recentOrders || []).slice(0, 3).map((order) => (
              <div key={order._id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-[#00BFA6]/10 flex items-center justify-center shrink-0">
                  <FiPackage className="w-5 h-5 text-[#00BFA6]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-gray-900 dark:text-white truncate text-sm">{order.user?.name || 'N/A'}</p>
                    <div className="shrink-0">
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">{order.itemsSummary}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{formatDate(order.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Chart Section */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Revenue Overview</h2>
          <div className="flex gap-2">
            {['week', 'month', 'year'].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-[#0F2744] dark:bg-[#00BFA6] text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        {/* Simple Chart Placeholder */}
        <div className="h-64 flex items-end justify-around gap-2 px-4">
          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, index) => {
            const heights = [60, 80, 45, 90, 75, 95];
            return (
              <div key={month} className="flex flex-col items-center gap-2 flex-1">
                <div 
                  className="w-full max-w-12 bg-linear-to-t from-[#00BFA6] to-[#00BFA6]/60 rounded-t-lg transition-all duration-300 hover:from-[#0F2744] hover:to-[#0F2744]/60"
                  style={{ height: `${heights[index]}%` }}
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">{month}</span>
              </div>
            );
          })}
        </div>
      </div>
      </>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
