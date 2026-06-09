import api from './api';

// ============ FINANCE CLERK API TYPES ============

export interface FinanceClerkDashboard {
  todayCollection: number;
  monthlyRevenue: number;
  pendingApprovals: number;
  registrations: number;
  overdueStudents: number;
  transportStudents: number;
  staffCount: number;
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
  requested_aid_amount?: number | null;
  collection_status?: 'in_collections' | 'cleared' | 'overdue' | null;
}

export interface TransportStudentInfo {
  id: string;
  name: string;
  email: string;
  digital_id: string;
  grade: string;
  bus_fee: number;
  is_bus_user: boolean;
  route_id: string | null;
  route_name: string | null;
  driver_id: string | null;
  driver_name: string | null;
  driver_digital_id: string | null;
}

export interface TransportRouteInfo {
  route_id: string;
  route_name: string;
  driver_id: string;
  driver_name: string;
  driver_digital_id: string;
  student_count: number;
}

export interface TransportDriverInfo {
  id: string;
  digital_id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  branch_id: string;
  status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  branch_name?: string;
}

export interface TransportFeePolicy {
  grade_level: string | null;
  monthly_tuition: number;
  registration_fee: number;
  bus_fee: number;
  penalty_rate: number;
  academic_year: string;
  branch_id: string;
}

export interface GlobalRegistrationFee {
  amount: number;
  source: string;
}

export interface OutstandingFee {
  feeType: string;
  label: string;
  due: number;
  paid: number;
  remaining: number;
  isFullyPaid?: boolean;
  source?: string;
}

export interface StudentOutstanding {
  student: {
    id: string;
    name: string;
    parent_phone: string;
  };
  usesTransport?: boolean;
  paidFees?: string[];
  month: string;
  fees: OutstandingFee[];
  totalDue: number;
  totalPaid: number;
  totalRemaining: number;
  approvedAidTotal: number;
  aidUsed: number;
  aidRemaining: number;
  collection: any | null;
}

export interface RecordPaymentItem {
  feeType: string;
  amount: number;
}

export interface RecordPaymentRequest {
  studentId: string;
  items?: RecordPaymentItem[];
  // legacy fields
  amount?: number;
  type?: string | string[];
  date?: string;
  month?: string; // YYYY-MM
  reference?: string;
}

export interface UpdateFeeStatusRequest {
  feeStatus?: 'standard' | 'reduced';
  monthlyFee?: number;
  busFee?: number;
  penaltyFee?: number;
  feeNotes?: string;
  requestedAidAmount?: number;
}

export interface AssignTransportRequest {
  studentId: string;
  driverId: string;
  transportFee: number;
}

