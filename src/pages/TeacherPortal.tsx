import { BookOpen, Users, Calendar, ArrowRight, ClipboardList, FileText, Plus, X, CheckCircle2, XCircle, Loader2, Star, Save } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { 
  getTeacherDashboard, 
  getMyWeeklyPlans, 
  submitWeeklyPlan, 
  updateWeeklyPlan,
  getMyClasses,
  getDepartmentHeads,
  getDeptPlans,
  reviewDeptPlan
} from '../services/teacherService';
import {
  getTeacherExams,
  saveTeacherExam,
  updateTeacherExam,
  publishTeacherExam,
  deleteTeacherExam,
  getGradesForExams,
  getCoursesByGradeForExams,
  getTeacherCoursesForExams
} from '../services/examService';

export const TeacherPortal = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'overview' | 'plans' | 'exams' | 'dept-tasks'>('overview');
  const [dashboard, setDashboard] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  // Exams states
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [draftExams, setDraftExams] = useState<any[]>([]);
  const [publishedExams, setPublishedExams] = useState<any[]>([]);
  const [editingExam, setEditingExam] = useState<any>(null);
  const [examForm, setExamForm] = useState({
    title: '',
    examType: 'Mid Exam',
    totalMarks: 100,
    duration: 60,
    instructions: '',
    selectedClass: '',
    selectedSection: '',
    gradeId: '',
    subjectId: '',
    examPassword: '',
    isLocked: false,
    passwordRequired: false,
    questions: [] as any[],
  });

  // Grade and Subject selection states
  const [gradesForExam, setGradesForExam] = useState<any[]>([]);
  const [coursesForGrade, setCoursesForGrade] = useState<any[]>([]);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Department Tasks states
  const [deptSearch, setDeptSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [reviewingPlanId, setReviewingPlanId] = useState<string | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [deptPlans, setDeptPlans] = useState<any[]>([]);

  const filteredDeptPlans = deptPlans.filter(plan => {
    const teacherName = plan.teacher_name || plan.teacherName || '';
    const subject = plan.subject || '';
    const matchesSearch = teacherName.toLowerCase().includes(deptSearch.toLowerCase()) || subject.toLowerCase().includes(deptSearch.toLowerCase());
    const matchesFilter = deptFilter === 'All' || plan.status === deptFilter;
    return matchesSearch && matchesFilter;
  });

  const handleApproveDeptPlan = async (id: string) => {
    try {
      const plan = deptPlans.find(p => p.id === id);
      const rating = plan?.rating || plan?.dean_rating || 0;
      await reviewDeptPlan(id, { status: 'Approved', feedback: 'Approved by Department Head', rating });
      showToast('Plan approved successfully!', 'success');
      const dPlans = await getDeptPlans();
      setDeptPlans(Array.isArray(dPlans) ? dPlans : []);
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to approve plan', 'error');
    }
  };

  const handleRejectDeptPlan = async () => {
    if (!reviewingPlanId) return;
    try {
      const plan = deptPlans.find(p => p.id === reviewingPlanId);
      const rating = plan?.rating || plan?.dean_rating || 0;
      await reviewDeptPlan(reviewingPlanId, { status: 'Revision Required', feedback: reviewFeedback, rating });
      showToast('Revision request submitted!', 'success');
      setReviewingPlanId(null);
      setReviewFeedback('');
      const dPlans = await getDeptPlans();
      setDeptPlans(Array.isArray(dPlans) ? dPlans : []);
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to submit revision request', 'error');
    }
  };

  const emptyPlan = {
    date: new Date().toISOString().split('T')[0],
    content: '', objectives: '', teacherActivity: '',
    timeDuration: '', studentActivity: '', teachingMethod: '',
    teachingAids: '', evaluation: '', remark: '', status: 'Pending' as 'Pending' | 'Draft',
    courseId: '', subject: '', deptHeadId: '', weekNumber: 1
  };
  const [planForm, setPlanForm] = useState(emptyPlan);
  const location = useLocation();

  // Classes and department heads
  const [myClasses, setMyClasses] = useState<any[]>([]);
  const [deptHeads, setDeptHeads] = useState<any[]>([]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // Load grades for exam creation
  const loadGradesForExam = async () => {
    try {
      setLoadingGrades(true);
      const grades = await getGradesForExams();
      setGradesForExam(Array.isArray(grades) ? grades : []);
    } catch (error) {
      console.error('Error loading grades:', error);
    } finally {
      setLoadingGrades(false);
    }
  };

  // Load courses for selected grade
  const loadCoursesForGrade = async (gradeId: string) => {
    try {
      setLoadingCourses(true);
      const courses = await getCoursesByGradeForExams(gradeId);
      setCoursesForGrade(Array.isArray(courses) ? courses : []);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoadingCourses(false);
    }
  };

  // Handle grade selection change
  const handleGradeChange = (gradeId: string) => {
    setExamForm({ ...examForm, gradeId, subjectId: '' });
    if (gradeId) {
      loadCoursesForGrade(gradeId);
    } else {
      setCoursesForGrade([]);
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [dash, planList, classList, examsData] = await Promise.all([
        getTeacherDashboard(),
        getMyWeeklyPlans(),
        getMyClasses(),
        getTeacherExams()
      ]);
      setDashboard(dash);
      setPlans(Array.isArray(planList) ? planList : []);
      setMyClasses(Array.isArray(classList) ? classList : []);
      
      // Load exams from backend
      if (examsData) {
        setDraftExams(Array.isArray(examsData.draftExams) ? examsData.draftExams : []);
        setPublishedExams(Array.isArray(examsData.publishedExams) ? examsData.publishedExams : []);
      }
      
      const deptHeadsList = await getDepartmentHeads();
      setDeptHeads(Array.isArray(deptHeadsList) ? deptHeadsList : []);

      if (dash?.teacherInfo?.is_dean) {
        const dPlans = await getDeptPlans();
        setDeptPlans(Array.isArray(dPlans) ? dPlans : []);
      }
    } catch (err) {
      console.error('Teacher portal error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchAll();
    loadGradesForExam(); 
  }, []);

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab');
    if (tab === 'plans') {
      setActiveTab('plans');
    } else if (tab === 'dept-tasks') {
      setActiveTab('dept-tasks');
    } else {
      setActiveTab('overview');
    }
  }, [location.search]);

  const handleSubmitPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingPlan) {
        await updateWeeklyPlan(editingPlan.id, planForm);
        showToast('Lesson plan updated successfully!', 'success');
      } else {
        await submitWeeklyPlan(planForm);
        showToast('Lesson plan submitted successfully!', 'success');
      }
      setIsPlanModalOpen(false);
      setEditingPlan(null);
      setPlanForm(emptyPlan);
      const planList = await getMyWeeklyPlans();
      setPlans(Array.isArray(planList) ? planList : []);
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to submit plan', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (plan: any) => {
    setEditingPlan(plan);
    setPlanForm({
      date: plan.date?.slice(0, 10) || '',
      content: plan.content || '',
      objectives: plan.objectives || '',
      teacherActivity: plan.teacher_activity || plan.teacherActivity || '',
      timeDuration: plan.time_duration || plan.timeDuration || '',
      studentActivity: plan.student_activity || plan.studentActivity || '',
      teachingMethod: plan.teaching_method || plan.teachingMethod || '',
      teachingAids: plan.teaching_aids || plan.teachingAids || '',
      evaluation: plan.evaluation || '',
      remark: plan.remark || '',
      status: plan.status || 'Pending',
      courseId: plan.course_id || plan.courseId || '',
      subject: plan.subject || '',
      deptHeadId: plan.dept_head_id || plan.deptHeadId || '',
      weekNumber: plan.week_number || plan.weekNumber || 1
    });
    setIsPlanModalOpen(true);
  };

  const todaySchedule = dashboard?.todaySchedule || [];
  const pendingPlans = plans.filter(p => p.status === 'Pending').length;
  const isDean = dashboard?.teacherInfo?.is_dean === true;

  // Exam Handlers
  const handlePublishExam = async (examId: string) => {
    const exam = draftExams.find(e => e.id === examId);
    if (!exam) return;
    
    if (!exam.selectedClass || !exam.selectedSection) {
      setToast({ show: true, type: 'error', message: 'Please select class and section before publishing' });
      return;
    }

    try {
      setSubmitting(true);
      // Update exam with class and section info before publishing
      if (exam.selectedClass !== exam.class_id) {
        await updateTeacherExam(examId, {
          ...exam,
          classId: exam.selectedClass
        });
      }
      
      await publishTeacherExam(examId);
      showToast('Exam published successfully!', 'success');
      
      // Refresh exams from backend
      const examsData = await getTeacherExams();
      setDraftExams(Array.isArray(examsData.draftExams) ? examsData.draftExams : []);
      setPublishedExams(Array.isArray(examsData.publishedExams) ? examsData.publishedExams : []);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to publish exam', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDraftExam = async (examId: string) => {
    try {
      setSubmitting(true);
      await deleteTeacherExam(examId);
      showToast('Exam deleted', 'success');
      
      // Refresh exams from backend
      const examsData = await getTeacherExams();
      setDraftExams(Array.isArray(examsData.draftExams) ? examsData.draftExams : []);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to delete exam', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditDraftExam = (exam: any) => {
    setEditingExam(exam);
    setExamForm({
      title: exam.title || '',
      examType: exam.exam_type || exam.examType || 'Mid Exam',
      totalMarks: exam.total_marks || exam.totalMarks || 100,
      duration: exam.duration_minutes || exam.duration || 60,
      instructions: exam.instructions || '',
      selectedClass: exam.class_id || exam.selectedClass || '',
      selectedSection: exam.selected_section || exam.selectedSection || '',
      gradeId: exam.grade_id || exam.gradeId || '',
      subjectId: exam.subject_id || exam.subjectId || '',
      examPassword: exam.exam_password || exam.examPassword || '',
      isLocked: !!(exam.is_locked || exam.isLocked || exam.exam_password || exam.examPassword),
      passwordRequired: !!(exam.password_required || exam.passwordRequired || exam.exam_password || exam.examPassword),
      questions: exam.questions || []
    });
    setIsExamModalOpen(true);
  };

  const handleSaveExamChanges = async () => {
    if (!examForm.title.trim()) { setToast({ show: true, type: 'error', message: 'Please enter exam title' }); return; }
    if (examForm.isLocked && !examForm.examPassword.trim()) { setToast({ show: true, type: 'error', message: 'Please enter exam password' }); return; }
    
    try {
      setSubmitting(true);
      if (editingExam) {
        // Update existing draft exam
        await updateTeacherExam(editingExam.id, {
          title: examForm.title,
          examType: examForm.examType,
          totalMarks: examForm.totalMarks,
          duration: examForm.duration,
          instructions: examForm.instructions,
          selectedSection: examForm.selectedSection,
          gradeId: examForm.gradeId,
          subjectId: examForm.subjectId,
          examPassword: examForm.examPassword,
          isLocked: examForm.isLocked,
          passwordRequired: examForm.passwordRequired,
          questions: examForm.questions
        });
        showToast('Exam updated!', 'success');
      } else {
        // Create new exam
        await saveTeacherExam({
          classId: examForm.selectedClass,
          title: examForm.title,
          examType: examForm.examType,
          totalMarks: examForm.totalMarks,
          duration: examForm.duration,
          instructions: examForm.instructions,
          selectedSection: examForm.selectedSection,
          gradeId: examForm.gradeId,
          subjectId: examForm.subjectId,
          examPassword: examForm.examPassword,
          isLocked: examForm.isLocked,
          passwordRequired: examForm.passwordRequired,
          questions: examForm.questions
        });
        showToast('Exam saved!', 'success');
      }
      
      // Refresh exams from backend
      const examsData = await getTeacherExams();
      setDraftExams(Array.isArray(examsData.draftExams) ? examsData.draftExams : []);
      setPublishedExams(Array.isArray(examsData.publishedExams) ? examsData.publishedExams : []);
      
      setIsExamModalOpen(false);
      setEditingExam(null);
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to save exam', 'error');
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

  return (
    <div className="space-y-8">
      {/* Tabs */}
      <div className="flex gap-3 p-1.5 bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl w-fit border border-slate-200/50 dark:border-slate-700/50 flex-wrap">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'plans', label: 'Weekly Plans' },
          { id: 'exams', label: 'Exams' },
          ...(isDean ? [{ id: 'dept-tasks', label: 'Department Tasks' }] : []),
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-xl' : 'text-slate-500 hover:text-slate-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' ? (
        <>
          {/* Header */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-4 block">Teacher Dashboard</span>
              <h2 className="text-4xl font-black mb-2 tracking-tight">Welcome back, {user?.name?.split(' ')[0]}!</h2>
              <p className="text-slate-400 font-medium">
                Digital ID: <span className="text-white font-mono">{(user as any)?.digitalId || (user as any)?.digital_id || '—'}</span>
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/attendance" className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20">
                  Take Attendance <ArrowRight size={16} />
                </Link>
                <Link to="/schedule" className="bg-white/5 text-white border border-white/10 px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">
                  My Schedule
                </Link>
                <Link to="/grades" className="bg-emerald-600 text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20">
                  Enter Grades
                </Link>
              </div>
            </div>
            <div className="absolute top-0 right-0 p-12 opacity-5"><BookOpen size={240} /></div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl">
              <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 w-14 h-14 rounded-2xl flex items-center justify-center mb-6"><Users size={28} /></div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Assigned Classes</p>
              <h3 className="text-3xl font-black text-slate-800 dark:text-white">{dashboard?.assignedClassesCount ?? '—'}</h3>
            </div>
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl">
              <div className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 w-14 h-14 rounded-2xl flex items-center justify-center mb-6"><Calendar size={28} /></div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Today's Schedule</p>
              <h3 className="text-3xl font-black text-slate-800 dark:text-white">{todaySchedule.length}</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-4">Classes today</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 w-14 h-14 rounded-2xl flex items-center justify-center mb-6"><ClipboardList size={28} /></div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Pending Plans</p>
              <h3 className="text-3xl font-black text-slate-800 dark:text-white">{dashboard?.pendingPlansCount ?? pendingPlans}</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-4">Awaiting head of department review</p>
            </div>
          </div>

          {/* Today's Schedule */}
          {todaySchedule.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-800 dark:text-white">Today's Schedule</h3>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {todaySchedule.map((item: any) => (
                  <div key={item.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white">{item.subject} — Class {item.class_name}</p>
                      <p className="text-xs text-slate-500">{item.time_slot} · {item.day}</p>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">{item.time_slot}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : activeTab === 'plans' ? (
        /* Weekly Plans Tab */
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div>
                <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Weekly Plans</h2>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Submit lesson plans for head of department review</p>
              </div>
              <button onClick={() => { setEditingPlan(null); setPlanForm(emptyPlan); setIsPlanModalOpen(true); }}
                className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20">
                <Plus size={18} /> Create New Plan
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    {['Date', 'Subject', 'Content', 'Objectives', 'Method', 'Duration', 'Status', 'Feedback', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {plans.length === 0 ? (
                    <tr><td colSpan={9} className="px-6 py-12 text-center text-slate-500">No plans yet. Create your first plan!</td></tr>
                  ) : (
                    plans.map((plan: any) => (
                      <tr key={plan.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/5 transition-colors">
                        <td className="px-4 py-4 text-xs font-bold text-slate-800 dark:text-slate-200">{plan.date?.slice(0, 10)}</td>
                        <td className="px-4 py-4 text-xs font-semibold text-blue-600 dark:text-blue-400">{plan.subject || '—'}</td>
                        <td className="px-4 py-4 text-xs text-slate-600 dark:text-slate-400 max-w-[120px] truncate">{plan.content}</td>
                        <td className="px-4 py-4 text-xs text-slate-600 dark:text-slate-400 max-w-[120px] truncate">{plan.objectives}</td>
                        <td className="px-4 py-4 text-xs text-slate-600 dark:text-slate-400 max-w-[100px] truncate">{plan.teaching_method || plan.teachingMethod}</td>
                        <td className="px-4 py-4 text-xs text-slate-600 dark:text-slate-400">{plan.time_duration || plan.timeDuration}</td>
                        <td className="px-4 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${plan.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' :
                            plan.status === 'Revision Required' ? 'bg-orange-100 text-orange-600' :
                              plan.status === 'Draft' ? 'bg-slate-100 text-slate-600' :
                                'bg-amber-100 text-amber-600'
                            }`}>{plan.status}</span>
                        </td>
                        <td className="px-4 py-4">
                          {plan.dean_feedback ? (
                            <div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-[120px] truncate">{plan.dean_feedback}</p>
                              {plan.dean_rating && (
                                <div className="flex gap-0.5 mt-1">
                                  {[1, 2, 3, 4, 5].map(n => (
                                    <Star key={n} size={10} className={n <= plan.dean_rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'} />
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : <span className="text-xs text-slate-400">—</span>}
                        </td>
                        <td className="px-4 py-4">
                          {(plan.status === 'Draft' || plan.status === 'Revision Required') && (
                            <button onClick={() => openEditModal(plan)}
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-200 transition-colors">
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'exams' ? (
        /* Exams Tab */
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div>
                <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Official Examinations</h2>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Create, manage, and publish exams for your classes</p>
              </div>
              <button onClick={() => { setEditingExam(null); setExamForm({ title: '', examType: 'Mid Exam', totalMarks: 100, duration: 60, instructions: '', selectedClass: '', selectedSection: '', gradeId: '', subjectId: '', examPassword: '', isLocked: false, passwordRequired: false, questions: [] }); setIsExamModalOpen(true); }}
                className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20">
                <Plus size={18} /> Create New Exam
              </button>
            </div>

            {/* Exams Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Draft Exams */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 p-6 rounded-2xl border border-amber-200 dark:border-amber-800">
                <h3 className="text-lg font-black text-amber-900 dark:text-amber-300 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <FileText size={20} /> Draft Exams
                </h3>
                <div className="space-y-3">
                  {draftExams.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-8">No draft exams yet. Create one to get started!</p>
                  ) : (
                    draftExams.map((exam: any) => (
                      <div key={exam.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-amber-200 dark:border-amber-700 hover:shadow-md transition-all">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-800 dark:text-white text-sm">{exam.title}</h4>
                            <p className="text-xs text-slate-500 mt-1">{exam.totalMarks} marks • {exam.duration} min</p>
                            <p className="text-xs text-amber-600 dark:text-amber-400 font-bold mt-1">DRAFT</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleEditDraftExam(exam)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors">Edit</button>
                            <button onClick={() => handlePublishExam(exam.id)} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors">Publish</button>
                            <button onClick={() => handleDeleteDraftExam(exam.id)} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors">Delete</button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Published Exams */}
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/10 dark:to-green-900/10 p-6 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                <h3 className="text-lg font-black text-emerald-900 dark:text-emerald-300 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <CheckCircle2 size={20} /> Published Exams
                </h3>
                <div className="space-y-3">
                  {publishedExams.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-8">No published exams yet.</p>
                  ) : (
                    publishedExams.map((exam: any) => (
                      <div key={exam.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-emerald-200 dark:border-emerald-700 hover:shadow-md transition-all">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-800 dark:text-white text-sm">{exam.title}</h4>
                            <p className="text-xs text-slate-500 mt-1">Class: {exam.className} • Section: {exam.section}</p>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1">PUBLISHED</p>
                          </div>
                          <button className="px-3 py-1.5 bg-slate-600 text-white rounded-lg text-xs font-bold hover:bg-slate-700 transition-colors">View Results</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'dept-tasks' ? (
        /* Department Tasks Tab */
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div>
                <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Department Tasks</h2>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Manage and review weekly plans submitted by teachers in your department</p>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <input
                type="text"
                placeholder="Search teacher or subject..."
                value={deptSearch}
                onChange={e => setDeptSearch(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex-1 md:flex-none">
                <label htmlFor="deptFilter" className="sr-only">Filter lesson plans by status</label>
                <select
                  id="deptFilter"
                  title="Filter lesson plans by status"
                  value={deptFilter}
                  onChange={e => setDeptFilter(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Revision Required">Revision Required</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDeptPlans.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-slate-500 font-bold">No plans matching the search/filter criteria.</p>
                </div>
              ) : (
                filteredDeptPlans.map((plan: any) => (
                  <div
                    key={plan.id}
                    className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-all p-6 space-y-4 group cursor-pointer"
                  >
                    {/* Header */}
                    <div className="border-b border-slate-100 dark:border-slate-700 pb-3">
                      <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight">
                        {plan.teacher_name || plan.teacherName}
                      </h3>
                      <p className="text-xs text-slate-500 font-bold uppercase mt-1">{plan.subject || '—'}</p>
                    </div>

                    {/* Plan Details */}
                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="font-bold text-slate-600 dark:text-slate-400">Date</label>
                        <p className="text-slate-800 dark:text-slate-200">{plan.date?.slice(0, 10)}</p>
                      </div>
                      <div>
                        <label className="font-bold text-slate-600 dark:text-slate-400">Topic/Content</label>
                        <p className="text-slate-800 dark:text-slate-200 line-clamp-2">{plan.content}</p>
                      </div>
                      <div>
                        <label className="font-bold text-slate-600 dark:text-slate-400">Objectives</label>
                        <p className="text-slate-800 dark:text-slate-200 line-clamp-2">{plan.objectives}</p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                          plan.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                            : plan.status === 'Revision Required'
                            ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'
                            : 'bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                        }`}
                      >
                        {plan.status}
                      </span>
                    </div>

                    {/* Rating Section */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-2">Rate This Plan</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            title={`Rate ${star} out of 5`}
                            onClick={() =>
                              setDeptPlans(prev =>
                                prev.map(p => p.id === plan.id ? { ...p, rating: star } : p)
                              )
                            }
                            className="focus:outline-none transition-transform hover:scale-125"
                          >
                            <Star
                              size={18}
                              className={
                                star <= (plan.dean_rating || plan.deanRating || plan.rating || 0)
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-300 dark:text-slate-600'
                              }
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Feedback */}
                    {(plan.dean_feedback || plan.deanFeedback || plan.feedback) && (
                      <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">Feedback</p>
                        <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">
                          {plan.dean_feedback || plan.deanFeedback || plan.feedback}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      {plan.status === 'Pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleApproveDeptPlan(plan.id)}
                            className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors"
                          >
                            ✓ Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setReviewingPlanId(plan.id);
                              setReviewFeedback('');
                            }}
                            className="flex-1 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition-colors"
                          >
                            ⟲ Revise
                          </button>
                        </>
                      )}
                      {plan.status !== 'Pending' && (
                        <div className="w-full text-center">
                          <span className="text-xs text-slate-400 font-medium">✓ Already Reviewed</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Inline feedback dialog for Revision Request */}
          {reviewingPlanId && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-md p-6 space-y-4">
                <h3 className="text-lg font-black text-slate-950 dark:text-white uppercase tracking-tight">Request Revision</h3>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Provide feedback on the lesson plan</p>
                <textarea
                  rows={4}
                  placeholder="Explain what needs to be revised..."
                  value={reviewFeedback}
                  onChange={e => setReviewFeedback(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setReviewingPlanId(null)}
                    className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-sm text-slate-500 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRejectDeptPlan}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 rounded-lg text-sm"
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Plan Modal */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-3xl">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-600 text-white rounded-2xl"><FileText size={20} /></div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    {editingPlan ? 'Edit Lesson Plan' : 'Create Weekly Plan'}
                  </h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Submit for VP review</p>
                </div>
              </div>
              <button
                type="button"
                title="Close plan modal"
                aria-label="Close plan modal"
                onClick={() => { setIsPlanModalOpen(false); setEditingPlan(null); }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmitPlan} className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="planDate" className="text-xs font-bold text-slate-500 uppercase">Date</label>
                  <input id="planDate" type="date" required value={planForm.date}
                    onChange={e => setPlanForm({ ...planForm, date: e.target.value })}
                    className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="planTimeDuration" className="text-xs font-bold text-slate-500 uppercase">Time Duration</label>
                  <input id="planTimeDuration" type="text" required placeholder="e.g. 45 minutes" value={planForm.timeDuration}
                    onChange={e => setPlanForm({ ...planForm, timeDuration: e.target.value })}
                    className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="planCourseId" className="text-xs font-bold text-slate-500 uppercase">Course / Class</label>
                  <select
                    id="planCourseId"
                    required
                    value={planForm.courseId || ''}
                    onChange={e => {
                      const selected = myClasses.find((c: any) => c.id === e.target.value);
                      setPlanForm({
                        ...planForm,
                        courseId: e.target.value,
                        subject: selected ? (selected.name || selected.class_name || selected.subject) : ''
                      });
                    }}
                    className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Course</option>
                    {myClasses.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name || c.class_name || c.subject} {c.section ? `(${c.section})` : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="planDeptHeadId" className="text-xs font-bold text-slate-500 uppercase">Department Head</label>
                  <select
                    id="planDeptHeadId"
                    required
                    value={planForm.deptHeadId || ''}
                    onChange={e => setPlanForm({ ...planForm, deptHeadId: e.target.value })}
                    className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Dept Head</option>
                    {deptHeads.map((dh: any) => (
                      <option key={dh.teacher_id} value={dh.teacher_id}>{dh.name} ({dh.department || 'Dean'})</option>
                    ))}
                  </select>
                </div>
              </div>

              {[
                { key: 'content', label: 'Content / Topic', placeholder: 'e.g. Algebra - Quadratic Equations' },
                { key: 'objectives', label: 'Specific Objectives', placeholder: 'What should students achieve?' },
                { key: 'teacherActivity', label: 'Teacher Activity', placeholder: 'What will you do?' },
                { key: 'studentActivity', label: 'Student Activity', placeholder: 'What will students do?' },
                { key: 'teachingMethod', label: 'Teaching Method', placeholder: 'e.g. Lecture and guided practice' },
                { key: 'teachingAids', label: 'Teaching Aids', placeholder: 'e.g. Whiteboard, textbook, worksheets' },
                { key: 'evaluation', label: 'Evaluation', placeholder: 'e.g. 5-question quiz at end of class' },
                { key: 'remark', label: 'Remark (Optional)', placeholder: 'Any additional notes...' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label htmlFor={`plan${key}`} className="text-xs font-bold text-slate-500 uppercase">{label}</label>
                  <textarea id={`plan${key}`} rows={2} placeholder={placeholder} required={key !== 'remark'}
                    value={(planForm as any)[key]}
                    onChange={e => setPlanForm({ ...planForm, [key]: e.target.value })}
                    className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              ))}

              <div>
                <label htmlFor="planStatus" className="text-xs font-bold text-slate-500 uppercase">Status</label>
                <select id="planStatus" title="Set plan status" value={planForm.status} onChange={e => setPlanForm({ ...planForm, status: e.target.value as any })}
                  className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="Pending">Pending (Submit for head of department review)</option>
                  <option value="Draft">Draft (Save for later)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setIsPlanModalOpen(false); setEditingPlan(null); }}
                  className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-sm text-slate-500 hover:bg-slate-50"
                  disabled={submitting}>Cancel</button>
                <button type="submit"
                  className="flex-1 bg-blue-600 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50"
                  disabled={submitting}>
                  {submitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                  <span>{submitting ? 'Submitting...' : editingPlan ? 'Update Plan' : 'Submit Plan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Exam Modal */}
      {isExamModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl my-8 border border-slate-100 dark:border-slate-800">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-2xl flex justify-between items-center z-10">
              <h3 className="text-xl font-black text-white uppercase tracking-wide">{editingExam ? '✏️ Edit Exam' : '📝 Create New Exam'}</h3>
              <button onClick={() => { setIsExamModalOpen(false); setEditingExam(null); }} className="text-white hover:bg-white/20 p-1 rounded">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
              {/* Exam Title */}
              <div>
                <label htmlFor="examTitle" className="text-xs font-bold text-slate-500 uppercase">Exam Title</label>
                <input id="examTitle" type="text" placeholder="e.g., Mid Exam - Mathematics" 
                  value={examForm.title} onChange={e => setExamForm({ ...examForm, title: e.target.value })}
                  className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              {/* Grade & Subject Selection */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 dark:bg-slate-800 rounded-lg border border-blue-200 dark:border-slate-700">
                <div>
                  <label htmlFor="examGrade" className="text-xs font-bold text-slate-500 uppercase">Grade Level</label>
                  {loadingGrades ? (
                    <div className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-400">Loading...</div>
                  ) : (
                    <select id="examGrade" value={examForm.gradeId} onChange={e => handleGradeChange(e.target.value)}
                      className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select Grade</option>
                      {gradesForExam.map(grade => (
                        <option key={grade.id} value={grade.id}>{grade.name}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label htmlFor="examSubject" className="text-xs font-bold text-slate-500 uppercase">Subject/Course</label>
                  {examForm.gradeId && loadingCourses ? (
                    <div className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-400">Loading...</div>
                  ) : examForm.gradeId && coursesForGrade.length > 0 ? (
                    <div className="mt-1 p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg space-y-2">
                      {coursesForGrade.map(course => (
                        <label key={course.id} className="flex items-center gap-2 cursor-pointer text-sm">
                          <input type="radio" name="examSubject" value={course.id} 
                            checked={examForm.subjectId === course.id}
                            onChange={e => setExamForm({ ...examForm, subjectId: e.target.value })}
                            className="w-4 h-4 text-blue-600 rounded-full" />
                          <span className="text-slate-700 dark:text-slate-300">{course.name} ({course.code})</span>
                        </label>
                      ))}
                    </div>
                  ) : examForm.gradeId ? (
                    <div className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-400">No courses available for this grade</div>
                  ) : (
                    <div className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-400">Select a grade first</div>
                  )}
                </div>
              </div>

              {/* Exam Type & Total Marks & Duration */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="examType" className="text-xs font-bold text-slate-500 uppercase">Type</label>
                  <select id="examType" value={examForm.examType} onChange={e => setExamForm({ ...examForm, examType: e.target.value })}
                    className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Mid Exam</option>
                    <option>Final Exam</option>
                    <option>Quiz</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="totalMarks" className="text-xs font-bold text-slate-500 uppercase">Total Marks</label>
                  <input id="totalMarks" type="number" min="10" max="1000" 
                    value={examForm.totalMarks} onChange={e => setExamForm({ ...examForm, totalMarks: parseInt(e.target.value) })}
                    className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label htmlFor="duration" className="text-xs font-bold text-slate-500 uppercase">Duration (min)</label>
                  <input id="duration" type="number" min="15" max="600" 
                    value={examForm.duration} onChange={e => setExamForm({ ...examForm, duration: parseInt(e.target.value) })}
                    className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* Class & Section */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="examClass" className="text-xs font-bold text-slate-500 uppercase">Class</label>
                  <select id="examClass" value={examForm.selectedClass} onChange={e => { 
                    const selected = myClasses.find((c: any) => c.id === e.target.value);
                    setExamForm({ ...examForm, selectedClass: e.target.value, selectedSection: '' }); 
                  }}
                    className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select Class</option>
                    {myClasses.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name || c.class_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="examSection" className="text-xs font-bold text-slate-500 uppercase">Section</label>
                  <input id="examSection" type="text" placeholder="e.g., A, B, C" 
                    value={examForm.selectedSection} onChange={e => setExamForm({ ...examForm, selectedSection: e.target.value })}
                    className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label htmlFor="examInstructions" className="text-xs font-bold text-slate-500 uppercase">Instructions for Students</label>
                <textarea id="examInstructions" rows={3} placeholder="e.g., Answer all questions. No calculators allowed. Duration: 1 hour" 
                  value={examForm.instructions} onChange={e => setExamForm({ ...examForm, instructions: e.target.value })}
                  className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>

              {/* Password Protection Section */}
              <div className="p-4 bg-amber-50 dark:bg-slate-800 rounded-lg border border-amber-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center gap-3">
                  <input id="isLocked" type="checkbox" checked={examForm.isLocked} 
                    onChange={e => setExamForm({ ...examForm, isLocked: e.target.checked, passwordRequired: e.target.checked })}
                    className="w-4 h-4 text-amber-600 rounded" />
                  <label htmlFor="isLocked" className="text-xs font-bold text-slate-500 uppercase cursor-pointer flex-1">
                    🔒 Lock This Exam (Requires Password)
                  </label>
                </div>
                {examForm.isLocked && (
                  <>
                    <div>
                      <label htmlFor="examPassword" className="text-xs font-bold text-slate-500 uppercase">Exam Password</label>
                      <input id="examPassword" type="password" placeholder="Enter exam password (students will need this)" 
                        value={examForm.examPassword} onChange={e => setExamForm({ ...examForm, examPassword: e.target.value })}
                        className="w-full mt-1 px-4 py-2 bg-white dark:bg-slate-700 border border-amber-200 dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500" />
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 italic">ℹ️ Students must enter this password to access the exam. If they leave and return, they'll need to enter it again.</p>
                  </>
                )}
              </div>

              {/* Questions Builder - Simple version */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Questions Preview</label>
                <p className="text-xs text-slate-500 mt-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  {examForm.questions.length === 0 ? 'No questions added yet. This feature will be available in the full version.' : `${examForm.questions.length} questions configured`}
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-slate-50 dark:bg-slate-800 p-6 rounded-b-2xl flex gap-3 border-t border-slate-100 dark:border-slate-700">
              <button onClick={() => { setIsExamModalOpen(false); setEditingExam(null); }}
                className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                Cancel
              </button>
              <button onClick={handleSaveExamChanges} disabled={submitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {editingExam ? 'Update Exam' : 'Save Exam'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border ${toast.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-200' : 'bg-red-50 dark:bg-red-900/20 border-red-200'
            }`}>
            {toast.type === 'success' ? <CheckCircle2 className="text-green-600" size={20} /> : <XCircle className="text-red-600" size={20} />}
            <p className={`text-sm font-bold ${toast.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};
