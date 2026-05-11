import api from './api';

export interface VPDashboard {
  totalClasses: number;
  totalStudents: number;
  totalTeachers: number;
  todayAttendanceRate: number;
  pendingAttendanceReviews: number;
  attendanceAlerts: number;
  lowAttendanceClasses: {
    classId: string;
    className: string;
    attendanceRate: number;
  }[];
}

export interface AttendanceOverview {
  classId: string;
  className: string;
  section: string;
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  attendanceRate: number;
  teacherName: string;
}

export interface AttendanceAlert {
  id: string;
  type: 'Low Attendance' | 'Consecutive Absences' | 'Late Pattern' | 'Unexcused';
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  details: string;
  severity: 'Low' | 'Medium' | 'High';
  date: string;
  status: 'Pending' | 'Reviewed' | 'Resolved';
}

export interface ApproveAttendanceData {
  status: 'Approved' | 'Flagged';
  remarks?: string;
}

const vicePrincipalService = {
  getDashboard: async (): Promise<VPDashboard> => {
    const response = await api.get('/vice-principal/dashboard');
    return response.data.data;
  },

  getAttendanceOverview: async (date?: string): Promise<AttendanceOverview[]> => {
    const response = await api.get('/vice-principal/attendance/overview', {
      params: { date }
    });
    return response.data.data;
  },

  getAttendanceAlerts: async (): Promise<AttendanceAlert[]> => {
    const response = await api.get('/vice-principal/attendance/alerts');
    return response.data.data;
  },

  approveAttendance: async (id: string, data: ApproveAttendanceData): Promise<void> => {
    await api.patch(`/vice-principal/attendance/${id}/approve`, data);
  },
};

export default vicePrincipalService;

// Absence Queue Interfaces
export interface AbsenceQueueItem {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  date: string;
  status: 'pending' | 'excused' | 'notified';
  reason?: string;
  teacherNote?: string;
}

export interface UpdateAbsenceStatusData {
  status: 'excused' | 'notified';
}

// Weekly Plan Review Interfaces
export interface WeeklyPlanForReview {
  id: string;
  teacherId: string;
  teacherName: string;
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
  status: 'Pending' | 'Approved' | 'Revision Required';
  deanFeedback?: string;
  deanRating?: number;
}

export interface ReviewWeeklyPlanData {
  status: 'Approved' | 'Revision Required';
  deanFeedback: string;
  deanRating: number; // 1-5
}

// Grade Lock Interfaces
export interface GradeLock {
  id: string;
  gradeLevel: string;
  isLocked: boolean;
  academicYearId: string;
  lockedBy?: string;
  lockedAt?: string;
}

export interface ToggleGradeLockData {
  gradeLevel: string;
  isLocked: boolean;
  academicYearId: string;
}

// VP Reports Interfaces
export interface VPTeacher {
  id: string;
  digitalId: string;
  name: string;
  email: string;
  subjects: string[];
  classes: string[];
  weeklyPlansSubmitted: number;
  attendanceMarked: number;
}

export interface AttendanceSummary {
  date: string;
  totalClasses: number;
  markedClasses: number;
  pendingClasses: number;
  averageAttendanceRate: number;
}

export interface AcademicPerformance {
  gradeLevel: string;
  totalStudents: number;
  averageGrade: number;
  passRate: number;
  failRate: number;
  topPerformers: Array<{
    studentId: string;
    studentName: string;
    grade: number;
  }>;
}

// Absence Queue Methods
export const getAbsenceQueue = async (): Promise<AbsenceQueueItem[]> => {
  const response = await api.get('/vice-principal/absence-queue');
  return response.data;
};

export const updateAbsenceStatus = async (id: string, data: UpdateAbsenceStatusData) => {
  const response = await api.patch(`/vice-principal/absence-queue/${id}`, data);
  return response.data;
};

// Weekly Plans Review Methods
export const getWeeklyPlansForReview = async (): Promise<WeeklyPlanForReview[]> => {
  const response = await api.get('/vice-principal/weekly-plans');
  return response.data;
};

export const reviewWeeklyPlan = async (planId: string, data: ReviewWeeklyPlanData) => {
  const response = await api.patch(`/vice-principal/weekly-plans/${planId}/review`, data);
  return response.data;
};

// Grade Locks Methods
export const getGradeLocks = async (): Promise<GradeLock[]> => {
  const response = await api.get('/vice-principal/grade-locks');
  return response.data;
};

export const toggleGradeLock = async (data: ToggleGradeLockData): Promise<GradeLock> => {
  const response = await api.post('/vice-principal/grade-locks', data);
  return response.data;
};

// VP Reports Methods
export const getVPTeachers = async (): Promise<VPTeacher[]> => {
  const response = await api.get('/vice-principal/teachers');
  return response.data;
};

export const getAttendanceSummary = async (): Promise<AttendanceSummary[]> => {
  const response = await api.get('/vice-principal/attendance-summary');
  return response.data;
};

export const getAcademicPerformance = async (): Promise<AcademicPerformance[]> => {
  const response = await api.get('/vice-principal/academic-performance');
  return response.data;
};
