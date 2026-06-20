'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { filterNameInput, filterPhoneInput, filterNumberInput, filterSafeText } from '@/lib/inputValidation';
import { validateEmail } from '@/lib/inputValidation';
import { 
  FiPlus,
  FiX,
  FiTruck,
  FiCheckCircle,
  FiClock,
  FiLoader,
  FiUser,
  FiPhone,
  FiMail,
  FiRefreshCw,
  FiPackage,
  FiDollarSign
} from 'react-icons/fi';
import api from '@/services/api';
import SafeImage from '@/components/ui/SafeImage';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';

interface DeliveryBoy {
  _id: string;
  name: string;
  phone?: string;
  email: string;
  profileImage?: string;
  isAvailable: boolean;
  totalEarnings?: number;
  pendingEarnings?: number;
}

interface Order {
  _id: string;
  orderId: string;
  status: string;
  totalPayment: number;
  deliveryDate?: string;
  user?: { _id: string; name: string; email: string; phone?: string };
  deliveryBoy?: { _id: string; name: string; phone?: string };
  billingInfo?: { fullName: string; phone: string; address: string };
}

interface DeliveryHistory {
  _id: string;
  orderId: string;
  status: string;
  totalPayment: number;
  deliveryDate?: string;
  user?: { name: string };
  deliveryBoy?: { name: string };
}

