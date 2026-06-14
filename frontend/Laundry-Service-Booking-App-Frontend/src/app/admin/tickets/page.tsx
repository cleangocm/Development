'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { filterSafeText } from '@/lib/inputValidation';
import {
  FiSearch, FiClock, FiCheckCircle, FiAlertCircle,
  FiCalendar, FiTag, FiLoader, FiX, FiSend, FiPhone, FiTrash2,
  FiRefreshCw, FiInbox, FiUserCheck, FiActivity,
} from 'react-icons/fi';

interface TicketNote {
  _id: string;
  by: { _id: string; name: string; role: string; profileImage?: string };
  byRole: 'user' | 'staff' | 'admin';
  message: string;
  createdAt: string;
}

interface Ticket {
  _id: string;
  tokenNumber: string;
  user: { _id: string; name: string; email: string; phone?: string; profileImage?: string; role?: string };
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assignedTo?: { _id: string; name: string; email: string; role: string } | null;
  relatedOrder?: { orderId: string; totalPayment: number; status: string } | null;
  notes: TicketNote[];
  staffReview: { calledUser: boolean; callNotes: string; resolvedByCall: boolean };
  createdAt: string;
  resolvedAt?: string | null;
  closedAt?: string | null;
}

interface StaffMember {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Stats {
  open: number;
  assigned: number;
  in_progress: number;
  resolved: number;
  closed: number;
  total: number;
}

const CATEGORIES = [
  { value: 'order_issue', label: 'Order Issue', icon: '📦' },
  { value: 'payment_issue', label: 'Payment Issue', icon: '💳' },
  { value: 'delivery_issue', label: 'Delivery Issue', icon: '🚚' },
  { value: 'service_quality', label: 'Service Quality', icon: '⭐' },
  { value: 'account_issue', label: 'Account Issue', icon: '👤' },
  { value: 'other', label: 'Other', icon: '📋' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'text-gray-500 bg-gray-100 dark:bg-gray-700', dot: 'bg-gray-400' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30', dot: 'bg-yellow-400' },
  { value: 'high', label: 'High', color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30', dot: 'bg-orange-400' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-600 bg-red-100 dark:bg-red-900/30', dot: 'bg-red-500' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof FiClock }> = {
  open: { label: 'Open', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', icon: FiAlertCircle },
  assigned: { label: 'Assigned', color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30', icon: FiUserCheck },
  in_progress: { label: 'In Progress', color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30', icon: FiActivity },
  resolved: { label: 'Resolved', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30', icon: FiCheckCircle },
  closed: { label: 'Closed', color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-700', icon: FiCheckCircle },
};

const AdminTicketsPage = () => {
  const { showToast, showConfirm } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<Stats>({ open: 0, assigned: 0, in_progress: 0, resolved: 0, closed: 0, total: 0 });
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Detail view
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [sendingNote, setSendingNote] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterPriority !== 'all') params.priority = filterPriority;
      if (filterCategory !== 'all') params.category = filterCategory;
      if (searchQuery) params.search = searchQuery;

      const res = await api.get('/admin/tickets', { params });
      if (res.data.status === 'success') {
        setTickets(res.data.data.tickets || []);
        setStats(res.data.data.stats || { open: 0, assigned: 0, in_progress: 0, resolved: 0, closed: 0, total: 0 });
      }
    } catch (err) {

    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterPriority, filterCategory, searchQuery]);

  const fetchStaff = useCallback(async () => {
    try {
      const res = await api.get('/admin/tickets/staff-list');
      if (res.data.status === 'success') setStaffList(res.data.data || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);
  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const handleViewTicket = async (id: string) => {
    try {
      const res = await api.get(`/admin/tickets/${id}`);
      if (res.data.status === 'success') {
        setSelectedTicket(res.data.data);
        setShowDetail(true);
      }
    } catch { showToast('Failed to load ticket', 'error'); }
  };

  const handleUpdateTicket = async (id: string, updates: Record<string, unknown>) => {
    try {
      setUpdating(true);
      const res = await api.put(`/admin/tickets/${id}`, updates);
      if (res.data.status === 'success') {
        setSelectedTicket(res.data.data);
        fetchTickets();
      }
    } catch { showToast('Failed to update ticket', 'error'); }
    finally { setUpdating(false); }
  };

  const handleSendNote = async () => {
    if (!adminNote.trim() || !selectedTicket) return;
    try {
      setSendingNote(true);
      await handleUpdateTicket(selectedTicket._id, { message: adminNote });
      setAdminNote('');
    } finally { setSendingNote(false); }
  };

  const handleDeleteTicket = async (id: string) => {
    const confirmed = await showConfirm({ title: 'Delete Ticket', message: 'Delete this ticket permanently?', confirmText: 'Delete', type: 'danger' });
    if (!confirmed) return;
    try {
      await api.delete(`/admin/tickets/${id}`);
      setShowDetail(false);
      setSelectedTicket(null);
      fetchTickets();
    } catch { showToast('Failed to delete ticket', 'error'); }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const getPriorityConfig = (p: string) => PRIORITIES.find(pr => pr.value === p) || PRIORITIES[1];
  const getStatusConfig = (s: string) => STATUS_CONFIG[s] || STATUS_CONFIG.open;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Support Tickets</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage customer support tokens</p>
          </div>
          <button onClick={() => fetchTickets()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
            <FiRefreshCw className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          {[
            { label: 'Total', value: stats.total, color: 'text-[#0F2744] dark:text-white', bg: 'bg-gray-50 dark:bg-gray-800' },
            { label: 'Open', value: stats.open, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { label: 'Assigned', value: stats.assigned, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
            { label: 'In Progress', value: stats.in_progress, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
            { label: 'Resolved', value: stats.resolved, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
            { label: 'Closed', value: stats.closed, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-800' },
          ].map((s, i) => (
            <div key={i} className={`${s.bg} rounded-xl p-4 border border-gray-100 dark:border-gray-700`}>
              <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search token number or subject..."
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-[#00BFA6]"
              />
            </div>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-[#00BFA6]">
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-[#00BFA6]">
              <option value="all">All Priority</option>
              {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-[#00BFA6]">
              <option value="all">All Categories</option>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

        {/* Tickets Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <FiLoader className="w-8 h-8 text-[#00BFA6] animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center">
            <FiInbox className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No tickets found</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap">Token</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap">Customer</th>
                    <th className="hidden md:table-cell text-left px-4 py-3 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap">Subject</th>
                    <th className="hidden xl:table-cell text-left px-4 py-3 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap">Category</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap">Priority</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap">Status</th>
                    <th className="hidden xl:table-cell text-left px-4 py-3 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap">Assigned</th>
                    <th className="hidden lg:table-cell text-left px-4 py-3 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => {
                    const sc = getStatusConfig(ticket.status);
                    const pc = getPriorityConfig(ticket.priority);
                    const StatusIcon = sc.icon;
                    return (
                      <tr key={ticket._id}
                        onClick={() => handleViewTicket(ticket._id)}
                        className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span className="text-xs font-bold font-mono text-[#00BFA6]">{ticket.tokenNumber}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#0F2744] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                              {ticket.user?.name?.charAt(0) || '?'}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{ticket.user?.name}</p>
                              <p className="text-[10px] text-gray-400 truncate">{ticket.user?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-4 py-3">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate max-w-50">{ticket.subject}</p>
                        </td>
                        <td className="hidden xl:table-cell px-4 py-3">
                          <span className="text-[11px] text-gray-500 whitespace-nowrap">{CATEGORIES.find(c => c.value === ticket.category)?.icon} {CATEGORIES.find(c => c.value === ticket.category)?.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap ${pc.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${pc.dot}`}></span>
                            {pc.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap ${sc.color} ${sc.bg}`}>
                            <StatusIcon className="w-3 h-3" /> {sc.label}
                          </span>
                        </td>
                        <td className="hidden xl:table-cell px-4 py-3">
                          <span className="text-[11px] text-gray-500 whitespace-nowrap">{ticket.assignedTo?.name || '—'}</span>
                        </td>
                        <td className="hidden lg:table-cell px-4 py-3">
                          <span className="text-[11px] text-gray-400 whitespace-nowrap">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ===== TICKET DETAIL MODAL ===== */}
      {showDetail && selectedTicket && (
        <div className="fixed inset-0 z-70 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between p-5 border-b border-gray-100 dark:border-gray-700 shrink-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-bold font-mono text-[#00BFA6]">{selectedTicket.tokenNumber}</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${getStatusConfig(selectedTicket.status).color} ${getStatusConfig(selectedTicket.status).bg}`}>
                    {getStatusConfig(selectedTicket.status).label}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold ${getPriorityConfig(selectedTicket.priority).color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${getPriorityConfig(selectedTicket.priority).dot}`}></span>
                    {getPriorityConfig(selectedTicket.priority).label}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">{selectedTicket.subject}</h2>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => handleDeleteTicket(selectedTicket._id)}
                  className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                  <FiTrash2 className="w-4 h-4" />
                </button>
                <button onClick={() => { setShowDetail(false); setSelectedTicket(null); }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <FiX className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Customer Info + Controls */}
            <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 shrink-0 space-y-3">
              {/* Customer */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0F2744] flex items-center justify-center text-white font-bold">
                  {selectedTicket.user?.name?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedTicket.user?.name}</p>
                  <p className="text-[11px] text-gray-500">{selectedTicket.user?.email} {selectedTicket.user?.phone && `• ${selectedTicket.user.phone}`}</p>
                </div>
              </div>

              {/* Admin Controls Row */}
              <div className="flex flex-wrap gap-3">
                {/* Assign Staff */}
                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Assign:</label>
                  <select
                    value={selectedTicket.assignedTo?._id || ''}
                    onChange={(e) => handleUpdateTicket(selectedTicket._id, { assignedTo: e.target.value || undefined })}
                    disabled={updating}
                    className="px-2 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-[#00BFA6]"
                  >
                    <option value="">Unassigned</option>
                    {staffList.map(s => (
                      <option key={s._id} value={s._id}>{s.name} ({s.role})</option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Status:</label>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleUpdateTicket(selectedTicket._id, { status: e.target.value })}
                    disabled={updating}
                    className="px-2 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-[#00BFA6]"
                  >
                    <option value="open">Open</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                {/* Priority */}
                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Priority:</label>
                  <select
                    value={selectedTicket.priority}
                    onChange={(e) => handleUpdateTicket(selectedTicket._id, { priority: e.target.value })}
                    disabled={updating}
                    className="px-2 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-[#00BFA6]"
                  >
                    {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Meta info */}
              <div className="flex flex-wrap gap-4 text-[11px] text-gray-400">
                <span className="flex items-center gap-1"><FiCalendar className="w-3 h-3" /> Created: {formatDate(selectedTicket.createdAt)}</span>
                <span className="flex items-center gap-1"><FiTag className="w-3 h-3" /> {CATEGORIES.find(c => c.value === selectedTicket.category)?.icon} {CATEGORIES.find(c => c.value === selectedTicket.category)?.label}</span>
                {selectedTicket.resolvedAt && (
                  <span className="flex items-center gap-1 text-green-500"><FiCheckCircle className="w-3 h-3" /> Resolved: {formatDate(selectedTicket.resolvedAt)}</span>
                )}
              </div>
            </div>

            {/* Staff Review Info */}
            {selectedTicket.staffReview?.calledUser && (
              <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 bg-green-50 dark:bg-green-900/20 shrink-0">
                <div className="flex items-center gap-2 text-sm">
                  <FiPhone className="w-4 h-4 text-green-600" />
                  <span className="font-semibold text-green-700 dark:text-green-400">Staff called user</span>
                  {selectedTicket.staffReview.resolvedByCall ? (
                    <span className="ml-2 px-2 py-0.5 bg-green-200 dark:bg-green-800 rounded text-[11px] font-bold text-green-700 dark:text-green-300">✅ Resolved by Call</span>
                  ) : (
                    <span className="ml-2 px-2 py-0.5 bg-yellow-200 dark:bg-yellow-800 rounded text-[11px] font-bold text-yellow-700 dark:text-yellow-300">❌ Not Resolved</span>
                  )}
                </div>
                {selectedTicket.staffReview.callNotes && (
                  <p className="text-xs text-green-600 dark:text-green-300 mt-1 italic">&quot;{selectedTicket.staffReview.callNotes}&quot;</p>
                )}
              </div>
            )}

            {/* Messages Thread */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50 dark:bg-gray-900/50">
              {selectedTicket.notes.map((note) => {
                const isUser = note.byRole === 'user';
                return (
                  <div key={note._id} className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
                    <div className="max-w-[80%]">
                      <div className={`flex items-center gap-2 mb-1 ${isUser ? '' : 'justify-end'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          note.byRole === 'admin' ? 'bg-red-500 text-white' :
                          note.byRole === 'staff' ? 'bg-orange-500 text-white' :
                          'bg-[#0F2744] text-white'
                        }`}>
                          {note.by?.name?.charAt(0) || '?'}
                        </div>
                        <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">
                          {note.by?.name || 'Unknown'}
                          <span className={`text-[10px] font-normal ml-1 px-1.5 py-0.5 rounded ${
                            note.byRole === 'admin' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' :
                            note.byRole === 'staff' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600' :
                            'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                          }`}>{note.byRole}</span>
                        </span>
                      </div>
                      <div className={`px-4 py-3 rounded-2xl text-sm ${
                        isUser
                          ? 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 shadow-sm rounded-bl-md'
                          : note.byRole === 'admin'
                            ? 'bg-red-500 text-white rounded-br-md'
                            : 'bg-orange-500 text-white rounded-br-md'
                      }`}>
                        <p className="whitespace-pre-wrap">{note.message}</p>
                      </div>
                      <p className={`text-[10px] mt-1 ${isUser ? 'text-left' : 'text-right'} text-gray-400`}>
                        {formatDate(note.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Admin Reply Input */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 shrink-0">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={adminNote}
                  onChange={(e) => setAdminNote(filterSafeText(e.target.value))}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendNote()}
                  placeholder="Type admin reply..."
                  className="flex-1 px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-[#00BFA6]"
                />
                <button
                  onClick={handleSendNote}
                  disabled={!adminNote.trim() || sendingNote}
                  className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {sendingNote ? <FiLoader className="w-5 h-5 animate-spin" /> : <FiSend className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminTicketsPage;
