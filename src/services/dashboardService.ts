import api from './api';

export const dashboardService = {
  // Super Admin Dashboard
  getSuperAdminDashboard: async () => {
    const response = await api.get('/super-admin/dashboard');
    return response.data;
  },

  // Super Admin Analytics
  getSuperAdminAnalytics: async (branchId?: string | null) => {
    const params = branchId ? `?branchId=${encodeURIComponent(branchId)}` : '';
    const response = await api.get(`/super-admin/analytics${params}`);
    return response.data;
  },

  // School Admin Dashboard
  getSchoolAdminDashboard: async () => {
    const response = await api.get('/school-admin/dashboard');
    return response.data;
  },

  // Teacher Dashboard
  getTeacherDashboard: async () => {
    const response = await api.get('/teacher/dashboard');
    return response.data;
  },

  // Vice Principal Dashboard
  getVicePrincipalDashboard: async () => {
    const response = await api.get('/vice-principal/dashboard');
    return response.data;
  },

  // Finance Clerk Dashboard
  getFinanceClerkDashboard: async () => {
    const response = await api.get('/finance-clerk/dashboard');
    return response.data;
  },

  // Auditor Dashboard
  getAuditorDashboard: async () => {
    const response = await api.get('/auditor/dashboard');
    return response.data;
  },
};
