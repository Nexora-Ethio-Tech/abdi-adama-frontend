import { UserPlus, X, Check, ArrowLeft, MoreVertical, CheckCircle, XCircle, Trash2, Printer, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { registerUser, getBranchUsers, approveTeacher, revokeTeacher, deleteTeacher } from '../services/schoolAdminService';

export const ClinicAdminStaff = () => {
  const navigate = useNavigate();
  const { role } = useUser();
  const isAdmin = role === 'school-admin' || role === 'super-admin';

  const [clinicStaff, setClinicStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [successModal, setSuccessModal] = useState<{ show: boolean; data: any }>({ show: false, data: null });
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [copied, setCopied] = useState<'digitalId' | 'password' | null>(null);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ show: boolean; action: 'approve' | 'revoke' | 'delete'; staff: any }>({ show: false, action: 'approve', staff: null });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchClinicStaff();
  }, []);

  const fetchClinicStaff = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getBranchUsers('clinic-admin', '');

      const staff = (response.data || []).map((person: any) => ({
        id: person.id,
        name: person.name,
        email: person.email,
        digitalId: person.digital_id || person.digitalId,
        status: person.status,
        userId: person.user_id || person.id,
        branchId: person.branch_id
      }));
      setClinicStaff(staff);
    } catch (err: any) {
      console.error('Failed to fetch clinic admin staff:', err);
      setError(err.response?.data?.error?.message || 'Failed to load clinic admin staff');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!confirmAction.staff) return;

    setProcessing(true);
    try {
      const userId = confirmAction.staff.userId;

      if (confirmAction.action === 'approve') {
        await approveTeacher(userId);
      } else if (confirmAction.action === 'revoke') {
        await revokeTeacher(userId);
      } else if (confirmAction.action === 'delete') {
        await deleteTeacher(userId);
      }

      setConfirmAction({ show: false, action: 'approve', staff: null });
      setActionMenu(null);
      fetchClinicStaff();
    } catch (err: any) {
      console.error('Action failed:', err);
      alert(err.response?.data?.error?.message || 'Action failed');
    } finally {
      setProcessing(false);
    }
  };

  const handlePrintCredentials = () => {
    const { user, temporaryPassword } = successModal.data;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Clinic Admin Credentials - ${user.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 400px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 16px; margin-bottom: 24px; }
            .school { font-size: 18px; font-weight: bold; }
            .title { font-size: 14px; color: #555; margin-top: 4px; }
            .field { margin-bottom: 16px; }
            .label { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #888; letter-spacing: 1px; }
            .value { font-size: 16px; font-weight: bold; margin-top: 4px; }
            .pin-box { background: #fff8e1; border: 2px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center; }
            .pin { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #b45309; font-family: monospace; }
            .warning { font-size: 11px; color: #b45309; margin-top: 8px; }
            .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #ddd; font-size: 11px; color: #888; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="school">Abdi Adama School IMS</div>
            <div class="title">Clinic Admin Login Credentials</div>
          </div>
          <div class="field">
            <div class="label">Full Name</div>
            <div class="value">${user.name}</div>
          </div>
          <div class="field">
            <div class="label">Email</div>
            <div class="value">${user.email}</div>
          </div>
          <div class="field">
            <div class="label">Digital ID (Username)</div>
            <div class="value" style="font-family: monospace; color: #2563eb;">${user.digitalId}</div>
          </div>
          <div class="pin-box">
            <div class="label">🔑 4-Digit PIN</div>
            <div class="pin">${temporaryPassword}</div>
            <div class="warning">⚠️ Change this PIN after first login</div>
          </div>
          <div class="field">
            <div class="label">Status</div>
            <div class="value">${user.status}</div>
          </div>
          <div class="footer">
            Printed on ${new Date().toLocaleDateString()} · Keep this document confidential
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleAddClinicAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      alert('Please enter a valid email address (e.g. name@school.com)');
      return;
    }
    setCreating(true);

    try {
      const result = await registerUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: 'clinic-admin'
      });

      const newStaff = {
        id: result.data.user.id,
        name: result.data.user.name,
        email: result.data.user.email,
        digitalId: result.data.user.digital_id,
        status: result.data.user.status,
        userId: result.data.user.id
      };

      setSuccessModal({
        show: true,
        data: {
          user: newStaff,
          temporaryPassword: result.data.temporaryPassword
        }
      });

      setFormData({ name: '', email: '' });
      setShowAddModal(false);
      fetchClinicStaff();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to create clinic admin account');
    } finally {
      setCreating(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-rose-500">
        <XCircle className="mx-auto mb-4" size={48} />
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p>You do not have permission to manage staff.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
              Clinic Admin Staff Management
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Approve, manage, or delete clinic admin accounts
            </p>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            <UserPlus size={18} />
            Add Clinic Admin
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Staff List */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-slate-500">Loading...</div>
          </div>
        ) : clinicStaff.length === 0 ? (
          <div className="flex items-center justify-center p-8 text-center">
            <div>
              <div className="text-slate-500 text-sm font-medium">No clinic admin staff found</div>
              <p className="text-slate-400 text-xs mt-1">Create your first clinic admin account to get started</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-visible">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Digital ID</th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clinicStaff.map((staff) => (
                  <tr key={staff.id} className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{staff.name}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{staff.email}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-mono text-sm">{staff.digitalId}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${staff.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                          : staff.status === 'Pending'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                        }`}>
                        {staff.status === 'Approved' && <CheckCircle size={12} />}
                        {staff.status === 'Pending' && <Clock size={12} />}
                        {staff.status === 'Revoked' && <XCircle size={12} />}
                        {staff.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {isAdmin && (
                        <div className="flex items-center gap-2 justify-center">
                          {staff.status === 'Pending' ? (
                            <button
                              onClick={() => setConfirmAction({ show: true, action: 'approve', staff })}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                            >
                              <CheckCircle size={14} />
                              Approve
                            </button>
                          ) : staff.status === 'Approved' ? (
                            <button
                              onClick={() => setConfirmAction({ show: true, action: 'revoke', staff })}
                              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                            >
                              <XCircle size={14} />
                              Revoke
                            </button>
                          ) : null}
                          <button
                            onClick={() => setConfirmAction({ show: true, action: 'delete', staff })}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                            title="Delete User"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Clinic Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Add New Clinic Admin</h2>
            <form onSubmit={handleAddClinicAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">School Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. john@school.com"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mb-4">✓ Clinic Admin Created Successfully</h2>
            <div className="space-y-3 mb-6 text-sm">
              <div>
                <span className="text-slate-600 dark:text-slate-400">Name:</span>
                <span className="float-right font-medium text-slate-900 dark:text-white">{successModal.data?.user.name}</span>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400">Digital ID:</span>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded font-mono text-blue-600 dark:text-blue-400">
                    {successModal.data?.user.digitalId}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(successModal.data?.user.digitalId || '');
                      setCopied('digitalId');
                      setTimeout(() => setCopied(null), 2000);
                    }}
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    {copied === 'digitalId' ? '✓' : 'Copy'}
                  </button>
                </div>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400">4-Digit PIN:</span>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 bg-yellow-50 dark:bg-yellow-900/30 px-3 py-2 rounded font-mono text-lg font-bold text-yellow-700 dark:text-yellow-400">
                    {successModal.data?.temporaryPassword}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(successModal.data?.temporaryPassword || '');
                      setCopied('password');
                      setTimeout(() => setCopied(null), 2000);
                    }}
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    {copied === 'password' ? '✓' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSuccessModal({ show: false, data: null })}
                className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 font-medium transition-colors"
              >
                Close
              </button>
              <button
                onClick={handlePrintCredentials}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Printer size={16} />
                Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              {confirmAction.action === 'approve' && 'Approve Clinic Admin?'}
              {confirmAction.action === 'revoke' && 'Revoke Access?'}
              {confirmAction.action === 'delete' && 'Delete Clinic Admin?'}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
              {confirmAction.action === 'approve' && `Approve ${confirmAction.staff?.name} to access the clinic admin portal?`}
              {confirmAction.action === 'revoke' && `Revoke ${confirmAction.staff?.name}'s access?`}
              {confirmAction.action === 'delete' && `Permanently delete ${confirmAction.staff?.name}'s account?`}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmAction({ show: false, action: 'approve', staff: null })}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={processing}
                className={`flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50 ${confirmAction.action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' :
                    confirmAction.action === 'revoke' ? 'bg-amber-600 hover:bg-amber-700' :
                      'bg-rose-600 hover:bg-rose-700'
                  }`}
              >
                {processing ? 'Processing...' : (
                  confirmAction.action === 'approve' ? 'Approve' :
                    confirmAction.action === 'revoke' ? 'Revoke' :
                      'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
