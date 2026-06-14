'use client';

import Link from 'next/link';
import SafeImage from '@/components/ui/SafeImage';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { 
  FiHome, 
  FiShoppingBag, 
  FiPackage, 
  FiStar, 
  FiLogOut,
  FiX,
  FiUsers,
  FiUser,
  FiMessageSquare
} from 'react-icons/fi';

interface StaffSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const StaffSidebar = ({ isOpen, onClose }: StaffSidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const menuItems = [
    { icon: FiHome, label: 'Dashboard', href: '/staff' },
    { icon: FiShoppingBag, label: 'Orders', href: '/staff/orders' },
    { icon: FiPackage, label: 'Services', href: '/staff/services' },
    { icon: FiUsers, label: 'Customers', href: '/staff/customers' },
    { icon: FiStar, label: 'Reviews', href: '/staff/reviews' },
    { icon: FiMessageSquare, label: 'Messages', href: '/staff/messages' },
    { icon: FiUser, label: 'Profile', href: '/staff/profile' },
  ];

  const isActive = (href: string) => {
    if (href === '/staff') return pathname === '/staff';
    return pathname.startsWith(href);
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 left-0 z-40 h-screen w-64 bg-[#1a5276] text-white transform transition-transform duration-300 ease-in-out flex flex-col
        lg:translate-x-0 lg:sticky lg:top-0 lg:z-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <Link href="/staff" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-linear-to-br from-[#2e86c1] to-[#2471a3] rounded-xl flex items-center justify-center shadow-lg shadow-[#2e86c1]/30">
              <span className="text-white font-black text-sm">UW</span>
            </div>
            <div>
              <h1 className="font-bold text-[15px] leading-tight">Ultra Wash</h1>
              <p className="text-[10px] text-[#2e86c1] font-semibold uppercase tracking-widest">Staff Panel</p>
            </div>
          </Link>
          <button 
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Profile */}
        {user && (
          <div className="shrink-0 px-4 py-4 border-b border-white/10 flex items-center gap-3">
            <div className="w-11 h-11 rounded-full border-2 border-[#2e86c1]/40 overflow-hidden bg-linear-to-br from-[#2e86c1] to-[#2471a3] shrink-0">
              {user.profileImage ? (
                <SafeImage src={user.profileImage} alt={user.name || 'Staff'} variant="avatar" width={44} height={44} className="w-full h-full object-cover" unoptimized />
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
              <p className="text-[11px] text-gray-300 truncate">{user.email}</p>
            </div>
          </div>
        )}

        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    isActive(item.href)
                      ? 'bg-[#2e86c1] text-white shadow-lg'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-white/10 bg-[#1a5276]">
          <button
            onClick={() => {
              logout();
              router.push('/staff/login');
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-red-500/20 hover:text-red-400 transition-all duration-200"
          >
            <FiLogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default StaffSidebar;
