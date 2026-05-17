
import { useState, useEffect } from 'react';
import { Check, X, Users, ChevronRight, Save, Loader2, ArrowLeft } from 'lucide-react';
import { useStore, type AbsenceQueueItem } from '../context/useStore';
import { useUser } from '../context/UserContext';
import { apiFetch } from '../utils/apiClient';
import { toast } from '../components/Toast';

export const TeacherAttendance = () => {
  const { user } = useUser();
  const { enqueueAbsences } = useStore();
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const res = await apiFetch('/api/teacher/sections');
        if (res.ok) {
          const data = await res.json();
          setSections(data.data || []);
        } else {
          toast.error('Failed to load assigned classes.');
        }
      } catch {
        toast.error('Network error while loading classes.');
      } finally {
        setLoading(false);
      }
    };
    fetchSections();
  }, []);

  useEffect(() => {
    if (selectedSection) {
      const fetchStudents = async () => {
        setStudentsLoading(true);
        try {
          const res = await apiFetch(`/api/teacher/students?section_id=${selectedSection.id}`);
          if (res.ok) {
            const data = await res.json();
            const studentList = data.data || [];
            setStudents(studentList);
            
            // Default all students to present
            const initialAttendance: Record<string, boolean> = {};
            studentList.forEach((s: any) => {
              initialAttendance[s.id] = true;
            });
            setAttendance(initialAttendance);
          } else {
            toast.error('Failed to load student roster.');
          }
        } catch {
          toast.error('Network error while loading students.');
        } finally {
          setStudentsLoading(false);
        }
      };
      fetchStudents();
    }
  }, [selectedSection]);

  const toggleAttendance = (studentId: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const markAllPresent = () => {
    const newAttendance: Record<string, boolean> = {};
    students.forEach(s => {
      newAttendance[s.id] = true;
    });
    setAttendance(newAttendance);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const absentStudents = students.filter((student) => !attendance[student.id]);
    const now = new Date();

    try {
      // Submit to live backend
      const res = await apiFetch('/api/teacher/attendance', {
        method: 'POST',
        body: JSON.stringify({
          section_id: selectedSection.id,
          date: now.toISOString().split('T')[0],
          attendance: students.map(s => ({
            student_id: s.id,
            status: attendance[s.id] ? 'present' : 'absent'
          }))
        })
      });

      if (res.ok) {
        // Enqueue absences for real-time VP dashboard
        const escalationItems: AbsenceQueueItem[] = absentStudents.map((student) => ({
          id: `${now.getTime()}-${student.id}`,
          studentId: student.id,
          studentName: student.full_name || student.name,
          grade: selectedSection.grade,
          parentName: student.parent_name || 'Guardian',
          parentPhone: student.parent_phone || '---',
          reportedAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          reportedBy: user?.name || 'Teacher',
          reason: 'Unexcused absence - submitted by class teacher',
          date: now.toISOString().split('T')[0],
          status: 'pending',
        }));

        if (escalationItems.length > 0) {
          enqueueAbsences(escalationItems);
          setSubmitMessage(`Attendance submitted. ${escalationItems.length} absence(s) escalated to VP review.`);
        } else {
          setSubmitMessage('Attendance submitted successfully. No absences found.');
        }

        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 3000);
      } else {
        toast.error('Failed to submit attendance to server.');
      }
    } catch {
      toast.error('Network error during attendance submission.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-sm font-black text-slate-500 uppercase tracking-widest text-center">Preparing attendance sheets...</p>
      </div>
    );
  }

  if (!selectedSection) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 p-6 rounded-2xl">
          <h2 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-2">Daily Attendance</h2>
          <p className="text-blue-700 dark:text-blue-300">Choose one of your assigned classes to begin taking today's attendance.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((cls) => (
            <button
              key={cls.id}
              onClick={() => setSelectedSection(cls)}
              className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-500 dark:hover:border-blue-500 transition-all text-left group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Users size={24} />
                </div>
                <ChevronRight className="text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Grade {cls.grade} - {cls.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{cls.subject_name || 'Classroom'}</p>
            </button>
          ))}
          {sections.length === 0 && (
            <div className="col-span-full py-12 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              <p className="text-slate-500 dark:text-slate-400 italic">No classes assigned to you.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => setSelectedSection(null)}
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline text-xs font-black uppercase tracking-widest mb-2"
          >
            <ArrowLeft size={14} />
            Change Class
          </button>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Attendance: {selectedSection.grade} - {selectedSection.name}</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={markAllPresent}
            disabled={submitting || studentsLoading}
            className="px-4 py-2 text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl transition-colors uppercase tracking-widest"
          >
            Mark All Present
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || studentsLoading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all active:scale-95"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>{submitting ? 'Submitting...' : 'Submit Records'}</span>
          </button>
        </div>
      </div>

      {submitted && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 px-6 py-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <div className="bg-emerald-500 text-white p-1 rounded-full">
            <Check size={16} />
          </div>
          <span className="text-sm font-bold">{submitMessage}</span>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {studentsLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading student roster...</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Student Identity</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Attendance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-600 dark:text-slate-300 font-black text-lg group-hover:scale-110 transition-transform">
                        {(student.full_name || student.name)[0]}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800 dark:text-white">{student.full_name || student.name}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-widest">Student ID: {student.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex justify-center">
                      <button
                        onClick={() => toggleAttendance(student.id)}
                        disabled={submitting}
                        className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black tracking-widest transition-all uppercase ${
                          attendance[student.id]
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 ring-2 ring-emerald-500/10'
                            : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 ring-2 ring-rose-500/10'
                        } hover:scale-105 active:scale-95`}
                      >
                        {attendance[student.id] ? (
                          <>
                            <Check size={18} />
                            <span>Present</span>
                          </>
                        ) : (
                          <>
                            <X size={18} />
                            <span>Absent</span>
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={2} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                    No students found in this class.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

