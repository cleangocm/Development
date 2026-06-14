'use client';

import { ReactNode, useState } from 'react';
import DashboardSidebar from './DashboardSidebar';
import Footer from '@/components/layout/Footer';
import { FiMenu, FiX } from 'react-icons/fi';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 sm:pt-24 pb-12 transition-colors duration-300">
      <div className="max-w-360 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Mobile Toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#0F2744] dark:bg-[#00BFA6] text-white rounded-full shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
          >
            {sidebarOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
          </button>

          {/* Mobile Overlay */}
          {sidebarOpen && (
            <div
              className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <div
            className={`w-75 xl:w-80 shrink-0 fixed lg:relative inset-y-0 left-0 z-50 lg:z-0 transform transition-transform duration-300 ease-in-out rtl:left-auto rtl:right-0 ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            }`}
          >
            <div className="lg:sticky lg:top-24 h-dvh lg:h-auto overflow-y-auto lg:overflow-visible bg-gray-50 dark:bg-gray-900 lg:bg-transparent p-4 lg:p-0">
              <DashboardSidebar onClose={() => setSidebarOpen(false)} />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {children}
          </div>
        </div>
      </div>
    </main>
    <Footer />
    </>
  );
};

export default DashboardLayout;
