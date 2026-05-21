import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Send, AlertTriangle, ShieldCheck, Lock, Loader2 } from 'lucide-react';
import { ExamTimer } from './ExamSession/components/ExamTimer';
import { QuestionCard } from './ExamSession/components/QuestionCard';
import { QuestionPalette } from './ExamSession/components/QuestionPalette';
import { SubmitOverlay } from './ExamSession/components/SubmitOverlay';
import { useAntiCheat } from './ExamSession/hooks/useAntiCheat';
import { ExamList } from './ExamList';
import { getExamById, saveExamAnswer, submitExam as submitExamApi } from '../services/examService';
import type { ExamQuestion } from '../services/examService';
import { useStore } from '../context/useStore';

// Fallback to mock if API fails
import { mockExam } from '../data/examData';

export const Exams: React.FC = () => {
  const navigate = useNavigate();
  const { setExamLockedDown, stopExamTrigger } = useStore();

  // ─── View State: 'list' or 'session' ──────────────────────────────────────
  const [view, setView] = useState<'list' | 'session'>('list');
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [examLoading, setExamLoading] = useState(false);
  const [examLoadError, setExamLoadError] = useState<string | null>(null);

  // ─── Exam Session State ───────────────────────────────────────────────────
  const [examTitle, setExamTitle] = useState('');
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitStatus, setSubmitStatus] = useState<'submitting' | 'success' | 'error' | null>(null);
  const [examEndTime, setExamEndTime] = useState<number>(0);
  const [violations, setViolations] = useState<string[]>([]);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [lastViolationType, setLastViolationType] = useState<string>('');
  const [hasStarted, setHasStarted] = useState(false);
  const [reentryPassword, setReentryPassword] = useState('');
  const [showReentryModal, setShowReentryModal] = useState(false);
  const [usingMock, setUsingMock] = useState(false);

  // ─── Select Exam & Load from Backend ──────────────────────────────────────
  const handleSelectExam = async (examId: string) => {
    setSelectedExamId(examId);
    setExamLoading(true);
    setExamLoadError(null);
    setUsingMock(false);

    try {
      const data = await getExamById(examId);
      setExamTitle(data.exam.title);
      setQuestions(data.questions);
      setDurationMinutes(data.exam.durationMinutes);
      setExamEndTime(data.session.endTime);
      setAnswers(data.savedAnswers || {});
      setCurrentQuestionIndex(0);
      setView('session');
    } catch (err: any) {
      console.warn('Failed to load exam from API, falling back to mock:', err);
      // Fallback to mock
      setExamTitle(mockExam.title);
      setQuestions(mockExam.questions.map(q => ({
        id: q.id,
        text: q.text,
        type: 'multiple_choice',
        options: q.options,
        points: 1,
      })));
      setDurationMinutes(mockExam.durationMinutes);
      setExamEndTime(Date.now() + mockExam.durationMinutes * 60 * 1000);
      setAnswers({});
      setCurrentQuestionIndex(0);
      setUsingMock(true);
      setView('session');
    } finally {
      setExamLoading(false);
    }
  };

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleViolation = useCallback((type: string) => {
    setViolations(prev => [...prev, type]);
    setLastViolationType(type);
    if (type === 'Visibility Change' || type === 'Window Blur') {
      setShowReentryModal(true);
    } else {
      setShowWarningModal(true);
    }
  }, []);

  const handleSubmit = useCallback(async (auto = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitStatus('submitting');

    try {
      if (!usingMock && selectedExamId) {
        await submitExamApi(selectedExamId, auto);
      } else {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      setSubmitStatus('success');
      setExamLockedDown(false);
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    } catch (error) {
      console.error('Submission failed:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedExamId, usingMock, isSubmitting, setExamLockedDown]);

  // Lock/Unlock sidebar depending on active session state
  useEffect(() => {
    if (hasStarted && submitStatus !== 'success') {
      setExamLockedDown(true);
    } else {
      setExamLockedDown(false);
    }
    return () => {
      setExamLockedDown(false);
    };
  }, [hasStarted, submitStatus, setExamLockedDown]);

  // Listen for stop exam signal from Sidebar Stop Exam button
  useEffect(() => {
    if (stopExamTrigger > 0 && hasStarted && submitStatus !== 'success' && !isSubmitting) {
      handleSubmit(true);
    }
  }, [stopExamTrigger, hasStarted, submitStatus, isSubmitting, handleSubmit]);


  const { requestFullscreen } = useAntiCheat({
    onViolation: isSubmitting || submitStatus === 'success' || showReentryModal ? () => { } : handleViolation,
    maxWarnings: 3,
    autoSubmit: () => handleSubmit(true)
  });

  const handleSelectOption = async (optionId: string) => {
    const questionId = questions[currentQuestionIndex].id;
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));

    // Save to backend atomically (fire-and-forget)
    if (!usingMock && selectedExamId) {
      saveExamAnswer(selectedExamId, questionId, optionId).catch(err =>
        console.warn('Failed to save answer to server:', err)
      );
    }
  };

  const handleToggleFlag = (questionId: string) => {
    setFlaggedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  const handlePrev = () => setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
  const handleNext = () => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1));
  const questionIds = useMemo(() => questions.map(q => q.id), [questions]);

  const handleBackToList = () => {
    setView('list');
    setHasStarted(false);
    setSubmitStatus(null);
    setViolations([]);
    setAnswers({});
    setFlaggedQuestions(new Set());
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  };

  // ─── Prevent accidental close during exam ─────────────────────────────────
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasStarted && submitStatus !== 'success') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasStarted, submitStatus]);

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW 1: EXAM LIST
  // ═══════════════════════════════════════════════════════════════════════════
  if (view === 'list') {
    if (examLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">Loading exam...</p>
        </div>
      );
    }
    return <ExamList onSelectExam={handleSelectExam} />;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW 2: EXAM SESSION — Rules Screen
  // ═══════════════════════════════════════════════════════════════════════════
  if (!hasStarted) {
    return (
      <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900">
        <div className="max-w-md w-full mx-4 text-center">
          <div className="w-20 h-20 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={40} />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">{examTitle}</h2>
          <div className="bg-slate-800 rounded-xl p-6 text-left mb-8 space-y-4">
            <h3 className="text-slate-300 font-semibold uppercase text-xs tracking-wider">Exam Rules</h3>
            <ul className="text-slate-400 text-sm space-y-2">
              <li className="flex gap-2"><span className="text-blue-400">•</span> Do not leave the browser tab or minimize the window.</li>
              <li className="flex gap-2"><span className="text-blue-400">•</span> The exam will run in full-screen mode.</li>
              <li className="flex gap-2"><span className="text-blue-400">•</span> Multiple security violations will lead to auto-submission.</li>
              <li className="flex gap-2"><span className="text-blue-400">•</span> Duration: {durationMinutes} minutes.</li>
              <li className="flex gap-2"><span className="text-blue-400">•</span> {questions.length} questions total.</li>
            </ul>
          </div>
          <button
            onClick={() => { setHasStarted(true); requestFullscreen(); }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-blue-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] mb-3"
          >
            Start Secure Session
          </button>
          <button
            onClick={handleBackToList}
            className="w-full text-slate-400 hover:text-white py-2 text-sm font-medium transition-colors"
          >
            ← Back to Exam List
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW 2: EXAM SESSION — Active Exam
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
      {/* Teacher Re-entry Modal */}
      {showReentryModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900 backdrop-blur-xl p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-8 text-center border-4 border-rose-500">
            <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">LOCKDOWN ACTIVE</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-8 font-medium">
              You attempted to leave the exam environment. A teacher must enter their password to resume.
            </p>
            <div className="space-y-4">
              <input
                type="password"
                placeholder="Teacher Password"
                className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 transition-all text-center font-bold tracking-widest"
                value={reentryPassword}
                onChange={e => setReentryPassword(e.target.value)}
              />
              <button
                onClick={() => {
                  if (reentryPassword === 'teacher123') {
                    setShowReentryModal(false);
                    setReentryPassword('');
                    requestFullscreen();
                  } else {
                    alert('Invalid Teacher Password');
                  }
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-500/20 transition-all"
              >
                UNBLOCK SESSION
              </button>
            </div>
          </div>
        </div>
      )}

      <SubmitOverlay
        status={submitStatus}
        onRetry={() => handleSubmit()}
        onClose={handleBackToList}
      />

      {/* Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Security Warning</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              A security violation was detected: <span className="font-semibold text-slate-900 dark:text-slate-200">{lastViolationType}</span>.
              Multiple violations will result in automatic submission.
            </p>
            <p className="text-sm font-medium text-red-600 mb-6 uppercase tracking-wider">
              Warning {violations.length} of 3
            </p>
            <button
              onClick={() => { setShowWarningModal(false); requestFullscreen(); }}
              className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              I Understand &amp; Resume
            </button>
          </div>
        </div>
      )}

      {/* Exam Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white truncate">
              {examTitle}
            </h1>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Secure Session</span>
            </div>
          </div>
          <ExamTimer endTime={examEndTime} onTimeUp={() => handleSubmit(true)} />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            {questions.length > 0 && (
              <QuestionCard
                question={questions[currentQuestionIndex]}
                selectedOptionId={answers[questions[currentQuestionIndex].id]}
                onSelectOption={handleSelectOption}
                index={currentQuestionIndex}
                isFlagged={flaggedQuestions.has(questions[currentQuestionIndex].id)}
                onToggleFlag={() => handleToggleFlag(questions[currentQuestionIndex].id)}
              />
            )}
          </div>
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              <QuestionPalette
                totalQuestions={questions.length}
                currentIndex={currentQuestionIndex}
                answers={answers}
                flaggedQuestions={flaggedQuestions}
                questionIds={questionIds}
                onSelectIndex={setCurrentQuestionIndex}
              />
              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="text-blue-600 dark:text-blue-400 flex-shrink-0" size={20} />
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    Your progress is automatically saved. Do not refresh or leave this page.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={20} />
              <span className="hidden sm:inline">Previous</span>
            </button>
            <button
              onClick={handleNext}
              disabled={currentQuestionIndex === questions.length - 1}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-30 transition-colors"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight size={20} />
            </button>
          </div>
          <button
            onClick={() => handleSubmit()}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all"
          >
            <Send size={18} />
            <span>{isSubmitting ? 'Submitting...' : 'Finish Exam'}</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default Exams;
