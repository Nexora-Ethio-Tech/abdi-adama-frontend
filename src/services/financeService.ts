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
