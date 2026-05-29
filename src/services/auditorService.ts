import api from './api';

// ============ AUDITOR API TYPES ============

export interface AuditorDashboard {
  totalPayments: {
    count: number;
    total: number;
  };
  monthlyPayments: {
    count: number;
    total: number;
  };
  pendingFeeReductions: number;
  pendingLoans: number;
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

export interface FeeReduction {
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
  requested_aid_amount?: number | null;
}

export interface ApproveFeeReductionRequest {
  status: 'approved' | 'rejected' | 'pending';
}

export interface FinancialReport {
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalTransactions: number;
    totalCollected: number;
  };
  transactions: Transaction[];
  byType: {
    type: string;
    count: string;
    total: string;
  }[];
  dailyBreakdown: {
    date: string;
    transactions: string;
    total: string;
  }[];
}

export interface AuditTrailEntry {
  id: string;
  student_id: string;
  student_name: string;
  section: string;
  category: string;
  direction: string;
  action_label: string;
  modified_by: string;
  approver_name: string | null;
  old_value: any;
  new_value: any;
  status: boolean;
  timestamp: string;
}

export interface PaymentsQueryParams {
  studentId?: string;
  startDate?: string;
  endDate?: string;
}

export interface FeeReductionsQueryParams {
  status?: 'pending' | 'approved' | 'rejected';
}

export interface AuditTrailQueryParams {
  startDate?: string;
  endDate?: string;
  category?: string;
  direction?: string;
}

// ============ AUDITOR SERVICE ============

const auditorService = {
  // 1. Get Dashboard
  getDashboard: async (): Promise<AuditorDashboard> => {
    const response = await api.get('/auditor/dashboard');
    return response.data.data;
  },

  // 2. Get All Payments (Read Only)
  getPayments: async (params?: PaymentsQueryParams): Promise<Transaction[]> => {
    const response = await api.get('/auditor/payments', { params });
    return response.data.data;
  },

  // 3. Get Fee Reduction Requests
  getFeeReductions: async (params?: FeeReductionsQueryParams): Promise<FeeReduction[]> => {
    const response = await api.get('/auditor/fee-reductions', { params });
    return (response.data.data || []).map((s: any) => ({
      ...s,
      monthly_fee: parseFloat(s.monthly_fee) || 0,
      bus_fee: parseFloat(s.bus_fee) || 0,
      penalty_fee: parseFloat(s.penalty_fee) || 0,
      requested_aid_amount: s.requested_aid_amount != null ? parseFloat(s.requested_aid_amount) : null,
    }));
  },

  // 4. Approve or Reject Fee Reduction (ONLY WRITE ENDPOINT)
  updateFeeReductionStatus: async (
    id: string,
    data: ApproveFeeReductionRequest
  ): Promise<FeeReduction> => {
    const response = await api.patch(`/auditor/fee-reductions/${id}/status`, data);
    return response.data.data;
  },

  // 5. Get Financial Report
  getFinancialReport: async (startDate: string, endDate: string): Promise<FinancialReport> => {
    const response = await api.get('/auditor/financial-report', {
      params: { startDate, endDate }
    });
    return response.data.data;
  },

  // 6. Get Audit Trail
  getAuditTrail: async (params?: AuditTrailQueryParams): Promise<AuditTrailEntry[]> => {
    const response = await api.get('/auditor/audit-trail', { params });
    return response.data.data;
  },
};

export default auditorService;
