import api from './api';

export interface Branch {
  id: string;
  name: string;
  code: string;
  phone: string;
  email: string;
  address: string;
  logoUrl?: string;
}

export interface CreateBranchData {
  name: string;
  code: string;
  phone: string;
  email: string;
  address: string;
  logoUrl?: string;
}

export interface UpdateBranchData {
  name?: string;
  code?: string;
  phone?: string;
  email?: string;
  address?: string;
  logoUrl?: string;
}

export const branchService = {
  // Get all branches
  getAllBranches: async () => {
    const response = await api.get('/super-admin/branches');
    return response.data;
  },

  // Get branch by ID
  getBranchById: async (branchId: string) => {
    const response = await api.get(`/super-admin/branches/${branchId}`);
    return response.data;
  },

  // Create new branch
  createBranch: async (data: CreateBranchData) => {
    const response = await api.post('/super-admin/branches', data);
    return response.data;
  },

  // Update branch
  updateBranch: async (branchId: string, data: UpdateBranchData) => {
    const response = await api.patch(`/super-admin/branches/${branchId}`, data);
    return response.data;
  },

  // Delete branch
  deleteBranch: async (branchId: string) => {
    const response = await api.delete(`/super-admin/branches/${branchId}`);
    return response.data;
  },
};
