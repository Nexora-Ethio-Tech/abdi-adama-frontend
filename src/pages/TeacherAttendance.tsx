import { useState, useEffect } from 'react';
import { Check, X, Users, ChevronRight, Save, Loader2, ArrowLeft } from 'lucide-react';
import { useUser } from '../context/UserContext';
import teacherService, { markAttendance, getMyClasses, getClassStudents } from '../services/teacherService';

export const TeacherAttendance = () => {
  const { user } = useUser();
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent'>>({});
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        const data = await getMyClasses();
        const list = Array.isArray(data) ? data : [];
        // Transform snake_case
        const transformed = list.map((cls: any) => ({
          id: cls.id,
          name: cls.name || cls.class_name,
          section: cls.section,
          enrolledStudents: cls.enrolledStudents || cls.student_count || cls.actual_student_count || 0,
        }));
        setClasses(transformed);
      } catch (err) {
        console.error('Failed to fetch classes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  const handleSelectClass = async (cls: any) => {
    setSelectedClass(cls);
    setAttendance({});
    setLoadingStudents(true);
    try {
      const data = await getClassStudents(cls.id);
      const list = Array.isArray(data) ? data : [];
      const transformed = list.map((s: any) => ({
        id: s.id,
        name: s.name || `${s.first_name || s.firstName} ${s.last_name || s.lastName}`,
        digitalId: s.digital_id || s.digitalId,
      }));
      setStudents(transformed);
      // Default all to present
      const defaultAttendance: Record<string, 'present' | 'absent'> = {};
      transformed.forEach((s: any) => { defaultAttendance[s.id] = 'present'; });
      setAttendance(defaultAttendance);
    } catch (err) {
      console.error('Failed to fetch students:', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  const toggleAttendance = (studentId: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present'
    }));
  };

  const markAllPresent = () => {
    const all: Record<string, 'present' | 'absent'> = {};
    students.forEach(s => { all[s.id] = 'present'; });
    setAttendance(all);
  };

  const handleSubmit = async () => {
    if (!selectedClass) return;
    setSubmitting(true);
    try {
      const records = students.map(s => ({
        studentId: s.id,
        status: attendance[s.id] || 'absent'
      }));
      await markAttendance({
        date: new Date().toISOString().split('T')[0],
        attendanceRecords: records
      });
      const absentCount = records.filter(r => r.status === 'absent').length;
      setSubmitMessage(`Attendance submitted. ${absentCount} absence(s) recorded.`);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err: any) {
      setSubmitMessage(err.response?.data?.error?.message || 'Failed to submit attendance');
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (!selectedClass) {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 p-6 rounded-2xl">
          <h2 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-2">Select a Class</h2>
          <p className="text-blue-700 dark:text-blue-300">Choose one of your assigned classes to begin taking attendance.</p>
        </div>

        {classes.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            No classes assigned yet. Contact School Admin.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => (
              <button
                key={cls.id}
                onClick={() => handleSelectClass(cls)}
                className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-500 dark:hover:border-blue-500 transition-all text-left group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Users size={24} />
                  </div>
                  <ChevronRight className="text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{cls.name} {cls.section ? `- ${cls.section}` : ''}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{cls.enrolledStudents} Students Enrolled</p>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => { setSelectedClass(null); setStudents([]); }}
            className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium mb-1"
          >
            <ArrowLeft size={14} /> Change Class
          </button>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            Attendance — {selectedClass.name} {selectedClass.section ? `(${selectedClass.section})` : ''}
          </h2>
          <p className="text-sm text-slate-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={markAllPresent}
            className="px-4 py-2 text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 rounded-lg transition-colors"
          >
            Mark All Present
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || loadingStudents}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 font-bold shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            <span>{submitting ? 'Submitting...' : 'Submit'}</span>
          </button>
        </div>
      </div>

      {submitted && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 px-6 py-4 rounded-xl flex items-center gap-3 animate-in fade-in">
          <div className="bg-emerald-500 text-white p-1 rounded-full"><Check size={16} /></div>
          <span className="font-bold">{submitMessage}</span>
        </div>
      )}

      {loadingStudents ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-6 py-12 text-center text-slate-500">No students in this class yet.</td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-sm">
                          {student.name?.split(' ').map((n: string) => n[0]).join('') || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-white">{student.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{student.digitalId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <button
                          onClick={() => toggleAttendance(student.id)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                            attendance[student.id] === 'present'
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 ring-2 ring-emerald-500/20'
                              : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 ring-2 ring-rose-500/20'
                          }`}
                        >
                          {attendance[student.id] === 'present' ? (
                            <><Check size={18} /><span>PRESENT</span></>
                          ) : (
                            <><X size={18} /><span>ABSENT</span></>
                          )}
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
    </div>
  );
};
