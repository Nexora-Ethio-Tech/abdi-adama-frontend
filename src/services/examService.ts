import api from './api';
import type { Exam, ExamCategory } from '../data/examData';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ExamQuestion {
  id: string;
  text: string;
  type: string;
  options: { id: string; text: string }[];
  points: number;
}

export interface ExamSession {
  id: string;
  status: string;
  startTime: string;
  endTime: number;
}

export interface ExamDetail {
  exam: {
    id: string;
    title: string;
    durationMinutes: number;
    questionCount: number;
  };
  session: ExamSession;
  questions: ExamQuestion[];
  savedAnswers: Record<string, string>;
}

export interface SubmitResult {
  sessionId: string;
  status: string;
  earnedPoints: number;
  totalPoints: number;
  scorePercent: number;
  autoSubmitted: boolean;
}

// ─── API Calls ───────────────────────────────────────────────────────────────

export const getAvailableExams = async (): Promise<Exam[]> => {
  const response = await api.get('/student/exams');
  return response.data.data;
};

export const getExamById = async (examId: string): Promise<ExamDetail> => {
  const response = await api.get(`/student/exams/${examId}`);
  return response.data.data;
};

export const saveExamAnswer = async (
  examId: string,
  questionId: string,
  answer: string
): Promise<void> => {
  await api.post(`/student/exams/${examId}/answer`, { questionId, answer });
};

export const submitExam = async (
  examId: string,
  autoSubmitted: boolean = false
): Promise<SubmitResult> => {
  const response = await api.post(`/student/exams/${examId}/submit`, { autoSubmitted });
  return response.data.data;
};

export const createExam = async (examData: {
  title: string;
  courseId?: string | null;
  courseName: string;
  category: 'Mid-term' | 'Final' | 'Quiz' | 'Assignment';
  durationMinutes: number;
  questions?: Array<{
    id: string;
    text: string;
    correctOptionId?: string | null;
    options?: Array<{ id: string; text: string }>;
  }>;
}): Promise<any> => {
  const response = await api.post('/teacher/exams', examData);
  return response.data.data;
};
