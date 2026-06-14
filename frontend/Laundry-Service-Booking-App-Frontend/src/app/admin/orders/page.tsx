'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { filterNumberInput } from '@/lib/inputValidation';
import { 
  FiSearch, 
  FiFilter, 
  FiDownload, 
  FiEye, 
  FiMoreVertical,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiLoader,
  FiTruck,
  FiUser,
  FiUserCheck,
  FiMapPin,
  FiDollarSign,
  FiPhone
} from 'react-icons/fi';
import Link from 'next/link';
import api from '@/services/api';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { generateInvoicePDF } from '@/services/invoicePdf';

interface Order {
  _id: string;
  orderId: string;
  itemsSummary: string;
  itemCount: number;
  totalPayment: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  deliveryDate: string;
  pickupCharge?: number;
  deliveryCharge?: number;
  user?: { _id: string; name: string; email: string; phone?: string };
  pickupDeliveryBoy?: { _id: string; name: string; phone?: string };
  assignedStaff?: { _id: string; name: string };
  deliveryBoy?: { _id: string; name: string; phone?: string };
}

interface DeliveryBoy {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  isAvailable: boolean;
  distance?: number;
  pendingEarnings?: number;
  totalEarnings?: number;
}

interface CsvDownload {
  url: string;
  filename: string;
}

