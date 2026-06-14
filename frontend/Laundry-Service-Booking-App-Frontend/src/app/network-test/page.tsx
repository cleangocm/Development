'use client';

import { useState, useEffect } from 'react';
import api from '@/services/api';

export default function NetworkTestPage() {
  const [tests, setTests] = useState({
    hostname: '',
    frontendUrl: '',
    backendUrl: '',
    backendStatus: 'checking...',
  });

  useEffect(() => {
    const runTests = async () => {
      const hostname = window.location.hostname;
      const frontendUrl = window.location.origin;
      const backendUrl = `https://laundry-service-booking-app-backend.onrender.com/api/v1`;
      
      // Test backend connectivity
      let backendStatus = '❌ Failed';
      try {
        const res = await api.get('/public/site-settings');
        if (res.status === 200) {
          backendStatus = '✅ Connected';
        }
      } catch (err) {
        backendStatus = `❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`;
      }

      setTests({
        hostname,
        frontendUrl,
        backendUrl,
        backendStatus,
      });
    };

    runTests();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            🔧 Network Configuration Test
          </h1>

          <div className="space-y-6">
            {/* Hostname Info */}
            <div className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 p-4 rounded">
              <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Current Access Point</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Hostname:</strong> {tests.hostname}<br />
                <strong>Frontend URL:</strong> {tests.frontendUrl}<br />
                <strong>Backend URL:</strong> {tests.backendUrl}
              </p>
            </div>

            {/* Backend Status */}
            <div className={`border-l-4 ${tests.backendStatus.includes('✅') ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-red-500 bg-red-50 dark:bg-red-900/20'} p-4 rounded`}>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Backend Connectivity</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {tests.backendStatus}
              </p>
            </div>

            {/* Documentation Link */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                📖 For detailed instructions, see: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">NETWORK-AUTH-FIX.md</code>
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-4">
              <a
                href="/login"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                Test Login Page
              </a>
              <a
                href="/forgot-password"
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium"
              >
                Test OTP Page
              </a>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                Refresh Tests
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
