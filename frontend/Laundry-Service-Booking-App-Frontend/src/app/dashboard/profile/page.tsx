'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import SafeImage from '@/components/ui/SafeImage';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { FiCamera, FiUser, FiMail, FiPhone, FiEdit3, FiSave, FiX, FiCheck, FiLoader } from 'react-icons/fi';
import { useAuthStore } from '@/store/authStore';
import { uploadImage, validateImageFile } from '@/services/imageUpload';
import { filterNameInput, filterPhoneInput, filterSafeText } from '@/lib/inputValidation';
import { getUser, updateCustomerProfile } from '@/services/cleangoRepository';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  profileImage: string;
}

const ProfilePage = () => {
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    phone: '',
    address: '',
    profileImage: '',
  });
  const [editProfile, setEditProfile] = useState<UserProfile>({
    name: '',
    email: '',
    phone: '',
    address: '',
    profileImage: '',
  });
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  // Fetch profile from Firestore.
  useEffect(() => {
    const fetchProfile = async () => {
      setIsFetching(true);
      try {
        if (user) {
          const remoteUser = await getUser(user.id);
          const profileData: UserProfile = {
            name: remoteUser?.name || user.name || '',
            email: remoteUser?.email || user.email || '',
            phone: remoteUser?.phone || user.phone || '',
            address: remoteUser?.address || user.address || '',
            profileImage: remoteUser?.profileImage || user.profileImage || '',
          };
          setProfile(profileData);
          setEditProfile(profileData);
        }
      } catch {
        // Fallback to local store
        if (user) {
          const profileData: UserProfile = {
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            address: user.address || '',
            profileImage: user.profileImage || '',
          };
          setProfile(profileData);
          setEditProfile(profileData);
        }
      } finally {
        setIsFetching(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleEditChange = (field: keyof UserProfile, value: string) => {
    setEditProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleStartEdit = () => {
    setEditProfile({ ...profile });
    setIsEditing(true);
    setMessage('');
  };

  const handleCancelEdit = () => {
    setEditProfile({ ...profile });
    setIsEditing(false);
    setMessage('');
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file
      const validation = validateImageFile(file, 5);
      if (!validation.isValid) {
        setImageError(validation.error || 'Invalid file');
        return;
      }
      setImageError(null);
      setSelectedFile(file);
      // Revoke previous URL to prevent memory leak
      if (selectedImage) URL.revokeObjectURL(selectedImage);
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploadingImage(true);
    setImageError(null);
    
    try {
      // Upload to ImgBB
      const uploadedUrl = await uploadImage(selectedFile);
      
      
      // Update profile with the uploaded URL
      setEditProfile(prev => ({ ...prev, profileImage: uploadedUrl }));
      setProfile(prev => ({ ...prev, profileImage: uploadedUrl }));
      setShowImageModal(false);
      // Revoke the blob URL after successful upload
      if (selectedImage) URL.revokeObjectURL(selectedImage);
      setSelectedImage(null);
      setSelectedFile(null);
      
      setMessage('Image uploaded! Click "Save Changes" to save to your profile.');
      setMessageType('success');
      setTimeout(() => setMessage(''), 5000);
    } catch {
      setImageError('Failed to upload image. Please try again.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleUpdate = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      if (!user) throw new Error('You must be signed in to update your profile.');
      await updateCustomerProfile(user.id, {
        name: editProfile.name,
        phone: editProfile.phone,
        address: editProfile.address,
        profileImage: editProfile.profileImage,
      });
      const updatedProfile: UserProfile = { ...editProfile, email: profile.email };
        setProfile(updatedProfile);
        setEditProfile(updatedProfile);

        // Update local store with profileImage and address
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          const updatedUser = {
            ...currentUser,
            name: updatedProfile.name,
            phone: updatedProfile.phone,
            address: updatedProfile.address,
            profileImage: updatedProfile.profileImage,
          };
          localStorage.setItem('auth_user', JSON.stringify(updatedUser));
          useAuthStore.setState({ user: updatedUser });
        }

        setMessage('Profile updated successfully!');
        setMessageType('success');
        setIsEditing(false);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Failed to update profile. Please try again.';
      setMessage(errMsg);
      setMessageType('error');
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage(''), 4000);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isFetching) {
    return (
      <DashboardLayout>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-[#00BFA6] border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 dark:text-gray-400">Loading profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Header with Edit Button */}
        <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-[#0F2744] dark:text-white border-b-2 border-[#00BFA6] pb-2 inline-block">
            My Profile
          </h1>
          {!isEditing ? (
            <button
              onClick={handleStartEdit}
              className="flex items-center gap-2 px-4 py-2 bg-[#00BFA6] text-white rounded-lg hover:bg-[#00A892] transition-colors text-sm font-medium shadow-sm"
            >
              <FiEdit3 className="w-4 h-4" />
              Edit Profile
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancelEdit}
                className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                <FiX className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shadow-sm disabled:opacity-60"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FiSave className="w-4 h-4" />
                )}
                Save Changes
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 lg:p-8">
          {message && (
            <div className={`mb-6 p-3 rounded-lg text-sm flex items-center gap-2 ${
              messageType === 'success'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
            }`}>
              {messageType === 'success' ? <FiCheck className="w-4 h-4" /> : <FiX className="w-4 h-4" />}
              {message}
            </div>
          )}

          {/* Profile Picture */}
          <div className="flex justify-center mb-8">
            <div className="relative group">
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-[#00BFA6]/30 shadow-lg">
                {profile.profileImage ? (
                  <SafeImage
                    src={profile.profileImage}
                    alt="Profile"
                    variant="avatar"
                    fill
                    sizes="8rem"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full bg-linear-to-br from-[#0F2744] to-[#00BFA6] flex items-center justify-center">
                    <span className="text-3xl sm:text-4xl font-bold text-white">
                      {getInitials(profile.name || 'U')}
                    </span>
                  </div>
                )}
              </div>
              {isEditing && (
                <button
                  onClick={() => setShowImageModal(true)}
                  className="absolute bottom-0 right-0 w-9 h-9 sm:w-10 sm:h-10 bg-[#00BFA6] hover:bg-[#00A892] text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                >
                  <FiCamera className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 max-w-2xl mx-auto">
            {/* Full Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none">
                  <FiUser className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={isEditing ? editProfile.name : profile.name}
                  onChange={(e) => handleEditChange('name', filterNameInput(e.target.value))}
                  disabled={!isEditing}
                  className={`w-full ps-12 pe-4 py-3 border rounded-lg outline-none transition-all ${
                    isEditing
                      ? 'border-[#00BFA6] bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[#00BFA6]/30'
                      : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 cursor-default'
                  } text-gray-900 dark:text-white`}
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none">
                  <FiMail className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full ps-12 pe-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 cursor-default text-gray-500 dark:text-gray-400"
                />
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none">
                  <FiPhone className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  value={isEditing ? editProfile.phone : profile.phone}
                  onChange={(e) => handleEditChange('phone', filterPhoneInput(e.target.value))}
                  disabled={!isEditing}
                  placeholder={isEditing ? 'Enter phone number' : 'Not provided'}
                  className={`w-full ps-12 pe-4 py-3 border rounded-lg outline-none transition-all ${
                    isEditing
                      ? 'border-[#00BFA6] bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[#00BFA6]/30'
                      : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 cursor-default'
                  } text-gray-900 dark:text-white placeholder-gray-400`}
                />
              </div>
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Address</label>
              <div className="relative">
                <div className="absolute top-3.5 start-0 flex items-start ps-4 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                </div>
                <textarea
                  value={isEditing ? editProfile.address : profile.address}
                  onChange={(e) => handleEditChange('address', filterSafeText(e.target.value))}
                  disabled={!isEditing}
                  rows={2}
                  placeholder={isEditing ? 'Enter your address' : 'Not provided'}
                  className={`w-full ps-12 pe-4 py-3 border rounded-lg outline-none transition-all resize-none ${
                    isEditing
                      ? 'border-[#00BFA6] bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[#00BFA6]/30'
                      : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 cursor-default'
                  } text-gray-900 dark:text-white placeholder-gray-400`}
                />
              </div>
            </div>
          </div>

          {/* Account Info Card */}
          <div className="mt-8 max-w-2xl mx-auto bg-gray-50 dark:bg-gray-700/30 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Account Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Account Type</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">User</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Status</span>
                <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span> Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Upload Modal */}
      {showImageModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-9998 animate-fade-in"
            onClick={() => !isUploadingImage && setShowImageModal(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-9999 w-[90vw] max-w-md animate-scale-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl">
              {!selectedImage ? (
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upload Profile Photo</h3>
                  <label className="cursor-pointer">
                    <div className="w-32 h-32 mx-auto mb-4 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                      <div className="text-center">
                        <FiCamera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">Browse</span>
                      </div>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                  </label>
                  {imageError && (
                    <p className="text-sm text-red-500 mb-4">{imageError}</p>
                  )}
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Click to select an image (max 5MB)</p>
                  <button
                    onClick={() => setShowImageModal(false)}
                    className="px-6 py-2.5 border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Confirm Photo</h3>
                  <div className="w-40 h-40 mx-auto mb-4 rounded-full overflow-hidden border-4 border-[#00BFA6]/30">
                    <Image
                      src={selectedImage}
                      alt="Preview"
                      width={160}
                      height={160}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  </div>
                  {imageError && (
                    <p className="text-sm text-red-500 mb-4">{imageError}</p>
                  )}
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setSelectedImage(null);
                        setSelectedFile(null);
                        setImageError(null);
                        setShowImageModal(false);
                      }}
                      disabled={isUploadingImage}
                      className="flex-1 px-6 py-2.5 border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleImageUpload}
                      disabled={isUploadingImage}
                      className="flex-1 px-6 py-2.5 bg-[#0F2744] dark:bg-[#00BFA6] text-white rounded-lg font-medium hover:bg-[#1a3a5c] dark:hover:bg-[#00A892] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isUploadingImage ? (
                        <>
                          <FiLoader className="w-4 h-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        'Confirm'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default ProfilePage;
