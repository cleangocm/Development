'use client';

import { ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const { checkAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('auth_user');
    
    if (!token || !userStr) {
      router.push('/admin/login');
      return;
    }
    
    try {
      const userData = JSON.parse(userStr);
      if (userData.role !== 'admin') {
        router.push('/admin/login');
        return;
      }
    } catch {
      router.push('/admin/login');
      return;
    }
    
    setTimeout(() => setIsChecking(false), 0);
  }, [checkAuth, router]);

  if (isChecking) {
    return (
      <div className="h-dvh bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#00BFA6] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Admin Header */}
      <AdminHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      {/* Body: Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main scrollable content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
