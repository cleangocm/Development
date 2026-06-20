'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import SafeImage from '@/components/ui/SafeImage';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useAuthStore } from '@/store/authStore';
import { countUnreadNotifications } from '@/services/cleangoRepository';
import { 
  FiUser, FiPackage, FiMessageSquare, FiSettings, FiLogOut, 
  FiChevronDown, FiChevronUp, FiLock, FiBell, FiGlobe, FiMoon,
  FiHome, FiStar, FiTag, FiCalendar, FiCreditCard, FiMapPin
} from 'react-icons/fi';

interface DashboardSidebarProps {
  className?: string;
  onClose?: () => void;
}

const DashboardSidebar = ({ className = '', onClose }: DashboardSidebarProps) => {
  const pathname = usePathname();
  const { t } = useTheme();
  const { user, logout } = useAuthStore();
  const [settingsOpen, setSettingsOpen] = useState(pathname.includes('/dashboard/settings'));
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        if (!user) return;
        setUnreadNotifs(await countUnreadNotifications(user.id));
      } catch { /* ignore */ }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const menuItems = [
    { icon: FiHome, label: t('dashboard') || 'Dashboard', href: '/dashboard' },
    { icon: FiCalendar, label: 'My Subscription Plan', href: '/dashboard/book-pickup' },
    { icon: FiPackage, label: 'One-Off Pickup', href: '/dashboard/one-off-pickup' },
    { icon: FiCreditCard, label: 'Payments', href: '/dashboard/payment-account' },
    { icon: FiMapPin, label: 'My Address', href: '/dashboard/profile' },
    { icon: FiPackage, label: 'Pickup History', href: '/dashboard/orders' },
    { icon: FiBell, label: 'Notifications', href: '/notifications', badge: unreadNotifs },
    { icon: FiMessageSquare, label: 'Support', href: '/dashboard/support' },
    { icon: FiStar, label: 'Reviews', href: '/dashboard/reviews' },
    { icon: FiTag, label: 'Coupons', href: '/dashboard/coupons' },
    // { icon: FiCreditCard, label: t('paymentMethod') || 'Payment', href: '/dashboard/payment-method' },
  ] as { icon: React.ComponentType<{className?: string}>; label: string; href: string; badge?: number }[];

  const settingsItems = [
    { icon: FiLock, label: t('changePassword') || 'Password', href: '/dashboard/settings/password' },
    // { icon: FiBell, label: t('notification') || 'Notifications', href: '/dashboard/settings/notification' },
    { icon: FiGlobe, label: t('language') || 'Language', href: '/dashboard/settings/language' },
    { icon: FiMoon, label: t('theme') || 'Theme', href: '/dashboard/settings/theme' },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    if (href === '/notifications') return pathname === '/notifications';
    return pathname === href || pathname.startsWith(href + '/');
  };

  const handleNav = () => {
    if (onClose) onClose();
  };

  return (
    <aside className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden ${className}`}>
      {/* Profile */}
      <div className="p-6 flex flex-col items-center border-b border-gray-100 dark:border-gray-700 bg-linear-to-b from-[#0F2744]/5 to-transparent dark:from-white/5">
        <div className="w-20 h-20 rounded-full border-[3px] border-[#00BFA6]/30 shadow-lg overflow-hidden bg-linear-to-br from-[#0F2744] to-[#00BFA6]">
          {user?.profileImage ? (
            <SafeImage src={user.profileImage} alt={user.name || 'Profile'} variant="avatar" width={80} height={80} className="w-full h-full object-cover" unoptimized />
          ) : user?.name ? (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-xl font-bold text-white">{user.name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2)}</span>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center"><FiUser className="w-8 h-8 text-white/80" /></div>
          )}
        </div>
        {user && (
          <div className="mt-3 text-center">
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{user.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{user.email}</p>
            {user.role && (
              <span className={`inline-block mt-2 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                user.role === 'admin' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                user.role === 'delivery' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
                user.role === 'staff' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' :
                'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
              }`}>{user.role}</span>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="p-3">
        <ul className="space-y-0.5">
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href} onClick={handleNav}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                  isActive(item.href)
                    ? 'bg-[#0F2744] dark:bg-[#00BFA6] text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}>
                <item.icon className="w-4.5 h-4.5" />
                <span className="flex-1">{item.label}</span>
                {item.badge && item.badge > 0 ? (
                  <span className="ml-auto min-w-4.5 h-4.5 px-1 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}

          {/* Settings */}
          <li>
            <button onClick={() => setSettingsOpen(!settingsOpen)}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                pathname.includes('/dashboard/settings')
                  ? 'bg-[#0F2744] dark:bg-[#00BFA6] text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}>
              <div className="flex items-center gap-3"><FiSettings className="w-4.5 h-4.5" /> {t('settings') || 'Settings'}</div>
              {settingsOpen ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
            </button>
            {settingsOpen && (
              <ul className="mt-1 ml-3 pl-3 border-l-2 border-gray-200 dark:border-gray-600 space-y-0.5">
                {settingsItems.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} onClick={handleNav}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors ${
                        pathname === item.href
                          ? 'text-[#00BFA6] font-semibold bg-[#00BFA6]/10'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}>
                      <item.icon className="w-3.5 h-3.5" /> {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>

          {/* Logout */}
          <li className="pt-2 mt-2 border-t border-gray-100 dark:border-gray-700">
            <button onClick={() => { logout(); window.location.href = '/login'; }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all">
              <FiLogOut className="w-4.5 h-4.5" /> {t('logout') || 'Logout'}
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default DashboardSidebar;
