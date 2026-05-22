import api from './api';

// Student Dashboard Interface
export interface StudentDashboard {
  student: {
    id: string;
    digitalId: string;
    name: string;
    email: string;
    grade: string;
    class: string;
    status: string;
  };
  stats: {
    totalCourses: number;
    averageGrade: number;
    attendanceRate: number;
    upcomingExams: number;
  };
  recentGrades: Array<{
    courseId: string;
    courseName: string;
    grade: number;
    date: string;
  }>;
  upcomingExams: Array<{
    id: string;
    subject: string;
    date: string;
    time: string;
    location: string;
  }>;
}

// Course Interface
export interface StudentCourse {
  id: string;
  name: string;
  code: string;
  teacher: {
    id: string;
    name: string;
    email: string;
  };
  schedule: string;
  room: string;
  credits: number;
  currentGrade?: number;
}

// Grade Interface
export interface StudentGrade {
  id: string;
  courseId: string;
  courseName: string;
  assessmentType: string;
  score: number;
  maxScore: number;
  percentage: number;
  weight: string;
  date: string;
  feedback?: string;
}

// Schedule Interface
export interface StudentSchedule {
  day: string;
  timeSlot: string;
  subject: string;
  teacher: string;
  room: string;
}

// Transcript Interface
export interface Transcript {
  academicYear: string;
  semester: string;
  courses: Array<{
    courseName: string;
    courseCode: string;
    credits: number;
    grade: number;
    letterGrade: string;
  }>;
  gpa: number;
  totalCredits: number;
}

// Student Dashboard Methods
export const getStudentDashboard = async (): Promise<StudentDashboard> => {
  const response = await api.get('/student/dashboard');
  return response.data.data;
};

export const getMyCourses = async (): Promise<StudentCourse[]> => {
  const response = await api.get('/student/courses');
  return response.data.data;
};

export const getMyGrades = async (courseId?: string): Promise<StudentGrade[]> => {
  const url = courseId 
    ? `/student/grades/${courseId}`
    : '/student/grades';
  const response = await api.get(url);
  return response.data.data;
};

export const getMySchedule = async (): Promise<StudentSchedule[]> => {
  const response = await api.get('/student/schedule');
  return response.data.data;
};

export const getMyTranscript = async (academicYear?: string, semester?: string): Promise<Transcript[]> => {
  const params = new URLSearchParams();
  if (academicYear) params.append('academicYear', academicYear);
  if (semester) params.append('semester', semester);
  
  const response = await api.get(`/student/transcript?${params.toString()}`);
  return response.data.data;
};

export const getMyAttendance = async (): Promise<any> => {
  const response = await api.get('/student/attendance');
  return response.data.data;
};
