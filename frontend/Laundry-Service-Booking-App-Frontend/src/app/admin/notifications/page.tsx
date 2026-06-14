'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import api from '@/services/api';
import {
  FiBell, FiCheck, FiCheckCircle, FiPackage, FiDollarSign,
  FiTruck, FiAlertCircle, FiStar, FiMessageSquare, FiChevronLeft, FiChevronRight,
} from 'react-icons/fi';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  orderId?: string;
  createdAt: string;
}

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  order: { icon: FiPackage, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  payment: { icon: FiDollarSign, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
  delivery: { icon: FiTruck, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  system: { icon: FiAlertCircle, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  review: { icon: FiStar, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
  ticket: { icon: FiMessageSquare, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
};

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (filter === 'unread') params.set('unreadOnly', 'true');
      const res = await api.get(`/admin/notifications?${params}`);
      if (res.data?.status === 'success') {
        setNotifications(res.data.data.notifications || []);
        setUnreadCount(res.data.data.unreadCount || 0);
        setTotal(res.data.data.total || 0);
        setTotalPages(res.data.data.totalPages || 1);
      }
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/admin/notifications/${id}/read`);
      fetchNotifications();
    } catch { /* ignore */ }
  };

  const markAllRead = async () => {
    try {
      await api.put('/admin/notifications/all/read');
      fetchNotifications();
    } catch { /* ignore */ }
  };

  const timeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) > 1 ? 's' : ''} ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  return (
    <AdminLayout>
      <div className="p-4 lg:p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#00BFA6]/10 dark:bg-[#00BFA6]/20 rounded-xl flex items-center justify-center">
              <FiBell className="w-5 h-5 text-[#00BFA6]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'} • {total} total
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-2 px-4 py-2 bg-[#00BFA6] text-white rounded-lg hover:bg-[#00BFA6]/90 transition-colors text-sm"
            >
              <FiCheckCircle className="w-4 h-4" />
              Mark all as read
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          {(['all', 'unread'] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-[#00BFA6] text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {f === 'all' ? 'All' : 'Unread'}
            </button>
          ))}
        </div>

        {/* Notification List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400">
              <div className="w-8 h-8 border-2 border-[#00BFA6] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center">
              <FiBell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const config = typeConfig[notif.type] || typeConfig.system;
              const Icon = config.icon;
              return (
                <div
                  key={notif._id}
                  onClick={() => { if (!notif.isRead) markAsRead(notif._id); }}
                  className={`flex items-start gap-4 p-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${
                    !notif.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-gray-900 dark:text-white">{notif.title}</p>
                      {!notif.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{notif.message}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{timeAgo(notif.createdAt)}</p>
                  </div>
                  {!notif.isRead && (
                    <button
                      onClick={(e) => { e.stopPropagation(); markAsRead(notif._id); }}
                      className="p-1.5 text-gray-400 hover:text-[#00BFA6] hover:bg-[#00BFA6]/10 rounded-lg transition-colors shrink-0"
                      title="Mark as read"
                    >
                      <FiCheck className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <FiChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
