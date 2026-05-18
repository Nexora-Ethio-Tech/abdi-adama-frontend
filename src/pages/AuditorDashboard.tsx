
import { useState, useEffect } from 'react';
import { 
  Wallet, Users, AlertCircle, CheckCircle, XCircle, Search, 
  Clock, ShieldCheck, ArrowUpRight, Eye, FileText,
  TrendingUp
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { Breadcrumbs } from '../components/Breadcrumbs';
import auditorService, {
  type AuditorDashboard as AuditorDashboardData,
  type Transaction,
  type FeeReduction,
  type FinancialReport
} from '../services/auditorService';

export const AuditorDashboard = () => {
  const _user = useUser();
  const [activeTab, setActiveTab] = useState<'transactions' | 'fee-reductions'>('transactions');
  const [dashboard, setDashboard] = useState<AuditorDashboardData | null>(null);
  const [payments, setPayments] = useState<Transaction[]>([]);
  const [feeReductions, setFeeReductions] = useState<FeeReduction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [feeReductionFilter, setFeeReductionFilter] = useState<'pending' | 'approved' | 'rejected' | ''>('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [financialReport, setFinancialReport] = useState<FinancialReport | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dashboardData, paymentsData, feeReductionsData] = await Promise.all([
        auditorService.getDashboard(),
        auditorService.getPayments(),
        auditorService.getFeeReductions({ status: feeReductionFilter || undefined })
      ]);
      setDashboard(dashboardData);
      setPayments(paymentsData);
      setFeeReductions(feeReductionsData);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
      await auditorService.updateFeeReductionStatus(id, { status });
      setSuccess(`Fee reduction ${status.toLowerCase()} successfully!`);
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to update fee reduction');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleGenerateReport = async () => {
    if (!reportStartDate || !reportEndDate) {
      setError('Please select both start and end dates');
      setTimeout(() => setError(null), 3000);
      return;
    }
    try {
      const report = await auditorService.getFinancialReport(reportStartDate, reportEndDate);
      setFinancialReport(report);
      setSuccess('Financial report generated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to generate report');
      setTimeout(() => setError(null), 5000);
    }
  };

  const filteredPayments = payments.filter(payment =>
    payment.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.student_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFeeReductions = feeReductions.filter(reduction =>
    reduction.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    reduction.digital_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && !dashboard) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <Breadcrumbs />
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Auditor <span className="text-blue-600">Control Center</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-500" />
            System-wide financial oversight and fee reduction management
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowReportModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95 flex items-center gap-2"
          >
            <FileText size={18} />
            Generate Report
          </button>
        </div>
      </div>

      {error && (
        <div className="fixed top-6 right-6 z-50 bg-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl text-sm font-bold animate-in slide-in-from-right-8 max-w-md">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl text-sm font-bold animate-in slide-in-from-right-8 max-w-md">
          ✅ {success}
        </div>
      )}
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-600 to-blue-500 text-white p-6 rounded-[2.5rem] shadow-xl hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-2">Total Payments</p>
              <p className="text-3xl font-black">{dashboard?.totalPayments.count || 0}</p>
              <p className="text-blue-100 text-xs font-bold mt-1">{dashboard?.totalPayments.total.toLocaleString() || 0} ETB</p>
            </div>
            <div className="p-3 bg-white/20 rounded-2xl">
              <Wallet className="w-8 h-8" />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Monthly Payments</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{dashboard?.monthlyPayments.count || 0}</p>
              <p className="text-slate-500 text-xs font-bold mt-1">{dashboard?.monthlyPayments.total.toLocaleString() || 0} ETB</p>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl">
              <TrendingUp className="w-8 h-8" />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Pending Approvals</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{dashboard?.pendingFeeReductions || 0}</p>
              <p className="text-slate-500 text-xs font-bold mt-1">Fee Reductions</p>
            </div>
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-2xl">
              <Clock className="w-8 h-8" />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Recent Transactions</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{dashboard?.recentTransactions.length || 0}</p>
              <p className="text-slate-500 text-xs font-bold mt-1">Last 5</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-2xl">
              <ShieldCheck className="w-8 h-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex p-1.5 bg-slate-200/50 dark:bg-slate-800/50 rounded-[1.5rem] w-full md:w-fit">
            <button
              onClick={() => setActiveTab('transactions')}
              className={`flex-1 md:flex-none px-8 py-3 rounded-[1.2rem] text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'transactions' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xl' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Transactions ({payments.length})
            </button>
            <button
              onClick={() => setActiveTab('fee-reductions')}
              className={`flex-1 md:flex-none px-8 py-3 rounded-[1.2rem] text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'fee-reductions' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xl' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Fee Reductions ({feeReductions.length})
            </button>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {activeTab === 'fee-reductions' && (
              <select
                value={feeReductionFilter}
                onChange={(e) => {
                  setFeeReductionFilter(e.target.value as any);
                  fetchData();
                }}
                className="px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            )}
            <div className="relative flex-1 md:flex-none md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search by student or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="p-0 overflow-x-auto">
          {activeTab === 'transactions' ? (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Student</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Amount</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Type</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Verified By</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold">
                          {payment.student_name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{payment.student_name}</p>
                          <p className="text-[10px] text-slate-400 font-bold">ID: {payment.student_id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-black text-sm">
                        <ArrowUpRight size={14} />
                        {payment.amount.toLocaleString()} ETB
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-800/50">
                        {payment.type}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{payment.verified_by}</p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{new Date(payment.date).toLocaleDateString()}</p>
                      <p className="text-[10px] text-slate-400">{new Date(payment.created_at).toLocaleTimeString()}</p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all">
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="grid grid-cols-1 gap-0 divide-y divide-slate-100 dark:divide-slate-800">
              {filteredFeeReductions.map((reduction) => {
                const _totalDue = reduction.monthly_fee + reduction.bus_fee + reduction.penalty_fee;
                return (
                  <div key={reduction.id} className="p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center text-purple-700 dark:text-purple-400 group-hover:scale-110 transition-transform">
                        <Users size={32} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="text-lg font-black text-slate-800 dark:text-white">{reduction.name}</h4>
                          <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500">
                            Grade {reduction.grade}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">{reduction.digital_id} • {reduction.email}</p>
                        {reduction.fee_notes && (
                          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 italic">"{reduction.fee_notes}"</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-8">
                      <div className="text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fee Breakdown</p>
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Monthly: {reduction.monthly_fee.toLocaleString()} ETB</p>
                          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Bus: {reduction.bus_fee.toLocaleString()} ETB</p>
                          {reduction.penalty_fee > 0 && (
                            <p className="text-sm font-bold text-red-600">Penalty: {reduction.penalty_fee.toLocaleString()} ETB</p>
                          )}
                          <p className="text-lg font-black text-blue-600 dark:text-blue-400 mt-2">Total: {totalDue.toLocaleString()} ETB</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Approval Status</p>
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border ${
                          reduction.fee_approval_status === 'pending' ? 'bg-amber-100/50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50' :
                          reduction.fee_approval_status === 'approved' ? 'bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50' :
                          'bg-rose-100/50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/50'
                        }`}>
                          {reduction.fee_approval_status === 'pending' && <Clock size={12} />}
                          {reduction.fee_approval_status === 'approved' && <CheckCircle size={12} />}
                          {reduction.fee_approval_status === 'rejected' && <XCircle size={12} />}
                          {reduction.fee_approval_status}
                        </span>
                      </div>

                      {reduction.fee_approval_status === 'pending' && (
                        <div className="flex items-center gap-3 ml-4">
                          <button 
                            onClick={() => handleApprove(reduction.id, 'Rejected')}
                            className="p-3 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-2xl border border-rose-100 dark:border-rose-900/30 transition-all"
                          >
                            <XCircle size={24} />
                          </button>
                          <button 
                            onClick={() => handleApprove(reduction.id, 'Approved')}
                            className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
                          >
                            Approve
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {filteredFeeReductions.length === 0 && (
                <div className="p-12 text-center">
                  <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-slate-400 font-medium">No fee reductions found.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Auditor Tip */}
      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 p-6 rounded-[2rem] flex items-start gap-4">
        <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-2xl">
          <AlertCircle size={24} />
        </div>
        <div>
          <h4 className="text-sm font-black text-amber-800 dark:text-amber-400 uppercase tracking-widest">Auditor Tip</h4>
          <p className="text-xs text-amber-700 dark:text-amber-500 mt-1 font-medium">
            All fee reductions must be accompanied by a valid reason in the notes section. Approved reductions will be immediately reflected in the student's next billing cycle.
            This is a READ-ONLY role except for fee reduction approvals.
          </p>
        </div>
      </div>

      {/* Financial Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-4xl border border-slate-100 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Financial Report</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Generate detailed financial report for date range</p>
              </div>
              <button onClick={() => setShowReportModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all">
                <XCircle className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Start Date *</label>
                  <input
                    type="date"
                    value={reportStartDate}
                    onChange={(e) => setReportStartDate(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">End Date *</label>
                  <input
                    type="date"
                    value={reportEndDate}
                    onChange={(e) => setReportEndDate(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <button
                onClick={handleGenerateReport}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-bold transition-all shadow-lg shadow-blue-500/20 mb-6"
              >
                Generate Report
              </button>

              {financialReport && (
                <div className="space-y-6">
                  <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl">
                    <h3 className="font-black text-slate-900 dark:text-white mb-4">Summary</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-500 font-bold uppercase">Total Transactions</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{financialReport.summary.totalTransactions}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-bold uppercase">Total Collected</p>
                        <p className="text-2xl font-black text-emerald-600">{financialReport.summary.totalCollected.toLocaleString()} ETB</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl">
                    <h3 className="font-black text-slate-900 dark:text-white mb-4">By Type</h3>
                    <div className="space-y-3">
                      {financialReport.byType.map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{item.type}</p>
                            <p className="text-xs text-slate-500">{item.count} transactions</p>
                          </div>
                          <p className="font-black text-blue-600">{Number(item.total).toLocaleString()} ETB</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl">
                    <h3 className="font-black text-slate-900 dark:text-white mb-4">Daily Breakdown</h3>
                    <div className="space-y-2">
                      {financialReport.dailyBreakdown.map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{new Date(item.date).toLocaleDateString()}</p>
                            <p className="text-xs text-slate-500">{item.transactions} transactions</p>
                          </div>
                          <p className="font-black text-emerald-600">{Number(item.total).toLocaleString()} ETB</p>
                        </div>
                      ))}
                    </div>
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
