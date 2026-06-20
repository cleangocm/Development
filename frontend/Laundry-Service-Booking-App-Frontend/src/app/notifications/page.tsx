'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FiBell, FiX, FiCheck, FiCheckCircle, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import {
  listUserNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/cleangoRepository';
import { useAuthStore } from '@/store/authStore';
import type { CleanGoNotification } from '@/types/cleango';

const NotificationsPage = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<CleanGoNotification[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<CleanGoNotification | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      if (!user) {
        setNotifications([]);
        setUnreadCount(0);
        setTotal(0);
        setTotalPages(1);
        return;
      }
      const allNotifications = await listUserNotifications(user.id, 100);
      const start = (page - 1) * 20;
      const currentPage = allNotifications.slice(start, start + 20);
      setNotifications(currentPage);
      setUnreadCount(allNotifications.filter((notification) => !notification.read).length);
      setTotal(allNotifications.length);
      setTotalPages(Math.max(1, Math.ceil(allNotifications.length / 20)));
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [page, user]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      fetchNotifications();
    } catch { /* ignore */ }
  };

  const markAllRead = async () => {
    try {
      if (!user) return;
      await markAllNotificationsRead(user.id);
      fetchNotifications();
    } catch { /* ignore */ }
  };

  const handleNotificationClick = (notification: CleanGoNotification) => {
    // Mark as read if unread
    if (!notification.read) markAsRead(notification.id);
    
    // Navigate to order details if orderId exists (for order-related notifications)
    if (notification.pickupId) {
      router.push(`/dashboard/orders/${notification.pickupId}`);
    } else {
      // Otherwise, show detail modal
      setSelectedNotification(notification);
    }
  };

  const closeDetail = () => setSelectedNotification(null);

  const notificationDate = (notification: CleanGoNotification) => {
    const value = notification.createdAt;
    return value?.toDate?.() || new Date();
  };

  const timeAgo = (notification: CleanGoNotification) => {
    const now = new Date();
    const date = notificationDate(notification);
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatDate = (notification: CleanGoNotification) => notificationDate(notification).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  const formatTime = (notification: CleanGoNotification) => notificationDate(notification).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 sm:pt-24 pb-12">
        <div className="container-custom px-4 sm:px-6 lg:px-8">
          {/* Header with mark all read */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'} • {total} total
            </p>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#00BFA6] hover:bg-[#00BFA6]/10 rounded-lg transition-colors"
              >
                <FiCheckCircle className="w-4 h-4" /> Mark all as read
              </button>
            )}
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Notifications List */}
            <div className="flex-1">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700 bg-[#0F2744] dark:bg-gray-800">
                  <h1 className="text-lg sm:text-xl font-bold text-white">All Notifications</h1>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {loading ? (
                    <div className="p-12 text-center text-gray-400">
                      <div className="w-8 h-8 border-2 border-[#00BFA6] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                      Loading notifications...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-12 text-center">
                      <FiBell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400 dark:text-gray-500">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <button
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`w-full p-4 sm:p-6 text-start hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                          !notification.read ? 'bg-[#00BFA6]/5' : ''
                        } ${selectedNotification?.id === notification.id ? 'ring-2 ring-inset ring-[#00BFA6]/30' : ''}`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-full shrink-0 ${!notification.read ? 'bg-[#00BFA6]/10' : 'bg-gray-100 dark:bg-gray-700'}`}>
                            <FiBell className={`w-5 h-5 ${!notification.read ? 'text-[#00BFA6]' : 'text-gray-400'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-gray-400 dark:text-gray-500">{timeAgo(notification)}</span>
                              {!notification.read && <span className="w-2 h-2 bg-[#00BFA6] rounded-full" />}
                            </div>
                            <h3 className={`font-semibold mb-1 ${!notification.read ? 'text-[#00BFA6]' : 'text-gray-700 dark:text-gray-300'}`}>
                              {notification.title}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{notification.body}</p>
                          </div>
                          {!notification.read && (
                            <button
                              onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}
                              className="p-1.5 text-gray-400 hover:text-[#00BFA6] shrink-0"
                              title="Mark as read"
                            >
                              <FiCheck className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-100 dark:border-gray-700">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700">
                      <FiChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Page {page} of {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700">
                      <FiChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Notification Detail - Desktop */}
            <div className="hidden lg:block w-80 xl:w-96">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden sticky top-28">
                <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700">
                  <h2 className="text-lg font-bold text-[#0F2744] dark:text-white">Notification Detail</h2>
                </div>

                {selectedNotification ? (
                  <div className="p-6">
                    <div className="flex justify-end mb-4">
                      <button onClick={closeDetail} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <FiX className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <FiBell className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
                        {formatTime(selectedNotification)}, {formatDate(selectedNotification)}
                      </p>
                      <span className="inline-block px-2 py-0.5 text-xs bg-[#00BFA6]/10 text-[#00BFA6] rounded-full mb-3 capitalize">{selectedNotification.type}</span>
                      <h3 className="font-semibold text-gray-800 dark:text-white mb-3">{selectedNotification.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{selectedNotification.body}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-400 dark:text-gray-500">
                    <FiBell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Select a notification to view details</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Notification Detail Modal */}
        {selectedNotification && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="fixed inset-0 bg-black/50" onClick={closeDetail} />
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-2xl p-6 animate-slide-up">
              <div className="flex justify-end mb-4">
                <button onClick={closeDetail} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <FiBell className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
                  {formatTime(selectedNotification)}, {formatDate(selectedNotification)}
                </p>
                <span className="inline-block px-2 py-0.5 text-xs bg-[#00BFA6]/10 text-[#00BFA6] rounded-full mb-3 capitalize">{selectedNotification.type}</span>
                <h3 className="font-semibold text-gray-800 dark:text-white mb-3">{selectedNotification.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedNotification.body}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default NotificationsPage;
