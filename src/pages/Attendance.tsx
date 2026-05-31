import { CheckCircle, XCircle, Clock, ChevronDown, UserCheck, Users, ShieldAlert, ArrowRight, X, Send, Check, Loader2, ArrowLeft } from 'lucide-react';
import { mockTeachers, mockStudents } from '../data/mockData';
import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { Breadcrumbs } from '../components/Breadcrumbs';
import attendanceService from '../services/attendanceService';
import studentService from '../services/studentService';

type AttendanceMode = 'student' | 'staff' | null;
type StaffAttendanceStatus = 'Present' | 'Absent' | 'Late';

interface StaffAttendanceRecord {
  id: string;
  name: string;
  branch: string;
  department: string;
  subjects: string[];
  status: StaffAttendanceStatus;
  signInTime?: string;
  signOutTime?: string;
}

export const Attendance = () => {
  const navigate = useNavigate();
  const { role } = useUser();
  const isAdmin = role === 'school-admin' || role === 'super-admin';
  const isVP = role === 'vice-principal';
  const [selectedGrade, setSelectedGrade] = useState('10A');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceMode, setAttendanceMode] = useState<AttendanceMode>('staff');
  const [staffFilter, setStaffFilter] = useState<'all' | 'present' | 'absent' | 'late' | 'pending'>('all');
  const [staffAttendance, setStaffAttendance] = useState<StaffAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [absentTeacher, setAbsentTeacher] = useState<any>(null);
  const [isProxyAnalysisRunning, setIsProxyAnalysisRunning] = useState(false);
  const [proxySuggestions, setProxySuggestions] = useState<string[]>([]);
  const [absentReviewQueue, setAbsentReviewQueue] = useState([
    { id: '1', studentName: 'Ahmed Ali', grade: '10A', reason: 'Not reported', time: '08:15 AM' },
    { id: '2', studentName: 'Sara Mohammed', grade: '9B', reason: 'Family emergency', time: '08:45 AM' },
  ]);

  // Fetch students for selected grade
  useEffect(() => {
    if (attendanceMode !== 'student') {
      setStudents([]);
      setAttendance({});
      return;
    }

    const fetchStudents = async () => {
      setLoading(true);
      try {
        const data = await studentService.getAllStudents({ grade: selectedGrade });
        setStudents(data || []);
        // Initialize attendance state
        const initialAttendance: Record<string, 'present' | 'absent' | 'late'> = {};
        data?.forEach((s: any) => {
          initialAttendance[s.id] = 'present';
        });
        setAttendance(initialAttendance);
      } catch (error) {
        console.error('Failed to fetch students:', error);
        // Fall back to mock data
        const filtered = mockStudents.filter((s: any) => s.grade === selectedGrade);
        setStudents(filtered);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [selectedGrade, attendanceMode]);

  useEffect(() => {
    const staffRecords: StaffAttendanceRecord[] = mockTeachers.map((teacher) => ({
      id: teacher.id,
      name: teacher.name,
      branch: teacher.branch,
      department: teacher.department,
      subjects: teacher.subjects,
      status: teacher.isInClass ? 'Present' : (teacher.id === 'T4' ? 'Late' : 'Absent'),
      signInTime: teacher.isInClass ? '08:05 AM' : undefined,
      signOutTime: teacher.isInClass ? undefined : undefined,
    }));
    setStaffAttendance(staffRecords);
  }, []);

  const toggleStatus = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const markAll = (status: 'present' | 'absent' | 'late') => {
    const newAttendance = { ...attendance };
    students.forEach((s: any) => {
      newAttendance[s.id] = status;
    });
    setAttendance(newAttendance);
  };

  const gradeStats = [
    { grade: '10A', enrollment: 24, present: 22, percentage: '91.6%' },
    { grade: '9B', enrollment: 30, present: 28, percentage: '93.3%' },
    { grade: '11C', enrollment: 18, present: 15, percentage: '83.3%' },
    { grade: '12A', enrollment: 25, present: 25, percentage: '100%' },
  ];

  const filteredStaff = staffAttendance.filter((record) => {
    if (staffFilter === 'all') return true;
    if (staffFilter === 'pending') return !record.signInTime;
    return record.status.toLowerCase() === staffFilter;
  });

  const staffSummary = staffAttendance.reduce(
    (summary, record) => {
      summary.present += record.status === 'Present' ? 1 : 0;
      summary.absent += record.status === 'Absent' ? 1 : 0;
      summary.late += record.status === 'Late' ? 1 : 0;
      summary.pendingSignIn += record.signInTime ? 0 : 1;
      summary.total += 1;
      return summary;
    },
    { present: 0, absent: 0, late: 0, pendingSignIn: 0, total: 0 }
  );

  const handleAttendanceModeChange = (mode: AttendanceMode) => {
    setAttendanceMode(mode);
    setStaffFilter('all');
  };

  const handleStaffSignIn = (id: string) => {
    setStaffAttendance((prev) =>
      prev.map((record) =>
        record.id === id
          ? {
              ...record,
              status: 'Present',
              signInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }
          : record
      )
    );
  };

  const handleStaffSignOut = (id: string) => {
    setStaffAttendance((prev) =>
      prev.map((record) =>
        record.id === id
          ? {
              ...record,
              signOutTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }
          : record
      )
    );
  };

  const runProxyAnalysis = () => {
    setIsProxyAnalysisRunning(true);
    setProxySuggestions([]);
    window.setTimeout(() => {
      const suggestions = mockTeachers
        .filter((teacher) => !teacher.isInClass)
        .slice(0, 3)
        .map((teacher) => `${teacher.name} (${teacher.subjects.join(', ')})`);
      setProxySuggestions(suggestions);
      setIsProxyAnalysisRunning(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <Breadcrumbs />
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-blue-600 hover:underline text-xs font-bold uppercase tracking-widest"
        >
          <ArrowLeft size={14} />
          Back
        </button>
      </div>
      {isVP && absentReviewQueue.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-rose-100 dark:border-rose-900/30 overflow-hidden shadow-xl shadow-rose-50 dark:shadow-none">
          <div className="bg-rose-50 dark:bg-rose-900/20 px-6 py-4 border-b border-rose-100 dark:border-rose-900/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500 text-white rounded-lg animate-pulse">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h3 className="font-black text-rose-900 dark:text-rose-100 text-sm uppercase tracking-wider">VP Attendance Review Queue</h3>
                <p className="text-xs text-rose-700 dark:text-rose-300">Unexcused absences requiring escalation</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-rose-200 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 rounded-full text-xs font-black">
              {absentReviewQueue.length} PENDING
            </span>
          </div>
          <div className="divide-y divide-rose-50 dark:divide-rose-900/20">
            {absentReviewQueue.map((item) => (
              <div key={item.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-rose-50/30 dark:hover:bg-rose-900/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-rose-600 font-black shadow-sm border border-rose-100 dark:border-rose-900/30">
                    {item.studentName[0]}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-100">{item.studentName}</p>
                    <p className="text-xs text-slate-500 font-medium">Grade {item.grade} • Reported at {item.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setAbsentReviewQueue(prev => prev.filter(q => q.id !== item.id))}
                    className="flex-1 sm:flex-none px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-100"
                  >
                    <Check size={16} />
                    Pass (Excused)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      alert(`Notifying parents of ${item.studentName}...`);
                      setAbsentReviewQueue(prev => prev.filter(q => q.id !== item.id));
                    }}
                    className="flex-1 sm:flex-none px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-100"
                  >
                    <Send size={16} />
                    Notify Parents
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isVP && (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-blue-100 dark:border-blue-900/30 shadow-2xl shadow-blue-500/5 dark:shadow-none overflow-hidden transition-all duration-500">
          <div className="p-8 border-b border-blue-100 dark:border-blue-900/30 bg-gradient-to-br from-blue-50 to-indigo-50/30 dark:from-blue-900/20 dark:to-indigo-900/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-500/20">
                  <UserCheck size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-blue-900 dark:text-blue-100">Staff Shortage Command Center</h3>
                  <p className="text-sm font-bold text-blue-600/70 dark:text-blue-400/70 mt-1 flex items-center gap-2">
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 rounded-full text-[10px] font-black uppercase tracking-widest">
                      {mockTeachers.filter(t => !t.isInClass).length} ABSENT STAFF
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-full text-[10px] font-black uppercase tracking-widest">
                      {mockTeachers.filter(t => t.isInClass).length} PRESENT
                    </span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={runProxyAnalysis}
                disabled={isProxyAnalysisRunning}
                className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {isProxyAnalysisRunning ? <Loader2 size={16} className="animate-spin" /> : <Users size={16} />}
                {isProxyAnalysisRunning ? 'Analyzing...' : 'Auto-Match Proxies'}
              </button>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Absent Teachers List */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Currently Missing</h4>
                  <span className="text-[10px] font-bold text-rose-500 dark:text-rose-400">Action Required</span>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {mockTeachers.filter(t => !t.isInClass).map((teacher) => (
                    <div key={teacher.id} className="group p-5 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-rose-200 dark:hover:border-rose-900/30 transition-all duration-300 hover:shadow-lg hover:shadow-rose-500/5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner">
                            {teacher.name[0]}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">{teacher.name}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 rounded text-[9px] font-black uppercase tracking-wider">{teacher.subjects[0]}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                              <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded text-[9px] font-black uppercase tracking-wider">Impact: 3 Classes</span>
                              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                              <span className="text-[9px] font-bold text-slate-400">10A, 11B, 9C</span>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setAbsentTeacher(teacher); setShowSubModal(true); }}
                          className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm"
                        >
                          Find Proxy
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Proxy Suggestions Panel */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Proxy Recommendations</h4>
                  <span className="text-[10px] font-bold text-emerald-500">Live Availability</span>
                </div>

                <div className="min-h-[300px] flex flex-col items-center justify-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 text-center bg-slate-50/50 dark:bg-slate-900/20">
                  {isProxyAnalysisRunning ? (
                    <div className="space-y-4">
                      <div className="relative">
                        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                        <Users size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600" />
                      </div>
                      <p className="text-sm font-bold text-slate-800 dark:text-white">Analyzing Schedule Matrix...</p>
                      <p className="text-xs text-slate-500">Matching subject expertise and free periods.</p>
                    </div>
                  ) : proxySuggestions.length > 0 ? (
                    <div className="w-full space-y-3">
                      {proxySuggestions.map((suggestion) => (
                        <div key={suggestion} className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500 text-white rounded-lg group-hover:rotate-12 transition-transform">
                              <CheckCircle size={18} />
                            </div>
                            <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">{suggestion}</p>
                          </div>
                          <button type="button" className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest hover:underline">
                            Quick Assign
                          </button>
                        </div>
                      ))}
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pt-4">
                        Analysis Complete • Subject Match: High
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center text-slate-300 mx-auto">
                        <Clock size={32} />
                      </div>
                      <p className="text-sm font-bold text-slate-500">Run analysis to find best fits</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isVP && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Attendance Oversight</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-2xl">
                Select a view to begin. Student mode gives you grade-level roll call, while staff mode shows biometric sign-in/out tracking for teachers.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleAttendanceModeChange('student')}
                className={`px-5 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${attendanceMode === 'student'
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
              >
                Student Attendance
              </button>
              <button
                type="button"
                onClick={() => handleAttendanceModeChange('staff')}
                className={`px-5 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${attendanceMode === 'staff'
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
              >
                Staff Attendance
              </button>
            </div>
          </div>

          {!attendanceMode && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-10 text-center">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">No attendance view selected yet.</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Tap a mode above to load student or staff attendance details.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-3xl p-6 bg-slate-50 dark:bg-slate-800/60">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100">Student Attendance</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Review grade section attendance and save today’s roll.</p>
                </div>
                <div className="rounded-3xl p-6 bg-slate-50 dark:bg-slate-800/60">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100">Staff Attendance</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Monitor teacher biometric sign-in/out and attendance status.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!isVP && attendanceMode === 'student' && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Student Attendance</h2>
          </div>
          <div className="flex gap-2">
            <button type="button" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg font-bold text-sm">
              Attendance Reports
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  const records = Object.entries(attendance).map(([studentId, status]) => ({
                    studentId,
                    status
                  }));
                  await attendanceService.markAttendance({
                    date: selectedDate,
                    attendanceRecords: records
                  } as any);
                  alert('Attendance saved successfully!');
                } catch (error) {
                  alert('Failed to save attendance');
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-lg shadow-blue-100 dark:shadow-none">
              Save Today's Records
            </button>
          </div>
        </div>
      )}

      {!isVP && attendanceMode === 'student' && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-wrap gap-4 items-center justify-between transition-colors duration-300">
          <div className="flex items-center gap-4">
            <div className="space-y-1">
              <label htmlFor="gradeSection" className="text-[10px] font-bold text-slate-500 uppercase">Select Grade/Section</label>
              <div className="relative">
                <select
                  id="gradeSection"
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all w-40"
                >
                  <option value="10A">Grade 10A</option>
                  <option value="9B">Grade 9B</option>
                  <option value="11C">Grade 11C</option>
                  <option value="12A">Grade 12A</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div className="h-10 w-px bg-slate-100 dark:bg-slate-800 hidden md:block" />
            <div className="h-10 w-px bg-slate-100 dark:bg-slate-800 hidden md:block" />
            <div className="space-y-1">
              <label htmlFor="attendanceDate" className="text-[10px] font-bold text-slate-500 uppercase">Attendance Date</label>
              <input
                id="attendanceDate"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="h-10 w-px bg-slate-100 dark:bg-slate-800 hidden md:block" />
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Total Students</label>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{students.length} Enrolled</p>
            </div>
          </div>

          {(role === 'teacher') && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => markAll('present')}
                className="text-[10px] font-bold text-emerald-600 border border-emerald-100 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors uppercase tracking-wider"
              >
                Mark All Present
              </button>
              <button
                type="button"
                onClick={() => markAll('absent')}
                className="text-[10px] font-bold text-rose-600 border border-rose-100 bg-rose-50 px-3 py-1.5 rounded-lg hover:bg-rose-100 transition-colors uppercase tracking-wider"
              >
                Mark All Absent
              </button>
            </div>
          )}
        </div>
      )}

      {!isVP && attendanceMode === 'student' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors duration-300">
          <div className="overflow-x-auto">
            {isAdmin ? (
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Grade/Section</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Enrollment</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Present Today</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Attendance Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {gradeStats.map((stat, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-xs">
                            {stat.grade}
                          </div>
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Grade {stat.grade}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-medium text-slate-600 dark:text-slate-400">{stat.enrollment} Students</td>
                      <td className="px-6 py-4 text-center text-sm font-medium text-slate-600 dark:text-slate-400">{stat.present} Students</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{stat.percentage}</span>
                          <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: stat.percentage }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Student Identity</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Status</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Last 30 Days</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {students.map((student: any) => (
                    <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-xs">
                            {student.name[0]}
                          </div>
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{student.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleStatus(student.id, 'present')}
                            className={`p-2 rounded-lg border transition-all ${attendance[student.id] === 'present'
                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-100'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:border-emerald-500 hover:text-emerald-500'
                              }`}
                            title="Present"
                            aria-label="Mark present"
                          >
                            <CheckCircle size={20} />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleStatus(student.id, 'absent')}
                            className={`p-2 rounded-lg border transition-all ${attendance[student.id] === 'absent'
                                ? 'bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-100'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:border-rose-500 hover:text-rose-500'
                              }`}
                            title="Absent"
                            aria-label="Mark absent"
                          >
                            <XCircle size={20} />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleStatus(student.id, 'late')}
                            className={`p-2 rounded-lg border transition-all ${attendance[student.id] === 'late'
                                ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-100'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:border-amber-500 hover:text-amber-500'
                              }`}
                            title="Late"
                            aria-label="Mark late"
                          >
                            <Clock size={20} />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">96%</span>
                          <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '96%' }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {!isVP && attendanceMode === 'staff' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Teachers Present</p>
              <p className="mt-3 text-3xl font-black text-slate-900 dark:text-slate-100">{staffSummary.present}</p>
            </div>
            <div className="rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Teachers Absent</p>
              <p className="mt-3 text-3xl font-black text-slate-900 dark:text-slate-100">{staffSummary.absent}</p>
            </div>
            <div className="rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Pending Sign-In</p>
              <p className="mt-3 text-3xl font-black text-slate-900 dark:text-slate-100">{staffSummary.pendingSignIn}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Staff Biometric Attendance</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Filter staff by today’s presence and biometric status.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: 'All' },
                { value: 'present', label: 'Present' },
                { value: 'absent', label: 'Absent' },
                { value: 'late', label: 'Late' },
                { value: 'pending', label: 'Pending Sign-In' },
              ].map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setStaffFilter(filter.value as 'all' | 'present' | 'absent' | 'late' | 'pending')}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${staffFilter === filter.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Teacher</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Department</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Branch</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Sign-In</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Sign-Out</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {filteredStaff.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold">
                            {record.name[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-100">{record.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{record.subjects.join(', ')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{record.department}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{record.branch}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-[0.2em] ${record.status === 'Present' ? 'bg-emerald-100 text-emerald-700' : record.status === 'Absent' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-slate-600 dark:text-slate-400">{record.signInTime ?? 'Not signed in'}</td>
                      <td className="px-6 py-4 text-center text-sm text-slate-600 dark:text-slate-400">{record.signOutTime ?? 'Pending'}</td>
                      <td className="px-6 py-4 text-right">
                        {record.signInTime ? (
                          <button
                            type="button"
                            onClick={() => handleStaffSignOut(record.id)}
                            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-slate-800"
                          >
                            Sign Out
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStaffSignIn(record.id)}
                            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-blue-500"
                          >
                            Sign In
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showSubModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl animate-in zoom-in duration-300 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white">Staff Substitution</h3>
                  <p className="text-xs text-slate-500 font-medium tracking-tight">Rapid Proxy Teacher Assignment</p>
                </div>
              </div>
              <button type="button" aria-label="Close substitution modal" onClick={() => setShowSubModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-8">
              <div className="p-5 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-[2rem] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-rose-100 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center text-rose-700 dark:text-rose-400 font-black text-2xl shadow-inner">
                    {absentTeacher?.name[0]}
                  </div>
                  <div>
                    <p className="text-base font-black text-rose-900 dark:text-rose-100">{absentTeacher?.name}</p>
                    <p className="text-xs text-rose-700 dark:text-rose-400 font-bold uppercase tracking-widest mt-1">Reported Absent Today</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-rose-400 dark:text-rose-500 uppercase tracking-[0.2em]">Live Impact</p>
                  <p className="text-lg font-black text-rose-900 dark:text-rose-100">{absentTeacher?.classes} Classes</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-slate-800 dark:text-white text-sm uppercase tracking-widest flex items-center gap-2">
                  <Users size={16} className="text-blue-600" />
                  Eligible Substitutes
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {mockTeachers.filter(t => !t.isInClass && t.id !== absentTeacher?.id).map((teacher) => (
                    <div key={teacher.id} className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold">
                          {teacher.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-white">{teacher.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium uppercase">{teacher.subjects.join(', ')}</p>
                        </div>
                      </div>
                      <button type="button" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold opacity-0 group-hover:opacity-100 transition-all">
                        Assign Proxy
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Automated SMS & App notifications will be sent to parents and the assigned teacher.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
