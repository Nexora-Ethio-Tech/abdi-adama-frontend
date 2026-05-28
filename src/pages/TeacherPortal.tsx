import { BookOpen, Users, Calendar, ArrowRight, ClipboardList, FileText, Plus, X, CheckCircle2, XCircle, Loader2, Star } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { getTeacherDashboard, getMyWeeklyPlans, submitWeeklyPlan, updateWeeklyPlan } from '../services/teacherService';

export const TeacherPortal = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'overview' | 'plans' | 'dept-tasks'>('overview');
  const [dashboard, setDashboard] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  // Department Tasks states
  const [deptSearch, setDeptSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [reviewingPlanId, setReviewingPlanId] = useState<string | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [deptPlans, setDeptPlans] = useState<any[]>([
    {
      id: 'mock-1',
      teacherName: 'Abebe Bikila',
      subject: 'Mathematics',
      date: '2026-06-01',
      content: 'Algebra - Quadratic Equations and Functions',
      objectives: 'Students will learn to solve quadratic equations using factoring and the quadratic formula.',
      teachingMethod: 'Guided discovery and classroom exercises',
      duration: '45 minutes',
      status: 'Pending',
      feedback: '',
    },
    {
      id: 'mock-2',
      teacherName: 'Aster Aweke',
      subject: 'English Language',
      date: '2026-06-02',
      content: 'Grammar - Present Perfect and Past Simple Tenses',
      objectives: 'Differentiate between present perfect and past simple in conversation and writing.',
      teachingMethod: 'Interactive dialogue and peer correction',
      duration: '45 minutes',
      status: 'Approved',
      feedback: 'Excellent structure, activities are well-planned.',
    },
    {
      id: 'mock-3',
      teacherName: 'Tilahun Gessese',
      subject: 'Chemistry',
      date: '2026-06-03',
      content: 'Atomic Structure and Periodic Trends',
      objectives: 'Explain periodic trends in electronegativity, ionization energy, and atomic radius.',
      teachingMethod: 'Multimedia presentation and practice problems',
      duration: '50 minutes',
      status: 'Revision Required',
      feedback: 'Please add details about laboratory safety procedures.',
    }
  ]);

  const filteredDeptPlans = deptPlans.filter(plan => {
    const matchesSearch = plan.teacherName.toLowerCase().includes(deptSearch.toLowerCase()) || plan.subject.toLowerCase().includes(deptSearch.toLowerCase());
    const matchesFilter = deptFilter === 'All' || plan.status === deptFilter;
    return matchesSearch && matchesFilter;
  });

  const handleApproveDeptPlan = (id: string) => {
    setDeptPlans(prev => prev.map(p => p.id === id ? { ...p, status: 'Approved', feedback: 'Approved by Department Head' } : p));
    showToast('Plan approved successfully!', 'success');
  };

  const handleRejectDeptPlan = () => {
    if (!reviewingPlanId) return;
    setDeptPlans(prev => prev.map(p => p.id === reviewingPlanId ? { ...p, status: 'Revision Required', feedback: reviewFeedback } : p));
    setReviewingPlanId(null);
    setReviewFeedback('');
    showToast('Revision request submitted!', 'success');
  };

  const emptyPlan = {
    date: new Date().toISOString().split('T')[0],
    content: '', objectives: '', teacherActivity: '',
    timeDuration: '', studentActivity: '', teachingMethod: '',
    teachingAids: '', evaluation: '', remark: '', status: 'Pending' as 'Pending' | 'Draft'
  };
  const [planForm, setPlanForm] = useState(emptyPlan);
  const location = useLocation();

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [dash, planList] = await Promise.all([
        getTeacherDashboard(),
        getMyWeeklyPlans()
      ]);
      setDashboard(dash);
      setPlans(Array.isArray(planList) ? planList : []);
    } catch (err) {
      console.error('Teacher portal error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

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
      status: plan.status || 'Pending'
    });
    setIsPlanModalOpen(true);
  };

  const todaySchedule = dashboard?.todaySchedule || [];
  const pendingPlans = plans.filter(p => p.status === 'Pending').length;

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
      <div className="flex gap-3 p-1.5 bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl w-fit border border-slate-200/50 dark:border-slate-700/50">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'plans', label: 'Weekly Plans' },
          { id: 'dept-tasks', label: 'Department Tasks' },
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
                    {['Date', 'Content', 'Objectives', 'Method', 'Duration', 'Status', 'Feedback', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {plans.length === 0 ? (
                    <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-500">No plans yet. Create your first plan!</td></tr>
                  ) : (
                    plans.map((plan: any) => (
                      <tr key={plan.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/5 transition-colors">
                        <td className="px-4 py-4 text-xs font-bold text-slate-800 dark:text-slate-200">{plan.date?.slice(0, 10)}</td>
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
      ) : (
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
              <select
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Revision Required">Revision Required</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    {['Teacher', 'Subject', 'Date', 'Topic / Content', 'Objectives', 'Status', 'Feedback', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredDeptPlans.length === 0 ? (
                    <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-500">No plans matching the search/filter criteria.</td></tr>
                  ) : (
                    filteredDeptPlans.map((plan: any) => (
                      <tr key={plan.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/5 transition-colors">
                        <td className="px-4 py-4 text-xs font-bold text-slate-800 dark:text-slate-200">{plan.teacherName}</td>
                        <td className="px-4 py-4 text-xs font-semibold text-blue-600 dark:text-blue-400">{plan.subject}</td>
                        <td className="px-4 py-4 text-xs font-bold text-slate-800 dark:text-slate-200">{plan.date}</td>
                        <td className="px-4 py-4 text-xs text-slate-600 dark:text-slate-400 max-w-[120px] truncate" title={plan.content}>{plan.content}</td>
                        <td className="px-4 py-4 text-xs text-slate-600 dark:text-slate-400 max-w-[150px] truncate" title={plan.objectives}>{plan.objectives}</td>
                        <td className="px-4 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${plan.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' :
                              plan.status === 'Revision Required' ? 'bg-orange-100 text-orange-600' :
                                'bg-amber-100 text-amber-600'
                            }`}>{plan.status}</span>
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-500 max-w-[150px] truncate" title={plan.feedback || '—'}>
                          {plan.feedback || <span className="text-slate-400">—</span>}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-2">
                            {plan.status === 'Pending' && (
                              <>
                                <button
                                  onClick={() => handleApproveDeptPlan(plan.id)}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => {
                                    setReviewingPlanId(plan.id);
                                    setReviewFeedback('');
                                  }}
                                  className="px-2.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition-colors"
                                >
                                  Revision
                                </button>
                              </>
                            )}
                            {plan.status !== 'Pending' && (
                              <span className="text-xs text-slate-400 font-medium">Reviewed</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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
      )}

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
              <button onClick={() => { setIsPlanModalOpen(false); setEditingPlan(null); }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmitPlan} className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Date</label>
                  <input type="date" required value={planForm.date}
                    onChange={e => setPlanForm({ ...planForm, date: e.target.value })}
                    className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Time Duration</label>
                  <input type="text" required placeholder="e.g. 45 minutes" value={planForm.timeDuration}
                    onChange={e => setPlanForm({ ...planForm, timeDuration: e.target.value })}
                    className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
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
                  <label className="text-xs font-bold text-slate-500 uppercase">{label}</label>
                  <textarea rows={2} placeholder={placeholder} required={key !== 'remark'}
                    value={(planForm as any)[key]}
                    onChange={e => setPlanForm({ ...planForm, [key]: e.target.value })}
                    className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              ))}

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                <select value={planForm.status} onChange={e => setPlanForm({ ...planForm, status: e.target.value as any })}
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
