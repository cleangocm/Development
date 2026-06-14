'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { filterSafeText } from '@/lib/inputValidation';
import { FiSend, FiSearch, FiMessageCircle, FiClock, FiCheckCircle, FiAlertCircle, FiLoader, FiArrowLeft } from 'react-icons/fi';

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
  notes: TicketNote[];
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof FiClock }> = {
  open: { label: 'Open', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30', icon: FiAlertCircle },
  assigned: { label: 'Assigned', color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30', icon: FiLoader },
  in_progress: { label: 'In Progress', color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30', icon: FiLoader },
  resolved: { label: 'Resolved', color: 'text-green-600 bg-green-100 dark:bg-green-900/30', icon: FiCheckCircle },
  closed: { label: 'Closed', color: 'text-gray-500 bg-gray-100 dark:bg-gray-700', icon: FiCheckCircle },
};

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

const ChatPage = () => {
  const { showToast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/tickets/my-tickets');
      if (res.data.status === 'success') {
        const ticketList = res.data.data?.tickets || res.data.data || [];
        setTickets(Array.isArray(ticketList) ? ticketList : []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    scrollToBottom();
  }, [selectedTicket?.notes?.length]);

  const refreshSelectedTicket = useCallback(async (ticketId: string) => {
    try {
      const res = await api.get(`/tickets/${ticketId}`);
      if (res.data.status === 'success') {
        setSelectedTicket(res.data.data);
        setTickets(prev => prev.map(t => t._id === ticketId ? res.data.data : t));
      }
    } catch { /* silent */ }
  }, []);

  const handleSelectTicket = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowMobileChat(true);
    await refreshSelectedTicket(ticket._id);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket || sending) return;
    try {
      setSending(true);
      await api.post(`/tickets/${selectedTicket._id}/notes`, { message: newMessage });
      setNewMessage('');
      await refreshSelectedTicket(selectedTicket._id);
    } catch {
      showToast('Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (!selectedTicket) return;
    const interval = setInterval(() => refreshSelectedTicket(selectedTicket._id), 10000);
    return () => clearInterval(interval);
  }, [selectedTicket, refreshSelectedTicket]);

  const filteredTickets = tickets.filter(t =>
    t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.tokenNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getLastMessage = (ticket: Ticket) => {
    if (ticket.notes.length > 0) return ticket.notes[ticket.notes.length - 1].message;
    return ticket.description;
  };

  const getLastTime = (ticket: Ticket) => {
    if (ticket.notes.length > 0) return timeAgo(ticket.notes[ticket.notes.length - 1].createdAt);
    return timeAgo(ticket.createdAt);
  };

  const statusInfo = (status: string) => STATUS_CONFIG[status] || STATUS_CONFIG.open;

  return (
    <DashboardLayout>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden h-[calc(100vh-200px)] min-h-[500px]">
        <div className="flex h-full">
          {/* Ticket List */}
          <div className={`w-full md:w-80 border-e border-gray-100 dark:border-gray-700 flex flex-col ${showMobileChat ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-[#0F2744] dark:text-white mb-3">Support Chat</h2>
              <div className="relative">
                <FiSearch className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tickets..."
                  className="w-full pl-10 rtl:pl-3 rtl:pr-10 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-[#00BFA6]"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <FiLoader className="w-6 h-6 text-[#00BFA6] animate-spin mb-2" />
                  <p className="text-sm text-gray-500">Loading tickets...</p>
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <FiMessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">No support tickets yet</p>
                  <p className="text-xs text-gray-400">Create a ticket from the Support page to start a conversation</p>
                </div>
              ) : (
                filteredTickets.map((ticket) => {
                  const si = statusInfo(ticket.status);
                  return (
                    <button
                      key={ticket._id}
                      onClick={() => handleSelectTicket(ticket)}
                      className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-start border-b border-gray-50 dark:border-gray-700/50 ${
                        selectedTicket?._id === ticket._id ? 'bg-[#00BFA6]/10' : ''
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${si.color}`}>
                        <si.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-[#0F2744] dark:text-white text-sm truncate">{ticket.subject}</p>
                          <span className="text-[10px] text-gray-400 shrink-0">{getLastTime(ticket)}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">#{ticket.tokenNumber}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                          {getLastMessage(ticket).substring(0, 60)}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className={`flex-1 flex flex-col ${!showMobileChat ? 'hidden md:flex' : 'flex'}`}>
            {!selectedTicket ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                  <FiMessageCircle className="w-10 h-10 text-gray-300 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Select a Ticket</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                  Choose a support ticket from the list to view the conversation and send messages.
                </p>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
                  <button
                    onClick={() => { setShowMobileChat(false); setSelectedTicket(null); }}
                    className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <FiArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </button>
                  <div>
                    <p className="font-semibold text-[#0F2744] dark:text-white text-sm">{selectedTicket.subject}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-gray-400">#{selectedTicket.tokenNumber}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${statusInfo(selectedTicket.status).color}`}>
                        {statusInfo(selectedTicket.status).label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
                  {/* Initial ticket description */}
                  <div className="flex justify-end">
                    <div className="max-w-[75%] px-4 py-3 rounded-2xl bg-[#00BFA6] text-white rounded-br-md">
                      <p className="text-sm">{selectedTicket.description}</p>
                      <p className="text-xs mt-1 text-white/70">
                        {new Date(selectedTicket.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {selectedTicket.notes.map((note) => {
                    const isUser = note.byRole === 'user';
                    return (
                      <div key={note._id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                        {!isUser && (
                          <div className="w-8 h-8 rounded-full bg-[#0F2744] dark:bg-[#00BFA6] flex items-center justify-center text-white text-xs font-bold mr-2 shrink-0 self-end">
                            {note.by?.name?.charAt(0)?.toUpperCase() || 'S'}
                          </div>
                        )}
                        <div
                          className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                            isUser
                              ? 'bg-[#00BFA6] text-white rounded-br-md'
                              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 shadow-sm rounded-bl-md'
                          }`}
                        >
                          {!isUser && (
                            <p className="text-[10px] font-semibold mb-1 text-[#00BFA6] dark:text-[#00BFA6]">
                              {note.by?.name || 'Support'} &bull; {note.byRole}
                            </p>
                          )}
                          <p className="text-sm">{note.message}</p>
                          <p className={`text-xs mt-1 ${isUser ? 'text-white/70' : 'text-gray-400'}`}>
                            {new Date(note.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                {selectedTicket.status !== 'closed' ? (
                  <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(filterSafeText(e.target.value))}
                          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                          placeholder="Type a message..."
                          className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-[#00BFA6] text-sm"
                        />
                      </div>
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sending}
                        className="p-3 bg-[#00BFA6] text-white rounded-full hover:bg-[#00A892] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sending ? (
                          <FiLoader className="w-5 h-5 animate-spin" />
                        ) : (
                          <FiSend className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {selectedTicket.status === 'resolved' && (
                      <p className="text-[11px] text-yellow-600 dark:text-yellow-400 mt-2 text-center">
                        Replying will reopen this ticket
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-4 border-t border-gray-100 dark:border-gray-700 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      This ticket has been closed. Create a new support ticket to continue.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ChatPage;
