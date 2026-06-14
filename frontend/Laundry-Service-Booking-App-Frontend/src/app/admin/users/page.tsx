'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import SafeImage from '@/components/ui/SafeImage';
import api from '@/services/api';
import { useTheme } from '@/context/ThemeContext';
import { 
  FiSearch, 
  FiDownload, 
  FiEye, 
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiMail,
  FiPhone,
  FiDollarSign,
  FiShoppingBag,
  FiLock,
  FiUnlock,
  FiLoader,
  FiUser,
  FiEdit,
  FiAlertCircle,
  FiCheck
} from 'react-icons/fi';

interface ApiUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isBlocked: boolean;
  profileImage: string | null;
  orders: number;
  totalSpent: number;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const AdminUsersPage = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const tabs = [
    { id: 'all', label: 'All Users' },
    { id: 'user', label: 'Customers' },
    { id: 'delivery', label: 'Delivery' },
    { id: 'staff', label: 'Staff' },
    { id: 'admin', label: 'Admins' },
    { id: 'blocked', label: 'Blocked' },
  ];

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', '15');
      if (activeTab !== 'all' && activeTab !== 'blocked') params.append('role', activeTab);
      if (activeTab === 'blocked') params.append('status', 'blocked');
      if (searchQuery) params.append('search', searchQuery);

      const res = await api.get(`/admin/users?${params.toString()}`);
      if (res.data.status === 'success') {
        setUsers(Array.isArray(res.data.data) ? res.data.data : []);
        setPagination(res.data.pagination);
      } else {

        showToast('Failed to fetch users', 'error');
      }
    } catch (err) {

      showToast('Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentPage, activeTab, searchQuery]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    const timer = setTimeout(() => { setSearchQuery(searchInput); setCurrentPage(1); }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => { setCurrentPage(1); }, [activeTab]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggleBlock = async (user: ApiUser) => {
    try {
      setActionLoading(true);
      const res = await api.put(`/admin/users/${user._id}`, { isBlocked: !user.isBlocked });
      if (res.data.status === 'success') {
        showToast(`User ${user.isBlocked ? 'unblocked' : 'blocked'} successfully`, 'success');
        fetchUsers();
      }
    } catch { showToast('Failed to update user', 'error'); }
    finally { setActionLoading(false); }
  };

  const handleChangeRole = async () => {
    if (!selectedUser || !newRole) return;
    try {
      setActionLoading(true);
      const res = await api.put(`/admin/users/${selectedUser._id}`, { role: newRole });
      if (res.data.status === 'success') {
        showToast(`Role changed to ${newRole}`, 'success');
        setShowRoleModal(false);
        fetchUsers();
      }
    } catch { showToast('Failed to change role', 'error'); }
    finally { setActionLoading(false); }
  };

  const getRoleBadge = (role: string) => {
    const config: Record<string, { bg: string; text: string }> = {
      user: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
      delivery: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400' },
      staff: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400' },
      admin: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
    };
    const c = config[role] || config.user;
    return <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${c.bg} ${c.text}`}>{role.charAt(0).toUpperCase() + role.slice(1)}</span>;
  };

  const getStatusBadge = (isBlocked: boolean) => (
    <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${!isBlocked ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
      {!isBlocked ? 'Active' : 'Blocked'}
    </span>
  );

  const { formatPrice } = useTheme();
  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const getUserInitials = (name: string) => { if (!name) return '?'; const p = name.trim().split(' '); return p.length >= 2 && p[0] && p[1] ? `${p[0][0]}${p[1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase(); };

  const getPageNumbers = () => {
    if (!pagination) return [];
    const { page, totalPages } = pagination;
    const pages: (number | string)[] = [];
    if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
    else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{pagination ? `${pagination.total} total users` : 'Manage customers and staff'}</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <FiDownload className="w-4 h-4" /><span className="hidden sm:inline">Export</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id ? 'bg-[#0F2744] dark:bg-[#00BFA6] text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="p-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Search by name, email, phone..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#00BFA6] focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20"><FiLoader className="w-8 h-8 text-[#00BFA6] animate-spin" /></div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <FiUser className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No users found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 lg:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap">User</th>
                    <th className="hidden sm:table-cell px-4 lg:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap">Contact</th>
                    <th className="px-4 lg:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap">Role</th>
                    <th className="hidden xl:table-cell px-4 lg:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap">Orders</th>
                    <th className="hidden xl:table-cell px-4 lg:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap">Spent</th>
                    <th className="hidden lg:table-cell px-4 lg:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap">Joined</th>
                    <th className="px-4 lg:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap">Status</th>
                    <th className="px-4 lg:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 lg:px-6 py-4">
                        <div className="flex items-center gap-3">
                          {user.profileImage ? (
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                              <SafeImage src={user.profileImage} alt={user.name} variant="avatar" width={40} height={40} className="w-full h-full object-cover" unoptimized />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#0F2744] to-[#00BFA6] flex items-center justify-center">
                              <span className="text-white text-sm font-bold">{getUserInitials(user.name)}</span>
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-medium text-gray-900 dark:text-white block truncate max-w-[120px] sm:max-w-[180px]">{user.name}</span>
                            <p className="text-xs text-gray-500 dark:text-gray-400 sm:hidden truncate max-w-[120px]">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-4 lg:px-6 py-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[180px]">{user.email}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[140px]">{user.phone}</p>
                      </td>
                      <td className="px-4 lg:px-6 py-4">{getRoleBadge(user.role)}</td>
                      <td className="hidden xl:table-cell px-4 lg:px-6 py-4 text-gray-700 dark:text-gray-300">{user.orders}</td>
                      <td className="hidden xl:table-cell px-4 lg:px-6 py-4 font-medium text-gray-900 dark:text-white">{formatPrice(user.totalSpent)}</td>
                      <td className="hidden lg:table-cell px-4 lg:px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{formatDate(user.createdAt)}</td>
                      <td className="px-4 lg:px-6 py-4">{getStatusBadge(user.isBlocked)}</td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setSelectedUser(user); setShowUserModal(true); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg" title="View"><FiEye className="w-4 h-4 text-gray-500" /></button>
                          <button onClick={() => { setSelectedUser(user); setNewRole(user.role); setShowRoleModal(true); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg" title="Change Role"><FiEdit className="w-4 h-4 text-[#00BFA6]" /></button>
                          <button onClick={() => handleToggleBlock(user)} disabled={actionLoading} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg disabled:opacity-50" title={user.isBlocked ? 'Unblock' : 'Block'}>
                            {user.isBlocked ? <FiUnlock className="w-4 h-4 text-green-500" /> : <FiLock className="w-4 h-4 text-red-500" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"><FiChevronLeft className="w-5 h-5" /></button>
                  {getPageNumbers().map((pn, i) => typeof pn === 'number' ? (
                    <button key={i} onClick={() => setCurrentPage(pn)} className={`px-4 py-2 rounded-lg text-sm font-medium ${currentPage === pn ? 'bg-[#0F2744] dark:bg-[#00BFA6] text-white' : 'border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>{pn}</button>
                  ) : <span key={i} className="px-2 text-gray-400">...</span>)}
                  <button onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))} disabled={currentPage === pagination.totalPages} className="p-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"><FiChevronRight className="w-5 h-5" /></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showUserModal && selectedUser && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowUserModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">User Details</h3>
                <button onClick={() => setShowUserModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><FiX className="w-5 h-5" /></button>
              </div>
              <div className="flex items-center gap-4 mb-6">
                {selectedUser.profileImage ? (
                  <div className="w-16 h-16 rounded-full overflow-hidden"><SafeImage src={selectedUser.profileImage} alt={selectedUser.name} variant="avatar" width={64} height={64} className="w-full h-full object-cover" unoptimized /></div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-linear-to-br from-[#0F2744] to-[#00BFA6] flex items-center justify-center"><span className="text-white text-xl font-bold">{getUserInitials(selectedUser.name)}</span></div>
                )}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">{selectedUser.name}</h4>
                  <div className="flex items-center gap-2 mt-1">{getRoleBadge(selectedUser.role)} {getStatusBadge(selectedUser.isBlocked)}</div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Joined {formatDate(selectedUser.createdAt)}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl"><FiMail className="w-5 h-5 text-gray-400" /><div><p className="text-xs text-gray-500">Email</p><p className="text-gray-900 dark:text-white">{selectedUser.email}</p></div></div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl"><FiPhone className="w-5 h-5 text-gray-400" /><div><p className="text-xs text-gray-500">Phone</p><p className="text-gray-900 dark:text-white">{selectedUser.phone || 'N/A'}</p></div></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-center"><FiShoppingBag className="w-5 h-5 text-[#00BFA6] mx-auto mb-1" /><p className="text-lg font-bold text-gray-900 dark:text-white">{selectedUser.orders}</p><p className="text-xs text-gray-500">Orders</p></div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-center"><FiDollarSign className="w-5 h-5 text-green-500 mx-auto mb-1" /><p className="text-lg font-bold text-gray-900 dark:text-white">{formatPrice(selectedUser.totalSpent)}</p><p className="text-xs text-gray-500">Spent</p></div>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button onClick={() => { setShowUserModal(false); setNewRole(selectedUser.role); setShowRoleModal(true); }} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"><FiEdit className="w-4 h-4" /> Change Role</button>
                <button onClick={() => { handleToggleBlock(selectedUser); setShowUserModal(false); }} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-white rounded-lg ${selectedUser.isBlocked ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}>
                  {selectedUser.isBlocked ? <><FiUnlock className="w-4 h-4" /> Unblock</> : <><FiLock className="w-4 h-4" /> Block</>}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {showRoleModal && selectedUser && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowRoleModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-md">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Change Role</h3>
                <button onClick={() => setShowRoleModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><FiX className="w-5 h-5" /></button>
              </div>
              <p className="text-sm text-gray-500 mb-1">User: <span className="font-medium text-gray-900 dark:text-white">{selectedUser.name}</span></p>
              <p className="text-sm text-gray-500 mb-4">Current: {getRoleBadge(selectedUser.role)}</p>
              <div className="grid grid-cols-2 gap-3">
                {['user', 'staff', 'delivery', 'admin'].map((role) => (
                  <button key={role} onClick={() => setNewRole(role)} className={`px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all ${newRole === role ? 'border-[#00BFA6] bg-[#00BFA6]/10 text-[#00BFA6]' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'}`}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </button>
                ))}
              </div>
              <div className="mt-6 flex gap-3">
                <button onClick={() => setShowRoleModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                <button onClick={handleChangeRole} disabled={actionLoading || newRole === selectedUser.role} className="flex-1 px-4 py-2.5 bg-[#0F2744] dark:bg-[#00BFA6] text-white rounded-lg disabled:opacity-50">{actionLoading ? 'Saving...' : 'Save'}</button>
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export default AdminUsersPage;
