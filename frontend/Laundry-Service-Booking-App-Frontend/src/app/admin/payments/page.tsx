'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import SafeImage from '@/components/ui/SafeImage';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import api from '@/services/api';
import { 
  FiSearch,
  FiDownload,
  FiEye,
  FiX,
  FiDollarSign,
  FiCreditCard,
  FiTrendingUp,
  FiRefreshCw,
  FiAlertCircle,
  FiLoader,
  FiCheck,
  FiCopy
} from 'react-icons/fi';

interface PaymentItem {
  _id: string;
  orderId: string;
  user: { name: string; email: string; profileImage?: string };
  amount: number;
  method: string;
  status: string;
  date: string;
  transactionId?: string;
  currency?: string;
}

interface PaymentStats {
  totalRevenue: number;
  totalOrders: number;
  completedPayments: number;
  pendingPayments: number;
}

const AdminPaymentsPage = () => {
  const { showToast } = useToast();
  const { formatPrice } = useTheme();
  const [activeTab, setActiveTab] = useState('all');
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [stats, setStats] = useState<PaymentStats>({ totalRevenue: 0, totalOrders: 0, completedPayments: 0, pendingPayments: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundNotes, setRefundNotes] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);
  const [copiedField, setCopiedField] = useState('');

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = { page: String(page), limit: '15' };
      if (activeTab !== 'all') params.status = activeTab;
      if (methodFilter) params.method = methodFilter;
      if (searchQuery) params.search = searchQuery;
      const res = await api.get('/admin/payments', { params });
      if (res.data?.status === 'success') {
        setPayments(res.data.data || []);
        const s = res.data.stats || {};
        setStats({
          totalRevenue: s.totalRevenue ?? 0,
          totalOrders: s.totalOrders ?? 0,
          completedPayments: s.completedPayments ?? 0,
          pendingPayments: s.pendingPayments ?? 0,
        });
        setTotalPages(res.data.pagination?.totalPages || 1);
        setTotal(res.data.pagination?.total || 0);
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  }, [page, activeTab, methodFilter, searchQuery]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const handleProcessRefund = async () => {
    if (!selectedPayment || !refundReason) return;
    try {
      setRefundLoading(true);
      const res = await api.post(`/admin/payments/${selectedPayment._id}/refund`, {
        reason: refundReason,
        notes: refundNotes,
      });
      if (res.data?.status === 'success') {
        setShowRefundModal(false);
        setRefundReason('');
        setRefundNotes('');
        setSelectedPayment(null);
        fetchPayments();
      }
    } catch (err) {
      showToast('Failed to process refund. Please try again.', 'error');
    } finally {
      setRefundLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 2000);
  };

  // Search is now handled server-side
  const filteredPayments = payments;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      case 'failed': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      case 'refunded': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'card': case 'stripe': return <FiCreditCard className="w-4 h-4" />;
      case 'paypal': return <span className="text-xs font-bold text-blue-600">PP</span>;
      case 'paystack': return <span className="text-xs font-bold text-[#00C3F7]">PS</span>;
      case 'cash': return <FiDollarSign className="w-4 h-4" />;
      default: return <FiDollarSign className="w-4 h-4" />;
    }
  };

  const formatMethod = (method: string) => {
    const map: Record<string, string> = { card: 'Credit Card', stripe: 'Stripe', paypal: 'PayPal', paystack: 'Paystack', cash: 'Cash' };
    return map[method] || method;
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const getUserInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.trim().split(' ').filter(Boolean);
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase();
  };

  return (
    <AdminLayout>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payments</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage transactions, refunds and payment history</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#0F2744] dark:bg-[#00BFA6] text-white rounded-lg hover:bg-[#1a3a5c] dark:hover:bg-[#00A892] transition-colors">
          <FiDownload className="w-4 h-4" />
          <span>Export</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <FiTrendingUp className="w-5 h-5 text-green-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatPrice(stats.totalRevenue ?? 0)}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <FiCreditCard className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{(stats.totalOrders ?? 0).toLocaleString()}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Transactions</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
              <FiDollarSign className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{(stats.completedPayments ?? 0).toLocaleString()}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Completed Payments</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
              <FiAlertCircle className="w-5 h-5 text-amber-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{(stats.pendingPayments ?? 0).toLocaleString()}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Pending Payments</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {['all', 'paid', 'pending', 'failed', 'refunded'].map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize whitespace-nowrap ${
              activeTab === tab
                ? 'bg-[#0F2744] dark:bg-[#00BFA6] text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order ID or customer..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#00BFA6] focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <select
            value={methodFilter}
            onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Methods</option>
            <option value="card">Credit Card</option>
            <option value="stripe">Stripe</option>
            <option value="paypal">PayPal</option>
            <option value="paystack">Paystack</option>
            <option value="cash">Cash</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <FiLoader className="w-8 h-8 text-[#00BFA6] animate-spin" />
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-20">
            <FiCreditCard className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No payments found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 lg:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Order</th>
                    <th className="hidden sm:table-cell px-4 lg:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Customer</th>
                    <th className="hidden md:table-cell px-4 lg:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Method</th>
                    <th className="px-4 lg:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Amount</th>
                    <th className="px-4 lg:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                    <th className="hidden xl:table-cell px-4 lg:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Date</th>
                    <th className="px-4 lg:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredPayments.map((payment) => (
                    <tr key={payment._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 lg:px-6 py-4">
                        <span className="font-medium text-gray-900 dark:text-white">{payment.orderId}</span>
                      </td>
                      <td className="hidden sm:table-cell px-4 lg:px-6 py-4">
                        <div className="flex items-center gap-3">
                          {payment.user?.profileImage ? (
                            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                              <SafeImage src={payment.user.profileImage} alt={payment.user.name} variant="avatar" width={32} height={32} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#0F2744] dark:bg-[#00BFA6] border-2 border-[#0F2744] dark:border-[#00BFA6] flex items-center justify-center shrink-0">
                              <span className="text-white text-xs font-bold">{getUserInitials(payment.user?.name || '')}</span>
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate">{payment.user?.name || 'Unknown'}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{payment.user?.email || ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-4 lg:px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                            {getMethodIcon(payment.method)}
                          </div>
                          <span className="text-sm text-gray-900 dark:text-white">{formatMethod(payment.method)}</span>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <span className="font-semibold text-gray-900 dark:text-white">{formatPrice(payment.amount ?? 0)}</span>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize whitespace-nowrap ${getStatusStyle(payment.status)}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="hidden xl:table-cell px-4 lg:px-6 py-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{formatDate(payment.date)}</span>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setSelectedPayment(payment); setShowDetailModal(true); }}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <FiEye className="w-4 h-4 text-gray-500" />
                          </button>
                          {payment.status === 'paid' && (
                            <button
                              onClick={() => { setSelectedPayment(payment); setShowRefundModal(true); }}
                              className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                              title="Refund"
                            >
                              <FiRefreshCw className="w-4 h-4 text-red-500" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-4 lg:px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Page {page} of {totalPages} ({total} total)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1.5 bg-[#0F2744] dark:bg-[#00BFA6] text-white rounded-lg text-sm">{page}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Payment Detail Modal */}
      {showDetailModal && selectedPayment && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowDetailModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Details</h3>
                <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Status Badge */}
              <div className="flex items-center justify-center mb-6">
                <span className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize ${getStatusStyle(selectedPayment.status)}`}>
                  {selectedPayment.status}
                </span>
              </div>

              {/* Amount */}
              <div className="text-center mb-6">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatPrice(selectedPayment.amount ?? 0)}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{formatDate(selectedPayment.date)}</p>
              </div>

              {/* Details Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Order ID</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedPayment.orderId}</span>
                    <button onClick={() => copyToClipboard(selectedPayment.orderId, 'orderId')} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors">
                      {copiedField === 'orderId' ? <FiCheck className="w-3.5 h-3.5 text-green-500" /> : <FiCopy className="w-3.5 h-3.5 text-gray-400" />}
                    </button>
                  </div>
                </div>

                {selectedPayment.transactionId && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Transaction ID</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white font-mono">{selectedPayment.transactionId.length > 20 ? `${selectedPayment.transactionId.slice(0, 20)}...` : selectedPayment.transactionId}</span>
                      <button onClick={() => copyToClipboard(selectedPayment.transactionId!, 'txnId')} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors">
                        {copiedField === 'txnId' ? <FiCheck className="w-3.5 h-3.5 text-green-500" /> : <FiCopy className="w-3.5 h-3.5 text-gray-400" />}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Payment Method</span>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-gray-100 dark:bg-gray-600 rounded-lg flex items-center justify-center">{getMethodIcon(selectedPayment.method)}</div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{formatMethod(selectedPayment.method)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Customer</span>
                  <div className="flex items-center gap-2">
                    {selectedPayment.user?.profileImage ? (
                      <div className="w-6 h-6 rounded-full overflow-hidden">
                        <SafeImage src={selectedPayment.user.profileImage} alt="" variant="avatar" width={24} height={24} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[#0F2744] dark:bg-[#00BFA6] flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold">{getUserInitials(selectedPayment.user?.name || '')}</span>
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedPayment.user?.name || 'Unknown'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Email</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedPayment.user?.email || 'N/A'}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex gap-3">
                <button onClick={() => setShowDetailModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium">Close</button>
                {selectedPayment.status === 'paid' && (
                  <button
                    onClick={() => { setShowDetailModal(false); setShowRefundModal(true); }}
                    className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <FiRefreshCw className="w-4 h-4" />
                    Process Refund
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedPayment && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowRefundModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-md">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Process Refund</h3>
                <button onClick={() => setShowRefundModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Order ID</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedPayment.orderId}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Customer</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedPayment.user?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Amount</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{formatPrice(selectedPayment.amount ?? 0)}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason for Refund <span className="text-red-500">*</span></label>
                  <select
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select reason</option>
                    <option value="customer_request">Customer Request</option>
                    <option value="damaged">Items Damaged</option>
                    <option value="lost">Items Lost</option>
                    <option value="service_issue">Service Issue</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes (Optional)</label>
                  <textarea
                    rows={3}
                    value={refundNotes}
                    onChange={(e) => setRefundNotes(e.target.value)}
                    placeholder="Add any additional notes..."
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  />
                </div>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">⚠️ This action cannot be undone. The refund will be processed to the original payment method.</p>
              </div>

              <div className="mt-6 flex gap-3">
                <button onClick={() => { setShowRefundModal(false); setRefundReason(''); setRefundNotes(''); }} className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium">Cancel</button>
                <button
                  onClick={handleProcessRefund}
                  disabled={!refundReason || refundLoading}
                  className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {refundLoading ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiRefreshCw className="w-4 h-4" />}
                  {refundLoading ? 'Processing...' : 'Process Refund'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export default AdminPaymentsPage;
