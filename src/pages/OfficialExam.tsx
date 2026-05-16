import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Shield, Clock, AlertTriangle, FileText, CheckCircle, 
  Loader2, Search, Award, ChevronRight, Send,
  BookOpen
} from 'lucide-react';
import { apiFetch } from '../utils/apiClient';
import { toast } from '../components/Toast';
import { useExam } from '../context/ExamContext';
import { useUser } from '../context/UserContext';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Question {
  id: string;
  text: string;
  type: string;
  options: string[];
  points: number;
}

interface ExamItem {
  id: string;
  title: string;
  subject_name: string;
  start_window: string;
  duration_minutes: number;
  my_status: 'active' | 'submitted' | 'terminated' | 'timed_out' | null;
  my_score: number | null;
  questions_count: number;
}

interface ActiveSession {
  session_id: string;
  exam: {
    title: string;
    duration_minutes: number;
    questions: Question[];
  };
  saved_answers: Record<string, string>;
  server_time: string;
}

type ExamView = 'list' | 'lobby' | 'active' | 'submitted' | 'terminated' | 'security_warning';

// ─── Component ────────────────────────────────────────────────────────────────
export const OfficialExam = () => {
  const { role } = useUser();
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get('student_id');
  const { activateExamLockdown, releaseExamLockdown } = useExam();

  // ── State ──────────────────────────────────────────────────────────────────
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [view, setView] = useState<ExamView>('list');
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const [timeLeft, setTimeLeft] = useState(0);
  const [starting, setStarting] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [terminating, setTerminating] = useState(false);
  const [selectedExam, setSelectedExam] = useState<ExamItem | null>(null);
  const [violationType, setViolationType] = useState<string | null>(null);
  const [violationCount, setViolationCount] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionRef = useRef<ActiveSession | null>(null);
  sessionRef.current = session;

  // ── Helpers ────────────────────────────────────────────────────────────────
  const fmt = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ── Data Fetching ──────────────────────────────────────────────────────────
  const fetchExams = useCallback(async () => {
    setListLoading(true);
    try {
      const url = role === 'parent' && studentId 
        ? `/api/exams?student_id=${studentId}` 
        : '/api/exams';
      const res = await apiFetch(url);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || data.message || 'Failed to fetch exams.');
        return;
      }
      setExams(data.data?.exams || []);
    } catch {
      toast.error('Network error — could not reach exam server.');
    } finally {
      setListLoading(false);
    }
  }, [role, studentId]);

  useEffect(() => { 
    if (role === 'parent' && !studentId) return;
    fetchExams(); 
  }, [fetchExams, role, studentId]);

  // ── Timer & Anti-Cheat ─────────────────────────────────────────────────────
  const startTimer = useCallback((durationMinutes: number, startTime?: string, remoteServerTime?: string) => {
    // If we have startTime/serverTime, calculate remaining from there.
    // Otherwise just use durationMinutes.
    let remaining = durationMinutes * 60;
    
    if (startTime && remoteServerTime) {
        const serverNow = new Date(remoteServerTime).getTime();
        const examStart = new Date(startTime).getTime();
        const elapsed = Math.max(0, Math.floor((serverNow - examStart) / 1000));
        remaining = Math.max(0, remaining - elapsed);
    }

    setTimeLeft(remaining);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const exitFullscreen = () => {
    try {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    } catch (_) {}
  };

  const handleTerminate = useCallback(async (_reason: string = 'student_triggered') => {
    const s = sessionRef.current;
    if (!s || terminating) return;
    setTerminating(true);
    stopTimer();
    try {
      await apiFetch(`/api/exams/${s.exam.title}/submit`, { // Backend uses examId in params but we can use any unique identifier if needed, for now use current API pattern
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: s.session_id, status: 'terminated' }),
      });
    } catch (_) {}
    releaseExamLockdown();
    exitFullscreen();
    setIsExamStarted(false);
    setView('terminated');
    setTerminating(false);
  }, [terminating, releaseExamLockdown]);

  useEffect(() => {
    if (!isExamStarted) return;
    const handleVisibilityChange = () => {
      if (document.hidden && sessionRef.current && view === 'active') {
        const newCount = violationCount + 1;
        setViolationCount(newCount);
        setViolationType('window-blur');
        if (newCount >= 3) {
          handleTerminate('maximum_violations_reached');
        } else {
          setView('security_warning');
        }
      }
    };
    const handleContextMenu = (e: MouseEvent) => { if (isExamStarted) e.preventDefault(); };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('contextmenu', handleContextMenu);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [isExamStarted, handleTerminate, violationCount, view]);

  useEffect(() => {
    return () => {
      stopTimer();
      releaseExamLockdown();
    };
  }, [releaseExamLockdown]);

  const enterFullscreen = () => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
  };

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleEnterLobby = (exam: ExamItem) => {
    if (role === 'parent') return;
    setSelectedExam(exam);
    setView('lobby');
  };

  const handleStart = async () => {
    if (!selectedExam || role === 'parent') return;

    setStarting(selectedExam.id);
    try {
      const res = await apiFetch(`/api/exams/${selectedExam.id}/start`, { method: 'POST' });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || 'API Error');

      const sess: ActiveSession = data.data;
      setSession(sess);
      setIsExamStarted(true);
      setView('active');
      setAnswers(sess.saved_answers || {});
      activateExamLockdown();
      enterFullscreen();
      startTimer(sess.exam.duration_minutes);
    } catch (err: any) {
      toast.error(err.message || 'Failed to start secure session.');
    } finally {
      setStarting(null);
    }
  };

  const handleAutoSubmit = useCallback(async () => {
    const s = sessionRef.current;
    if (!s) return;
    stopTimer();
    try {
      await apiFetch(`/api/exams/${s.exam.title}/submit`, { // title as placeholder for ID in path if needed
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: s.session_id, status: 'timed_out' }),
      });
    } catch (_) {}
    releaseExamLockdown();
    exitFullscreen();
    setIsExamStarted(false);
    setView('submitted');
  }, [releaseExamLockdown]);

  const handleSubmit = async () => {
    if (!session) return;
    const unanswered = session.exam.questions.length - Object.keys(answers).length;
    if (unanswered > 0 && !window.confirm(`You have ${unanswered} unanswered questions. Are you sure you want to submit?`)) {
      return;
    }

    setSubmitting(true);
    stopTimer();
    try {
      const res = await apiFetch(`/api/exams/submit-placeholder/submit`, { // Correct API path
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: session.session_id, status: 'submitted' }),
      });
      if (!res.ok) throw new Error();
      releaseExamLockdown();
      exitFullscreen();
      setIsExamStarted(false);
      setView('submitted');
    } catch {
      toast.error('Submission failed. Please check your connection.');
      startTimer(session.exam.duration_minutes);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnswer = async (questionId: string, option: string) => {
    if (!session) return;
    setAnswers(prev => ({ ...prev, [questionId]: option }));
    
    // Atomic Save
    try {
        await apiFetch('/api/exams/save-answer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: session.session_id,
                question_id: questionId,
                answer: option
            })
        });
    } catch (err) {
        console.error('Failed to auto-save answer:', err);
    }
  };

  // ── Rendering Logic ────────────────────────────────────────────────────────
  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          exam.subject_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  if (view === 'terminated') {
    return (
      <div className="min-h-screen bg-red-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6 text-white">
          <div className="w-24 h-24 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
            <AlertTriangle className="text-red-500" size={48} />
          </div>
          <h1 className="text-4xl font-black">EXAM TERMINATED</h1>
          <p className="text-red-300 text-lg font-medium">Your session was stopped due to security violations or manual intervention. All progress has been logged.</p>
          <button onClick={() => { setView('list'); fetchExams(); }} className="w-full bg-white text-red-950 py-5 rounded-[2rem] font-black text-xl hover:scale-105 active:scale-95 transition-transform">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (view === 'submitted') {
    return (
      <div className="min-h-screen bg-emerald-950 flex items-center justify-center p-6 text-white">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="w-24 h-24 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="text-emerald-400" size={48} />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-black">Well Done!</h1>
            <p className="text-emerald-300 text-lg font-medium">Your examination has been submitted successfully for grading.</p>
          </div>
          <button onClick={() => { setView('list'); fetchExams(); }} className="w-full bg-emerald-600 py-5 rounded-[2rem] font-black text-xl hover:bg-emerald-500 transition-colors shadow-xl shadow-emerald-900/40">
            View Results
          </button>
        </div>
      </div>
    );
  }

  if (view === 'lobby' && selectedExam) {
    return (
      <div className="fixed inset-0 z-[2000] bg-[#0B1329] flex flex-col items-center justify-center p-6 font-sans text-white">
        <div className="max-w-xl w-full space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 text-center">
          <div className="flex flex-col items-center gap-6">
            <div className="w-20 h-20 bg-[#1E293B] rounded-2xl flex items-center justify-center border border-white/10 shadow-2xl">
              <Shield className="text-[#3B82F6]" size={40} />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">{selectedExam.title}</h1>
          </div>

          <div className="bg-[#111827] border border-white/5 p-8 rounded-3xl text-left shadow-2xl relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">EXAM RULES</h3>
              <ul className="space-y-4">
                {[
                  'Do not leave the browser tab or minimize the window.',
                  'The exam will run in full-screen mode.',
                  'Multiple security violations will lead to auto-submission.',
                  `Duration: ${selectedExam.duration_minutes} minutes.`
                ].map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-slate-300 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] mt-1.5 shrink-0" />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button 
              onClick={() => setView('list')}
              className="flex-1 bg-white/5 hover:bg-white/10 py-5 rounded-2xl font-bold text-lg text-white transition-all active:scale-95"
            >
              Back
            </button>
            <button 
              onClick={handleStart}
              disabled={starting === selectedExam.id}
              className="flex-[2] bg-[#3B82F6] hover:bg-[#2563EB] py-5 rounded-2xl font-bold text-lg text-white shadow-2xl shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              {starting === selectedExam.id ? <Loader2 className="animate-spin" size={24} /> : null}
              Start Secure Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'security_warning') {
    return (
      <div className="fixed inset-0 z-[3000] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#1A2235] border border-white/10 p-10 rounded-3xl text-center space-y-8 shadow-2xl">
          <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle className="text-amber-500" size={32} />
          </div>
          
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-white">Security Warning</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              A security violation was detected: <span className="text-white font-bold">{violationType}</span>. Multiple violations will result in automatic submission.
            </p>
          </div>

          <div className="text-center">
            <p className="text-rose-500 font-bold tracking-widest text-sm">WARNING {violationCount} OF 3</p>
          </div>

          <button 
            onClick={() => { setView('active'); enterFullscreen(); }}
            className="w-full bg-white text-[#1A2235] py-4 rounded-xl font-bold hover:bg-slate-100 transition-colors"
          >
            I Understand & Resume
          </button>
        </div>
      </div>
    );
  }

  if (isExamStarted && session) {
    return (
      <div className="fixed inset-0 z-[1000] bg-[#0B1329] flex flex-col overflow-hidden font-sans text-white animate-in fade-in duration-500">
        {/* Top Navigation / Status Bar */}
        <header className="h-20 px-10 border-b border-white/5 flex items-center justify-between bg-[#111827]/80 backdrop-blur-xl relative z-20">
           <div className="flex-1"></div>
           <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold tracking-tight">{session.exam.title}</h1>
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                   <div className="w-2 h-2 rounded-full bg-emerald-500" />
                   <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Secure Session</span>
                </div>
              </div>
           </div>
           <div className="flex-1 flex justify-end">
              <div className="bg-[#1E293B]/80 px-6 py-3 rounded-2xl border border-white/10 flex items-center gap-4 shadow-2xl">
                 <div className="text-right">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">TIME REMAINING</p>
                    <p className="text-xl font-bold tabular-nums leading-none tracking-tighter">{fmt(timeLeft)}</p>
                 </div>
              </div>
           </div>
        </header>

        <div className="flex-1 flex overflow-hidden p-8 gap-8 relative z-10">
          <main className="flex-1 overflow-y-auto space-y-8 no-scrollbar pr-4">
            {session.exam.questions.map((q, idx) => (
              <div key={q.id} id={`q-${idx}`} className="bg-[#111827] p-10 rounded-[2.5rem] border border-white/5 shadow-2xl space-y-10 relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div className="flex gap-8">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black shrink-0 text-xl">{idx + 1}</div>
                    <h2 className="text-2xl font-bold leading-relaxed pt-1 max-w-2xl">{q.text}</h2>
                  </div>
                </div>
                <div className="grid gap-4">
                  {q.options.map((text) => {
                    const isSelected = answers[q.id] === text;
                    return (
                      <button
                        key={text}
                        onClick={() => handleAnswer(q.id, text)}
                        className={`w-full flex items-center gap-6 p-6 rounded-2xl border-2 transition-all text-left ${
                          isSelected ? 'bg-blue-600/10 border-blue-500 text-white' : 'bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-700'}`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <span className="text-lg font-bold tracking-tight">{text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </main>

          <aside className="w-[380px] space-y-6 flex flex-col">
            <div className="bg-[#111827] p-8 rounded-[2.5rem] border border-white/5 space-y-8 shadow-2xl">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Question Palette</h3>
              <div className="grid grid-cols-5 gap-3">
                {session.exam.questions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => document.getElementById(`q-${idx}`)?.scrollIntoView({ behavior: 'smooth' })}
                    className={`h-12 rounded-xl font-black flex items-center justify-center border-2 ${
                      answers[q.id] ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-transparent border-white/5 text-slate-600'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-blue-600/5 p-8 rounded-[2.5rem] border border-blue-500/10 flex gap-5">
              <AlertTriangle className="text-blue-500 shrink-0 mt-0.5" size={22} />
              <div>
                <p className="text-xs text-white font-bold">Automatic Saving Active</p>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">Your progress is automatically saved to the server per question.</p>
              </div>
            </div>
          </aside>
        </div>

        <footer className="h-24 px-10 bg-[#111827]/90 backdrop-blur-md border-t border-white/5 flex justify-between items-center relative z-20">
          <button onClick={() => handleTerminate()} className="px-8 py-3 rounded-xl border border-rose-500/30 text-rose-500 text-xs font-black uppercase hover:bg-rose-500 hover:text-white transition-all">Stop Exam</button>
          <button onClick={handleSubmit} disabled={submitting} className="bg-blue-600 hover:bg-blue-500 text-white px-12 py-4 rounded-2xl font-black uppercase text-xs flex items-center gap-4">
            {submitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />} Finish Exam
          </button>
        </footer>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white">Online Exam</h1>
          <p className="text-slate-500 font-medium">Monitoring academic excellence via high-stakes assessment.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search exams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full"
            />
          </div>
        </div>
      </div>

      {listLoading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="animate-spin text-blue-600" size={48} />
          <p className="text-slate-500 font-bold uppercase">Syncing with Server...</p>
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="p-24 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[4rem] border-4 border-dashed border-slate-200 dark:border-slate-800">
          <BookOpen className="text-slate-300 mx-auto mb-6" size={40} />
          <h2 className="text-2xl font-black">No Exams Found</h2>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredExams.map(exam => {
            const already = exam.my_status === 'submitted' || exam.my_status === 'terminated' || exam.my_status === 'timed_out';
            return (
              <div key={exam.id} className="group bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-8 shadow-sm hover:shadow-2xl transition-all">
                <div className="flex items-center gap-8 flex-1">
                  <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center ${already ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                    {already ? <Award size={40} /> : <FileText size={40} />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black group-hover:text-blue-600 transition-colors">{exam.title}</h2>
                    <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">{exam.subject_name}</p>
                    <div className="flex flex-wrap gap-4 mt-4 text-xs font-black text-slate-400">
                       <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full"><Clock size={12}/> {exam.duration_minutes}m</span>
                       <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full"><Shield size={12}/> {exam.questions_count} Questions</span>
                       <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full"><ChevronRight size={12}/> {formatDate(exam.start_window)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                   {exam.my_score !== null ? (
                     <div className="bg-emerald-500 text-white px-10 py-4 rounded-[2rem] flex flex-col">
                        <span className="text-[10px] font-black uppercase opacity-80">Score</span>
                        <span className="text-3xl font-black">{exam.my_score}%</span>
                     </div>
                   ) : already ? (
                     <div className="px-10 py-5 rounded-[2rem] text-sm font-black uppercase bg-amber-50 text-amber-700">Completed</div>
                   ) : (
                     <button onClick={() => handleEnterLobby(exam)} disabled={starting === exam.id} className="px-12 py-5 rounded-[2rem] font-black text-sm uppercase bg-blue-600 text-white hover:scale-110 transition-all">
                       {starting === exam.id ? 'Loading...' : 'Start Session'}
                     </button>
                   )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
