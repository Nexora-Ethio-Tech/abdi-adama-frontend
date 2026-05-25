import React, { useState, useEffect } from 'react';
import { Landmark, Calendar, Plus, Ban, CheckCircle, Table, FileText, Download, Trash2, ArrowLeft, Users, Percent, HelpCircle, Award, X } from 'lucide-react';
import payrollService, { PayrollRun, PayrollItem, EmployeePayrollProfile } from '../services/payrollService';
import { useUser } from '../context/UserContext';

export const PayrollManagement = () => {
  const { role, branches } = useUser();
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Selected Run Detail State
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [runDetail, setRunDetail] = useState<{ run: PayrollRun; items: PayrollItem[] } | null>(null);

  // Generate Run Form State
  const [isGenerating, setIsGenerating] = useState(false);
  const ethiopianMonths = ['Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit', 'Megabit', 'Miazia', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'];
  const [month, setMonth] = useState(ethiopianMonths[0]);
  const currentEthiopianYear = new Date().getFullYear() - 8;
  const [year, setYear] = useState(currentEthiopianYear.toString());
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [employeesForOt, setEmployeesForOt] = useState<EmployeePayrollProfile[]>([]);
  const [overtimeHoursMap, setOvertimeHoursMap] = useState<{ [employeeId: string]: number }>({});
  const [generationStep, setGenerationStep] = useState<1 | 2>(1); // Step 1: Period, Step 2: Overtime Entry
  const [otRoleFilter, setOtRoleFilter] = useState('');
  const [otSearchFilter, setOtSearchFilter] = useState('');

  useEffect(() => {
    loadPayrollRuns();
  }, []);

  const loadPayrollRuns = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await payrollService.getPayrollRuns();
      setRuns(data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to load payroll ledger history.');
    } finally {
      setLoading(false);
    }
  };

  const handleRunClick = async (runId: string) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await payrollService.getPayrollRun(runId);
      setRunDetail(data);
      setSelectedRunId(runId);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to load payroll run details.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartGeneration = async () => {
    setErrorMsg('');
    setActionLoading(true);
    try {
      // Fetch all employees for overtime entry
      const activeProfiles = await payrollService.getAllProfiles({
        branchId: selectedBranchId || undefined
      });
      
      const eligible = activeProfiles.filter(p => p.profile_id !== null && p.basic_salary > 0);
      if (eligible.length === 0) {
        throw new Error('No employees with active salary profiles found in selected branch.');
      }
      
      setEmployeesForOt(eligible);
      // Initialize map with 0
      const initialMap: { [id: string]: number } = {};
      eligible.forEach(e => {
        initialMap[e.user_id] = 0;
      });
      setOvertimeHoursMap(initialMap);
      setGenerationStep(2); // Go to Overtime step
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to initialize payroll generation.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinishGeneration = async () => {
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await payrollService.generatePayroll({
        month,
        year: Number(year),
        branchId: selectedBranchId || null,
        overtimeHoursMap
      });

      setSuccessMsg(`Draft payroll run for ${month} ${year} generated successfully!`);
      setIsGenerating(false);
      setGenerationStep(1);
      await loadPayrollRuns();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to generate payroll.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRun = async (runId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you absolutely sure you want to delete this draft payroll run?')) return;

    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await payrollService.deletePayrollRun(runId);
      setSuccessMsg('Draft payroll run deleted successfully.');
      await loadPayrollRuns();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to delete payroll run.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinalizeRun = async (runId: string) => {
    if (!window.confirm('FINALIZATION WARNING:\nAre you sure you want to finalize this payroll run?\nThis will deduct outstanding loan balances, release payslips to the teacher portals, and send system notifications.')) return;

    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await payrollService.finalizePayroll(runId);
      setSuccessMsg('Payroll run has been successfully finalized! All employee payslips are now live.');
      
      // Reload details
      const data = await payrollService.getPayrollRun(runId);
      setRunDetail(data);

      await loadPayrollRuns();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to finalize payroll run.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = (runId: string, format: 'csv' | 'html') => {
    const url = payrollService.exportPayrollUrl(runId, format);
    window.open(url, '_blank');
  };

  // Helper to calculate totals from runs
  const getTotals = () => {
    const finalized = runs.filter(r => r.status === 'finalized');
    return {
      payout: finalized.reduce((sum, r) => sum + Number(r.total_net), 0),
      tax: finalized.reduce((sum, r) => sum + Number(r.total_tax), 0),
      pension: finalized.reduce((sum, r) => sum + Number(r.total_pension_employee) + Number(r.total_pension_employer), 0)
    };
  };

  const totals = getTotals();

  // If viewing detailed run:
  if (selectedRunId && runDetail) {
    const { run, items } = runDetail;
    const isDraft = run.status === 'draft';
    const isAuditorOrAdmin = role === 'super-admin' || role === 'auditor';

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSelectedRunId(null);
                setRunDetail(null);
              }}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 hover:text-slate-850 dark:hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-2xl font-black text-slate-850 dark:text-white uppercase tracking-tight">Payroll Ledger &mdash; {run.month} {run.year}</h2>
              <p className="text-slate-400 font-semibold text-xs">Branch: {run.branch_name || 'Global'} &bull; Status: <strong className="uppercase">{run.status}</strong></p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleExport(run.id, 'csv')}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-xs uppercase tracking-wider px-5 py-3 rounded-xl flex items-center gap-1.5"
            >
              <Download size={14} />
              Export Excel
            </button>
            <button
              onClick={() => handleExport(run.id, 'html')}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-xs uppercase tracking-wider px-5 py-3 rounded-xl flex items-center gap-1.5"
            >
              <FileText size={14} />
              Print PDF
            </button>
            {isDraft && isAuditorOrAdmin && (
              <button
                onClick={() => handleFinalizeRun(run.id)}
                disabled={actionLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest px-6 py-3 rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-250 dark:shadow-none disabled:opacity-50"
              >
                <CheckCircle size={14} />
                Finalize Payout
              </button>
            )}
          </div>
        </div>

        {/* Ledger Table */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[1200px]">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-4 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Employee Details</th>
                  <th className="px-5 py-4 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Basic</th>
                  <th className="px-5 py-4 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Allowances</th>
                  <th className="px-5 py-4 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">OT Hours/Pay</th>
                  <th className="px-5 py-4 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Gross Salary</th>
                  <th className="px-5 py-4 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-red-500">Penalties</th>
                  <th className="px-5 py-4 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-red-500">Loan Ded.</th>
                  <th className="px-5 py-4 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-red-500">Income Tax</th>
                  <th className="px-5 py-4 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-red-500">Pension 7%</th>
                  <th className="px-5 py-4 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-slate-450">Employer 11%</th>
                  <th className="px-5 py-4 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-emerald-500 bg-emerald-50/20">Net Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/30">
                {items.map((i) => {
                  const allowanceTotal = Number(i.transport_allowance) + Number(i.housing_allowance) + Number(i.position_allowance);
                  return (
                    <tr key={i.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10">
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-800 dark:text-white">{i.employee_name}</p>
                        <span className="text-[8px] font-bold text-slate-400">{i.employee_digital_id} &bull; {i.employee_role}</span>
                      </td>
                      <td className="px-5 py-3.5 font-bold">{Number(i.basic_salary).toLocaleString()} ETB</td>
                      <td className="px-5 py-3.5">
                        <span className="font-bold">+{allowanceTotal.toLocaleString()} ETB</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-slate-700 dark:text-slate-350">
                          {i.overtime_hours} hrs / <span className="font-bold text-slate-850 dark:text-white">+{Number(i.overtime_amount).toLocaleString()} ETB</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-black text-slate-800 dark:text-white">{Number(i.gross_salary).toLocaleString()} ETB</td>
                      <td className="px-5 py-3.5 text-rose-500 font-bold">
                        {Number(i.penalty_amount) > 0 ? `-${Number(i.penalty_amount).toLocaleString()} ETB (${i.absent_days}d)` : '0 ETB'}
                      </td>
                      <td className="px-5 py-3.5 text-rose-500 font-bold">
                        {Number(i.loan_deduction) > 0 ? `-${Number(i.loan_deduction).toLocaleString()} ETB` : '0 ETB'}
                      </td>
                      <td className="px-5 py-3.5 text-rose-500 font-bold">-{Number(i.income_tax).toLocaleString()} ETB</td>
                      <td className="px-5 py-3.5 text-rose-500 font-bold">-{Number(i.pension_employee).toLocaleString()} ETB</td>
                      <td className="px-5 py-3.5 font-medium text-slate-400">+{Number(i.pension_employer).toLocaleString()} ETB</td>
                      <td className="px-5 py-3.5 font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50/10">{Number(i.net_pay).toLocaleString()} ETB</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">School Payroll Engine</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Generate monthly drafts, enter staff overtime logs, audit calculations, and finalize branch payouts.</p>
        </div>
        {role !== 'auditor' && (
          <button
            onClick={() => setIsGenerating(true)}
            className="bg-slate-900 dark:bg-blue-600 text-white font-black text-xs uppercase tracking-widest px-6 py-3.5 rounded-2xl hover:bg-slate-800 dark:hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-slate-200 dark:shadow-none"
          >
            <Plus size={16} />
            Generate Monthly Payroll
          </button>
        )}
      </div>

      {successMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider">
          {errorMsg}
        </div>
      )}

      {/* Super Admin / Auditor Financial Dashboard summaries */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-none flex items-center gap-4">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-650 dark:text-emerald-450 rounded-2xl">
            <Landmark size={24} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-0.5">Total Paid Salary Ledger</span>
            <strong className="text-xl font-black text-slate-850 dark:text-white">{totals.payout.toLocaleString()} ETB</strong>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-none flex items-center gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-650 dark:text-blue-450 rounded-2xl">
            <Percent size={24} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-0.5">Total Income Tax Collected</span>
            <strong className="text-xl font-black text-slate-850 dark:text-white">{totals.tax.toLocaleString()} ETB</strong>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-none flex items-center gap-4">
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 text-purple-650 dark:text-purple-450 rounded-2xl">
            <Users size={24} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-0.5">Total Pension Contribution</span>
            <strong className="text-xl font-black text-slate-850 dark:text-white">{totals.pension.toLocaleString()} ETB</strong>
          </div>
        </div>
      </div>

      {/* Ledger Table List */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
          <h3 className="text-xs font-black text-slate-850 dark:text-white uppercase tracking-widest">Monthly Payroll Batches</h3>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-800 dark:border-slate-700 dark:border-t-white rounded-full animate-spin" />
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Fetching ledger history...</p>
          </div>
        ) : runs.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <Calendar size={48} />
            <p className="font-bold uppercase text-[11px] tracking-widest">No payroll history has been logged yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Period / Month</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Branch</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Gross Ledger</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Deductions</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Net Salary Payout</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/30">
                {runs.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => handleRunClick(r.id)}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400" />
                        <span className="font-bold text-slate-800 dark:text-white">{r.month} {r.year}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">
                      {r.branch_name || 'Global'}
                    </td>
                    <td className="px-6 py-4 font-bold">
                      {Number(r.total_gross).toLocaleString()} ETB
                    </td>
                    <td className="px-6 py-4 text-rose-500 font-bold">
                      -{Number(r.total_deductions).toLocaleString()} ETB
                    </td>
                    <td className="px-6 py-4 font-black text-emerald-600 dark:text-emerald-400">
                      {Number(r.total_net).toLocaleString()} ETB
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-xl ${
                        r.status === 'draft'
                          ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600'
                          : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        {r.status === 'draft' && role !== 'auditor' && (
                          <button
                            onClick={(e) => handleDeleteRun(r.id, e)}
                            className="p-2 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white dark:bg-rose-950/20 rounded-xl transition-all"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                        <button className="bg-slate-100 dark:bg-slate-800 p-2 rounded-xl text-slate-700 dark:text-slate-300 font-black text-[9px] uppercase tracking-wide px-3">
                          Ledger Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generation Slide Drawer / Form Panel */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 h-full p-8 overflow-y-auto shadow-2xl flex flex-col justify-between transition-all duration-300 animate-slide-in">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl">
                    <Table size={22} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 dark:text-white text-base uppercase tracking-tight">Generate Payroll Run</h3>
                    <p className="text-xs text-slate-400 font-semibold">Step {generationStep} of 2 &mdash; {generationStep === 1 ? 'Configure Period' : 'Log Employee Overtime'}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsGenerating(false);
                    setGenerationStep(1);
                  }}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {generationStep === 1 ? (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-widest block mb-1.5">Branch Scope</label>
                    <select
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-200 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      value={selectedBranchId}
                      onChange={(e) => setSelectedBranchId(e.target.value)}
                    >
                      <option value="" className="text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900">All Branches</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id} className="text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900">{b.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-widest block mb-1.5">Payroll Month *</label>
                      <select
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-200 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        required
                      >
                        {ethiopianMonths.map(m => (
                          <option key={m} value={m} className="text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900">{m}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-widest block mb-1.5">Year *</label>
                      <input
                        type="number"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-200 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-6">
                    <button
                      type="button"
                      onClick={handleStartGeneration}
                      disabled={actionLoading}
                      className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-200 dark:shadow-none"
                    >
                      Continue to Overtime Logs
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 flex flex-col h-full">
                  <div className="bg-slate-50 dark:bg-slate-800/30 p-4 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-start gap-3 mb-2 shrink-0">
                    <HelpCircle size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">
                      Search and enter **overtime hours** worked by each employee in **{month} {year}**. Absent days penalty calculations will be automatically pulled from the attendance registry.
                    </p>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <input 
                      type="text" 
                      placeholder="Search employee..." 
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                      value={otSearchFilter}
                      onChange={(e) => setOtSearchFilter(e.target.value)}
                    />
                    <select 
                      className="w-1/3 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                      value={otRoleFilter}
                      onChange={(e) => setOtRoleFilter(e.target.value)}
                    >
                      <option value="">All Roles</option>
                      {Array.from(new Set(employeesForOt.map(e => e.role))).map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2 shrink-0 no-scrollbar">
                    {employeesForOt
                      .filter(e => !otRoleFilter || e.role === otRoleFilter)
                      .filter(e => !otSearchFilter || e.name.toLowerCase().includes(otSearchFilter.toLowerCase()))
                      .map((e) => (
                      <div key={e.user_id} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                        <div>
                          <p className="font-bold text-slate-850 dark:text-white text-xs">{e.name}</p>
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{e.role}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            className="w-16 px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 outline-none text-center focus:ring-2 focus:ring-blue-500 transition-all"
                            placeholder="Hrs"
                            min="0"
                            value={overtimeHoursMap[e.user_id] || ''}
                            onChange={(evt) => setOvertimeHoursMap({
                              ...overtimeHoursMap,
                              [e.user_id]: Number(evt.target.value)
                            })}
                          />
                        </div>
                      </div>
                    ))}
                    {employeesForOt.filter(e => (!otRoleFilter || e.role === otRoleFilter) && (!otSearchFilter || e.name.toLowerCase().includes(otSearchFilter.toLowerCase()))).length === 0 && (
                      <p className="text-center text-xs text-slate-400 py-4">No employees match your search.</p>
                    )}
                  </div>

                  <div className="flex-1 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-4 overflow-y-auto min-h-[120px] transition-all duration-300">
                    <h4 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3 flex justify-between">
                      <span>Added Overtime Logs</span>
                      <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-lg">
                        {employeesForOt.filter(e => (overtimeHoursMap[e.user_id] || 0) > 0).length}
                      </span>
                    </h4>
                    <div className="space-y-2">
                      {employeesForOt.filter(e => (overtimeHoursMap[e.user_id] || 0) > 0).map(e => (
                        <div key={'added-'+e.user_id} className="flex justify-between items-center bg-white dark:bg-slate-800 px-3 py-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{e.name}</span>
                          <span className="text-xs font-black text-blue-600 dark:text-blue-400">+{overtimeHoursMap[e.user_id]} hrs</span>
                        </div>
                      ))}
                      {employeesForOt.filter(e => (overtimeHoursMap[e.user_id] || 0) > 0).length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50 py-4">
                          <Award size={24} className="mb-2" />
                          <p className="text-[10px] font-bold text-center">No overtime entries added yet.<br/>Type hours above to add.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 flex gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => setGenerationStep(1)}
                      className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black uppercase tracking-wider text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleFinishGeneration}
                      disabled={actionLoading}
                      className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200 dark:shadow-none disabled:opacity-50"
                    >
                      {actionLoading ? 'Processing...' : (
                        <>
                          <Award size={14} />
                          Generate Draft
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default PayrollManagement;
