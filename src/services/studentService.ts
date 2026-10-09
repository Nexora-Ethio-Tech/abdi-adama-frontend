import api from './api';
import { cachedStudentList, invalidateStudentLists } from './studentListCache';

export interface StudentListFilters {
  search?: string;
  grade?: string;
  section?: string;
  status?: string;
}

export interface StudentListRow {
  id: string;
  student_id: string;
  user_id: string;
  digital_id: string;
  name: string;
  email: string;
  grade: string;
  status: string;
  class_id: string | null;
  class_name: string | null;
  class_section: string | null;
}

export interface StudentPage {
  data: StudentListRow[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

const requestStudentPage = async (filters: StudentListFilters, page: number, pageSize: number): Promise<StudentPage> => {
  const response = await api.get('/school-admin/students', { params: { ...filters, page, pageSize } });
  return response.data;
};

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
  invalidateLists: invalidateStudentLists,

  getStudentPage: (filters: StudentListFilters, page: number, pageSize: number, scope: string): Promise<StudentPage> => {
    const session = localStorage.getItem('abdi_adama_token') || '';
    const key = JSON.stringify([filters.search || '', filters.grade || '', filters.section || '', filters.status || '', page, pageSize]);
    return cachedStudentList(`${session}:${scope}`, key, () => requestStudentPage(filters, page, pageSize));
  },

  // Full matching records are loaded only for an explicit export or bulk selection.
  getMatchingStudents: async (filters: StudentListFilters): Promise<StudentListRow[]> => {
    const rows = new Map<string, StudentListRow>();
    let page = 1;
    const session = localStorage.getItem('abdi_adama_token');
    while (true) {
      if (localStorage.getItem('abdi_adama_token') !== session) throw new Error('Session changed. Please try again.');
      const result = await requestStudentPage(filters, page, 100);
      result.data.forEach(row => rows.set(row.id, row));
      if (result.pagination.page >= result.pagination.totalPages || result.pagination.page < page) break;
      page++;
    }
    return [...rows.values()];
  },

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
    const response = await api.post(`/school-admin/students/${id}`, data);
    return response.data.data;
  },

  deleteStudent: async (studentId: string, userId?: string): Promise<void> => {
    // Try the dedicated students endpoint first (uses students.id PK)
    try {
      await api.delete(`/school-admin/students/${studentId}`);
      return;
    } catch (err: any) {
      // If 404, the route may not exist on the deployed server — fall through
      if (err.response?.status !== 404) {
        throw err;
      }
    }

    // Fallback: delete via /users endpoint using the user_id (not students.id PK)
    const deleteId = userId || studentId;
    await api.delete(`/school-admin/users/${deleteId}`);
  },

  assignClass: async (id: string, classId: string): Promise<Student> => {
    const response = await api.post(`/school-admin/students/${id}/assign-class`, { classId });
    return response.data.data;
  },

  getStudentsByClass: async (classId: string): Promise<Student[]> => {
    const response = await api.get(`/school-admin/students/class/${classId}`);
    return response.data.data;
  },
};

export default studentService;
