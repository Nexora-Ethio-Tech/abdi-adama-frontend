const API_BASE_URL = 'https://api.abdi-adama.com/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

// Auditor Dashboard Interface
export interface AuditorDashboard {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  pendingFeeReductions: number;
  totalStudents: number;
  paidStudents: number;
  unpaidStudents: number;
  recentTransactions: Array<{
    id: string;
    type: string;
    amount: number;
    date: string;
    description: string;
  }>;
}

// Payment Interface (READ ONLY)
export interface Payment {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  type: string;
  date: string;
  paymentMethod: string;
  transactionReference?: string;
  status: string;
}

// Fee Reduction Interface
export interface FeeReduction {
  id: string;
  studentId: string;
  studentName: string;
  currentFee: number;
  requestedFee: number;
  reductionPercentage: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  requestDate: string;
  reviewedBy?: string;
  reviewDate?: string;
  remarks?: string;
}

export interface UpdateFeeReductionData {
  status: 'Approved' | 'Rejected';
  remarks?: string;
}

// Financial Report Interface
export interface FinancialReport {
  period: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  revenueByCategory: Array<{
    category: string;
    amount: number;
  }>;
  expensesByCategory: Array<{
    category: string;
    amount: number;
  }>;
}

// Audit Trail Interface
export interface AuditTrailEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  changes: Record<string, any>;
  ipAddress?: string;
}

// Auditor Methods
export const getAuditorDashboard = async (): Promise<AuditorDashboard> => {
  const response = await fetch(`${API_BASE_URL}/auditor/dashboard`, {
    headers: getAuthHeaders(),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error?.message || 'Failed to fetch dashboard');
  return result.data;
};

export const getAllPayments = async (): Promise<Payment[]> => {
  const response = await fetch(`${API_BASE_URL}/auditor/payments`, {
    headers: getAuthHeaders(),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error?.message || 'Failed to fetch payments');
  return result.data;
};

export const getFeeReductions = async (): Promise<FeeReduction[]> => {
  const response = await fetch(`${API_BASE_URL}/auditor/fee-reductions`, {
    headers: getAuthHeaders(),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error?.message || 'Failed to fetch fee reductions');
  return result.data;
};

export const updateFeeReductionStatus = async (id: string, data: UpdateFeeReductionData): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/auditor/fee-reductions/${id}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error?.message || 'Failed to update fee reduction status');
};

export const getFinancialReport = async (): Promise<FinancialReport> => {
  const response = await fetch(`${API_BASE_URL}/auditor/financial-report`, {
    headers: getAuthHeaders(),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error?.message || 'Failed to fetch financial report');
  return result.data;
};

export const getAuditTrail = async (): Promise<AuditTrailEntry[]> => {
  const response = await fetch(`${API_BASE_URL}/auditor/audit-trail`, {
    headers: getAuthHeaders(),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error?.message || 'Failed to fetch audit trail');
  return result.data;
};
