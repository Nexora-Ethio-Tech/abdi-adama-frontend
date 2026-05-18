import api from './api';

// ============ FINANCE CLERK API TYPES ============

export interface FinanceClerkDashboard {
  todayCollection: number;
  monthlyRevenue: number;
  pendingApprovals: number;
  recentTransactions: Transaction[];
}

export interface Transaction {
  id: string;
  student_id: string;
  student_name: string;
  amount: number;
  type: string;
  date: string;
  verified_by: string;
  branch_id: string;
  created_at: string;
}

export interface StudentFeeInfo {
  id: string;
  name: string;
  email: string;
  digital_id: string;
  grade: string;
  monthly_fee: number;
  bus_fee: number;
  penalty_fee: number;
  fee_status: 'standard' | 'reduced';
  fee_approval_status: 'none' | 'pending' | 'approved' | 'rejected';
  fee_notes: string | null;
}

export interface RecordPaymentRequest {
  studentId: string;  // Will be sent as studentId in body
  amount: number;
  type: string;
  date: string;
}

export interface UpdateFeeStatusRequest {
  feeStatus?: 'standard' | 'reduced';
  monthlyFee?: number;
  busFee?: number;
  penaltyFee?: number;
  feeNotes?: string;
}

export interface OverdueStudent {
  id: string;
  name: string;
  email: string;
  digital_id: string;
  grade: string;
  monthly_fee: number;
  bus_fee: number;
  penalty_fee: number;
  parent_phone: string;
}

export interface DailyReport {
  date: string;
  transactions: Transaction[];
  summary: {
    totalTransactions: number;
    totalAmount: number;
  };
}

// ============ FINANCE CLERK SERVICE ============

const financeClerkService = {
  // 1. Get Dashboard
  getDashboard: async (): Promise<FinanceClerkDashboard> => {
    const response = await api.get('/finance-clerk/dashboard');
    const d = response.data.data;
    return {
      ...d,
      todayCollection: parseFloat(d.todayCollection) || 0,
      monthlyRevenue: parseFloat(d.monthlyRevenue) || 0,
      pendingApprovals: parseInt(d.pendingApprovals) || 0,
      recentTransactions: (d.recentTransactions || []).map((tx: any) => ({
        ...tx,
        amount: parseFloat(tx.amount) || 0,
      })),
    };
  },

  // 2. Get All Students with Fee Info
  getStudentsFees: async (params?: { search?: string; feeStatus?: 'standard' | 'reduced' }): Promise<StudentFeeInfo[]> => {
    const response = await api.get('/finance-clerk/students/fees', { params });
    return (response.data.data || []).map((s: any) => ({
      ...s,
      monthly_fee: parseFloat(s.monthly_fee) || 0,
      bus_fee: parseFloat(s.bus_fee) || 0,
      penalty_fee: parseFloat(s.penalty_fee) || 0,
    }));
  },

  // 3. Record Payment
  recordPayment: async (data: RecordPaymentRequest): Promise<Transaction> => {
    const response = await api.post('/finance-clerk/payments', data);
    return response.data.data;
  },

  // 4. Get Payment History for a Student
  getPaymentHistory: async (studentId: string): Promise<Transaction[]> => {
    const response = await api.get(`/finance-clerk/payments/${studentId}`);
    return response.data.data;
  },

  // 5. Update Student Fee Status
  updateFeeStatus: async (studentId: string, data: UpdateFeeStatusRequest): Promise<StudentFeeInfo> => {
    const response = await api.patch(`/finance-clerk/students/${studentId}/fee-status`, data);
    return response.data.data;
  },

  // 6. Get Overdue Payments
  getOverduePayments: async (): Promise<OverdueStudent[]> => {
    const response = await api.get('/finance-clerk/overdue-payments');
    return (response.data.data || []).map((s: any) => ({
      ...s,
      monthly_fee: parseFloat(s.monthly_fee) || 0,
      bus_fee: parseFloat(s.bus_fee) || 0,
      penalty_fee: parseFloat(s.penalty_fee) || 0,
    }));
  },

  // 7. Get Daily Collection Report
  getDailyReport: async (date?: string): Promise<DailyReport> => {
    const response = await api.get('/finance-clerk/reports/daily', { params: { date } });
    return response.data.data;
  },
};

export default financeClerkService;
