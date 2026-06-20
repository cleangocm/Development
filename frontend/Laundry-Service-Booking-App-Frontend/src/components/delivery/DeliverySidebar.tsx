'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import SafeImage from '@/components/ui/SafeImage';
import { 
  FiHome, 
  FiPackage, 
  FiTruck, 
  FiCheckCircle,
  FiLogOut,
  FiX,
  FiUser,
  FiMapPin,
  FiClock,
  FiBell
} from 'react-icons/fi';

interface DeliverySidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const DeliverySidebar = ({ isOpen, onClose }: DeliverySidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const menuItems = [
    { icon: FiHome, label: 'Dashboard', href: '/delivery' },
    { icon: FiPackage, label: 'Today', href: '/delivery/assigned' },
    { icon: FiClock, label: 'Tomorrow', href: '/delivery/pickup' },
    { icon: FiTruck, label: 'Missed', href: '/delivery/in-transit' },
    { icon: FiCheckCircle, label: 'Completed', href: '/delivery/completed' },
    { icon: FiMapPin, label: 'Order Info', href: '/delivery/route' },
    { icon: FiBell, label: 'Notifications', href: '/delivery/notifications' },
    { icon: FiUser, label: 'Profile', href: '/delivery/profile' },
  ];

  const isActive = (href: string) => {
    if (href === '/delivery') return pathname === '/delivery';
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
        fixed top-0 left-0 z-40 h-dvh w-64 bg-[#0e6251] text-white transform transition-transform duration-300 ease-in-out flex flex-col
        lg:translate-x-0 lg:sticky lg:top-0 lg:z-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <Link href="/delivery" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shadow-lg shadow-[#148f77]/30 p-1">
              <Image src="/Images/brand/cleango-app-icon.png" alt="CleanGo CM" width={32} height={32} className="rounded-lg object-cover" />
            </div>
            <div>
              <h1 className="font-bold text-[15px] leading-tight">CleanGo CM</h1>
              <p className="text-[10px] text-[#148f77] font-semibold uppercase tracking-widest">Delivery Panel</p>
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
            <div className="w-11 h-11 rounded-full border-2 border-[#148f77]/40 overflow-hidden bg-linear-to-br from-[#148f77] to-[#117a65] shrink-0">
              {user.profileImage ? (
                <SafeImage src={user.profileImage} alt={user.name || 'Delivery'} variant="avatar" width={44} height={44} className="w-full h-full object-cover" unoptimized />
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
                      ? 'bg-[#148f77] text-white shadow-lg'
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

        <div className="p-4 border-t border-white/10 bg-[#0e6251]">
          <button
            onClick={() => {
              logout();
              router.push('/delivery/login');
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

export default DeliverySidebar;
