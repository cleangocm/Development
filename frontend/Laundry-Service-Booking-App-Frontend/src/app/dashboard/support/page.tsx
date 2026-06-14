'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { filterSafeText } from '@/lib/inputValidation';
import {
  FiPlus, FiSearch, FiFilter, FiClock, FiCheckCircle, FiAlertCircle,
  FiMessageSquare, FiChevronRight, FiX, FiSend, FiUser, FiHash,
  FiCalendar, FiTag, FiLoader, FiAlertTriangle,
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
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assignedTo?: { name: string; email: string; role: string } | null;
  relatedOrder?: { orderId: string; totalPayment: number; status: string } | null;
  notes: TicketNote[];
  staffReview: { calledUser: boolean; callNotes: string; resolvedByCall: boolean };
  createdAt: string;
  resolvedAt?: string | null;
}

const CATEGORIES = [
  { value: 'order_issue', label: 'Order Issue' },
  { value: 'payment_issue', label: 'Payment Issue' },
  { value: 'delivery_issue', label: 'Delivery Issue' },
  { value: 'service_quality', label: 'Service Quality' },
  { value: 'account_issue', label: 'Account Issue' },
  { value: 'other', label: 'Other' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'text-gray-500 bg-gray-100 dark:bg-gray-700' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30' },
  { value: 'high', label: 'High', color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof FiClock }> = {
  open: { label: 'Open', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30', icon: FiAlertCircle },
  assigned: { label: 'Assigned', color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30', icon: FiUser },
  in_progress: { label: 'In Progress', color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30', icon: FiLoader },
  resolved: { label: 'Resolved', color: 'text-green-600 bg-green-100 dark:bg-green-900/30', icon: FiCheckCircle },
  closed: { label: 'Closed', color: 'text-gray-500 bg-gray-100 dark:bg-gray-700', icon: FiCheckCircle },
};

const SupportPage = () => {
  const { showToast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Create ticket modal
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', description: '', category: 'other', priority: 'medium' });

  // Ticket detail view
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [sendingNote, setSendingNote] = useState(false);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      const res = await api.get('/tickets/my-tickets', { params });
      if (res.data.status === 'success') {
        setTickets(res.data.data.tickets || []);
      }
    } catch (err) {

    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleCreateTicket = async () => {
    if (!newTicket.subject.trim() || !newTicket.description.trim()) return;
    try {
      setCreating(true);
      const res = await api.post('/tickets', newTicket);
      if (res.data.status === 'success') {
        setShowCreate(false);
        setNewTicket({ subject: '', description: '', category: 'other', priority: 'medium' });
        fetchTickets();
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      showToast(error.response?.data?.message || 'Failed to create ticket. Please try again.', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleViewTicket = async (ticketId: string) => {
    try {
      const res = await api.get(`/tickets/${ticketId}`);
      if (res.data.status === 'success') {
        setSelectedTicket(res.data.data);
        setShowDetail(true);
      }
    } catch {
      showToast('Failed to load ticket', 'error');
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !selectedTicket) return;
    try {
      setSendingNote(true);
      const res = await api.post(`/tickets/${selectedTicket._id}/notes`, { message: newNote });
      if (res.data.status === 'success') {
        setNewNote('');
        // Refresh ticket detail
        const detail = await api.get(`/tickets/${selectedTicket._id}`);
        if (detail.data.status === 'success') setSelectedTicket(detail.data.data);
        fetchTickets();
      }
    } catch {
      showToast('Failed to send message', 'error');
    } finally {
      setSendingNote(false);
    }
  };

  const filteredTickets = tickets.filter(t =>
    t.tokenNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const getPriorityConfig = (p: string) => PRIORITIES.find(pr => pr.value === p) || PRIORITIES[1];
  const getStatusConfig = (s: string) => STATUS_CONFIG[s] || STATUS_CONFIG.open;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0F2744] dark:text-white">Support Tickets</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Submit your problems and track resolution
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#00BFA6] text-white rounded-xl font-medium hover:bg-[#00A892] transition-colors shadow-md"
          >
            <FiPlus className="w-4 h-4" /> New Ticket
          </button>
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
                placeholder="Search by token number or subject..."
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-[#00BFA6]"
              />
            </div>
            <div className="flex items-center gap-2">
              <FiFilter className="w-4 h-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-[#00BFA6]"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tickets List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <FiLoader className="w-8 h-8 text-[#00BFA6] animate-spin" />
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center">
            <FiMessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No tickets found</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {filterStatus !== 'all' ? 'Try changing the filter' : 'Create a new support ticket to get help'}
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-5 py-2 bg-[#00BFA6] text-white rounded-xl text-sm font-medium hover:bg-[#00A892]"
            >
              Create Ticket
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map((ticket) => {
              const sc = getStatusConfig(ticket.status);
              const pc = getPriorityConfig(ticket.priority);
              const StatusIcon = sc.icon;
              return (
                <button
                  key={ticket._id}
                  onClick={() => handleViewTicket(ticket._id)}
                  className="w-full bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 sm:p-5 hover:shadow-md transition-all text-left group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#0F2744]/10 dark:bg-white/10 text-[#0F2744] dark:text-gray-300 font-mono">
                          <FiHash className="w-3 h-3" /> {ticket.tokenNumber}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${sc.color}`}>
                          <StatusIcon className="w-3 h-3" /> {sc.label}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${pc.color}`}>
                          {pc.label}
                        </span>
                      </div>
                      <h3 className="font-semibold text-[#0F2744] dark:text-white text-sm sm:text-base truncate">
                        {ticket.subject}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                        {ticket.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
                        <span className="flex items-center gap-1"><FiCalendar className="w-3 h-3" /> {formatDate(ticket.createdAt)}</span>
                        <span className="flex items-center gap-1"><FiTag className="w-3 h-3" /> {CATEGORIES.find(c => c.value === ticket.category)?.label || ticket.category}</span>
                        {ticket.assignedTo && (
                          <span className="flex items-center gap-1"><FiUser className="w-3 h-3" /> {ticket.assignedTo.name}</span>
                        )}
                        {ticket.notes.length > 1 && (
                          <span className="flex items-center gap-1"><FiMessageSquare className="w-3 h-3" /> {ticket.notes.length} messages</span>
                        )}
                      </div>
                    </div>
                    <FiChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-[#00BFA6] transition-colors shrink-0 mt-2" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ===== CREATE TICKET MODAL ===== */}
      {showCreate && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-[#0F2744] dark:text-white">New Support Ticket</h2>
              <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">
                <FiX className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Subject *</label>
                <input
                  type="text"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: filterSafeText(e.target.value) })}
                  placeholder="Brief summary of your issue..."
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-[#00BFA6]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Category</label>
                  <select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-[#00BFA6]"
                  >
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Priority</label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-[#00BFA6]"
                  >
                    {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Describe your problem *</label>
                <textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: filterSafeText(e.target.value) })}
                  placeholder="Explain your issue in detail..."
                  rows={5}
                  className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-[#00BFA6] resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-100 dark:border-gray-700">
              <button onClick={() => setShowCreate(false)} className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">
                Cancel
              </button>
              <button
                onClick={handleCreateTicket}
                disabled={creating || !newTicket.subject.trim() || !newTicket.description.trim()}
                className="px-5 py-2.5 text-sm font-medium bg-[#00BFA6] text-white rounded-xl hover:bg-[#00A892] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {creating ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiPlus className="w-4 h-4" />}
                Submit Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== TICKET DETAIL MODAL ===== */}
      {showDetail && selectedTicket && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700 shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold font-mono text-[#00BFA6]">{selectedTicket.tokenNumber}</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${getStatusConfig(selectedTicket.status).color}`}>
                    {getStatusConfig(selectedTicket.status).label}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${getPriorityConfig(selectedTicket.priority).color}`}>
                    {getPriorityConfig(selectedTicket.priority).label}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-[#0F2744] dark:text-white">{selectedTicket.subject}</h2>
              </div>
              <button onClick={() => { setShowDetail(false); setSelectedTicket(null); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">
                <FiX className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Info bar */}
            <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400 shrink-0">
              <span className="flex items-center gap-1"><FiCalendar className="w-3.5 h-3.5" /> Created: {formatDate(selectedTicket.createdAt)}</span>
              <span className="flex items-center gap-1"><FiTag className="w-3.5 h-3.5" /> {CATEGORIES.find(c => c.value === selectedTicket.category)?.label}</span>
              {selectedTicket.assignedTo && (
                <span className="flex items-center gap-1"><FiUser className="w-3.5 h-3.5" /> Assigned to: {selectedTicket.assignedTo.name}</span>
              )}
              {selectedTicket.resolvedAt && (
                <span className="flex items-center gap-1 text-green-600"><FiCheckCircle className="w-3.5 h-3.5" /> Resolved: {formatDate(selectedTicket.resolvedAt)}</span>
              )}
            </div>

            {/* Staff Call Review Info */}
            {selectedTicket.staffReview?.calledUser && (
              <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 bg-green-50 dark:bg-green-900/20 shrink-0">
                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                  <FiCheckCircle className="w-4 h-4" />
                  <span className="font-semibold">Staff called you regarding this ticket</span>
                  {selectedTicket.staffReview.resolvedByCall && (
                    <span className="ml-2 px-2 py-0.5 bg-green-200 dark:bg-green-800 rounded text-xs font-bold">Resolved by Call</span>
                  )}
                </div>
                {selectedTicket.staffReview.callNotes && (
                  <p className="text-xs text-green-600 dark:text-green-300 mt-1">{selectedTicket.staffReview.callNotes}</p>
                )}
              </div>
            )}

            {/* Messages / Notes */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50 dark:bg-gray-900/50">
              {selectedTicket.notes.map((note) => {
                const isUser = note.byRole === 'user';
                return (
                  <div key={note._id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] ${isUser ? 'order-1' : 'order-2'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          note.byRole === 'admin' ? 'bg-red-500 text-white' :
                          note.byRole === 'staff' ? 'bg-orange-500 text-white' :
                          'bg-[#00BFA6] text-white'
                        }`}>
                          {note.by?.name?.charAt(0) || '?'}
                        </div>
                        <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">
                          {note.by?.name || 'Unknown'} <span className="text-[10px] font-normal capitalize">({note.byRole})</span>
                        </span>
                      </div>
                      <div className={`px-4 py-3 rounded-2xl text-sm ${
                        isUser
                          ? 'bg-[#00BFA6] text-white rounded-br-md'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 shadow-sm rounded-bl-md'
                      }`}>
                        <p className="whitespace-pre-wrap">{note.message}</p>
                      </div>
                      <p className={`text-[10px] mt-1 ${isUser ? 'text-right' : 'text-left'} text-gray-400`}>
                        {formatDate(note.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply Input */}
            {selectedTicket.status !== 'closed' && (
              <div className="p-4 border-t border-gray-100 dark:border-gray-700 shrink-0">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(filterSafeText(e.target.value))}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                    placeholder="Type a reply..."
                    className="flex-1 px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-[#00BFA6]"
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={!newNote.trim() || sendingNote}
                    className="p-3 bg-[#00BFA6] text-white rounded-full hover:bg-[#00A892] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {sendingNote ? <FiLoader className="w-5 h-5 animate-spin" /> : <FiSend className="w-5 h-5" />}
                  </button>
                </div>
                {selectedTicket.status === 'resolved' && (
                  <p className="flex items-center gap-1 text-[11px] text-yellow-600 dark:text-yellow-400 mt-2">
                    <FiAlertTriangle className="w-3 h-3" /> Replying will reopen this ticket
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default SupportPage;
