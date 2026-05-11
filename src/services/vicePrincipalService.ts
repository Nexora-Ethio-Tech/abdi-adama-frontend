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
