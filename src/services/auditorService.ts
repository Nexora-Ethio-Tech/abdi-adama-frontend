import api from './api';

// ============ AUDITOR API TYPES ============

export interface Branch {
  id: string;
  name: string;
  code: string;
  phone: string;
  email: string;
  address: string;
}

export interface AuditorDashboard {
  totalPayments: {
    count: number;
    total: number;
  };
  monthlyPayments: {
    count: number;
    total: number;
  };
  registrationFees: {
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
  status?: 'Paid' | 'Pending' | 'Overdue' | string;
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

export interface Collection {
  id: string;
  student_id: string;
  student_name: string;
  digital_id: string;
  grade: string;
  month: string;
  billing_month: string;   // Ethiopian month name e.g. "Sene"
  billing_year: number;    // Ethiopian year e.g. 2018
  billing_month_num: number;
  // Per-fee-type breakdown
  monthly_fee_due: number;
  bus_fee_due: number;
  penalty_fee_due: number;
  registration_fee_due: number;
  // Totals
  total_amount: number;
  amount_paid: number;
  balance: number;
  status: 'Pending' | 'Paid' | 'Overdue';
  due_date: string;        // Gregorian ISO date – converted to EC in UI via formatEthiopianLabel
  updated_at: string;
}

export interface PayrollSummary {
  id: string;
  month: string;
  year: number;
  status: 'draft' | 'finalized';
  total_gross: number;
  total_deductions: number;
  total_net: number;
  total_tax: number;
  total_pension_employee: number;
  total_pension_employer: number;
  created_at: string;
  finalized_at: string | null;
  generated_by_name: string | null;
  finalized_by_name: string | null;
}

export interface LoanSummary {
  id: string;
  amount: number;
  remaining_balance: number;
  monthly_deduction: number;
  months_paid: number;
  status: 'pending' | 'active' | 'completed' | 'rejected';
  approved_by: string | null;
  created_at: string;
  completed_at: string | null;
  employee_name: string;
  employee_digital_id: string;
  employee_role: string;
  approved_by_name: string | null;
}

export interface OtherTransaction {
  id: string;
  amount: number;
  type: string;           // raw DB type e.g. 'Income', 'Expense'
  category: string;       // derived from type for display
  description: string;    // mapped from student_name (used as description for non-student tx)
  date: string;
  recorded_by: string | null;
  recorded_by_name: string | null;  // from verified_by
  verified_by: string | null;
  created_at: string;
}

export interface PaymentsQueryParams {
  branchId?: string;
  studentId?: string;
  startDate?: string;
  endDate?: string;
}

export interface FeeReductionsQueryParams {
  branchId?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

export interface AuditTrailQueryParams {
  branchId?: string;
  startDate?: string;
  endDate?: string;
  category?: string;
  direction?: string;
}

export interface CollectionsQueryParams {
  branchId?: string;
  status?: string;
  feeType?: 'monthly' | 'registration' | 'penalty';
}

export interface OtherTransactionsQueryParams {
  branchId?: string;
  startDate?: string;
  endDate?: string;
  type?: string;
}

// ============ AUDITOR SERVICE ============

const auditorService = {
  // 0. Get Branches list
  getBranches: async (): Promise<Branch[]> => {
    const response = await api.get('/auditor/branches');
    return response.data.data;
  },

  // 1. Get Dashboard
  getDashboard: async (branchId?: string): Promise<AuditorDashboard> => {
    const response = await api.get('/auditor/dashboard', { params: { branchId } });
    return response.data.data;
  },

  // 2. Get All Payments (Read Only)
  getPayments: async (params?: PaymentsQueryParams): Promise<Transaction[]> => {
    const response = await api.get('/auditor/payments', { params });
    return (response.data.data || []).map((p: any) => ({
      ...p,
      amount: parseFloat(p.amount) || 0,
      status: p.status,
    }));
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
    data: ApproveFeeReductionRequest,
    branchId?: string
  ): Promise<FeeReduction> => {
    const response = await api.patch(`/auditor/fee-reductions/${id}/status`, data, { params: { branchId } });
    return response.data.data;
  },

  // 5. Get Financial Report
  getFinancialReport: async (startDate: string, endDate: string, branchId?: string): Promise<FinancialReport> => {
    const response = await api.get('/auditor/financial-report', {
      params: { startDate, endDate, branchId }
    });
    return response.data.data;
  },

  // 6. Get Audit Trail
  getAuditTrail: async (params?: AuditTrailQueryParams): Promise<AuditTrailEntry[]> => {
    const response = await api.get('/auditor/audit-trail', { params });
    return response.data.data;
  },

  // 7. Get Collections
  getCollections: async (params?: CollectionsQueryParams): Promise<Collection[]> => {
    const response = await api.get('/auditor/collections', { params });
    return (response.data.data || []).map((c: any) => ({
      ...c,
      billing_year: parseInt(c.billing_year) || 0,
      billing_month_num: parseInt(c.billing_month_num) || 0,
      monthly_fee_due: parseFloat(c.monthly_fee_due) || 0,
      bus_fee_due: parseFloat(c.bus_fee_due) || 0,
      penalty_fee_due: parseFloat(c.penalty_fee_due) || 0,
      registration_fee_due: parseFloat(c.registration_fee_due) || 0,
      total_amount: parseFloat(c.total_amount) || 0,
      amount_paid: parseFloat(c.amount_paid) || 0,
      balance: parseFloat(c.balance) || 0,
    }));
  },

  // 8. Get Payroll Summary
  getPayrollSummary: async (branchId?: string): Promise<PayrollSummary[]> => {
    const response = await api.get('/auditor/payroll-summary', { params: { branchId } });
    return (response.data.data || []).map((r: any) => ({
      ...r,
      year: parseInt(r.year) || 0,
      total_gross: parseFloat(r.total_gross) || 0,
      total_deductions: parseFloat(r.total_deductions) || 0,
      total_net: parseFloat(r.total_net) || 0,
      total_tax: parseFloat(r.total_tax) || 0,
      total_pension_employee: parseFloat(r.total_pension_employee) || 0,
      total_pension_employer: parseFloat(r.total_pension_employer) || 0,
    }));
  },

  // 9. Get Loans Summary
  getLoansSummary: async (branchId?: string): Promise<LoanSummary[]> => {
    const response = await api.get('/auditor/loans-summary', { params: { branchId } });
    return (response.data.data || []).map((l: any) => ({
      ...l,
      amount: parseFloat(l.amount) || 0,
      remaining_balance: parseFloat(l.remaining_balance) || 0,
      monthly_deduction: parseFloat(l.monthly_deduction) || 0,
      months_paid: parseInt(l.months_paid) || 0,
    }));
  },

  // 10. Get Other Transactions
  getOtherTransactions: async (params?: OtherTransactionsQueryParams): Promise<OtherTransaction[]> => {
    const response = await api.get('/auditor/other-transactions', { params });
    return (response.data.data || []).map((item: any) => ({
      ...item,
      // Map DB fields to frontend display fields
      category: item.type || 'Other',
      description: item.student_name || item.type || '',
      recorded_by: item.verified_by || null,
      recorded_by_name: item.recorded_by_name || item.verified_by || 'Finance Clerk',
      amount: parseFloat(item.amount) || 0,
    }));
  }
};

export default auditorService;
