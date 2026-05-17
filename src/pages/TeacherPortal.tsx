
import { BookOpen, Users, Calendar, ArrowRight, Award, Save, ChevronRight, History, FileText, MessageSquare, X, Plus, Loader2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { apiFetch } from '../utils/apiClient';
import { toast } from '../components/Toast';

export const TeacherPortal = () => {
  const { user } = useUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const isDean = (user as any)?.is_dean || false;
  const isRoomTeacher = (user as any)?.is_room_teacher || false;

  const [activeTab, setActiveTab] = useState<'overview' | 'plans' | 'communication' | 'review' | 'exams'>('overview');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['overview', 'plans', 'communication', 'review', 'exams'].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
    setActiveTab(tab as any);
  };

  const [assignedSections, setAssignedSections] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [examList, setExamList] = useState<any[]>([]);
  
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [teacherNote, setTeacherNote] = useState('');
  const [, _setIsSaved] = useState(false);
  const [, _setLoading] = useState(false);

  // Exam state
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [examLoading, setExamLoading] = useState(false);
  const [examResults, setExamResults] = useState<any[]>([]);
  const [resultLoading, setResultLoading] = useState(false);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [newExam, setNewExam] = useState<any>({
    title: '',
    subject_id: '',
    section_id: '',
    start_window: '',
    duration_minutes: 60,
    questions: []
  });
  const [newQuestion, setNewQuestion] = useState({ text: '', options: ['', '', '', ''], correct_answer: '', points: 1 });

  const commFields = [
    { id: 'discipline', label: 'Discipline', description: 'Behavior and following rules' },
    { id: 'hygiene', label: 'Hygiene', description: 'Personal cleanliness and uniform' },
    { id: 'participation', label: 'Participation', description: 'In-class activity and engagement' },
    { id: 'homework', label: 'Homework', description: 'Completion and quality of assignments' }
  ];

  const ratingLabels: Record<number, string> = {
    3: 'Excellent',
    2: 'Good',
    1: 'Fair',
    0: 'Needs Improvement'
  };

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [newPlan, setNewPlan] = useState<any>({
    section_id: '',
    week_number: 1,
    content: {
      topic: '',
      objectives: '',
      teacherActivity: '',
      time: '',
      studentActivity: '',
      teachingMethod: '',
      teachingAids: '',
      evaluation: '',
      remark: ''
    }
  });

  // ΓöÇΓöÇΓöÇ Data Fetching ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  
  const fetchSections = async () => {
    try {
      const res = await apiFetch('/api/teacher/sections');
      const data = await res.json();
      if (res.ok) setAssignedSections(data.data || []);
    } catch { toast.error('Failed to load classes.'); }
  };

  const fetchPlans = async () => {
    try {
      const res = await apiFetch('/api/teacher/plans');
      const data = await res.json();
      if (res.ok) setPlans(data.data || []);
    } catch { toast.error('Failed to load lesson plans.'); }
  };

  const fetchStudentsForClass = async (sectionId: string) => {
    _setLoading(true);
    try {
      const res = await apiFetch(`/api/teacher/students?section_id=${sectionId}`);
      const data = await res.json();
      if (res.ok) setStudents(data.data || []);
    } catch { toast.error('Failed to load student roster.'); }
    finally { _setLoading(false); }
  };

  const fetchExams = async () => {
    setExamLoading(true);
    try {
      const res = await apiFetch('/api/teacher/exams');
      if (res.ok) {
        const data = await res.json();
        setExamList(data.data || []);
      }
    } catch { toast.error('Failed to load exams.'); }
    finally { setExamLoading(false); }
  };

  const fetchExamResults = async (examId: string) => {
    setResultLoading(true);
    try {
      const res = await apiFetch(`/api/teacher/exams/${examId}/submissions`);
      if (res.ok) {
        const data = await res.json();
        setExamResults(data.data || []);
      }
    } catch { toast.error('Failed to load exam results.'); }
    finally { setResultLoading(false); }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newExam.questions.length === 0) {
      toast.error('Add at least one question.');
      return;
    }
    try {
      const res = await apiFetch('/api/teacher/exams', {
        method: 'POST',
        body: JSON.stringify(newExam)
      });
      if (res.ok) {
        toast.success('Exam created successfully.');
        setIsExamModalOpen(false);
        fetchExams();
        setNewExam({ title: '', subject_id: '', section_id: '', start_window: '', duration_minutes: 60, questions: [] });
      } else {
        const d = await res.json();
        toast.error(d.message || 'Creation failed.');
      }
    } catch { toast.error('Network error.'); }
  };

  const handleTogglePublish = async (examId: string, currentStatus: boolean) => {
    try {
      const res = await apiFetch(`/api/teacher/exams/${examId}/publish`, {
        method: 'PATCH',
        body: JSON.stringify({ isPublished: !currentStatus })
      });
      if (res.ok) {
        toast.success(`Exam ${!currentStatus ? 'published' : 'unpublished'}.`);
        fetchExams();
      }
    } catch { toast.error('Update failed.'); }
  };

  const handleDeleteExam = async (examId: string) => {
    if (!confirm('Are you sure you want to delete this exam?')) return;
    try {
      const res = await apiFetch(`/api/teacher/exams/${examId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Exam deleted.');
        fetchExams();
        if (selectedExamId === examId) setSelectedExamId(null);
      }
    } catch { toast.error('Delete failed.'); }
  };

  const addQuestionToExam = () => {
    if (!newQuestion.text || !newQuestion.correct_answer || newQuestion.options.some(o => !o)) {
      toast.error('Complete all question fields.');
      return;
    }
    setNewExam((prev: any) => ({ ...prev, questions: [...prev.questions, newQuestion] }));
    setNewQuestion({ text: '', options: ['', '', '', ''], correct_answer: '', points: 1 });
  };

  useEffect(() => {
    fetchSections();
    fetchPlans();
    fetchExams();
  }, []);

  // ΓöÇΓöÇΓöÇ Handlers ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/teacher/plans', {
        method: 'POST',
        body: JSON.stringify(newPlan)
      });
      if (res.ok) {
        toast.success('Weekly plan submitted for review.');
        setIsPlanModalOpen(false);
        fetchPlans();
      } else {
        const d = await res.json();
        toast.error(d.message || 'Submission failed.');
      }
    } catch { toast.error('Network error.'); }
  };

  const handleSaveCommunication = async () => {
    if (!selectedStudent || Object.keys(ratings).length === 0) {
      toast.error('Please select a student and provide ratings.');
      return;
    }

    try {
      const res = await apiFetch('/api/teacher/communication', {
        method: 'POST',
        body: JSON.stringify({
          student_id: selectedStudent.id,
          week_ending: new Date().toISOString().split('T')[0], // Current week
          ratings: ratings,
          teacher_note: teacherNote
        })
      });
      if (res.ok) {
        _setIsSaved(true);
        toast.success('Communication book updated.');
        setTimeout(() => _setIsSaved(false), 3000);
      } else {
        const d = await res.json();
        toast.error(d.message || 'Update failed.');
      }
    } catch { toast.error('Failed to reach server.'); }
  };



  const getRatingColor = (rating: number) => {
    switch (rating) {
      case 3: return 'bg-emerald-500 text-white';
      case 2: return 'bg-blue-500 text-white';
      case 1: return 'bg-amber-500 text-white';
      case 0: return 'bg-rose-500 text-white';
      default: return 'bg-slate-100 text-slate-400';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pb-2 sm:pb-0 gap-3 p-1.5 bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl w-auto sm:w-fit border border-slate-200/50 dark:border-slate-700/50">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'plans', label: 'Weekly Plans' },
          { id: 'exams', label: 'Exam Results' },
          ...(isRoomTeacher ? [{ id: 'communication', label: 'Comm. Book' }] : []),
          ...(isDean ? [{ id: 'review', label: 'Review' }] : [])
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xl' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isExamModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-4xl animate-in fade-in zoom-in-95 duration-300 my-auto">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg">
                  <Award size={24} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-xl">Create Online Exam</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Management System</p>
                </div>
              </div>
              <button onClick={() => setIsExamModalOpen(false)} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="p-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Exam Title</label>
                  <input
                    placeholder="e.g. Mid-term Science"
                    value={newExam.title}
                    onChange={e => setNewExam({...newExam, title: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl outline-none text-sm font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Section</label>
                  <select
                    value={newExam.section_id}
                    onChange={e => {
                        const s = assignedSections.find(x => x.id === e.target.value);
                        setNewExam({...newExam, section_id: e.target.value, subject_id: s?.subject_id || ''});
                    }}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl outline-none text-sm font-bold"
                  >
                    <option value="">Select Section</option>
                    {assignedSections.map(s => <option key={s.id} value={s.id}>{s.grade} - {s.name} ({s.subject_name})</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Duration (Mins)</label>
                  <input
                    type="number"
                    value={newExam.duration_minutes}
                    onChange={e => setNewExam({...newExam, duration_minutes: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl outline-none text-sm font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Window</label>
                  <input
                    type="datetime-local"
                    value={newExam.start_window}
                    onChange={e => setNewExam({...newExam, start_window: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl outline-none text-sm font-bold"
                  />
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700/50 mb-8">
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest mb-4">Add Questions ({newExam.questions.length})</h4>
                <div className="space-y-4">
                  <textarea
                    placeholder="Question Text"
                    value={newQuestion.text}
                    onChange={e => setNewQuestion({...newQuestion, text: e.target.value})}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl outline-none text-sm font-medium h-20 resize-none"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {newQuestion.options.map((opt, idx) => (
                      <input
                        key={idx}
                        placeholder={`Option ${String.fromCharCode(65+idx)}`}
                        value={opt}
                        onChange={e => {
                          const opts = [...newQuestion.options];
                          opts[idx] = e.target.value;
                          setNewQuestion({...newQuestion, options: opts});
                        }}
                        className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-4 items-center">
                    <select
                      value={newQuestion.correct_answer}
                      onChange={e => setNewQuestion({...newQuestion, correct_answer: e.target.value})}
                      className="flex-1 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                    >
                      <option value="">Select Correct Answer</option>
                      {newQuestion.options.map((opt, idx) => opt && <option key={idx} value={opt}>{String.fromCharCode(65+idx)}: {opt}</option>)}
                    </select>
                    <button
                      onClick={addQuestionToExam}
                      className="px-6 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all"
                    >
                      Add Question
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-4">
                <button
                  onClick={handleCreateExam}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl uppercase tracking-widest text-xs"
                >
                  Create & Save Exam
                </button>
                <button
                  onClick={() => setIsExamModalOpen(false)}
                  className="px-8 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black py-4 rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isPlanModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-4xl my-auto animate-in fade-in zoom-in-95 duration-300">
            <div className="p-5 sm:p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-xl">Create Weekly Plan</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Smart Lesson Planning System</p>
                </div>
              </div>
              <button onClick={() => setIsPlanModalOpen(false)} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all shadow-sm">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleAddPlan} className="p-5 sm:p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Section</label>
                  <select
                    required
                    value={newPlan.section_id}
                    onChange={e => setNewPlan({...newPlan, section_id: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl outline-none text-sm font-bold"
                  >
                    <option value="">Select Section</option>
                    {assignedSections.map(s => <option key={s.id} value={s.id}>{s.grade} - {s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Week Number</label>
                  <input
                    required
                    type="number"
                    value={newPlan.week_number}
                    onChange={e => setNewPlan({...newPlan, week_number: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl outline-none text-sm font-bold"
                  />
                </div>
                <div className="space-y-1 lg:col-span-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Topic</label>
                  <input
                    required
                    placeholder="Topic Title"
                    value={newPlan.content.topic}
                    onChange={e => setNewPlan({...newPlan, content: {...newPlan.content, topic: e.target.value}})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl outline-none text-sm font-bold"
                  />
                </div>
                <div className="space-y-1 lg:col-span-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Specific Objectives</label>
                  <textarea
                    required
                    value={newPlan.content.objectives}
                    onChange={e => setNewPlan({...newPlan, content: {...newPlan.content, objectives: e.target.value}})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl outline-none text-sm font-medium h-20 resize-none"
                  />
                </div>
              </div>

              <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-200 dark:shadow-none uppercase tracking-widest text-xs order-1 sm:order-2"
                >
                  Submit Plan for Approval
                </button>
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-8 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black py-4 sm:py-0 rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest text-xs order-2 sm:order-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'overview' ? (
        <>
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden group">
            <div className="relative z-10">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-4 block">Teacher Dashboard</span>
              <h2 className="text-4xl font-black mb-2 tracking-tight">Welcome back, {(user as any)?.fullName}!</h2>
              <p className="text-slate-400 max-w-md font-medium text-lg leading-relaxed">Manage your classes, lesson plans, and communication book records.</p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  to="/attendance"
                  className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                >
                  Take Attendance
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/grades"
                  className="bg-emerald-600 text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
                >
                  <Award size={16} />
                  Grades
                </Link>
              </div>
            </div>
            <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform duration-700">
              <BookOpen size={240} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none group hover:-translate-y-2 transition-all duration-500">
              <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users size={28} />
              </div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Classes</p>
              <h3 className="text-3xl font-black text-slate-800 dark:text-white">{assignedSections.length}</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-4">Current Semester</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none group hover:-translate-y-2 transition-all duration-500">
              <div className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Calendar size={28} />
              </div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Weekly Plans</p>
              <h3 className="text-3xl font-black text-slate-800 dark:text-white">{plans.length}</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-4">Total Submitted</p>
            </div>
          </div>
        </>
      ) : activeTab === 'plans' ? (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
              <div>
                <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Smart Lesson Planning</h2>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Automated curriculum alignment and activity tracking.</p>
              </div>
              <button
                onClick={() => setIsPlanModalOpen(true)}
                className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95"
              >
                <Plus size={18} />
                Create New Plan
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Week</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Section</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Content</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {plans.map(plan => (
                    <tr key={plan.id} className="group hover:bg-blue-50/30 dark:hover:bg-blue-900/5 transition-colors">
                      <td className="px-6 py-5 font-bold text-slate-800 dark:text-slate-200">{plan.week_number}</td>
                      <td className="px-6 py-5 text-blue-600 font-medium">{plan.section_name}</td>
                      <td className="px-6 py-5 text-slate-600 dark:text-slate-400">
                        {typeof plan.content === 'object' ? plan.content.topic : plan.content}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter bg-amber-100 text-amber-600">
                          {plan.status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'exams' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-12 space-y-6">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div>
                    <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight uppercase">My Online Exams</h2>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Manage secure exam sessions and questions.</p>
                  </div>
                  <button
                    onClick={() => setIsExamModalOpen(true)}
                    className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                  >
                    <Plus size={18} />
                    Create New Exam
                  </button>
                </div>

                {examLoading ? (
                  <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600" size={48} /></div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Exam Title</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Section / Subject</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Start Window</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {examList.map(exam => (
                                <tr key={exam.id} className="group hover:bg-blue-50/30 dark:hover:bg-blue-900/5 transition-colors">
                                    <td className="px-6 py-5">
                                        <p className="font-bold text-slate-800 dark:text-slate-200">{exam.title}</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase">{exam.duration_minutes} Minutes ΓÇó {exam.question_count} Questions</p>
                                    </td>
                                    <td className="px-6 py-5">
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{exam.subject_name}</p>
                                        <p className="text-[10px] text-blue-600 font-black uppercase tracking-tighter">Branch ID: {exam.branch_id}</p>
                                    </td>
                                    <td className="px-6 py-5 text-sm font-medium text-slate-600">
                                        {new Date(exam.start_window).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="px-6 py-5">
                                        <button
                                            onClick={() => handleTogglePublish(exam.id, exam.is_published)}
                                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all ${exam.is_published ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}
                                        >
                                            {exam.is_published ? 'Published' : 'Draft'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-5 text-right space-x-2">
                                        <button
                                            onClick={() => {
                                                setSelectedExamId(exam.id);
                                                fetchExamResults(exam.id);
                                            }}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                            title="View Submissions"
                                        >
                                            <Users size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteExam(exam.id)}
                                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                            title="Delete Exam"
                                        >
                                            <X size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                )}
            </div>

            {selectedExamId && (
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl animate-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Student Submissions</h3>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Real-time session monitoring</p>
                        </div>
                        <button onClick={() => setSelectedExamId(null)} className="p-2 hover:bg-slate-100 rounded-xl">
                            <X size={20} className="text-slate-400" />
                        </button>
                    </div>

                    {resultLoading ? (
                        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-600" /></div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {examResults.map(res => (
                                <div key={res.id} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-700/50 relative overflow-hidden group">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 font-black text-xl">
                                            {res.student_name[0]}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm truncate max-w-[150px]">{res.student_name}</h4>
                                            <p className={`text-[10px] font-black uppercase tracking-tighter ${res.status === 'submitted' ? 'text-emerald-500' : 'text-amber-500'}`}>{res.status}</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Final Score</p>
                                            <p className="text-2xl font-black text-blue-600">{res.final_score || 0}</p>
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-bold">{res.end_time ? new Date(res.end_time).toLocaleTimeString() : '--:--'}</p>
                                    </div>
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                                        <Award size={48} />
                                    </div>
                                </div>
                            ))}
                            {examResults.length === 0 && (
                                <div className="col-span-full py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No submissions found yet.</div>
                            )}
                        </div>
                    )}
                </div>
            )}
          </div>
        </div>
      ) : activeTab === 'communication' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Select Class</h3>
              <div className="space-y-2">
                {assignedSections.map(cls => (
                  <button
                    key={cls.id}
                    onClick={() => {
                      setSelectedClass(cls.id);
                      fetchStudentsForClass(cls.id);
                      setSelectedStudent(null);
                    }}
                    className={`w-full p-4 flex items-center justify-between rounded-xl transition-all ${selectedClass === cls.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700'}`}
                  >
                    <span className="font-bold">Grade {cls.grade} - {cls.name}</span>
                    <ChevronRight size={18} />
                  </button>
                ))}
              </div>
            </div>

            {selectedClass && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Students</h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                  {students.map(student => (
                    <button
                      key={student.id}
                      onClick={() => {
                        setSelectedStudent(student);
                        setRatings({});
                        setTeacherNote('');
                      }}
                      className={`w-full p-3 flex items-center gap-3 rounded-xl transition-all ${selectedStudent?.id === student.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                      <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 font-bold text-xs">
                        {student.full_name[0]}
                      </div>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{student.full_name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-8">
            {selectedStudent ? (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl space-y-8">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 font-black text-2xl">
                      {selectedStudent.full_name[0]}
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white">{selectedStudent.full_name}</h2>
                      <p className="text-slate-500 font-bold">Weekly Performance Rating</p>
                    </div>
                  </div>
                  <button
                    onClick={handleSaveCommunication}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg"
                  >
                    <Save size={18} />
                    Submit Week Rating
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {commFields.map(field => (
                    <div key={field.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{field.label}</h4>
                          <p className="text-[10px] text-slate-500 font-medium">{field.description}</p>
                        </div>
                        {ratings[field.id] !== undefined && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${getRatingColor(ratings[field.id])}`}>
                            {ratingLabels[ratings[field.id]]}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {[0, 1, 2, 3].map(rating => (
                          <button
                            key={rating}
                            onClick={() => setRatings((prev: any) => ({ ...prev, [field.id]: rating }))}
                            className={`py-2 rounded-lg text-[10px] font-black transition-all ${ratings[field.id] === rating ? getRatingColor(rating) : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-blue-400'}`}
                          >
                            {rating + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Teacher's Remark</label>
                  <textarea
                    placeholder="Add observations..."
                    value={teacherNote}
                    onChange={e => setTeacherNote(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl outline-none text-sm font-medium h-32 resize-none"
                  />
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-20 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                <MessageSquare className="text-slate-300 mb-4" size={48} />
                <h3 className="text-xl font-bold text-slate-800 uppercase">Communication Book</h3>
                <p className="text-slate-500 max-w-xs mx-auto mt-2 font-medium">Select a class and student to record weekly observations.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-slate-50 rounded-3xl border border-slate-100">
          <History className="text-slate-300 mx-auto mb-4" size={48} />
          <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Review Workflow</h3>
          <p className="text-slate-500 font-medium">Dean-only view for lesson plan approvals.</p>
        </div>
      )}
    </div>
  );
};
