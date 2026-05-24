import React, { useState, useEffect } from 'react';
import { Clock, FileText, Trophy, Loader2, AlertCircle, BookOpen, ChevronRight, RefreshCw } from 'lucide-react';
import { getAvailableExams } from '../services/examService';
import { mockExams, type Exam } from '../data/examData';

interface ExamListItem extends Exam {
  startWindow?: string;
  questionCount?: number;
  createdAt?: string;
  sessionStatus?: 'active' | 'submitted' | 'terminated' | 'timed_out' | null;
  finalScore?: number | null;
}

interface ExamListProps {
  onSelectExam: (examId: string) => void;
}

export const ExamList: React.FC<ExamListProps> = ({ onSelectExam }) => {
  const [exams, setExams] = useState<ExamListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMock, setUsingMock] = useState(false);

  const fetchExams = async () => {
    setLoading(true);
    setError(null);
    setUsingMock(false);
    try {
      const data = await getAvailableExams();
      setExams(data);
    } catch (err: any) {
      console.warn('Failed to fetch exams from API, falling back to mock data:', err);
      // Fallback to mock data
      const fallback: ExamListItem[] = mockExams.map(m => ({
        ...m,
        courseId: m.courseId || '',
        teacherId: m.teacherId || '',
        teacherName: m.teacherName || '',
        status: 'available',
        questions: m.questions || [],
        startWindow: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        sessionStatus: null,
        finalScore: null,
        questionCount: m.questions.length,
      }));
      setExams(fallback);
      setUsingMock(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const getStatusBadge = (exam: ExamListItem) => {
    if (exam.sessionStatus === 'submitted' || exam.sessionStatus === 'terminated' || exam.sessionStatus === 'timed_out') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
          <Trophy size={12} />
          Completed {exam.finalScore !== null ? `— ${exam.finalScore}%` : ''}
        </span>
      );
    }
    if (exam.sessionStatus === 'active') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 animate-pulse">
          In Progress
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
        Available
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-500 dark:text-slate-400 font-medium">Loading available exams...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Official Examinations</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {exams.length} exam{exams.length !== 1 ? 's' : ''} available
          </p>
        </div>
        <button
          onClick={fetchExams}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Mock warning */}
      {usingMock && (
        <div className="flex items-start gap-3 p-4 mb-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl">
          <AlertCircle className="text-amber-500 flex-shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-amber-700 dark:text-amber-400">
            Could not connect to the server. Showing sample exams for preview.
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 p-4 mb-6 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Exam Cards */}
      {exams.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400 mb-2">No Exams Available</h3>
          <p className="text-slate-400 dark:text-slate-500">There are no published exams at this time. Check back later.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {exams.map((exam) => {
            const isCompleted = exam.sessionStatus === 'submitted' || exam.sessionStatus === 'terminated' || exam.sessionStatus === 'timed_out';

            return (
              <button
                key={exam.id}
                onClick={() => !isCompleted && onSelectExam(exam.id)}
                disabled={isCompleted}
                className={`w-full text-left p-6 rounded-2xl border-2 transition-all group ${isCompleted
                    ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 opacity-70 cursor-not-allowed'
                    : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg hover:shadow-blue-500/5 cursor-pointer'
                  }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusBadge(exam)}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 truncate">
                      {exam.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Clock size={14} className="text-slate-400" />
                        {exam.durationMinutes} min
                      </span>
                      <span className="flex items-center gap-1.5">
                        <FileText size={14} className="text-slate-400" />
                        {(exam.questionCount ?? exam.questions?.length ?? 0)} question{(exam.questionCount ?? exam.questions?.length ?? 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {!isCompleted && (
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                      <ChevronRight size={20} />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ExamList;
