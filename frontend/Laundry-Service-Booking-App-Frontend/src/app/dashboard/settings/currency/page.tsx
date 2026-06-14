'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Currency is now controlled by admin only — redirect to settings
const CurrencySettingsPage = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/settings');
  }, [router]);

  return null;
};

export default CurrencySettingsPage;
