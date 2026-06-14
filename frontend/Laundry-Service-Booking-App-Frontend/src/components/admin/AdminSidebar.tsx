'use client';

import Link from 'next/link';
import Image from 'next/image';
import SafeImage from '@/components/ui/SafeImage';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { 
  FiHome, FiUsers, FiPackage, FiShoppingBag, FiTruck, FiDollarSign, 
  FiTag, FiBarChart2, FiStar, FiSettings, FiLogOut, FiX, FiMapPin, FiMessageSquare,
  FiLifeBuoy, FiBell, FiUser,
} from 'react-icons/fi';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminSidebar = ({ isOpen, onClose }: AdminSidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const menuItems = [
    { icon: FiHome, label: 'Dashboard', href: '/admin' },
    { icon: FiShoppingBag, label: 'Orders', href: '/admin/orders' },
    { icon: FiUsers, label: 'Users', href: '/admin/users' },
    { icon: FiPackage, label: 'Services', href: '/admin/services' },
    { icon: FiMapPin, label: 'Stores', href: '/admin/stores' },
    { icon: FiTruck, label: 'Delivery', href: '/admin/delivery' },
    { icon: FiDollarSign, label: 'Payments', href: '/admin/payments' },
    { icon: FiTag, label: 'Coupons', href: '/admin/coupons' },
    { icon: FiBarChart2, label: 'Reports', href: '/admin/reports' },
    { icon: FiStar, label: 'Reviews', href: '/admin/reviews' },
    { icon: FiLifeBuoy, label: 'Tickets', href: '/admin/tickets' },
    { icon: FiBell, label: 'Notifications', href: '/admin/notifications' },
    { icon: FiMessageSquare, label: 'Contact Page', href: '/admin/contact' },
    { icon: FiSettings, label: 'Settings', href: '/admin/settings' },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm" onClick={onClose} />}

      <aside className={`
        fixed top-0 left-0 z-40 h-dvh w-65 bg-[#0F2744] text-white flex flex-col shrink-0
        transition-transform duration-300 ease-in-out
        lg:relative lg:h-full lg:z-0 lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-white/10">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-linear-to-br from-[#00BFA6] to-[#00A892] rounded-xl flex items-center justify-center shadow-lg shadow-[#00BFA6]/30 p-1.5">
              <Image src="/Images/logo/footer.png" alt="Ultra Wash" width={28} height={28} className="object-contain brightness-0 invert" />
            </div>
            <div>
              <h1 className="font-bold text-[15px] leading-tight tracking-tight">Ultra Wash</h1>
              <p className="text-[10px] text-[#00BFA6] font-semibold uppercase tracking-widest">Admin Panel</p>
            </div>
          </Link>
          <button onClick={onClose} className="lg:hidden p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Profile */}
        {user && (
          <div className="shrink-0 px-5 py-4 border-b border-white/10 flex items-center gap-3">
            <div className="w-11 h-11 rounded-full border-2 border-[#00BFA6]/40 overflow-hidden bg-linear-to-br from-[#00BFA6] to-[#00A892] shrink-0">
              {user.profileImage ? (
                <SafeImage src={user.profileImage} alt={user.name || 'Admin'} variant="avatar" width={44} height={44} className="w-full h-full object-cover" unoptimized />
              ) : user.name ? (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-sm font-bold text-white">{user.name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2)}</span>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center"><FiUser className="w-5 h-5 text-white/80" /></div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white text-sm truncate">{user.name}</p>
              <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {menuItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} onClick={onClose}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                  active
                    ? 'bg-[#00BFA6] text-white shadow-lg shadow-[#00BFA6]/25'
                    : 'text-gray-400 hover:bg-white/6 hover:text-white'
                }`}>
                <item.icon className={`w-4.5 h-4.5 shrink-0 transition-colors ${active ? 'text-white' : 'text-gray-500 group-hover:text-white'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="shrink-0 px-3 py-3 border-t border-white/10">
          <button onClick={() => { logout(); router.push('/admin/login'); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-gray-400 hover:bg-red-500/15 hover:text-red-400 transition-all duration-200">
            <FiLogOut className="w-4.5 h-4.5" /> Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
