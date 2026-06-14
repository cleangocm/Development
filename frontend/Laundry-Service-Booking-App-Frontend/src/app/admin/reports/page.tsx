'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  FiDownload,
  FiTrendingUp,
  FiDollarSign,
  FiShoppingBag,
  FiUsers,
  FiPackage,
  FiLoader
} from 'react-icons/fi';
import { useTheme } from '@/context/ThemeContext';
import api from '@/services/api';

interface RevenueData {
  total: number;
  totalOrders: number;
  avgOrderValue: number;
}

interface ServiceRevenue {
  _id: string;
  totalRevenue: number;
  orderCount: number;
}

interface TopCustomer {
  _id: string;
  name: string;
  email: string;
  totalSpent: number;
  orderCount: number;
  avgOrder: number;
}

interface StatusBreakdown {
  _id: string;
  count: number;
}

const AdminReportsPage = () => {
  const { formatPrice } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [activeReport, setActiveReport] = useState('revenue');
  const [loading, setLoading] = useState(true);
  const [revenue, setRevenue] = useState<RevenueData>({ total: 0, totalOrders: 0, avgOrderValue: 0 });
  const [serviceRevenue, setServiceRevenue] = useState<ServiceRevenue[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [newCustomers, setNewCustomers] = useState(0);
  const [statusBreakdown, setStatusBreakdown] = useState<StatusBreakdown[]>([]);

  const reportTabs = [
    { id: 'revenue', label: 'Revenue', icon: FiDollarSign },
    { id: 'orders', label: 'Orders', icon: FiShoppingBag },
    { id: 'services', label: 'Services', icon: FiPackage },
    { id: 'customers', label: 'Customers', icon: FiUsers },
  ];

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/reports', { params: { period: selectedPeriod } });
      if (res.data?.status === 'success') {
        const d = res.data.data || res.data;
        const rev = d.revenue || {};
        setRevenue({
          total: rev.total ?? rev.totalRevenue ?? 0,
          totalOrders: rev.totalOrders ?? rev.orders ?? rev.count ?? 0,
          avgOrderValue: rev.avgOrderValue ?? rev.avgOrder ?? 0,
        });
        // Normalize service revenue fields (backend may use different names)
        const rawServiceRevenue = d.serviceRevenue || d.revenueByService || d.services || [];
        setServiceRevenue(rawServiceRevenue.map((s: Record<string, unknown>) => ({
          _id: (s._id || s.serviceName || s.name || s.service || 'Unknown') as string,
          totalRevenue: Number(s.totalRevenue ?? s.revenue ?? s.total ?? s.amount ?? 0),
          orderCount: Number(s.orderCount ?? s.count ?? s.orders ?? 0),
        })));
        // Normalize top customers fields
        const rawTopCustomers = d.topCustomers || [];
        setTopCustomers(rawTopCustomers.map((c: Record<string, unknown>) => ({
          _id: (c._id || '') as string,
          name: (c.name || c.userName || 'Unknown') as string,
          email: (c.email || '') as string,
          totalSpent: Number(c.totalSpent ?? c.total ?? c.revenue ?? 0),
          orderCount: Number(c.orderCount ?? c.count ?? c.orders ?? 0),
          avgOrder: Number(c.avgOrder ?? c.avgOrderValue ?? 0),
        })));
        setNewCustomers(d.newCustomers ?? 0);
        setStatusBreakdown(d.statusBreakdown || d.ordersByStatus || []);
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  // Calculate max revenue for service bars
  const maxServiceRevenue = Math.max(...serviceRevenue.map(s => s.totalRevenue ?? 0), 1);

  // Calculate service percentage for breakdown bars
  const totalServiceRevenue = serviceRevenue.reduce((acc, s) => acc + (s.totalRevenue ?? 0), 0) || 1;

  return (
    <AdminLayout>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Track your business performance</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#0F2744] dark:bg-[#00BFA6] text-white rounded-lg hover:bg-[#1a3a5c] dark:hover:bg-[#00A892] transition-colors">
          <FiDownload className="w-4 h-4" />
          <span>Export</span>
        </button>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {['week', 'month', 'year'].map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize whitespace-nowrap ${
              selectedPeriod === period
                ? 'bg-[#0F2744] dark:bg-[#00BFA6] text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            This {period}
          </button>
        ))}
      </div>

      {/* Report Type Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6">
        <div className="flex gap-2 overflow-x-auto">
          {reportTabs.map((report) => (
            <button
              key={report.id}
              onClick={() => setActiveReport(report.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeReport === report.id
                  ? 'bg-[#00BFA6]/10 text-[#00BFA6]'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <report.icon className="w-4 h-4" />
              {report.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <FiLoader className="w-8 h-8 text-[#00BFA6] animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">Total Revenue</span>
                <span className="flex items-center gap-1 text-xs text-green-500 shrink-0">
                  <FiTrendingUp className="w-3 h-3" />
                </span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">{formatPrice(revenue.total ?? 0)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">Total Orders</span>
                <span className="flex items-center gap-1 text-xs text-green-500 shrink-0">
                  <FiTrendingUp className="w-3 h-3" />
                </span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">{(revenue.totalOrders ?? 0).toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">Avg. Order</span>
                <span className="flex items-center gap-1 text-xs text-green-500 shrink-0">
                  <FiTrendingUp className="w-3 h-3" />
                </span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">{formatPrice(revenue.avgOrderValue ?? 0)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">New Customers</span>
                <FiUsers className="w-4 h-4 text-blue-500 shrink-0" />
              </div>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">{(newCustomers ?? 0).toLocaleString()}</p>
            </div>
          </div>

          {/* Charts and Tables */}
          {activeReport === 'revenue' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Bar Chart from Services */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue by Service</h3>
              
              {serviceRevenue.length === 0 ? (
                <div className="flex items-center justify-center h-48">
                  <p className="text-gray-400">No service data available</p>
                </div>
              ) : (
                <div className="flex gap-2 items-end overflow-x-auto pb-1">
                  {serviceRevenue.slice(0, 6).map((service) => {
                    const BAR_MAX_PX = 120;
                    const barH = Math.max(Math.round(((service.totalRevenue ?? 0) / maxServiceRevenue) * BAR_MAX_PX), 6);
                    // Shorten: take text before " - " or first 18 chars
                    const shortName = service._id.includes(' - ')
                      ? service._id.split(' - ')[0].trim()
                      : service._id.length > 18 ? service._id.slice(0, 16) + '…' : service._id;
                    return (
                      <div key={service._id} className="flex flex-col items-center gap-1 flex-1 min-w-[52px]">
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">{formatPrice(service.totalRevenue ?? 0)}</span>
                        <div
                          className="w-full rounded-t-md bg-gradient-to-t from-[#00BFA6] to-[#00BFA6]/50 hover:from-[#0F2744] hover:to-[#0F2744]/60 transition-colors duration-300"
                          style={{ height: `${barH}px` }}
                        />
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 text-center leading-tight w-full px-0.5 line-clamp-2" title={service._id}>{shortName}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Revenue Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Service Revenue Breakdown</h3>
              
              {serviceRevenue.length === 0 ? (
                <p className="text-gray-400 text-center py-10">No data available</p>
              ) : (
                <div className="space-y-4">
                  {serviceRevenue.map((service) => {
                    const pct = Math.round(((service.totalRevenue ?? 0) / totalServiceRevenue) * 100);
                    const shortName = service._id.includes(' - ')
                      ? service._id.split(' - ')[0].trim()
                      : service._id;
                    return (
                      <div key={service._id}>
                        <div className="flex items-center justify-between mb-1 gap-2">
                          <span className="text-sm text-gray-700 dark:text-gray-300 truncate min-w-0" title={service._id}>{shortName}</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap shrink-0">{formatPrice(service.totalRevenue ?? 0)} ({pct}%)</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#00BFA6] rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Order Status Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-4 lg:p-6 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Order Status Breakdown</h3>
              </div>
              {statusBreakdown.length === 0 ? (
                <p className="text-gray-400 text-center py-10">No data available</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap">Count</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap">Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {statusBreakdown.map((item) => {
                        const totalCount = statusBreakdown.reduce((a, b) => a + (b.count ?? 0), 0) || 1;
                        const share = Math.round(((item.count ?? 0) / totalCount) * 100);
                        return (
                          <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white capitalize">{item._id}</td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{(item.count ?? 0).toLocaleString()}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <div className="h-full bg-[#00BFA6] rounded-full" style={{ width: `${share}%` }} />
                                </div>
                                <span className="text-sm text-gray-600 dark:text-gray-400">{share}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Top Customers */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-4 lg:p-6 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Customers</h3>
              </div>
              {topCustomers.length === 0 ? (
                <p className="text-gray-400 text-center py-10">No customer data available</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[450px]">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap">Customer</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap">Orders</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap">Total Spent</th>
                        <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap">Avg Order</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {topCustomers.map((customer) => (
                        <tr key={customer._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white truncate max-w-[150px]">{customer.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">{customer.email}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{(customer.orderCount ?? 0).toLocaleString()}</td>
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{formatPrice(customer.totalSpent ?? 0)}</td>
                          <td className="hidden md:table-cell px-4 py-3 text-gray-600 dark:text-gray-400">{formatPrice(customer.avgOrder ?? 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          )}

          {activeReport === 'orders' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Status Breakdown</h3>
            {statusBreakdown.length === 0 ? (
              <p className="text-gray-400 text-center py-10">No order data available</p>
            ) : (
              <div className="space-y-3">
                {statusBreakdown.map((item) => (
                  <div key={item._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-300">{item._id.replace(/_/g, ' ').toUpperCase()}</span>
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          )}

          {activeReport === 'services' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Service Performance</h3>
            {serviceRevenue.length === 0 ? (
              <p className="text-gray-400 text-center py-10">No service data available</p>
            ) : (
              <div className="space-y-4">
                {serviceRevenue.map((service) => (
                  <div key={service._id} className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <span className="font-medium text-gray-900 dark:text-white text-sm min-w-0 truncate" title={service._id}>
                        {service._id.includes(' - ') ? service._id.split(' - ')[0].trim() : service._id}
                      </span>
                      <span className="text-lg font-semibold text-[#00BFA6] shrink-0">{formatPrice(service.totalRevenue ?? 0)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{service.orderCount} orders</span>
                      <span>Avg: {formatPrice((service.totalRevenue ?? 0) / (service.orderCount || 1))}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          )}

          {activeReport === 'customers' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Customers</h3>
            {topCustomers.length === 0 ? (
              <p className="text-gray-400 text-center py-10">No customer data available</p>
            ) : (
              <div className="space-y-3">
                {topCustomers.map((customer) => (
                  <div key={customer._id} className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{customer.name}</p>
                        <p className="text-xs text-gray-500">{customer.email}</p>
                      </div>
                      <span className="text-lg font-semibold text-[#00BFA6]">{formatPrice(customer.totalSpent ?? 0)}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{customer.orderCount} orders</span>
                      <span>Avg: {formatPrice(customer.avgOrder ?? 0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          )}
        </>
      )}
    </AdminLayout>
  );
};

export default AdminReportsPage;