export interface StopTransportRequest {
  studentId: string;
  daysUsed: number;
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
      registrations: parseInt(d.registrations) || 0,
      overdueStudents: parseInt(d.overdueStudents) || 0,
      transportStudents: parseInt(d.transportStudents) || 0,
      staffCount: parseInt(d.staffCount) || 0,
      recentTransactions: (d.recentTransactions || []).map((tx: any) => ({
        ...tx,
        amount: parseFloat(tx.amount) || 0,
      })),
    };
  },

  // 2. Get All Students with Fee Info
  getStudentsFees: async (params?: { search?: string; feeStatus?: 'standard' | 'reduced'; grade?: string }): Promise<StudentFeeInfo[]> => {
    const response = await api.get('/finance-clerk/students/fees', { params });
    return (response.data.data || []).map((s: any) => ({
      ...s,
      monthly_fee: parseFloat(s.monthly_fee) || 0,
      bus_fee: parseFloat(s.bus_fee) || 0,
      penalty_fee: parseFloat(s.penalty_fee) || 0,
      requested_aid_amount: s.requested_aid_amount != null ? parseFloat(s.requested_aid_amount) : null,
    }));
  },

  // 2b. Get transport-managed students
  getTransportStudents: async (params?: { search?: string; status?: 'assigned' | 'unassigned' | 'all' }): Promise<TransportStudentInfo[]> => {
    const response = await api.get('/finance-clerk/transport/students', { params });
    return (response.data.data || []).map((s: any) => ({
      ...s,
      bus_fee: parseFloat(s.bus_fee) || 0,
    }));
  },

  // 2c. Get transport routes and drivers
  getTransportRoutes: async (params?: { search?: string }): Promise<TransportRouteInfo[]> => {
    const response = await api.get('/finance-clerk/transport/routes', { params });
    return (response.data.data || []).map((r: any) => ({
      ...r,
      student_count: parseInt(r.student_count) || 0,
    }));
  },

  // 2c1. Get branch drivers for transport assignment
  getTransportDrivers: async (): Promise<TransportDriverInfo[]> => {
    const response = await api.get('/finance-clerk/transport/drivers');
    return response.data.data || [];
  },

  // 2c2. Get branch transport fee policies from the global fee structure
  getTransportPolicies: async (): Promise<TransportFeePolicy[]> => {
    const response = await api.get('/finance-clerk/transport/policies');
    return (response.data.data || []).map((policy: any) => ({
      ...policy,
      monthly_tuition: parseFloat(policy.monthly_tuition) || 0,
      registration_fee: parseFloat(policy.registration_fee) || 0,
      bus_fee: parseFloat(policy.bus_fee) || 0,
      penalty_rate: parseFloat(policy.penalty_rate) || 0,
    }));
  },

  // 2c3. Get global registration fee assigned by super admin
  getGlobalRegistrationFee: async (grade?: string): Promise<GlobalRegistrationFee> => {
    const response = await api.get('/finance-clerk/registration-fee', {
      params: grade ? { grade } : undefined
    });
    return {
      amount: Number(response.data.data?.amount) || 0,
      source: response.data.data?.source || 'unknown'
    };
  },

  // 2d. Assign or change a student transport route
  assignTransport: async (data: AssignTransportRequest) => {
    const response = await api.post('/finance-clerk/transport/assign', data);
    return response.data.data;
  },

  // 2e. Stop transport and create proration settlement
  stopTransport: async (data: StopTransportRequest) => {
    const response = await api.post('/finance-clerk/transport/stop', data);
    return response.data.data;
  },

  // 3. Record Payment
  recordPayment: async (data: RecordPaymentRequest): Promise<Transaction> => {
    // Normalize to itemized payload for backend while supporting legacy callers
    let payload: any = {};
    if (data.items && data.items.length > 0) {
      payload = { ...data, items: data.items };
    } else {
      // Convert legacy amount/type to items; if type is array map to known fee keys
      const types = Array.isArray(data.type) ? data.type : [data.type || 'Monthly Tuition'];
      const items = types.map((t, i) => ({ feeType: t.toString().toLowerCase().includes('monthly') ? 'monthly' : t.toString().toLowerCase().includes('bus') ? 'bus' : t.toString().toLowerCase().includes('penalty') ? 'penalty' : t, amount: Number(data.amount || 0) }));
      payload = { studentId: data.studentId, items, month: data.month || new Date().toISOString().slice(0, 7), date: data.date, reference: data.reference };
    }

    const response = await api.post('/finance-clerk/payments', payload);
    return response.data.data;
  },

  // 4. Get Payment History for a Student
  getPaymentHistory: async (studentId: string): Promise<Transaction[]> => {
    const response = await api.get(`/finance-clerk/payments/${studentId}`);
    return response.data.data;
  },

  // 4b. Get outstanding per-fee-type for a student and month
  getStudentOutstanding: async (studentId: string, month?: string): Promise<StudentOutstanding> => {
    const params: any = {};
    if (month) params.month = month;
    const response = await api.get(`/finance-clerk/students/${studentId}/outstanding`, { params });
    const data = response.data.data;
    return {
      ...data,
      fees: (data.fees || []).map((fee: any) => ({
        feeType: fee.feeType,
        label: fee.label,
        due: Number(fee.due || 0),
        paid: Number(fee.paid || 0),
        remaining: Number(fee.remaining || 0),
        isFullyPaid: fee.isFullyPaid,
      })),
      totalDue: Number(data.totalDue || 0),
      totalPaid: Number(data.totalPaid || 0),
      totalRemaining: Number(data.totalRemaining || 0),
      approvedAidTotal: Number(data.approvedAidTotal || 0),
      aidUsed: Number(data.aidUsed || 0),
      aidRemaining: Number(data.aidRemaining || 0),
    };
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

  // 8. Get pending applications assigned to finance
  getPendingApplications: async (params?: { status?: string }) => {
    const response = await api.get('/finance-clerk/applications', { params });
    return response.data.data || [];
  },

  // 9. Approve a pending application (finalize registration)
  approveApplication: async (applicationId: string, data: { amount?: number; reference?: string; parentDigitalId?: string }) => {
    const response = await api.patch(`/finance-clerk/applications/${applicationId}/approve`, data);
    return response.data.data;
  },
  // 9b. Return an application to School Admin with a reason
  removeApplication: async (applicationId: string, data: { reason: string }) => {
    const response = await api.patch(`/finance-clerk/applications/${applicationId}/remove`, data);
    return response.data.data;
  },

  // 10. Get all audit logs
  getAllAuditLogs: async (params?: Record<string, any>) => {
    const response = await api.get('/finance-clerk/audit-logs', { params });
    return response.data.data || { logs: [], pagination: { currentPage: 1, totalPages: 1, totalRecords: 0 } };
  },

  // 11. Export audit logs
  exportAuditLogs: async (params?: Record<string, any>) => {
    const response = await api.get('/finance-clerk/audit-logs/export', {
      params,
      responseType: 'blob'
    });
    return response.data;
  }

};

export default financeClerkService;
