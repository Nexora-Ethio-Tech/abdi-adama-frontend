import { Users, Plus, Edit2, Trash2, UserPlus, X, Check, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { classService, type Class, type CreateClassData, type UpdateClassData } from '../services/classService';
import { userService } from '../services/userService';
import { useUser } from '../context/UserContext';

export const Classes = () => {
  const navigate = useNavigate();
  const { role } = useUser();
  const isSchoolAdmin = role === 'school-admin';

  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [createForm, setCreateForm] = useState<CreateClassData>({
    name: '',
    capacity: 40,
    section: ''
  });
  const [editForm, setEditForm] = useState<UpdateClassData>({});
  const [selectedTeacherId, setSelectedTeacherId] = useState('');

  useEffect(() => {
    if (isSchoolAdmin) {
      fetchClasses();
      fetchTeachers();
    }
  }, [isSchoolAdmin]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await classService.getAllClasses();
      console.log('✅ Classes fetched:', response);
      setClasses(response.data || []);
    } catch (err: any) {
      console.error('❌ Error fetching classes:', err);
      setError(err.response?.data?.error?.message || 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await userService.getBranchUsers({ role: 'teacher', status: 'Approved' });
      setTeachers(response.data || []);
    } catch (err) {
      console.error('❌ Error fetching teachers:', err);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const response = await classService.createClass(createForm);
      console.log('✅ Class created:', response);
      alert('Class created successfully!');
      setShowCreateModal(false);
      setCreateForm({ name: '', capacity: 40, section: '' });
      fetchClasses();
    } catch (err: any) {
      console.error('❌ Error creating class:', err);
      alert(err.response?.data?.error?.message || 'Failed to create class');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;
    setUpdating(true);
    try {
      const response = await classService.updateClass(selectedClass.id, editForm);
      console.log('✅ Class updated:', response);
      alert('Class updated successfully!');
      setShowEditModal(false);
      setSelectedClass(null);
      setEditForm({});
      fetchClasses();
    } catch (err: any) {
      console.error('❌ Error updating class:', err);
      alert(err.response?.data?.error?.message || 'Failed to update class');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!confirm('Are you sure you want to delete this class?')) return;
    try {
      await classService.deleteClass(classId);
      console.log('✅ Class deleted');
      alert('Class deleted successfully!');
      fetchClasses();
    } catch (err: any) {
      console.error('❌ Error deleting class:', err);
      alert(err.response?.data?.error?.message || 'Failed to delete class');
    }
  };

  const handleAssignTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !selectedTeacherId) return;
    try {
      const response = await classService.assignTeacher(selectedClass.id, selectedTeacherId);
      console.log('✅ Teacher assigned:', response);
      alert('Teacher assigned successfully!');
      setShowAssignModal(false);
      setSelectedClass(null);
      setSelectedTeacherId('');
      fetchClasses();
    } catch (err: any) {
      console.error('❌ Error assigning teacher:', err);
      alert(err.response?.data?.error?.message || 'Failed to assign teacher');
    }
  };

  const openEditModal = (classItem: Class) => {
    setSelectedClass(classItem);
    setEditForm({
      name: classItem.name,
      capacity: classItem.capacity,
      section: classItem.section
    });
    setShowEditModal(true);
  };

  const openAssignModal = (classItem: Class) => {
    setSelectedClass(classItem);
    setSelectedTeacherId(classItem.teacherId || '');
    setShowAssignModal(true);
  };

  if (!isSchoolAdmin) {
    return (
      <div className="p-8 text-center text-rose-500">
        <AlertCircle className="mx-auto mb-4" size={48} />
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p>Only School Admin can manage classes.</p>
      </div>
    );
  }

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
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Class Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Create and manage classes in your branch</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 text-sm font-bold"
        >
          <Plus size={18} />
          Create Class
        </button>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-500">
              No classes found. Create your first class!
            </div>
          ) : (
            classes.map((classItem) => (
              <div
                key={classItem.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl">
                      <Users size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-white">{classItem.name}</h3>
                      <p className="text-xs text-slate-500">Section {classItem.section}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Capacity:</span>
                    <span className="font-bold text-slate-800 dark:text-white">{classItem.capacity} students</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Teacher:</span>
                    <span className="font-bold text-slate-800 dark:text-white">
                      {classItem.teacherName || 'Not assigned'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openAssignModal(classItem)}
                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 flex items-center justify-center gap-1"
                  >
                    <UserPlus size={14} />
                    Assign
                  </button>
                  <button
                    onClick={() => openEditModal(classItem)}
                    className="px-3 py-2 bg-slate-600 text-white rounded-lg text-xs font-bold hover:bg-slate-700"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteClass(classItem.id)}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 w-full max-w-md">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <Plus size={20} />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100">Create New Class</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form className="p-6 space-y-4" onSubmit={handleCreateClass}>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Class Name</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g. Grade 10"
                  className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Section</label>
                <input
                  type="text"
                  value={createForm.section}
                  onChange={(e) => setCreateForm({ ...createForm, section: e.target.value })}
                  placeholder="e.g. A"
                  className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Capacity</label>
                <input
                  type="number"
                  value={createForm.capacity}
                  onChange={(e) => setCreateForm({ ...createForm, capacity: parseInt(e.target.value) })}
                  placeholder="40"
                  className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
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
                  {creating ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                  <span>{creating ? 'Creating...' : 'Create Class'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedClass && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 w-full max-w-md">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <Edit2 size={20} />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100">Edit Class</h3>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form className="p-6 space-y-4" onSubmit={handleUpdateClass}>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Class Name</label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Section</label>
                <input
                  type="text"
                  value={editForm.section || ''}
                  onChange={(e) => setEditForm({ ...editForm, section: e.target.value })}
                  className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Capacity</label>
                <input
                  type="number"
                  value={editForm.capacity || ''}
                  onChange={(e) => setEditForm({ ...editForm, capacity: parseInt(e.target.value) })}
                  className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-sm text-slate-500 hover:bg-slate-50"
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50"
                  disabled={updating}
                >
                  {updating ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                  <span>{updating ? 'Updating...' : 'Update Class'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Teacher Modal */}
      {showAssignModal && selectedClass && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 w-full max-w-md">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                  <UserPlus size={20} />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100">Assign Teacher</h3>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form className="p-6 space-y-4" onSubmit={handleAssignTeacher}>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Select Teacher</label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a teacher</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name} ({teacher.digitalId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-sm text-slate-500 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-green-700"
                >
                  <Check size={18} />
                  <span>Assign Teacher</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
