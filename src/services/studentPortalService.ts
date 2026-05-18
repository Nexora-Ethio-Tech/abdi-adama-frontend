const API_BASE_URL = 'https://api.abdi-adama.com/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

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
  const response = await fetch(`${API_BASE_URL}/student/dashboard`, {
    headers: getAuthHeaders(),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error?.message || 'Failed to fetch dashboard');
  return result.data;
};

export const getMyCourses = async (): Promise<StudentCourse[]> => {
  const response = await fetch(`${API_BASE_URL}/student/courses`, {
    headers: getAuthHeaders(),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error?.message || 'Failed to fetch courses');
  return result.data;
};

export const getMyGrades = async (courseId?: string): Promise<StudentGrade[]> => {
  const url = courseId 
    ? `${API_BASE_URL}/student/grades/${courseId}`
    : `${API_BASE_URL}/student/grades`;
  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error?.message || 'Failed to fetch grades');
  return result.data;
};

export const getMySchedule = async (): Promise<StudentSchedule[]> => {
  const response = await fetch(`${API_BASE_URL}/student/schedule`, {
    headers: getAuthHeaders(),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error?.message || 'Failed to fetch schedule');
  return result.data;
};

export const getMyTranscript = async (academicYear?: string, semester?: string): Promise<Transcript[]> => {
  const params = new URLSearchParams();
  if (academicYear) params.append('academicYear', academicYear);
  if (semester) params.append('semester', semester);
  
  const response = await fetch(`${API_BASE_URL}/student/transcript?${params}`, {
    headers: getAuthHeaders(),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error?.message || 'Failed to fetch transcript');
  return result.data;
};

export const getMyAttendance = async (): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/student/attendance`, {
    headers: getAuthHeaders(),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error?.message || 'Failed to fetch attendance');
  return result.data;
};
