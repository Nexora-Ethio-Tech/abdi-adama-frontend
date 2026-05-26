import React, { useState, useEffect } from 'react';
import { Search, Landmark, FileText, X, Plus, AlertCircle, RefreshCw, CheckCircle, Ban, History, HelpCircle } from 'lucide-react';
import loanService, { Loan } from '../services/loanService';
import payrollService, { EmployeePayrollProfile } from '../services/payrollService';
import { useUser } from '../context/UserContext';

export const LoanManagement = () => {
  const { role } = useUser();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [employees, setEmployees] = useState<EmployeePayrollProfile[]>([]);
  const [globalDeductionPct, setGlobalDeductionPct] = useState(30);
  const [globalMaxMonths, setGlobalMaxMonths] = useState(3);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Filtering / Search
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'active' | 'history'>('pending');

  // Issue Loan Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loanRoleFilter, setLoanRoleFilter] = useState('');
  const [loanSearchFilter, setLoanSearchFilter] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // 1. Load loans
      const allLoans = await loanService.getLoans();
      setLoans(allLoans);

      // 2. Load employees (only those with configure salary profiles can receive loans)
      const profiles = await payrollService.getAllProfiles();
      setEmployees(profiles.filter(p => p.profile_id !== null && p.basic_salary > 0));

      // 3. Load global settings to display as guidance
      try {
        const settings = await payrollService.getFinanceSettings();
        const pct = settings.find(s => s.key === 'loan_deduction_percentage');
        if (pct) setGlobalDeductionPct(Number(pct.value));
        const duration = settings.find(s => s.key === 'max_loan_months');
        if (duration) setGlobalMaxMonths(Number(duration.value));
      } catch (settingsErr) {
        console.warn('Could not load global finance settings, using defaults.', settingsErr);
      }

    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to load loan information.');
    } finally {
      setLoading(false);
    }
  };

  const handleIssueLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId || !loanAmount) return;

    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await loanService.issueLoan(selectedEmployeeId, Number(loanAmount), notes);
      setSuccessMsg('Loan request submitted successfully and is now pending auditor approval.');
      setIsModalOpen(false);
      
      // Reset form
      setSelectedEmployeeId('');
      setLoanAmount('');
      setNotes('');
      setLoanRoleFilter('');
      setLoanSearchFilter('');

      // Reload
      await loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to issue loan.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelLoan = async (loanId: string) => {
    if (!window.confirm('Are you absolutely sure you want to void/cancel this active loan? This action is permanent.')) return;
    
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await loanService.cancelLoan(loanId);
      setSuccessMsg('Loan has been successfully voided/cancelled.');
      await loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to cancel loan.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveLoan = async (loanId: string) => {
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await loanService.approveLoan(loanId);
      setSuccessMsg('Loan request approved. Finance can now mark it as paid.');
      await loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to approve loan.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectLoan = async (loanId: string) => {
    const reason = window.prompt('Enter rejection reason for the employee (optional):');
    if (reason === null) return;

    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await loanService.rejectLoan(loanId, reason || undefined);
      setSuccessMsg('Loan request rejected. The employee will be notified.');
      await loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to reject loan.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePayLoan = async (loanId: string) => {
    if (!window.confirm('Confirm that finance has paid out this approved loan?')) return;

    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await loanService.payLoan(loanId);
      setSuccessMsg('Loan has been marked as paid and is now active.');
      await loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to mark loan as paid.');
    } finally {
      setActionLoading(false);
    }
  };

  // Live Deduction calculation
  const getSelectedEmployeeSalary = () => {
    const emp = employees.find(e => e.user_id === selectedEmployeeId);
    return emp ? emp.basic_salary : 0;
  };
  const computedMonthlyDeduction = (getSelectedEmployeeSalary() * globalDeductionPct) / 100;

  // Filter lists
  const filteredLoans = loans.filter(l => {
    const matchesSearch = l.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          l.employee_digital_id.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === 'pending') {
      return matchesSearch && l.status === 'pending';
    }
    if (activeTab === 'approved') {
      return matchesSearch && l.status === 'approved';
    }
    if (activeTab === 'active') {
      return matchesSearch && l.status === 'active';
    }
    return matchesSearch && ['completed', 'cancelled', 'rejected'].includes(l.status);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Employee Loan Management</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Issue and review internal company loans for company employees. Deductions are processed automatically via payroll cycles.</p>
        </div>
        {(role === 'finance-clerk' || role === 'super-admin') && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-slate-900 dark:bg-blue-600 text-white font-black text-xs uppercase tracking-widest px-6 py-3.5 rounded-2xl hover:bg-slate-800 dark:hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-slate-200 dark:shadow-none"
          >
            <Plus size={16} />
            Issue New Loan
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider">
          {errorMsg}
        </div>
      )}

      {/* Tabs and Search Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/30 dark:shadow-none flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'pending'
                ? 'bg-white dark:bg-slate-900 text-slate-850 dark:text-white shadow-md'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            Pending Approval
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'approved'
                ? 'bg-white dark:bg-slate-900 text-slate-850 dark:text-white shadow-md'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            Approved / Awaiting Payment
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'active'
                ? 'bg-white dark:bg-slate-900 text-slate-850 dark:text-white shadow-md'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            Active Loans
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'history'
                ? 'bg-white dark:bg-slate-900 text-slate-850 dark:text-white shadow-md'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            History / Rejected
          </button>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-3 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search employee name or ID..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Outstanding Loans Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-800 dark:border-slate-700 dark:border-t-white rounded-full animate-spin" />
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Loading ledger data...</p>
          </div>
        ) : filteredLoans.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <History size={48} />
            <p className="font-bold uppercase text-[11px] tracking-widest">No active loans found matching query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Employee Details</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Issued</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Remaining Balance</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Monthly Deduction</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Duration</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Issued Date</th>
                  {(activeTab === 'active' || activeTab === 'approved' || activeTab === 'pending') && (
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/30">
                {filteredLoans.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center font-black text-xs text-slate-700 dark:text-slate-300">
                          {l.employee_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white">{l.employee_name}</p>
                          <span className="text-[9px] font-bold text-slate-400">{l.employee_digital_id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-800 dark:text-white">
                      {l.amount.toLocaleString()} ETB
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-black text-blue-600 dark:text-blue-400">{l.remaining_balance.toLocaleString()} ETB</span>
                    </td>
                    <td className="px-6 py-4 text-rose-500 font-bold">
                      -{l.monthly_deduction.toLocaleString()} ETB
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <span className="font-bold">{l.months_paid}</span>
                        <span className="text-slate-400">/ {l.max_months} Months</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-xl ${
                        l.status === 'active'
                          ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600'
                          : l.status === 'approved'
                          ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600'
                          : l.status === 'pending'
                          ? 'bg-slate-50 dark:bg-slate-950/20 text-slate-600 dark:text-slate-200'
                          : l.status === 'completed'
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600'
                          : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600'
                      }`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-400">
                      {new Date(l.issued_at).toLocaleDateString()}
                    </td>
                    {(activeTab === 'active' || activeTab === 'approved' || activeTab === 'pending') && (
                      <td className="px-6 py-4 text-right space-y-2">
                        {activeTab === 'pending' && role === 'auditor' && (
                          <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
                            <button
                              onClick={() => handleApproveLoan(l.id)}
                              className="bg-emerald-50 hover:bg-emerald-600 hover:text-white dark:bg-emerald-950/20 text-emerald-600 p-2 rounded-xl transition-all shadow-md flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider"
                            >
                              <CheckCircle size={12} />
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectLoan(l.id)}
                              className="bg-rose-50 hover:bg-rose-600 hover:text-white dark:bg-rose-950/20 text-rose-600 p-2 rounded-xl transition-all shadow-md flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider"
                            >
                              <Ban size={12} />
                              Reject
                            </button>
                          </div>
                        )}

                        {activeTab === 'approved' && (role === 'finance-clerk' || role === 'super-admin') && (
                          <button
                            onClick={() => handlePayLoan(l.id)}
                            className="bg-blue-50 hover:bg-blue-600 hover:text-white dark:bg-blue-950/20 text-blue-600 p-2 rounded-xl transition-all shadow-md flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider ml-auto"
                          >
                            <CheckCircle size={12} />
                            Mark Paid
                          </button>
                        )}

                        {activeTab === 'active' && (role === 'finance-clerk' || role === 'super-admin') && (
                          <button
                            onClick={() => handleCancelLoan(l.id)}
                            className="bg-rose-50 hover:bg-rose-600 hover:text-white dark:bg-rose-950/20 text-rose-600 p-2 rounded-xl transition-all shadow-md flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider ml-auto"
                          >
                            <Ban size={12} />
                            Void Loan
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sliding Dialog / Modal Panel for Issuing Loan */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 h-full p-8 overflow-y-auto shadow-2xl flex flex-col justify-between transition-all duration-300 animate-slide-in">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl">
                    <Landmark size={22} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 dark:text-white text-base uppercase tracking-tight">Issue Internal Loan</h3>
                    <p className="text-xs text-slate-400 font-semibold">Distribute school loan funds to verified employees</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Guidelines Alert */}
              <div className="bg-slate-50 dark:bg-slate-800/30 p-4 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-1.5 flex items-start gap-3">
                <HelpCircle size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-slate-700 dark:text-slate-300">Loan Repayment Rules:</p>
                  <p className="text-slate-400 font-medium leading-relaxed">Repayments are calculated as <strong className="text-blue-500">{globalDeductionPct}% of the basic salary</strong> per month, up to a duration limit of <strong className="text-blue-500">{globalMaxMonths} months</strong>.</p>
                </div>
              </div>

              <form onSubmit={handleIssueLoan} className="space-y-5">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Select Employee *</label>
                  
                  <div className="flex gap-2">
                    <select 
                      className="w-1/3 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                      value={loanRoleFilter}
                      onChange={(e) => {
                        setLoanRoleFilter(e.target.value);
                        setSelectedEmployeeId('');
                      }}
                    >
                      <option value="">All Roles</option>
                      {Array.from(new Set(employees.map(e => e.role))).map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                      <input 
                        type="text" 
                        placeholder="Search by name..." 
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                        value={loanSearchFilter}
                        onChange={(e) => {
                          setLoanSearchFilter(e.target.value);
                          setSelectedEmployeeId('');
                        }}
                      />
                    </div>
                  </div>

                  <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                    {employees
                      .filter(e => !loanRoleFilter || e.role === loanRoleFilter)
                      .filter(e => !loanSearchFilter || e.name.toLowerCase().includes(loanSearchFilter.toLowerCase()))
                      .map(e => (
                        <div 
                          key={e.user_id} 
                          onClick={() => setSelectedEmployeeId(e.user_id)}
                          className={`p-3 text-xs cursor-pointer transition-colors flex justify-between items-center ${
                            selectedEmployeeId === e.user_id 
                              ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' 
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200">{e.name}</p>
                            <p className="text-[9px] text-slate-500 uppercase">{e.role}</p>
                          </div>
                          <span className="font-black text-slate-700 dark:text-slate-300">Basic: {e.basic_salary.toLocaleString()} ETB</span>
                        </div>
                    ))}
                    {employees.filter(e => (!loanRoleFilter || e.role === loanRoleFilter) && (!loanSearchFilter || e.name.toLowerCase().includes(loanSearchFilter.toLowerCase()))).length === 0 && (
                      <div className="p-4 text-center text-xs text-slate-500">No employees found.</div>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Loan Amount (ETB) *</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-200 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="Enter total principal amount"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    required
                    min="1"
                  />
                </div>

                {selectedEmployeeId && (
                  <div className="bg-emerald-50/50 dark:bg-emerald-950/10 p-5 border border-emerald-100 dark:border-emerald-900 rounded-3xl space-y-3">
                    <h5 className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Calculated Repayment Terms</h5>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-semibold">Employee Basic Salary:</span>
                      <strong className="text-slate-800 dark:text-white">{getSelectedEmployeeSalary().toLocaleString()} ETB</strong>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-emerald-100/50 dark:border-emerald-900/50 pt-2">
                      <span className="text-slate-500 font-semibold">Calculated Monthly Deduction:</span>
                      <strong className="text-rose-500">-{computedMonthlyDeduction.toLocaleString()} ETB ({globalDeductionPct}%)</strong>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Loan Reason / Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Add brief details regarding the loan approval..."
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-200 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black uppercase tracking-wider text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200 dark:shadow-none disabled:opacity-50"
                  >
                    {actionLoading ? 'Issuing...' : (
                      <>
                        <CheckCircle size={14} />
                        Disburse Funds
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default LoanManagement;
