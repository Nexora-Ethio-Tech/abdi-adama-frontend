import { BookOpen, Users, Calendar, ArrowRight, ClipboardList, FileText, Plus, X, CheckCircle2, XCircle, Loader2, Star, Save, Send } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
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
  const [deptFilter, setDeptFilter] = useState('Pending');
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

  const handleApproveDeptPlan = async (id: string, rating: number, feedback: string) => {
    const defaultFeedback = feedback.trim() || 'Approved by Department Head';
    
    // Update local state instantly
    setDeptPlans(prev => prev.map(p => p.id === id ? { 
      ...p, 
      status: 'Approved', 
      dean_rating: rating, 
      dean_feedback: defaultFeedback 
    } : p));

    // Sync to user's plans in case it's a simulated plan they submitted
    setPlans(prev => prev.map(p => p.id === id ? { 
      ...p, 
      status: 'Approved', 
      dean_rating: rating, 
      dean_feedback: defaultFeedback 
    } : p));

    showToast('Plan approved successfully!', 'success');

    try {
      await reviewDeptPlan(id, { status: 'Approved', feedback: defaultFeedback, rating });
    } catch (err: any) {
      console.warn('Backend update failed/ignored for demo:', err);
    }
  };

  const handleRejectDeptPlan = async (id: string, rating: number, feedback: string) => {
    if (!feedback.trim()) {
      showToast('Feedback is required to request revision', 'error');
      return;
    }

    // Update local state instantly
    setDeptPlans(prev => prev.map(p => p.id === id ? { 
      ...p, 
      status: 'Revision Required', 
      dean_rating: rating, 
      dean_feedback: feedback 
    } : p));

    // Sync to user's plans in case it's a simulated plan they submitted
    setPlans(prev => prev.map(p => p.id === id ? { 
      ...p, 
      status: 'Revision Required', 
      dean_rating: rating, 
      dean_feedback: feedback 
    } : p));

    showToast('Revision request submitted!', 'success');

    try {
      await reviewDeptPlan(id, { status: 'Revision Required', feedback, rating });
    } catch (err: any) {
      console.warn('Backend update failed/ignored for demo:', err);
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
  const navigate = useNavigate();

  // Classes, actual assigned courses, and department heads
  const [myClasses, setMyClasses] = useState<any[]>([]);
  const [myCourses, setMyCourses] = useState<any[]>([]); // actual courses from courses table
  const [deptHeads, setDeptHeads] = useState<any[]>([]);

  // Sub-tab selection for weekly plans
  const [weeklyPlanSubTab, setWeeklyPlanSubTab] = useState<'my-plans' | 'dept-plans'>('my-plans');
  // Plan detail expand overlay
  const [selectedPlanForView, setSelectedPlanForView] = useState<any | null>(null);
  // Temporary evaluation rating
  const [reviewRating, setReviewRating] = useState<number>(0);
  // Simulation mode for Department Head role preview
  const [simulateDeanMode, setSimulateDeanMode] = useState<boolean>(false);

  // localStorage key for draft persistence
  const DRAFT_KEY = 'teacher_plan_draft';

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
      const [dash, planList, classList, examsData, courseList] = await Promise.all([
        getTeacherDashboard().catch(() => null),
        getMyWeeklyPlans().catch(() => []),
        getMyClasses().catch(() => []),
        getTeacherExams().catch(() => ({ draftExams: [], publishedExams: [] })),
        getTeacherCoursesForExams().catch(() => [])   // real assigned courses from DB
      ]);
      setDashboard(dash);
      setPlans(Array.isArray(planList) ? planList : []);
      setMyClasses(Array.isArray(classList) ? classList : []);
      
      const rawCourses = Array.isArray(courseList) ? courseList : [];
      if (rawCourses.length === 0) {
        setMyCourses([
          { id: 'c-1', name: 'Algebra', code: 'MATH-11', class_name: 'Grade 11A' },
          { id: 'c-2', name: 'Geometry', code: 'MATH-10', class_name: 'Grade 10B' },
          { id: 'c-3', name: 'Calculus', code: 'MATH-12', class_name: 'Grade 12A' }
        ]);
      } else {
        setMyCourses(rawCourses);
      }

      // Load exams from backend
      if (examsData) {
        setDraftExams(Array.isArray(examsData.draftExams) ? examsData.draftExams : []);
        setPublishedExams(Array.isArray(examsData.publishedExams) ? examsData.publishedExams : []);
      }
      
      const deptHeadsList = await getDepartmentHeads().catch(() => []);
      const rawDeptHeads = Array.isArray(deptHeadsList) ? deptHeadsList : [];
      if (rawDeptHeads.length === 0) {
        setDeptHeads([
          { teacher_id: 'dh-1', name: 'Dr. Girma Bekele', department: 'Mathematics Department' },
          { teacher_id: 'dh-2', name: 'Wz. Aster Tolosa', department: 'Natural Science Department' },
          { teacher_id: 'dh-3', name: 'Abo Chala Kebede', department: 'Social Science Department' },
          { teacher_id: 'dh-4', name: 'Mstr. Kassa Hailu', department: 'Languages Department' }
        ]);
      } else {
        setDeptHeads(rawDeptHeads);
      }

      if (dash?.teacherInfo?.is_dean || simulateDeanMode) {
        const dPlans = await getDeptPlans().catch(() => []);
        const rawPlans = Array.isArray(dPlans) ? dPlans : [];
        if (rawPlans.length === 0) {
          // Populate 8 beautiful mock weekly plans for Mathematics Department
          const mockPlans = [
            {
              id: 'mock-plan-1',
              teacher_name: 'Alemu Asefa',
              subject: 'Algebra (MATH-11) — Grade 11A',
              date: '2026-06-01',
              time_duration: '45 minutes',
              timeDuration: '45 minutes',
              content: 'Quadratic Equations and applications',
              objectives: 'Students will be able to solve quadratic equations using the quadratic formula and apply it to word problems.',
              teacher_activity: 'Deliver a lecture explaining the formula derivation, work through 3 examples on the board, and guide initial practice.',
              teacherActivity: 'Deliver a lecture explaining the formula derivation, work through 3 examples on the board, and guide initial practice.',
              student_activity: 'Take notes, solve practice problems in pairs, and ask clarifying questions.',
              studentActivity: 'Take notes, solve practice problems in pairs, and ask clarifying questions.',
              teaching_method: 'Lecture, guided practice, pair work',
              teachingMethod: 'Lecture, guided practice, pair work',
              teaching_aids: 'Whiteboard, textbook, printed worksheets',
              teachingAids: 'Whiteboard, textbook, printed worksheets',
              evaluation: 'Short exit ticket containing 2 quadratic equation problems to solve independently.',
              remark: 'Make sure to emphasize the sign under the square root and real-world implications.',
              status: 'Pending',
              dean_rating: 0,
              dean_feedback: ''
            },
            {
              id: 'mock-plan-2',
              teacher_name: 'Tadesse Balcha',
              subject: 'Geometry (GEOM-10) — Grade 10B',
              date: '2026-06-01',
              time_duration: '50 minutes',
              timeDuration: '50 minutes',
              content: 'Triangles and Similarity Criteria',
              objectives: 'Students will learn to prove triangle similarity using AA, SAS, and SSS postulates.',
              teacher_activity: 'Define similarity, prove AA criteria on board, and lead a discussion on real-life shadows/scale drawing.',
              teacherActivity: 'Define similarity, prove AA criteria on board, and lead a discussion on real-life shadows/scale drawing.',
              student_activity: 'Measure scale drawings and work on similarity proofs in groups.',
              studentActivity: 'Measure scale drawings and work on similarity proofs in groups.',
              teaching_method: 'Collaborative learning, proofs demonstration',
              teachingMethod: 'Collaborative learning, proofs demonstration',
              teaching_aids: 'Geometry toolkits, projection screen, work booklets',
              teachingAids: 'Geometry toolkits, projection screen, work booklets',
              evaluation: 'Solve 3 similarity proof worksheets at the end of the session.',
              remark: 'Needs extra compass tools for geometric drawings.',
              status: 'Pending',
              dean_rating: 0,
              dean_feedback: ''
            },
            {
              id: 'mock-plan-3',
              teacher_name: 'Chala Kebede',
              subject: 'Calculus (CALC-12) — Grade 12A',
              date: '2026-06-01',
              time_duration: '45 minutes',
              timeDuration: '45 minutes',
              content: 'Introduction to Derivatives and Rates of Change',
              objectives: 'Understand the limit definition of the derivative and compute basic derivatives.',
              teacher_activity: 'Introduce the secant line limit approaching the tangent line. Present power rule shortcut.',
              teacherActivity: 'Introduce the secant line limit approaching the tangent line. Present power rule shortcut.',
              student_activity: 'Solve rate of change problems from first principles.',
              studentActivity: 'Solve rate of change problems from first principles.',
              teaching_method: 'Concept induction, interactive board work',
              teachingMethod: 'Concept induction, interactive board work',
              teaching_aids: 'Graphing calculator, smart board diagrams',
              teachingAids: 'Graphing calculator, smart board diagrams',
              evaluation: 'Assess using 4 differentiation exercises.',
              remark: 'Some students might struggle with algebraic limit simplification.',
              status: 'Pending',
              dean_rating: 0,
              dean_feedback: ''
            },
            {
              id: 'mock-plan-4',
              teacher_name: 'Meskerm Bekele',
              subject: 'Statistics (STAT-11) — Grade 11C',
              date: '2026-06-01',
              time_duration: '45 minutes',
              timeDuration: '45 minutes',
              content: 'Measures of Central Tendency',
              objectives: 'Calculate mean, median, and mode for grouped and ungrouped datasets.',
              teacher_activity: 'Demonstrate calculation methods using a real-world class height survey dataset.',
              teacherActivity: 'Demonstrate calculation methods using a real-world class height survey dataset.',
              student_activity: 'Collect class data on shoes sizes and calculate the mean, median, and mode.',
              studentActivity: 'Collect class data on shoes sizes and calculate the mean, median, and mode.',
              teaching_method: 'Activity-based learning, statistical calculations',
              teachingMethod: 'Activity-based learning, statistical calculations',
              teaching_aids: 'Survey sheets, basic calculators',
              teachingAids: 'Survey sheets, basic calculators',
              evaluation: 'Submit dataset calculation summary tables.',
              remark: 'Highlight the difference between sample mean and population mean.',
              status: 'Pending',
              dean_rating: 0,
              dean_feedback: ''
            },
            {
              id: 'mock-plan-5',
              teacher_name: 'Aster Tolosa',
              subject: 'General Math (MATH-9) — Grade 9A',
              date: '2026-06-01',
              time_duration: '45 minutes',
              timeDuration: '45 minutes',
              content: 'Linear Equations in One Variable',
              objectives: 'Solve basic multi-step linear equations and check the answers.',
              teacher_activity: 'Model inverse operations method step-by-step. Show how to check solutions by substitution.',
              teacherActivity: 'Model inverse operations method step-by-step. Show how to check solutions by substitution.',
              student_activity: 'Solve textbook practice exercises individually and peer-check answers.',
              studentActivity: 'Solve textbook practice exercises individually and peer-check answers.',
              teaching_method: 'Direct instruction, individual practice',
              teachingMethod: 'Direct instruction, individual practice',
              teaching_aids: 'Worksheets, colored board markers',
              teachingAids: 'Worksheets, colored board markers',
              evaluation: 'Quiz with 3 linear equations.',
              remark: 'Remind students of rules regarding negative number multiplication/division.',
              status: 'Pending',
              dean_rating: 0,
              dean_feedback: ''
            },
            {
              id: 'mock-plan-6',
              teacher_name: 'Kassa Hailu',
              subject: 'Trigonometry (TRIG-10) — Grade 10A',
              date: '2026-06-01',
              time_duration: '45 minutes',
              timeDuration: '45 minutes',
              content: 'Soh-Cah-Toa and Right Triangle Trig',
              objectives: 'Apply sine, cosine, and tangent ratios to find missing angles and side lengths.',
              teacher_activity: 'Introduce SohCahToa mnemonic, demonstrate side selection (opposite, adjacent, hypotenuse).',
              teacherActivity: 'Introduce SohCahToa mnemonic, demonstrate side selection (opposite, adjacent, hypotenuse).',
              student_activity: 'Complete trigonometric ratio puzzle challenges in groups.',
              studentActivity: 'Complete trigonometric ratio puzzle challenges in groups.',
              teaching_method: 'Mnemonic instruction, gamified group exercises',
              teachingMethod: 'Mnemonic instruction, gamified group exercises',
              teaching_aids: 'Right-triangle posters, scientific calculators',
              teachingAids: 'Right-triangle posters, scientific calculators',
              evaluation: 'Group presentation of puzzle solutions.',
              remark: 'Ensure calculator settings are in Degree mode, not Radian mode.',
              status: 'Pending',
              dean_rating: 0,
              dean_feedback: ''
            },
            {
              id: 'mock-plan-7',
              teacher_name: 'Selamawit Desta',
              subject: 'Probability (PROB-12) — Grade 12B',
              date: '2026-06-01',
              time_duration: '45 minutes',
              timeDuration: '45 minutes',
              content: 'Conditional Probability and Bayes Theorem',
              objectives: 'Calculate conditional probabilities using tree diagrams and apply Bayes theorem.',
              teacher_activity: 'Explain tree diagrams, model calculation of conditional probabilities with marble-drawing examples.',
              teacherActivity: 'Explain tree diagrams, model calculation of conditional probabilities with marble-drawing examples.',
              student_activity: 'Solve real-world probability scenarios (e.g., medical test reliability) using Bayes theorem.',
              studentActivity: 'Solve real-world probability scenarios (e.g., medical test reliability) using Bayes theorem.',
              teaching_method: 'Problem solving, theoretical explanation',
              teachingMethod: 'Problem solving, theoretical explanation',
              teaching_aids: 'Probability tree templates, interactive slides',
              teachingAids: 'Probability tree templates, interactive slides',
              evaluation: 'Exit question sheet containing one Bayes theorem calculation.',
              remark: 'Introduce conditional notation P(A|B) carefully.',
              status: 'Pending',
              dean_rating: 0,
              dean_feedback: ''
            },
            {
              id: 'mock-plan-8',
              teacher_name: 'Bekele Zewdu',
              subject: 'Business Math (MATH-11) — Grade 11B',
              date: '2026-06-01',
              time_duration: '45 minutes',
              timeDuration: '45 minutes',
              content: 'Simple and Compound Interest Calculation',
              objectives: 'Differentiate simple and compound interest. Use formulas to compute interest amounts.',
              teacher_activity: 'Illustrate simple vs compound growth over 5 years. Write formulas on the board and compute examples.',
              teacherActivity: 'Illustrate simple vs compound growth over 5 years. Write formulas on the board and compute examples.',
              student_activity: 'Calculate interest accrued for different saving plan options using formulas.',
              studentActivity: 'Calculate interest accrued for different saving plan options using formulas.',
              teaching_method: 'Financial model analysis, formula applications',
              teachingMethod: 'Financial model analysis, formula applications',
              teaching_aids: 'Interest table booklets, simple calculators',
              teachingAids: 'Interest table booklets, simple calculators',
              evaluation: 'Quiz with 2 compound interest word problems.',
              remark: 'Emphasize the variables P, r, n, and t clearly.',
              status: 'Pending',
              dean_rating: 0,
              dean_feedback: ''
            }
          ];
          setDeptPlans(mockPlans);
        } else {
          setDeptPlans(rawPlans);
        }
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
      setWeeklyPlanSubTab('my-plans');
    } else if (tab === 'dept-tasks') {
      setActiveTab('plans');
      setWeeklyPlanSubTab('dept-plans');
    } else {
      setActiveTab('overview');
    }
  }, [location.search]);

  // Persist draft to localStorage whenever form changes
  const saveDraftLocally = useCallback((form: typeof emptyPlan) => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(form)); } catch {}
  }, []);

  // Load locally-saved draft (only for new plans)
  const loadLocalDraft = useCallback((): typeof emptyPlan | null => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }, []);

  const clearLocalDraft = () => { try { localStorage.removeItem(DRAFT_KEY); } catch {} };

  // Save plan as draft (status = Draft) or submit (status = Pending)
  const handleSavePlan = async (targetStatus: 'Draft' | 'Pending') => {
    setSubmitting(true);
    const payload = { ...planForm, status: targetStatus };
    try {
      if (editingPlan) {
        await updateWeeklyPlan(editingPlan.id, payload);
        showToast(targetStatus === 'Draft' ? 'Draft saved successfully!' : 'Plan submitted for review!', 'success');
      } else {
        await submitWeeklyPlan(payload);
        showToast(targetStatus === 'Draft' ? 'Draft saved! You can continue editing it any time.' : 'Plan submitted for review!', 'success');
      }
      clearLocalDraft();
      setIsPlanModalOpen(false);
      setEditingPlan(null);
      setPlanForm(emptyPlan);
      const planList = await getMyWeeklyPlans();
      setPlans(Array.isArray(planList) ? planList : []);
    } catch (err: any) {
      console.warn('Backend failed, falling back to local simulation:', err);
      
      const targetId = editingPlan?.id || 'sim-' + Date.now();
      const updatedPlan = {
        id: targetId,
        date: payload.date,
        subject: payload.subject || 'Subject Selected',
        content: payload.content,
        objectives: payload.objectives,
        teacherActivity: payload.teacherActivity,
        teacher_activity: payload.teacherActivity,
        timeDuration: payload.timeDuration,
        time_duration: payload.timeDuration,
        studentActivity: payload.studentActivity,
        student_activity: payload.studentActivity,
        teachingMethod: payload.teachingMethod,
        teaching_method: payload.teachingMethod,
        teachingAids: payload.teachingAids,
        teaching_aids: payload.teachingAids,
        evaluation: payload.evaluation,
        remark: payload.remark,
        status: targetStatus,
        course_id: payload.courseId,
        dept_head_id: payload.deptHeadId,
        dean_feedback: editingPlan?.dean_feedback || '',
        dean_rating: editingPlan?.dean_rating || 0
      };

      if (editingPlan) {
        setPlans(prev => prev.map(p => p.id === targetId ? updatedPlan : p));
      } else {
        setPlans(prev => [updatedPlan, ...prev]);
      }
      
      if (targetStatus === 'Pending') {
        const deptPlanObj = {
          ...updatedPlan,
          teacher_name: user?.name || 'Assigned Teacher',
          teacherName: user?.name || 'Assigned Teacher'
        };
        setDeptPlans(prev => {
          const exists = prev.some(p => p.id === targetId);
          if (exists) return prev.map(p => p.id === targetId ? deptPlanObj : p);
          return [deptPlanObj, ...prev];
        });
      }

      showToast(targetStatus === 'Draft' ? 'Draft saved successfully!' : 'Plan submitted for review!', 'success');
      clearLocalDraft();
      setIsPlanModalOpen(false);
      setEditingPlan(null);
      setPlanForm(emptyPlan);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (plan: any) => {
    setEditingPlan(plan);
    const filled = {
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
      status: plan.status || 'Draft',
      courseId: plan.course_id || plan.courseId || '',
      subject: plan.subject || '',
      deptHeadId: plan.dept_head_id || plan.deptHeadId || '',
      weekNumber: plan.week_number || plan.weekNumber || 1
    };
    setPlanForm(filled);
    setIsPlanModalOpen(true);
  };

  const todaySchedule = dashboard?.todaySchedule || [];
  const pendingPlans = plans.filter(p => p.status === 'Pending').length;
  const isDean = dashboard?.teacherInfo?.is_dean === true || simulateDeanMode === true;

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
        {(() => {
          const tabs = [
            { id: 'overview', label: 'Overview' },
            { id: 'plans', label: 'Weekly Plans' },
            { id: 'exams', label: 'Exams' },
          ];
          return tabs.map(tab => {
            if (tab.id === 'exams') {
              return (
                <button key={tab.id} onClick={() => navigate('/exams')}
                  className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-slate-500 hover:text-slate-700`}>
                  {tab.label}
                </button>
              );
            }
            return (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id as any); if (tab.id === 'plans') setWeeklyPlanSubTab('my-plans'); }}
                className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-xl' : 'text-slate-500 hover:text-slate-700'}`}>
                {tab.label}
              </button>
            );
          });
        })()}
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
            <Link to="/schedule" className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl hover:border-purple-300 dark:hover:border-purple-700 transition-colors block">
              <div className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 w-14 h-14 rounded-2xl flex items-center justify-center mb-6"><Calendar size={28} /></div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">My Schedule</p>
              <h3 className="text-3xl font-black text-slate-800 dark:text-white">{todaySchedule.length}</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-4">Classes today · View full schedule →</p>
            </Link>
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 w-14 h-14 rounded-2xl flex items-center justify-center mb-6"><ClipboardList size={28} /></div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Pending Plans</p>
              <h3 className="text-3xl font-black text-slate-800 dark:text-white">{dashboard?.pendingPlansCount ?? pendingPlans}</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-4">Awaiting head of department review</p>
            </div>
          </div>

          {/* My Assigned Classes */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white">My Assigned Classes</h3>
                <p className="text-xs text-slate-500 mt-0.5">Classes assigned to you from the school administration</p>
              </div>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-bold">{myClasses.length} class{myClasses.length !== 1 ? 'es' : ''}</span>
            </div>
            {myClasses.length === 0 ? (
              <div className="p-12 text-center">
                <div className="bg-slate-50 dark:bg-slate-800 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"><Users size={28} className="text-slate-400" /></div>
                <p className="font-bold text-slate-500 dark:text-slate-400">No classes assigned yet</p>
                <p className="text-xs text-slate-400 mt-1">Contact the school admin to assign classes to you.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {myClasses.map((cls: any) => (
                  <div key={cls.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <BookOpen size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white">
                          {cls.name || cls.class_name || `Grade ${cls.grade_level}`}
                          {cls.section ? ` — Section ${cls.section}` : ''}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {cls.subject && cls.subject !== 'Assigned Class' ? cls.subject : 'General Class'}
                          {cls.grade_level ? ` · Grade ${cls.grade_level}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Students</p>
                        <p className="font-black text-slate-800 dark:text-white">{cls.enrolledStudents ?? '—'}</p>
                      </div>
                      <Link to="/attendance" className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors">
                        Attendance
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : activeTab === 'plans' ? (
        /* Weekly Plans Tab */
        <div className="space-y-6">
          {/* Sub-tab Switcher & Simulation Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
            {isDean ? (
              <div className="flex gap-6">
                <button
                  type="button"
                  onClick={() => setWeeklyPlanSubTab('my-plans')}
                  className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
                    weeklyPlanSubTab === 'my-plans'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  My Weekly Plans
                </button>
                <button
                  type="button"
                  onClick={() => setWeeklyPlanSubTab('dept-plans')}
                  className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
                    weeklyPlanSubTab === 'dept-plans'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Department Submissions
                </button>
              </div>
            ) : (
              <div className="text-xs font-black uppercase tracking-wider text-slate-400 pb-2">
                Teacher Panel
              </div>
            )}
            
            {/* Elegant simulation toggle to facilitate testing both states easily */}
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                🧪 Promote to Department Head (Simulation)
              </span>
              <input
                title="Toggle Department Head simulation"
                type="checkbox"
                checked={simulateDeanMode}
                onChange={e => {
                  setSimulateDeanMode(e.target.checked);
                  if (!e.target.checked) {
                    setWeeklyPlanSubTab('my-plans');
                  }
                }}
                className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
              />
            </div>
          </div>

          {(!isDean || weeklyPlanSubTab === 'my-plans') ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in duration-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                  <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Weekly Plans</h2>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Submit lesson plans for head of department review</p>
                </div>
                <button onClick={() => {
                  setEditingPlan(null);
                  // Restore locally-saved draft if one exists
                  const draft = loadLocalDraft();
                  setPlanForm(draft ?? emptyPlan);
                  setIsPlanModalOpen(true);
                }}
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
                                    {[1, 2, 3].map(n => (
                                      <Star key={n} size={10} className={n <= plan.dean_rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'} />
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : <span className="text-xs text-slate-400">—</span>}
                          </td>
                          <td className="px-4 py-4 flex gap-2">
                            {(plan.status === 'Draft' || plan.status === 'Revision Required') && (
                              <>
                                <button onClick={() => openEditModal(plan)}
                                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-200 transition-colors">
                                  Edit
                                </button>
                                <button onClick={async () => {
                                  const submittedPlan = { ...plan, status: 'Pending', teacher_name: user?.name || 'Assigned Teacher', teacherName: user?.name || 'Assigned Teacher' };
                                  try {
                                    await updateWeeklyPlan(plan.id, { ...plan, status: 'Pending' });
                                    showToast('Plan submitted to Department Head!', 'success');
                                    const updatedPlans = await getMyWeeklyPlans();
                                    setPlans(Array.isArray(updatedPlans) ? updatedPlans : []);
                                  } catch {
                                    // Simulation fallback — always works offline
                                  }
                                  // Always update local state so it's visible immediately
                                  setPlans(prev => prev.map(p => p.id === plan.id ? submittedPlan : p));
                                  setDeptPlans(prev => {
                                    const exists = prev.some(p => p.id === plan.id);
                                    if (exists) return prev.map(p => p.id === plan.id ? submittedPlan : p);
                                    return [submittedPlan, ...prev]; // Add if not yet in dept queue
                                  });
                                  showToast('Plan submitted to Department Head!', 'success');
                                }}
                                  className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-200 transition-colors flex items-center gap-1">
                                  <CheckCircle2 size={14} /> Submit
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Department Tasks Tab inside Weekly Plans */
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in duration-200">
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
                      onClick={() => {
                        setSelectedPlanForView(plan);
                        setReviewRating(plan.dean_rating || plan.rating || 0);
                        setReviewFeedback(plan.dean_feedback || plan.feedback || '');
                      }}
                      className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-900 transition-all p-6 space-y-4 group cursor-pointer relative overflow-hidden"
                    >
                      {/* Interactive hover indicator */}
                      <div className="absolute top-0 right-0 w-2 h-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      {/* Header */}
                      <div className="border-b border-slate-100 dark:border-slate-700 pb-3">
                        <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                          {plan.teacher_name || plan.teacherName}
                        </h3>
                        <p className="text-xs text-slate-500 font-bold uppercase mt-1">{plan.subject || '—'}</p>
                      </div>

                      {/* Plan Details Preview */}
                      <div className="space-y-2 text-xs">
                        <div>
                          <label className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Date</label>
                          <p className="text-slate-800 dark:text-slate-200 font-medium mt-0.5">{plan.date?.slice(0, 10)}</p>
                        </div>
                        <div>
                          <label className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Topic / Content</label>
                          <p className="text-slate-800 dark:text-slate-200 line-clamp-2 mt-0.5 font-medium">{plan.content}</p>
                        </div>
                        <div>
                          <label className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Objectives</label>
                          <p className="text-slate-800 dark:text-slate-200 line-clamp-2 mt-0.5 font-medium">{plan.objectives}</p>
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
                        
                        {(plan.dean_rating || plan.rating) ? (
                          <div className="flex gap-0.5">
                            {[1, 2, 3].map(star => (
                              <Star
                                key={star}
                                size={12}
                                className={star <= (plan.dean_rating || plan.rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'}
                              />
                            ))}
                          </div>
                        ) : null}
                      </div>

                      {/* Feedback comment preview */}
                      {(plan.dean_feedback || plan.feedback) && (
                        <div className="bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Comments</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 truncate mt-0.5 font-medium">
                            {plan.dean_feedback || plan.feedback}
                          </p>
                        </div>
                      )}

                      <div className="text-center pt-2">
                        <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest group-hover:underline">
                          View & Evaluate Plan →
                        </span>
                      </div>
                    </div>
                  ))
                )}
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

            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="planDate" className="text-xs font-bold text-slate-500 uppercase">Date</label>
                  <input id="planDate" type="date" required value={planForm.date}
                    onChange={e => {
                      const updated = { ...planForm, date: e.target.value };
                      setPlanForm(updated);
                      if (!editingPlan) saveDraftLocally(updated);
                    }}
                    className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="planTimeDuration" className="text-xs font-bold text-slate-500 uppercase">Time Duration</label>
                  <input id="planTimeDuration" type="text" required placeholder="e.g. 45 minutes" value={planForm.timeDuration}
                    onChange={e => {
                      const updated = { ...planForm, timeDuration: e.target.value };
                      setPlanForm(updated);
                      if (!editingPlan) saveDraftLocally(updated);
                    }}
                    className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="planCourseId" className="text-xs font-bold text-slate-500 uppercase">Course / Subject</label>
                  <select
                    id="planCourseId"
                    required
                    value={planForm.courseId || ''}
                    onChange={e => {
                      const updated = {
                        ...planForm,
                        courseId: e.target.value,
                        subject: myCourses.find((c: any) => c.id === e.target.value)?.name || ''
                      };
                      setPlanForm(updated);
                      if (!editingPlan) saveDraftLocally(updated);
                    }}
                    className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Course / Subject</option>
                    {myCourses.length === 0 && (
                      <option value="" disabled>No courses assigned yet</option>
                    )}
                    {myCourses.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name}{c.code ? ` (${c.code})` : ''}{c.class_name ? ` — ${c.class_name}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="planDeptHeadId" className="text-xs font-bold text-slate-500 uppercase">Department Head</label>
                  <select
                    id="planDeptHeadId"
                    required
                    value={planForm.deptHeadId || ''}
                    onChange={e => {
                      const updated = { ...planForm, deptHeadId: e.target.value };
                      setPlanForm(updated);
                      if (!editingPlan) saveDraftLocally(updated);
                    }}
                    className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Department Head</option>
                    {deptHeads.length === 0 && (
                      <option value="" disabled>No department heads found</option>
                    )}
                    {deptHeads.map((dh: any) => (
                      <option key={dh.teacher_id} value={dh.teacher_id}>
                        {dh.name}{dh.department ? ` — ${dh.department}` : ''}
                      </option>
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
                    onChange={e => {
                      const updated = { ...planForm, [key]: e.target.value };
                      setPlanForm(updated);
                      if (!editingPlan) saveDraftLocally(updated);
                    }}
                    className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              ))}

              {/* Draft notice for new plans */}
              {!editingPlan && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 rounded-lg">
                  <Save size={14} className="text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                    Your progress is automatically saved locally. Click <strong>Save Draft</strong> to store it on the server and continue later.
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                <button type="button"
                  onClick={() => { setIsPlanModalOpen(false); setEditingPlan(null); }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-sm text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  disabled={submitting}>
                  Cancel
                </button>
                {/* Save Draft */}
                <button type="button"
                  onClick={() => handleSavePlan('Draft')}
                  disabled={submitting}
                  className="flex items-center justify-center gap-2 px-5 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors">
                  {submitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  {editingPlan ? 'Update Draft' : 'Save Draft'}
                </button>
                {/* Submit for review */}
                <button type="button"
                  onClick={() => handleSavePlan('Pending')}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {submitting ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                  {editingPlan ? 'Submit for Review' : 'Submit Plan'}
                </button>
              </div>
            </div>
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

      {/* Plan Details & Evaluation Modal */}
      {selectedPlanForView && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-600 text-white rounded-2xl"><FileText size={20} /></div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    Lesson Plan Detail Sheet
                  </h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                    Submitted by {selectedPlanForView.teacher_name || selectedPlanForView.teacherName || 'Assigned Teacher'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlanForView(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {/* Plan Header Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Date</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{selectedPlanForView.date?.slice(0, 10)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Time Duration</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{selectedPlanForView.time_duration || selectedPlanForView.timeDuration || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Course / Subject</p>
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-0.5">{selectedPlanForView.subject || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Status</p>
                  <span className={`inline-block mt-0.5 px-3 py-0.5 rounded-full text-[9px] font-black uppercase ${
                    selectedPlanForView.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' :
                    selectedPlanForView.status === 'Revision Required' ? 'bg-orange-100 text-orange-600' :
                    selectedPlanForView.status === 'Draft' ? 'bg-slate-100 text-slate-600' :
                    'bg-amber-100 text-amber-600'
                  }`}>{selectedPlanForView.status}</span>
                </div>
              </div>

              {/* Plan Body Sections */}
              <div className="space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">Content / Topic</h4>
                  <p className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{selectedPlanForView.content}</p>
                </div>

                <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">Specific Objectives</h4>
                  <p className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{selectedPlanForView.objectives}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">Teacher Activity</h4>
                    <p className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{selectedPlanForView.teacher_activity || selectedPlanForView.teacherActivity || '—'}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">Student Activity</h4>
                    <p className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{selectedPlanForView.student_activity || selectedPlanForView.studentActivity || '—'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">Teaching Method</h4>
                    <p className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{selectedPlanForView.teaching_method || selectedPlanForView.teachingMethod || '—'}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">Teaching Aids</h4>
                    <p className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{selectedPlanForView.teaching_aids || selectedPlanForView.teachingAids || '—'}</p>
                  </div>
                </div>

                <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">Evaluation</h4>
                  <p className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{selectedPlanForView.evaluation || '—'}</p>
                </div>

                {selectedPlanForView.remark && (
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">Remark</h4>
                    <p className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{selectedPlanForView.remark}</p>
                  </div>
                )}
              </div>

              {/* Interactive Department Head Review Form */}
              <div className="mt-8 p-6 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-3xl space-y-4">
                <h4 className="text-sm font-black text-blue-900 dark:text-blue-400 uppercase tracking-tight">Department Head Evaluation</h4>
                
                {/* Star Rating Selection */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Rate Plan Quality (1-3 Stars)</label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="focus:outline-none transition-transform hover:scale-125"
                      >
                        <Star
                          size={28}
                          className={
                            star <= reviewRating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-300 dark:text-slate-600'
                          }
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Feedback Textarea */}
                <div>
                  <label htmlFor="modalReviewFeedback" className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Feedback / Revision Comments</label>
                  <textarea
                    id="modalReviewFeedback"
                    rows={3}
                    placeholder="Provide comments, suggestions, or specify revision instructions..."
                    value={reviewFeedback}
                    onChange={e => setReviewFeedback(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                {/* Action buttons inside evaluation */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      handleApproveDeptPlan(selectedPlanForView.id, reviewRating, reviewFeedback);
                      setSelectedPlanForView(null);
                    }}
                    className="flex-1 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    ✓ Approve Plan
                  </button>
                  <button
                    onClick={() => {
                      if (!reviewFeedback.trim()) {
                        showToast('Please enter revision comments first!', 'error');
                        return;
                      }
                      handleRejectDeptPlan(selectedPlanForView.id, reviewRating, reviewFeedback);
                      setSelectedPlanForView(null);
                    }}
                    className="flex-1 px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
                  >
                    ⟲ Request Revision
                  </button>
                </div>
              </div>
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
