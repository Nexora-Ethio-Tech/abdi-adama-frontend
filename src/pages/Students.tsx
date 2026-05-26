import { Search, Download, UserPlus, X, Edit2, Trash2, Users, ArrowLeft, CheckCircle2, XCircle, Check, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import studentService, { type UpdateStudentData } from '../services/studentService';
import classService from '../services/classService';
import { getBranchUsers, updateUser, assignStudentToClass, removeStudentFromClass, approveTeacher, revokeTeacher } from '../services/schoolAdminService';
import { useUser } from '../context/UserContext';
import { StudentRegistration } from '../components/StudentRegistration';

export const Students = () => {
  const navigate = useNavigate();
  const { role } = useUser();
  const isSchoolAdmin = role === 'school-admin';

  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [activeView, setActiveView] = useState<'students' | 'registration' | 'add'>('students');

  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ show: boolean; action: 'approve' | 'revoke'; student: any }>({ show: false, action: 'approve', student: null });
  const [processing, setProcessing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ show: boolean; student: any }>({ show: false, student: null });
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  const [editFormData, setEditFormData] = useState<any>({});

  const handlePhoneInput = (value: string) => {
    let phone = value.replace(/[^\d+]/g, '');
    if (!phone.startsWith('+')) phone = '+251' + phone.replace(/^0|^251/, '');
    else if (phone.startsWith('+251')) phone = '+251' + phone.substring(4).replace(/^0/, '');
    if (phone.length > 13) phone = phone.substring(0, 13);
    setEditFormData({ ...editFormData, parentPhone: phone });
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => { fetchStudents(); }, [filterStatus]);
  useEffect(() => { fetchClasses(); }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the new /school-admin/students endpoint that includes class info
      const response = await studentService.getAllStudents({ 
        status: filterStatus || undefined 
      });
      
      const data = response || [];
      const transformed = data.map((s: any) => ({
        id: s.student_id || s.id,
        userId: s.user_id || s.userId,
        digitalId: s.digital_id || s.digitalId,
        firstName: s.name?.split(' ')[0] || '',
        lastName: s.name?.split(' ').slice(1).join(' ') || '',
        email: s.email,
        grade: s.grade,
        classId: s.class_id || s.classId,
        className: s.class_name || s.className,
        section: s.class_section || s.section,
        status: s.status,
      }));
      
      setStudents(transformed);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await classService.getAllClasses();
      const transformed = (response.data || []).map((cls: any) => ({
        id: cls.id,
        name: cls.name,
        section: cls.section,
        capacity: cls.capacity,
      }));
      setClasses(transformed);
    } catch (err) {
      console.error('Failed to fetch classes:', err);
    }
  };

  const handleStatusAction = async () => {
    if (!confirmAction.student) return;
    setProcessing(true);
    try {
      if (confirmAction.action === 'approve') {
        await approveTeacher(confirmAction.student.userId);
      } else {
        await revokeTeacher(confirmAction.student.userId);
      }
      showToast(`Student ${confirmAction.action === 'approve' ? 'approved' : 'revoked'} successfully!`, 'success');
      setConfirmAction({ show: false, action: 'approve', student: null });
      fetchStudents();
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Action failed', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setSubmitting(true);
    try {
      await updateUser(selectedStudent.userId, {
        name: editFormData.name,
        email: editFormData.email,
        grade: editFormData.grade,
        parentPhone: editFormData.parentPhone
      });
      showToast('Student updated successfully!', 'success');
      setShowEditModal(false);
      setSelectedStudent(null);
      fetchStudents();
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to update student', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete.student) return;
    try {
      // Use userId for deletion to hit the users delete endpoint
      await studentService.deleteStudent(confirmDelete.student.userId || confirmDelete.student.id);
      showToast('Student deleted successfully!', 'success');
      setConfirmDelete({ show: false, student: null });
      fetchStudents();
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to delete student', 'error');
    }
  };

  const handleAssignClass = async (classId: string) => {
    if (!selectedStudent) return;
    try {
      await assignStudentToClass(selectedStudent.userId, classId);
      showToast('Class assigned successfully!', 'success');
      setShowAssignModal(false);
      setSelectedStudent(null);
      fetchStudents();
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to assign class', 'error');
    }
  };

  const openEditModal = (student: any) => {
    setSelectedStudent(student);
    setEditFormData({
      name: `${student.firstName} ${student.lastName}`.trim(),
      email: student.email,
      grade: student.grade || '',
      parentPhone: student.parentPhone || '+251'
    });
    setShowEditModal(true);
  };

  const handleExport = () => {
    const rows = students.map(s => `${s.digitalId},${s.firstName} ${s.lastName},${s.email},${s.grade},${s.className || 'Unassigned'},${s.status}`);
    const csv = ['ID,Name,Email,Grade,Class,Status', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students.csv';
    a.click();
  };

  const filtered = students.filter(s => {
    const matchSearch = !search || `${s.firstName} ${s.lastName} ${s.email} ${s.digitalId}`.toLowerCase().includes(search.toLowerCase());
    const matchGrade = !filterGrade || String(s.grade) === filterGrade;
    // Section match: determine student's section
    let matchSection = true;
    if (filterSection) {
      matchSection = s.section === filterSection;
    }

    return matchSearch && matchGrade && matchSection;
  });

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
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Students</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Manage student records and class assignments</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {isSchoolAdmin && (
            <>
              <button
                onClick={() => setActiveView('students')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border ${activeView === 'students'
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                Students
              </button>
              <button
                onClick={() => setActiveView('registration')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border ${activeView === 'registration'
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                Pending Applications
              </button>
              <button
                onClick={() => setActiveView('add')}
                className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-lg shadow-blue-200 dark:shadow-none ${activeView === 'add' ? 'ring-2 ring-blue-300 dark:ring-blue-700' : ''}`}
              >
                <UserPlus size={18} />
                Add Student
              </button>
            </>
          )}
          <button
            onClick={handleExport}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-2 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
              value={filterGrade}
              onChange={(e) => {
                const val = e.target.value;
                setFilterGrade(val);
                if (!val) setFilterSection('');
              }}
          className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Grades</option>
          {[1,2,3,4,5,6,7,8,9,10,11,12].map(g => (
            <option key={g} value={String(g)}>Grade {g}</option>
          ))}
        </select>
        <select
          value={filterSection}
          onChange={(e) => setFilterSection(e.target.value)}
          className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Sections</option>
          {['A','B','C','D','E','F'].map(s => (
            <option key={s} value={s}>Section {s}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Suspended">Suspended</option>
          <option value="Graduated">Graduated</option>
        </select>
      </div>

      {isSchoolAdmin && activeView === 'registration' ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-6 md:p-8">
          <StudentRegistration isAdminView={true} />
        </div>
      ) : isSchoolAdmin && activeView === 'add' ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-6 md:p-8">
          <StudentRegistration
            isAdminView={false}
            onCreated={() => setActiveView('students')}
          />
        </div>
      ) : (
        <>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Student</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Digital ID</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Grade</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Class</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        No students found. Add your first student!
                      </td>
                    </tr>
                  ) : (
                    filtered.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl flex items-center justify-center font-bold text-sm">
                              {student.firstName?.[0]}{student.lastName?.[0]}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 dark:text-white">{student.firstName} {student.lastName}</p>
                              <p className="text-xs text-slate-500">{student.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-slate-600 dark:text-slate-400">{student.digitalId}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">Grade {student.grade}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{student.className || 'Unassigned'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                            student.status === 'Active' ? 'bg-green-100 text-green-700' :
                            student.status === 'Inactive' ? 'bg-slate-100 text-slate-600' :
                            student.status === 'Suspended' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {student.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => { setSelectedStudent(student); setShowAssignModal(true); }}
                              className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 rounded-lg transition-colors"
                              title="Assign Class"
                            >
                              <Users size={16} />
                            </button>
                            <button
                              onClick={() => openEditModal(student)}
                              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 rounded-lg transition-colors"
                            >
                              <Edit2 size={16} />
                            </button>
                            {student.status === 'Pending' && (
                              <button
                                onClick={() => setConfirmAction({ show: true, action: 'approve', student })}
                                className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 rounded-lg transition-colors"
                                title="Approve"
                              >
                                <Check size={16} />
                              </button>
                            )}
                            {student.status === 'Approved' && (
                              <button
                                onClick={() => setConfirmAction({ show: true, action: 'revoke', student })}
                                className="p-2 hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-600 rounded-lg transition-colors"
                                title="Revoke"
                              >
                                <XCircle size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => setConfirmDelete({ show: true, student })}
                              className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Add Modal */}
      {/* Edit Modal */}
      {showEditModal && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 w-full max-w-md">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Edit2 size={20} /></div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100">Edit Student</h3>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleEdit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                <input
                  type="text"
                  value={editFormData.name || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                <input
                  type="email"
                  value={editFormData.email || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Grade</label>
                <select
                  value={editFormData.grade || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, grade: e.target.value })}
                  className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Grade</option>
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(g => (
                    <option key={g} value={String(g)}>Grade {g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Parent Phone Number</label>
                <input
                  type="text"
                  value={editFormData.parentPhone || ''}
                  onChange={(e) => handlePhoneInput(e.target.value)}
                  defaultValue="+251 "
                  placeholder="+251911234567"
                  className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-sm text-slate-500 hover:bg-slate-50"
                  disabled={submitting}>
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 bg-blue-600 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50"
                  disabled={submitting}>
                  {submitting ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                  <span>{submitting ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Class Modal */}
      {showAssignModal && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 w-full max-w-md">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 text-green-600 rounded-lg"><Users size={20} /></div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100">Assign Class</h3>
                  <p className="text-xs text-slate-500">{selectedStudent.firstName} {selectedStudent.lastName}</p>
                </div>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-2 max-h-72 overflow-y-auto">
              {classes.length === 0 ? (
                <p className="text-center text-slate-500 py-4">No classes available. Create classes first.</p>
              ) : (
                classes.map((cls) => (
                  <button
                    key={cls.id}
                    onClick={() => handleAssignClass(cls.id)}
                    className="w-full p-4 text-left border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 transition-all"
                  >
                    <p className="font-bold text-slate-800 dark:text-white">{cls.name} — Section {cls.section}</p>
                    <p className="text-xs text-slate-500 mt-1">Capacity: {cls.capacity} students</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approve/Revoke Confirmation Modal */}
      {confirmAction.show && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 w-full max-w-md">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">
                Confirm {confirmAction.action === 'approve' ? 'Approval' : 'Revocation'}
              </h3>
            </div>
            <div className="p-6">
              <p className="text-slate-600 dark:text-slate-400">
                Are you sure you want to {confirmAction.action} <strong>{confirmAction.student?.firstName} {confirmAction.student?.lastName}</strong>?
              </p>
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <button
                onClick={() => setConfirmAction({ show: false, action: 'approve', student: null })}
                className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-sm hover:bg-slate-50"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={handleStatusAction}
                className={`flex-1 px-4 py-2 rounded-lg font-bold text-sm text-white ${
                  confirmAction.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'
                } disabled:opacity-50`}
                disabled={processing}
              >
                {processing ? 'Processing...' : confirmAction.action === 'approve' ? 'Approve' : 'Revoke'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete.show && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 w-full max-w-md">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Confirm Deletion</h3>
            </div>
            <div className="p-6">
              <p className="text-slate-600 dark:text-slate-400">
                Are you sure you want to delete <strong>{confirmDelete.student?.firstName} {confirmDelete.student?.lastName}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <button
                onClick={() => setConfirmDelete({ show: false, student: null })}
                className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-sm hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 text-white font-bold py-2 rounded-lg hover:bg-red-700"
              >
                Delete Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border ${
            toast.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            {toast.type === 'success'
              ? <CheckCircle2 className="text-green-600" size={20} />
              : <XCircle className="text-red-600" size={20} />
            }
            <p className={`text-sm font-bold ${
              toast.type === 'success' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
            }`}>
              {toast.message}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