interface StaffMember {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

// Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig: Record<string, { bg: string; text: string }> = {
    pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400' },
    confirmed: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
    pickup_assigned: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-400' },
    picked_up: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400' },
    at_warehouse: { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-400' },
    in_process: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400' },
    cleaned: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
    ready: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-400' },
    delivery_assigned: { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-400' },
    out_for_delivery: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-400' },
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

const PaymentBadge = ({ status }: { status: string }) => {
  const s = status || 'pending';
  const configs: Record<string, { bg: string; text: string }> = {
    paid: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },
    pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400' },
    refunded: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400' },
    failed: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
  };
  const config = configs[s] || configs.pending;
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${config.bg} ${config.text}`}>
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  );
};

const AdminOrdersPage = () => {
  const { formatPrice } = useTheme();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showDateRange, setShowDateRange] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [openMenuOrderId, setOpenMenuOrderId] = useState<string | null>(null);
  const [paymentFilter, setPaymentFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');

  // Assignment modal states
  const [showAssignPickupModal, setShowAssignPickupModal] = useState(false);
  const [showAssignStaffModal, setShowAssignStaffModal] = useState(false);
  const [showAssignDeliveryModal, setShowAssignDeliveryModal] = useState(false);
  const [deliveryBoys, setDeliveryBoys] = useState<DeliveryBoy[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [selectedDeliveryBoy, setSelectedDeliveryBoy] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');
  const [pickupCharge, setPickupCharge] = useState('50');
  const [deliveryCharge, setDeliveryCharge] = useState('50');
  const [assignLoading, setAssignLoading] = useState(false);
  const [fetchingList, setFetchingList] = useState(false);

  const tabs = [
    { id: 'all', label: 'All Orders' },
    { id: 'pending', label: 'Pending' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'pickup_assigned', label: 'Pickup Assigned' },
    { id: 'at_warehouse', label: 'At Warehouse' },
    { id: 'in_process', label: 'In Process' },
    { id: 'cleaned', label: 'Cleaned' },
    { id: 'delivery_assigned', label: 'Delivery Assigned' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeTab !== 'all') params.append('status', activeTab);
      params.append('page', page.toString());
      params.append('limit', '20');
      if (searchQuery) params.append('search', searchQuery);
      if (paymentFilter) params.append('paymentStatus', paymentFilter);
      if (serviceFilter) params.append('serviceType', serviceFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const res = await api.get(`/admin/orders?${params.toString()}`);
      if (res.data.status === 'success') {
        const d = res.data.data || {};
        let fetchedOrders = d.orders || [];
        
        // Client-side filtering as fallback (in case backend doesn't filter)
        if (paymentFilter) {
          fetchedOrders = fetchedOrders.filter((order: Order) => 
            order.paymentStatus?.toLowerCase() === paymentFilter.toLowerCase()
          );
        }
        
        if (serviceFilter) {
          // Convert filter value to match service names (e.g., "wash-fold" → "wash & fold", "dry-cleaning" → "dry cleaning")
          const serviceSearchTerm = serviceFilter.replace(/-/g, ' ').replace('fold', '& fold').toLowerCase();
          fetchedOrders = fetchedOrders.filter((order: Order) => 
            order.itemsSummary?.toLowerCase().includes(serviceSearchTerm) ||
            order.itemsSummary?.toLowerCase().includes(serviceFilter.replace(/-/g, ' '))
          );
        }
        
        // Date range filtering
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          fetchedOrders = fetchedOrders.filter((order: Order) => 
            new Date(order.createdAt) >= start
          );
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          fetchedOrders = fetchedOrders.filter((order: Order) => 
            new Date(order.createdAt) <= end
          );
        }
        
        setOrders(fetchedOrders);
        setTotalPages(d.totalPages || 1);
        setTotal(fetchedOrders.length);
      }
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, searchQuery, paymentFilter, serviceFilter, startDate, endDate]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Close dropdown menu on outside click
  useEffect(() => {
    if (!openMenuOrderId) return;
    const handleClickOutside = () => setOpenMenuOrderId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuOrderId]);

  const openAssignPickup = async (order: Order) => {
    setSelectedOrder(order);
    setShowAssignPickupModal(true);
    setSelectedDeliveryBoy('');
    setPickupCharge('50');
    setFetchingList(true);
    try {
      const res = await api.get('/admin/delivery-boys');
      if (res.data.status === 'success') setDeliveryBoys(res.data.data);
    } catch { /* */ } finally { setFetchingList(false); }
  };

  const openAssignStaff = async (order: Order) => {
    setSelectedOrder(order);
    setShowAssignStaffModal(true);
    setSelectedStaff('');
    setFetchingList(true);
    try {
      const res = await api.get('/admin/staff-list');
      if (res.data.status === 'success') setStaffList(res.data.data);
    } catch { /* */ } finally { setFetchingList(false); }
  };

  const openAssignDelivery = async (order: Order) => {
    setSelectedOrder(order);
    setShowAssignDeliveryModal(true);
    setSelectedDeliveryBoy('');
    setDeliveryCharge('50');
    setFetchingList(true);
    try {
      const res = await api.get('/admin/delivery-boys');
      if (res.data.status === 'success') setDeliveryBoys(res.data.data);
    } catch { /* */ } finally { setFetchingList(false); }
  };

  const handleAssignPickup = async () => {
    if (!selectedOrder || !selectedDeliveryBoy) return;
    setAssignLoading(true);
    try {
      await api.put(`/admin/orders/${selectedOrder._id}/assign-pickup`, {
        deliveryBoyId: selectedDeliveryBoy,
        pickupCharge: Number(pickupCharge) || 0,
      });
      setShowAssignPickupModal(false);
      fetchOrders();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      showToast(error.response?.data?.message || 'Failed to assign pickup', 'error');
    } finally { setAssignLoading(false); }
  };

  const handleAssignStaff = async () => {
    if (!selectedOrder || !selectedStaff) return;
    setAssignLoading(true);
    try {
      await api.put(`/admin/orders/${selectedOrder._id}/assign-staff`, { staffId: selectedStaff });
      setShowAssignStaffModal(false);
      fetchOrders();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      showToast(error.response?.data?.message || 'Failed to assign staff', 'error');
    } finally { setAssignLoading(false); }
  };

  const handleAssignDelivery = async () => {
    if (!selectedOrder || !selectedDeliveryBoy) return;
    setAssignLoading(true);
    try {
      await api.put(`/admin/orders/${selectedOrder._id}/assign-delivery`, {
        deliveryBoyId: selectedDeliveryBoy,
        deliveryCharge: Number(deliveryCharge) || 0,
      });
      setShowAssignDeliveryModal(false);
      fetchOrders();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      showToast(error.response?.data?.message || 'Failed to assign delivery', 'error');
    } finally { setAssignLoading(false); }
  };

  const getOrderActions = (order: Order) => {
    const actions: { label: string; icon: React.ElementType; color: string; onClick: () => void }[] = [];
    switch (order.status) {
      case 'pending':
      case 'confirmed':
        actions.push({ label: 'Assign Pickup', icon: FiTruck, color: 'text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20', onClick: () => openAssignPickup(order) });
        break;
      case 'at_warehouse':
        actions.push({ label: 'Assign Staff', icon: FiUserCheck, color: 'text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20', onClick: () => openAssignStaff(order) });
        break;
      case 'cleaned':
      case 'ready':
        actions.push({ label: 'Assign Delivery', icon: FiTruck, color: 'text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20', onClick: () => openAssignDelivery(order) });
        break;
    }
    return actions;
  };

  // ── CSV Download ─────────────────────────────────────────────
  const csvAnchorRef = useRef<HTMLAnchorElement>(null);
  const [csvDownload, setCsvDownload] = useState<CsvDownload | null>(null);

  // Trigger the hidden anchor's onClick as soon as the URL is ready
  useEffect(() => {
    if (csvDownload && csvAnchorRef.current) {
      csvAnchorRef.current.click();
    }
  }, [csvDownload]);

  const handleExportCSV = () => {
    if (orders.length === 0) return;
    const headers = ['Order ID', 'Customer', 'Items', 'Status', 'Total', 'Payment', 'Date'];
    const rows = orders.map(o => [
      o.orderId,
      o.user?.name || '',
      o.itemsSummary,
      o.status.replace(/_/g, ' '),
      o.totalPayment.toFixed(2),
      o.paymentStatus || '',
      new Date(o.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    setCsvDownload({
      url,
      filename: `orders-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`,
    });
  };

  const handleCsvAnchorClick = () => {
    if (csvDownload) {
      URL.revokeObjectURL(csvDownload.url);
      setCsvDownload(null);
    }
  };

  const filteredOrders = orders;

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Order Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage orders, assign delivery boys & staff</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Hidden anchor — onClick fires via useEffect when csvDownload state is set */}
          <a
            ref={csvAnchorRef}
            href={csvDownload?.url ?? '#'}
            download={csvDownload?.filename ?? ''}
            onClick={handleCsvAnchorClick}
            className="hidden"
            aria-hidden="true"
          />
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <FiDownload className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-[#0F2744] dark:bg-[#00BFA6] text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}>{tab.label}</button>
            ))}
          </div>
        </div>
        <div className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Search by order ID, customer name..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#00BFA6] focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <FiFilter className="w-4 h-4" /><span>Filters</span>
            </button>
            <button
              onClick={() => setShowDateRange(!showDateRange)}
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-colors ${showDateRange || startDate || endDate ? 'border-[#00BFA6] bg-[#00BFA6]/10 text-[#00BFA6]' : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              <FiCalendar className="w-4 h-4" /><span className="hidden sm:inline">Date Range</span>
            </button>
          </div>
        </div>
        {showDateRange && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From Date</label>
              <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#00BFA6] focus:border-transparent outline-none" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To Date</label>
              <input type="date" value={endDate} min={startDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#00BFA6] focus:border-transparent outline-none" />
            </div>
            {(startDate || endDate) && (
              <button onClick={() => { setStartDate(''); setEndDate(''); setPage(1); }}
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-red-500 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors whitespace-nowrap">
                <FiX className="w-4 h-4" /> Clear
              </button>
            )}
          </div>
        )}
        {showFilters && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Status</label>
              <select value={paymentFilter} onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="">All</option><option value="paid">Paid</option><option value="pending">Pending</option><option value="refunded">Refunded</option><option value="failed">Failed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Service Type</label>
              <select value={serviceFilter} onChange={(e) => { setServiceFilter(e.target.value); setPage(1); }} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="">All Services</option><option value="wash-fold">Wash & Fold</option><option value="dry-cleaning">Dry Cleaning</option><option value="ironing">Ironing</option><option value="pressing">Pressing</option><option value="steam-ironing">Steam Ironing</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><FiLoader className="w-8 h-8 text-[#00BFA6] animate-spin" /></div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 lg:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Order</th>
                <th className="px-4 lg:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Customer</th>
                <th className="hidden xl:table-cell px-4 lg:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Amount</th>
                <th className="hidden sm:table-cell px-4 lg:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Payment</th>
                <th className="px-4 lg:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="hidden xl:table-cell px-4 lg:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Assigned To</th>
                <th className="px-4 lg:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredOrders.map((order) => {
                const actions = getOrderActions(order);
                return (
                <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 lg:px-6 py-4">
                    <span className="font-medium text-gray-900 dark:text-white">{order.orderId}</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="px-4 lg:px-6 py-4">
                    <span className="text-gray-900 dark:text-white font-medium block truncate max-w-[100px] sm:max-w-[150px]">{order.user?.name || 'N/A'}</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[100px] sm:max-w-[150px]">{order.user?.phone || order.user?.email || ''}</p>
                  </td>
                  <td className="hidden xl:table-cell px-4 lg:px-6 py-4">
                    <span className="font-semibold text-gray-900 dark:text-white">{formatPrice(order.totalPayment ?? 0)}</span>
                    {(order.pickupCharge || order.deliveryCharge) ? (
                      <p className="text-xs text-gray-400 mt-1">
                        {order.pickupCharge ? `P: ${formatPrice(order.pickupCharge)}` : ''}{order.pickupCharge && order.deliveryCharge ? ' | ' : ''}{order.deliveryCharge ? `D: ${formatPrice(order.deliveryCharge)}` : ''}
                      </p>
                    ) : null}
                  </td>
                  <td className="hidden sm:table-cell px-4 lg:px-6 py-4"><PaymentBadge status={order.paymentStatus} /></td>
                  <td className="px-4 lg:px-6 py-4"><StatusBadge status={order.status} /></td>
                  <td className="hidden xl:table-cell px-4 lg:px-6 py-4">
                    <div className="space-y-1 text-xs">
                      {order.pickupDeliveryBoy && <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400"><FiTruck className="w-3 h-3" /><span>Pickup: {order.pickupDeliveryBoy.name}</span></div>}
                      {order.assignedStaff && <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400"><FiUserCheck className="w-3 h-3" /><span>Staff: {order.assignedStaff.name}</span></div>}
                      {order.deliveryBoy && <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400"><FiTruck className="w-3 h-3" /><span>Delivery: {order.deliveryBoy.name}</span></div>}
                      {!order.pickupDeliveryBoy && !order.assignedStaff && !order.deliveryBoy && <span className="text-gray-400">—</span>}
                    </div>
                  </td>
                  <td className="px-4 lg:px-6 py-4">
                    <div className="flex items-center gap-1 flex-wrap">
                      <Link href={`/admin/orders/${order._id}`} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors" title="View Details">
                        <FiEye className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      </Link>
                      {actions.map((action, i) => (
                        <button key={i} onClick={action.onClick} className={`p-2 rounded-lg transition-colors ${action.color}`} title={action.label}>
                          <action.icon className="w-4 h-4" />
                        </button>
                      ))}
                      <div className="relative">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setOpenMenuOrderId(openMenuOrderId === order._id ? null : order._id); }}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors" 
                          title="More"
                        >
                          <FiMoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </button>
                        {openMenuOrderId === order._id && (
                          <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-1 z-10">
                            <button 
                              onClick={async () => {
                                setOpenMenuOrderId(null);
                                try {
                                  const res = await api.get(`/admin/orders/${order._id}`);
                                  if (res.data?.status === 'success') generateInvoicePDF(res.data.data, formatPrice);
                                } catch { generateInvoicePDF(order as unknown as Parameters<typeof generateInvoicePDF>[0], formatPrice); }
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                            >
                              Download Invoice
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
        )}

        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Showing {Math.min((page - 1) * 20 + 1, total)}-{Math.min(page * 20, total)} of {total} orders</p>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"><FiChevronLeft className="w-5 h-5" /></button>
            {(() => {
              const pages: (number | string)[] = [];
              if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
              else {
                pages.push(1);
                if (page > 3) pages.push('...');
                for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
                if (page < totalPages - 2) pages.push('...');
                pages.push(totalPages);
              }
              return pages.map((p, i) => typeof p === 'number' ? (
                <button key={i} onClick={() => setPage(p)} className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium ${page === p ? 'bg-[#0F2744] dark:bg-[#00BFA6] text-white' : 'border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>{p}</button>
              ) : <span key={i} className="px-2 text-gray-400">...</span>);
            })()}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"><FiChevronRight className="w-5 h-5" /></button>
          </div>
        </div>
      </div>

      {/* Assign Pickup Modal */}
      {showAssignPickupModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowAssignPickupModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">🚚 Assign Pickup Delivery Boy</h3>
                  <p className="text-sm text-gray-500 mt-1">Order: {selectedOrder?.orderId} — Pick up from customer</p>
                </div>
                <button onClick={() => setShowAssignPickupModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><FiX className="w-5 h-5" /></button>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"><FiDollarSign className="w-4 h-4 inline mr-1" />Pickup Charge</label>
                <input type="number" value={pickupCharge} onChange={(e) => setPickupCharge(filterNumberInput(e.target.value))}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#00BFA6] outline-none" placeholder="Enter pickup charge" />
              </div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Delivery Boy</label>
              {fetchingList ? (
                <div className="flex items-center justify-center py-8"><FiLoader className="w-6 h-6 text-[#00BFA6] animate-spin" /></div>
              ) : deliveryBoys.length === 0 ? (
                <div className="p-6 text-center bg-gray-50 dark:bg-gray-700/50 rounded-xl"><FiUser className="w-8 h-8 text-gray-300 mx-auto mb-2" /><p className="text-sm text-gray-500">No delivery boys available</p></div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {deliveryBoys.map((db) => (
                    <button key={db._id} onClick={() => setSelectedDeliveryBoy(db._id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${
                        selectedDeliveryBoy === db._id ? 'border-[#00BFA6] bg-[#00BFA6]/5 dark:bg-[#00BFA6]/10' : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${db.isAvailable ? 'bg-green-500' : 'bg-gray-400'}`}>{(db.name || '?').charAt(0)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">{db.name || 'Unknown'}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          {db.phone && <span className="flex items-center gap-1"><FiPhone className="w-3 h-3" />{db.phone}</span>}
                          <span className={db.isAvailable ? 'text-green-600' : 'text-red-500'}>{db.isAvailable ? '● Available' : '● Busy'}</span>
                        </div>
                      </div>
                      {db.distance !== undefined && <div className="text-right text-xs"><span className="flex items-center gap-1 text-gray-500"><FiMapPin className="w-3 h-3" />{((db.distance ?? 0) / 1000).toFixed(1)} km</span></div>}
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-6 flex gap-3">
                <button onClick={() => setShowAssignPickupModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                <button onClick={handleAssignPickup} disabled={assignLoading || !selectedDeliveryBoy}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {assignLoading && <FiLoader className="w-4 h-4 animate-spin" />}Assign Pickup
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Assign Staff Modal */}
      {showAssignStaffModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowAssignStaffModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">🧹 Assign Staff for Cleaning</h3>
                  <p className="text-sm text-gray-500 mt-1">Order: {selectedOrder?.orderId}</p>
                </div>
                <button onClick={() => setShowAssignStaffModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><FiX className="w-5 h-5" /></button>
              </div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Staff Member</label>
              {fetchingList ? (
                <div className="flex items-center justify-center py-8"><FiLoader className="w-6 h-6 text-[#00BFA6] animate-spin" /></div>
              ) : staffList.length === 0 ? (
                <div className="p-6 text-center bg-gray-50 dark:bg-gray-700/50 rounded-xl"><FiUserCheck className="w-8 h-8 text-gray-300 mx-auto mb-2" /><p className="text-sm text-gray-500">No staff available</p></div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {staffList.map((s) => (
                    <button key={s._id} onClick={() => setSelectedStaff(s._id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${
                        selectedStaff === s._id ? 'border-[#00BFA6] bg-[#00BFA6]/5 dark:bg-[#00BFA6]/10' : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}>
                      <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm">{(s.name || '?').charAt(0)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">{s.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{s.email || ''}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-6 flex gap-3">
                <button onClick={() => setShowAssignStaffModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                <button onClick={handleAssignStaff} disabled={assignLoading || !selectedStaff}
                  className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {assignLoading && <FiLoader className="w-4 h-4 animate-spin" />}Assign Staff
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Assign Delivery Modal */}
      {showAssignDeliveryModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowAssignDeliveryModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">📦 Assign Return Delivery</h3>
                  <p className="text-sm text-gray-500 mt-1">Order: {selectedOrder?.orderId} — Deliver cleaned clothes to customer</p>
                </div>
                <button onClick={() => setShowAssignDeliveryModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><FiX className="w-5 h-5" /></button>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"><FiDollarSign className="w-4 h-4 inline mr-1" />Delivery Charge</label>
                <input type="number" value={deliveryCharge} onChange={(e) => setDeliveryCharge(filterNumberInput(e.target.value))}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#00BFA6] outline-none" placeholder="Enter delivery charge" />
              </div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Delivery Boy</label>
              {fetchingList ? (
                <div className="flex items-center justify-center py-8"><FiLoader className="w-6 h-6 text-[#00BFA6] animate-spin" /></div>
              ) : deliveryBoys.length === 0 ? (
                <div className="p-6 text-center bg-gray-50 dark:bg-gray-700/50 rounded-xl"><FiUser className="w-8 h-8 text-gray-300 mx-auto mb-2" /><p className="text-sm text-gray-500">No delivery boys available</p></div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {deliveryBoys.map((db) => (
                    <button key={db._id} onClick={() => setSelectedDeliveryBoy(db._id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${
                        selectedDeliveryBoy === db._id ? 'border-[#00BFA6] bg-[#00BFA6]/5 dark:bg-[#00BFA6]/10' : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${db.isAvailable ? 'bg-green-500' : 'bg-gray-400'}`}>{(db.name || '?').charAt(0)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">{db.name || 'Unknown'}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          {db.phone && <span className="flex items-center gap-1"><FiPhone className="w-3 h-3" />{db.phone}</span>}
                          <span className={db.isAvailable ? 'text-green-600' : 'text-red-500'}>{db.isAvailable ? '● Available' : '● Busy'}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-6 flex gap-3">
                <button onClick={() => setShowAssignDeliveryModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                <button onClick={handleAssignDelivery} disabled={assignLoading || !selectedDeliveryBoy}
                  className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {assignLoading && <FiLoader className="w-4 h-4 animate-spin" />}Assign Delivery
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export default AdminOrdersPage;
