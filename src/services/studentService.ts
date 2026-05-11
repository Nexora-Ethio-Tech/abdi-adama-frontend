import api from './api';

export interface Student {
  id: string;
  digitalId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth: string;
  gender: string;
  grade: string;
  classId?: string;
  className?: string;
  branchId: string;
  status: 'Active' | 'Inactive' | 'Suspended' | 'Graduated';
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  address?: string;
  enrollmentDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudentData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth: string;
  gender: string;
  grade: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  address?: string;
}

export interface UpdateStudentData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  grade?: string;
  status?: 'Active' | 'Inactive' | 'Suspended' | 'Graduated';
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  address?: string;
}

export interface StudentFilters {
  classId?: string;
  grade?: string;
  status?: string;
}

const studentService = {
  createStudent: async (data: CreateStudentData): Promise<Student> => {
    const response = await api.post('/school-admin/students', data);
    return response.data.data;
  },

  getAllStudents: async (filters?: StudentFilters): Promise<Student[]> => {
    const response = await api.get('/school-admin/students', { params: filters });
    return response.data.data;
  },

  getStudentById: async (id: string): Promise<Student> => {
    const response = await api.get(`/school-admin/students/${id}`);
    return response.data.data;
  },

  updateStudent: async (id: string, data: UpdateStudentData): Promise<Student> => {
    const response = await api.patch(`/school-admin/students/${id}`, data);
    return response.data.data;
  },

  deleteStudent: async (id: string): Promise<void> => {
    await api.delete(`/school-admin/students/${id}`);
  },

  assignClass: async (id: string, classId: string): Promise<Student> => {
    const response = await api.patch(`/school-admin/students/${id}/assign-class`, { classId });
    return response.data.data;
  },

  getStudentsByClass: async (classId: string): Promise<Student[]> => {
    const response = await api.get(`/school-admin/students/class/${classId}`);
    return response.data.data;
  },
};

export default studentService;
