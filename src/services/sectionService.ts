import api from './api';

export interface SectionInfo {
  id: string;
  name: string;
  capacity: number;
  current_count: number;
  available_slots: number;
}

export interface AssignmentResult {
  success: boolean;
  studentId: string;
  fromSection?: string;
  toSection: string;
  message: string;
}

/**
 * Get available sections for a grade with capacity info
 */
export const getAvailableSections = async (grade: string): Promise<SectionInfo[]> => {
  const response = await api.get(`/sections/available`, {
    params: { grade }
  });
  return response.data.data?.sections || [];
};

/**
 * Assign a single student to a section
 */
export const assignStudentToSection = async (
  studentId: string,
  sectionId: string,
  reason?: string
): Promise<AssignmentResult> => {
  const response = await api.patch(`/sections/${studentId}/section`, {
    sectionId,
    reason: reason || 'Manual assignment'
  });
  return response.data.data;
};

/**
 * Auto-assign a student to least-loaded section
 */
export const autoAssignStudent = async (studentId: string): Promise<AssignmentResult> => {
  const response = await api.post(`/sections/${studentId}/auto-assign`);
  return response.data.data;
};

/**
 * Bulk assign multiple students to a section
 */
export const bulkAssignStudents = async (
  sectionId: string,
  studentIds: string[],
  reason?: string
): Promise<{ results: AssignmentResult[]; summary: { successful: number; failed: number } }> => {
  const response = await api.post(`/sections/${sectionId}/assign-students`, {
    studentIds,
    reason: reason || 'Bulk assignment'
  });
  return response.data.data;
};

/**
 * Swap two students' sections atomically
 */
export const swapStudentSections = async (
  studentAId: string,
  studentBId: string
): Promise<{ success: boolean; message: string }> => {
  const response = await api.post(`/sections/swap-sections`, {
    studentAId,
    studentBId
  });
  return response.data.data;
};

export default {
  getAvailableSections,
  assignStudentToSection,
  autoAssignStudent,
  bulkAssignStudents,
  swapStudentSections
};
