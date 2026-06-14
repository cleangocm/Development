'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { FiLock, FiEye, FiEyeOff, FiCheck, FiAlertCircle, FiLoader } from 'react-icons/fi';
import api from '@/services/api';
import { filterSafeText } from '@/lib/inputValidation';

const PasswordSettingsPage = () => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setMessage('');

    // Client-side validation
    if (!passwords.current) {
      setMessage('Please enter your current password.');
      setMessageType('error');
      return;
    }
    if (!passwords.new) {
      setMessage('Please enter a new password.');
      setMessageType('error');
      return;
    }
    if (passwords.new.length < 6) {
      setMessage('New password must be at least 6 characters.');
      setMessageType('error');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      setMessage('New passwords do not match!');
      setMessageType('error');
      return;
    }
    if (passwords.current === passwords.new) {
      setMessage('New password must be different from current password.');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.put('/auth/change-password', {
        currentPassword: passwords.current,
        newPassword: passwords.new,
        confirmPassword: passwords.confirm,
      });

      if (response.data.status === 'success') {
        setMessage('Password changed successfully!');
        setMessageType('success');
        setPasswords({ current: '', new: '', confirm: '' });
        setTimeout(() => setMessage(''), 5000);
      } else {
        setMessage(response.data.message || 'Failed to change password.');
        setMessageType('error');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const msg = err?.response?.data?.message || err?.message || 'Failed to change password. Please try again.';
      setMessage(msg);
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setPasswords({ current: '', new: '', confirm: '' });
    setMessage('');
  };

  return (
    <DashboardLayout>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700">
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F2744] dark:text-white">Settings</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[#00BFA6] font-medium border-b-2 border-[#00BFA6] pb-1">Password</span>
          </div>
        </div>

        {/* Form */}
        <div className="p-4 sm:p-6 space-y-6 max-w-md">
          {message && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
              messageType === 'success'
                ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800'
                : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800'
            }`}>
              {messageType === 'success'
                ? <FiCheck className="w-4 h-4 shrink-0" />
                : <FiAlertCircle className="w-4 h-4 shrink-0" />}
              {message}
            </div>
          )}

          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none">
                <FiLock className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: filterSafeText(e.target.value) })}
                placeholder="••••••••••"
                className="w-full ps-12 pe-12 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#00BFA6] focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute inset-y-0 end-0 flex items-center pe-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showCurrentPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none">
                <FiLock className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={passwords.new}
                onChange={(e) => setPasswords({ ...passwords, new: filterSafeText(e.target.value) })}
                placeholder="••••••••••"
                className="w-full ps-12 pe-12 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#00BFA6] focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 end-0 flex items-center pe-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showNewPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none">
                <FiLock className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: filterSafeText(e.target.value) })}
                placeholder="••••••••••"
                className="w-full ps-12 pe-12 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#00BFA6] focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 end-0 flex items-center pe-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center gap-2 px-8 py-2.5 bg-[#0F2744] dark:bg-[#00BFA6] text-white rounded-lg font-medium hover:bg-[#1a3a5c] dark:hover:bg-[#00A892] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <><FiLoader className="w-4 h-4 animate-spin" /> Saving...</>
              ) : (
                'Save Changes'
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="px-8 py-2.5 border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PasswordSettingsPage;
