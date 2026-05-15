import { Users, GraduationCap, Clock, ShieldCheck, FileText, CheckCircle2, XCircle, Star, ChevronRight } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useState, useEffect } from 'react';
import { getVPDashboard, getAbsenceQueue, getWeeklyPlans, updateAbsenceStatus, reviewWeeklyPlan } from '../services/vicePrincipalService';

const StatCard = ({ icon: Icon, label, value, color }: any) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all">
    <div className="flex items-center justify-between mb-4">
      <div className={`${color} p-3 rounded-xl text-white`}><Icon size={20} /></div>
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
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const [reviewModal, setReviewModal] = useState<{ show: boolean; plan: any }>({ show: false, plan: null });
  const [reviewData, setReviewData] = useState({ status: 'Approved' as 'Approved' | 'Revision Required', deanFeedback: '', deanRating: 5 });
  const [submitting, setSubmitting] = useState(false);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [dash, absenceRes, plansRes] = await Promise.all([
          getVPDashboard(),
          getAbsenceQueue('pending'),
          getWeeklyPlans('Pending')
        ]);
        setDashboard(dash);
        setAbsences(absenceRes.data || []);
        setPlans(plansRes.data || []);
      } catch (err) {
        console.error('VP Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.15),_transparent_40%)]" />
        <div className="relative">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-indigo-300 mb-2">Vice Principal Portal</p>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter">
            Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">VP {user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2">Academic oversight dashboard — review plans, manage absences, monitor performance.</p>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={FileText} label="Pending Plans" value={dashboard?.pendingPlansCount ?? plans.length} color="bg-indigo-600" />
        <StatCard icon={Users} label="Pending Absences" value={dashboard?.pendingAbsencesCount ?? absences.length} color="bg-rose-600" />
        <StatCard icon={Clock} label="Today's Attendance" value={dashboard?.todayAttendanceRate ? `${dashboard.todayAttendanceRate.toFixed(1)}%` : '—'} color="bg-emerald-600" />
        <StatCard icon={ShieldCheck} label="Grade Locks" value="Manage" color="bg-purple-600" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Pending Lesson Plans */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white">Pending Lesson Plans</h3>
              <p className="text-xs text-slate-500 mt-0.5">Review and approve teacher submissions</p>
            </div>
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">{plans.length} pending</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {plans.length === 0 ? (
              <p className="px-6 py-8 text-center text-slate-500 text-sm">No pending lesson plans 🎉</p>
            ) : (
              plans.slice(0, 5).map((plan) => (
                <div key={plan.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white text-sm">{plan.teacher_name}</p>
                    <p className="text-xs text-slate-500">Week {plan.week_number} · {plan.date?.slice(0, 10)}</p>
                  </div>
                  <button
                    onClick={() => {
                      setReviewModal({ show: true, plan });
                      setReviewData({ status: 'Approved', deanFeedback: '', deanRating: 5 });
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700"
                  >
                    Review <ChevronRight size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Absence Queue */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white">Absence Queue</h3>
              <p className="text-xs text-slate-500 mt-0.5">Pending student absences to review</p>
            </div>
            <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold">{absences.length} pending</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {absences.length === 0 ? (
              <p className="px-6 py-8 text-center text-slate-500 text-sm">No pending absences 🎉</p>
            ) : (
              absences.slice(0, 5).map((absence) => (
                <div key={absence.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white text-sm">{absence.student_name}</p>
                    <p className="text-xs text-slate-500">Grade {absence.grade} · {absence.date?.slice(0, 10)} · {absence.reason}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAbsenceAction(absence.id, 'excused')}
                      className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                      title="Mark Excused"
                    >
                      <CheckCircle2 size={16} />
                    </button>
                    <button
                      onClick={() => handleAbsenceAction(absence.id, 'notified')}
                      className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                      title="Mark Notified"
                    >
                      <GraduationCap size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Review Plan Modal */}
      {reviewModal.show && reviewModal.plan && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 w-full max-w-lg">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-white text-lg">Review Lesson Plan</h3>
              <p className="text-sm text-slate-500">{reviewModal.plan.teacher_name} · Week {reviewModal.plan.week_number}</p>
            </div>

            <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto">
              {[
                { label: 'Objectives', value: reviewModal.plan.objectives },
                { label: 'Activities', value: reviewModal.plan.activities },
                { label: 'Materials', value: reviewModal.plan.materials },
                { label: 'Assessment', value: reviewModal.plan.assessment },
              ].map(({ label, value }) => value && (
                <div key={label}>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">{label}</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-lg p-3">{value}</p>
                </div>
              ))}

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Decision</label>
                <select
                  value={reviewData.status}
                  onChange={(e) => setReviewData({ ...reviewData, status: e.target.value as any })}
                  className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Approved">Approve</option>
                  <option value="Revision Required">Request Revision</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Rating (1-5)</label>
                <div className="flex gap-2 mt-1">
                  {[1,2,3,4,5].map(n => (
                    <button
                      key={n}
                      onClick={() => setReviewData({ ...reviewData, deanRating: n })}
                      className={`p-2 rounded-lg transition-colors ${reviewData.deanRating >= n ? 'text-amber-500' : 'text-slate-300'}`}
                    >
                      <Star size={20} fill={reviewData.deanRating >= n ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Feedback (Optional)</label>
                <textarea
                  value={reviewData.deanFeedback}
                  onChange={(e) => setReviewData({ ...reviewData, deanFeedback: e.target.value })}
                  rows={3}
                  placeholder="Add feedback for the teacher..."
                  className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <button
                onClick={() => setReviewModal({ show: false, plan: null })}
                className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-sm hover:bg-slate-50"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleReviewPlan}
                className={`flex-1 py-2 rounded-lg font-bold text-sm text-white disabled:opacity-50 ${
                  reviewData.status === 'Approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'
                }`}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : reviewData.status === 'Approved' ? 'Approve Plan' : 'Request Revision'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border ${
            toast.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            {toast.type === 'success'
              ? <CheckCircle2 className="text-green-600" size={20} />
              : <XCircle className="text-red-600" size={20} />
            }
            <p className={`text-sm font-bold ${toast.type === 'success' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
              {toast.message}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
