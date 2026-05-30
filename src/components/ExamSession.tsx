import React, { useEffect, useState, useRef } from 'react';
import {
  getExamById,
  saveExamAnswer,
  submitExam,
  verifyExamPassword,
  startExamSession
} from '../services/examService';

interface Props {
  examId: string;
  onFinished?: () => void;
}

const ExamSession: React.FC<Props> = ({ examId, onFinished }) => {
  const [loading, setLoading] = useState(true);
  const [examDetail, setExamDetail] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    loadExam();
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [examId]);

  const loadExam = async () => {
    setLoading(true);
    try {
      const data: any = await getExamById(examId);
      setExamDetail(data);
      // populate answers
      setAnswers(data.savedAnswers || {});

      // session info
      if ((data as any).session) {
        setSessionId((data as any).session.id);
        if (((data as any).session as any)['password_verified'] === false && (((data as any).exam as any)['password_required'] || ((data as any).exam as any).passwordRequired)) {
          // require password to proceed
          setPasswordModalOpen(true);
        } else {
          startTimer((data as any).exam.durationMinutes, (data as any).session);
        }
      } else {
        // create a session
        const s = await startExamSession(examId);
        setSessionId(s.id || s.session?.id || null);
        if (((data as any).exam as any)['password_required'] || ((data as any).exam as any).passwordRequired) {
          setPasswordModalOpen(true);
        } else {
          startTimer((data as any).exam.durationMinutes, s);
        }
      }
    } catch (err) {
      console.error('Failed to load exam', err);
    } finally {
      setLoading(false);
    }
  };

  const startTimer = (durationMinutes: number, session: any) => {
    // if session contains remaining_seconds, use it, otherwise compute from duration
    const now = Date.now();
    let left = (durationMinutes || examDetail?.exam?.durationMinutes || 60) * 60;
    if (session && session.session_start) {
      // conservative: use duration - elapsed
      const started = new Date(session.session_start).getTime();
      const elapsed = Math.floor((now - started) / 1000);
      left = Math.max(0, left - elapsed);
    }

    setTimeLeft(left);
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          window.clearInterval(timerRef.current!);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000) as unknown as number;
  };

  const handleAutoSubmit = async () => {
    try {
      await submitExam(examId, true);
      if (onFinished) onFinished();
    } catch (err) {
      console.error('Auto-submit failed', err);
    }
  };

  const handleVerifyPassword = async () => {
    try {
      const res = await verifyExamPassword(examId, password);
      // backend marks password verified and returns session
      const sid = res.session?.id || res.id || null;
      setSessionId(sid);
      setPasswordModalOpen(false);
      // reload exam to pick up verified state
      const data: any = await getExamById(examId);
      setExamDetail(data);
      startTimer(data.exam.durationMinutes, data.session || res.session || res);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Incorrect password');
    }
  };

  const handleAnswerChange = async (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    try {
      await saveExamAnswer(examId, questionId, value, sessionId || undefined);
    } catch (err) {
      console.error('Failed to save answer', err);
    }
  };

  const handleSubmit = async () => {
    try {
      await submitExam(examId, false);
      if (onFinished) onFinished();
    } catch (err) {
      console.error('Submit failed', err);
    }
  };

  if (loading) return <div>Loading exam...</div>;

  if (!examDetail) return <div>Exam not found</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">{examDetail.exam.title}</h2>
      <div className="mt-2 mb-4">Time left: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</div>

      {passwordModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-[420px]">
            <h3 className="text-lg font-bold mb-2">Enter Exam Password</h3>
            <p className="text-sm text-slate-600 mb-4">This exam is password protected. Enter the password to begin or resume.</p>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 border rounded mb-4" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setPasswordModalOpen(false)} className="px-4 py-2 rounded border">Cancel</button>
              <button onClick={handleVerifyPassword} className="px-4 py-2 rounded bg-blue-600 text-white">Verify</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {examDetail.questions.map((q: any, idx: number) => (
          <div key={q.id} className="p-4 border rounded">
            <div className="font-bold">{idx + 1}. {q.text}</div>
            {q.type === 'mcq' ? (
              <div className="mt-2 space-y-2">
                {q.options.map((opt: any) => (
                  <label key={opt.id} className="flex items-center gap-2">
                    <input type="radio" name={`q-${q.id}`} checked={answers[q.id] === opt.id} onChange={() => handleAnswerChange(q.id, opt.id)} />
                    <span>{opt.text}</span>
                  </label>
                ))}
              </div>
            ) : (
              <textarea value={answers[q.id] || ''} onChange={e => handleAnswerChange(q.id, e.target.value)} className="w-full p-2 border rounded mt-2" />
            )}
          </div>
        ))}

        <div className="flex justify-end gap-3">
          <button onClick={handleSubmit} className="px-6 py-2 bg-emerald-600 text-white rounded">Submit Exam</button>
        </div>
      </div>
    </div>
  );
};

export default ExamSession;
