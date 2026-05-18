import api from './api';

export interface Class {
  id: string;
  name: string;
  capacity: number;
  section: string;
  teacherId?: string;
  teacherName?: string;
  branchId?: string;
}

export interface CreateClassData {
  name: string;
  capacity: number;
  section: string;
}

export interface UpdateClassData {
  name?: string;
  capacity?: number;
  section?: string;
}

export const classService = {
  // Create class
  createClass: async (data: CreateClassData) => {
    const response = await api.post('/school-admin/classes', data);
    return response.data;
  },

  // Get all classes
  getAllClasses: async () => {
    const response = await api.get('/school-admin/classes');
    return response.data;
  },

  // Update class
  updateClass: async (classId: string, data: UpdateClassData) => {
    const response = await api.patch(`/school-admin/classes/${classId}`, data);
    return response.data;
  },

  // Delete class
  deleteClass: async (classId: string) => {
    const response = await api.delete(`/school-admin/classes/${classId}`);
    return response.data;
  },

  // Assign teacher to class
  assignTeacher: async (classId: string, teacherId: string) => {
    const response = await api.patch(`/school-admin/classes/${classId}/assign-teacher`, { teacherId });
    return response.data;
  },
};

export default classService;
