import { Users, GraduationCap, Clock, ShieldCheck, FileText, CheckCircle2, XCircle, Star, ChevronRight, TrendingUp, AlertTriangle, Calendar, BarChart3, Lock, ShieldAlert, Award } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getVPDashboard,
  getAbsenceQueue,
  getWeeklyPlans,
  updateAbsenceStatus,
  reviewWeeklyPlan,
  getVPGradeSubmissions,
  getVPSubmittedGrades
} from '../services/vicePrincipalService';

const StatCard = ({ icon: Icon, label, value, color }: any) => (
  <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800/80 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
    <div className="flex items-center justify-between mb-4">
      <div className={`${color} p-3 rounded-2xl text-white`}><Icon size={20} /></div>
    </div>
    <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">{label}</h3>
    <p className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-1">{value}</p>
  </div>
);

export const VicePrincipalDashboard = () => {
  const { user } = useUser();
  const [dashboard, setDashboard] = useState<any>(null);
  const [absences, setAbsences] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const [reviewModal, setReviewModal] = useState<{ show: boolean; plan: any }>({ show: false, plan: null });
  const [reviewData, setReviewData] = useState({ status: 'Approved' as 'Approved' | 'Revision Required', deanFeedback: '', deanRating: 5 });
  
  // Inspect submitted grades modal state
  const [inspectModal, setInspectModal] = useState<{ show: boolean; submission: any; grades: any[] }>({ show: false, submission: null, grades: [] });
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [dash, absenceRes, plansRes, submissionsRes] = await Promise.all([
        getVPDashboard(),
        getAbsenceQueue('pending'),
        getWeeklyPlans('Pending'),
        getVPGradeSubmissions()
      ]);
      setDashboard(dash);
      setAbsences(absenceRes.data || []);
      setPlans(plansRes.data || []);
      setSubmissions(submissionsRes || []);
    } catch (err) {
      console.error('VP Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleAbsenceAction = async (id: string, status: 'excused' | 'notified') => {
    try {
      await updateAbsenceStatus(id, status);
      showToast(`Absence marked as ${status}`, 'success');
      setAbsences(prev => prev.filter(a => a.id !== id));
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Action failed', 'error');
    }
  };

  const handleReviewPlan = async () => {
    if (!reviewModal.plan) return;
    setSubmitting(true);
    try {
      await reviewWeeklyPlan(reviewModal.plan.id, {
        status: reviewData.status,
        deanFeedback: reviewData.deanFeedback || undefined,
        deanRating: reviewData.deanRating
      });
      showToast('Lesson plan reviewed successfully!', 'success');
      setReviewModal({ show: false, plan: null });
      setPlans(prev => prev.filter(p => p.id !== reviewModal.plan.id));
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Review failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInspectSubmission = async (submission: any) => {
    setInspectModal({ show: true, submission, grades: [] });
    setLoadingGrades(true);
    try {
      const data = await getVPSubmittedGrades(submission.course_id, submission.submission_type);
      setInspectModal(prev => ({ ...prev, grades: Array.isArray(data) ? data : [] }));
    } catch (err) {
      console.error('Failed to fetch inspected grades:', err);
      showToast('Failed to load submitted grades list.', 'error');
    } finally {
      setLoadingGrades(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <p className="text-slate-500 dark:text-slate-400 animate-pulse font-medium">Assembling VP Portal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header section with glassmorphic visuals */}
      <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 text-white rounded-[2rem] p-8 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.2),_transparent_50%)]" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl transform translate-x-20 -translate-y-20"></div>
        <div className="relative z-10">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-indigo-400 mb-2">Vice Principal Portal</p>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Academic Oversight, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-300">VP {user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-slate-400 text-sm mt-3 max-w-2xl font-medium leading-relaxed">
            Monitor and review weekly lesson plans, process student absences, and review locked grade submissions from teachers to ensure high academic standards.
          </p>
        </div>
      </section>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <a href="#lesson-plans" className="block">
          <StatCard 
            icon={FileText} 
            label="Pending Plans" 
            value={dashboard?.pendingPlansCount ?? plans.length} 
            color="bg-indigo-600 shadow-lg shadow-indigo-600/10" 
          />
        </a>
        <a href="#absence-queue" className="block">
          <StatCard 
            icon={Users} 
            label="Pending Absences" 
            value={dashboard?.pendingAbsencesCount ?? absences.length} 
            color="bg-rose-600 shadow-lg shadow-rose-600/10" 
          />
        </a>
        <Link to="/vp-attendance" className="block">
          <StatCard 
            icon={Clock} 
            label="Today's Attendance" 
            value={dashboard?.todayAttendanceRate ? `${dashboard.todayAttendanceRate.toFixed(1)}%` : '—'} 
            color="bg-emerald-600 shadow-lg shadow-emerald-600/10" 
          />
        </Link>
        <a href="#grade-submissions" className="block">
          <StatCard 
            icon={ShieldCheck} 
            label="Grade Submissions" 
            value={submissions.length} 
            color="bg-purple-600 shadow-lg shadow-purple-600/10" 
          />
        </a>
      </div>

      {/* Main content split */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Column 1: Pending Lesson Plans */}
        <div id="lesson-plans" className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-sm overflow-hidden flex flex-col justify-between h-[450px]">
          <div>
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white">Weekly Plans Queue</h3>
                <p className="text-xs text-slate-500 mt-0.5">Review and authorize teacher lesson plans</p>
              </div>
              <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold">{plans.length} pending</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[300px] overflow-y-auto">
              {plans.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <FileText className="mx-auto mb-3 text-slate-300 dark:text-slate-700" size={40} />
                  <p className="text-slate-500 text-sm font-medium">All plans reviewed</p>
                  <p className="text-slate-400 text-xs mt-1">Excellent! No plans are pending review.</p>
                </div>
              ) : (
                plans.map((plan) => (
                  <div key={plan.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="font-bold text-slate-800 dark:text-white text-sm truncate">{plan.teacher_name}</p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        Week {plan.week_number} · {plan.subject || 'Generic'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setReviewModal({ show: true, plan });
                        setReviewData({ status: 'Approved', deanFeedback: '', deanRating: 5 });
                      }}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                    >
                      Review
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="p-4 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              Authorized Plans are instantly updated
            </p>
          </div>
        </div>

        {/* Column 2: Absence Queue */}
        <div id="absence-queue" className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-sm overflow-hidden flex flex-col justify-between h-[450px]">
          <div>
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white">Absence Queue</h3>
                <p className="text-xs text-slate-500 mt-0.5">Approve and track student absence flags</p>
              </div>
              <span className="px-3 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-full text-xs font-bold">{absences.length} pending</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[300px] overflow-y-auto">
              {absences.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <CheckCircle2 className="mx-auto mb-3 text-slate-300 dark:text-slate-700" size={40} />
                  <p className="text-slate-500 text-sm font-medium">No pending absences</p>
                  <p className="text-slate-400 text-xs mt-1">Daily roster is perfectly clear.</p>
                </div>
              ) : (
                absences.map((absence) => (
                  <div key={absence.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="font-bold text-slate-800 dark:text-white text-sm truncate">{absence.student_name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Grade {absence.grade} · {new Date(absence.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleAbsenceAction(absence.id, 'excused')}
                        className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-xl transition-all"
                        title="Excuse"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                      <button
                        onClick={() => handleAbsenceAction(absence.id, 'notified')}
                        className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 hover:bg-amber-600 hover:text-white rounded-xl transition-all"
                        title="Notify"
                      >
                        <AlertTriangle size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="p-4 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              Excused flags alert parents instantly
            </p>
          </div>
        </div>

        {/* Column 3: Grade Submissions Verification */}
        <div id="grade-submissions" className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-sm overflow-hidden flex flex-col justify-between h-[450px]">
          <div>
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white">Grade Submissions</h3>
                <p className="text-xs text-slate-500 mt-0.5">Locked assessment logs from teachers</p>
              </div>
              <span className="px-3 py-1 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-full text-xs font-bold">{submissions.length} locked</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[300px] overflow-y-auto">
              {submissions.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <Lock className="mx-auto mb-3 text-slate-300 dark:text-slate-700" size={40} />
                  <p className="text-slate-500 text-sm font-medium">No grade submissions yet</p>
                  <p className="text-slate-400 text-xs mt-1">Teachers have not submitted final sheets.</p>
                </div>
              ) : (
                submissions.map((sub) => (
                  <div key={sub.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="font-bold text-slate-800 dark:text-white text-sm truncate">{sub.course_name}</p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {sub.submission_type} · Locked
                      </p>
                    </div>
                    <button
                      onClick={() => handleInspectSubmission(sub)}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all"
                    >
                      Inspect
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="p-4 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              Submitted grades are locked securely
            </p>
          </div>
        </div>

      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link 
          to="/vp-attendance" 
          className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-3xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group shadow-md shadow-emerald-500/10"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-2xl">
              <BarChart3 size={24} />
            </div>
            <ChevronRight className="group-hover:translate-x-1.5 transition-transform" size={20} />
          </div>
          <h3 className="font-bold text-lg mb-1">Attendance Oversight</h3>
          <p className="text-emerald-50/90 text-sm font-medium">Audit daily student presence matrices</p>
        </Link>

        <Link 
          to="/vp-grade-locks" 
          className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-3xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group shadow-md shadow-purple-500/10"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-2xl">
              <Lock size={24} />
            </div>
            <ChevronRight className="group-hover:translate-x-1.5 transition-transform" size={20} />
          </div>
          <h3 className="font-bold text-lg mb-1">Grade Entry Controls</h3>
          <p className="text-purple-50/90 text-sm font-medium">Lock/unlock grades entry periods globally</p>
        </Link>

        <Link 
          to="/vp-transcripts" 
          className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-3xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group shadow-md shadow-indigo-500/10"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-2xl">
              <GraduationCap size={24} />
            </div>
            <ChevronRight className="group-hover:translate-x-1.5 transition-transform" size={20} />
          </div>
          <h3 className="font-bold text-lg mb-1">Transcripts & Record Archive</h3>
          <p className="text-indigo-50/90 text-sm font-medium">Verify student histories and transcripts</p>
        </Link>
      </div>

      {/* Review Plan Modal */}
      {reviewModal.show && reviewModal.plan && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
              <h3 className="font-bold text-slate-800 dark:text-white text-lg">Review Lesson Plan</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{reviewModal.plan.teacher_name} · Week {reviewModal.plan.week_number}</p>
            </div>

            <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto">
              {reviewModal.plan.course_name && (
                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 rounded-2xl p-4">
                  <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-1">Subject / Course</p>
                  <p className="text-sm font-bold text-indigo-900 dark:text-indigo-200">{reviewModal.plan.course_name}</p>
                </div>
              )}
              {[
                { label: 'Objectives & Target Outcomes', value: reviewModal.plan.objectives },
                { label: 'Teacher Activity / Presentation', value: reviewModal.plan.teacher_activity },
                { label: 'Student Activity / Engagement', value: reviewModal.plan.student_activity },
                { label: 'Evaluation Methodology', value: reviewModal.plan.evaluation },
              ].map(({ label, value }) => value && (
                <div key={label} className="space-y-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-850 p-3 rounded-2xl whitespace-pre-wrap border border-slate-100 dark:border-slate-800/40">{value}</p>
                </div>
              ))}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Review Decision</label>
                <select
                  value={reviewData.status}
                  onChange={(e) => setReviewData({ ...reviewData, status: e.target.value as any })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                >
                  <option value="Approved">Approve Lesson Plan</option>
                  <option value="Revision Required">Flag Revision Required</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Plan Performance Rating</label>
                <div className="flex gap-1.5">
                  {[1,2,3,4,5].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setReviewData({ ...reviewData, deanRating: n })}
                      className={`p-1.5 rounded-xl transition-all hover:scale-110 ${
                        reviewData.deanRating >= n 
                          ? 'text-amber-500' 
                          : 'text-slate-300 dark:text-slate-700 hover:text-slate-400'
                      }`}
                    >
                      <Star size={24} fill={reviewData.deanRating >= n ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dean/VP Feedback Comments</label>
                <textarea
                  value={reviewData.deanFeedback}
                  onChange={(e) => setReviewData({ ...reviewData, deanFeedback: e.target.value })}
                  rows={3}
                  placeholder="Provide recommendations or notes for the teacher..."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex gap-3 bg-slate-50/50 dark:bg-slate-800/20">
              <button
                onClick={() => setReviewModal({ show: false, plan: null })}
                className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleReviewPlan}
                className={`flex-1 py-2.5 rounded-2xl font-bold text-sm text-white disabled:opacity-50 transition-all ${
                  reviewData.status === 'Approved' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/10' : 'bg-orange-600 hover:bg-orange-700 shadow-md shadow-orange-500/10'
                }`}
                disabled={submitting}
              >
                {submitting ? 'Saving...' : reviewData.status === 'Approved' ? 'Approve & Release' : 'Request Revision'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Submitted Grades Modal */}
      {inspectModal.show && inspectModal.submission && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-lg flex items-center gap-2">
                  <ShieldCheck size={20} className="text-purple-500" />
                  <span>Inspecting Submitted Sheet</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Course ID: {inspectModal.submission.course_name} · Type: {inspectModal.submission.submission_type}
                </p>
              </div>
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 rounded-full text-xs font-black uppercase flex items-center gap-1">
                <Lock size={12} /> LOCKED
              </span>
            </div>

            <div className="p-6 max-h-[50vh] overflow-y-auto">
              {loadingGrades ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-purple-600/30 border-t-purple-600 rounded-full animate-spin mb-2" />
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">Decrypting secure grade storage...</p>
                </div>
              ) : inspectModal.grades.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <ShieldAlert className="mx-auto mb-2 text-slate-300" size={36} />
                  <p className="text-sm font-semibold">No grade entries found under this locked submission.</p>
                </div>
              ) : (
                <div className="border border-slate-100 dark:border-slate-850 rounded-2xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="px-5 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Student Name</th>
                        <th className="px-5 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">ID</th>
                        <th className="px-5 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase text-center">Score</th>
                        <th className="px-5 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase text-right">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {inspectModal.grades.map((g: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-slate-200 text-sm">{g.student_name}</td>
                          <td className="px-5 py-3.5 text-xs font-semibold text-slate-500 font-mono">{g.digital_id}</td>
                          <td className="px-5 py-3.5 text-center">
                            <span className="font-extrabold text-sm text-purple-600 dark:text-purple-400">
                              {g.score}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">/{g.total}</span>
                          </td>
                          <td className="px-5 py-3.5 text-right text-xs text-slate-500 dark:text-slate-400 font-medium">
                            {g.remarks || 'None'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex justify-end">
              <button
                onClick={() => setInspectModal({ show: false, submission: null, grades: [] })}
                className="px-6 py-2.5 bg-slate-900 dark:bg-slate-850 hover:bg-slate-800 text-white rounded-2xl font-bold text-sm transition-all"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast alert component */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl border ${
            toast.type === 'success'
              ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/40 text-green-800 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-300'
          }`}>
            {toast.type === 'success'
              ? <CheckCircle2 className="text-emerald-500" size={20} />
              : <XCircle className="text-rose-500" size={20} />
            }
            <p className="text-sm font-semibold">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};
