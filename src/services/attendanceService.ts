import api from './api';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName?: string;
  classId: string;
  className?: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'Excused';
  remarks?: string;
  markedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarkAttendanceData {
  studentId: string;
  classId: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'Excused';
  remarks?: string;
}

export interface BulkAttendanceData {
  classId: string;
  date: string;
  records: {
    studentId: string;
    status: 'Present' | 'Absent' | 'Late' | 'Excused';
    remarks?: string;
  }[];
}

export interface UpdateAttendanceData {
  status?: 'Present' | 'Absent' | 'Late' | 'Excused';
  remarks?: string;
}

export interface AttendanceFilters {
  date?: string;
  classId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

const attendanceService = {
  markAttendance: async (data: MarkAttendanceData): Promise<AttendanceRecord> => {
    const response = await api.post('/school-admin/attendance', data);
    return response.data.data;
  },

  getAllAttendance: async (filters?: AttendanceFilters): Promise<AttendanceRecord[]> => {
    const response = await api.get('/school-admin/attendance', { params: filters });
    return response.data.data;
  },

  getAttendanceByClass: async (classId: string, date?: string): Promise<AttendanceRecord[]> => {
    const response = await api.get(`/school-admin/attendance/class/${classId}`, {
      params: { date }
    });
    return response.data.data;
  },

  getStudentAttendance: async (studentId: string, startDate?: string, endDate?: string): Promise<AttendanceRecord[]> => {
    const response = await api.get(`/school-admin/attendance/student/${studentId}`, {
      params: { startDate, endDate }
    });
    return response.data.data;
  },

  updateAttendance: async (id: string, data: UpdateAttendanceData): Promise<AttendanceRecord> => {
    const response = await api.patch(`/school-admin/attendance/${id}`, data);
    return response.data.data;
  },
};

export default attendanceService;
