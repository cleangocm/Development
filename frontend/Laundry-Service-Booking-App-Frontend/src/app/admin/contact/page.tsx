'use client';

import { useState, useEffect } from 'react';
import { FiSave, FiPlus, FiTrash2, FiCheckCircle, FiAlertCircle, FiMap, FiPhone, FiMail, FiMapPin, FiClock, FiEdit3 } from 'react-icons/fi';
import AdminLayout from '@/components/admin/AdminLayout';
import api from '@/services/api';
import { filterSafeText, filterPhoneInput } from '@/lib/inputValidation';

interface ContactInfoItem {
  type: string;
  title: string;
  details: string[];
  link: string | null;
}

interface LocationItem {
  name: string;
  address: string;
  phone: string;
  hours: string;
}

interface ContactPageData {
  heroTitle: string;
  heroSubtitle: string;
  contactInfo: ContactInfoItem[];
  locations: LocationItem[];
  mapEmbedUrl: string;
  faqTitle: string;
  faqSubtitle: string;
  faqButtonText: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  phone: <FiPhone className="w-4 h-4" />,
  email: <FiMail className="w-4 h-4" />,
  address: <FiMapPin className="w-4 h-4" />,
  hours: <FiClock className="w-4 h-4" />,
};

const AdminContactPage = () => {
  const [data, setData] = useState<ContactPageData>({
    heroTitle: 'Get in Touch',
    heroSubtitle: "Have questions? We'd love to hear from you.",
    contactInfo: [],
    locations: [],
    mapEmbedUrl: '',
    faqTitle: 'Need Quick Answers?',
    faqSubtitle: 'Check out our FAQ page for instant answers.',
    faqButtonText: 'Visit FAQ Section',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/public/contact-settings');
      if (res.data.status === 'success' && res.data.data) {
        setData(res.data.data);
      }
    } catch {
      // Use defaults
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.put('/admin/settings', { contactPageData: data });
      setSuccess('Contact page updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Contact Info handlers
  const updateContactInfo = (index: number, field: string, value: string | string[] | null) => {
    const updated = [...data.contactInfo];
    updated[index] = { ...updated[index], [field]: value };
    setData({ ...data, contactInfo: updated });
  };

  const addContactInfo = () => {
    setData({
      ...data,
      contactInfo: [...data.contactInfo, { type: 'phone', title: 'New Contact', details: [''], link: null }],
    });
  };

  const removeContactInfo = (index: number) => {
    setData({ ...data, contactInfo: data.contactInfo.filter((_, i) => i !== index) });
  };

  // Location handlers
  const updateLocation = (index: number, field: string, value: string) => {
    const updated = [...data.locations];
    updated[index] = { ...updated[index], [field]: value };
    setData({ ...data, locations: updated });
  };

  const addLocation = () => {
    setData({
      ...data,
      locations: [...data.locations, { name: 'New Location', address: '', phone: '', hours: '' }],
    });
  };

  const removeLocation = (index: number) => {
    setData({ ...data, locations: data.locations.filter((_, i) => i !== index) });
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#00BFA6] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Loading contact page settings...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 lg:mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Contact Page</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Edit all contact page content from here</p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-[#0F2744] dark:bg-[#00BFA6] hover:bg-[#1a3a5c] dark:hover:bg-[#00A892] text-white rounded-xl font-semibold transition-all disabled:opacity-50 shadow-lg"
          >
            {isSaving ? (
              <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
            ) : (
              <><FiSave className="w-5 h-5" /> Save All Changes</>
            )}
          </button>
        </div>

        {/* Alerts */}
        {success && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
            <FiCheckCircle className="w-5 h-5 text-green-500 shrink-0" />
            <p className="text-sm text-green-700 dark:text-green-400">{success}</p>
          </div>
        )}
        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <FiAlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Hero Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FiEdit3 className="w-5 h-5 text-[#00BFA6]" /> Hero Section
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hero Title</label>
                <input
                  type="text"
                  value={data.heroTitle}
                  onChange={(e) => setData({ ...data, heroTitle: filterSafeText(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#00BFA6] focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hero Subtitle</label>
                <textarea
                  value={data.heroSubtitle}
                  onChange={(e) => setData({ ...data, heroSubtitle: filterSafeText(e.target.value) })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#00BFA6] focus:border-transparent outline-none resize-none"
                />
              </div>
            </div>
          </div>

          {/* Contact Info Cards */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FiPhone className="w-5 h-5 text-[#00BFA6]" /> Contact Info Cards
              </h2>
              <button onClick={addContactInfo} className="flex items-center gap-1 px-4 py-2 bg-[#00BFA6]/10 dark:bg-[#00BFA6]/20 text-[#00BFA6] rounded-lg text-sm font-semibold hover:bg-[#00BFA6]/20 dark:hover:bg-[#00BFA6]/30 transition-colors">
                <FiPlus className="w-4 h-4" /> Add Card
              </button>
            </div>

            <div className="space-y-4">
              {data.contactInfo.map((info, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {typeIcons[info.type]} Card #{index + 1}
                    </div>
                    <button onClick={() => removeContactInfo(index)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Type</label>
                      <select
                        value={info.type}
                        onChange={(e) => updateContactInfo(index, 'type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none"
                      >
                        <option value="phone">Phone</option>
                        <option value="email">Email</option>
                        <option value="address">Address</option>
                        <option value="hours">Business Hours</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Title</label>
                      <input
                        type="text"
                        value={info.title}
                        onChange={(e) => updateContactInfo(index, 'title', filterSafeText(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Details (one per line)</label>
                      <textarea
                        value={info.details.join('\n')}
                        onChange={(e) => updateContactInfo(index, 'details', filterSafeText(e.target.value).split('\n'))}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none resize-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Link (optional)</label>
                      <input
                        type="text"
                        value={info.link || ''}
                        onChange={(e) => updateContactInfo(index, 'link', filterSafeText(e.target.value) || null)}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none"
                        placeholder="tel:+1234567890 or mailto:email@example.com"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Locations */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FiMapPin className="w-5 h-5 text-[#00BFA6]" /> Locations
              </h2>
              <button onClick={addLocation} className="flex items-center gap-1 px-4 py-2 bg-[#00BFA6]/10 dark:bg-[#00BFA6]/20 text-[#00BFA6] rounded-lg text-sm font-semibold hover:bg-[#00BFA6]/20 dark:hover:bg-[#00BFA6]/30 transition-colors">
                <FiPlus className="w-4 h-4" /> Add Location
              </button>
            </div>

            <div className="space-y-4">
              {data.locations.map((loc, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Location #{index + 1}</span>
                    <button onClick={() => removeLocation(index)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Name</label>
                      <input type="text" value={loc.name} onChange={(e) => updateLocation(index, 'name', filterSafeText(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Phone</label>
                      <input type="text" value={loc.phone} onChange={(e) => updateLocation(index, 'phone', filterPhoneInput(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Address</label>
                      <input type="text" value={loc.address} onChange={(e) => updateLocation(index, 'address', filterSafeText(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Hours</label>
                      <input type="text" value={loc.hours} onChange={(e) => updateLocation(index, 'hours', filterSafeText(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Map & FAQ */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FiMap className="w-5 h-5 text-[#00BFA6]" /> Map & FAQ Section
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Google Maps Embed URL</label>
                <input
                  type="text"
                  value={data.mapEmbedUrl}
                  onChange={(e) => setData({ ...data, mapEmbedUrl: filterSafeText(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#00BFA6] focus:border-transparent outline-none text-sm"
                  placeholder="https://www.google.com/maps/embed?..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">FAQ Title</label>
                <input
                  type="text"
                  value={data.faqTitle}
                  onChange={(e) => setData({ ...data, faqTitle: filterSafeText(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#00BFA6] focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">FAQ Subtitle</label>
                <textarea
                  value={data.faqSubtitle}
                  onChange={(e) => setData({ ...data, faqSubtitle: filterSafeText(e.target.value) })}
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#00BFA6] focus:border-transparent outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">FAQ Button Text</label>
                <input
                  type="text"
                  value={data.faqButtonText}
                  onChange={(e) => setData({ ...data, faqButtonText: filterSafeText(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#00BFA6] focus:border-transparent outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminContactPage;
