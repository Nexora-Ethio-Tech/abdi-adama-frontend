
import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { Save, Lock, ArrowLeft, ChevronRight, Users, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { apiFetch } from '../utils/apiClient';
import { toast } from '../components/Toast';

interface GradingMethod {
  id: string;
  label: string;
  maxWeight: number;
}

export const GradeEntry = () => {
  const navigate = useNavigate();
  const { user, gradesLocked } = useUser();
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState<any>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [gradingMethods, setGradingMethods] = useState<GradingMethod[]>([]);
  const [grades, setGrades] = useState<Record<string, Record<string, number>>>({});
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
      const fetchSectionData = async () => {
        setStudentsLoading(true);
        try {
          // Fetch students
          const studentRes = await apiFetch(`/api/teacher/students?section_id=${selectedSection.id}`);
          const studentData = await studentRes.json();
          const studentList = studentData.data || [];
          setStudents(studentList);

          // Fetch grading config
          const configRes = await apiFetch(`/api/academic/grading-config?section_id=${selectedSection.id}`);
          if (configRes.ok) {
            const configData = await configRes.json();
            setGradingMethods(configData.data || []);
          } else {
            // Fallback to a default config if not found
            setGradingMethods([
              { id: 'mid', label: 'Mid-Exam', maxWeight: 30 },
              { id: 'final', label: 'Final-Exam', maxWeight: 50 },
              { id: 'quiz', label: 'Quiz', maxWeight: 10 },
              { id: 'assignment', label: 'Assignment', maxWeight: 10 },
            ]);
          }

          // Initialize grades state
          const initialGrades: Record<string, Record<string, number>> = {};
          studentList.forEach((s: any) => {
            initialGrades[s.id] = {};
          });
          setGrades(initialGrades);
        } catch {
          toast.error('Error loading class data.');
        } finally {
          setStudentsLoading(false);
        }
      };
      fetchSectionData();
    }
  }, [selectedSection]);

  const handleGradeChange = (studentId: string, methodId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setGrades(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [methodId]: numValue
      }
    }));
  };

  const calculateTotal = (studentId: string) => {
    const studentGrades = grades[studentId] || {};
    return Object.values(studentGrades).reduce((sum, val) => sum + val, 0);
  };

  const handleSave = async () => {
    if (gradesLocked) {
      toast.error('Grade entry is currently locked by administration.');
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await apiFetch('/api/teacher/grades', {
        method: 'POST',
        body: JSON.stringify({
          section_id: selectedSection.id,
          subject_id: selectedSection.subject_id,
          grades: Object.entries(grades).map(([studentId, marks]) => ({
            student_id: studentId,
            marks: marks
          }))
        })
      });

      if (res.ok) {
        setSubmitted(true);
        toast.success('All grades saved successfully.');
        setTimeout(() => setSubmitted(false), 3000);
      } else {
        toast.error('Failed to save grades to server.');
      }
    } catch {
      toast.error('Network error during grade submission.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-sm font-black text-slate-500 uppercase tracking-widest text-center">Opening grading ledger...</p>
      </div>
    );
  }

  if (!selectedSection) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col gap-1">
          <Breadcrumbs />
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-xs font-black uppercase tracking-widest"
            >
              <ArrowLeft size={14} />
              Back
            </button>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Grade Entry</h2>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 p-6 rounded-2xl">
          <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-2">Select a Class & Subject</h3>
          <p className="text-blue-700 dark:text-blue-300">Choose one of your assigned classes to begin mark entry for the current term.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((cls) => (
            <div
              key={cls.id}
              className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Users size={24} />
                </div>
              </div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight uppercase">Grade {cls.grade} - {cls.name}</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-6">{cls.subject_name}</p>

              <button
                onClick={() => {
                  setSelectedSection(cls);
                  setSelectedSubject(cls.subject_name);
                }}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-600 hover:text-white transition-all text-xs font-black uppercase tracking-widest group"
              >
                Enter Marks
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          ))}
          {sections.length === 0 && (
            <div className="col-span-full py-12 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              <p className="text-slate-500 dark:text-slate-400 italic">No classes assigned for grade entry.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <Breadcrumbs />
        <button
          onClick={() => {
            setSelectedSection(null);
            setSelectedSubject(null);
          }}
          className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline text-xs font-black uppercase tracking-widest"
        >
          <ArrowLeft size={14} />
          Back to Class Selection
        </button>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Grade {selectedSection.grade} - {selectedSection.name}</h2>
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest">
              {selectedSubject}
            </span>
          </div>
        </div>

        {!gradesLocked && (
          <button
            onClick={handleSave}
            disabled={submitting || studentsLoading}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all active:scale-95"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>{submitting ? 'Saving...' : 'Save All Marks'}</span>
          </button>
        )}
      </div>

      {gradesLocked && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 p-6 rounded-2xl flex items-center gap-4 text-amber-800 dark:text-amber-400">
          <div className="p-3 bg-amber-500 text-white rounded-xl">
            <Lock size={24} />
          </div>
          <div>
            <p className="text-lg font-black uppercase tracking-tight">Grade Entry is Locked</p>
            <p className="text-sm font-medium opacity-80">The administration has closed the window for grade entry. You can view scores but cannot modify them.</p>
          </div>
        </div>
      )}

      {submitted && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 px-6 py-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <div className="bg-emerald-500 text-white p-1 rounded-full">
            <Save size={16} />
          </div>
          <span className="text-sm font-bold">Marks saved successfully and synced with central database!</span>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {studentsLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Compiling student list...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Student Information</th>
                  {gradingMethods.map(method => (
                    <th key={method.id} className="px-4 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center w-32">
                      {method.label} <span className="block text-[8px] opacity-60">Max: {method.maxWeight}</span>
                    </th>
                  ))}
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right w-24">Total</th>
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
                          <p className="text-sm font-black text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors">{student.full_name || student.name}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-widest">ID: {student.id}</p>
                        </div>
                      </div>
                    </td>
                    {gradingMethods.map(method => (
                      <td key={method.id} className="px-4 py-5">
                        <input
                          disabled={gradesLocked || submitting}
                          type="number"
                          step="0.5"
                          max={method.maxWeight}
                          min="0"
                          placeholder="0"
                          value={grades[student.id]?.[method.id] || ''}
                          onChange={(e) => handleGradeChange(student.id, method.id, e.target.value)}
                          className="w-full text-center p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 disabled:opacity-50 font-black text-blue-600 dark:text-blue-400 transition-all"
                        />
                      </td>
                    ))}
                    <td className="px-8 py-5 text-right">
                      <span className={`text-xl font-black ${calculateTotal(student.id) > 50 ? 'text-emerald-500' : 'text-slate-400'}`}>
                        {calculateTotal(student.id).toFixed(1)}
                      </span>
                      <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase ml-1">/100</span>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={gradingMethods.length + 2} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                      No students found in this class roster.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

