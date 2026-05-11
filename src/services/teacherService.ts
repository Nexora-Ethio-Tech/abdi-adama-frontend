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
