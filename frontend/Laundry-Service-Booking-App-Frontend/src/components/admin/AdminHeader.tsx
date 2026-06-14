'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import SafeImage from '@/components/ui/SafeImage';
import { useRouter } from 'next/navigation';
import { FiMenu, FiBell, FiUser, FiSettings, FiLogOut, FiSun, FiMoon, FiCheck } from 'react-icons/fi';
import { useTheme } from '@/context/ThemeContext';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  orderId?: string;
  createdAt: string;
}

interface AdminHeaderProps {
  onMenuClick: () => void;
}

const AdminHeader = ({ onMenuClick }: AdminHeaderProps) => {
  const { isDark, setTheme } = useTheme();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/admin/notifications?limit=10');
      if (res.data?.status === 'success') {
        setNotifications(res.data.data.notifications || []);
        setUnreadCount(res.data.data.unreadCount || 0);
      }
    } catch {
      // Silently fail - notifications are not critical
    }
  }, []);

  const notifFetched = useRef(false);
  useEffect(() => {
    // Poll every 30 seconds; also fetch immediately on first mount
    const doFetch = () => void fetchNotifications();
    if (!notifFetched.current) {
      notifFetched.current = true;
      doFetch();
    }
    const interval = setInterval(doFetch, 30000);
    return () => clearInterval(interval);
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
    return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) > 1 ? 's' : ''} ago`;
  };

  const getAdminInitials = () => {
    if (!user?.name) return 'A';
    const names = user.name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return user.name.substring(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  return (
    <header className="shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        {/* Left Side */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <FiMenu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>

          <h2 className="hidden sm:block text-lg font-semibold text-gray-900 dark:text-white">Admin Panel</h2>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle - Animated Switch */}
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={`relative w-14 h-7 rounded-full transition-all duration-500 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#00BFA6]/50 ${
              isDark
                ? 'bg-linear-to-r from-indigo-600 to-purple-600 shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                : 'bg-linear-to-r from-amber-300 to-orange-300 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
            }`}
            aria-label="Toggle theme"
          >
            <span className={`absolute top-1 left-1.5 text-[10px] transition-opacity duration-300 ${isDark ? 'opacity-100' : 'opacity-0'}`}>🌙</span>
            <span className={`absolute top-1 right-1.5 text-[10px] transition-opacity duration-300 ${isDark ? 'opacity-0' : 'opacity-100'}`}>☀️</span>
            <span
              className={`absolute top-0.5 w-6 h-6 rounded-full shadow-md transition-all duration-500 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)] flex items-center justify-center ${
                isDark
                  ? 'translate-x-7 bg-gray-900 rotate-360'
                  : 'translate-x-0.5 bg-white rotate-0'
              }`}
            >
              {isDark ? (
                <FiMoon className="w-3.5 h-3.5 text-indigo-300" />
              ) : (
                <FiSun className="w-3.5 h-3.5 text-amber-500" />
              )}
            </span>
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FiBell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4.5 h-4.5 px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-[#00BFA6] hover:underline flex items-center gap-1">
                        <FiCheck className="w-3 h-3" /> Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-gray-400 dark:text-gray-500 text-sm">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif._id}
                          onClick={() => {
                            if (!notif.isRead) markAsRead(notif._id);
                            // Navigate to order page if orderId exists
                            if (notif.orderId) {
                              setShowNotifications(false);
                              router.push(`/admin/orders/${notif.orderId}`);
                            }
                          }}
                          className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                            !notif.isRead ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 mt-2 rounded-full shrink-0 ${!notif.isRead ? 'bg-blue-500' : 'bg-transparent'}`} />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-gray-900 dark:text-white">{notif.title}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{notif.message}</p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{timeAgo(notif.createdAt)}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-3 text-center border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => { setShowNotifications(false); router.push('/admin/notifications'); }}
                      className="text-sm text-[#00BFA6] hover:underline"
                    >
                      View all notifications
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {user?.profileImage ? (
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200">
                  <SafeImage
                    src={user.profileImage}
                    alt={user.name || 'Admin'}
                    variant="avatar"
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#0F2744] dark:bg-[#00BFA6] border-2 border-[#0F2744] dark:border-[#00BFA6] flex items-center justify-center">
                  <span className="text-white font-bold text-xs">{getAdminInitials()}</span>
                </div>
              )}
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{user?.name || 'Admin'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role === 'admin' ? 'Administrator' : 'User'}</p>
              </div>
            </button>

            {showProfileMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                  <div className="py-2">
                    <Link
                      href="/admin/profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <FiUser className="w-4 h-4" />
                      Profile
                    </Link>
                    <Link
                      href="/admin/settings"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <FiSettings className="w-4 h-4" />
                      Settings
                    </Link>
                    <hr className="my-2 border-gray-200 dark:border-gray-700" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <FiLogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
