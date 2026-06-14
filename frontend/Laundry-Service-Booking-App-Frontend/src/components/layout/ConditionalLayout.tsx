'use client';

import { usePathname } from 'next/navigation';
import { Header, Footer } from '@/components/layout';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

const ConditionalLayout = ({ children }: ConditionalLayoutProps) => {
  const pathname = usePathname();

  // Auth pages have their own full-screen layout - hide header & footer
  const authRoutes = ['/login', '/signup', '/forgot-password', '/create-password', '/otp', '/success', '/admin/login', '/delivery/login', '/staff/login'];
  const isAuthPage = authRoutes.some((route) => pathname === route);

  // Panel pages keep header but hide footer
  const panelRoutes = ['/admin', '/delivery', '/staff', '/dashboard'];
  const isPanelPage = panelRoutes.some((route) => pathname.startsWith(route));

  // Hide header on auth pages AND admin/staff/delivery panel pages (they have their own headers)
  const adminStaffDeliveryRoutes = ['/admin', '/delivery', '/staff'];
  const isAdminStaffDelivery = adminStaffDeliveryRoutes.some((route) => pathname.startsWith(route));
  
  const hideHeader = isAuthPage || isAdminStaffDelivery;
  const hideFooter = isAuthPage || isPanelPage;

  return (
    <>
      {!hideHeader && <Header />}
      <main>{children}</main>
      {!hideFooter && <Footer />}
    </>
  );
};

export default ConditionalLayout;
