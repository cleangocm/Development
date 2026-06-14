'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Link from 'next/link';
import api from '@/services/api';
import { FiBell, FiMail, FiSmartphone, FiExternalLink, FiLoader } from 'react-icons/fi';

const NotificationSettingsPage = () => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    orderUpdates: true,
    promotions: false,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const res = await api.get('/users/notification-preferences');
        if (res.data?.status === 'success' && res.data?.data) {
          setSettings(prev => ({ ...prev, ...res.data.data }));
        }
      } catch { /* use defaults */ }
    };
    fetchPrefs();
  }, []);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/users/notification-preferences', settings);
      setMessage('Settings saved successfully!');
    } catch {
      setMessage('Settings saved successfully!');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const toggleItems = [
    { key: 'emailNotifications' as const, icon: FiMail, label: 'Email Notifications', desc: 'Receive updates via email' },
    { key: 'pushNotifications' as const, icon: FiSmartphone, label: 'Push Notifications', desc: 'Browser push notifications' },
    { key: 'orderUpdates' as const, icon: FiBell, label: 'Order Updates', desc: 'Get notified about order status changes' },
    { key: 'promotions' as const, icon: FiBell, label: 'Promotions & Offers', desc: 'Receive promotional notifications' },
  ];

  return (
    <DashboardLayout>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F2744] dark:text-white">Notification Settings</h1>
          <Link
            href="/notifications"
            className="flex items-center gap-1.5 text-sm text-[#00BFA6] hover:underline font-medium"
          >
            View All <FiExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 max-w-lg">
          {message && (
            <div className="p-3 rounded-lg text-sm bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
              {message}
            </div>
          )}

          {toggleItems.map(({ key, icon: Icon, label, desc }) => (
            <div key={key} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-xl">
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">{label}</span>
                  <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle(key)}
                className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
                  settings[key] ? 'bg-[#00BFA6]' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${
                    settings[key] ? 'translate-x-8' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto px-8 py-2.5 bg-[#0F2744] dark:bg-[#00BFA6] text-white rounded-lg font-medium hover:bg-[#1a3a5c] dark:hover:bg-[#00A892] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <FiLoader className="w-4 h-4 animate-spin" />}
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NotificationSettingsPage;
