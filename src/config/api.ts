export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',
  REFRESH_TOKEN: '/auth/refresh-token',
  CHANGE_PASSWORD: '/auth/change-password',
  
  // Super Admin
  CREATE_SCHOOL_ADMIN: '/super-admin/create-school-admin',
  CREATE_VICE_PRINCIPAL: '/super-admin/create-vice-principal',
  CREATE_AUDITOR: '/super-admin/create-auditor',
  GET_ALL_USERS: '/super-admin/users',
  GET_USER: (id: string) => `/super-admin/users/${id}`,
  UPDATE_USER_STATUS: (id: string) => `/super-admin/users/${id}/status`,
  DELETE_USER: (id: string) => `/super-admin/users/${id}`,
  
  // School Admin
  REGISTER_USER: '/school-admin/register-user',
  GET_BRANCH_USERS: '/school-admin/users',
  GET_BRANCH_USER: (id: string) => `/school-admin/users/${id}`,
};
