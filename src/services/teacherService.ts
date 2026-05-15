import api from './api';

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const getTeacherDashboard = async () => {
  const response = await api.get('/teacher/dashboard');
  return response.data.data;
};

// ─── Schedule ─────────────────────────────────────────────────────────────────
export const getTeacherSchedule = async () => {
  const response = await api.get('/teacher/schedule');
  return response.data.data;
};

// ─── Classes ──────────────────────────────────────────────────────────────────
export const getMyClasses = async () => {
  const response = await api.get('/teacher/classes');
  return response.data.data;
};

// ─── Students ─────────────────────────────────────────────────────────────────
export const getClassStudents = async (classId: string) => {
  const response = await api.get(`/teacher/students/${classId}`);
  return response.data.data;
};

// ─── Attendance ───────────────────────────────────────────────────────────────
export const markAttendance = async (data: {
  date: string;
  attendanceRecords: Array<{
    studentId: string;
    status: 'present' | 'absent' | 'late' | 'excused';
  }>;
}) => {
  const response = await api.post('/teacher/attendance', data);
  return response.data;
};

export const getClassAttendance = async (classId: string, date?: string) => {
  const params = date ? `?date=${date}` : '';
  const response = await api.get(`/teacher/attendance/${classId}${params}`);
  return response.data.data;
};

// ─── Grades ───────────────────────────────────────────────────────────────────
export const enterGrade = async (data: {
  studentId: string;
  courseId: string;
  type: string;
  score: number;
  total: number;
  weight?: string;
}) => {
  const response = await api.post('/teacher/grades', data);
  return response.data;
};

export const getCourseGrades = async (courseId: string) => {
  const response = await api.get(`/teacher/grades/${courseId}`);
  return response.data.data;
};

// ─── Weekly Plans ─────────────────────────────────────────────────────────────
export const submitWeeklyPlan = async (data: {
  date: string;
  content: string;
  objectives: string;
  teacherActivity: string;
  timeDuration: string;
  studentActivity: string;
  teachingMethod: string;
  teachingAids: string;
  evaluation: string;
  remark?: string;
  status?: 'Draft' | 'Pending';
}) => {
  const response = await api.post('/teacher/weekly-plans', data);
  return response.data;
};

export const getMyWeeklyPlans = async (status?: string) => {
  const params = status ? `?status=${status}` : '';
  const response = await api.get(`/teacher/weekly-plans${params}`);
  return response.data.data;
};

export const updateWeeklyPlan = async (planId: string, data: {
  date?: string;
  content?: string;
  objectives?: string;
  teacherActivity?: string;
  timeDuration?: string;
  studentActivity?: string;
  teachingMethod?: string;
  teachingAids?: string;
  evaluation?: string;
  remark?: string;
  status?: 'Draft' | 'Pending';
}) => {
  const response = await api.patch(`/teacher/weekly-plans/${planId}`, data);
  return response.data;
};

// ─── Communication Logs ───────────────────────────────────────────────────────
export const submitCommunicationLog = async (data: {
  studentId: string;
  weekEnding: string;
  ratingUniform: number;
  ratingMaterials: number;
  ratingHomework: number;
  ratingParticipation: number;
  ratingConduct: number;
  ratingSocial: number;
  ratingPunctuality: number;
  ratingNoteTaking: number;
  teacherNote?: string;
}) => {
  const response = await api.post('/teacher/communication-logs', data);
  return response.data;
};

export const getCommunicationLogs = async (studentId: string) => {
  const response = await api.get(`/teacher/communication-logs/${studentId}`);
  return response.data.data;
};

// ─── TypeScript Interfaces ────────────────────────────────────────────────────
export interface TeacherClass {
  id: string;
  name: string;
  section: string;
  subject: string;
  gradeLevel?: string;
}

export interface ClassStudent {
  id: string;
  digitalId: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export interface Grade {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  subject: string;
  assessmentType: string;
  score: number;
  maxScore: number;
  percentage: number;
  term: string;
  academicYear: string;
  remarks?: string;
}

export interface SubmitGradeData {
  studentId: string;
  classId: string;
  subject: string;
  assessmentType: string;
  score: number;
  maxScore: number;
  term: string;
  academicYear: string;
  remarks?: string;
}

export interface UpdateGradeData {
  score?: number;
  maxScore?: number;
  remarks?: string;
}

// ─── Additional Grade Methods ─────────────────────────────────────────────────
export const getClassGrades = async (classId: string) => {
  const response = await api.get(`/teacher/grades/class/${classId}`);
  return response.data.data;
};

export const submitGrade = async (data: SubmitGradeData) => {
  const response = await api.post('/teacher/grades', data);
  return response.data;
};

export const updateGrade = async (gradeId: string, data: UpdateGradeData) => {
  const response = await api.patch(`/teacher/grades/${gradeId}`, data);
  return response.data;
};
