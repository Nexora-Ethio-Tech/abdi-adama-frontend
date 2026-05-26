import { UserPlus, X, Check, ArrowLeft, MoreVertical, CheckCircle, XCircle, Trash2, Printer } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { registerUser, getBranchTeachers, approveTeacher, revokeTeacher, deleteTeacher } from '../services/schoolAdminService';
import { StaffProfileModal } from '../components/StaffProfileModal';
import { getVPTeachers } from '../services/vicePrincipalService';

export const Teachers = () => {
  const navigate = useNavigate();
  const { role } = useUser();
  const isAdmin = role === 'school-admin' || role === 'super-admin';
  const isVP = role === 'vice-principal';
  
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [successModal, setSuccessModal] = useState<{ show: boolean; data: any }>({ show: false, data: null });
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    educationLevel: '',
    specialty: '',
    dob: '',
    previousSchool: '',
    experienceYears: '',
    role: 'teacher' as 'teacher' | 'finance-clerk' | 'librarian' | 'clinic-admin' | 'driver'
  });
  const [copied, setCopied] = useState<'digitalId' | 'password' | null>(null);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ show: boolean; action: 'approve' | 'revoke' | 'delete'; teacher: any }>({ show: false, action: 'approve', teacher: null });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use different endpoint based on role
      const response = isVP ? await getVPTeachers() : await getBranchTeachers();
      
      const teachers = (response.data || []).map((teacher: any) => ({
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        digitalId: teacher.digital_id,
        status: teacher.status,
        userId: teacher.user_id,
        branchId: teacher.branch_id,
        createdAt: teacher.created_at,
        staffProfile: teacher.staff_profile,
        // VP-specific fields
        classesAssigned: teacher.classes_assigned || '0',
        plansSubmitted: teacher.plans_submitted || '0',
        plansPending: teacher.plans_pending || '0'
      }));
      setTeachers(teachers);
    } catch (err: any) {
      console.error('Failed to fetch teachers:', err);
      setError(err.response?.data?.error?.message || 'Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!confirmAction.teacher) return;
    
    setProcessing(true);
    try {
      const userId = confirmAction.teacher.userId;
      
      if (confirmAction.action === 'approve') {
        await approveTeacher(userId);
      } else if (confirmAction.action === 'revoke') {
        await revokeTeacher(userId);
      } else if (confirmAction.action === 'delete') {
        await deleteTeacher(userId);
      }
      
      setConfirmAction({ show: false, action: 'approve', teacher: null });
      setActionMenu(null);
      fetchTeachers();
    } catch (err: any) {
      console.error('Action failed:', err);
      const errorMsg = err.response?.status === 404 
        ? 'Backend route not implemented yet. Contact backend team to implement: PATCH /school-admin/users/{userId}/status'
        : err.response?.data?.error?.message || 'Action failed';
      alert(errorMsg);
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
          <title>Staff Credentials - ${user.name}</title>
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
            <div class="title">Staff Login Credentials</div>
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

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const response = await registerUser({
        name: formData.name,
        email: formData.email,
        role: formData.role,
        staffProfile: {
          phoneNumber: formData.phoneNumber,
          emergencyContactName: formData.emergencyContactName,
          emergencyContactPhone: formData.emergencyContactPhone,
          educationLevel: formData.educationLevel,
          specialty: formData.specialty,
          dob: formData.dob,
          previousSchool: formData.previousSchool,
          experienceYears: formData.experienceYears,
          registeredAt: new Date().toISOString()
        }
      });
      
      // Transform to match expected structure
      const transformedData = {
        user: {
          digitalId: response.data.user.digital_id,
          name: response.data.user.name,
          email: response.data.user.email,
          status: response.data.user.status
        },
        temporaryPassword: response.data.temporaryPassword
      };
      
      setShowAddModal(false);
      setFormData({ name: '', email: '', phoneNumber: '', emergencyContactName: '', emergencyContactPhone: '', educationLevel: '', specialty: '', dob: '', previousSchool: '', experienceYears: '', role: 'teacher' });
      setSuccessModal({ show: true, data: transformedData });
      fetchTeachers();
    } catch (err: any) {
      console.error('Failed to create teacher:', err);
      alert(err.response?.data?.error?.message || 'Failed to create teacher');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-blue-600 hover:underline text-xs font-bold uppercase tracking-widest"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Teachers</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Manage teaching staff and assignments</p>
        </div>

        {isAdmin && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all text-sm font-bold shadow-lg shadow-blue-200 dark:shadow-none"
          >
            <UserPlus size={20} />
            Register Teacher
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Teacher</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Email</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Digital ID</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
              {isVP && (
                <>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Classes</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Plans</th>
                </>
              )}
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {teachers.length === 0 ? (
              <tr>
                <td colSpan={isVP ? 7 : 5} className="px-6 py-12 text-center text-slate-500">
                  No teachers found. Register your first teacher.
                </td>
              </tr>
            ) : (
              teachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="px-6 py-4">
                        <button type="button" onClick={() => setSelectedStaff(teacher)} className="flex items-center gap-3 text-left">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-xl flex items-center justify-center font-bold">
                        {teacher.name?.split(' ').map((n: string) => n[0]).join('') || 'T'}
                      </div>
                      <span className="font-bold text-slate-800 dark:text-white">{teacher.name}</span>
                        </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{teacher.email}</td>
                  <td className="px-6 py-4 text-sm font-mono text-slate-600 dark:text-slate-400">{teacher.digitalId}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                      teacher.status === 'Approved' ? 'bg-green-100 text-green-700' :
                      teacher.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {teacher.status}
                    </span>
                  </td>
                  {isVP && (
                    <>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{teacher.classesAssigned}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <span className="text-slate-600 dark:text-slate-400">{teacher.plansSubmitted}</span>
                          {teacher.plansPending !== '0' && (
                            <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-bold">
                              {teacher.plansPending} pending
                            </span>
                          )}
                        </div>
                      </td>
                    </>
                  )}
                  <td className="px-6 py-4">
                    {isAdmin && (
                      <div className="flex items-center gap-2">
                        {teacher.status === 'Pending' ? (
                          <button
                            onClick={() => setConfirmAction({ show: true, action: 'approve', teacher })}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                          >
                            <CheckCircle size={14} />
                            Approve
                          </button>
                        ) : teacher.status === 'Approved' ? (
                          <button
                            onClick={() => setConfirmAction({ show: true, action: 'revoke', teacher })}
                            className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                          >
                            <XCircle size={14} />
                            Revoke
                          </button>
                        ) : null}
                        <button
                          onClick={() => setConfirmAction({ show: true, action: 'delete', teacher })}
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Teacher Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 w-full max-w-md">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <UserPlus size={20} />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100">Register New Teacher</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form className="p-6 space-y-4" onSubmit={handleAddTeacher}>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Ato Bekele Tesfaye"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="teacher@school.com"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Role</label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="teacher">Teacher</option>
                  <option value="finance-clerk">Finance Clerk</option>
                  <option value="librarian">Librarian</option>
                  <option value="clinic-admin">Clinic Admin</option>
                  <option value="driver">Driver</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 09..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Emergency Contact Name</label>
                  <input
                    type="text"
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Contact person"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Emergency Contact Phone</label>
                  <input
                    type="tel"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Contact phone"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Education Status</label>
                  <select
                    value={formData.educationLevel}
                    onChange={(e) => setFormData({ ...formData, educationLevel: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select level</option>
                    <option value="Diploma">Diploma</option>
                    <option value="Degree">Degree</option>
                    <option value="Master">Master</option>
                    <option value="PhD">PhD</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Specialty / Course</label>
                  <input
                    type="text"
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Math, English, Biology..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Previous School</label>
                  <input
                    type="text"
                    value={formData.previousSchool}
                    onChange={(e) => setFormData({ ...formData, previousSchool: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Experience (Years)</label>
                  <input
                    type="text"
                    value={formData.experienceYears}
                    onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 5"
                  />
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  <strong>Note:</strong> A 4-digit PIN will be auto-generated. Teacher will need School Admin approval to login.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-sm text-slate-500 hover:bg-slate-50"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50"
                  disabled={creating}
                >
                  {creating ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Check size={18} />
                  )}
                  <span>{creating ? 'Creating...' : 'Create Teacher'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <StaffProfileModal
        open={!!selectedStaff}
        title="Teacher Staff Details"
        staff={selectedStaff}
        onClose={() => setSelectedStaff(null)}
      />

      {/* Success Modal */}
      {successModal.show && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 w-full max-w-md">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 text-green-600 rounded-full">
                  <Check size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Teacher Created Successfully!</h3>
                  <p className="text-sm text-slate-500">Save the credentials below</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Digital ID (Username)</label>
                <div className="flex items-center justify-between gap-3">
                  <code className="text-lg font-mono font-bold text-blue-600 dark:text-blue-400">
                    {successModal.data?.user?.digitalId}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(successModal.data?.user?.digitalId);
                      setCopied('digitalId');
                      setTimeout(() => setCopied(null), 2000);
                    }}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    {copied === 'digitalId' ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-5 border-2 border-amber-300 dark:border-amber-700">
                <label className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase block mb-3 flex items-center gap-2">
                  <span className="text-lg">🔑</span>
                  4-Digit PIN (Save This!)
                </label>
                <div className="flex items-center justify-between gap-3">
                  <code className="text-3xl font-mono font-black text-amber-700 dark:text-amber-300 tracking-widest">
                    {successModal.data?.temporaryPassword}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(successModal.data?.temporaryPassword);
                      setCopied('password');
                      setTimeout(() => setCopied(null), 2000);
                    }}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-700 transition-colors shadow-lg"
                  >
                    {copied === 'password' ? '✓ Copied' : 'Copy PIN'}
                  </button>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-3 font-semibold">
                  ⚠️ This PIN won't be shown again. Teacher must save it for first login.
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>📋 Next Steps:</strong> Approve the teacher from the actions menu to enable login.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <button
                onClick={handlePrintCredentials}
                className="flex-1 flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Printer size={18} />
                Print
              </button>
              <button
                onClick={() => setSuccessModal({ show: false, data: null })}
                className="flex-1 bg-slate-900 dark:bg-slate-800 text-white font-bold py-3 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Action Modal */}
      {confirmAction.show && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 w-full max-w-md">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">
                Confirm {confirmAction.action === 'approve' ? 'Approval' : confirmAction.action === 'revoke' ? 'Revocation' : 'Deletion'}
              </h3>
            </div>

            <div className="p-6">
              <p className="text-slate-600 dark:text-slate-400">
                Are you sure you want to {confirmAction.action} <strong>{confirmAction.teacher?.name}</strong>?
              </p>
              {confirmAction.action === 'delete' && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-2">
                  ⚠️ This action cannot be undone.
                </p>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <button
                onClick={() => setConfirmAction({ show: false, action: 'approve', teacher: null })}
                className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-sm hover:bg-slate-50"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                className={`flex-1 px-4 py-2 rounded-lg font-bold text-sm text-white ${
                  confirmAction.action === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                  confirmAction.action === 'revoke' ? 'bg-orange-600 hover:bg-orange-700' :
                  'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50`}
                disabled={processing}
              >
                {processing ? 'Processing...' : confirmAction.action === 'approve' ? 'Approve' : confirmAction.action === 'revoke' ? 'Revoke' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
