import api from './api';

export interface ParentChild {
  id: string;
  fullName: string;
  grade: string;
  attendance?: string;
  performance?: string;
  course_count?: number;
  courses?: Array<{ name: string; code: string; teacher: string }>;
}

export interface ParentAnnouncement {
  id: string;
  priority: string;
  title: string;
  content: string;
  timestamp: string;
  category: string;
  driverName?: string;
  created_by_name?: string;
}

export interface CommunicationLog {
  id: string;
  week_ending: string;
  week_ending_formatted?: string;
  rating_uniform?: number;
  rating_materials?: number;
  rating_homework?: number;
  rating_participation?: number;
  rating_conduct?: number;
  rating_social?: number;
  rating_punctuality?: number;
  rating_note_taking?: number;
  rating_excellent?: number;
  teacher_note?: string;
  teacher_name?: string;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  subjects: string[];
  courses: string[];
  course_codes: string[];
}

export interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  recorded_by: string;
  recorded_by_name?: string;
}

export interface AttendanceStatistics {
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  excused_days: number;
  attendance_percentage: number;
}

export interface AcademicHistoryEntry {
  id: string;
  year: string;
  semester: string;
  grade_level: string;
  average: string;
  rank: string;
  gpa: string;
  courses: Array<{ course_name: string; grade: string; score: number }>;
}

export interface ClinicVisit {
  id: string;
  date: string;
  time: string;
  reason: string;
  treatment: string;
  status: string;
  parent_notified: boolean;
  logged_by_name?: string;
}

export interface HealthProfile {
  blood_group?: string;
  allergies?: string;
  medications?: string;
  chronic_conditions?: string;
  vaccination_status?: string;
  home_medications?: string;
  dob?: string;
  gender?: string;
}

export interface DriverUpdate {
  id: string;
  title: string;
  content: string;
  stations?: string;
  driver_name: string;
  driver_contact_name?: string;
  driver_email?: string;
  created_at: string;
}

export interface FinancialSummary {
  student_id: string;
  student_name: string;
  monthly_fee: number;
  bus_fee: number;
  penalty_fee: number;
  fee_status: string;
  fee_approval_status: string;
  fee_notes: string;
  total_transactions: number;
  total_fees: number;
  balance_due: number;
}

export const getParentDashboard = async (): Promise<{ children: ParentChild[]; announcements: ParentAnnouncement[] }> => {
  const response = await api.get('/parent/dashboard');
  return response.data.data;
};

export const getChildCommunicationLogs = async (studentId: string): Promise<CommunicationLog[]> => {
  const response = await api.get(`/parent/child/${studentId}/communication`);
  return response.data.data;
};

export const getChildTeachers = async (studentId: string): Promise<Teacher[]> => {
  const response = await api.get(`/parent/child/${studentId}/teachers`);
  return response.data.data || [];
};

export const getChildAttendance = async (
  studentId: string,
  month?: number,
  year?: number
): Promise<{ records: AttendanceRecord[]; statistics: AttendanceStatistics }> => {
  const params = new URLSearchParams();
  if (month !== undefined) params.append('month', month.toString());
  if (year !== undefined) params.append('year', year.toString());
  const response = await api.get(`/parent/child/${studentId}/attendance?${params.toString()}`);
  return response.data.data;
};

export const getChildAcademicHistory = async (studentId: string): Promise<AcademicHistoryEntry[]> => {
  const response = await api.get(`/parent/child/${studentId}/academic-history`);
  return response.data.data || [];
};

export const getChildClinicUpdates = async (
  studentId: string
): Promise<{ visits: ClinicVisit[]; health_profile: HealthProfile }> => {
  const response = await api.get(`/parent/child/${studentId}/clinic-updates`);
  return response.data.data;
};

export const getParentChildGrades = async (studentId: string, semester: number, year?: string): Promise<any> => {
  const params = new URLSearchParams();
  params.append('student_id', studentId);
  params.append('semester', semester.toString());
  if (year) params.append('year', year);
  const response = await api.get(`/student/grades?${params.toString()}`);
  return response.data.data;
};

export const getParentChildHistory = async (studentId: string, year: string, semester?: number): Promise<any> => {
  const params = new URLSearchParams();
  params.append('student_id', studentId);
  params.append('year', year);
  if (semester !== undefined) params.append('semester', semester.toString());
  const response = await api.get(`/student/history?${params.toString()}`);
  return response.data.data;
};

export const getDriverUpdates = async (): Promise<DriverUpdate[]> => {
  const response = await api.get('/parent/driver-updates');
  return response.data.data || [];
};

export const getSchoolAnnouncements = async (): Promise<ParentAnnouncement[]> => {
  const response = await api.get('/parent/school-announcements');
  return response.data.data || [];
};

export const getFinancialSummary = async (): Promise<FinancialSummary[]> => {
  const response = await api.get('/parent/finance-summary');
  return response.data.data || [];
};
