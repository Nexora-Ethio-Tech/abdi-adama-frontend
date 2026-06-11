import {
  BookOpen,
  User,
  Award,
  Megaphone,
  HeartPulse,
  Star,
  ChevronRight,
  ChevronDown,
  ClipboardList,
  TrendingUp,
  Search,
  GraduationCap,
  ArrowLeft,
  History,
  Send,
  Clock,
  Check,
  ShieldCheck,
  Bell,
  MessageSquare,
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  AlertCircle,
  DollarSign
} from 'lucide-react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { commFields, ratingLabels } from '../data/mockData';
import api from '../services/api';
import { useStore } from '../context/useStore';
import {
  getParentDashboard,
  getChildCommunicationLogs,
  getParentChildGrades,
  getParentChildHistory,
  getChildTeachers,
  getChildAttendance,
  getChildClinicUpdates,
  getDriverUpdates,
  getSchoolAnnouncements,
  getFinancialSummary,
  ParentChild,
  ParentAnnouncement,
  CommunicationLog,
  Teacher,
  AttendanceRecord,
  AttendanceStatistics,
  ClinicVisit,
  HealthProfile,
  DriverUpdate,
  FinancialSummary
} from '../services/parentService';
import {
  getCurrentECYear,
  ecYearToGregorian,
  getCurrentSemester,
  formatSemester,
  getAvailableGregorianYears,
  gregorianToECYear,
  isYearAccessible,
  isSemesterAccessible,
  formatEthiopianLabel,
} from '../utils/ethiopianCalendar';

