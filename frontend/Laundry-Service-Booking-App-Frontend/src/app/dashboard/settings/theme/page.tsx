'use client';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { FiMoon, FiSun, FiCheckCircle } from 'react-icons/fi';
import { useTheme } from '@/context/ThemeContext';

const ThemeSettingsPage = () => {
  const { isDark, setTheme, t } = useTheme();

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t('themeSettings') || 'Theme Settings'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Customize your app appearance
          </p>
        </div>

        {/* Theme Toggle Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          {/* Card Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Appearance
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Choose between light and dark mode
            </p>
          </div>

          {/* Card Content */}
          <div className="p-6">
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 transition-all hover:border-[#00BFA6] dark:hover:border-[#00BFA6]">
              <div className="flex items-center gap-4">
                {/* Icon */}
                {isDark ? (
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                    <FiMoon className="w-6 h-6 text-indigo-400" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <FiSun className="w-6 h-6 text-amber-500" />
                  </div>
                )}
                
                {/* Text */}
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {isDark ? (t('darkMode') || 'Dark Mode') : (t('lightMode') || 'Light Mode')}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isDark 
                      ? 'Dark theme is active' 
                      : 'Light theme is active'
                    }
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                onClick={toggleTheme}
                className={`relative w-14 h-7 rounded-full transition-all duration-500 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#00BFA6]/50 ${
                  isDark
                    ? 'bg-linear-to-r from-indigo-600 to-purple-600 shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                    : 'bg-linear-to-r from-amber-300 to-orange-300 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                }`}
                aria-label="Toggle theme"
              >
                <span className={`absolute top-1 left-1.5 text-[10px] transition-opacity duration-300 ${isDark ? 'opacity-100' : 'opacity-0'}`}>🌙</span>
                <span className={`absolute top-1 right-1.5 text-[10px] transition-opacity duration-300 ${isDark ? 'opacity-0' : 'opacity-100'}`}>☀️</span>
                <span
                  className={`absolute top-0.5 w-6 h-6 rounded-full shadow-md transition-all duration-500 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)] flex items-center justify-center ${
                    isDark
                      ? 'translate-x-7 bg-gray-900 rotate-360'
                      : 'translate-x-0.5 bg-white rotate-0'
                  }`}
                >
                  {isDark ? (
                    <FiMoon className="w-3.5 h-3.5 text-indigo-300" />
                  ) : (
                    <FiSun className="w-3.5 h-3.5 text-amber-500" />
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Preview Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          {/* Card Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('preview') || 'Preview'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              See how your app looks
            </p>
          </div>

          {/* Preview Content */}
          <div className="p-6">
            <div className={`p-6 rounded-xl border-2 transition-all duration-300 ${
              isDark 
                ? 'border-indigo-500/50 bg-gray-900' 
                : 'border-amber-400/50 bg-white'
            }`}>
              {/* Mock Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${isDark ? 'bg-indigo-500/20' : 'bg-amber-500/20'}`}></div>
                  <div>
                    <div className={`h-3 w-24 rounded mb-2 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                    <div className={`h-2 w-16 rounded ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}></div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                  <div className={`w-8 h-8 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                </div>
              </div>

              {/* Mock Content */}
              <div className="space-y-3">
                <div className={`h-3 w-full rounded ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}></div>
                <div className={`h-3 w-4/5 rounded ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}></div>
                <div className={`h-3 w-3/5 rounded ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}></div>
              </div>

              {/* Active Indicator */}
              <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <FiCheckCircle className={`w-4 h-4 ${isDark ? 'text-indigo-400' : 'text-amber-500'}`} />
                <p className={`text-sm font-medium ${isDark ? 'text-indigo-400' : 'text-amber-600'}`}>
                  {isDark ? 'Dark Mode Active' : 'Light Mode Active'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ThemeSettingsPage;
