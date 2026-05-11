import { Shield, ShieldAlert, Award, UserCheck, Settings, X, Search, Filter, Loader2, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useUser, type UserRole } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { userService } from '../services/userService';

export const Staff = () => {
  const navigate = useNavigate();
  const { role: currentUserRole } = useUser();
  const [staffList, setStaffList] = useState<any[]>([]);
  const [managingStaff, setManagingStaff] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters: any = {};
      if (roleFilter) filters.role = roleFilter;
      if (statusFilter) filters.status = statusFilter;
      
      const response = await userService.getAllUsers(filters);
      console.log('✅ Users fetched:', response);
      setStaffList(response.data || []);
    } catch (err: any) {
      console.error('❌ Error fetching users:', err);
      setError(err.response?.data?.error?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  if (currentUserRole !== 'super-admin') {
    return (
      <div className="p-8 text-center text-rose-500">
        <ShieldAlert className="mx-auto mb-4" size={48} />
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p>You do not have permission to view staff management.</p>
      </div>
    );
  }

  const handleUpdateStatus = async (userId: string, status: 'Approved' | 'Pending' | 'Revoked') => {
    try {
      await userService.updateUserStatus(userId, status);
      console.log('✅ User status updated');
      fetchUsers();
    } catch (err: any) {
      console.error('❌ Error updating status:', err);
      alert(err.response?.data?.error?.message || 'Failed to update status');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await userService.deleteUser(userId);
      console.log('✅ User deleted');
      fetchUsers();
    } catch (err: any) {
      console.error('❌ Error deleting user:', err);
      alert(err.response?.data?.error?.message || 'Failed to delete user');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-blue-600 hover:underline text-xs font-bold uppercase tracking-widest"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Staff Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Assign system roles and global permissions.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search staff..."
              className="pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64"
            />
          </div>
          <button className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
            <Filter size={20} className="text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="text-red-600" size={20} />
          <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl shadow-slate-200/40 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Role</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Branch</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Special Flags</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {staffList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No users found
                  </td>
                </tr>
              ) : (
                staffList.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white">{staff.name}</p>
                        <p className="text-xs text-slate-500">{staff.email}</p>
                        <p className="text-xs text-slate-400 mt-1">{staff.digitalId}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-[10px] font-black uppercase tracking-wider">
                        {staff.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-400">
                      {staff.branchId || 'All'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        staff.status === 'Approved' ? 'bg-green-100 text-green-700' :
                        staff.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {staff.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {staff.status === 'Pending' && (
                          <button
                            onClick={() => handleUpdateStatus(staff.id, 'Approved')}
                            className="px-3 py-1 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-700"
                          >
                            Approve
                          </button>
                        )}
                        {staff.status === 'Approved' && (
                          <button
                            onClick={() => handleUpdateStatus(staff.id, 'Revoked')}
                            className="px-3 py-1 bg-red-600 text-white rounded text-xs font-bold hover:bg-red-700"
                          >
                            Revoke
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(staff.id)}
                          className="px-3 py-1 bg-slate-900 dark:bg-slate-800 text-white rounded text-xs font-bold hover:bg-slate-800"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}


    </div>
  );
};
