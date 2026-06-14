'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import SafeImage from '@/components/ui/SafeImage';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useAuthStore } from '@/store/authStore';
import { useStoreStore } from '@/store/storeStore';
import { FiUser, FiLogOut, FiGrid, FiShoppingCart, FiMapPin, FiBell } from 'react-icons/fi';
import api from '@/services/api';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [cartCount, setCartCount] = useState(() => {
    // Initialize cart count from localStorage immediately (no effect needed)
    if (typeof window === 'undefined') return 0;
    try {
      const savedGroups = localStorage.getItem('cartGroups');
      if (savedGroups) {
        const groups = JSON.parse(savedGroups);
        return groups.reduce((sum: number, g: { items: { quantity: number }[] }) => 
          sum + g.items.reduce((s: number, i: { quantity: number }) => s + (i.quantity || 1), 0), 0);
      }
      const savedItems = localStorage.getItem('cartItems');
      if (savedItems) {
        const items = JSON.parse(savedItems);
        return items.reduce((s: number, i: { quantity: number }) => s + (i.quantity || 1), 0);
      }
    } catch { /* */ }
    return 0;
  });
  const [headerLogo, setHeaderLogo] = useState('');
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const profileRef = useRef<HTMLDivElement>(null);
  const { t } = useTheme();
  const { user, logout, isAuthenticated, checkAuth } = useAuthStore();
  const { userLocation: gpsLocation, getUserLocation } = useStoreStore();
  const router = useRouter();

  // Compute user location: prefer GPS location, fallback to user address
  const userLocation = useMemo(() => {
    // Helper: return first address part with no digits; strip digits as fallback
    const toShort = (address: string) => {
      const parts = address.split(',');
      const clean = parts.find(p => !/\d/.test(p.trim())) || parts[0];
      return clean.trim().replace(/\d+/g, '').replace(/\s+/g, ' ').trim();
    };
    // First try GPS-detected location from storeStore
    if (gpsLocation?.address && !gpsLocation.isDefault) {
      // Prefer the dedicated shortName stored alongside the full address
      return gpsLocation.shortName || toShort(gpsLocation.address) || 'Near You';
    }
    // Fallback to user address from auth
    if (isAuthenticated && user?.address) {
      return toShort(user.address) || user.address.substring(0, 20);
    }
    // If GPS location is default (denied), show prompt
    if (gpsLocation?.isDefault) {
      return 'Allow Location';
    }
    return '';
  }, [gpsLocation, isAuthenticated, user]);

  const navItems = [
    { label: t('home'), href: '/' },
    { label: t('services'), href: '/services' },
    { label: 'Stores', href: '/stores' },
    { label: t('aboutUs'), href: '/about' },
    { label: t('contactUs'), href: '/contact' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check auth status on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Auto-detect GPS location ONCE on mount for the header location badge
  const locationDetected = useRef(false);
  useEffect(() => {
    if (!locationDetected.current) {
      locationDetected.current = true;
      // Only detect if we don't already have a real GPS location in the store
      const currentLoc = useStoreStore.getState().userLocation;
      if (!currentLoc || currentLoc.isDefault) {
        getUserLocation();
      }
    }
  }, [getUserLocation]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  // Track cart count from localStorage — event-driven, no polling
  const updateCartCount = useCallback(() => {
    try {
      const savedGroups = localStorage.getItem('cartGroups');
      if (savedGroups) {
        const groups = JSON.parse(savedGroups);
        const total = groups.reduce((sum: number, g: { items: { quantity: number }[] }) => 
          sum + g.items.reduce((s: number, i: { quantity: number }) => s + (i.quantity || 1), 0), 0);
        setCartCount(total);
      } else {
        const savedItems = localStorage.getItem('cartItems');
        if (savedItems) {
          const items = JSON.parse(savedItems);
          setCartCount(items.reduce((s: number, i: { quantity: number }) => s + (i.quantity || 1), 0));
        } else {
          setCartCount(0);
        }
      }
    } catch { setCartCount(0); }
  }, []);

  useEffect(() => {
    // Listen for cross-tab storage changes
    window.addEventListener('storage', updateCartCount);
    // Listen for same-tab cart updates via custom event
    window.addEventListener('cart-updated', updateCartCount);
    return () => {
      window.removeEventListener('storage', updateCartCount);
      window.removeEventListener('cart-updated', updateCartCount);
    };
  }, [updateCartCount]);

  // Fetch header logo
  useEffect(() => {
    const fetchHeaderLogo = async () => {
      try {
        const siteRes = await api.get('/public/site-settings');
        if (siteRes.data?.status === 'success' && siteRes.data?.data?.headerLogo) {
          setHeaderLogo(siteRes.data.data.headerLogo);
        }
      } catch { /* use default */ }
    };
    fetchHeaderLogo();
  }, []);

  // Fetch unread notification count for logged-in users
  useEffect(() => {
    if (!isAuthenticated || !user) { 
      return; 
    }
    const fetchUnread = async () => {
      try {
        const endpoint = user.role === 'admin' ? '/admin/notifications?limit=1' : '/notifications?limit=1';
        const res = await api.get(endpoint);
        if (res.data?.status === 'success') {
          setUnreadNotifs(res.data.unreadCount ?? 0);
        }
      } catch { /* silent */ }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  // Handle logout
  const onLogout = () => {
    logout();
    setIsProfileOpen(false);
    router.push('/');
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.name) return 'U';
    const names = user.name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return user.name.substring(0, 2).toUpperCase();
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white dark:bg-gray-900 shadow-lg dark:shadow-gray-800/30 py-3'
          : 'bg-white/95 dark:bg-gray-900/95 py-4'
      }`}
    >
      <div className="container-custom">
        <nav className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-36 h-10 transition-transform duration-300 group-hover:scale-105">
              <Image
                src={headerLogo || '/Images/logo/header.png'}
                alt="Ultra Wash Logo"
                fill
                sizes="(max-width: 768px) 9rem, 10rem"
                className="object-contain dark:brightness-0 dark:invert"
                unoptimized={!!headerLogo}
                priority={!headerLogo}
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4 lg:gap-8">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-base text-[#5a6a7a] dark:text-gray-300 font-medium transition-all duration-300 hover:text-[#1A3A5D] dark:hover:text-white relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-[#1A3A5D] dark:after:bg-[#00BFA6] after:transition-all after:duration-300 hover:after:w-full"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Login/Profile Button */}
          <div className="hidden md:flex items-center gap-3 relative" ref={profileRef}>
            {/* User Location Badge */}
            {userLocation && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full">
                <FiMapPin className="w-3.5 h-3.5 text-[#00BFA6]" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300 max-w-24 truncate">{userLocation}</span>
              </div>
            )}

            {/* Cart Icon */}
            {isAuthenticated && user && (
              <Link href="/cart" className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label="Cart">
                <FiShoppingCart className="w-5 h-5 text-[#5a6a7a] dark:text-gray-300" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#00BFA6] text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
            )}

            {isAuthenticated && user ? (
              <div>
                {/* Profile Avatar */}
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-gray-200 dark:ring-gray-600 hover:ring-[#00BFA6] dark:hover:ring-[#00BFA6] transition-all duration-300 hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-[#00BFA6]"
                  aria-label="Open profile menu"
                >
                  {user.profileImage ? (
                    <SafeImage
                      src={user.profileImage}
                      alt={user.name}
                      variant="avatar"
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#0f2744] dark:bg-[#00BFA6] flex items-center justify-center text-white font-bold text-sm">
                      {getUserInitials()}
                    </div>
                  )}
                </button>

                {/* Profile Dropdown */}
                {isProfileOpen && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 animate-fade-in-up z-50">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
                      {user.profileImage ? (
                        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                          <SafeImage
                            src={user.profileImage}
                            alt={user.name}
                            variant="avatar"
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#0f2744] dark:bg-[#00BFA6] flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {getUserInitials()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#0f2744] dark:text-white truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{user.email}</p>
                        {user.phone && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.phone}</p>
                        )}
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      {user.role === 'admin' && (
                        <Link
                          href="/admin"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#00BFA6] font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <FiGrid className="w-4 h-4" />
                          <span>Admin Panel</span>
                        </Link>
                      )}
                      <Link
                        href={user.role === 'admin' ? '/admin' : user.role === 'collector' || user.role === 'delivery' ? '/delivery' : user.role === 'staff' ? '/staff' : '/dashboard/orders'}
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#5a6a7a] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <FiGrid className="w-4 h-4" />
                        <span>Dashboard</span>
                      </Link>
                    
                      <Link
                        href={user.role === 'admin' ? '/admin/profile' : user.role === 'collector' || user.role === 'delivery' ? '/delivery/profile' : '/dashboard/profile'}
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#5a6a7a] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <FiUser className="w-4 h-4" />
                        <span>Profile</span>
                      </Link>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                      <button
                        onClick={onLogout}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <FiLogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link 
                href="/login" 
                className="bg-[#0f2744] dark:bg-[#00BFA6] text-white px-8 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 hover:bg-[#1a3a5c] dark:hover:bg-[#00A892] hover:shadow-lg hover:-translate-y-0.5"
              >
                {t('login')}
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span
              className={`w-6 h-0.5 bg-[#0f2744] dark:bg-white transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}
            ></span>
            <span
              className={`w-6 h-0.5 bg-[#0f2744] dark:bg-white transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}
            ></span>
            <span
              className={`w-6 h-0.5 bg-[#0f2744] dark:bg-white transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}
            ></span>
          </button>
        </nav>

        {/* Mobile Menu Backdrop */}
        {isMobileMenuOpen && (
          <div
            className="md:hidden fixed inset-0 top-0 bg-black/40 z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Menu */}
        <div
          className={`md:hidden absolute top-full left-0 right-0 bg-white dark:bg-gray-900 shadow-lg dark:shadow-gray-800/30 transition-all duration-300 z-50 max-h-[calc(100dvh-4rem)] overflow-y-auto ${
            isMobileMenuOpen
              ? 'opacity-100 visible translate-y-0'
              : 'opacity-0 invisible -translate-y-4' 
          }`}
        >
          <div className="flex flex-col p-4 gap-4">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-[#5a6a7a] dark:text-gray-300 font-medium py-2 hover:text-[#1A3A5D] dark:hover:text-white transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            {/* Location Badge (mobile) */}
            {userLocation && (
              <div className="flex items-center gap-1.5 py-2">
                <FiMapPin className="w-3.5 h-3.5 text-[#00BFA6]" />
                <span className="text-xs text-gray-500 dark:text-gray-400">{userLocation}</span>
              </div>
            )}

            {isAuthenticated && user ? (
              <>
                {/* User Info */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 pb-2">
                  <p className="text-sm font-semibold text-[#0f2744] dark:text-white">{user.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{user.email}</p>
                  {userLocation && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <FiMapPin className="w-3.5 h-3.5 text-[#00BFA6]" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">{userLocation}</span>
                    </div>
                  )}
                </div>

                {/* Cart Link */}
                <Link 
                  href="/cart"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-[#5a6a7a] dark:text-gray-300 font-medium py-2 hover:text-[#1A3A5D] dark:hover:text-white transition-colors"
                >
                  <FiShoppingCart className="w-4 h-4" />
                  <span>Cart</span>
                  {cartCount > 0 && (
                    <span className="ml-auto px-2 py-0.5 bg-[#00BFA6] text-white text-xs font-bold rounded-full">{cartCount}</span>
                  )}
                </Link>

                {/* Notifications Link */}
                <Link 
                  href={user.role === 'admin' ? '/admin/notifications' : '/notifications'}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-[#5a6a7a] dark:text-gray-300 font-medium py-2 hover:text-[#1A3A5D] dark:hover:text-white transition-colors"
                >
                  <FiBell className="w-4 h-4" />
                  <span>Notifications</span>
                  {unreadNotifs > 0 && (
                    <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">{unreadNotifs}</span>
                  )}
                </Link>
                
                {/* Dashboard Links */}
                <Link 
                  href={user.role === 'admin' ? '/admin' : user.role === 'collector' || user.role === 'delivery' ? '/delivery' : user.role === 'staff' ? '/staff' : '/dashboard/orders'}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-[#5a6a7a] dark:text-gray-300 font-medium py-2 hover:text-[#1A3A5D] dark:hover:text-white transition-colors"
                >
                  <FiGrid className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                <Link 
                  href={user.role === 'admin' ? '/admin/profile' : user.role === 'collector' || user.role === 'delivery' ? '/delivery/profile' : '/dashboard/profile'}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-[#5a6a7a] dark:text-gray-300 font-medium py-2 hover:text-[#1A3A5D] dark:hover:text-white transition-colors"
                >
                  <FiUser className="w-4 h-4" />
                  <span>Profile</span>
                </Link>
                
                {/* Logout Button */}
                <button 
                  onClick={() => {
                    onLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-2 bg-red-600 dark:bg-red-500 text-white px-6 py-3 rounded-lg text-sm font-semibold w-full hover:bg-red-700 dark:hover:bg-red-600 transition-colors mt-2"
                >
                  <FiLogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <Link 
                href="/login" 
                className="bg-[#0f2744] dark:bg-[#00BFA6] text-white px-6 py-3 rounded-lg text-sm font-semibold w-full text-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t('login')}
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
