import api from './api';

export interface FinanceDashboard {
  totalRevenue: number;
  monthlyRevenue: number;
  pendingPayments: number;
  totalStudents: number;
  paidStudents: number;
  unpaidStudents: number;
  partiallyPaidStudents: number;
  recentPayments: {
    id: string;
    studentName: string;
    amount: number;
    date: string;
  }[];
}

export interface FeeRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentDigitalId: string;
  grade: string;
  feeType: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'Paid' | 'Pending' | 'Partial' | 'Overdue';
  dueDate: string;
  academicYear: string;
  term: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeePayment {
  studentId: string;
  feeType: string;
  amount: number;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'Mobile Money' | 'Cheque';
  transactionReference?: string;
  remarks?: string;
  academicYear: string;
  term: string;
}

export interface FeeFilters {
  status?: string;
  grade?: string;
  term?: string;
  academicYear?: string;
}

const financeService = {
  getDashboard: async (): Promise<FinanceDashboard> => {
    const response = await api.get('/finance-clerk/dashboard');
    return response.data.data;
  },

  getAllFees: async (filters?: FeeFilters): Promise<FeeRecord[]> => {
    const response = await api.get('/finance-clerk/fees', { params: filters });
    return response.data.data;
  },

  getStudentFees: async (studentId: string): Promise<FeeRecord[]> => {
    const response = await api.get(`/finance-clerk/fees/student/${studentId}`);
    return response.data.data;
  },

  recordPayment: async (data: FeePayment): Promise<FeeRecord> => {
    const response = await api.post('/finance-clerk/fees/payment', data);
    return response.data.data;
  },

  getPendingPayments: async (): Promise<FeeRecord[]> => {
    const response = await api.get('/finance-clerk/fees/pending');
    return response.data.data;
  },
};

export default financeService;

// Audit Log Interfaces
export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  actionType: 'Money In' | 'Money Out';
  category: 'Fees' | 'Staff' | 'Inventory' | 'Other';
  performedBy: {
    id: string;
    name: string;
    role: string;
  };
  amount?: number;
  description: string;
  section?: string;
  metadata?: Record<string, any>;
}

export interface AuditLogFilters {
  direction?: 'Money In' | 'Money Out';
  category?: string;
  section?: string;
  actionType?: string;
  role?: string;
  minAmount?: number;
  maxAmount?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogResponse {
  logs: AuditLog[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// Audit Log Methods
export const getAllAuditLogs = async (filters?: AuditLogFilters): Promise<AuditLogResponse> => {
  const params = new URLSearchParams();
  if (filters?.direction) params.append('direction', filters.direction);
  if (filters?.category) params.append('category', filters.category);
  if (filters?.section) params.append('section', filters.section);
  if (filters?.actionType) params.append('actionType', filters.actionType);
  if (filters?.role) params.append('role', filters.role);
  if (filters?.minAmount) params.append('minAmount', filters.minAmount.toString());
  if (filters?.maxAmount) params.append('maxAmount', filters.maxAmount.toString());
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const response = await fetch(`${API_BASE_URL}/finance-clerk/audit-logs?${params}`, {
    headers: getAuthHeaders(),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error?.message || 'Failed to fetch audit logs');
  return result.data;
};

export const getAuditLogById = async (id: string): Promise<AuditLog> => {
  const response = await fetch(`${API_BASE_URL}/finance-clerk/audit-logs/${id}`, {
    headers: getAuthHeaders(),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error?.message || 'Failed to fetch audit log');
  return result.data;
};

export const exportAuditLogs = async (filters?: AuditLogFilters): Promise<Blob> => {
  const response = await fetch(`${API_BASE_URL}/finance-clerk/audit-logs/export`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(filters || {}),
  });
  if (!response.ok) throw new Error('Failed to export audit logs');
  return response.blob();
};
