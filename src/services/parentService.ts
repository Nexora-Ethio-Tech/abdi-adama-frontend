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
  teacher_note?: string;
  teacher_name?: string;
}

export const getParentDashboard = async (): Promise<{ children: ParentChild[]; announcements: ParentAnnouncement[] }> => {
  const response = await api.get('/parent/dashboard');
  return response.data.data;
};

export const getChildCommunicationLogs = async (studentId: string): Promise<CommunicationLog[]> => {
  const response = await api.get(`/parent/child/${studentId}/communication`);
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
