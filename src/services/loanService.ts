import api from './api';

export interface Loan {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_digital_id: string;
  amount: number;
  remaining_balance: number;
  monthly_deduction: number;
  max_months: number;
  months_paid: number;
  status: 'active' | 'completed' | 'cancelled';
  issued_by: string;
  issued_by_name?: string;
  issued_at: string;
  completed_at: string | null;
  notes: string | null;
}

const loanService = {
  /**
   * Issues a new loan to an employee.
   */
  issueLoan: async (employeeId: string, amount: number, notes?: string): Promise<Loan> => {
    const response = await api.post('/loans', { employeeId, amount, notes });
    return response.data.data;
  },

  /**
   * Lists all loans with optional status and employee filters.
   */
  getLoans: async (params?: { status?: string; employeeId?: string }): Promise<Loan[]> => {
    const response = await api.get('/loans', { params });
    return response.data.data;
  },

  /**
   * Retrieves the active loan for the logged in staff.
   */
  getMyActiveLoan: async (): Promise<Loan | null> => {
    const response = await api.get('/loans/my-loan');
    return response.data.data;
  },

  /**
   * Retrieves all loan records for the logged in staff.
   */
  getMyLoans: async (): Promise<Loan[]> => {
    const response = await api.get('/loans/my-loans');
    return response.data.data;
  },

  /**
   * Retrieves detailed information of a loan by ID.
   */
  getLoanById: async (id: string): Promise<Loan> => {
    const response = await api.get(`/loans/${id}`);
    return response.data.data;
  },

  /**
   * Cancels/voids an active loan.
   */
  cancelLoan: async (id: string): Promise<Loan> => {
    const response = await api.patch(`/loans/${id}/cancel`);
    return response.data.data;
  }
};

export default loanService;