export const ParentPortal = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activePortalTab = searchParams.get('tab') || 'dashboard';
  const { notices, setNotices } = useStore();

  // Core State
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [selectedChild, setSelectedChild] = useState<ParentChild | null>(null);
  const [loading, setLoading] = useState(true);

  // Grades (Current Term) State
  const [selectedSemester, setSelectedSemester] = useState(() => formatSemester(getCurrentSemester()));
  const [selectedYear, setSelectedYear] = useState(() => ecYearToGregorian(getCurrentECYear()));
  const [courses, setCourses] = useState<any[]>([]);
  const [gradingMethods, setGradingMethods] = useState<Array<{ id: string; label: string; maxWeight: number }>>([]);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [gradesLoading, setGradesLoading] = useState(false);
  const [gradesError, setGradesError] = useState('');
  const [viewMode, setViewMode] = useState<'current' | 'history'>('current');

  // History State
  const [historyYear, setHistoryYear] = useState<string | null>(null);
  const [historySemester, setHistorySemester] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<any>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Communication Book State
  const [showCommBook, setShowCommBook] = useState(false);
  const [commLogs, setCommLogs] = useState<CommunicationLog[]>([]);
  const [currentLogIndex, setCurrentLogIndex] = useState(0);
  const [commLoading, setCommLoading] = useState(false);
  const currentLog = useMemo(() => commLogs[currentLogIndex] || null, [commLogs, currentLogIndex]);

  // Clinic Chat State
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [allClinicMessages, setAllClinicMessages] = useState<any[]>([]); // For Dashboard Previews
  const chatEndRef = useRef<HTMLDivElement>(null);

  // NEW: Teachers State
  const [childTeachers, setChildTeachers] = useState<Teacher[]>([]);
  const [teachersLoading, setTeachersLoading] = useState(false);

  // NEW: Attendance State
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<any>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceExpanded, setAttendanceExpanded] = useState(false);

  // NEW: Clinic Support Sub-Tab
  const [clinicSupportTab, setClinicSupportTab] = useState<'chat' | 'visits'>('visits');

  // NEW: Clinic Updates State
  const [clinicVisits, setClinicVisits] = useState<ClinicVisit[]>([]);
  const [healthProfile, setHealthProfile] = useState<HealthProfile>({});
  const [clinicUpdatesLoading, setClinicUpdatesLoading] = useState(false);

  // NEW: Driver Updates State
  const [driverUpdates, setDriverUpdates] = useState<DriverUpdate[]>([]);
  const [driverUpdatesLoading, setDriverUpdatesLoading] = useState(false);

  // NEW: School Announcements State
  const [schoolAnnouncementsData, setSchoolAnnouncementsData] = useState<ParentAnnouncement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [noticeFilter, setNoticeFilter] = useState<'all' | 'school' | 'driver'>('all');

  // NEW: Financial Summary State
  const [financialData, setFinancialData] = useState<FinancialSummary[]>([]);
  const [financialLoading, setFinancialLoading] = useState(false);

  const academicYears = getAvailableGregorianYears();

  const familyIdText = useMemo(() => {
    // Extract numeric part from digitalId (e.g., "PAR-MB-0001" -> "#0001")
    const userStr = localStorage.getItem('abdi_adama_user');
    if (!userStr) return '';
    try {
      const user = JSON.parse(userStr);
      const digitalId = user.digitalId || '';
      const match = digitalId.match(/(\d+)$/);
      return match ? `#${match[1].padStart(4, '0')}` : '';
    } catch {
      return '';
    }
  }, []);

  const parentName = useMemo(() => {
    try {
      const u = localStorage.getItem('abdi_adama_user');
      return u ? JSON.parse(u).name : 'Parent';
    } catch {
      return 'Parent';
    }
  }, []);


  const resetChildScopedState = () => {
    setCourses([]);
    setSelectedCourse(null);
    setHistoryData(null);
    setCommLogs([]);
    setCurrentLogIndex(0);
    setChatMessages([]);
    setChildTeachers([]);
    setAttendanceRecords([]);
    setAttendanceStats(null);
    setClinicVisits([]);
    setHealthProfile({});
    setGradesError('');
  };

  const buildSearchParams = (tab: string, childId?: string | null) => {
    const params: Record<string, string> = { tab };
    if (childId) params.childId = childId;
    return params;
  };

  const selectChild = (child: ParentChild, tabOverride?: string) => {
    resetChildScopedState();
    setSelectedChild(child);
    setSearchParams(buildSearchParams(tabOverride ?? activePortalTab, child.id));
    setShowCommBook(false);
  };

  const getStatus = (course: any) => {
    if (!course || course.total === null || course.total === undefined) return 'PENDING';
    const totalScore = Number(course.total);
    if (!Number.isFinite(totalScore)) return 'PENDING';
    return totalScore >= 50 ? 'PASSED' : 'FAILED';
  };

  const getSubmittedTotal = (course: any) => {
    if (course?.total === null || course?.total === undefined) return null;
    const totalScore = Number(course.total);
    return Number.isFinite(totalScore) ? totalScore : null;
  };

  const getProgressBarClass = (course: any) => {
    const status = getStatus(course);
    if (status === 'PASSED') return 'text-emerald-400';
    if (status === 'FAILED') return 'text-rose-400';
    return 'text-amber-400';
  };

  const getClampedPercentage = (value: string | number | null | undefined) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : 0;
  };

  const getFieldRating = (log: any, fieldId: string) => {
    if (fieldId === 'noteTaking') return log.rating_note_taking ?? 0;
    return log[`rating_${fieldId}`] ?? 0;
  };

  const getRatingColor = (r: number) => {
    switch (r) {
      case 5: return 'bg-emerald-500';
      case 4: return 'bg-teal-500';
      case 3: return 'bg-blue-500';
      case 2: return 'bg-amber-500';
      case 1: return 'bg-orange-500';
      case 0: return 'bg-slate-400';
      default: return 'bg-slate-300';
    }
  };

  const handleViewModeChange = (mode: 'current' | 'history') => {
    setViewMode(mode);
    setSearchParams(buildSearchParams(mode === 'current' ? 'grades' : 'history', selectedChild?.id));
    setShowCommBook(false);
  };

  // Sync activePortalTab with viewMode
  useEffect(() => {
    if (activePortalTab === 'grades') {
      setViewMode('current');
    } else if (activePortalTab === 'history') {
      setViewMode('history');
    }
  }, [activePortalTab]);

  // Load Main Dashboard data
  useEffect(() => {
    getParentDashboard()
      .then(d => {
        const kids = d.children || [];
        setChildren(kids);

        const mappedNotices = (d.announcements || []).map((a: any) => ({
          id: a.id,
          title: a.title,
          content: a.content,
          priority: a.priority || 'Normal',
          time: a.timestamp || a.time || new Date().toISOString(),
          category: a.category || 'School',
          driverName: a.driverName,
          audience: a.audience || ['parent']
        }));
        setNotices(mappedNotices);

        if (kids.length > 0) {
          const urlChildId = searchParams.get('childId');
          const fromUrl = urlChildId ? kids.find(k => k.id === urlChildId) : undefined;
          const initialChild = fromUrl ?? kids[0];
          setSelectedChild(initialChild);
          if (!urlChildId || !fromUrl) {
            setSearchParams(buildSearchParams(activePortalTab, initialChild.id), { replace: true });
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [setNotices]);

  // Keep selected child in sync when childId URL param changes
  useEffect(() => {
    const urlChildId = searchParams.get('childId');
    if (!urlChildId || children.length === 0) return;
    const match = children.find(c => c.id === urlChildId);
    if (match && match.id !== selectedChild?.id) {
      resetChildScopedState();
      setSelectedChild(match);
    }
  }, [searchParams, children, selectedChild?.id]);

  // Fetch all clinic messages for previews on Dashboard
  useEffect(() => {
    if (activePortalTab === 'dashboard') {
      api.get('/clinic/chat')
        .then(res => {
          const msgs = (res.data?.data || []).map((m: any) => ({
            id: m.id,
            role: m.role || m.sender_role || 'parent',
            child_id: m.child_id || m.student_id,
            student_name: m.student_name,
            text: m.text || m.message,
            timestamp: m.timestamp || m.created_at
          }));
          setAllClinicMessages(msgs);
        })
        .catch(console.error);
    }
  }, [activePortalTab]);

  // Fetch specific child grades
  useEffect(() => {
    if (!selectedChild || activePortalTab !== 'grades') return;
    if (viewMode !== 'current') return;

    // Block access to future academic periods
    const semNumCheck = selectedSemester === 'First Semester' ? 1 : 2;
    if (!isSemesterAccessible(selectedYear, semNumCheck as 1 | 2)) {
      setGradesError('Grades for this academic period are not yet accessible. Please select a current or past year and semester.');
      setCourses([]);
      setGradingMethods([]);
      setSelectedCourse(null);
      return;
    }

    let cancelled = false;
    const loadGrades = (preserveSelection = false) => {
      setGradesLoading(true);
      setGradesError('');
      const semNum = selectedSemester === 'First Semester' ? 1 : 2;
      getParentChildGrades(selectedChild.id, semNum, selectedYear)
        .then(d => {
          if (cancelled) return;
          const c = d?.courses || [];
          setCourses(c);
          const methods = d?.gradingMethods || [];
          setGradingMethods(methods);
          if (c.length > 0) {
            setSelectedCourse((prev: any) => {
              if (preserveSelection && prev) {
                return c.find((course: any) => course.id === prev.id) || c[0];
              }
              return c[0];
            });
          } else {
            setSelectedCourse(null);
          }
        })
        .catch(e => {
          if (cancelled) return;
          setGradesError(e.message || 'Failed to fetch child courses.');
          setCourses([]);
          setGradingMethods([]);
          setSelectedCourse(null);
        })
        .finally(() => {
          if (!cancelled) setGradesLoading(false);
        });
    };

    loadGrades(true);
    const interval = setInterval(() => loadGrades(true), 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [selectedChild, selectedSemester, selectedYear, activePortalTab, viewMode]);

  useEffect(() => {
    setCourseSearchQuery(selectedCourse?.name || '');
    setDropdownOpen(false);
  }, [selectedCourse]);

  const filteredCourses = useMemo(() => {
    const q = courseSearchQuery.trim().toLowerCase();
    if (!q || (selectedCourse && q === selectedCourse.name.toLowerCase())) return courses;
    return courses.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
  }, [courses, courseSearchQuery, selectedCourse]);

  // Fetch child academic history (dedicated history tab only)
  useEffect(() => {
    if (!selectedChild || activePortalTab !== 'history' || !historyYear || !historySemester) return;
    setHistoryLoading(true);
    setHistoryData(null);
    const semNum = historySemester === 'First Semester' ? 1 : 2;
    getParentChildHistory(selectedChild.id, historyYear, semNum)
      .then(d => {
        setHistoryData(d && d.length > 0 ? d[0] : null);
      })
      .catch(() => setHistoryData(null))
      .finally(() => setHistoryLoading(false));
  }, [selectedChild, historyYear, historySemester, activePortalTab]);

  const semesterAverage = useMemo(() => {
    if (!historyData?.courses) return 'N/A';
    const scored = historyData.courses.filter((c: any) => c.score !== null && c.score !== undefined);
    if (scored.length === 0) return 'N/A';
    const scores = scored.map((c: any) => parseFloat(String(c.score)) || 0);
    return Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length);
  }, [historyData]);

  // Fetch communication book logs when requested
  useEffect(() => {
    if (!selectedChild) return;
    if (!showCommBook && activePortalTab !== 'communication-book') return;
    setCommLoading(true);
    getChildCommunicationLogs(selectedChild.id)
      .then(logs => {
        setCommLogs(logs || []);
        setCurrentLogIndex(0);
      })
      .catch(() => setCommLogs([]))
      .finally(() => setCommLoading(false));
  }, [selectedChild, showCommBook, activePortalTab]);

  // Fetch active clinic chat thread
  useEffect(() => {
    if (!selectedChild || activePortalTab !== 'clinic') return;
    setChatLoading(true);
    setChatMessages([]);
    api.get(`/clinic/chat?childId=${encodeURIComponent(selectedChild.id)}`)
      .then(res => {
        const msgs = (res.data?.data || []).map((m: any) => ({
          id: m.id,
          role: m.role || m.sender_role || 'parent',
          child_id: m.child_id || m.student_id,
          student_name: m.student_name,
          text: m.text || m.message,
          timestamp: m.timestamp || m.created_at
        }));
        setChatMessages(msgs);
      })
      .catch(console.error)
      .finally(() => setChatLoading(false));
  }, [selectedChild, activePortalTab]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Fetch child's teachers when on teachers tab
  useEffect(() => {
    if (!selectedChild || activePortalTab !== 'teachers') return;
    setTeachersLoading(true);
    setChildTeachers([]);
    getChildTeachers(selectedChild.id)
      .then(teachers => setChildTeachers(teachers || []))
      .catch(err => {
        console.error('Failed to fetch teachers:', err);
        setChildTeachers([]);
      })
      .finally(() => setTeachersLoading(false));
  }, [selectedChild, activePortalTab]);

  // Fetch attendance when on dashboard or attendance tab (with auto-refresh)
  useEffect(() => {
    if (!selectedChild || (activePortalTab !== 'dashboard' && activePortalTab !== 'attendance')) return;

    let cancelled = false;
    const loadAttendance = () => {
      setAttendanceLoading(true);
      getChildAttendance(selectedChild.id)
        .then(data => {
          if (cancelled) return;
          setAttendanceRecords(data.records || []);
          setAttendanceStats(data.statistics || {});
        })
        .catch(err => {
          if (cancelled) return;
          console.error('Failed to fetch attendance:', err);
          setAttendanceRecords([]);
          setAttendanceStats({});
        })
        .finally(() => {
          if (!cancelled) setAttendanceLoading(false);
        });
    };

    loadAttendance();
    const interval = setInterval(loadAttendance, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [selectedChild, activePortalTab]);

  // Fetch clinic updates when on clinic tab
  useEffect(() => {
    if (!selectedChild || activePortalTab !== 'clinic') return;
    setClinicUpdatesLoading(true);
    setClinicVisits([]);
    setHealthProfile({});
    getChildClinicUpdates(selectedChild.id)
      .then(data => {
        setClinicVisits(data.visits || []);
        setHealthProfile(data.health_profile || {});
      })
      .catch(err => {
        console.error('Failed to fetch clinic updates:', err);
        setClinicVisits([]);
        setHealthProfile({});
      })
      .finally(() => setClinicUpdatesLoading(false));
  }, [selectedChild, activePortalTab]);

  // NEW: Fetch driver updates for dashboard
  useEffect(() => {
    if (activePortalTab !== 'dashboard') return;
    setDriverUpdatesLoading(true);
    getDriverUpdates()
      .then(updates => setDriverUpdates(updates || []))
      .catch(err => {
        console.error('Failed to fetch driver updates:', err);
        setDriverUpdates([]);
      })
      .finally(() => setDriverUpdatesLoading(false));
  }, [activePortalTab]);

  // NEW: Fetch school announcements for dashboard
  useEffect(() => {
    if (activePortalTab !== 'dashboard') return;
    setAnnouncementsLoading(true);
    getSchoolAnnouncements()
      .then(announcements => setSchoolAnnouncementsData(announcements || []))
      .catch(err => {
        console.error('Failed to fetch announcements:', err);
        setSchoolAnnouncementsData([]);
      })
      .finally(() => setAnnouncementsLoading(false));
  }, [activePortalTab]);

  // Fetch financial summary for finance tab
  useEffect(() => {
    if (activePortalTab !== 'finance') return;
    setFinancialLoading(true);
    getFinancialSummary()
      .then(data => setFinancialData(data || []))
      .catch(err => {
        console.error('Failed to fetch financial data:', err);
        setFinancialData([]);
      })
      .finally(() => setFinancialLoading(false));
  }, [activePortalTab]);

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatMessage.trim() || !selectedChild) return;
    try {
      const res = await api.post('/clinic/chat', {
        message: newChatMessage,
        childId: selectedChild.id
      });
      const m = res.data?.data || res.data;
      setChatMessages(prev => [...prev, {
        id: m.id || Date.now().toString(),
        role: 'parent',
        child_id: selectedChild.id,
        text: m.text || m.message,
        timestamp: m.timestamp || 'Just now'
      }]);
      setNewChatMessage('');
    } catch (err: any) {
      console.error('Send failed:', err);
      alert(err.response?.data?.error?.message || 'Failed to send message');
    }
  };

  const handleTabChange = (tab: string) => {
    setSearchParams(buildSearchParams(tab, selectedChild?.id));
    setShowCommBook(false);
  };

  // Filter school announcements, driver notices, etc.
  const schoolAnnouncements = useMemo(() => {
    return notices.filter(a => a.category === 'School');
  }, [notices]);

  const driverNotifications = useMemo(() => {
    return notices.filter(a => a.category === 'Logistics');
  }, [notices]);

  const hasAnnouncements = schoolAnnouncements.length > 0;
  const hasDriverNotifications = driverNotifications.length > 0;
  const showNotices = hasAnnouncements || hasDriverNotifications;

  const clinicPreviews = useMemo(() => {
    const latest: { [key: string]: any } = {};
    allClinicMessages.forEach(m => {
      if (!latest[m.student_name] || new Date(m.timestamp) > new Date(latest[m.student_name].timestamp)) {
        latest[m.student_name] = m;
      }
    });
    return Object.values(latest);
  }, [allClinicMessages]);

  const selectedChildFinancial = useMemo(() => {
    if (!selectedChild) return [];
    return financialData.filter(f => f.student_id === selectedChild.id);
  }, [financialData, selectedChild]);

  const openClinicForChild = (childId: string) => {
    const child = children.find(c => c.id === childId);
    if (child) {
      selectChild(child, 'clinic');
    } else {
      setClinicSupportTab('chat');
      handleTabChange('clinic');
    }
    setClinicSupportTab('chat');
  };

  const renderChildPicker = () => {
    if (children.length <= 1) return null;
    return (
      <div className="flex flex-wrap items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Student:</span>
        {children.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => selectChild(c)}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${selectedChild?.id === c.id
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-blue-400'
              }`}
          >
            {c.fullName}
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-16rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-16">
      {/* Premium Family Dashboard Header Banner (Second Screenshot Design) */}
      <div className="bg-gradient-to-br from-[#0c1424] via-[#0f1b30] to-[#12233f] rounded-[2.5rem] p-4 md:p-6 text-white shadow-2xl relative overflow-hidden border border-white/5">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#13233f] text-blue-400 border border-blue-800/50 text-[9px] font-black uppercase tracking-widest">
              FAMILY DASHBOARD
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-none">
              Hello, {parentName}
            </h2>
            <p className="text-xs md:text-sm max-w-lg leading-relaxed font-medium">
              Central hub for tracking educational milestones and school announcements.
            </p>
          </div>
        </div>
        {/* Subtle decorative blurred circle */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[120px] -mr-48 -mt-48" />
      </div>

      {/* ==================== 1. DASHBOARD TAB ==================== */}
      {activePortalTab === 'dashboard' && (
        <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500">

          {/* Children Grid */}
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <Award className="text-blue-600 dark:text-blue-400" size={20} />
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">My Children</h3>
              </div>
              <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg text-xs font-black text-slate-500 uppercase tracking-widest">
                {children.length} Enrolled
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {children.map((child) => {
                const isSelected = selectedChild?.id === child.id;
                return (
                  <div
                    key={child.id}
                    onClick={() => selectChild(child)}
                    className="group relative cursor-pointer"
                  >
                    <div className={`absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] blur-lg transition duration-500 ${isSelected ? 'opacity-20' : 'opacity-0 group-hover:opacity-10'}`} />
                    <div className={`relative bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border shadow-sm group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-500 ${(
                      isSelected
                        ? 'border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/30'
                        : 'border-slate-100 dark:border-slate-800'
                    )}
                  `}>
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-5">
                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner transition-all duration-500 ${isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-50 dark:bg-slate-850 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white'
                            }`}>
                            {child.fullName.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-xl font-black text-slate-900 dark:text-white mb-1">{child.fullName}</h4>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Grade {child.grade}</p>
                            {isSelected && (
                              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">Currently Selected</p>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            selectChild(child, 'grades');
                          }}
                          className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                          title={`View ${child.fullName}'s grades`}
                        >
                          <ChevronRight size={20} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-5">
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100/50 dark:border-slate-700/50">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Attendance</p>
                          <p className="text-xl font-black text-emerald-600">{child.attendance || '0.0%'}</p>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100/50 dark:border-slate-700/50">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Performance Rank</p>
                          <p className="text-lg font-black text-blue-600 truncate">{child.performance || 'Pending'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dedicated Notice Board & Announcements Section (Replaces Attendance Section) */}
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <Megaphone className="text-blue-600 dark:text-blue-400" size={22} />
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Notice Board & Announcements</h3>
                </div>
                <p className="text-xs text-slate-400 font-bold uppercase mt-1">Official updates from School Administration and the transport team</p>
              </div>

              {/* Premium Tab Filters */}
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/40 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setNoticeFilter('all')}
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${noticeFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                    }`}
                >
                  All ({schoolAnnouncementsData.length + driverUpdates.length})
                </button>
                <button
                  type="button"
                  onClick={() => setNoticeFilter('school')}
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${noticeFilter === 'school'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                    }`}
                >
                  School Admin ({schoolAnnouncementsData.length})
                </button>
                <button
                  type="button"
                  onClick={() => setNoticeFilter('driver')}
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${noticeFilter === 'driver'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                    }`}
                >
                  Driver Logs ({driverUpdates.length})
                </button>
              </div>
            </div>

            {/* Content Feed */}
            {announcementsLoading || driverUpdatesLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* School Announcements List */}
                {noticeFilter !== 'driver' && schoolAnnouncementsData.length > 0 && (
                  <div className="space-y-4">
                    {noticeFilter === 'all' && (
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">School Board Announcements</h4>
                    )}
                    <div className="grid grid-cols-1 gap-4">
                      {schoolAnnouncementsData.map((notice) => (
                        <div
                          key={notice.id}
                          className="group relative bg-slate-50/50 dark:bg-slate-800/20 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-400/30 transition-all duration-300"
                        >
                          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-[9px] font-black uppercase tracking-wider">
                                School Admin
                              </span>
                              <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${notice.priority === 'High'
                                ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30'
                                : 'bg-slate-100 text-slate-650 dark:bg-slate-800 dark:text-slate-400'
                                }`}>
                                {notice.priority} Priority
                              </span>
                            </div>
                            <span className="text-xs text-slate-400 font-bold">
                              📅 {formatEthiopianLabel(notice.timestamp)} at {new Date(notice.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <h4 className="text-lg font-black text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 transition-colors">
                            {notice.title}
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed font-medium">
                            {notice.content}
                          </p>
                          {notice.created_by_name && (
                            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                              <span>Posted by: {notice.created_by_name}</span>
                              <span className="text-[10px] bg-blue-50 dark:bg-blue-950/30 text-blue-500 dark:text-blue-400 px-2 py-0.5 rounded-md">Verified Admin</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Driver Route Updates List */}
                {noticeFilter !== 'school' && driverUpdates.length > 0 && (
                  <div className="space-y-4">
                    {noticeFilter === 'all' && (
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mt-6">Driver Logistics Updates</h4>
                    )}
                    <div className="grid grid-cols-1 gap-4">
                      {driverUpdates.map((update) => (
                        <div
                          key={update.id}
                          className="group relative bg-slate-50/50 dark:bg-slate-800/20 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-400/30 transition-all duration-300"
                        >
                          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-[9px] font-black uppercase tracking-wider">
                                Logistics Notice
                              </span>
                              {update.stations && (
                                <span className="px-2.5 py-1 bg-slate-100 text-slate-650 dark:bg-slate-800 dark:text-slate-400 rounded-full text-[9px] font-black uppercase tracking-wider">
                                  Route: {update.stations}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400 font-bold">
                              📅 {formatEthiopianLabel(update.created_at)} at {new Date(update.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <h4 className="text-lg font-black text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 transition-colors">
                            {update.title}
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed font-medium">
                            {update.content}
                          </p>
                          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                            <span>Driver: {update.driver_name || 'Assigned Driver'}</span>
                            {update.driver_email && (
                              <span className="text-[10px] text-indigo-500 hover:underline cursor-pointer">
                                📧 Contact: {update.driver_email}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {((noticeFilter === 'all' && schoolAnnouncementsData.length === 0 && driverUpdates.length === 0) ||
                  (noticeFilter === 'school' && schoolAnnouncementsData.length === 0) ||
                  (noticeFilter === 'driver' && driverUpdates.length === 0)) && (
                    <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/10 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 space-y-3">
                      <Megaphone className="mx-auto text-slate-300 dark:text-slate-700 animate-pulse" size={36} />
                      <p className="text-sm font-black uppercase tracking-widest text-slate-400">No active notices found</p>
                      <p className="text-xs text-slate-400 italic">There are no updates from {noticeFilter === 'school' ? 'the School Admin' : noticeFilter === 'driver' ? 'the transit driver' : 'either admin or driver'} at this time.</p>
                    </div>
                  )}
              </div>
            )}
          </div>

          {/* Clinic Chat Alerts Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <MessageSquare className="text-rose-600 dark:text-rose-400" size={22} />
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Clinic Chat Alerts</h3>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-6 space-y-6 shadow-sm">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-xl flex items-center justify-center text-rose-600 shadow-inner">
                  <HeartPulse size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">Clinic Administrator</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Health & Medical Reviews</p>
                </div>
              </div>

              <div className="space-y-4">
                {clinicPreviews.length > 0 ? (
                  clinicPreviews.map((m, idx) => (
                    <div
                      key={idx}
                      onClick={() => openClinicForChild(m.child_id)}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 hover:bg-rose-50/30 dark:hover:bg-rose-900/10 border border-slate-100 dark:border-slate-800 cursor-pointer transition-all space-y-2 group"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase">
                          {m.student_name}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400">{m.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-350 font-medium truncate group-hover:text-slate-800 dark:group-hover:text-white">
                        {m.role === 'clinic' ? 'Admin: ' : 'You: '}{m.text}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-400 text-xs font-bold uppercase">
                    No recent clinic messages.
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setClinicSupportTab('chat');
                  handleTabChange('clinic');
                }}
                className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-md shadow-rose-600/10 flex items-center justify-center gap-2"
              >
                <HeartPulse size={16} />
                Open Clinic Support
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 2. GRADES & COURSES TAB ==================== */}
      {activePortalTab === 'grades' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {selectedChild ? (
            <div className="space-y-8">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 md:p-6 shadow-lg">
                {children.length > 1 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select Student:</span>
                      {children.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => selectChild(c)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${selectedChild?.id === c.id ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                        >
                          {c.fullName}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-2">Academic Year</label>
                    <select
                      title="Academic Year"
                      value={selectedYear}
                      onChange={(e) => { setSelectedYear(e.target.value); setSelectedCourse(null); }}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold outline-none"
                    >
                      {academicYears.map((year) => (
                        <option key={year} value={year}>{gregorianToECYear(year)} E.C. ({year})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-2">Semester</label>
                    <select
                      title="Semester"
                      value={selectedSemester}
                      onChange={(e) => { setSelectedSemester(e.target.value); setSelectedCourse(null); }}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold outline-none"
                    >
                      <option>First Semester</option>
                      <option>Second Semester</option>
                    </select>
                  </div>

                  <div className="relative">
                    <label className="block text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-2">Course</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="text"
                        placeholder="Select Course"
                        value={courseSearchQuery}
                        onChange={(e) => { setCourseSearchQuery(e.target.value); setDropdownOpen(true); }}
                        onFocus={() => setDropdownOpen(true)}
                        onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold outline-none"
                      />
                    </div>

                    {dropdownOpen && (
                      <div className="absolute z-50 left-0 right-0 mt-1 max-h-[220px] overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-1.5">
                        {filteredCourses.length > 0 ? (
                          filteredCourses.map((c) => (
                            <button
                              key={c.id || c.name}
                              type="button"
                              onMouseDown={() => { setSelectedCourse(c); setCourseSearchQuery(c.name); setDropdownOpen(false); }}
                              className={`w-full text-left px-4 py-3 rounded-xl ${selectedCourse?.name === c.name ? 'bg-blue-600 text-white' : 'text-slate-700 dark:text-slate-200'}`}
                            >
                              <div className="text-sm font-bold">{c.name}</div>
                              <div className="text-xs opacity-75">{c.code}</div>
                            </button>
                          ))
                        ) : (
                          <div className="text-xs text-slate-500 text-center py-4">No courses found</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Grading area: only visible after a course is selected */}
              {selectedCourse ? (
                <div className="bg-slate-950/95 dark:bg-slate-950/95 rounded-[2rem] overflow-hidden shadow-lg border border-slate-800">
                  {gradingMethods.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-sm text-slate-200" style={{ minWidth: `${200 + gradingMethods.length * 140}px` }}>
                        <tbody>
                          <tr className="border-b border-slate-800">
                            <th className="px-6 py-4 text-left font-black uppercase tracking-widest text-slate-400">Assessment Component</th>
                            {gradingMethods.map((method) => (
                              <th key={method.id} className="min-w-[140px] px-6 py-4 text-left font-black uppercase tracking-widest text-slate-300">
                                {method.label}
                                <span className="block text-[10px] text-slate-500 font-bold mt-0.5">({method.maxWeight}%)</span>
                              </th>
                            ))}
                            <th className="min-w-[140px] px-6 py-4 text-right font-black uppercase tracking-widest text-slate-300">
                              Total
                              <span className="block text-[10px] text-slate-500 font-bold mt-0.5">(100%)</span>
                            </th>
                          </tr>
                          <tr>
                            <td className="px-6 py-4 text-left font-black uppercase tracking-widest text-slate-400">Student Score</td>
                            {gradingMethods.map((method) => {
                              const gradeVal = selectedCourse.grades?.[method.id];
                              return (
                                <td key={method.id} className="px-6 py-4 text-left font-bold text-slate-100 text-lg">
                                  {gradeVal !== null && gradeVal !== undefined ? Number(gradeVal).toFixed(1) : '--'}
                                </td>
                              );
                            })}
                            <td className="px-6 py-4 text-right font-black text-emerald-400 text-xl">
                              {selectedCourse.total !== null && selectedCourse.total !== undefined ? Number(selectedCourse.total).toFixed(1) : '--'}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-b border-slate-800">
                        <div className="p-4 border-r border-slate-800"><div className="text-xs font-bold uppercase text-slate-400">Quiz</div><div className="text-lg font-black text-slate-300 mt-1">10%</div></div>
                        <div className="p-4 border-r border-slate-800"><div className="text-xs font-bold uppercase text-slate-400">Test</div><div className="text-lg font-black text-slate-300 mt-1">10%</div></div>
                        <div className="p-4 border-r border-slate-800"><div className="text-xs font-bold uppercase text-slate-400">Midterm</div><div className="text-lg font-black text-slate-300 mt-1">30%</div></div>
                        <div className="p-4"><div className="text-xs font-bold uppercase text-slate-400">Final</div><div className="text-lg font-black text-slate-300 mt-1">50%</div></div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-b border-slate-800">
                        <div className="p-4 border-r border-slate-800"><div className="text-3xl font-black text-slate-100">{selectedCourse.quiz_10 ?? '--'}</div></div>
                        <div className="p-4 border-r border-slate-800"><div className="text-3xl font-black text-slate-100">{selectedCourse.assignment_10 ?? '--'}</div></div>
                        <div className="p-4 border-r border-slate-800"><div className="text-3xl font-black text-slate-100">{selectedCourse.mid_30 ?? '--'}</div></div>
                        <div className="p-4"><div className="text-3xl font-black text-slate-100">{selectedCourse.final_50 ?? '--'}</div></div>
                      </div>
                    </>
                  )}

                  <div className="bg-slate-900/50 p-6 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Academic Standing</p>
                        <div className="mt-2 flex items-center gap-3">
                          <span className="text-sm font-bold text-slate-200">Course Status:</span>
                          {(() => {
                            const status = getStatus(selectedCourse);
                            if (status === 'PASSED') return <span className="px-3 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-full text-xs font-black">PASSED</span>;
                            if (status === 'FAILED') return <span className="px-3 py-1 bg-rose-500/10 text-rose-300 border border-rose-500/20 rounded-full text-xs font-black">FAILED</span>;
                            return <span className="px-3 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-full text-xs font-black">PENDING</span>;
                          })()}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-3xl md:text-4xl font-black text-white">{selectedCourse.total ?? '--'}</div>
                        <div className="text-sm text-slate-400">/ 100</div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex justify-between text-xs font-black uppercase text-slate-400"><span>Total Score Progress</span><span>{getSubmittedTotal(selectedCourse) !== null ? Math.round(Number(getSubmittedTotal(selectedCourse))) + '%' : 'Pending'}</span></div>
                      <div className="w-full mt-2">
                        <progress
                          className="w-full h-3 rounded-full appearance-none bg-slate-800 accent-emerald-400"
                          value={Math.round(getClampedPercentage(selectedCourse.total))}
                          max={100}
                          title="Total score progress"
                          aria-label="Total score progress"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 text-center text-slate-500">Select Course to view grading components.</div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl text-center text-slate-500 text-sm border border-slate-100 dark:border-slate-800 animate-pulse">Please link a child student account to verify academic courses and progress.</div>
          )}
        </div>
      )}

      {/* ==================== 3. ACADEMIC HISTORY TAB (Summary Only) ==================== */}
      {activePortalTab === 'history' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">Academic History</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium italic">
              Historical summary of completed courses and final results by year and semester.
            </p>
          </div>

          {renderChildPicker()}

          {selectedChild ? (
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-8 shadow-lg">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
                  <GraduationCap size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Historical Records</h3>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">Final course results archive</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-3">Academic Year</label>
                  <select
                    title="Select Academic Year"
                    value={historyYear || ''}
                    onChange={(e) => {
                      setHistoryYear(e.target.value || null);
                      setHistoryData(null);
                    }}
                    className="w-full appearance-none px-6 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all cursor-pointer text-slate-900 dark:text-white"
                  >
                    <option value="">-- Select Year --</option>
                    {academicYears.map((year) => (
                      <option key={year} value={year}>
                        {gregorianToECYear(year)} E.C. ({year})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-3">Semester</label>
                  <select
                    title="Select Semester"
                    value={historySemester || ''}
                    onChange={(e) => {
                      setHistorySemester(e.target.value || null);
                      setHistoryData(null);
                    }}
                    disabled={!historyYear}
                    className="w-full appearance-none px-6 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 dark:text-white"
                  >
                    <option value="">-- Select Semester --</option>
                    <option>First Semester</option>
                    <option>Second Semester</option>
                  </select>
                </div>
              </div>

              {historyYear && historySemester && historyData && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Academic Year</p>
                    <p className="text-xl font-black text-slate-800 dark:text-white">{historyYear}</p>
                  </div>
                  <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Semester</p>
                    <p className="text-xl font-black text-slate-800 dark:text-white">{historySemester}</p>
                  </div>
                  <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Semester Average</p>
                    <p className="text-xl font-black text-slate-800 dark:text-white">
                      {typeof semesterAverage === 'number' ? `${semesterAverage}%` : semesterAverage}
                    </p>
                  </div>
                </div>
              )}

              {historyLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : historyData && historyData.courses && historyData.courses.length > 0 ? (
                <div className="overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                      <tr>
                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Course</th>
                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Code</th>
                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Final Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {historyData.courses.map((course: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-8 py-5 font-bold text-slate-800 dark:text-white">{course.name}</td>
                          <td className="px-8 py-5 text-slate-500 dark:text-slate-400 text-sm">{course.code || '—'}</td>
                          <td className="px-8 py-5 text-right">
                            <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-black ${course.score_display === 'Pending' || course.score === null
                              ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                              : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                              }`}>
                              {course.score_display || (course.score !== null ? `${course.score}%` : 'Pending')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : historyYear && historySemester ? (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/10 rounded-2xl border border-dashed">
                  <p className="font-medium">No courses found for the selected academic year and semester.</p>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/10 rounded-2xl border border-dashed">
                  <p className="font-medium">Select an academic year and semester to view historical results.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl text-center text-slate-500 text-sm border border-slate-100 dark:border-slate-800">
              Select a child to view academic history.
            </div>
          )}
        </div>
      )}
      {/* ==================== 4. TEACHERS TAB ==================== */}
      {activePortalTab === 'teachers' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white">Your Child's Teachers</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium italic">Teaching staff assigned to your child's courses.</p>
            </div>
          </div>

          {/* Child Picker */}
          {renderChildPicker()}

          {/* Teachers Grid */}
          {teachersLoading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : childTeachers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {childTeachers.map((teacher) => (
                <div key={teacher.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-500">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">
                      {teacher.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">{teacher.name}</h3>
                      <p className="text-xs font-bold text-blue-600 dark:text-blue-400">{teacher.email}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {teacher.subjects && teacher.subjects.length > 0 && (
                      <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Subjects</p>
                        <div className="flex flex-wrap gap-2">
                          {teacher.subjects.map((subject, idx) => (
                            <span key={idx} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold">
                              {subject}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {teacher.courses && teacher.courses.length > 0 && (
                      <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Courses</p>
                        <div className="flex flex-wrap gap-2">
                          {teacher.courses.map((course, idx) => (
                            <span key={idx} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs font-bold">
                              {course}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all">
                    Send Message
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 p-12 rounded-[2rem] border border-slate-100 dark:border-slate-800 text-center">
              <Users className="text-slate-300 mx-auto mb-4" size={40} />
              <p className="text-slate-500 dark:text-slate-400 font-bold text-lg">No teachers assigned yet.</p>
              <p className="text-slate-400 text-sm mt-2">Teachers will appear once courses are assigned.</p>
            </div>
          )}
        </div>
      )}

      {/* ==================== 5. ATTENDANCE TAB ==================== */}
      {activePortalTab === 'attendance' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white">Attendance Records</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium italic">Track your child's daily attendance and summary statistics.</p>
            </div>
          </div>

          {/* Child Picker */}
          {renderChildPicker()}

          {/* Attendance Stats */}
          {attendanceLoading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : attendanceStats && Object.keys(attendanceStats).length > 0 ? (
            <div className="space-y-6">
              {/* Statistics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Total Days</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-white">{attendanceStats.total_days || 0}</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-center">
                  <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">Present</p>
                  <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{attendanceStats.present_days || 0}</p>
                </div>
                <div className="bg-rose-50 dark:bg-rose-900/20 p-6 rounded-2xl border border-rose-200 dark:border-rose-800 text-center">
                  <p className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-2">Absent</p>
                  <p className="text-3xl font-black text-rose-600 dark:text-rose-400">{attendanceStats.absent_days || 0}</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-2xl border border-amber-200 dark:border-amber-800 text-center">
                  <p className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-2">Late</p>
                  <p className="text-3xl font-black text-amber-600 dark:text-amber-400">{attendanceStats.late_days || 0}</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-200 dark:border-blue-800 text-center">
                  <p className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">Percentage</p>
                  <p className="text-3xl font-black text-blue-600 dark:text-blue-400">{(attendanceStats.attendance_percentage || 0).toFixed(1)}%</p>
                </div>
              </div>

              {/* Attendance Progress Bar */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Overall Attendance</h3>
                  <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{(attendanceStats.attendance_percentage || 0).toFixed(1)}%</span>
                </div>
                <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <svg viewBox="0 0 100 10" className="w-full h-full">
                    <rect
                      x="0"
                      y="0"
                      width={getClampedPercentage(attendanceStats?.attendance_percentage || 0)}
                      height="10"
                      rx="5"
                      ry="5"
                      fill="currentColor"
                      className="transition-all duration-1000 text-blue-500"
                    />
                  </svg>
                </div>
              </div>

              {/* Recent Records Table */}
              <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Recent Records</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Date</th>
                        <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Recorded By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {attendanceRecords.slice(0, 10).map((record) => (
                        <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-8 py-5 font-bold text-slate-900 dark:text-white">{formatEthiopianLabel(record.date)}</td>
                          <td className="px-8 py-5">
                            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${record.status === 'present'
                              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                              : record.status === 'absent'
                                ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'
                                : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                              }`}>
                              {record.status}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-slate-600 dark:text-slate-400">{record.recorded_by_name || 'Admin'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 p-12 rounded-[2rem] border border-slate-100 dark:border-slate-800 text-center">
              <Calendar className="text-slate-300 mx-auto mb-4" size={40} />
              <p className="text-slate-500 dark:text-slate-400 font-bold text-lg">No attendance records found.</p>
            </div>
          )}
        </div>
      )}

      {activePortalTab === 'finance' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white">Fees & Financial Summary</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium italic">
                Track fees, payments, and financial status for {selectedChild?.fullName || 'your selected child'}.
              </p>
            </div>
          </div>

          {renderChildPicker()}

          {financialLoading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : selectedChildFinancial.length > 0 ? (
            <div className="space-y-6">
              {selectedChildFinancial.map((financial) => (
                <div key={financial.student_id} className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6 mb-8">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{financial.student_name}</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Student ID: {financial.student_id}</p>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider whitespace-nowrap ${financial.fee_status === 'paid'
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                      : financial.fee_status === 'pending'
                        ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                        : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'
                      }`}>
                      {financial.fee_status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Monthly Fee</p>
                      <p className="text-2xl font-black text-slate-900 dark:text-white">₦{financial.monthly_fee}</p>
                    </div>
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Bus Fee</p>
                      <p className="text-2xl font-black text-slate-900 dark:text-white">₦{financial.bus_fee}</p>
                    </div>
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Penalty</p>
                      <p className="text-2xl font-black text-slate-900 dark:text-white">₦{financial.penalty_fee}</p>
                    </div>
                    <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800">
                      <p className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">Total Fees</p>
                      <p className="text-2xl font-black text-blue-600 dark:text-blue-400">₦{financial.total_fees}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                      <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">Amount Paid</p>
                      <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">₦{financial.total_transactions}</p>
                    </div>
                    <div className="p-6 bg-rose-50 dark:bg-rose-900/10 rounded-2xl border border-rose-100 dark:border-rose-800">
                      <p className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-2">Balance Due</p>
                      <p className="text-2xl font-black text-rose-600 dark:text-rose-400">₦{financial.balance_due}</p>
                    </div>
                  </div>

                  {financial.fee_notes && (
                    <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Notes</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{financial.fee_notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 p-12 rounded-[2rem] border border-slate-100 dark:border-slate-800 text-center">
              <DollarSign className="text-slate-300 mx-auto mb-4" size={40} />
              <p className="text-slate-500 dark:text-slate-400 font-bold text-lg">
                {selectedChild ? 'No financial data available for this child.' : 'Select a child to view financial information.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ==================== 9. CLINIC SUPPORT TAB ==================== */}
      {activePortalTab === 'clinic' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col min-h-[calc(100vh-16rem)]">
            {/* Header with Tab Toggles */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center text-rose-600 shadow-inner">
                    <HeartPulse size={24} />
                  </div>
                  <div>
                    <h2 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">Clinic Support</h2>
                    <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      Direct Private Channel
                    </p>
                  </div>
                </div>

                {/* Clinic Support Sub-Tabs */}
                <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setClinicSupportTab('visits')}
                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${clinicSupportTab === 'visits'
                      ? 'bg-white dark:bg-slate-700 text-rose-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                  >
                    Clinic Visits
                  </button>
                  <button
                    onClick={() => setClinicSupportTab('chat')}
                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${clinicSupportTab === 'chat'
                      ? 'bg-white dark:bg-slate-700 text-rose-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                  >
                    Chat
                  </button>
                </div>

                {/* Select Child Section */}
                <div className="flex flex-col items-start md:items-end">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Select Child</span>
                  <div className="flex flex-wrap gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    {children.length === 0 ? (
                      <div className="px-4 py-1.5 text-xs text-slate-400">No children found</div>
                    ) : (
                      children.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => selectChild(c, 'clinic')}
                          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedChild?.id === c.id
                            ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                          {c.fullName.split(' ')[0]}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Private & Encrypted Column */}
                <div className="hidden xl:flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Private & Encrypted</span>
                </div>
              </div>
            </div>

            {/* Main Clinic Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar min-h-[350px]">
              {/* Active Child Label */}
              {selectedChild && (
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Viewing records for:</span>
                  <span className="px-3 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {selectedChild.fullName}
                  </span>
                </div>
              )}
              {clinicSupportTab === 'visits' ? (
                clinicUpdatesLoading ? (
                  <div className="flex justify-center items-center h-48">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
                  </div>
                ) : clinicVisits.length === 0 ? (
                  <div className="text-center py-20 text-slate-400 space-y-3">
                    <HeartPulse size={36} className="mx-auto text-slate-300 animate-pulse" />
                    <p className="text-xs font-bold uppercase tracking-widest">No clinic visits recorded yet for {selectedChild?.fullName || 'this child'}.</p>
                    <p className="text-[10px] opacity-75">Clinic visit records and health profile updates will appear here when available.</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {healthProfile && Object.keys(healthProfile).length > 0 && (
                      <div className="bg-slate-50 dark:bg-slate-900/80 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-5">Health Profile</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {healthProfile.blood_group && (
                            <div className="p-4 bg-rose-50 dark:bg-rose-900/10 rounded-2xl border border-rose-100 dark:border-rose-800">
                              <p className="text-xs font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 mb-2">Blood Group</p>
                              <p className="text-lg font-black text-rose-600 dark:text-rose-400">{healthProfile.blood_group}</p>
                            </div>
                          )}
                          {healthProfile.dob && (
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800">
                              <p className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-2">Date of Birth</p>
                              <p className="text-lg font-black text-blue-600 dark:text-blue-400">{formatEthiopianLabel(healthProfile.dob)}</p>
                            </div>
                          )}
                          {healthProfile.gender && (
                            <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-800">
                              <p className="text-xs font-black uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-2">Gender</p>
                              <p className="text-lg font-black text-purple-600 dark:text-purple-400">{healthProfile.gender}</p>
                            </div>
                          )}
                          {healthProfile.allergies && (
                            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-800">
                              <p className="text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-2">Allergies</p>
                              <p className="text-sm font-black text-amber-600 dark:text-amber-400">{healthProfile.allergies}</p>
                            </div>
                          )}
                          {healthProfile.medications && (
                            <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-2xl border border-green-100 dark:border-green-800">
                              <p className="text-xs font-black uppercase tracking-widest text-green-600 dark:text-green-400 mb-2">Medications</p>
                              <p className="text-sm font-black text-green-600 dark:text-green-400">{healthProfile.medications}</p>
                            </div>
                          )}
                          {healthProfile.chronic_conditions && (
                            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                              <p className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">Chronic Conditions</p>
                              <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">{healthProfile.chronic_conditions}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      {clinicVisits.map((visit) => (
                        <div key={visit.id} className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                          <div className="flex flex-col md:flex-row md:justify-between gap-4 mb-4">
                            <div>
                              <h4 className="text-lg font-black text-slate-900 dark:text-white mb-1">{visit.reason}</h4>
                              <p className="text-sm text-slate-600 dark:text-slate-400">{visit.treatment}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider whitespace-nowrap ${visit.status === 'completed'
                              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                              : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                              }`}>
                              {visit.status}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-6 text-xs font-bold text-slate-500 dark:text-slate-400">
                            <span>📅 {formatEthiopianLabel(visit.date)}</span>
                            <span>⏰ {visit.time}</span>
                            <span>👤 {visit.logged_by_name || 'Clinic Admin'}</span>
                            {visit.parent_notified && <span className="text-emerald-600">✓ Parent Notified</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ) : (
                chatLoading ? (
                  <div className="flex justify-center items-center h-48">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
                  </div>
                ) : chatMessages.length === 0 ? (
                  <div className="text-center py-20 text-slate-400 space-y-3">
                    <HeartPulse size={36} className="mx-auto text-slate-300 animate-pulse" />
                    <p className="text-xs font-bold uppercase tracking-widest">No clinic reports or messages logged yet for this child.</p>
                    <p className="text-[10px] opacity-75">Send a message below to start a chat with the clinic administration.</p>
                  </div>
                ) : (
                  chatMessages.map((m) => (
                    <div key={m.id} className={`flex items-start gap-3 ${m.role === 'parent' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm ${m.role === 'parent' ? 'bg-blue-600 text-white' : 'bg-rose-600 text-white'
                        }`}>
                        {m.role === 'parent' ? <User size={14} /> : <HeartPulse size={14} />}
                      </div>
                      <div className={`max-w-[75%] space-y-1 ${m.role === 'parent' ? 'text-right' : ''}`}>
                        <div className={`p-4 rounded-2xl text-sm font-medium shadow-sm leading-relaxed ${m.role === 'parent'
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none'
                          }`}>
                          {m.text}
                        </div>
                        <div className="flex items-center gap-2 justify-end px-1">
                          <span className="text-[9px] text-slate-400 font-bold uppercase">{m.timestamp}</span>
                          {m.role === 'parent' && (
                            <Check size={10} className="text-emerald-400" strokeWidth={3} />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )
              )}
              <div ref={chatEndRef} />
            </div>

            {clinicSupportTab === 'chat' && (
              <div className="p-6 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
                <form onSubmit={handleSendChatMessage} className="flex gap-4">
                  <input
                    type="text"
                    value={newChatMessage}
                    onChange={(e) => setNewChatMessage(e.target.value)}
                    placeholder="Type a health request or update for the clinic admin..."
                    className="flex-1 px-6 py-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-medium outline-none focus:border-rose-500 transition-all shadow-sm"
                  />
                  <button
                    type="submit"
                    className="bg-rose-600 hover:bg-rose-700 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-rose-200 dark:shadow-none group shrink-0"
                  >
                    <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    <span className="hidden sm:inline">Send Message</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== 10. COMMUNICATION BOOK TAB ==================== */}
      {activePortalTab === 'communication-book' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white">Weekly Communication Book</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium italic">Weekly evaluations and behavior metrics logged by your child's homeroom teacher.</p>
            </div>
          </div>

          {/* Child Picker */}
          {renderChildPicker()}

          {commLoading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (() => {
            // Find the latest communication log that is still active (not expired)
            const activeLog = commLogs.find(log => isLogActive(log.week_ending));
            
            if (!selectedChild) {
              return (
                <div className="bg-white dark:bg-slate-900 p-12 rounded-[2rem] border border-slate-100 dark:border-slate-800 text-center">
                  <ClipboardList className="text-slate-300 mx-auto mb-4" size={40} />
                  <p className="text-slate-500 dark:text-slate-400 font-bold text-lg">Select a child to view the communication book.</p>
                </div>
              );
            }

            if (!activeLog) {
              return (
                <div className="bg-white dark:bg-slate-900 p-12 rounded-[2rem] border border-slate-100 dark:border-slate-800 text-center">
                  <ClipboardList className="text-slate-350 dark:text-slate-700 mx-auto mb-4" size={48} />
                  <p className="text-slate-500 dark:text-slate-400 font-bold text-lg uppercase tracking-tight">No active evaluation card</p>
                  <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">
                    There are no current evaluations or they have automatically expired. The homeroom teacher will post a fresh evaluation for the upcoming week soon.
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-8 animate-in fade-in duration-500">
                {/* Active Evaluation Banner */}
                <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-[2rem] p-6 border border-blue-500/20 dark:border-blue-500/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md">
                      <Star size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Active Evaluation Window</p>
                      <h3 className="text-lg font-black text-slate-800 dark:text-white mt-0.5">
                        Week ending: {formatEthiopianLabel(activeLog.week_ending)} ({activeLog.week_ending_formatted || activeLog.week_ending})
                      </h3>
                    </div>
                  </div>
                  {activeLog.teacher_name && (
                    <span className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm">
                      👤 Teacher: {activeLog.teacher_name}
                    </span>
                  )}
                </div>

                {/* Grid of Ratings */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {commFields.map((field) => {
                    const rating = getFieldRating(activeLog, field.id);
                    return (
                      <div key={field.id} className="group bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <div className="flex flex-col items-center text-center">
                          <div className={`w-14 h-14 rounded-2xl ${getRatingColor(rating)} flex items-center justify-center text-white font-black text-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                            {rating}
                          </div>
                          <h4 className="font-black text-slate-800 dark:text-slate-100 text-sm mb-1">{field.label}</h4>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold leading-tight mb-4 min-h-[30px] flex items-center justify-center px-2">
                            {field.description}
                          </p>
                          <span className={`w-full py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${getRatingColor(rating)} text-white shadow-sm`}>
                            {ratingLabels[rating] || 'Unrated'}
                          </span>
                          
                          {/* Visual Dots Indicator */}
                          <div className="flex gap-1.5 mt-4 justify-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                  star <= rating
                                    ? rating === 5
                                      ? 'bg-emerald-500 shadow-md shadow-emerald-500/20'
                                      : rating === 4
                                        ? 'bg-teal-500 shadow-md shadow-teal-500/20'
                                        : rating === 3
                                          ? 'bg-blue-500 shadow-md shadow-blue-500/20'
                                          : rating === 2
                                            ? 'bg-amber-500 shadow-md shadow-amber-500/20'
                                            : 'bg-orange-500 shadow-md shadow-orange-500/20'
                                    : 'bg-slate-200 dark:bg-slate-800'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Teacher Notes section */}
                <div className="bg-slate-50 dark:bg-slate-900/60 p-8 rounded-[2rem] border border-slate-150/40 dark:border-slate-800 relative overflow-hidden group">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <ClipboardList size={16} />
                    Teacher's Observations & Remarks
                  </h4>
                  <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed italic font-medium relative z-10">
                    "{activeLog.teacher_note || "No specific note or remarks logged by the teacher for this week. Keep up the consistent work!"}"
                  </p>
                  <Star size={100} className="absolute -bottom-10 -right-10 text-slate-400/5 dark:text-slate-800/10 rotate-12 group-hover:scale-110 transition-transform duration-700" />
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

// Helper function to check if a communication log is still active (visible until Thursday evening)
const getWeekEndingThursday = (): string => {
  const today = new Date();
  const day = today.getDay();
  let diff = 4 - day;
  if (diff < 0) {
    diff += 7;
  }
  const thursday = new Date(today);
  thursday.setDate(today.getDate() + diff);
  const yyyy = thursday.getFullYear();
  const mm = String(thursday.getMonth() + 1).padStart(2, '0');
  const dd = String(thursday.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const isLogActive = (weekEndingStr: string): boolean => {
  if (!weekEndingStr) return false;
  // Compare only the date portion (YYYY-MM-DD) to handle both date and timestamp formats
  return String(weekEndingStr).slice(0, 10) === getWeekEndingThursday();
};
