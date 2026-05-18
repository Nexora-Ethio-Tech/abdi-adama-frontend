import api from './api';
import { API_ENDPOINTS } from '../config/api';

export const authService = {
  // Login
  login: async (email: string, password: string) => {
    const response = await api.post(API_ENDPOINTS.LOGIN, { email, password });
    const { accessToken, refreshToken, user } = response.data.data;
    
    localStorage.setItem('abdi_adama_token', accessToken);
    localStorage.setItem('abdi_adama_refresh_token', refreshToken);
    localStorage.setItem('abdi_adama_user', JSON.stringify(user));
    
    return response.data;
  },

  // Logout
  logout: async () => {
    try {
      await api.post(API_ENDPOINTS.LOGOUT);
    } finally {
      localStorage.removeItem('abdi_adama_token');
      localStorage.removeItem('abdi_adama_refresh_token');
      localStorage.removeItem('abdi_adama_user');
    }
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await api.get(API_ENDPOINTS.ME);
    return response.data.data;
  },

  // Change password
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post(API_ENDPOINTS.CHANGE_PASSWORD, {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  // Get stored user
  getStoredUser: () => {
    const user = localStorage.getItem('abdi_adama_user');
    return user ? JSON.parse(user) : null;
  },

  // Check if authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('abdi_adama_token');
  },
};
