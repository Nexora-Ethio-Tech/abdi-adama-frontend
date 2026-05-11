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
};

export default teacherService;
