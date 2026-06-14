'use client';

import { useState, useEffect, useCallback } from 'react';
import DeliveryLayout from '@/components/delivery/DeliveryLayout';
import api from '@/services/api';
import { FiBell, FiLoader, FiCheck, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  orderId?: string;
  createdAt: string;
}

const DeliveryNotificationsPage = () => {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/notifications?page=${page}&limit=20`);
      if (res.data?.status === 'success') {
        setNotifications(res.data.data?.notifications || []);
        setUnreadCount(res.data.data?.unreadCount || 0);
        setTotal(res.data.data?.total || 0);
        setTotalPages(res.data.data?.totalPages || 1);
      }
    } catch { setNotifications([]); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    try { await api.put(`/notifications/${id}/read`); fetchNotifications(); } catch { /* */ }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) > 1 ? 's' : ''} ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order_assigned': return '📦';
      case 'pickup_confirmed': return '✅';
      case 'delivery_confirmed': return '🚚';
      case 'payment': return '💰';
      default: return '🔔';
    }
  };

  return (
    <DeliveryLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'} • {total} total
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><FiLoader className="w-8 h-8 text-[#148f77] animate-spin" /></div>
        ) : notifications.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-sm border border-gray-100 dark:border-gray-700">
            <FiBell className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Notifications</h3>
            <p className="text-gray-500 dark:text-gray-400">You&apos;ll be notified when orders are assigned to you</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
            {notifications.map((n) => (
              <div key={n._id}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${!n.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                onClick={() => {
                  if (!n.isRead) markAsRead(n._id);
                  if (n.orderId) router.push('/delivery/assigned');
                }}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0 text-lg">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{n.title}</h3>
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{n.message}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.isRead && (
                    <button onClick={(e) => { e.stopPropagation(); markAsRead(n._id); }}
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-400 hover:text-green-600 transition-colors shrink-0" title="Mark as read">
                      <FiCheck className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              className="p-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50">
              <FiChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-500 dark:text-gray-400">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="p-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50">
              <FiChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </DeliveryLayout>
  );
};

export default DeliveryNotificationsPage;
