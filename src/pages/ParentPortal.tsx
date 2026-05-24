import {
  BookOpen,
  User,
  Award,
  Megaphone,
  HeartPulse,
  Star,
  ChevronRight,
  ClipboardList,
  TrendingUp,
  Search,
  GraduationCap,
  ArrowLeft,
  History
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { commFields, ratingLabels } from '../data/mockData';
import {
  getParentDashboard,
  getChildCommunicationLogs,
  getParentChildGrades,
  getParentChildHistory,
  ParentChild,
  ParentAnnouncement,
  CommunicationLog
} from '../services/parentService';

export const ParentPortal = () => {
  const navigate = useNavigate();

  // Root states
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [announcements, setAnnouncements] = useState<ParentAnnouncement[]>([]);
  const [selectedChild, setSelectedChild] = useState<ParentChild | null>(null);
  const [activePortalTab, setActivePortalTab] = useState<'academic' | 'communication'>('academic');
  const [academicView, setAcademicView] = useState<'current' | 'history'>('current');
  const [loading, setLoading] = useState(true);

  // Grades (Current Term) state
  const [selectedSemester, setSelectedSemester] = useState('Second Semester');
  const [selectedYear, setSelectedYear] = useState('2025/2026');
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [gradesLoading, setGradesLoading] = useState(false);
  const [gradesError, setGradesError] = useState('');

  // History state
  const [historyYear, setHistoryYear] = useState<string | null>(null);
  const [historySemester, setHistorySemester] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<any>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Communication Book state
  const [commLogs, setCommLogs] = useState<CommunicationLog[]>([]);
  const [currentLogIndex, setCurrentLogIndex] = useState(0);
  const [commLoading, setCommLoading] = useState(false);

  const academicYears = useMemo(() => ['2025/2026', '2024/2025', '2023/2024'], []);

  const parentName = useMemo(() => {
    try {
      const u = localStorage.getItem('abdi_adama_user');
      return u ? JSON.parse(u).name : 'Parent';
    } catch {
      return 'Parent';
    }
  }, []);

  const getStatus = (course: any) => {
    if (course.final_50 === null || course.final_50 === undefined) return 'PENDING';
    return Number(course.total) >= 50 ? 'PASSED' : 'FAILED';
  };

  const getFieldRating = (log: any, fieldId: string) => {
    if (fieldId === 'noteTaking') return log.rating_note_taking ?? 0;
    return log[`rating_${fieldId}`] ?? 0;
  };

  const getRatingColor = (r: number) => {
    switch (r) {
      case 3: return 'bg-emerald-500';
      case 2: return 'bg-blue-500';
      case 1: return 'bg-amber-500';
      case 0: return 'bg-rose-500';
      default: return 'bg-slate-200';
    }
  };

  // Load Dashboard (children, announcements)
  useEffect(() => {
    getParentDashboard()
      .then(d => {
        setChildren(d.children || []);
        setAnnouncements(d.announcements || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Fetch grades when selections change
  useEffect(() => {
    if (!selectedChild || activePortalTab !== 'academic' || academicView !== 'current') return;
    setGradesLoading(true);
    setGradesError('');
    const semNum = selectedSemester === 'First Semester' ? 1 : 2;
    getParentChildGrades(selectedChild.id, semNum, selectedYear)
      .then(d => {
        const c = d?.courses || [];
        setCourses(c);
        setSelectedCourse(c[0] || null);
      })
      .catch(e => {
        setGradesError(e.message || 'Failed to fetch child courses.');
        setCourses([]);
        setSelectedCourse(null);
      })
      .finally(() => setGradesLoading(false));
  }, [selectedChild, selectedSemester, selectedYear, activePortalTab, academicView]);

  useEffect(() => {
    setCourseSearchQuery(selectedCourse?.name || '');
    setDropdownOpen(false);
  }, [selectedCourse]);

  const filteredCourses = useMemo(() => {
    const q = courseSearchQuery.trim().toLowerCase();
    if (!q || (selectedCourse && q === selectedCourse.name.toLowerCase())) return courses;
    return courses.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
  }, [courses, courseSearchQuery, selectedCourse]);

  // Fetch history when selections change
  useEffect(() => {
    if (!selectedChild || activePortalTab !== 'academic' || academicView !== 'history' || !historyYear || !historySemester) return;
    setHistoryLoading(true);
    const semNum = historySemester === 'First Semester' ? 1 : 2;
    getParentChildHistory(selectedChild.id, historyYear, semNum)
      .then(d => {
        setHistoryData(d && d.length > 0 ? d[0] : null);
      })
      .catch(() => setHistoryData(null))
      .finally(() => setHistoryLoading(false));
  }, [selectedChild, historyYear, historySemester, activePortalTab, academicView]);

  const semesterAverage = useMemo(() => {
    if (!historyData?.courses) return 0;
    const scores = historyData.courses.map((c: any) => parseFloat(c.score) || 0);
    return scores.length ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;
  }, [historyData]);

  // Fetch communication book logs
  useEffect(() => {
    if (!selectedChild || activePortalTab !== 'communication') return;
    setCommLoading(true);
    getChildCommunicationLogs(selectedChild.id)
      .then(logs => {
        setCommLogs(logs || []);
        setCurrentLogIndex(0);
      })
      .catch(() => setCommLogs([]))
      .finally(() => setCommLoading(false));
  }, [selectedChild, activePortalTab]);

  const currentLog = commLogs[currentLogIndex];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-16rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // --- CHILD DETAIL VIEW ---
  if (selectedChild) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800">
          <button
            onClick={() => {
              setSelectedChild(null);
              setHistoryYear(null);
              setHistorySemester(null);
              setHistoryData(null);
            }}
            className="flex items-center gap-2.5 px-5 py-3 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-bold text-sm border border-slate-100 dark:border-slate-800 w-fit shrink-0"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>

          {/* Persistent Multi-child Horizontal Switcher */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2 xl:block hidden">Active Child:</span>
            {children.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedChild(c)}
                className={`flex items-center gap-3.5 px-5 py-2.5 rounded-xl border transition-all ${
                  selectedChild.id === c.id
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-blue-400'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                  selectedChild.id === c.id ? 'bg-white/20 text-white' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                }`}>
                  {c.fullName.charAt(0)}
                </div>
                <div className="text-left">
                  <p className="text-xs font-black leading-none">{c.fullName}</p>
                  <p className="text-[9px] font-bold opacity-75 mt-0.5">Grade {c.grade}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          {/* Main 2-tab selection exactly matching the original design structure */}
          <div className="flex flex-wrap gap-4 border-b border-slate-100 dark:border-slate-800 mb-8 pb-4">
            <button
              onClick={() => setActivePortalTab('academic')}
              className={`pb-3 px-3 text-sm font-black uppercase tracking-widest transition-all relative ${
                activePortalTab === 'academic' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Academic Profile
              {activePortalTab === 'academic' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 dark:bg-blue-400 rounded-t-full" />}
            </button>
            
            <button
              onClick={() => setActivePortalTab('communication')}
              className={`pb-3 px-3 text-sm font-black uppercase tracking-widest transition-all relative ${
                activePortalTab === 'communication' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Communication Book
              {activePortalTab === 'communication' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 dark:bg-blue-400 rounded-t-full" />}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-5 mb-10 text-center sm:text-left bg-slate-50 dark:bg-slate-800/30 p-6 rounded-[2rem]">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-2xl shadow-inner">
              {selectedChild.fullName.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-tight">{selectedChild.fullName}</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-widest mt-1">Grade {selectedChild.grade} Student</p>
            </div>
          </div>

          {/* TAB: ACADEMIC PROFILE WITH INTERNAL TOGGLE */}
          {activePortalTab === 'academic' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              {/* Internal Current Term vs Academic History view selector */}
              <div className="flex bg-slate-100 dark:bg-slate-850 p-1.5 rounded-2xl w-fit">
                <button
                  onClick={() => setAcademicView('current')}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    academicView === 'current'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <BookOpen size={14} />
                  Current Term
                </button>
                <button
                  onClick={() => setAcademicView('history')}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    academicView === 'history'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <History size={14} />
                  Academic History
                </button>
              </div>

              {academicView === 'current' ? (
                gradesLoading ? (
                  <div className="flex justify-center items-center h-48">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : gradesError ? (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                    {gradesError}
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Control Dropdowns */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 dark:bg-slate-800/20 p-6 rounded-3xl border border-slate-100/50 dark:border-slate-800">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Academic Year</label>
                        <select
                          value={selectedYear}
                          onChange={(e) => {
                            setSelectedYear(e.target.value);
                            setSelectedCourse(null);
                          }}
                          className="w-full appearance-none px-5 py-3 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all cursor-pointer text-slate-800 dark:text-white"
                        >
                          {academicYears.map((year) => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Semester</label>
                        <select
                          value={selectedSemester}
                          onChange={(e) => {
                            setSelectedSemester(e.target.value);
                            setSelectedCourse(null);
                          }}
                          className="w-full appearance-none px-5 py-3 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all cursor-pointer text-slate-800 dark:text-white"
                        >
                          <option>First Semester</option>
                          <option>Second Semester</option>
                        </select>
                      </div>

                      <div className="relative">
                        <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Search & Select Course</label>
                        <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input
                            type="text"
                            placeholder="Type course name or code..."
                            value={courseSearchQuery}
                            onChange={(e) => {
                              setCourseSearchQuery(e.target.value);
                              setDropdownOpen(true);
                            }}
                            onFocus={() => {
                              setDropdownOpen(true);
                              if (selectedCourse && courseSearchQuery === selectedCourse.name) {
                                setCourseSearchQuery('');
                              }
                            }}
                            onBlur={() => {
                              setTimeout(() => {
                                setDropdownOpen(false);
                                if (selectedCourse) {
                                  setCourseSearchQuery(selectedCourse.name);
                                }
                              }, 250);
                            }}
                            className="w-full pl-11 pr-5 py-3 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all text-slate-800 dark:text-white"
                          />
                        </div>

                        {dropdownOpen && (
                          <div className="absolute z-50 left-0 right-0 mt-2 max-h-[250px] overflow-y-auto bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-2xl shadow-xl p-2 space-y-1">
                            {filteredCourses.length > 0 ? (
                              filteredCourses.map((c) => (
                                <button
                                  key={c.id || c.name}
                                  type="button"
                                  onClick={() => {
                                    setSelectedCourse(c);
                                    setCourseSearchQuery(c.name);
                                    setDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-4 py-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                                    selectedCourse?.name === c.name ? 'bg-blue-50 dark:bg-blue-900/30 font-bold text-blue-600' : ''
                                  }`}
                                >
                                  <p className="text-xs font-bold">{c.name}</p>
                                  <p className="text-[10px] opacity-75">{c.code}</p>
                                </button>
                              ))
                            ) : (
                              <p className="text-xs text-slate-500 text-center py-4">No courses found</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedCourse ? (
                      <div className="space-y-6">
                        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-100/50 dark:border-slate-800 p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
                          <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
                              <BookOpen size={28} />
                            </div>
                            <div>
                              <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{selectedCourse.name}</h3>
                              <div className="flex flex-wrap items-center gap-4 mt-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full">{selectedCourse.code}</span>
                                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-bold">
                                  <User size={13} />
                                  Teacher: {selectedCourse.teacher || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 w-full md:w-56 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div className="flex justify-between items-end mb-2">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Progress</span>
                              <span className="text-xl font-black text-blue-600 dark:text-blue-400">
                                {selectedCourse.total !== null && selectedCourse.total !== undefined ? Math.round(Number(selectedCourse.total)) : 0}%
                              </span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-1000 ${getStatus(selectedCourse) === 'PASSED'
                                  ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                                  : getStatus(selectedCourse) === 'FAILED'
                                    ? 'bg-gradient-to-r from-rose-400 to-red-500'
                                    : 'bg-gradient-to-r from-amber-400 to-orange-500'
                                }`}
                                style={{ width: `${selectedCourse.total !== null && selectedCourse.total !== undefined ? Math.min(100, Math.max(0, Number(selectedCourse.total))) : 0}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Grade Table */}
                        <div className="overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-800">
                              <tr>
                                <th className="px-6 py-4.5 font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Component</th>
                                <th className="px-6 py-4.5 font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">Weight</th>
                                <th className="px-6 py-4.5 font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Scored Mark</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              <tr className="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">Quizzes</td>
                                <td className="px-6 py-4 text-center text-slate-500 dark:text-slate-400 font-bold">10%</td>
                                <td className="px-6 py-4 text-right font-black text-slate-800 dark:text-white">
                                  {selectedCourse.quiz_10 !== null && selectedCourse.quiz_10 !== undefined ? Number(selectedCourse.quiz_10).toFixed(1) : '--'}
                                </td>
                              </tr>
                              <tr className="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">Assignments</td>
                                <td className="px-6 py-4 text-center text-slate-500 dark:text-slate-400 font-bold">10%</td>
                                <td className="px-6 py-4 text-right font-black text-slate-800 dark:text-white">
                                  {selectedCourse.assignment_10 !== null && selectedCourse.assignment_10 !== undefined ? Number(selectedCourse.assignment_10).toFixed(1) : '--'}
                                </td>
                              </tr>
                              <tr className="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">Midterm Exam</td>
                                <td className="px-6 py-4 text-center text-slate-500 dark:text-slate-400 font-bold">30%</td>
                                <td className="px-6 py-4 text-right font-black text-slate-800 dark:text-white">
                                  {selectedCourse.mid_30 !== null && selectedCourse.mid_30 !== undefined ? Number(selectedCourse.mid_30).toFixed(1) : '--'}
                                </td>
                              </tr>
                              <tr className="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">Final Exam</td>
                                <td className="px-6 py-4 text-center text-slate-500 dark:text-slate-400 font-bold">50%</td>
                                <td className="px-6 py-4 text-right font-black text-slate-800 dark:text-white">
                                  {selectedCourse.final_50 !== null && selectedCourse.final_50 !== undefined ? Number(selectedCourse.final_50).toFixed(1) : '--'}
                                </td>
                              </tr>
                              <tr className="bg-slate-50/50 dark:bg-slate-850 font-black">
                                <td className="px-6 py-4 text-blue-600 dark:text-blue-400">Total Academic Score</td>
                                <td className="px-6 py-4 text-center text-blue-600 dark:text-blue-400">100%</td>
                                <td className="px-6 py-4 text-right text-emerald-600 dark:text-emerald-400 text-base">
                                  {selectedCourse.total !== null && selectedCourse.total !== undefined ? Number(selectedCourse.total).toFixed(1) : '--'}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/20 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Standing Status:</span>
                            {(() => {
                              const s = getStatus(selectedCourse);
                              if (s === 'PASSED') {
                                return (
                                  <span className="px-4 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 rounded-full text-xs font-black tracking-widest uppercase">
                                    PASSED
                                  </span>
                                );
                              } else if (s === 'FAILED') {
                                return (
                                  <span className="px-4 py-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 rounded-full text-xs font-black tracking-widest uppercase">
                                    FAILED
                                  </span>
                                );
                              } else {
                                return (
                                  <span className="px-4 py-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 rounded-full text-xs font-black tracking-widest uppercase">
                                    PENDING
                                  </span>
                                );
                              }
                            })()}
                          </div>

                          <div className="text-right">
                            <span className="text-3xl font-black text-slate-800 dark:text-white">
                              {selectedCourse.total !== null && selectedCourse.total !== undefined ? Number(selectedCourse.total).toFixed(1) : '--'}
                            </span>
                            <span className="text-sm font-bold text-slate-400"> / 100</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 dark:bg-slate-800/20 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800 p-12 text-center text-slate-500 dark:text-slate-400 font-bold">
                        No active courses found for the selected Academic Year and Semester.
                      </div>
                    )}
                  </div>
                )
              ) : (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="bg-slate-50 dark:bg-slate-800/20 p-6 rounded-3xl border border-slate-100/50 dark:border-slate-800">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
                        <GraduationCap size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Academic History Archive</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Archive of child's verified results</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Select Academic Year</label>
                        <select
                          value={historyYear || ''}
                          onChange={(e) => {
                            setHistoryYear(e.target.value || null);
                            setHistoryData(null);
                          }}
                          className="w-full appearance-none px-5 py-3 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all cursor-pointer text-slate-800 dark:text-white"
                        >
                          <option value="">-- Select Year --</option>
                          {academicYears.map((year) => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Select Semester</label>
                        <select
                          value={historySemester || ''}
                          onChange={(e) => {
                            setHistorySemester(e.target.value || null);
                            setHistoryData(null);
                          }}
                          disabled={!historyYear}
                          className="w-full appearance-none px-5 py-3 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-slate-800 dark:text-white"
                        >
                          <option value="">-- Select Semester --</option>
                          <option>First Semester</option>
                          <option>Second Semester</option>
                        </select>
                      </div>
                    </div>

                    {historyYear && historySemester && historyData && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Academic Year</p>
                          <p className="text-base font-black text-slate-800 dark:text-white">{historyYear}</p>
                        </div>
                        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Semester</p>
                          <p className="text-base font-black text-slate-800 dark:text-white">{historySemester}</p>
                        </div>
                        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Semester Average</p>
                          <p className="text-base font-black text-slate-800 dark:text-white">{semesterAverage}%</p>
                        </div>
                      </div>
                    )}

                    {historyLoading ? (
                      <div className="flex justify-center items-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : historyData && historyData.courses ? (
                      <div className="overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                              <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Subject</th>
                              <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Semester Total Mark</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {historyData.courses.map((course: any, i: number) => (
                              <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="px-8 py-5">
                                  <p className="font-bold text-slate-800 dark:text-white">{course.name}</p>
                                </td>
                                <td className="px-8 py-5 text-right">
                                  <span className="inline-flex items-center px-4 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-sm font-black">
                                    {typeof course.score === 'string' && course.score.includes('%') ? course.score : `${course.score}%`}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : historyYear && historySemester ? (
                      <div className="text-center py-12 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
                        <p className="font-medium text-sm">No historical results archived for this period.</p>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
                        <p className="font-medium text-sm">Select both Academic Year and Semester to load results from archives.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: COMMUNICATION BOOK */}
          {activePortalTab === 'communication' && (
            commLoading ? (
              <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : commLogs.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl animate-in fade-in duration-500">
                <div className="bg-slate-50 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ClipboardList className="text-slate-400" size={32} />
                </div>
                <p className="text-slate-500 font-medium text-sm">No active weekly review published yet.</p>
                <p className="text-xs text-slate-400 font-bold uppercase mt-2 tracking-wider">Note: Old reviews purge automatically every Friday morning. Teachers post new updates on weekends.</p>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <Star className="text-amber-500" size={24} />
                      Weekly Progress Report
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">Review ratings provided by your child's teachers.</p>
                  </div>
                  <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-800 p-2 rounded-xl self-start md:self-auto shadow-inner border border-slate-200 dark:border-slate-750">
                    <button
                      disabled={currentLogIndex === 0}
                      onClick={() => setCurrentLogIndex(prev => prev - 1)}
                      className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all disabled:opacity-30"
                    >
                      <ChevronRight className="rotate-180" size={20} />
                    </button>
                    <div className="flex flex-col items-center min-w-[120px]">
                      <span className="text-[9px] uppercase font-black text-slate-400">Week Ending</span>
                      <span className="text-xs font-black text-blue-600 dark:text-blue-400">{currentLog.week_ending_formatted || currentLog.week_ending}</span>
                    </div>
                    <button
                      disabled={currentLogIndex === commLogs.length - 1}
                      onClick={() => setCurrentLogIndex(prev => prev + 1)}
                      className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all disabled:opacity-30"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {commFields.map(field => {
                    const rating = getFieldRating(currentLog, field.id);
                    return (
                      <div key={field.id} className="group bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <div className="flex flex-col items-center text-center">
                          <div className={`w-14 h-14 rounded-2xl ${getRatingColor(rating)} flex items-center justify-center text-white font-black text-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                            {rating + 1}
                          </div>
                          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-1">{field.label}</h4>
                          <p className="text-[10px] text-slate-500 font-medium leading-tight mb-4 min-h-[32px]">{field.description}</p>
                          <span className={`w-full py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${getRatingColor(rating)} text-white shadow-sm`}>
                            {ratingLabels[rating]}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-blue-50 dark:bg-blue-900/10 p-8 rounded-[2rem] border border-blue-100 dark:border-blue-900/20 relative overflow-hidden group">
                    <h4 className="text-xs font-black uppercase text-blue-900 dark:text-blue-400 mb-3 flex items-center gap-2 tracking-widest">
                      <ClipboardList size={18} />
                      Teacher Observation Note
                    </h4>
                    <p className="text-base text-blue-800 dark:text-blue-300 leading-relaxed italic font-medium relative z-10">
                      "{currentLog.teacher_note || "Student has shown consistent engagement this week. Maintain current focus on home assignments for continued progress."}"
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-wider text-blue-900/60 dark:text-blue-400/60 mt-4 relative z-10">
                      Submitted by: {currentLog.teacher_name || 'Class Room Teacher'}
                    </p>
                    <Star size={100} className="absolute -bottom-10 -right-10 text-blue-600/5 rotate-12 group-hover:scale-110 transition-transform duration-700" />
                  </div>

                  <div className="bg-slate-900 rounded-[2rem] p-8 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden group">
                    <div className="relative z-10">
                      <TrendingUp className="text-blue-400 mb-4" size={32} />
                      <h4 className="text-lg font-black mb-2 uppercase tracking-tight">Progress Insight</h4>
                      <p className="text-slate-400 text-xs font-medium leading-relaxed mt-3">
                        Consistent participation, materials readiness, and homework completion correlate directly to passing final exams with top standing ranks.
                      </p>
                    </div>
                    <div className="relative z-10 mt-8">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Report Standing</p>
                      <p className="text-sm font-bold text-emerald-400 uppercase mt-1">Excellent Compliance</p>
                    </div>
                    <Star size={100} className="absolute -bottom-10 -right-10 text-white/5 rotate-12 group-hover:scale-110 transition-transform duration-700" />
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    );
  }

  // --- DASHBOARD VIEW ---
  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 md:p-16 text-white shadow-2xl relative overflow-hidden border border-slate-700/30">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
          <div className="space-y-4 sm:space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-[10px] font-black uppercase tracking-[0.2em]">
              Parent Portal
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-none">
              Welcome back, {parentName}!
            </h2>
            <p className="text-slate-300 text-base md:text-lg max-w-lg leading-relaxed font-medium">
              Monitor your children's real-time academic growth, grades, clinic activity, and log notices.
            </p>
          </div>

          <div className="flex items-center gap-8 bg-white/5 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white/10 shadow-2xl">
            <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl rotate-6">
              <User size={32} />
            </div>
            <div>
              <p className="text-base font-black text-white">Family Account</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <p className="text-xs text-blue-300 font-bold uppercase tracking-widest">Verified Parent</p>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[150px] -mr-64 -mt-64" />
      </div>

      <div className="space-y-8">
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
               <Award size={24} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">My Children</h3>
          </div>
          <span className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl text-xs font-black text-slate-500 uppercase tracking-widest">
            {children.length} Enrolled
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {children.map((child) => (
            <div
              key={child.id}
              onClick={() => {
                setSelectedChild(child);
                setActivePortalTab('academic');
                setAcademicView('current');
              }}
              className="group relative cursor-pointer"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2rem] sm:rounded-[3rem] blur-lg opacity-0 group-hover:opacity-20 transition duration-500" />
              <div className="relative bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm group-hover:shadow-2xl group-hover:-translate-y-2 transition-all duration-500">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-3xl shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                      {child.fullName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-1">{child.fullName}</h4>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Grade {child.grade}</p>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl">
                    <ChevronRight size={24} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-4">
                  <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-[2rem] border border-slate-100 dark:border-slate-700/50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Attendance</p>
                    <p className="text-2xl font-black text-emerald-600">{child.attendance || '0.0%'}</p>
                  </div>
                  <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-[2rem] border border-slate-100 dark:border-slate-700/50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Performance Rank</p>
                    <p className="text-xl font-black text-blue-600 truncate">{child.performance || 'Pending'}</p>
                  </div>
                </div>
                <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-4">
                  Click to view profile & academic records
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center gap-3 px-2">
            <Megaphone className="text-blue-600 dark:text-blue-400" size={24} />
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Announcements & Notices</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {announcements.length > 0 ? (
              announcements.map((notice) => (
                <div key={notice.id || notice.title} className="group bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] ${
                      notice.priority === 'High' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30'
                    }`}>
                      {notice.priority}
                    </span>
                    <span className="text-xs font-bold text-slate-400">{notice.category}</span>
                  </div>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white mb-3 leading-tight group-hover:text-blue-600 transition-colors">{notice.title}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{notice.content}</p>
                  {notice.category === 'Logistics' && notice.driverName && (
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/50 flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                      Bus Driver: {notice.driverName}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 text-center text-slate-500">
                No new announcements.
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4">
          <div
            className="h-full bg-slate-900 dark:bg-slate-850 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group hover:scale-[1.02] transition-all cursor-pointer border border-white/5"
            onClick={() => navigate('/clinic-chat')}
          >
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <div className="w-16 h-16 bg-blue-600 rounded-[1.5rem] flex items-center justify-center mb-8 shadow-xl shadow-blue-900/50">
                  <HeartPulse size={32} />
                </div>
                <h3 className="text-3xl font-black mb-4 leading-tight">Clinic<br />Support</h3>
                <p className="text-slate-400 text-sm font-medium leading-relaxed mt-2">
                  Direct WhatsApp-style chat connection with the school clinic administrator. Share medical requests or reviews.
                </p>
              </div>
              <div className="mt-12">
                <button className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all">
                  Open Medical Chat
                </button>
              </div>
            </div>
            <HeartPulse size={200} className="absolute -bottom-20 -right-20 text-white/5 rotate-12 opacity-50" />
          </div>
        </div>
      </div>
    </div>
  );
};
