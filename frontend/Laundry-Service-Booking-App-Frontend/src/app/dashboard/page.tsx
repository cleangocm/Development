'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuthStore } from '@/store/authStore';
import { listCustomerPayments, listCustomerPickups, listCustomerSubscriptions } from '@/services/cleangoRepository';
import { CLEAN_GO_SUBSCRIPTION_PLANS, formatXaf } from '@/data/cleangoPlans';
import { useTheme } from '@/context/ThemeContext';
import {
  FiPackage,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiPlus,
  FiTruck,
  FiList,
  FiArrowRight,
  FiCalendar,
  FiBell,
  FiCreditCard,
  FiRefreshCw,
  FiLoader,
  FiMapPin,
  FiMessageSquare,
} from 'react-icons/fi';

// Types
interface OrderStats {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  cancelledOrders: number;
}

interface LatestOrder {
  _id: string;
  orderId: string;
  itemsSummary: string;
  status: string;
  orderDate: string;
  deliveryDate: string;
  totalPayment: number;
}

// Stat Card Component
const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgColor}`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
      </div>
    </div>
  </div>
);

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed':
    case 'picked_up':
    case 'in_process':
    case 'ready':
    case 'out_for_delivery':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'delivered':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'cancelled':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  }
};

const formatStatus = (status: string) => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

const DashboardPage = () => {
  const { user } = useAuthStore();
  const { formatPrice } = useTheme();
  const [stats, setStats] = useState<OrderStats>({ totalOrders: 0, activeOrders: 0, completedOrders: 0, cancelledOrders: 0 });
  const [latestOrders, setLatestOrders] = useState<LatestOrder[]>([]);
  const [activePlanName, setActivePlanName] = useState('No active plan yet');
  const [renewalDate, setRenewalDate] = useState('Pending subscription');
  const [remainingPickups, setRemainingPickups] = useState('Subscribe to activate');
  const [pendingPayments, setPendingPayments] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      if (!user) return;
      const [pickups, subscriptions, payments] = await Promise.all([
        listCustomerPickups(user.id, 50),
        listCustomerSubscriptions(user.id),
        listCustomerPayments(user.id),
      ]);
      const activeSubscription = subscriptions.find((subscription) => subscription.status === 'active')
        || subscriptions.find((subscription) => subscription.status === 'pending');
      const fallbackPlan = activeSubscription
        ? CLEAN_GO_SUBSCRIPTION_PLANS.find((plan) => plan.id === activeSubscription.planId)
        : null;
      const subscriptionStart = activeSubscription?.startDate?.toDate?.();
      setStats({
        totalOrders: pickups.length,
        activeOrders: pickups.filter((pickup) => !['completed', 'cancelled'].includes(pickup.status)).length,
        completedOrders: pickups.filter((pickup) => pickup.status === 'completed').length,
        cancelledOrders: pickups.filter((pickup) => pickup.status === 'cancelled').length,
      });
      setActivePlanName(activeSubscription ? (fallbackPlan?.name || activeSubscription.planId) : 'No active plan yet');
      setRenewalDate(subscriptionStart
        ? new Date(subscriptionStart.getTime() + 30 * 86400000).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'Pending subscription');
      setRemainingPickups(fallbackPlan
        ? `${Math.max(fallbackPlan.pickupsPerMonth - pickups.filter((pickup) => pickup.status === 'completed').length, 0)} of ${fallbackPlan.pickupsPerMonth}`
        : 'Subscribe to activate');
      setPendingPayments(payments.filter((payment) => payment.status === 'pending').length);
      setLatestOrders(pickups.slice(0, 5).map((pickup) => ({
        _id: pickup.id,
        orderId: pickup.id,
        itemsSummary: pickup.notes || 'CleanGo waste collection pickup',
        status: pickup.status,
        orderDate: typeof pickup.scheduledDate === 'string'
          ? pickup.scheduledDate
          : pickup.scheduledDate.toDate().toISOString(),
        deliveryDate: pickup.updatedAt?.toDate().toISOString()
          || (typeof pickup.scheduledDate === 'string'
            ? pickup.scheduledDate
            : pickup.scheduledDate.toDate().toISOString()),
        totalPayment: 0,
      })));
      setError('');
    } catch {
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const greeting = getGreeting();
  const customerDashboardCards = [
    {
      title: 'My Subscription Plan',
      href: '/dashboard/book-pickup',
      icon: FiTruck,
      detail: activePlanName,
      meta: `Renewal: ${renewalDate} | Remaining pickups: ${remainingPickups}`,
      color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
    },
    {
      title: 'Request One-Off Pickup',
      href: '/dashboard/one-off-pickup',
      icon: FiPlus,
      detail: 'Small, medium, or large pickup',
      meta: `From ${formatXaf(5000)} with online or manual payment`,
      color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
    },
    {
      title: 'Payments',
      href: '/dashboard/payment-account',
      icon: FiCreditCard,
      detail: `${pendingPayments} pending payment${pendingPayments === 1 ? '' : 's'}`,
      meta: 'Invoices, payment history, transaction IDs',
      color: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
    },
    {
      title: 'My Address',
      href: '/dashboard/profile',
      icon: FiMapPin,
      detail: user?.address || 'Add pickup location',
      meta: 'Modify address and use GPS support',
      color: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
    },
    {
      title: 'Support',
      href: '/dashboard/support',
      icon: FiMessageSquare,
      detail: 'Contact CleanGo support',
      meta: 'Report missed pickup or ask for help',
      color: 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300',
    },
    {
      title: 'Notifications',
      href: '/notifications',
      icon: FiBell,
      detail: 'Upcoming pickups and reminders',
      meta: 'Payment reminders and service updates',
      color: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-300',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={fetchDashboardData} className="text-red-600 dark:text-red-400 hover:underline font-medium">Retry</button>
          </div>
        )}

        {/* Welcome Section */}
        <div className="bg-linear-to-r from-[#0F2744] to-[#00BFA6] rounded-2xl p-6 sm:p-8 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">
                {greeting}, {user?.name || 'User'}!
              </h1>
              <p className="text-blue-100 mt-1 text-sm sm:text-base">
                Here&apos;s an overview of your CleanGo pickups
              </p>
            </div>
            <Link
              href="/dashboard/book-pickup"
              className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 text-[#0F2744] dark:text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors shadow"
            >
              <FiPlus className="w-4 h-4" />
              Schedule Pickup
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <FiLoader className="w-8 h-8 text-[#00BFA6] animate-spin" />
          </div>
        ) : (
          <>
            {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Pickups"
            value={stats.totalOrders}
            icon={FiPackage}
            color="text-blue-600"
            bgColor="bg-blue-100 dark:bg-blue-900/30"
          />
          <StatCard
            title="Scheduled / Active"
            value={stats.activeOrders}
            icon={FiClock}
            color="text-orange-600"
            bgColor="bg-orange-100 dark:bg-orange-900/30"
          />
          <StatCard
            title="Completed"
            value={stats.completedOrders}
            icon={FiCheckCircle}
            color="text-green-600"
            bgColor="bg-green-100 dark:bg-green-900/30"
          />
          <StatCard
            title="Cancelled"
            value={stats.cancelledOrders}
            icon={FiXCircle}
            color="text-red-600"
            bgColor="bg-red-100 dark:bg-red-900/30"
          />
        </div>

        {/* Customer Dashboard */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Customer Dashboard</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage your plan, pickups, payments, address, support, and alerts.</p>
            </div>
            <Link href="/subscription-plans" className="text-sm font-semibold text-[#00BFA6] hover:underline">
              View public plans
            </Link>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {customerDashboardCards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="group rounded-2xl border border-gray-100 p-4 transition hover:-translate-y-0.5 hover:border-[#00BFA6]/40 hover:shadow-md dark:border-gray-700"
              >
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${card.color}`}>
                    <card.icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-950 dark:text-white">{card.title}</h3>
                    <p className="mt-1 truncate text-sm font-semibold text-gray-700 dark:text-gray-200">{card.detail}</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{card.meta}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              href="/dashboard/book-pickup"
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FiPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-400 text-center">New Booking</span>
            </Link>
            <Link
              href="/dashboard/orders"
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FiTruck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-purple-700 dark:text-purple-400 text-center">Track Pickup</span>
            </Link>
            <Link
              href="/dashboard/orders"
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FiList className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-400 text-center">Pickup History</span>
            </Link>
            <Link
              href="/dashboard/orders"
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FiRefreshCw className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-orange-700 dark:text-orange-400 text-center">Re-order</span>
            </Link>
          </div>
        </div>

        {/* Latest Pickups */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Latest Pickups</h2>
            <Link
              href="/dashboard/orders"
              className="text-sm text-[#00BFA6] hover:underline flex items-center gap-1"
            >
              View all <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {latestOrders.length === 0 ? (
            <div className="p-12 text-center">
              <FiPackage className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No orders yet</p>
              <Link
                href="/dashboard/book-pickup"
                className="inline-flex items-center gap-2 mt-4 text-[#00BFA6] hover:underline"
              >
                <FiPlus className="w-4 h-4" /> Place your first order
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {latestOrders.map((order) => (
                <Link
                  key={order._id}
                  href={`/dashboard/orders/${order._id}`}
                  className="block p-4 sm:p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {order.orderId}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {formatStatus(order.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {order.itemsSummary}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 dark:text-gray-500">
                        <span className="flex items-center gap-1">
                          <FiCalendar className="w-3 h-3" /> {new Date(order.orderDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiTruck className="w-3 h-3" /> Est. {new Date(order.deliveryDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                        {formatPrice(order.totalPayment)}
                      </span>
                      <FiArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