const AdminDeliveryPage = () => {
  const { formatPrice } = useTheme();
  const { showToast, showConfirm } = useToast();
  const [activeTab, setActiveTab] = useState('staff');
  
  const [deliveryStaff, setDeliveryStaff] = useState<DeliveryBoy[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [deliveryHistory, setDeliveryHistory] = useState<DeliveryHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<DeliveryBoy | null>(null);
  const [assigningDeliveryBoy, setAssigningDeliveryBoy] = useState('');
  const [deliveryCharge, setDeliveryCharge] = useState('50');
  const [assignLoading, setAssignLoading] = useState(false);
  
  const [newStaff, setNewStaff] = useState({ name: '', email: '', phone: '', password: '', role: 'delivery' });
  const [addingStaff, setAddingStaff] = useState(false);
  const [settlingId, setSettlingId] = useState<string | null>(null);
  const [emailError, setEmailError] = useState('');

  const fetchStaff = useCallback(async () => {
    setLoadingStaff(true);
    try {
      const res = await api.get('/admin/delivery-boys');
      if (res.data?.status === 'success') setDeliveryStaff(res.data.data || []);
    } catch { /* */ }
    setLoadingStaff(false);
  }, []);

  const fetchPendingOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const statuses = ['cleaned', 'ready', 'delivery_assigned', 'out_for_delivery'];
      const allOrders: Order[] = [];
      for (const status of statuses) {
        try {
          const res = await api.get(`/admin/orders?status=${status}&limit=50`);
          if (res.data?.status === 'success' && res.data?.data?.orders) allOrders.push(...res.data.data.orders);
        } catch { /* */ }
      }
      setPendingOrders(allOrders);
    } catch { /* */ }
    setLoadingOrders(false);
  }, []);

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get('/admin/orders?status=delivered&limit=50');
      if (res.data?.status === 'success' && res.data?.data?.orders) setDeliveryHistory(res.data.data.orders);
    } catch { /* */ }
    setLoadingHistory(false);
  }, []);

  const dataFetched = useRef(false);
  useEffect(() => {
    if (!dataFetched.current) {
      dataFetched.current = true;
      fetchStaff();
      fetchPendingOrders();
    }
  }, [fetchStaff, fetchPendingOrders]);

  const historyFetched = useRef(false);
  useEffect(() => {
    if (activeTab === 'history' && !historyFetched.current) {
      historyFetched.current = true;
      fetchHistory();
    }
  }, [activeTab, fetchHistory]);

  const openAssignModal = (order: Order) => {
    setSelectedOrder(order);
    setAssigningDeliveryBoy('');
    setDeliveryCharge('50');
    setShowAssignModal(true);
  };

  const openProfileModal = (staff: DeliveryBoy) => {
    setSelectedStaff(staff);
    setShowProfileModal(true);
  };

  const handleAssignDelivery = async () => {
    if (!selectedOrder || !assigningDeliveryBoy) return;
    setAssignLoading(true);
    try {
      const res = await api.put(`/admin/orders/${selectedOrder._id}/assign-delivery`, {
        deliveryBoyId: assigningDeliveryBoy,
        deliveryCharge: Number(deliveryCharge) || 0,
      });
      if (res.data?.status === 'success') {
        setShowAssignModal(false);
        fetchPendingOrders();
        fetchStaff();
      } else {
        showToast(res.data?.message || 'Failed to assign delivery', 'error');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      showToast(error.response?.data?.message || 'Failed to assign delivery', 'error');
    }
    setAssignLoading(false);
  };

  const handleAddStaff = async () => {
    if (!newStaff.name || !newStaff.email || !newStaff.password) return;
    // Validate email format
    const emailErr = validateEmail(newStaff.email);
    if (emailErr) {
      setEmailError(emailErr);
      return;
    }
    setEmailError('');
    setAddingStaff(true);
    try {
      await api.post('/admin/users', { name: newStaff.name, email: newStaff.email, phone: newStaff.phone, password: newStaff.password, role: newStaff.role });
      setShowAddStaffModal(false);
      setNewStaff({ name: '', email: '', phone: '', password: '', role: 'delivery' });
      fetchStaff();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      showToast(error.response?.data?.message || 'Failed to add delivery staff', 'error');
    }
    setAddingStaff(false);
  };

  const [settledIds, setSettledIds] = useState<Set<string>>(new Set());

  const handleSettleEarnings = async (staffId: string, staffName: string, amount: number) => {
    const confirmed = await showConfirm({ title: 'Settle Earnings', message: `Pay ${formatPrice(amount)} to ${staffName}? This will mark pending earnings as paid.`, confirmText: 'Pay Now', type: 'warning' });
    if (!confirmed) return;
    setSettlingId(staffId);
    try {
      const res = await api.put(`/admin/settle-earnings/${staffId}`);
      if (res.data?.status === 'success') {
        setSettledIds(prev => new Set(prev).add(staffId));
        fetchStaff();
        // Auto-clear the "Paid" badge after 5 seconds
        setTimeout(() => setSettledIds(prev => { const n = new Set(prev); n.delete(staffId); return n; }), 5000);
      } else {
        showToast(res.data?.message || 'Failed to settle earnings', 'error');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      showToast(error.response?.data?.message || 'Failed to settle earnings', 'error');
    }
    setSettlingId(null);
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string }> = {
      cleaned: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
      ready: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-400' },
      delivery_assigned: { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-400' },
      out_for_delivery: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-400' },
      delivered: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },
    };
    const config = map[status] || { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-400' };
    return <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${config.bg} ${config.text}`}>{status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>;
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Delivery Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage delivery staff and assignments</p>
        </div>
        <button onClick={() => setShowAddStaffModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-[#0F2744] dark:bg-[#00BFA6] text-white rounded-lg hover:bg-[#1a3a5c] dark:hover:bg-[#00A892] transition-colors text-sm">
          <FiPlus className="w-4 h-4" /><span>Add Delivery Staff</span>
        </button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[
          { id: 'staff', label: 'Delivery Staff', count: deliveryStaff.length },
          { id: 'pending', label: 'Pending Deliveries', count: pendingOrders.filter(o => !o.deliveryBoy).length },
          { id: 'history', label: 'Delivery History' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id ? 'bg-[#0F2744] dark:bg-[#00BFA6] text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            {tab.label}
            {tab.count !== undefined && <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-600'}`}>{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* Staff Tab */}
      {activeTab === 'staff' && (
        <>
          {loadingStaff ? (
            <div className="flex items-center justify-center py-20"><FiLoader className="w-8 h-8 text-[#00BFA6] animate-spin" /></div>
          ) : deliveryStaff.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
              <FiTruck className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Delivery Staff</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Add delivery staff to manage deliveries</p>
              <button onClick={() => setShowAddStaffModal(true)} className="px-4 py-2.5 bg-[#00BFA6] text-white rounded-lg hover:bg-[#00A892] transition-colors text-sm"><FiPlus className="w-4 h-4 inline mr-1" /> Add Staff</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {deliveryStaff.map((staff) => (
                <div key={staff._id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-full overflow-hidden bg-[#00BFA6]/10 flex items-center justify-center">
                          {staff.profileImage ? <SafeImage src={staff.profileImage} alt={staff.name} variant="avatar" width={56} height={56} className="w-full h-full object-cover" /> : <span className="text-lg font-bold text-[#00BFA6]">{getInitials(staff.name)}</span>}
                        </div>
                        <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${staff.isAvailable ? 'bg-green-500' : 'bg-gray-400'}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate max-w-[140px]">{staff.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[140px]">{staff.phone || staff.email}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${staff.isAvailable ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                      {staff.isAvailable ? 'Available' : 'Offline'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center">
                      <FiTruck className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{formatPrice(staff.totalEarnings || 0)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Total Earnings</p>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
                      <FiCheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{formatPrice(staff.pendingEarnings || 0)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Pending</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <button onClick={() => openProfileModal(staff)} className="flex-1 px-3 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium">View Profile</button>
                    <button onClick={() => { setAssigningDeliveryBoy(staff._id); setActiveTab('pending'); }} className="flex-1 px-3 py-2.5 bg-[#00BFA6] text-white rounded-lg hover:bg-[#00A892] transition-colors text-sm font-medium">Assign Order</button>
                  </div>
                  {settledIds.has(staff._id) ? (
                    <div className="w-full mt-2 px-3 py-2.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                      <FiCheckCircle className="w-4 h-4" /> Payment Settled ✅
                    </div>
                  ) : (staff.pendingEarnings || 0) > 0 ? (
                    <button onClick={() => handleSettleEarnings(staff._id, staff.name, staff.pendingEarnings || 0)} disabled={settlingId === staff._id}
                      className="w-full mt-2 px-3 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                      {settlingId === staff._id ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiDollarSign className="w-4 h-4" />}
                      Pay {formatPrice(staff.pendingEarnings || 0)}
                    </button>
                  ) : (
                    <div className="w-full mt-2 px-3 py-2.5 bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                      <FiCheckCircle className="w-4 h-4" /> No Pending Payment
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Pending Deliveries Tab */}
      {activeTab === 'pending' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{pendingOrders.length} orders</p>
            <button onClick={fetchPendingOrders} className="flex items-center gap-1.5 text-sm text-[#00BFA6] hover:underline"><FiRefreshCw className="w-3.5 h-3.5" /> Refresh</button>
          </div>
          {loadingOrders ? (
            <div className="flex items-center justify-center py-20"><FiLoader className="w-8 h-8 text-[#00BFA6] animate-spin" /></div>
          ) : pendingOrders.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
              <FiPackage className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Pending Deliveries</h3>
              <p className="text-gray-500 dark:text-gray-400">All orders have been assigned or delivered</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-4 lg:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Order</th>
                      <th className="px-4 lg:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Customer</th>
                      <th className="hidden xl:table-cell px-4 lg:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Amount</th>
                      <th className="px-4 lg:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                      <th className="hidden sm:table-cell px-4 lg:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Assigned</th>
                      <th className="px-4 lg:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {pendingOrders.map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-4 lg:px-6 py-4">
                          <span className="font-medium text-gray-900 dark:text-white text-sm">{order.orderId}</span>
                          {order.deliveryDate && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1"><FiClock className="w-3 h-3" /> {new Date(order.deliveryDate).toLocaleDateString()}</p>}
                        </td>
                        <td className="px-4 lg:px-6 py-4">
                          <span className="text-sm text-gray-900 dark:text-white">{order.user?.name || order.billingInfo?.fullName || 'N/A'}</span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{order.user?.phone || order.billingInfo?.phone || ''}</p>
                        </td>
                        <td className="hidden xl:table-cell px-4 lg:px-6 py-4"><span className="text-sm font-medium text-gray-900 dark:text-white">{formatPrice(order.totalPayment ?? 0)}</span></td>
                        <td className="px-4 lg:px-6 py-4">{getStatusBadge(order.status)}</td>
                        <td className="hidden sm:table-cell px-4 lg:px-6 py-4">
                          {order.deliveryBoy ? (
                            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium whitespace-nowrap">{order.deliveryBoy.name}</span>
                          ) : (
                            <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-xs font-medium whitespace-nowrap">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 lg:px-6 py-4">
                          <button onClick={() => openAssignModal(order)} className="px-3 py-1.5 bg-[#00BFA6] text-white rounded-lg text-sm hover:bg-[#00A892] transition-colors font-medium">
                            {order.deliveryBoy ? 'Reassign' : 'Assign'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delivery History Tab */}
      {activeTab === 'history' && (
        <>
          {loadingHistory ? (
            <div className="flex items-center justify-center py-20"><FiLoader className="w-8 h-8 text-[#00BFA6] animate-spin" /></div>
          ) : deliveryHistory.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
              <FiTruck className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Delivery History</h3>
              <p className="text-gray-500 dark:text-gray-400">Completed deliveries will appear here</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-4 lg:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Order</th>
                      <th className="px-4 lg:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Customer</th>
                      <th className="px-4 lg:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Delivered By</th>
                      <th className="hidden md:table-cell px-4 lg:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Amount</th>
                      <th className="hidden md:table-cell px-4 lg:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {deliveryHistory.map((item) => (
                      <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-4 lg:px-6 py-4"><span className="font-medium text-gray-900 dark:text-white text-sm">{item.orderId}</span></td>
                        <td className="px-4 lg:px-6 py-4 text-sm text-gray-700 dark:text-gray-300"><span className="truncate block max-w-[120px]">{item.user?.name || 'N/A'}</span></td>
                        <td className="px-4 lg:px-6 py-4 text-sm text-gray-700 dark:text-gray-300"><span className="truncate block max-w-[120px]">{item.deliveryBoy?.name || 'N/A'}</span></td>
                        <td className="hidden md:table-cell px-4 lg:px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{formatPrice(item.totalPayment ?? 0)}</td>
                        <td className="hidden md:table-cell px-4 lg:px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{item.deliveryDate ? new Date(item.deliveryDate).toLocaleDateString() : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Assign Delivery Modal */}
      {showAssignModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowAssignModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-md">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Assign Delivery</h3>
                  {selectedOrder && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Order: {selectedOrder.orderId}</p>}
                </div>
                <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><FiX className="w-5 h-5 text-gray-500" /></button>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Delivery Charge</label>
                <input type="number" value={deliveryCharge} onChange={(e) => setDeliveryCharge(filterNumberInput(e.target.value))} className="w-full h-11 px-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" placeholder="50" />
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                {deliveryStaff.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No delivery staff available</p>
                ) : deliveryStaff.map((staff) => (
                  <button key={staff._id} onClick={() => setAssigningDeliveryBoy(staff._id)} className={`w-full flex items-center gap-3 p-3 border-2 rounded-xl transition-colors ${assigningDeliveryBoy === staff._id ? 'border-[#00BFA6] bg-[#00BFA6]/5' : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-[#00BFA6]/10 flex items-center justify-center shrink-0">
                      {staff.profileImage ? <SafeImage src={staff.profileImage} alt={staff.name} variant="avatar" width={40} height={40} className="w-full h-full object-cover" /> : <span className="text-sm font-bold text-[#00BFA6]">{getInitials(staff.name)}</span>}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{staff.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{staff.phone || staff.email}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs whitespace-nowrap ${staff.isAvailable ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                      {staff.isAvailable ? 'Available' : 'Offline'}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowAssignModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium">Cancel</button>
                <button onClick={handleAssignDelivery} disabled={!assigningDeliveryBoy || assignLoading} className="flex-1 px-4 py-2.5 bg-[#0F2744] dark:bg-[#00BFA6] text-white rounded-lg hover:bg-[#1a3a5c] dark:hover:bg-[#00A892] transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {assignLoading && <FiLoader className="w-4 h-4 animate-spin" />} Assign
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* View Profile Modal */}
      {showProfileModal && selectedStaff && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowProfileModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-md">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Staff Profile</h3>
                <button onClick={() => setShowProfileModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><FiX className="w-5 h-5 text-gray-500" /></button>
              </div>
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto rounded-full overflow-hidden bg-[#00BFA6]/10 flex items-center justify-center mb-3">
                  {selectedStaff.profileImage ? <SafeImage src={selectedStaff.profileImage} alt={selectedStaff.name} variant="avatar" width={80} height={80} className="w-full h-full object-cover" /> : <span className="text-2xl font-bold text-[#00BFA6]">{getInitials(selectedStaff.name)}</span>}
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedStaff.name}</h4>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${selectedStaff.isAvailable ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                  {selectedStaff.isAvailable ? '🟢 Available' : '⚫ Offline'}
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <FiMail className="w-4 h-4 text-gray-400" />
                  <div><p className="text-xs text-gray-500 dark:text-gray-400">Email</p><p className="text-sm font-medium text-gray-900 dark:text-white">{selectedStaff.email}</p></div>
                </div>
                {selectedStaff.phone && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <FiPhone className="w-4 h-4 text-gray-400" />
                    <div><p className="text-xs text-gray-500 dark:text-gray-400">Phone</p><p className="text-sm font-medium text-gray-900 dark:text-white">{selectedStaff.phone}</p></div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{formatPrice(selectedStaff.totalEarnings || 0)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Earnings</p>
                  </div>
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-center">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{formatPrice(selectedStaff.pendingEarnings || 0)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Pending</p>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowProfileModal(false)} className="w-full mt-6 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium">Close</button>
            </div>
          </div>
        </>
      )}

      {/* Add Staff Modal */}
      {showAddStaffModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowAddStaffModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-md">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Delivery Staff</h3>
                <button onClick={() => setShowAddStaffModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><FiX className="w-5 h-5 text-gray-500" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role *</label>
                  <select value={newStaff.role} onChange={(e) => setNewStaff({...newStaff, role: e.target.value})} className="w-full h-11 px-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                    <option value="delivery">Delivery Boy</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
                  <div className="relative"><FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" /><input type="text" value={newStaff.name} onChange={(e) => setNewStaff({...newStaff, name: filterNameInput(e.target.value)})} placeholder="Full name" className="w-full h-11 pl-10 pr-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" /></div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                  <div className="relative"><FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" /><input type="email" value={newStaff.email} onChange={(e) => { setNewStaff({...newStaff, email: filterSafeText(e.target.value)}); setEmailError(''); }} placeholder="email@example.com" className={`w-full h-11 pl-10 pr-4 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm ${emailError ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-600'}`} /></div>
                  {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                  <div className="relative"><FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" /><input type="tel" value={newStaff.phone} onChange={(e) => setNewStaff({...newStaff, phone: filterPhoneInput(e.target.value)})} placeholder="Phone number" className="w-full h-11 pl-10 pr-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" /></div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password *</label>
                  <input type="password" value={newStaff.password} onChange={(e) => setNewStaff({...newStaff, password: filterSafeText(e.target.value)})} placeholder="Create password" className="w-full h-11 px-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowAddStaffModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium">Cancel</button>
                <button onClick={handleAddStaff} disabled={!newStaff.name || !newStaff.email || !newStaff.password || addingStaff} className="flex-1 px-4 py-2.5 bg-[#0F2744] dark:bg-[#00BFA6] text-white rounded-lg hover:bg-[#1a3a5c] dark:hover:bg-[#00A892] transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {addingStaff && <FiLoader className="w-4 h-4 animate-spin" />} Add Staff
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export { default } from '@/components/admin/DispatchDashboard';
