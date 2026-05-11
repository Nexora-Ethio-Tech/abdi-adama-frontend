import api from './api';

export interface TeacherDashboard {
  totalClasses: number;
  totalStudents: number;
  todaySchedule: {
    classId: string;
    className: string;
    subject: string;
    time: string;
    room: string;
  }[];
  upcomingAssignments: number;
  pendingGrades: number;
}

export interface TeacherClass {
  id: string;
  name: string;
  section: string;
  subject: string;
  capacity: number;
  enrolledStudents: number;
  schedule: string;
  room: string;
}

export interface ClassStudent {
  id: string;
  digitalId: string;
  firstName: string;
  lastName: string;
  email: string;
  grade: string;
  status: string;
  attendanceRate?: number;
}

export interface Grade {
  id: string;
  studentId: string;
  studentName?: string;
  classId: string;
  subject: string;
  assessmentType: 'Quiz' | 'Exam' | 'Assignment' | 'Project' | 'Midterm' | 'Final';
  score: number;
  maxScore: number;
  percentage: number;
  term: string;
  academicYear: string;
  remarks?: string;
  submittedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitGradeData {
  studentId: string;
  classId: string;
  subject: string;
  assessmentType: 'Quiz' | 'Exam' | 'Assignment' | 'Project' | 'Midterm' | 'Final';
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

const teacherService = {
  getDashboard: async (): Promise<TeacherDashboard> => {
    const response = await api.get('/teacher/dashboard');
    return response.data.data;
  },

  getMyClasses: async (): Promise<TeacherClass[]> => {
    const response = await api.get('/teacher/classes');
    return response.data.data;
  },

  getClassStudents: async (classId: string): Promise<ClassStudent[]> => {
    const response = await api.get(`/teacher/classes/${classId}/students`);
    return response.data.data;
  },

  submitGrade: async (data: SubmitGradeData): Promise<Grade> => {
    const response = await api.post('/teacher/grades', data);
    return response.data.data;
  },

  getClassGrades: async (classId: string): Promise<Grade[]> => {
    const response = await api.get(`/teacher/grades/class/${classId}`);
    return response.data.data;
  },

  getStudentGrades: async (studentId: string): Promise<Grade[]> => {
    const response = await api.get(`/teacher/grades/student/${studentId}`);
    return response.data.data;
  },

  updateGrade: async (gradeId: string, data: UpdateGradeData): Promise<Grade> => {
    const response = await api.patch(`/teacher/grades/${gradeId}`, data);
    return response.data.data;
  },
};

export default teacherService;

// Teacher Attendance Interfaces
export interface MarkAttendanceData {
  date: string;
  attendanceRecords: Array<{
    studentId: string;
    status: 'present' | 'absent' | 'late' | 'excused';
  }>;
}

export interface TeacherAttendanceRecord {
  id: string;
  date: string;
  classId: string;
  className: string;
  studentId: string;
  studentName: string;
  status: 'present' | 'absent' | 'late' | 'excused';
}

// Teacher Schedule Interface
export interface TeacherScheduleItem {
  id: string;
  day: string;
  timeSlot: string;
  className: string;
  subject: string;
  room?: string;
}

// Weekly Plan Interfaces
export interface WeeklyPlan {
  id: string;
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
  status: 'Draft' | 'Pending' | 'Approved' | 'Revision Required';
  deanFeedback?: string;
  deanRating?: number;
}

export interface SubmitWeeklyPlanData {
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
  status: 'Draft' | 'Pending';
}

export interface UpdateWeeklyPlanData {
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
}

// Communication Log Interfaces
export interface CommunicationLog {
  id: string;
  studentId: string;
  studentName: string;
  weekEnding: string;
  ratingUniform: number;
  ratingMaterials: number;
  ratingHomework: number;
  ratingParticipation: number;
  ratingConduct: number;
  ratingSocial: number;
  ratingPunctuality: number;
  ratingNoteTaking: number;
  teacherNote: string;
  createdAt: string;
}

export interface SubmitCommunicationLogData {
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
  teacherNote: string;
}

// Teacher Attendance Methods
export const markAttendance = async (data: MarkAttendanceData) => {
  const response = await api.post('/teacher/attendance', data);
  return response.data;
};

export const getAttendanceByClass = async (classId: string): Promise<TeacherAttendanceRecord[]> => {
  const response = await api.get(`/teacher/attendance/${classId}`);
  return response.data;
};

// Teacher Schedule Methods
export const getTeacherSchedule = async (): Promise<TeacherScheduleItem[]> => {
  const response = await api.get('/teacher/schedule');
  return response.data;
};

// Weekly Plans Methods
export const submitWeeklyPlan = async (data: SubmitWeeklyPlanData): Promise<WeeklyPlan> => {
  const response = await api.post('/teacher/weekly-plans', data);
  return response.data;
};

export const getMyWeeklyPlans = async (): Promise<WeeklyPlan[]> => {
  const response = await api.get('/teacher/weekly-plans');
  return response.data;
};

export const updateWeeklyPlan = async (planId: string, data: UpdateWeeklyPlanData): Promise<WeeklyPlan> => {
  const response = await api.patch(`/teacher/weekly-plans/${planId}`, data);
  return response.data;
};

// Communication Logs Methods
export const submitCommunicationLog = async (data: SubmitCommunicationLogData): Promise<CommunicationLog> => {
  const response = await api.post('/teacher/communication-logs', data);
  return response.data;
};

export const getCommunicationLogs = async (studentId: string): Promise<CommunicationLog[]> => {
  const response = await api.get(`/teacher/communication-logs/${studentId}`);
  return response.data;
};
