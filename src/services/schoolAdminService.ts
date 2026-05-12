import api from './api';

// Dashboard Interface
export interface SchoolAdminDashboard {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  pendingApplications: number;
  attendanceRate: number;
  recentActivities: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>;
}

// User Registration Interface
export interface RegisterUserData {
  name: string;
  email: string;
  role: 'teacher' | 'student' | 'parent' | 'finance-clerk' | 'librarian' | 'clinic-admin' | 'driver';
  grade?: string; // Required for students
  password?: string; // Optional, auto-generated if not provided
}

export interface RegisterUserResponse {
  user: {
    id: string;
    digitalId: string;
    name: string;
    email: string;
    role: string;
    branchId: string;
    status: string;
  };
  temporaryPassword: string;
}

// Course Interface
export interface Course {
  id: string;
  name: string;
  code: string;
  teacherId: string;
  teacherName?: string;
  classId: string;
  className?: string;
}

export interface CreateCourseData {
  name: string;
  code: string;
  teacherId: string;
  classId: string;
}

// Schedule Interface
export interface Schedule {
  id: string;
  teacherId: string;
  teacherName?: string;
  day: string;
  timeSlot: string;
  className: string;
  subject: string;
}

export interface CreateScheduleData {
  teacherId: string;
  day: string;
  timeSlot: string;
  className: string;
  subject: string;
}

// Branch Academic Year Interface
export interface BranchAcademicYear {
  id: string;
  yearName: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  branchId: string;
}

export interface CreateBranchAcademicYearData {
  yearName: string;
  startDate: string;
  endDate: string;
}

// Application Interface
export interface Application {
  id: string;
  studentName: string;
  email: string;
  phone: string;
  grade: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedDate: string;
  documents?: string[];
}

export interface UpdateApplicationStatusData {
  status: 'Approved' | 'Rejected';
}

// Financial Policy Interface
export interface FinancialPolicy {
  id: string;
  gradeLevel: string;
  monthlyTuition: number;
  registrationFee: number;
  busFee: number;
  penaltyRate: number;
  academicYear: string;
  branchId: string;
}

export interface CreateFinancialPolicyData {
  gradeLevel: string;
  monthlyTuition: number;
  registrationFee: number;
  busFee: number;
  penaltyRate: number;
  academicYear: string;
}

// Dashboard
export const getDashboard = async (): Promise<SchoolAdminDashboard> => {
  const response = await api.get('/school-admin/dashboard');
  return response.data;
};

// User Registration
export const registerUser = async (data: RegisterUserData): Promise<RegisterUserResponse> => {
  const response = await api.post('/school-admin/register-user', data);
  return response.data;
};

// Get Branch Users
export const getBranchUsers = async (role?: string, status?: string) => {
  const params = new URLSearchParams();
  if (role) params.append('role', role);
  if (status) params.append('status', status);
  const response = await api.get(`/school-admin/users?${params}`);
  return response.data;
};

// Courses
export const createCourse = async (data: CreateCourseData): Promise<Course> => {
  const response = await api.post('/school-admin/courses', data);
  return response.data;
};

export const getCourses = async (): Promise<Course[]> => {
  const response = await api.get('/school-admin/courses');
  return response.data;
};

// Schedules
export const createSchedule = async (data: CreateScheduleData): Promise<Schedule> => {
  const response = await api.post('/school-admin/schedules', data);
  return response.data;
};

export const getSchedules = async (): Promise<Schedule[]> => {
  const response = await api.get('/school-admin/schedules');
  return response.data;
};

// Branch Academic Years
export const createBranchAcademicYear = async (data: CreateBranchAcademicYearData): Promise<BranchAcademicYear> => {
  const response = await api.post('/school-admin/academic-years', data);
  return response.data;
};

export const getBranchAcademicYears = async (): Promise<BranchAcademicYear[]> => {
  const response = await api.get('/school-admin/academic-years');
  return response.data;
};

export const activateBranchAcademicYear = async (id: string) => {
  const response = await api.patch(`/school-admin/academic-years/${id}/activate`);
  return response.data;
};

// Applications
export const getPendingApplications = async (): Promise<Application[]> => {
  const response = await api.get('/school-admin/applications');
  return response.data;
};

export const updateApplicationStatus = async (id: string, data: UpdateApplicationStatusData) => {
  const response = await api.patch(`/school-admin/applications/${id}/status`, data);
  return response.data;
};

// Financial Policies
export const createFinancialPolicy = async (data: CreateFinancialPolicyData): Promise<FinancialPolicy> => {
  const response = await api.post('/school-admin/financial-policies', data);
  return response.data;
};

export const getFinancialPolicies = async (): Promise<FinancialPolicy[]> => {
  const response = await api.get('/school-admin/financial-policies');
  return response.data;
};

// Get Branch Teachers
export const getBranchTeachers = async () => {
  const response = await api.get('/school-admin/teachers');
  return response.data;
};

// Teacher Management
export const approveTeacher = async (userId: string) => {
  const response = await api.patch(`/school-admin/users/${userId}/status`, {
    status: 'Approved'
  });
  return response.data;
};

export const revokeTeacher = async (userId: string) => {
  const response = await api.patch(`/school-admin/users/${userId}/status`, {
    status: 'Revoked'
  });
  return response.data;
};

export const deleteTeacher = async (userId: string) => {
  const response = await api.delete(`/school-admin/users/${userId}`);
  return response.data;
};
