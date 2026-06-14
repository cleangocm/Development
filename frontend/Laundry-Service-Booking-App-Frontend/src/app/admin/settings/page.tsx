'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { filterPhoneInput, filterNumberInput, filterSafeText } from '@/lib/inputValidation';
import api from '@/services/api';
import { 
  FiSave,
  FiGlobe,
  FiDollarSign,
  FiClock,
  FiMail,
  FiPhone,
  FiMapPin,
  FiImage,
  FiUpload,
  FiPercent,
  FiTruck,
  FiCreditCard,
  FiBell,
  FiShield,
  FiLoader,
  FiCheck,
  FiAlertCircle,
  FiLink,
  FiType,
  FiLayout,
  FiTrash2,
  FiPlus,
  FiDownload,
  FiEdit2,
  FiChevronDown,
  FiChevronUp,
  FiEye,
  FiEyeOff,
  FiServer,
} from 'react-icons/fi';
import SafeImage from '@/components/ui/SafeImage';
import { useTheme } from '@/context/ThemeContext';

const ToggleSwitch = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
  <button onClick={onChange}
    className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-[#00BFA6]' : 'bg-gray-300 dark:bg-gray-600'}`}>
    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${enabled ? 'left-7' : 'left-1'}`} />
  </button>
);

interface Settings {
  siteName: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  currency: string;
  currencySymbol: string;
  timezone: string;
  workingHoursStart: string;
  workingHoursEnd: string;
  minOrderAmount: number;
  taxRate: number;
  freeDeliveryThreshold: number;
  deliveryFee: number;
  deliveryRadius: number;
  expressDeliveryFee: number;
  codEnabled: boolean;
  stripeEnabled: boolean;
  paypalEnabled: boolean;
  paystackEnabled: boolean;
  orderConfirmation: boolean;
  orderStatusUpdates: boolean;
  promotionalEmails: boolean;
  smsNotifications: boolean;
  twoFactorAuth: boolean;
  maintenanceMode: boolean;
  // Footer
  footerLogo: string;
  footerDescription: string;
  copyrightText: string;
  socialMediaLinks: { name: string; url: string; icon: string }[];
  appDownloadLinks: { name: string; url: string; logo: string }[];
  headerLogo: string;
  footerQuickLinks: { name: string; url: string; icon: string }[];
  // Payment API Keys
  stripeSecretKey: string;
  stripePublishableKey: string;
  paystackSecretKey: string;
  paystackPublicKey: string;
  paypalClientId: string;
  imgbbApiKey: string;
}

const defaultSettings: Settings = {
  siteName: 'Ultra Wash',
  tagline: 'Premium Laundry & Dry Cleaning',
  email: 'support@ultrawash.com',
  phone: '+1 234 567 8900',
  address: '123 Main Street, New York, NY 10001',
  currency: 'USD',
  currencySymbol: '$',
  timezone: 'America/New_York',
  workingHoursStart: '08:00',
  workingHoursEnd: '20:00',
  minOrderAmount: 15,
  taxRate: 8.5,
  freeDeliveryThreshold: 50,
  deliveryFee: 5.99,
  deliveryRadius: 15,
  expressDeliveryFee: 12.99,
  codEnabled: true,
  stripeEnabled: true,
  paypalEnabled: true,
  paystackEnabled: true,
  orderConfirmation: true,
  orderStatusUpdates: true,
  promotionalEmails: true,
  smsNotifications: false,
  twoFactorAuth: false,
  maintenanceMode: false,
  // Footer
  footerLogo: '',
  footerDescription: 'Your clothes deserve the best—trust Ultra Wash for professional care, eco-friendly solutions, and a spotless finish.',
  copyrightText: '© {year} Ultra Wash. All Rights Reserved.',
  socialMediaLinks: [],
  appDownloadLinks: [],
  headerLogo: '',
  footerQuickLinks: [],
  // Payment API Keys (demo defaults)
  stripeSecretKey: '',
  stripePublishableKey: '',
  paystackSecretKey: '',
  paystackPublicKey: 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  paypalClientId: 'AW-DEMO-CLIENT-ID-xxxxxxxxxxxxxxxxxxxxx',
  imgbbApiKey: '',
};

const AdminSettingsPage = () => {
  const { setCurrency: setGlobalCurrency } = useTheme();
  const [activeSection, setActiveSection] = useState('business');
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // ── Payment Gateways State (separate from general settings) ──
  const [gateways, setGateways] = useState<Record<string, Record<string, unknown>>>({
    stripe:         { enabled: false, publishableKey: '', secretKey: '' },
    cashOnDelivery: { enabled: true },
    paypal:         { enabled: false, publishableKey: '', secretKey: '' },
    paystack:       { enabled: false, publishableKey: '', secretKey: '' },
  });
  // Track which gateways already have a secret key saved on the server (for placeholder UX)
  const [gwHasKey, setGwHasKey] = useState<Record<string, boolean>>({});

  // ── Integrations State (SMTP + Twilio) ──
  const [smtpConfig, setSmtpConfig] = useState({ host: '', port: '587', user: '', password: '', from: '', hasPassword: false });
  const [twilioConfig, setTwilioConfig] = useState({ accountSid: '', authToken: '', phoneNumber: '', hasAuthToken: false });
  const [showIntegrationKey, setShowIntegrationKey] = useState<Record<string, boolean>>({});
  const setGw = (name: string, patch: Record<string, unknown>) =>
    setGateways(prev => ({ ...prev, [name]: { ...prev[name], ...patch } }));

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/settings');
      if (res.data.status === 'success' && res.data.data) {
        const apiData = res.data.data;
        setSettings((prev) => {
          const merged = { ...prev };
          for (const key of Object.keys(merged) as (keyof Settings)[]) {
            if (apiData[key] !== undefined) {
              (merged as Record<string, unknown>)[key] = apiData[key];
            }
          }
          return merged;
        });
        // Sync currency to global context
        if (apiData.currency) {
          setGlobalCurrency(apiData.currency);
        }
      }
    } catch {
      showToast('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  }, [setGlobalCurrency]);

  useEffect(() => {
    fetchSettings();
    // Load payment gateway config
    api.get('/admin/payment-gateways')
      .then(res => {
        if (res.data?.status === 'success' && res.data?.data) {
          const hasKey: Record<string, boolean> = {};
          setGateways(prev => {
            const next = { ...prev };
            for (const [k, v] of Object.entries(res.data.data as Record<string, Record<string, unknown>>)) {
              const secretKey = v.secretKey as string | undefined;
              // If backend returned a masked key, track that a key exists but clear the field
              if (secretKey && secretKey.startsWith('****')) {
                hasKey[k] = true;
                next[k] = { ...next[k], ...v, secretKey: '' };
              } else {
                next[k] = { ...next[k], ...v };
              }
            }
            return next;
          });
          setGwHasKey(hasKey);
        }
      })
      .catch(() => { /* keep defaults */ });

    // Load integrations config
    api.get('/admin/integrations')
      .then(res => {
        if (res.data?.status === 'success' && res.data?.data) {
          if (res.data.data.smtp) setSmtpConfig(res.data.data.smtp);
          if (res.data.data.twilio) setTwilioConfig(res.data.data.twilio);
        }
      })
      .catch(() => { /* keep defaults */ });
  }, [fetchSettings]);

  const handleSave = async () => {
    try {
      setSaving(true);
      // Save general settings
      const res = await api.put('/admin/settings', settings);
      if (res.data.status === 'success') {
        setGlobalCurrency(settings.currency);
      }
      // Save all payment gateways
      await Promise.all(
        Object.entries(gateways).map(([name, config]) =>
          api.put(`/admin/payment-gateways/${name}`, config).catch(() => {})
        )
      );
      // Save integrations
      await api.put('/admin/integrations/smtp', smtpConfig).catch(() => {});
      await api.put('/admin/integrations/twilio', twilioConfig).catch(() => {});
      showToast('Settings saved successfully!', 'success');
    } catch {
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const [uploading, setUploading] = useState<string | null>(null);
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [revealingKey, setRevealingKey] = useState<string | null>(null);

  const handleRevealKey = async (gateway: string) => {
    setRevealingKey(gateway);
    try {
      const res = await api.get(`/admin/payment-gateways/${gateway}/secret`);
      if (res.data?.status === 'success' && res.data?.data?.secretKey) {
        setGateways(prev => ({ ...prev, [gateway]: { ...prev[gateway], secretKey: res.data.data.secretKey } }));
        setGwHasKey(prev => ({ ...prev, [gateway]: false })); // key is now in field, no longer "hidden"
        setShowApiKeys(prev => ({ ...prev, [`${gateway}Secret`]: true }));
      }
    } catch {
      showToast('Failed to reveal key', 'error');
    } finally {
      setRevealingKey(null);
    }
  };

  const uploadToImgBB = async (file: File, field: 'footerLogo' | 'headerLogo') => {
    setUploading(field);
    try {
      // Try backend upload first
      const formData = new FormData();
      formData.append('image', file);
      try {
        const res = await api.post('/upload/imgbb', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        if (res.data?.status === 'success') {
          setSettings(prev => ({ ...prev, [field]: res.data.data.url }));
          showToast('Image uploaded successfully!', 'success');
          return;
        }
      } catch {
        // Backend upload failed, try direct ImgBB upload
      }
      // Direct ImgBB upload fallback
      const apiKey = settings.imgbbApiKey || process.env.NEXT_PUBLIC_IMGBB_API_KEY || '';
      if (!apiKey) {
        showToast('No ImgBB API key configured. Add it in Payment > API Keys section.', 'error');
        return;
      }
      const directForm = new FormData();
      directForm.append('image', file);
      directForm.append('key', apiKey);
      const directRes = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: directForm });
      const directData = await directRes.json();
      if (directData.success) {
        setSettings(prev => ({ ...prev, [field]: directData.data.display_url }));
        showToast('Image uploaded successfully!', 'success');
      } else {
        showToast('Failed to upload image. Check your ImgBB API key.', 'error');
      }
    } catch {
      showToast('Failed to upload image', 'error');
    } finally {
      setUploading(null);
    }
  };

  const [quickLinkUploading, setQuickLinkUploading] = useState<number | null>(null);
  const [socialMediaUploading, setSocialMediaUploading] = useState<number | null>(null);
  const [appDownloadUploading, setAppDownloadUploading] = useState<number | null>(null);

  const uploadQuickLinkIcon = async (file: File, index: number) => {
    setQuickLinkUploading(index);
    try {
      let url = '';
      // Try backend first
      try {
        const formData = new FormData();
        formData.append('image', file);
        const res = await api.post('/upload/imgbb', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        if (res.data?.status === 'success') { url = res.data.data.url; }
      } catch { /* fallback below */ }
      // Direct ImgBB fallback
      if (!url) {
        const apiKey = settings.imgbbApiKey || process.env.NEXT_PUBLIC_IMGBB_API_KEY || '';
        if (!apiKey) { showToast('No ImgBB API key configured.', 'error'); return; }
        const directForm = new FormData();
        directForm.append('image', file);
        directForm.append('key', apiKey);
        const directRes = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: directForm });
        const directData = await directRes.json();
        if (directData.success) { url = directData.data.display_url; }
      }
      if (url) {
        const updated = [...settings.footerQuickLinks];
        updated[index] = { ...updated[index], icon: url };
        setSettings(prev => ({ ...prev, footerQuickLinks: updated }));
        showToast('Icon uploaded!', 'success');
      } else {
        showToast('Failed to upload icon', 'error');
      }
    } catch {
      showToast('Failed to upload icon', 'error');
    } finally {
      setQuickLinkUploading(null);
    }
  };

  const uploadSocialMediaIcon = async (file: File, index: number) => {
    setSocialMediaUploading(index);
    try {
      let url = '';
      try {
        const formData = new FormData();
        formData.append('image', file);
        const res = await api.post('/upload/imgbb', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        if (res.data?.status === 'success') { url = res.data.data.url; }
      } catch { /* fallback below */ }
      if (!url) {
        const apiKey = settings.imgbbApiKey || process.env.NEXT_PUBLIC_IMGBB_API_KEY || '';
        if (!apiKey) { showToast('No ImgBB API key configured.', 'error'); return; }
        const directForm = new FormData();
        directForm.append('image', file);
        directForm.append('key', apiKey);
        const directRes = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: directForm });
        const directData = await directRes.json();
        if (directData.success) { url = directData.data.display_url; }
      }
      if (url) {
        const updated = [...settings.socialMediaLinks];
        updated[index] = { ...updated[index], icon: url };
        setSettings(prev => ({ ...prev, socialMediaLinks: updated }));
        showToast('Icon uploaded!', 'success');
      } else {
        showToast('Failed to upload icon', 'error');
      }
    } catch {
      showToast('Failed to upload icon', 'error');
    } finally {
      setSocialMediaUploading(null);
    }
  };

  const uploadAppDownloadLogo = async (file: File, index: number) => {
    try {
      setAppDownloadUploading(index);
      let url = '';
      try {
        const formData = new FormData();
        formData.append('image', file);
        const res = await api.post('/upload/imgbb', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        if (res.data?.status === 'success' && res.data?.data?.url) { url = res.data.data.url; }
      } catch { /* fallback below */ }
      if (!url) {
        const apiKey = settings.imgbbApiKey || process.env.NEXT_PUBLIC_IMGBB_API_KEY || '';
        if (!apiKey) { showToast('No ImgBB API key configured.', 'error'); return; }
        const directForm = new FormData();
        directForm.append('image', file);
        directForm.append('key', apiKey);
        const directRes = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: directForm });
        const directData = await directRes.json();
        if (directData.success) { url = directData.data.display_url; }
      }
      if (url) {
        const updated = [...settings.appDownloadLinks];
        updated[index] = { ...updated[index], logo: url };
        setSettings({...settings, appDownloadLinks: updated});
        showToast('Logo uploaded successfully', 'success');
      } else {
        showToast('Failed to upload logo', 'error');
      }
    } catch {
      showToast('Failed to upload logo', 'error');
    } finally {
      setAppDownloadUploading(null);
    }
  };

  const sections = [
    // { id: 'general', label: 'General', icon: FiGlobe },
    { id: 'business', label: 'Business', icon: FiDollarSign },
    { id: 'delivery', label: 'Delivery', icon: FiTruck },
    { id: 'payment', label: 'Payment', icon: FiCreditCard },
    { id: 'integrations', label: 'Integrations', icon: FiServer },
    { id: 'notifications', label: 'Notifications', icon: FiBell },
    { id: 'security', label: 'Security', icon: FiShield },
    { id: 'footer', label: 'Footer & Branding', icon: FiLayout },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-32">
          <FiLoader className="w-8 h-8 text-[#00BFA6] animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {toast && (
        <div className={`fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          {toast.type === 'success' ? <FiCheck className="w-4 h-4" /> : <FiAlertCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your application settings</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-[#0F2744] dark:bg-[#00BFA6] text-white rounded-lg hover:bg-[#1a3a5c] dark:hover:bg-[#00A892] transition-colors disabled:opacity-50">
          {saving ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiSave className="w-4 h-4" />}
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 shrink-0">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-2">
            <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible">
              {sections.map((section) => (
                <button key={section.id} onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${activeSection === section.id ? 'bg-[#00BFA6]/10 text-[#00BFA6]' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                  <section.icon className="w-5 h-5" />
                  {section.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="flex-1">
          {/* General Settings section - commented out
          {activeSection === 'general' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">General Settings</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Site Logo</label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center"><FiImage className="w-8 h-8 text-gray-400" /></div>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"><FiUpload className="w-4 h-4" /> Upload Logo</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Site Name</label><input type="text" value={settings.siteName} onChange={(e) => setSettings({...settings, siteName: filterSafeText(e.target.value)})} className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tagline</label><input type="text" value={settings.tagline} onChange={(e) => setSettings({...settings, tagline: filterSafeText(e.target.value)})} className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /></div>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"><FiMail className="w-4 h-4 inline mr-2" />Email Address</label><input type="email" value={settings.email} onChange={(e) => setSettings({...settings, email: filterSafeText(e.target.value)})} className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"><FiPhone className="w-4 h-4 inline mr-2" />Phone Number</label><input type="tel" value={settings.phone} onChange={(e) => setSettings({...settings, phone: filterPhoneInput(e.target.value)})} className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"><FiMapPin className="w-4 h-4 inline mr-2" />Address</label><input type="text" value={settings.address} onChange={(e) => setSettings({...settings, address: filterSafeText(e.target.value)})} className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /></div>
                </div>
              </div>
            </div>
          )}
          */}

          {activeSection === 'business' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Business Settings</h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency</label>
                    <select value={settings.currency} onChange={(e) => { const val = e.target.value; const symbolMap: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', BDT: '৳', INR: '₹', JPY: '¥', CNY: '¥', AUD: 'A$', CAD: 'C$', CHF: 'CHF', SAR: '﷼', AED: 'د.إ', MYR: 'RM', SGD: 'S$', PKR: '₨', TRY: '₺', KRW: '₩', THB: '฿', PHP: '₱', IDR: 'Rp', NGN: '₦', ZAR: 'R', BRL: 'R$', MXN: 'Mex$', EGP: 'E£' }; setSettings({...settings, currency: val, currencySymbol: symbolMap[val] || val}); }} className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                      <option value="USD">USD - US Dollar ($)</option>
                      <option value="EUR">EUR - Euro (€)</option>
                      <option value="GBP">GBP - British Pound (£)</option>
                      <option value="BDT">BDT - Bangladeshi Taka (৳)</option>
                      <option value="INR">INR - Indian Rupee (₹)</option>
                      <option value="JPY">JPY - Japanese Yen (¥)</option>
                      <option value="CNY">CNY - Chinese Yuan (¥)</option>
                      <option value="AUD">AUD - Australian Dollar (A$)</option>
                      <option value="CAD">CAD - Canadian Dollar (C$)</option>
                      <option value="CHF">CHF - Swiss Franc (CHF)</option>
                      <option value="SAR">SAR - Saudi Riyal (﷼)</option>
                      <option value="AED">AED - UAE Dirham (د.إ)</option>
                      <option value="MYR">MYR - Malaysian Ringgit (RM)</option>
                      <option value="SGD">SGD - Singapore Dollar (S$)</option>
                      <option value="PKR">PKR - Pakistani Rupee (₨)</option>
                      <option value="TRY">TRY - Turkish Lira (₺)</option>
                      <option value="KRW">KRW - South Korean Won (₩)</option>
                      <option value="THB">THB - Thai Baht (฿)</option>
                      <option value="PHP">PHP - Philippine Peso (₱)</option>
                      <option value="IDR">IDR - Indonesian Rupiah (Rp)</option>
                      <option value="NGN">NGN - Nigerian Naira (₦)</option>
                      <option value="ZAR">ZAR - South African Rand (R)</option>
                      <option value="BRL">BRL - Brazilian Real (R$)</option>
                      <option value="MXN">MXN - Mexican Peso (Mex$)</option>
                      <option value="EGP">EGP - Egyptian Pound (E£)</option>
                    </select>
                  </div>
                  <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency Symbol</label><input type="text" value={settings.currencySymbol} onChange={(e) => setSettings({...settings, currencySymbol: filterSafeText(e.target.value)})} className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Timezone</label>
                    <select value={settings.timezone} onChange={(e) => setSettings({...settings, timezone: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                      <option value="America/New_York">America/New_York</option><option value="America/Los_Angeles">America/Los_Angeles</option><option value="Europe/London">Europe/London</option><option value="Asia/Dhaka">Asia/Dhaka</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"><FiClock className="w-4 h-4 inline mr-2" />Working Hours Start</label><input type="time" value={settings.workingHoursStart} onChange={(e) => setSettings({...settings, workingHoursStart: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"><FiClock className="w-4 h-4 inline mr-2" />Working Hours End</label><input type="time" value={settings.workingHoursEnd} onChange={(e) => setSettings({...settings, workingHoursEnd: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"><FiDollarSign className="w-4 h-4 inline mr-2" />Minimum Order Amount</label><input type="number" value={settings.minOrderAmount} onChange={(e) => setSettings({...settings, minOrderAmount: Number(filterNumberInput(e.target.value))})} className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"><FiPercent className="w-4 h-4 inline mr-2" />Tax Rate (%)</label><input type="number" step="0.01" value={settings.taxRate} onChange={(e) => setSettings({...settings, taxRate: Number(filterNumberInput(e.target.value))})} className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /></div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'delivery' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delivery Settings</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">Delivery fees are stored in your configured currency ({settings.currency}). Change the currency from the General tab.</p>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Standard Delivery Fee</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">{settings.currencySymbol}</span><input type="number" step="0.01" value={settings.deliveryFee} onChange={(e) => setSettings({...settings, deliveryFee: Number(filterNumberInput(e.target.value))})} className="w-full pl-8 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /></div></div>
                  <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Express Delivery Fee</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">{settings.currencySymbol}</span><input type="number" step="0.01" value={settings.expressDeliveryFee} onChange={(e) => setSettings({...settings, expressDeliveryFee: Number(filterNumberInput(e.target.value))})} className="w-full pl-8 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /></div></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Free Delivery Threshold</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">{settings.currencySymbol}</span><input type="number" value={settings.freeDeliveryThreshold} onChange={(e) => setSettings({...settings, freeDeliveryThreshold: Number(filterNumberInput(e.target.value))})} className="w-full pl-8 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /></div><p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Orders above this amount get free delivery</p></div>
                  <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Delivery Radius (km)</label><input type="number" value={settings.deliveryRadius} onChange={(e) => setSettings({...settings, deliveryRadius: Number(filterNumberInput(e.target.value))})} className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /></div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'payment' && (
            <div className="space-y-6">
              {/* Payment Method Toggles */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Payment Methods</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div className="flex items-center gap-3"><div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center"><span className="font-bold text-purple-600">S</span></div><div><p className="font-medium text-gray-900 dark:text-white">Stripe</p><p className="text-sm text-gray-500 dark:text-gray-400">Credit/Debit Cards</p></div></div>
                    <ToggleSwitch enabled={!!gateways.stripe?.enabled} onChange={() => setGw('stripe', { enabled: !gateways.stripe?.enabled })} />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center"><span className="font-bold text-blue-600">PP</span></div><div><p className="font-medium text-gray-900 dark:text-white">PayPal</p><p className="text-sm text-gray-500 dark:text-gray-400">PayPal Payments</p></div></div>
                    <ToggleSwitch enabled={!!gateways.paypal?.enabled} onChange={() => setGw('paypal', { enabled: !gateways.paypal?.enabled })} />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div className="flex items-center gap-3"><div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center"><FiTruck className="w-5 h-5 text-orange-600" /></div><div><p className="font-medium text-gray-900 dark:text-white">Cash on Delivery</p><p className="text-sm text-gray-500 dark:text-gray-400">Pay when delivered</p></div></div>
                    <ToggleSwitch enabled={!!gateways.cashOnDelivery?.enabled} onChange={() => setGw('cashOnDelivery', { enabled: !gateways.cashOnDelivery?.enabled })} />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div className="flex items-center gap-3"><div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center"><span className="font-bold text-cyan-600">PS</span></div><div><p className="font-medium text-gray-900 dark:text-white">Paystack</p><p className="text-sm text-gray-500 dark:text-gray-400">Cards, bank transfer, mobile money</p></div></div>
                    <ToggleSwitch enabled={!!gateways.paystack?.enabled} onChange={() => setGw('paystack', { enabled: !gateways.paystack?.enabled })} />
                  </div>
                </div>
              </div>

              {/* API Keys - Provider Based Cards */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">API Keys</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Configure your payment gateway API keys. Click Edit to update keys for each provider.</p>
                <div className="space-y-4">
                  {/* Stripe */}
                  <div className="border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setEditingProvider(editingProvider === 'stripe' ? null : 'stripe')}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center"><span className="font-bold text-purple-600">S</span></div>
                        <div className="text-left">
                          <p className="font-medium text-gray-900 dark:text-white">Stripe</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{(gwHasKey.stripe || !!(gateways.stripe?.secretKey as string)) ? '2 keys configured' : 'Not configured'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!!(gwHasKey.stripe || (gateways.stripe?.secretKey as string)) && <span className="w-2 h-2 bg-green-500 rounded-full" />}
                        <FiEdit2 className="w-4 h-4 text-gray-400" />
                        {editingProvider === 'stripe' ? <FiChevronUp className="w-4 h-4 text-gray-400" /> : <FiChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </button>
                    {editingProvider === 'stripe' && (
                      <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-4 space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Secret Key</label>
                            {gwHasKey.stripe && !gateways.stripe?.secretKey && (
                              <button type="button" onClick={() => handleRevealKey('stripe')} disabled={revealingKey === 'stripe'} className="text-xs text-[#00BFA6] hover:underline disabled:opacity-50">
                                {revealingKey === 'stripe' ? 'Loading...' : '🔍 Reveal Key'}
                              </button>
                            )}
                          </div>
                          <div className="relative">
                            <input
                              type={showApiKeys.stripeSecret ? 'text' : 'password'}
                              value={(gateways.stripe?.secretKey as string) || ''}
                              onChange={(e) => setGw('stripe', { secretKey: filterSafeText(e.target.value) })}
                              placeholder={gwHasKey.stripe ? '••••••••••• (already set — enter new to replace)' : 'sk_live_xxxxxxxxxxxxx'}
                              className="w-full px-4 py-2.5 pr-10 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                            />
                            <button type="button" onClick={() => setShowApiKeys({...showApiKeys, stripeSecret: !showApiKeys.stripeSecret})} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                              {showApiKeys.stripeSecret ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Publishable Key</label>
                          <input type="text" value={(gateways.stripe?.publishableKey as string) || ''} onChange={(e) => setGw('stripe', { publishableKey: filterSafeText(e.target.value) })} placeholder="pk_live_xxxxxxxxxxxxx" className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* PayPal */}
                  <div className="border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setEditingProvider(editingProvider === 'paypal' ? null : 'paypal')}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center"><span className="font-bold text-blue-600">PP</span></div>
                        <div className="text-left">
                          <p className="font-medium text-gray-900 dark:text-white">PayPal</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{(gwHasKey.paypal || !!(gateways.paypal?.secretKey as string)) ? '2 keys configured' : (gateways.paypal?.publishableKey as string) ? '1 key configured' : 'Not configured'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!!(gwHasKey.paypal || (gateways.paypal?.secretKey as string)) && <span className="w-2 h-2 bg-green-500 rounded-full" />}
                        <FiEdit2 className="w-4 h-4 text-gray-400" />
                        {editingProvider === 'paypal' ? <FiChevronUp className="w-4 h-4 text-gray-400" /> : <FiChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </button>
                    {editingProvider === 'paypal' && (
                      <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-4 space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Client ID <span className="text-xs text-gray-400 font-normal">(publishable — sent to browser)</span></label>
                          <div className="relative">
                            <input
                              type={showApiKeys.paypalClient ? 'text' : 'password'}
                              value={(gateways.paypal?.publishableKey as string) || ''}
                              onChange={(e) => setGw('paypal', { publishableKey: filterSafeText(e.target.value) })}
                              placeholder="AY... or AZ... (sandbox / live Client ID)"
                              className="w-full px-4 py-2.5 pr-10 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                            />
                            <button type="button" onClick={() => setShowApiKeys({...showApiKeys, paypalClient: !showApiKeys.paypalClient})} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                              {showApiKeys.paypalClient ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">App Secret <span className="text-xs text-gray-400 font-normal">(server-only)</span></label>
                            {gwHasKey.paypal && !gateways.paypal?.secretKey && (
                              <button type="button" onClick={() => handleRevealKey('paypal')} disabled={revealingKey === 'paypal'} className="text-xs text-[#00BFA6] hover:underline disabled:opacity-50">
                                {revealingKey === 'paypal' ? 'Loading...' : '🔍 Reveal Key'}
                              </button>
                            )}
                          </div>
                          <div className="relative">
                            <input
                              type={showApiKeys.paypalSecret ? 'text' : 'password'}
                              value={(gateways.paypal?.secretKey as string) || ''}
                              onChange={(e) => setGw('paypal', { secretKey: filterSafeText(e.target.value) })}
                              placeholder={gwHasKey.paypal ? '••••••••••• (already set — enter new to replace)' : 'App Secret from PayPal Developer Dashboard'}
                              className="w-full px-4 py-2.5 pr-10 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                            />
                            <button type="button" onClick={() => setShowApiKeys({...showApiKeys, paypalSecret: !showApiKeys.paypalSecret})} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                              {showApiKeys.paypalSecret ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Paystack */}
                  <div className="border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setEditingProvider(editingProvider === 'paystack' ? null : 'paystack')}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center"><span className="font-bold text-cyan-600">PS</span></div>
                        <div className="text-left">
                          <p className="font-medium text-gray-900 dark:text-white">Paystack</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{(gwHasKey.paystack || !!(gateways.paystack?.secretKey as string)) ? '2 keys configured' : 'Not configured'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!!(gwHasKey.paystack || (gateways.paystack?.secretKey as string)) && <span className="w-2 h-2 bg-green-500 rounded-full" />}
                        <FiEdit2 className="w-4 h-4 text-gray-400" />
                        {editingProvider === 'paystack' ? <FiChevronUp className="w-4 h-4 text-gray-400" /> : <FiChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </button>
                    {editingProvider === 'paystack' && (
                      <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-4 space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Secret Key</label>
                          <div className="relative">
                            <input
                              type={showApiKeys.paystackSecret ? 'text' : 'password'}
                              value={(gateways.paystack?.secretKey as string) || ''}
                              onChange={(e) => setGw('paystack', { secretKey: filterSafeText(e.target.value) })}
                              placeholder={gwHasKey.paystack ? '••••••••••• (already set — enter new to replace)' : 'sk_live_xxxxxxxxxxxxx'}
                              className="w-full px-4 py-2.5 pr-10 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                            />
                            <button type="button" onClick={() => setShowApiKeys({...showApiKeys, paystackSecret: !showApiKeys.paystackSecret})} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                              {showApiKeys.paystackSecret ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                            </button>
                          </div>
                          {gwHasKey.paystack && !gateways.paystack?.secretKey && (
                            <button type="button" onClick={() => handleRevealKey('paystack')} disabled={revealingKey === 'paystack'} className="mt-1 text-xs text-[#00BFA6] hover:underline disabled:opacity-50">
                              {revealingKey === 'paystack' ? 'Loading...' : '🔍 Reveal Key'}
                            </button>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Public Key</label>
                          <input type="text" value={(gateways.paystack?.publishableKey as string) || ''} onChange={(e) => setGw('paystack', { publishableKey: filterSafeText(e.target.value) })} placeholder="pk_live_xxxxxxxxxxxxx" className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ImgBB */}
                  <div className="border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setEditingProvider(editingProvider === 'imgbb' ? null : 'imgbb')}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center"><FiImage className="w-5 h-5 text-green-600" /></div>
                        <div className="text-left">
                          <p className="font-medium text-gray-900 dark:text-white">ImgBB</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{settings.imgbbApiKey ? 'Key configured' : 'Not configured'} — Image uploads</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {settings.imgbbApiKey && <span className="w-2 h-2 bg-green-500 rounded-full" />}
                        <FiEdit2 className="w-4 h-4 text-gray-400" />
                        {editingProvider === 'imgbb' ? <FiChevronUp className="w-4 h-4 text-gray-400" /> : <FiChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </button>
                    {editingProvider === 'imgbb' && (
                      <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-4 space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">API Key</label>
                          <div className="relative">
                            <input
                              type={showApiKeys.imgbb ? 'text' : 'password'}
                              value={settings.imgbbApiKey}
                              onChange={(e) => setSettings({...settings, imgbbApiKey: filterSafeText(e.target.value)})}
                              placeholder="Your ImgBB API key"
                              className="w-full px-4 py-2.5 pr-10 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                            />
                            <button type="button" onClick={() => setShowApiKeys({...showApiKeys, imgbb: !showApiKeys.imgbb})} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                              {showApiKeys.imgbb ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                            </button>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-1">Get a free API key from imgbb.com/api. Used for logo & image uploads.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'integrations' && (
            <div className="space-y-6">
              {/* SMTP / Email */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Email (SMTP)</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Used to send OTP emails, order confirmations, and notifications. Works with Brevo, Gmail SMTP, or any SMTP provider.</p>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SMTP Host</label>
                      <input type="text" value={smtpConfig.host} onChange={(e) => setSmtpConfig({ ...smtpConfig, host: filterSafeText(e.target.value) })} placeholder="smtp-relay.brevo.com" className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SMTP Port</label>
                      <input type="text" value={smtpConfig.port} onChange={(e) => setSmtpConfig({ ...smtpConfig, port: filterSafeText(e.target.value) })} placeholder="587" className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                      <p className="text-[11px] text-gray-400 mt-1">Use 587 (TLS) or 465 (SSL)</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SMTP Username</label>
                      <input type="text" value={smtpConfig.user} onChange={(e) => setSmtpConfig({ ...smtpConfig, user: filterSafeText(e.target.value) })} placeholder="your-brevo-login@email.com" className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SMTP Password / API Key</label>
                      <div className="relative">
                        <input
                          type={showIntegrationKey.smtpPass ? 'text' : 'password'}
                          value={smtpConfig.password}
                          onChange={(e) => setSmtpConfig({ ...smtpConfig, password: filterSafeText(e.target.value) })}
                          placeholder={smtpConfig.hasPassword ? '••••••••••• (set — enter new to replace)' : 'xsmtpAPIkey'}
                          className="w-full px-4 py-2.5 pr-10 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                        <button type="button" onClick={() => setShowIntegrationKey({ ...showIntegrationKey, smtpPass: !showIntegrationKey.smtpPass })} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showIntegrationKey.smtpPass ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From Address</label>
                    <input type="email" value={smtpConfig.from} onChange={(e) => setSmtpConfig({ ...smtpConfig, from: filterSafeText(e.target.value) })} placeholder="noreply@ultrawash.com" className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                    <p className="text-[11px] text-gray-400 mt-1">This address appears in the &ldquo;From&rdquo; field of all outgoing emails.</p>
                  </div>
                </div>
              </div>

              {/* Twilio SMS */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">SMS (Twilio)</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Used for OTP delivery via SMS. Get credentials from <span className="text-[#00BFA6]">console.twilio.com</span>. Optional — if not configured, OTP falls back to email.</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account SID</label>
                    <input type="text" value={twilioConfig.accountSid} onChange={(e) => setTwilioConfig({ ...twilioConfig, accountSid: filterSafeText(e.target.value) })} placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Auth Token</label>
                    <div className="relative">
                      <input
                        type={showIntegrationKey.twilioToken ? 'text' : 'password'}
                        value={twilioConfig.authToken}
                        onChange={(e) => setTwilioConfig({ ...twilioConfig, authToken: filterSafeText(e.target.value) })}
                        placeholder={twilioConfig.hasAuthToken ? '••••••••••• (set — enter new to replace)' : 'your-auth-token'}
                        className="w-full px-4 py-2.5 pr-10 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                      <button type="button" onClick={() => setShowIntegrationKey({ ...showIntegrationKey, twilioToken: !showIntegrationKey.twilioToken })} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showIntegrationKey.twilioToken ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Twilio Phone Number</label>
                    <input type="text" value={twilioConfig.phoneNumber} onChange={(e) => setTwilioConfig({ ...twilioConfig, phoneNumber: filterPhoneInput(e.target.value) })} placeholder="+12345678900" className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                    <p className="text-[11px] text-gray-400 mt-1">Must be in E.164 format (e.g. +12345678900). Purchase a number from Twilio Console.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Notification Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl"><div><p className="font-medium text-gray-900 dark:text-white">Order Confirmation</p><p className="text-sm text-gray-500 dark:text-gray-400">Send email when order is placed</p></div><ToggleSwitch enabled={settings.orderConfirmation} onChange={() => setSettings({...settings, orderConfirmation: !settings.orderConfirmation})} /></div>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl"><div><p className="font-medium text-gray-900 dark:text-white">Order Status Updates</p><p className="text-sm text-gray-500 dark:text-gray-400">Notify customers when order status changes</p></div><ToggleSwitch enabled={settings.orderStatusUpdates} onChange={() => setSettings({...settings, orderStatusUpdates: !settings.orderStatusUpdates})} /></div>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl"><div><p className="font-medium text-gray-900 dark:text-white">Promotional Emails</p><p className="text-sm text-gray-500 dark:text-gray-400">Send marketing and promotional content</p></div><ToggleSwitch enabled={settings.promotionalEmails} onChange={() => setSettings({...settings, promotionalEmails: !settings.promotionalEmails})} /></div>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl"><div><p className="font-medium text-gray-900 dark:text-white">SMS Notifications</p><p className="text-sm text-gray-500 dark:text-gray-400">Send text messages for important updates</p></div><ToggleSwitch enabled={settings.smsNotifications} onChange={() => setSettings({...settings, smsNotifications: !settings.smsNotifications})} /></div>
              </div>
            </div>
          )}

          {/* {activeSection === 'security' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Security Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl"><div><p className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</p><p className="text-sm text-gray-500 dark:text-gray-400">Require 2FA for admin accounts</p></div><ToggleSwitch enabled={settings.twoFactorAuth} onChange={() => setSettings({...settings, twoFactorAuth: !settings.twoFactorAuth})} /></div>
                <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800"><div><p className="font-medium text-gray-900 dark:text-white">Maintenance Mode</p><p className="text-sm text-yellow-700 dark:text-yellow-300">Site will be inaccessible to users</p></div><ToggleSwitch enabled={settings.maintenanceMode} onChange={() => setSettings({...settings, maintenanceMode: !settings.maintenanceMode})} /></div>
              </div>
            </div>
          )} */}

          {activeSection === 'footer' && (
            <div className="space-y-6">
              {/* Logo & Branding */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Logo & Branding</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Upload your brand logos. Use PNG with transparent backgrounds for best results.</p>
                <div className="space-y-6">
                  {/* Footer Logo Upload */}
                  <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/30">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Footer Logo</label>
                    <div className="flex items-center gap-5">
                      <div className="w-48 h-20 bg-linear-to-br from-[#001529] to-[#002b4d] rounded-xl flex items-center justify-center overflow-hidden border border-gray-600/30 shadow-inner p-3">
                        {settings.footerLogo ? (
                          <SafeImage src={settings.footerLogo} alt="Footer Logo" width={160} height={60} className="object-contain max-h-full" unoptimized />
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <FiImage className="w-6 h-6 text-gray-500" />
                            <span className="text-[10px] text-gray-500">No logo</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors ${uploading === 'footerLogo' ? 'bg-gray-200 dark:bg-gray-600 text-gray-500' : 'bg-[#00BFA6] text-white hover:bg-[#00A892]'}`}>
                          {uploading === 'footerLogo' ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiUpload className="w-4 h-4" />}
                          {uploading === 'footerLogo' ? 'Uploading...' : 'Upload Logo'}
                          <input type="file" accept="image/*" className="hidden" disabled={uploading === 'footerLogo'}
                            onChange={(e) => { if (e.target.files?.[0]) uploadToImgBB(e.target.files[0], 'footerLogo'); }}
                          />
                        </label>
                        {settings.footerLogo && (
                          <button onClick={() => setSettings({...settings, footerLogo: ''})} className="flex items-center gap-1 px-3 py-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm">
                            <FiTrash2 className="w-3.5 h-3.5" /> Remove
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-2">Displayed in the dark footer. Recommended: PNG with transparent background, 200×60px or similar.</p>
                  </div>

                  {/* Header Logo Upload */}
                  <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/30">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Header Logo</label>
                    <div className="flex items-center gap-5">
                      <div className="w-48 h-20 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-600 shadow-inner p-3">
                        {settings.headerLogo ? (
                          <SafeImage src={settings.headerLogo} alt="Header Logo" width={160} height={60} className="object-contain max-h-full" unoptimized />
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <FiImage className="w-6 h-6 text-gray-300 dark:text-gray-500" />
                            <span className="text-[10px] text-gray-400">No logo</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors ${uploading === 'headerLogo' ? 'bg-gray-200 dark:bg-gray-600 text-gray-500' : 'bg-[#00BFA6] text-white hover:bg-[#00A892]'}`}>
                          {uploading === 'headerLogo' ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiUpload className="w-4 h-4" />}
                          {uploading === 'headerLogo' ? 'Uploading...' : 'Upload Logo'}
                          <input type="file" accept="image/*" className="hidden" disabled={uploading === 'headerLogo'}
                            onChange={(e) => { if (e.target.files?.[0]) uploadToImgBB(e.target.files[0], 'headerLogo'); }}
                          />
                        </label>
                        {settings.headerLogo && (
                          <button onClick={() => setSettings({...settings, headerLogo: ''})} className="flex items-center gap-1 px-3 py-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm">
                            <FiTrash2 className="w-3.5 h-3.5" /> Remove
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-2">Displayed in the navigation bar. Works best with transparent PNG on light background.</p>
                  </div>
                </div>
              </div>

              {/* Footer Content */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Footer Content</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"><FiType className="w-4 h-4 inline mr-2" />Footer Description</label>
                    <textarea
                      value={settings.footerDescription}
                      onChange={(e) => setSettings({...settings, footerDescription: filterSafeText(e.target.value)})}
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none"
                      placeholder="Short description displayed in the footer..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Copyright Text</label>
                    <input
                      type="text"
                      value={settings.copyrightText}
                      onChange={(e) => setSettings({...settings, copyrightText: filterSafeText(e.target.value)})}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      placeholder="Use {year} for dynamic year. e.g. © {year} Ultra Wash"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">Use <code className="bg-gray-100 dark:bg-gray-600 px-1 rounded">{'{year}'}</code> to auto-insert current year</p>
                  </div>
                </div>
              </div>

              {/* Social Media Links */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">📱 Social Media Links</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Add your social media profiles with custom icons</p>
                  </div>
                  <button
                    onClick={() => setSettings({...settings, socialMediaLinks: [...settings.socialMediaLinks, { name: '', url: '', icon: '' }]})}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#00BFA6] text-white rounded-lg text-sm hover:bg-[#00A892] transition-colors"
                  >
                    <FiPlus className="w-4 h-4" /> Add Social Link
                  </button>
                </div>
                {settings.socialMediaLinks.length === 0 ? (
                  <div className="p-6 text-center bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <FiLink className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No social media links added yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {settings.socialMediaLinks.map((link, index) => (
                      <div key={index} className="p-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/30">
                        <div className="flex items-start gap-3">
                          {/* Icon Upload */}
                          <div className="shrink-0">
                            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Icon</label>
                            <div className="relative">
                              <div className="w-14 h-14 bg-white dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-500 rounded-xl flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#00BFA6] transition-colors group">
                                {socialMediaUploading === index ? (
                                  <FiLoader className="w-5 h-5 text-[#00BFA6] animate-spin" />
                                ) : link.icon ? (
                                  <SafeImage src={link.icon} alt="icon" width={40} height={40} className="object-contain" unoptimized />
                                ) : (
                                  <FiUpload className="w-5 h-5 text-gray-400 group-hover:text-[#00BFA6] transition-colors" />
                                )}
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                  disabled={socialMediaUploading === index}
                                  onChange={(e) => { if (e.target.files?.[0]) uploadSocialMediaIcon(e.target.files[0], index); }}
                                />
                              </div>
                              {link.icon && (
                                <button
                                  onClick={() => {
                                    const updated = [...settings.socialMediaLinks];
                                    updated[index] = { ...updated[index], icon: '' };
                                    setSettings({...settings, socialMediaLinks: updated});
                                  }}
                                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] hover:bg-red-600 transition-colors"
                                  title="Remove icon"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Name & URL Fields */}
                          <div className="flex-1 space-y-2">
                            <div>
                              <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Platform Name *</label>
                              <input
                                type="text"
                                value={link.name}
                                onChange={(e) => {
                                  const updated = [...settings.socialMediaLinks];
                                  updated[index] = { ...updated[index], name: filterSafeText(e.target.value) };
                                  setSettings({...settings, socialMediaLinks: updated});
                                }}
                                placeholder="e.g. Facebook, Instagram, Twitter"
                                className="w-full h-10 px-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-[#00BFA6]"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Profile URL *</label>
                              <input
                                type="url"
                                value={link.url}
                                onChange={(e) => {
                                  const updated = [...settings.socialMediaLinks];
                                  updated[index] = { ...updated[index], url: filterSafeText(e.target.value) };
                                  setSettings({...settings, socialMediaLinks: updated});
                                }}
                                placeholder="https://facebook.com/yourpage"
                                className="w-full h-10 px-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-[#00BFA6]"
                              />
                            </div>
                          </div>

                          {/* Delete Button */}
                          <button
                            onClick={() => {
                              const updated = settings.socialMediaLinks.filter((_, i) => i !== index);
                              setSettings({...settings, socialMediaLinks: updated});
                            }}
                            className="mt-5 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg shrink-0 transition-colors"
                            title="Remove link"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* App Store Links */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">📱 App Download Links</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Add app store links with logos (Play Store, App Store, etc.)</p>
                  </div>
                  <button
                    onClick={() => setSettings({...settings, appDownloadLinks: [...settings.appDownloadLinks, { name: '', url: '', logo: '' }]})}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#00BFA6] text-white rounded-lg text-sm hover:bg-[#00A892] transition-colors"
                  >
                    <FiPlus className="w-4 h-4" /> Add Link
                  </button>
                </div>
                {settings.appDownloadLinks.length === 0 ? (
                  <div className="p-6 text-center bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <FiDownload className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No app download links added yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {settings.appDownloadLinks.map((link, index) => (
                      <div key={index} className="p-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/30">
                        <div className="flex items-start gap-3">
                          {/* Logo Upload */}
                          <div className="shrink-0">
                            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Logo</label>
                            <div className="relative">
                              <div className="w-14 h-14 bg-white dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-500 rounded-xl flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#00BFA6] transition-colors group">
                                {link.logo ? (
                                  <SafeImage src={link.logo} alt="logo" width={40} height={40} className="object-contain" unoptimized />
                                ) : appDownloadUploading === index ? (
                                  <FiLoader className="w-5 h-5 text-[#00BFA6] animate-spin" />
                                ) : (
                                  <FiUpload className="w-5 h-5 text-gray-400 group-hover:text-[#00BFA6] transition-colors" />
                                )}
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                  disabled={appDownloadUploading === index}
                                  onChange={(e) => { if (e.target.files?.[0]) uploadAppDownloadLogo(e.target.files[0], index); }}
                                />
                              </div>
                              {link.logo && (
                                <button
                                  onClick={() => {
                                    const updated = [...settings.appDownloadLinks];
                                    updated[index] = { ...updated[index], logo: '' };
                                    setSettings({...settings, appDownloadLinks: updated});
                                  }}
                                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] hover:bg-red-600 transition-colors"
                                  title="Remove logo"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Name & URL Fields */}
                          <div className="flex-1 space-y-2">
                            <div>
                              <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Store Name *</label>
                              <input
                                type="text"
                                value={link.name}
                                onChange={(e) => {
                                  const updated = [...settings.appDownloadLinks];
                                  updated[index] = { ...updated[index], name: filterSafeText(e.target.value) };
                                  setSettings({...settings, appDownloadLinks: updated});
                                }}
                                placeholder="e.g. Google Play, App Store"
                                className="w-full h-10 px-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-[#00BFA6]"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Store URL *</label>
                              <input
                                type="url"
                                value={link.url}
                                onChange={(e) => {
                                  const updated = [...settings.appDownloadLinks];
                                  updated[index] = { ...updated[index], url: filterSafeText(e.target.value) };
                                  setSettings({...settings, appDownloadLinks: updated});
                                }}
                                placeholder="https://play.google.com/store/apps/details?id=..."
                                className="w-full h-10 px-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-[#00BFA6]"
                              />
                            </div>
                          </div>

                          {/* Delete Button */}
                          <button
                            onClick={() => {
                              const updated = settings.appDownloadLinks.filter((_, i) => i !== index);
                              setSettings({...settings, appDownloadLinks: updated});
                            }}
                            className="mt-5 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg shrink-0 transition-colors"
                            title="Remove link"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Links Manager */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">🔗 Footer Quick Links</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Add custom links with icons to the footer. Leave empty to use default links.</p>
                  </div>
                  <button
                    onClick={() => setSettings({...settings, footerQuickLinks: [...settings.footerQuickLinks, { name: '', url: '', icon: '' }]})}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#00BFA6] text-white rounded-lg text-sm hover:bg-[#00A892] transition-colors"
                  >
                    <FiPlus className="w-4 h-4" /> Add Link
                  </button>
                </div>
                {settings.footerQuickLinks.length === 0 ? (
                  <div className="p-6 text-center bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <FiLink className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No custom links. Default links (Home, About, Services, Contact) will be shown.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {settings.footerQuickLinks.map((link, index) => (
                      <div key={index} className="p-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/30">
                        <div className="flex items-start gap-3">
                          {/* Icon Upload */}
                          <div className="shrink-0">
                            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Icon</label>
                            <div className="relative">
                              <div className="w-14 h-14 bg-white dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-500 rounded-xl flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#00BFA6] transition-colors group">
                                {quickLinkUploading === index ? (
                                  <FiLoader className="w-5 h-5 text-[#00BFA6] animate-spin" />
                                ) : link.icon ? (
                                  <SafeImage src={link.icon} alt="icon" width={40} height={40} className="object-contain" unoptimized />
                                ) : (
                                  <FiUpload className="w-5 h-5 text-gray-400 group-hover:text-[#00BFA6] transition-colors" />
                                )}
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                  disabled={quickLinkUploading === index}
                                  onChange={(e) => { if (e.target.files?.[0]) uploadQuickLinkIcon(e.target.files[0], index); }}
                                />
                              </div>
                              {link.icon && (
                                <button
                                  onClick={() => {
                                    const updated = [...settings.footerQuickLinks];
                                    updated[index] = { ...updated[index], icon: '' };
                                    setSettings({...settings, footerQuickLinks: updated});
                                  }}
                                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] hover:bg-red-600 transition-colors"
                                  title="Remove icon"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Name & URL Fields */}
                          <div className="flex-1 space-y-2">
                            <div>
                              <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Link Name *</label>
                              <input
                                type="text"
                                value={link.name}
                                onChange={(e) => {
                                  const updated = [...settings.footerQuickLinks];
                                  updated[index] = { ...updated[index], name: filterSafeText(e.target.value) };
                                  setSettings({...settings, footerQuickLinks: updated});
                                }}
                                placeholder="e.g. About Us"
                                className="w-full h-10 px-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-[#00BFA6]"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">URL *</label>
                              <input
                                type="text"
                                value={link.url}
                                onChange={(e) => {
                                  const updated = [...settings.footerQuickLinks];
                                  updated[index] = { ...updated[index], url: filterSafeText(e.target.value) };
                                  setSettings({...settings, footerQuickLinks: updated});
                                }}
                                placeholder="e.g. /about or https://example.com"
                                className="w-full h-10 px-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-[#00BFA6]"
                              />
                            </div>
                          </div>

                          {/* Delete Button */}
                          <button
                            onClick={() => {
                              const updated = settings.footerQuickLinks.filter((_, i) => i !== index);
                              setSettings({...settings, footerQuickLinks: updated});
                            }}
                            className="mt-5 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg shrink-0 transition-colors"
                            title="Remove link"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Live Preview */}
              <div className="bg-[#001529] rounded-2xl p-6 border border-gray-700">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">🔍 Live Preview</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {/* Brand */}
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      {settings.footerLogo ? (
                        <SafeImage src={settings.footerLogo} alt="Preview" width={120} height={40} className="object-contain" unoptimized />
                      ) : (
                        <span className="text-white font-bold text-lg">{settings.siteName}</span>
                      )}
                    </div>
                    <p className="text-gray-400 text-xs mb-3">{settings.footerDescription}</p>
                    <div className="flex gap-2">
                      {settings.socialMediaLinks.length > 0 ? (
                        settings.socialMediaLinks.filter(s => s.url).map((link, idx) => (
                          <div key={idx} className="w-7 h-7 bg-white/10 rounded flex items-center justify-center" title={link.name}>
                            {link.icon ? (
                              <SafeImage src={link.icon} alt={link.name} width={14} height={14} className="w-3.5 h-3.5 object-contain" unoptimized />
                            ) : (
                              <span className="text-[10px] text-gray-400">{link.name.substring(0, 2).toUpperCase()}</span>
                            )}
                          </div>
                        ))
                      ) : (
                        <>
                          <div className="w-7 h-7 bg-white/10 rounded flex items-center justify-center text-[10px] text-gray-400">FB</div>
                          <div className="w-7 h-7 bg-white/10 rounded flex items-center justify-center text-[10px] text-gray-400">X</div>
                          <div className="w-7 h-7 bg-white/10 rounded flex items-center justify-center text-[10px] text-gray-400">IG</div>
                          <div className="w-7 h-7 bg-white/10 rounded flex items-center justify-center text-[10px] text-gray-400">LI</div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Quick Links Preview */}
                  <div>
                    <p className="text-white text-sm font-semibold mb-3">Quick Links</p>
                    <ul className="space-y-1.5">
                      {(settings.footerQuickLinks.length > 0
                        ? settings.footerQuickLinks.map(l => ({ name: l.name || 'Untitled', icon: l.icon }))
                        : [{ name: 'Home', icon: '' }, { name: 'About', icon: '' }, { name: 'Services', icon: '' }, { name: 'Contact', icon: '' }]
                      ).map((l, i) => (
                        <li key={i} className="flex items-center gap-2 text-gray-400 text-xs">
                          {l.icon && <SafeImage src={l.icon} alt="" width={14} height={14} className="w-3.5 h-3.5 object-contain" unoptimized />}
                          <span>{l.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Contact Preview */}
                  <div>
                    <p className="text-white text-sm font-semibold mb-3">Contact</p>
                    <ul className="space-y-1.5 text-gray-400 text-xs">
                      <li>📞 {settings.phone || 'Not set'}</li>
                      <li>✉️ {settings.email || 'Not set'}</li>
                      <li>📍 {settings.address || 'Not set'}</li>
                    </ul>
                  </div>
                </div>
                <div className="border-t border-white/10 pt-3 mt-4">
                  <p className="text-gray-500 text-xs text-center">
                    {settings.copyrightText.replace('{year}', new Date().getFullYear().toString())}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettingsPage;
