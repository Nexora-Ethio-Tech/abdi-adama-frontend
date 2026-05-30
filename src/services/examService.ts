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
  answer: string,
  sessionId?: string
): Promise<void> => {
  await api.post(`/student/exams/${examId}/answer`, { questionId, answer, sessionId });
};

export const verifyExamPassword = async (examId: string, password: string): Promise<any> => {
  const response = await api.post(`/student/exams/${examId}/verify-password`, { password });
  return response.data.data;
};

export const startExamSession = async (examId: string): Promise<any> => {
  const response = await api.post(`/student/exams/${examId}/start`);
  return response.data.data;
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

// ─── Teacher Exam Management APIs ───────────────────────────────────────────

/**
 * Get all exams for the current teacher (draft and published)
 */
export const getTeacherExams = async (): Promise<{
  draftExams: any[];
  publishedExams: any[];
}> => {
  const response = await api.get('/teacher/exams');
  return response.data.data;
};

/**
 * Get a specific exam by ID
 */
export const getTeacherExamById = async (examId: string): Promise<any> => {
  const response = await api.get(`/teacher/exams/${examId}`);
  return response.data.data;
};

/**
 * Create a new exam (draft)
 * POST /api/exams
 */
export const saveTeacherExam = async (examData: {
  classId: string;
  title: string;
  examType: string;
  totalMarks: number;
  duration: number;
  instructions?: string;
  selectedSection?: string;
  gradeId?: string;
  subjectId?: string;
  examPassword?: string;
  isLocked?: boolean;
  passwordRequired?: boolean;
  questions?: any[];
}): Promise<any> => {
  const response = await api.post('/teacher/exams', examData);
  return response.data.data;
};

/**
 * Update a draft exam
 * PATCH /api/exams/:id
 */
export const updateTeacherExam = async (
  examId: string,
  updateData: {
    title?: string;
    examType?: string;
    totalMarks?: number;
    duration?: number;
    instructions?: string;
    selectedSection?: string;
    gradeId?: string;
    subjectId?: string;
    examPassword?: string;
    isLocked?: boolean;
    passwordRequired?: boolean;
    questions?: any[];
  }
): Promise<any> => {
  const response = await api.patch(`/teacher/exams/${examId}`, updateData);
  return response.data.data;
};

/**
 * Publish a draft exam
 * POST /api/exams/:id/publish
 */
export const publishTeacherExam = async (examId: string): Promise<any> => {
  const response = await api.post(`/teacher/exams/${examId}/publish`);
  return response.data.data;
};

/**
 * Delete a draft exam
 * DELETE /api/exams/:id
 */
export const deleteTeacherExam = async (examId: string): Promise<any> => {
  const response = await api.delete(`/teacher/exams/${examId}`);
  return response.data.data;
};

// ─── Grade & Subject Selection APIs ────────────────────────────────────────

/**
 * Get all available grades
 * GET /api/teacher/exam-grades
 */
export const getGradesForExams = async (): Promise<any[]> => {
  try {
    const response = await api.get('/teacher/exam-grades');
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching grades:', error);
    return [];
  }
};

/**
 * Get all courses/subjects for a specific grade
 * GET /api/teacher/exam-grades/:gradeId/courses
 */
export const getCoursesByGradeForExams = async (gradeId: string): Promise<any[]> => {
  try {
    const response = await api.get(`/teacher/exam-grades/${gradeId}/courses`);
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
};

/**
 * Get all courses taught by the current teacher
 * GET /api/teacher/exam-courses
 */
export const getTeacherCoursesForExams = async (): Promise<any[]> => {
  try {
    const response = await api.get('/teacher/exam-courses');
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching teacher courses:', error);
    return [];
  }
};
