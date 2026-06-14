'use client';

import { useState, useEffect, useRef } from 'react';
import SafeImage from '@/components/ui/SafeImage';
import { FiUser, FiMail, FiPhone, FiCamera, FiSave, FiShield, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import AdminLayout from '@/components/admin/AdminLayout';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { filterNameInput, filterPhoneInput } from '@/lib/inputValidation';

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  profileImage: string | null;
  role: string;
  createdAt?: string;
}

const AdminProfilePage = () => {
  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    email: '',
    phone: '',
    profileImage: null,
    role: 'admin',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, checkAuth } = useAuthStore();

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/auth/profile');
      if (res.data.status === 'success') {
        const data = res.data.data;
        setProfile({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          profileImage: data.profileImage || null,
          role: data.role || 'admin',
          createdAt: data.createdAt,
        });
      }
    } catch {
      setError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      // Use backend endpoint — API key is read from DB (admin settings)
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/upload/imgbb', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.status === 'success' && res.data?.data?.url) {
        setProfile((prev) => ({ ...prev, profileImage: res.data.data.url }));
        setSuccess('Image uploaded! Click Save to apply.');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Image upload failed. Please try again.');
      }
    } catch {
      setError('Image upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.put('/auth/profile', {
        name: profile.name,
        phone: profile.phone,
        profileImage: profile.profileImage,
      });

      if (res.data.status === 'success') {
        setSuccess('Profile updated successfully!');
        // Update localStorage & Zustand with new data
        const updatedUser = {
          ...user,
          name: profile.name,
          phone: profile.phone,
          profileImage: profile.profileImage,
        };
        localStorage.setItem('auth_user', JSON.stringify(updatedUser));
        checkAuth(); // Re-sync Zustand from localStorage
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch {
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = () => {
    if (!profile.name) return 'A';
    const parts = profile.name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2 && parts[0] && parts[1]) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return profile.name.substring(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#00BFA6] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Loading profile...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your admin account details</p>
        </div>

        {/* Alerts */}
        {success && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl animate-fade-in">
            <FiCheckCircle className="w-5 h-5 text-green-500 shrink-0" />
            <p className="text-sm text-green-700 dark:text-green-400">{success}</p>
          </div>
        )}
        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl animate-fade-in">
            <FiAlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Avatar & Role Card */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
              {/* Avatar */}
              <div className="relative inline-block mb-4">
                {profile.profileImage ? (
                  <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-[#00BFA6]/20 mx-auto">
                    <SafeImage
                      src={profile.profileImage}
                      alt={profile.name}
                      variant="avatar"
                      width={112}
                      height={112}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-28 h-28 rounded-full bg-[#0F2744] dark:bg-[#00BFA6] flex items-center justify-center ring-4 ring-[#00BFA6]/20 mx-auto">
                    <span className="text-white font-bold text-3xl">{getInitials()}</span>
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute bottom-0 right-0 w-10 h-10 bg-[#00BFA6] hover:bg-[#00A892] text-white rounded-full flex items-center justify-center shadow-lg transition-colors disabled:opacity-50"
                >
                  {isUploading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FiCamera className="w-5 h-5" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>

              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{profile.name || 'Admin User'}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{profile.email}</p>

              {/* Role Badge */}
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#00BFA6]/10 dark:bg-[#00BFA6]/20 text-[#00BFA6] rounded-full text-sm font-semibold">
                <FiShield className="w-4 h-4" />
                Administrator
              </div>

              {/* Member Since */}
              {profile.createdAt && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
                  Member since {new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              )}
            </div>
          </div>

          {/* Right: Edit Form */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Account Information</h2>

              <div className="space-y-5">
                {/* Name */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <FiUser className="w-4 h-4" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: filterNameInput(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#00BFA6] focus:border-transparent outline-none transition-all"
                    placeholder="Enter your full name"
                  />
                </div>

                {/* Email (read-only) */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <FiMail className="w-4 h-4" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    readOnly
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none"
                  />
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                {/* Phone */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <FiPhone className="w-4 h-4" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: filterPhoneInput(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#00BFA6] focus:border-transparent outline-none transition-all"
                    placeholder="Enter your phone number"
                  />
                </div>

                {/* Save Button */}
                <div className="pt-4">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-8 py-3 bg-[#0F2744] dark:bg-[#00BFA6] hover:bg-[#1a3a5c] dark:hover:bg-[#00A892] text-white rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FiSave className="w-5 h-5" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProfilePage;
