import api from './api';

export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  gradeLevel: string;
  branchId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseWithGrade {
  name: string;
  code: string;
  grade_level: string;
}

export interface CreateSubjectData {
  name: string;
  code: string;
  description?: string;
  gradeLevel: string;
}

export interface UpdateSubjectData {
  name?: string;
  code?: string;
  description?: string;
  gradeLevel?: string;
}

const subjectService = {
  createSubject: async (data: CreateSubjectData): Promise<Subject> => {
    const response = await api.post('/school-admin/subjects', data);
    return response.data.data;
  },

  getAllSubjects: async (): Promise<Subject[]> => {
    const response = await api.get('/school-admin/subjects');
    return response.data.data;
  },

  // Fetches distinct courses (name + grade_level) from the courses table via classes
  // Used by the HoD promotion modal to show real DB courses per grade
  getCoursesWithGrade: async (): Promise<CourseWithGrade[]> => {
    const response = await api.get('/school-admin/courses-with-grade');
    return response.data.data;
  },

  updateSubject: async (id: string, data: UpdateSubjectData): Promise<Subject> => {
    const response = await api.post(`/school-admin/subjects/${id}`, data);
    return response.data.data;
  },

  deleteSubject: async (id: string): Promise<void> => {
    await api.delete(`/school-admin/subjects/${id}`);
  },
};

export default subjectService;
