'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { filterSafeText, filterNumberInput, filterDigitsOnly } from '@/lib/inputValidation';
import SafeImage from '@/components/ui/SafeImage';
import { 
  FiSearch, 
  FiPlus,
  FiEdit2, 
  FiTrash2,
  FiMoreVertical,
  FiX,
  FiImage,
  FiDollarSign,
  FiToggleLeft,
  FiToggleRight,
  FiLoader,
  FiUpload
} from 'react-icons/fi';
import api from '@/services/api';
import { useTheme } from '@/context/ThemeContext';

interface Service {
  _id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  shortDescription?: string;
  pricingType: 'per_kg' | 'per_item';
  pricePerKg: number;
  pricePerItem: number;
  estimatedDays: number;
  features: string[];
  image: string;
  isActive: boolean;
  sortOrder: number;
}

const DEFAULT_CATEGORIES = [
  { value: 'wash-fold', label: 'Wash & Fold' },
  { value: 'wash-iron', label: 'Wash & Iron' },
  { value: 'dry-cleaning', label: 'Dry Cleaning' },
  { value: 'ironing', label: 'Ironing' },
  { value: 'special-care', label: 'Special Care' },
  { value: 'alterations', label: 'Alterations' },
];

const AdminServicesPage = () => {
  const { formatPrice } = useTheme();
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Form state
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPricingType, setFormPricingType] = useState('per_item');
  const [formPricePerKg, setFormPricePerKg] = useState('');
  const [formPricePerItem, setFormPricePerItem] = useState('');
  const [formEstimatedDays, setFormEstimatedDays] = useState('3');
  const [formSortOrder, setFormSortOrder] = useState('0');
  const [formIsActive, setFormIsActive] = useState(true);

  // Image upload state
  const [formImage, setFormImage] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState('');
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Category management state
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  const [customCategories, setCustomCategories] = useState<{ value: string; label: string }[]>([]);
  const [backendCategories, setBackendCategories] = useState<{ value: string; label: string }[]>([]);

  // Fetch categories from backend
  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get('/admin/categories');
      if (res.data?.status === 'success' && Array.isArray(res.data.data)) {
        setBackendCategories(res.data.data.map((cat: { slug: string; name: string }) => ({
          value: cat.slug,
          label: cat.name,
        })));
      }
    } catch {
      // Backend may not have categories endpoint yet — that's fine
    }
  }, []);

  // Build dynamic categories from defaults + backend + existing services + custom
  // Normalize slugs: convert underscores to hyphens for consistent matching
  const normalizeSlug = (slug: string) => slug.replace(/_/g, '-').toLowerCase();

  const allCategories = useMemo(() => {
    const catMap = new Map<string, string>();
    DEFAULT_CATEGORIES.forEach((c) => catMap.set(normalizeSlug(c.value), c.label));
    backendCategories.forEach((c) => catMap.set(normalizeSlug(c.value), c.label));
    services.forEach((s) => {
      if (s.category) {
        const normalized = normalizeSlug(s.category);
        if (!catMap.has(normalized)) {
          const label = s.category.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
          catMap.set(normalized, label);
        }
      }
    });
    customCategories.forEach((c) => catMap.set(normalizeSlug(c.value), c.label));
    return Array.from(catMap, ([value, label]) => ({ value, label }));
  }, [services, customCategories, backendCategories]);

  // Only show categories that have actual services in the filter dropdown
  const categoriesWithData = useMemo(() => {
    return allCategories.filter((cat) =>
      services.some((s) => normalizeSlug(s.category) === cat.value)
    );
  }, [allCategories, services]);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/services');
      if (res.data.status === 'success') {
        setServices(Array.isArray(res.data.data) ? res.data.data : []);
      }
    } catch {

    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchServices(); fetchCategories(); }, [fetchServices, fetchCategories]);

  const openCreateModal = () => {
    setEditingService(null);
    setFormName(''); setFormCategory(''); setFormDescription('');
    setFormPricingType('per_item'); setFormPricePerKg(''); setFormPricePerItem('');
    setFormEstimatedDays('3'); setFormSortOrder('0'); setFormIsActive(true);
    setFormImage(''); setImageError(''); setShowNewCategory(false); setNewCategoryLabel('');
    setShowServiceModal(true);
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    setFormName(service.name); setFormCategory(service.category); setFormDescription(service.description);
    setFormPricingType(service.pricingType); setFormPricePerKg(service.pricePerKg?.toString() || '');
    setFormPricePerItem(service.pricePerItem?.toString() || '');
    setFormEstimatedDays(service.estimatedDays?.toString() || '3');
    setFormSortOrder(service.sortOrder?.toString() || '0'); setFormIsActive(service.isActive);
    setFormImage(service.image || ''); setImageError(''); setShowNewCategory(false); setNewCategoryLabel('');
    setShowServiceModal(true);
  };

  // Image upload handler (ImgBB)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageError('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image must be less than 5MB');
      return;
    }

    setImageUploading(true);
    setImageError('');

    try {
      // Use backend endpoint — API key is read from DB (admin settings)
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/upload/imgbb', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.status === 'success' && res.data?.data?.url) {
        setFormImage(res.data.data.url);
      } else {
        setImageError('Image upload failed. Please try again.');
      }
    } catch {
      setImageError('Image upload failed. Please try again.');
    } finally {
      setImageUploading(false);
      // Reset file input so same file can be re-selected
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  // Add new category handler — saves to backend + updates local state immediately
  const handleAddNewCategory = async () => {
    const label = newCategoryLabel.trim();
    if (!label) return;
    const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Immediately add to local custom categories so dropdown updates in real-time
    setCustomCategories((prev) => {
      if (prev.some((c) => c.value === slug)) return prev;
      return [...prev, { value: slug, label }];
    });
    setFormCategory(slug);
    setShowNewCategory(false);
    setNewCategoryLabel('');

    // Also try to persist to backend (fire-and-forget)
    try {
      await api.post('/admin/categories', { name: label, slug });
      fetchCategories();
    } catch {
      // Backend may not have categories endpoint — category still works as plain string on services
    }
  };

  const handleSaveService = async () => {
    try {
      setSaving(true);
      const payload: Record<string, unknown> = {
        name: formName,
        category: formCategory,
        description: formDescription,
        pricingType: formPricingType,
        pricePerKg: formPricingType === 'per_kg' ? (parseFloat(formPricePerKg) || 0) : 0,
        pricePerItem: formPricingType === 'per_item' ? (parseFloat(formPricePerItem) || 0) : 0,
        estimatedDays: parseInt(formEstimatedDays) || 3,
        sortOrder: parseInt(formSortOrder) || 0,
        isActive: formIsActive,
      };
      // Always send image field so backend stores it on both create and update
      payload.image = formImage || '';
      if (editingService) {
        await api.put(`/admin/services/${editingService._id}`, payload);
      } else {
        await api.post('/admin/services', payload);
      }
      setShowServiceModal(false);
      fetchServices();
    } catch {

    } finally {
      setSaving(false);
    }
  };

  const handleDeleteService = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/admin/services/${deleteTarget}`);
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      fetchServices();
    } catch {

    }
  };

  const handleToggleActive = async (service: Service) => {
    try {
      await api.put(`/admin/services/${service._id}`, { isActive: !service.isActive });
      fetchServices();
    } catch {

    }
  };

  return (
    <AdminLayout>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Service Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your laundry services and pricing</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-[#0F2744] dark:bg-[#00BFA6] text-white rounded-lg hover:bg-[#1a3a5c] dark:hover:bg-[#00A892] transition-colors"
        >
          <FiPlus className="w-4 h-4" />
          <span>Add Service</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#00BFA6] focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option value="">All Categories</option>
            {categoriesWithData.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <FiLoader className="w-8 h-8 text-[#00BFA6] animate-spin" />
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {services
          .filter(s => {
            const matchSearch = !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchCategory = !filterCategory || normalizeSlug(s.category) === filterCategory;
            return matchSearch && matchCategory;
          })
          .map((service) => (
          <div 
            key={service._id}
            className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col ${
              !service.isActive ? 'opacity-60' : ''
            }`}
          >
            {/* Service Image */}
            <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
              {service.image && service.image.startsWith('http') ? (
                <SafeImage src={service.image} alt={service.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" unoptimized />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <FiImage className="w-12 h-12 text-gray-400" />
                </div>
              )}
              {/* Status Badge */}
              <div className="absolute top-3 right-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  service.isActive 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {service.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              {/* Sort Order */}
              <div className="absolute top-3 left-3 w-8 h-8 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center shadow">
                <span className="text-sm font-bold text-gray-600 dark:text-gray-400">{service.sortOrder}</span>
              </div>
            </div>

            {/* Service Info */}
            <div className="p-4 flex flex-col flex-1">
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">{service.name}</h3>
                  <p className="text-xs text-[#00BFA6]">{allCategories.find(c => c.value === normalizeSlug(service.category))?.label || service.category.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</p>
                </div>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <FiMoreVertical className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                {service.description}
              </p>

              {/* Pricing */}
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <FiDollarSign className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {service.pricingType === 'per_kg' ? `${formatPrice(service.pricePerKg ?? 0)} per kg` : `${formatPrice(service.pricePerItem ?? 0)} per item`}
                  </span>
                </div>
                {service.features && service.features.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {service.features.slice(0, 3).map((feature, idx) => (
                    <span key={idx} className="text-xs px-2 py-1 bg-white dark:bg-gray-600 rounded-lg text-gray-600 dark:text-gray-300">
                      {feature}
                    </span>
                  ))}
                  {service.features.length > 3 && (
                    <span className="text-xs px-2 py-1 bg-[#00BFA6]/10 text-[#00BFA6] rounded-lg">
                      +{service.features.length - 3} more
                    </span>
                  )}
                </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-auto">
                <button
                  onClick={() => openEditModal(service)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm whitespace-nowrap"
                  title="Edit"
                >
                  <FiEdit2 className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Edit</span>
                </button>
                <button
                  onClick={() => handleToggleActive(service)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg transition-colors text-sm whitespace-nowrap ${
                    service.isActive
                      ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                  title={service.isActive ? 'Disable' : 'Enable'}
                >
                  {service.isActive ? (
                    <>
                      <FiToggleRight className="w-4 h-4 shrink-0" />
                      <span className="hidden sm:inline">Disable</span>
                    </>
                  ) : (
                    <>
                      <FiToggleLeft className="w-4 h-4 shrink-0" />
                      <span className="hidden sm:inline">Enable</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => { setDeleteTarget(service._id); setShowDeleteConfirm(true); }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm whitespace-nowrap"
                  title="Delete"
                >
                  <FiTrash2 className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Add/Edit Service Modal */}
      {showServiceModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowServiceModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingService ? 'Edit Service' : 'Add New Service'}
                </h3>
                <button 
                  onClick={() => setShowServiceModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Service Name *</label>
                    <input 
                      type="text" 
                      value={formName}
                      onChange={(e) => setFormName(filterSafeText(e.target.value))}
                      placeholder="e.g., Wash & Fold"
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category *</label>
                    {showNewCategory ? (
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          value={newCategoryLabel}
                          onChange={(e) => setNewCategoryLabel(filterSafeText(e.target.value))}
                          placeholder="New category name..."
                          className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleAddNewCategory}
                          className="px-3 py-2.5 bg-[#00BFA6] text-white rounded-lg hover:bg-[#00A892] transition-colors text-sm"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowNewCategory(false); setNewCategoryLabel(''); }}
                          className="px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <select
                          value={formCategory}
                          onChange={(e) => setFormCategory(e.target.value)}
                          className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="">Select category...</option>
                          {allCategories.map((cat) => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setShowNewCategory(true)}
                          className="px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1 text-sm text-[#00BFA6] whitespace-nowrap"
                          title="Add new category"
                        >
                          <FiPlus className="w-4 h-4" />
                          New
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description *</label>
                  <textarea 
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(filterSafeText(e.target.value))}
                    placeholder="Service description..."
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none" 
                  />
                </div>

                {/* Pricing */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pricing Type *</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input type="radio" name="priceType" value="per_item" checked={formPricingType === 'per_item'} onChange={() => setFormPricingType('per_item')} />
                      <span className="text-gray-700 dark:text-gray-300">Per Item</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="priceType" value="per_kg" checked={formPricingType === 'per_kg'} onChange={() => setFormPricingType('per_kg')} />
                      <span className="text-gray-700 dark:text-gray-300">Per Kg</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {formPricingType === 'per_kg' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price per Kg</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={formPricePerKg}
                      onChange={(e) => setFormPricePerKg(filterNumberInput(e.target.value))}
                      placeholder="0.00"
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                    />
                  </div>
                  )}
                  {formPricingType === 'per_item' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price per Item</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={formPricePerItem}
                      onChange={(e) => setFormPricePerItem(filterNumberInput(e.target.value))}
                      placeholder="0.00"
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                    />
                  </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estimated Days</label>
                  <input 
                    type="number" 
                    value={formEstimatedDays}
                    onChange={(e) => setFormEstimatedDays(filterDigitsOnly(e.target.value))}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Service Image</label>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  {formImage ? (
                    <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600">
                      <div className="relative h-48">
                        <SafeImage src={formImage} alt="Service preview" fill sizes="100vw" className="object-cover" unoptimized />
                      </div>
                      <div className="absolute bottom-3 right-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => imageInputRef.current?.click()}
                          disabled={imageUploading}
                          className="px-3 py-1.5 bg-white/90 dark:bg-gray-800/90 rounded-lg text-sm font-medium hover:bg-white dark:hover:bg-gray-800 transition-colors flex items-center gap-1.5 shadow"
                        >
                          <FiUpload className="w-3.5 h-3.5" />
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormImage('')}
                          className="px-3 py-1.5 bg-red-500/90 text-white rounded-lg text-sm font-medium hover:bg-red-500 transition-colors flex items-center gap-1.5 shadow"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={imageUploading}
                      className="w-full border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl p-6 text-center hover:border-[#00BFA6] hover:bg-[#00BFA6]/5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {imageUploading ? (
                        <>
                          <FiLoader className="w-10 h-10 text-[#00BFA6] mx-auto mb-2 animate-spin" />
                          <p className="text-sm text-[#00BFA6] font-medium">Uploading...</p>
                        </>
                      ) : (
                        <>
                          <FiUpload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">Click to upload image</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                        </>
                      )}
                    </button>
                  )}
                  {imageError && (
                    <p className="text-sm text-red-500 mt-2">{imageError}</p>
                  )}
                </div>

                {/* Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sort Order</label>
                    <input 
                      type="number" 
                      value={formSortOrder}
                      onChange={(e) => setFormSortOrder(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formIsActive}
                        onChange={(e) => setFormIsActive(e.target.checked)}
                        className="w-5 h-5"
                      />
                      <span className="text-gray-700 dark:text-gray-300">Active</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowServiceModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveService}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-[#0F2744] dark:bg-[#00BFA6] text-white rounded-lg hover:bg-[#1a3a5c] dark:hover:bg-[#00A892] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <FiLoader className="w-4 h-4 animate-spin" />}
                  {editingService ? 'Update Service' : 'Create Service'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowDeleteConfirm(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-md">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 mx-auto mb-4 flex items-center justify-center">
                  <FiTrash2 className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete Service?</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  This action cannot be undone. All pricing and item data will be permanently deleted.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteService}
                    className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export default AdminServicesPage;
