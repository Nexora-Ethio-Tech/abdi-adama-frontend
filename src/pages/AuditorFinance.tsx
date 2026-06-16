import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Wallet, Users, AlertCircle, CheckCircle, XCircle, Search,
  Clock, ShieldCheck, ArrowUpRight, Eye, FileText,
  TrendingUp, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon,
  BarChart3, ArrowDownRight, Filter, Building
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useStore } from '../context/useStore';
import { Breadcrumbs } from '../components/Breadcrumbs';
import auditorService, {
  type AuditorDashboard as AuditorDashboardData,
  type Transaction,
  type FeeReduction,
  type FinancialReport,
  type AuditTrailEntry,
  type Branch
} from '../services/auditorService';
import { exportToExcel } from '../utils/exportUtils';
import {
  ethiopianToGregorianIso,
  formatEthiopianLabel
} from '../utils/ethiopianCalendar';
import { EthiopianDatePicker } from '../components/EthiopianDatePicker';

type AuditorFinanceTab = 'transactions' | 'fee-reductions' | 'other-transactions' | 'finance';

const tabFromSearch = (tab: string | null): AuditorFinanceTab => {
  if (tab === 'fee-reductions' || tab === 'other-transactions' || tab === 'audit' || tab === 'finance') return tab === 'audit' ? 'finance' : tab;
  return 'transactions';
};

export const AuditorFinance = () => {
  const user = useUser();
  const { selectedBranchId, setSelectedBranchId } = useStore();
  // Use the store selection if available, fallback to localStorage if auditor, otherwise fall back to the auditor's own branch
  const effectiveBranchId: string | null = selectedBranchId ?? localStorage.getItem('auditor_selected_branch') ?? (user as any)?.branch_id ?? null;
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Synchronize store with localStorage on load
  useEffect(() => {
    if (!selectedBranchId) {
      const saved = localStorage.getItem('auditor_selected_branch');
      if (saved) {
        setSelectedBranchId(saved);
      }
    }
  }, [selectedBranchId, setSelectedBranchId]);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeTab, setActiveTab] = useState<AuditorFinanceTab>(
    location.pathname === '/special-students'
      ? 'fee-reductions'
      : tabFromSearch(searchParams.get('tab'))
  );
  const [dashboard, setDashboard] = useState<AuditorDashboardData | null>(null);
  const [payments, setPayments] = useState<Transaction[]>([]);
  const [feeReductions, setFeeReductions] = useState<FeeReduction[]>([]);
  const [otherTransactions, setOtherTransactions] = useState<any[]>([]);
  const [txTypeFilter, setTxTypeFilter] = useState('');
  const [pendingTxTypeFilter, setPendingTxTypeFilter] = useState(''); // staged before Apply
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [feeReductionFilter, setFeeReductionFilter] = useState<'pending' | 'approved' | 'rejected' | ''>('');
  // Transaction category filter: 'all' | 'registration' | 'monthly'
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<'all' | 'registration' | 'monthly'>('all');
  const [transactionStartEth, setTransactionStartEth] = useState('');
  const [transactionEndEth, setTransactionEndEth] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [financialReport, setFinancialReport] = useState<FinancialReport | null>(null);
  const [auditTrail, setAuditTrail] = useState<AuditTrailEntry[]>([]);
  const [financeStartEth, setFinanceStartEth] = useState('');
  const [financeEndEth, setFinanceEndEth] = useState('');
  const [auditCategoryFilter, setAuditCategoryFilter] = useState<'Fees' | 'Staff' | 'Other' | ''>('');
  const [auditDirectionFilter, setAuditDirectionFilter] = useState<'In' | 'Out' | ''>('');

  // Load branches list on mount for Auditor role
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const branchList = await auditorService.getBranches();
        setBranches(branchList);

        const saved = localStorage.getItem('auditor_selected_branch');
        const currentSelection = selectedBranchId || saved;
        const exists = branchList.some(b => b.id === currentSelection);

        if (branchList.length > 0 && (!currentSelection || !exists)) {
          const firstBranchId = branchList[0].id;
          setSelectedBranchId(firstBranchId);
          localStorage.setItem('auditor_selected_branch', firstBranchId);
        } else if (exists && selectedBranchId !== currentSelection) {
          setSelectedBranchId(currentSelection);
        }
      } catch (err: any) {
        console.error('Failed to load branches:', err);
      }
    };
    fetchBranches();
  }, [selectedBranchId, setSelectedBranchId]);

  // Pagination states
  const [transactionPage, setTransactionPage] = useState(1);
  const [reductionPage, setReductionPage] = useState(1);
  const [financePage, setFinancePage] = useState(1);
  const [auditPage, setAuditPage] = useState(1);
  const [otherTxPage, setOtherTxPage] = useState(1);
  const itemsPerPage = 10;

  // Reset pagination when active tab or filters change
  useEffect(() => {
    setTransactionPage(1);
    setReductionPage(1);
    setFinancePage(1);
    setAuditPage(1);
    setOtherTxPage(1);
  }, [searchQuery, feeReductionFilter, activeTab, transactionStartEth, transactionEndEth, auditCategoryFilter, auditDirectionFilter, transactionTypeFilter]);

  // Sync URL (?tab=) and legacy paths with activeTab
  useEffect(() => {
    if (location.pathname === '/special-students') {
      setActiveTab('fee-reductions');
      return;
    }
    if (location.pathname === '/auditor-finance') {
      navigate('/finance?tab=audit', { replace: true });
      return;
    }
    setActiveTab(tabFromSearch(searchParams.get('tab')));
  }, [location.pathname, searchParams, navigate]);

  useEffect(() => {
    if (effectiveBranchId) {
      fetchData();
    }
  }, [effectiveBranchId]);

  useEffect(() => {
    if (activeTab === 'finance') {
      fetchAuditTrail();
    }
  }, [activeTab, auditCategoryFilter, auditDirectionFilter, financeStartEth, financeEndEth]);

  const handleTabChange = (tab: AuditorFinanceTab) => {
    setActiveTab(tab);
    const queryTab = tab === 'finance' ? 'audit' : tab;
    navigate(`/finance?tab=${queryTab}`);

    if (tab === 'finance') {
      setFinancePage(1);
      void fetchAuditTrail();
    }
  };

  const buildPaymentQueryParams = () => {
    const params: { startDate?: string; endDate?: string; branchId?: string } = {};

    if (transactionStartEth) {
      const start = ethiopianToGregorianIso(transactionStartEth);
      if (!start) {
        throw new Error('Invalid Ethiopian start date. Use YYYY-MM-DD.');
      }
      params.startDate = start;
    }

    if (transactionEndEth) {
      const end = ethiopianToGregorianIso(transactionEndEth);
      if (!end) {
        throw new Error('Invalid Ethiopian end date. Use YYYY-MM-DD.');
      }
      params.endDate = end;
    }

    if (params.startDate && params.endDate && params.startDate > params.endDate) {
      throw new Error('Start date must be before or equal to end date.');
    }

    return params;
  };

  const buildAuditQueryParams = () => {
    const params: { startDate?: string; endDate?: string; category?: string; direction?: string; branchId?: string } = {};

    if (financeStartEth) {
      const start = ethiopianToGregorianIso(financeStartEth);
      if (!start) {
        throw new Error('Invalid Ethiopian start date. Use YYYY-MM-DD.');
      }
      params.startDate = start;
    }

    if (financeEndEth) {
      const end = ethiopianToGregorianIso(financeEndEth);
      if (!end) {
        throw new Error('Invalid Ethiopian end date. Use YYYY-MM-DD.');
      }
      params.endDate = end;
    }

    if (params.startDate && params.endDate && params.startDate > params.endDate) {
      throw new Error('Start date must be before or equal to end date.');
    }

    if (auditCategoryFilter) {
      params.category = auditCategoryFilter;
    }

    if (auditDirectionFilter) {
      params.direction = auditDirectionFilter;
    }

    return params;
  };

  const fetchAuditTrail = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!effectiveBranchId) {
        setError('No branch assigned. Contact your administrator.');
        setLoading(false);
        return;
      }
      const params = buildAuditQueryParams();
      params.branchId = effectiveBranchId;
      const auditData = await auditorService.getAuditTrail(params);
      setAuditTrail(auditData);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to fetch audit trail');
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!effectiveBranchId) {
        setError('No branch assigned. Contact your administrator.');
        setLoading(false);
        return;
      }
      const params = buildPaymentQueryParams();
      params.branchId = effectiveBranchId;
      console.log('📊 [AuditorDashboard] Fetching with params:', params);
      const [dashboardData, paymentsData, feeReductionsData, otherTxData] = await Promise.all([
        auditorService.getDashboard(effectiveBranchId),
        auditorService.getPayments(params),
        auditorService.getFeeReductions({ branchId: effectiveBranchId, status: feeReductionFilter || undefined }),
        auditorService.getOtherTransactions({ branchId: effectiveBranchId }).catch(() => [])
      ]);
      console.log('✅ [AuditorDashboard] Dashboard:', dashboardData);
      console.log('✅ [AuditorDashboard] Payments fetched:', paymentsData?.length || 0, paymentsData);
      console.log('✅ [AuditorDashboard] Fee Reductions:', feeReductionsData?.length || 0);
      setDashboard(dashboardData);
      setPayments(paymentsData);
      setFeeReductions(feeReductionsData);
      setOtherTransactions(otherTxData || []);
    } catch (err: any) {
      console.error('❌ [AuditorDashboard] Error:', err);
      setError(err.response?.data?.error?.message || err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string, status: 'approved' | 'rejected') => {
    try {
      if (!effectiveBranchId) {
        setError('No branch assigned. Contact your administrator.');
        return;
      }
      await auditorService.updateFeeReductionStatus(id, { status }, effectiveBranchId);
      setSuccess(`Fee reduction ${status.toLowerCase()} successfully!`);
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to update fee reduction');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleApplyTransactionFilter = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!effectiveBranchId) {
        setError('No branch assigned. Contact your administrator.');
        setLoading(false);
        return;
      }
      const params = buildPaymentQueryParams();
      params.branchId = effectiveBranchId;
      const paymentsData = await auditorService.getPayments(params);
      setPayments(paymentsData);
      setSuccess('Transaction filters applied.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to apply filter');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleClearTransactionFilter = async () => {
    setTransactionStartEth('');
    setTransactionEndEth('');
    await fetchData();
  };

  const handleApplyAuditFilter = async () => {
    try {
      setLoading(true);
      setError(null);
      await fetchAuditTrail();
      setSuccess('Student finance filters applied.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to apply student finance filter');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleExportTransactions = () => {
    if (displayedPayments.length === 0) {
      setError('No transactions available to export.');
      setTimeout(() => setError(null), 3000);
      return;
    }

    console.log('📊 [AuditorDashboard] Exporting Transactions:', {
      count: displayedPayments.length,
      dateRange: `${transactionStartEth || 'all'} to ${transactionEndEth || 'all'}`,
      data: displayedPayments.slice(0, 5).map((p) => ({
        date: formatEthiopianLabel(p.date),
        student: p.student_name,
        amount: Number(p.amount),
        type: p.type,
        verifiedBy: p.verified_by
      }))
    });

    exportToExcel([
      {
        name: 'Transactions',
        rows: displayedPayments.map((payment) => ({
          Date: formatEthiopianLabel(payment.date),
          'Student Name': payment.student_name,
          Amount: Number(payment.amount),
          Type: payment.type,
          'Verified By': payment.verified_by,
          'Created At': new Date(payment.created_at).toLocaleString(),
          'Branch ID': payment.branch_id
        }))
      }
    ], `auditor-transactions-${transactionStartEth || 'all'}-${transactionEndEth || 'all'}`);
  };

  const handleClearAuditFilter = async () => {
    setFinanceStartEth('');
    setFinanceEndEth('');
    setAuditCategoryFilter('');
    setAuditDirectionFilter('');
    if (activeTab === 'finance') {
      await fetchAuditTrail();
    }
  };

  const handleGenerateReport = async () => {
    if (!reportStartDate || !reportEndDate) {
      setError('Please enter both Ethiopian start and end dates');
      setTimeout(() => setError(null), 3000);
      return;
    }

    const startDate = ethiopianToGregorianIso(reportStartDate);
    const endDate = ethiopianToGregorianIso(reportEndDate);

    if (!startDate || !endDate) {
      setError('Invalid Ethiopian dates. Use format YYYY-MM-DD');
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      const report = await auditorService.getFinancialReport(startDate, endDate);
      setFinancialReport(report);
      setSuccess('Financial report generated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to generate report');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleExportReport = () => {
    if (!financialReport) return;

    console.log('💰 [AuditorDashboard] Exporting Financial Report:', {
      period: `${financialReport.period.startDate} to ${financialReport.period.endDate}`,
      summary: {
        totalTransactions: financialReport.summary.totalTransactions,
        totalCollected: financialReport.summary.totalCollected
      },
      byType: financialReport.byType.map((item) => ({
        type: item.type,
        count: item.count,
        total: item.total
      })),
      dailyBreakdownCount: financialReport.dailyBreakdown.length,
      transactionSampleCount: financialReport.transactions.length
    });

    exportToExcel([
      {
        name: 'Transactions',
        rows: financialReport.transactions.map((transaction) => ({
          Date: formatEthiopianLabel(transaction.date),
          'Student Name': transaction.student_name,
          'Student ID': transaction.student_id,
          Amount: Number(transaction.amount),
          Type: transaction.type,
          'Verified By': transaction.verified_by,
          'Branch ID': transaction.branch_id,
          'Created At': transaction.created_at
        }))
      },
      {
        name: 'Summary',
        rows: [
          {
            Period: `${financialReport.period.startDate} to ${financialReport.period.endDate}`,
            'Total Transactions': financialReport.summary.totalTransactions,
            'Total Collected (ETB)': financialReport.summary.totalCollected
          }
        ]
      },
      {
        name: 'By Type',
        rows: financialReport.byType.map((item) => ({
          Type: item.type,
          Transactions: Number(item.count),
          'Total Collected (ETB)': Number(item.total)
        }))
      },
      {
        name: 'Daily Breakdown',
        rows: financialReport.dailyBreakdown.map((item) => ({
          Date: formatEthiopianLabel(item.date),
          Transactions: Number(item.transactions),
          'Total Collected (ETB)': Number(item.total)
        }))
      }
    ], `auditor-financial-report-${financialReport.period.startDate}-${financialReport.period.endDate}`);
  };

  const filteredPayments = payments.filter(payment =>
    (payment.student_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (payment.student_id || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedPayments = filteredPayments.filter((payment) => {
    const type = (payment.type || '').toLowerCase();
    if (transactionTypeFilter === 'registration') {
      return type.includes('registration');
    }
    if (transactionTypeFilter === 'monthly') {
      // Monthly Payment = monthly tuition, bus fee, penalty fee — anything that is NOT registration
      return !type.includes('registration');
    }
    return true; // 'all'
  });

  const filteredFeeReductions = feeReductions.filter(reduction =>
    (reduction.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (reduction.digital_id || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAuditTrail = auditTrail.filter(entry =>
    (entry.student_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (entry.action_label || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (entry.section || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (entry.category || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination calculation for Transactions
  const totalTransactionPages = Math.ceil(displayedPayments.length / itemsPerPage);
  const startTransactionIndex = (transactionPage - 1) * itemsPerPage;
  const paginatedPayments = displayedPayments.slice(startTransactionIndex, startTransactionIndex + itemsPerPage);

  // Pagination calculation for Fee Reductions
  const totalReductionPages = Math.ceil(filteredFeeReductions.length / itemsPerPage);
  const startReductionIndex = (reductionPage - 1) * itemsPerPage;
  const paginatedFeeReductions = filteredFeeReductions.slice(startReductionIndex, startReductionIndex + itemsPerPage);

  const totalFinancePages = Math.ceil(filteredAuditTrail.length / itemsPerPage);
  const startFinanceIndex = (financePage - 1) * itemsPerPage;
  const paginatedAuditTrail = filteredAuditTrail.slice(startFinanceIndex, startFinanceIndex + itemsPerPage);

  const filteredOtherTransactions = otherTransactions.filter(tx => {
    const term = searchQuery.toLowerCase();
    const typeMatch = !txTypeFilter || tx.type === txTypeFilter;
    const searchMatch = !term ||
      (tx.type || '').toLowerCase().includes(term) ||
      (tx.description || '').toLowerCase().includes(term) ||
      (tx.recorded_by_name || '').toLowerCase().includes(term);
    return typeMatch && searchMatch;
  });

  const totalOtherTxPages = Math.ceil(filteredOtherTransactions.length / itemsPerPage);
  const startOtherTxIndex = (otherTxPage - 1) * itemsPerPage;
  const paginatedOtherTransactions = filteredOtherTransactions.slice(startOtherTxIndex, startOtherTxIndex + itemsPerPage);

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
            Student Finance <span className="text-blue-600">Control Center</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-500" />
            Student transaction reporting and fee reduction management
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {branches.length > 0 && (
            <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-sm w-full md:w-auto">
              <Building className="w-5 h-5 text-blue-600 shrink-0" />
              <div className="flex flex-col w-full">
                <span className="text-[10px] font-black uppercase text-slate-400">Selected Branch</span>
                <select
                  title="Select branch to audit"
                  value={selectedBranchId || ''}
                  onChange={(e) => {
                    const branchId = e.target.value;
                    setSelectedBranchId(branchId);
                    localStorage.setItem('auditor_selected_branch', branchId);
                  }}
                  className="bg-transparent text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-0 cursor-pointer pr-4 w-full"
                >
                  <option value="" disabled>Select a branch</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowReportModal(true)}
            className="w-full md:w-auto bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-wide hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95 flex items-center gap-2 justify-center"
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
              <p className="text-3xl font-black">{dashboard?.totalPayments?.count ?? 0}</p>
              <p className="text-blue-100 text-xs font-bold mt-1">{(dashboard?.totalPayments?.total ?? 0).toLocaleString()} ETB</p>
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
              <p className="text-3xl font-black text-slate-900 dark:text-white">{dashboard?.monthlyPayments?.count ?? 0}</p>
              <p className="text-slate-500 text-xs font-bold mt-1">{(dashboard?.monthlyPayments?.total ?? 0).toLocaleString()} ETB</p>
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
              <p className="text-3xl font-black text-slate-900 dark:text-white">{dashboard?.pendingApprovals ?? 0}</p>
              <p className="text-slate-500 text-xs font-bold mt-1">
                {dashboard?.pendingLoans ?? 0} Loan{(dashboard?.pendingLoans ?? 0) !== 1 ? 's' : ''} &bull; {dashboard?.pendingFeeReductions ?? 0} Fee Reduction{(dashboard?.pendingFeeReductions ?? 0) !== 1 ? 's' : ''}
              </p>
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
              <p className="text-3xl font-black text-slate-900 dark:text-white">{dashboard?.recentTransactions?.length ?? 0}</p>
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
        {/* Row 1: Tab switcher + search/filter */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full md:w-fit gap-1 md:gap-0">
            <button
              type="button"
              onClick={() => handleTabChange('transactions')}
              className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wide transition-all ${activeTab === 'transactions' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-md border border-slate-200 dark:border-slate-700' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              Transactions ({payments.length})
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('fee-reductions')}
              className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wide transition-all ${activeTab === 'fee-reductions' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-md border border-slate-200 dark:border-slate-700' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              Fee Reductions ({feeReductions.length})
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('other-transactions')}
              className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wide transition-all ${activeTab === 'other-transactions' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-md border border-slate-200 dark:border-slate-700' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              Other Transactions ({otherTransactions.length})
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('finance')}
              className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wide transition-all ${activeTab === 'finance' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-md border border-slate-200 dark:border-slate-700' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              Audit Trail ({auditTrail.length})
            </button>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {activeTab === 'fee-reductions' && (
              <select
                title="Filter fee reductions by approval status"
                value={feeReductionFilter}
                onChange={(e) => {
                  setFeeReductionFilter(e.target.value as any);
                  fetchData();
                }}
                className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-medium text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            )}
            {activeTab === 'other-transactions' && (
              <>
                <select
                  title="Filter other transactions by type"
                  value={pendingTxTypeFilter}
                  onChange={(e) => setPendingTxTypeFilter(e.target.value)}
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-medium text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">All Types</option>
                  {Array.from(new Set(otherTransactions.map(t => t.type))).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <button
                  onClick={() => { setTxTypeFilter(pendingTxTypeFilter); setOtherTxPage(1); }}
                  className="px-4 py-2.5 bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500 text-white text-sm font-bold rounded-xl transition-all uppercase tracking-wide"
                >
                  Apply Filter
                </button>
              </>
            )}
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search by student or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Row 2: Date filter — separate row, only shown for Transactions */}
        {activeTab === 'transactions' && (
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/20">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex flex-col gap-1.5 w-48">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Start Date (Ethiopian)
                </label>
                <EthiopianDatePicker
                  value={transactionStartEth}
                  onChange={setTransactionStartEth}
                />
              </div>
              <div className="flex flex-col gap-1.5 w-48">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  End Date (Ethiopian)
                </label>
                <EthiopianDatePicker
                  value={transactionEndEth}
                  onChange={setTransactionEndEth}
                />
              </div>
              <div className="flex items-center gap-2 pb-0.5 flex-wrap">
                {/* ── Category filter buttons ─────────────────────── */}
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl gap-0.5">
                  {(['all', 'registration', 'monthly'] as const).map((filter) => {
                    const labels: Record<string, string> = {
                      all: 'All Fees',
                      registration: 'Registration',
                      monthly: 'Monthly Payment',
                    };
                    const isActive = transactionTypeFilter === filter;
                    return (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setTransactionTypeFilter(filter)}
                        className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${
                          isActive
                            ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-md border border-slate-200 dark:border-slate-700'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                      >
                        {labels[filter]}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={handleApplyTransactionFilter}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-blue-500/25 uppercase tracking-wide"
                >
                  Apply Date
                </button>
                <button
                  onClick={handleClearTransactionFilter}
                  className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-bold rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all uppercase tracking-wide"
                >
                  Clear
                </button>
                <button
                  onClick={handleExportTransactions}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-emerald-500/25 uppercase tracking-wide"
                >
                  Export
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'finance' && (
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/20">
            <div className="grid gap-4 lg:grid-cols-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Start Date (Ethiopian)
                </label>
                <EthiopianDatePicker
                  value={financeStartEth}
                  onChange={setFinanceStartEth}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  End Date (Ethiopian)
                </label>
                <EthiopianDatePicker
                  value={financeEndEth}
                  onChange={setFinanceEndEth}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="auditCategoryFilter" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Category
                </label>
                <select
                  id="auditCategoryFilter"
                  value={auditCategoryFilter}
                  onChange={(e) => setAuditCategoryFilter(e.target.value as any)}
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  <option value="Fees">Fees</option>
                  <option value="Staff">Staff</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="auditDirectionFilter" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Direction
                </label>
                <select
                  id="auditDirectionFilter"
                  value={auditDirectionFilter}
                  onChange={(e) => setAuditDirectionFilter(e.target.value as any)}
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any Direction</option>
                  <option value="In">In</option>
                  <option value="Out">Out</option>
                </select>
              </div>
              <div className="flex flex-col sm:flex-row items-end gap-2 col-span-full lg:col-span-4">
                <button
                  onClick={handleApplyAuditFilter}
                  type="button"
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-500/10"
                >
                  Apply Filters
                </button>
                <button
                  onClick={handleClearAuditFilter}
                  type="button"
                  className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  Clear Filters
                </button>
                <button
                  onClick={fetchAuditTrail}
                  type="button"
                  className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-md shadow-slate-900/10"
                >
                  Refresh Audit Trail
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="p-0 overflow-x-auto">
          {activeTab === 'transactions' && (
            <div>
              {transactionTypeFilter !== 'all' && (
                <div className="mb-4 p-4 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold flex items-center gap-2">
                  <Filter size={14} className="text-blue-500 shrink-0" />
                  {transactionTypeFilter === 'registration'
                    ? 'Showing Registration Fee transactions only.'
                    : 'Showing Monthly Payment transactions only (Monthly Tuition, Bus Fee, Penalty Fee).'}
                  <button
                    onClick={() => setTransactionTypeFilter('all')}
                    className="ml-auto text-xs text-blue-600 hover:underline font-bold"
                  >
                    Clear filter
                  </button>
                </div>
              )}
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-800/10">
                    <th className="px-6 py-4.5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Student</th>
                    <th className="px-6 py-4.5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Amount</th>
                    <th className="px-6 py-4.5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Type</th>
                    <th className="px-6 py-4.5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Verified By</th>
                    <th className="px-6 py-4.5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4.5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {paginatedPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/20 transition-colors group">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/15 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-sm">
                            {payment.student_name?.[0] ?? '?'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{payment.student_name}</p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">ID: {payment.student_id?.slice(0, 8) || 'Unknown'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
                          <ArrowUpRight size={14} className="stroke-[2.5]" />
                          {payment.amount.toLocaleString()} ETB
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider border border-blue-100/50 dark:border-blue-900/30">
                          {payment.type}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-350">{payment.verified_by}</p>
                      </td>
                      <td className="px-6 py-3.5">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{formatEthiopianLabel(payment.date)}</p>
                        <div className="flex gap-1.5 mt-0.5">
                          <span className="text-[10px] text-slate-400">{payment.date}</span>
                          <span className="text-[10px] text-slate-400/80">&bull;</span>
                          <span className="text-[10px] text-slate-400">{new Date(payment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button title="View payment details" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-all">
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {displayedPayments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-12 text-center">
                        <Wallet className="w-12 h-12 text-slate-300 dark:text-slate-750 mx-auto mb-3" />
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">No payments found.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Payments Pagination Footer */}
              {displayedPayments.length > 0 && (
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/20 dark:bg-slate-950/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <p className="text-xs font-semibold text-slate-400">
                    Showing {startTransactionIndex + 1} to {Math.min(displayedPayments.length, startTransactionIndex + itemsPerPage)} of {displayedPayments.length} transactions
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      title="Previous page"
                      disabled={transactionPage === 1}
                      onClick={() => setTransactionPage(transactionPage - 1)}
                      className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition-all text-slate-600 dark:text-slate-400"
                    >
                      <ChevronLeftIcon size={14} />
                    </button>

                    {Array.from({ length: totalTransactionPages }, (_, i) => i + 1).map((pg) => {
                      if (totalTransactionPages > 5 && Math.abs(transactionPage - pg) > 1 && pg !== 1 && pg !== totalTransactionPages) {
                        if (pg === 2 || pg === totalTransactionPages - 1) {
                          return <span key={pg} className="px-1 text-slate-400 text-xs font-bold">...</span>;
                        }
                        return null;
                      }
                      return (
                        <button
                          key={pg}
                          type="button"
                          onClick={() => setTransactionPage(pg)}
                          className={`w-7 h-7 rounded-lg text-xs font-black transition-all ${transactionPage === pg
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'
                            }`}
                        >
                          {pg}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      title="Next page"
                      disabled={transactionPage === totalTransactionPages || totalTransactionPages === 0}
                      onClick={() => setTransactionPage(transactionPage + 1)}
                      className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition-all text-slate-600 dark:text-slate-400"
                    >
                      <ChevronRightIcon size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'fee-reductions' && (
            <div>
              <div className="grid grid-cols-1 gap-0 divide-y divide-slate-100 dark:divide-slate-850">
                {paginatedFeeReductions.map((reduction) => {
                  const totalDue = reduction.monthly_fee + reduction.bus_fee + reduction.penalty_fee;
                  return (
                    <div key={reduction.id} className="p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 hover:bg-slate-100 dark:hover:bg-slate-900/20 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/15 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
                          <Users size={24} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2.5">
                            <h4 className="text-sm font-bold text-slate-800 dark:text-white">{reduction.name}</h4>
                            <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-[9px] font-black uppercase tracking-widest text-slate-500">
                              Grade {reduction.grade}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{reduction.digital_id} • {reduction.email}</p>
                          {reduction.requested_aid_amount != null && reduction.requested_aid_amount > 0 && (
                            <p className="text-xs font-bold text-purple-600 dark:text-purple-400 mt-1">
                              Requested aid: {Number(reduction.requested_aid_amount).toLocaleString()} ETB
                            </p>
                          )}
                          {reduction.fee_notes && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 italic bg-slate-100/70 dark:bg-slate-900/30 p-1.5 rounded-lg border border-slate-200/50 dark:border-slate-800/40">
                              "{reduction.fee_notes}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-6">
                        <div className="text-left lg:text-right">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Fee Breakdown</p>
                          <div className="space-y-0.5">
                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Monthly: {reduction.monthly_fee.toLocaleString()} ETB</p>
                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Bus: {reduction.bus_fee.toLocaleString()} ETB</p>
                            {reduction.penalty_fee > 0 && (
                              <p className="text-[11px] font-bold text-red-500">Penalty: {reduction.penalty_fee.toLocaleString()} ETB</p>
                            )}
                            <p className="text-sm font-black text-blue-600 dark:text-blue-400 mt-1">Total: {totalDue.toLocaleString()} ETB</p>
                          </div>
                        </div>

                        <div className="flex flex-col items-center">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Approval Status</p>
                          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1 border ${reduction.fee_approval_status === 'pending' ? 'bg-amber-50/50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100/50 dark:border-amber-900/30' :
                            reduction.fee_approval_status === 'approved' ? 'bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100/50 dark:border-emerald-900/30' :
                              'bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-100/50 dark:border-rose-900/30'
                            }`}>
                            {reduction.fee_approval_status === 'pending' && <Clock size={10} />}
                            {reduction.fee_approval_status === 'approved' && <CheckCircle size={10} />}
                            {reduction.fee_approval_status === 'rejected' && <XCircle size={10} />}
                            {reduction.fee_approval_status}
                          </span>
                        </div>

                        {reduction.fee_approval_status === 'pending' && (
                          <div className="flex items-center gap-2.5 ml-2">
                            <button
                              type="button"
                              title="Reject fee reduction request"
                              onClick={() => handleApprove(reduction.id, 'rejected')}
                              className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl border border-rose-100 dark:border-rose-900/30 transition-all"
                            >
                              <XCircle size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApprove(reduction.id, 'approved')}
                              className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md shadow-emerald-500/10"
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
                    <Users className="w-12 h-12 text-slate-300 dark:text-slate-750 mx-auto mb-3" />
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">No fee reductions found.</p>
                  </div>
                )}
              </div>

              {/* Fee Reductions Pagination Footer */}
              {filteredFeeReductions.length > 0 && (
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/20 dark:bg-slate-950/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <p className="text-xs font-semibold text-slate-400">
                    Showing {startReductionIndex + 1} to {Math.min(filteredFeeReductions.length, startReductionIndex + itemsPerPage)} of {filteredFeeReductions.length} reductions
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      title="Previous page"
                      disabled={reductionPage === 1}
                      onClick={() => setReductionPage(reductionPage - 1)}
                      className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition-all text-slate-600 dark:text-slate-400"
                    >
                      <ChevronLeftIcon size={14} />
                    </button>

                    {Array.from({ length: totalReductionPages }, (_, i) => i + 1).map((pg) => {
                      if (totalReductionPages > 5 && Math.abs(reductionPage - pg) > 1 && pg !== 1 && pg !== totalReductionPages) {
                        if (pg === 2 || pg === totalReductionPages - 1) {
                          return <span key={pg} className="px-1 text-slate-400 text-xs font-bold">...</span>;
                        }
                        return null;
                      }
                      return (
                        <button
                          key={pg}
                          type="button"
                          onClick={() => setReductionPage(pg)}
                          className={`w-7 h-7 rounded-lg text-xs font-black transition-all ${reductionPage === pg
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'
                            }`}
                        >
                          {pg}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      title="Next page"
                      disabled={reductionPage === totalReductionPages || totalReductionPages === 0}
                      onClick={() => setReductionPage(reductionPage + 1)}
                      className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition-all text-slate-600 dark:text-slate-400"
                    >
                      <ChevronRightIcon size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'other-transactions' && (
            <div>
              <table className="w-full text-left min-w-[900px]">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-800/10">
                    <th className="px-6 py-4.5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4.5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Type</th>
                    <th className="px-6 py-4.5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Category</th>
                    <th className="px-6 py-4.5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Amount</th>
                    <th className="px-6 py-4.5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Verified By</th>
                    <th className="px-6 py-4.5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Description/Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {paginatedOtherTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/20 transition-colors group">
                      <td className="px-6 py-3.5">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{formatEthiopianLabel(tx.date)}</p>
                        <div className="flex gap-1.5 mt-0.5">
                          <span className="text-[10px] text-slate-400">{tx.date}</span>
                          <span className="text-[10px] text-slate-400/80">&bull;</span>
                          <span className="text-[10px] text-slate-400">{new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider border border-blue-100/50 dark:border-blue-900/30">
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                          tx.amount < 0
                            ? 'bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100/50 dark:border-rose-900/30'
                            : 'bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/30'
                        }`}>
                          {tx.amount < 0 ? 'Expense' : 'Income'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className={`flex items-center gap-1 font-extrabold text-sm ${
                          tx.amount < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {Math.abs(tx.amount).toLocaleString()} ETB
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-350">{tx.recorded_by_name || tx.verified_by || '—'}</p>
                      </td>
                      <td className="px-6 py-3.5">
                        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate">{tx.description || tx.details || '—'}</p>
                      </td>
                    </tr>
                  ))}
                  {filteredOtherTransactions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-12 text-center">
                        <Wallet className="w-12 h-12 text-slate-300 dark:text-slate-750 mx-auto mb-3" />
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">No other transactions found.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Pagination Footer */}
              {filteredOtherTransactions.length > 0 && (
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/20 dark:bg-slate-950/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <p className="text-xs font-semibold text-slate-400">
                    Showing {startOtherTxIndex + 1} to {Math.min(filteredOtherTransactions.length, startOtherTxIndex + itemsPerPage)} of {filteredOtherTransactions.length} transactions
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      title="Previous page"
                      disabled={otherTxPage === 1}
                      onClick={() => setOtherTxPage(otherTxPage - 1)}
                      className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition-all text-slate-600 dark:text-slate-400"
                    >
                      <ChevronLeftIcon size={14} />
                    </button>

                    {Array.from({ length: totalOtherTxPages }, (_, i) => i + 1).map((pg) => {
                      if (totalOtherTxPages > 5 && Math.abs(otherTxPage - pg) > 1 && pg !== 1 && pg !== totalOtherTxPages) {
                        if (pg === 2 || pg === totalOtherTxPages - 1) {
                          return <span key={pg} className="px-1 text-slate-400 text-xs font-bold">...</span>;
                        }
                        return null;
                      }
                      return (
                        <button
                          key={pg}
                          type="button"
                          onClick={() => setOtherTxPage(pg)}
                          className={`w-7 h-7 rounded-lg text-xs font-black transition-all ${otherTxPage === pg
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'
                            }`}
                        >
                          {pg}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      title="Next page"
                      disabled={otherTxPage === totalOtherTxPages || totalOtherTxPages === 0}
                      onClick={() => setOtherTxPage(otherTxPage + 1)}
                      className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition-all text-slate-600 dark:text-slate-400"
                    >
                      <ChevronRightIcon size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'finance' && (
            <div>
              <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-800/10">
                    <th className="px-6 py-4.5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4.5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Student</th>
                    <th className="px-6 py-4.5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Section</th>
                    <th className="px-6 py-4.5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Category</th>
                    <th className="px-6 py-4.5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Direction</th>
                    <th className="px-6 py-4.5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Action</th>
                    <th className="px-6 py-4.5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Modified By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {paginatedAuditTrail.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/20 transition-colors group">
                      <td className="px-6 py-3.5">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{formatEthiopianLabel(entry.timestamp)}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{(() => { const d = entry.timestamp ? new Date(entry.timestamp) : null; return d && !isNaN(d.getTime()) ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'; })()}</p>
                      </td>
                      <td className="px-6 py-3.5">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{entry.student_name || 'N/A'}</p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{entry.student_id?.slice(0, 8) || 'Unknown'}</p>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-350">{entry.section || 'General'}</span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider border border-blue-100/50 dark:border-blue-900/30">
                          {entry.category}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${entry.direction === 'In' ? 'bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/30' : 'bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100/50 dark:border-rose-900/30'}`}>
                          {entry.direction || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-350">{entry.action_label}</p>
                      </td>
                      <td className="px-6 py-3.5">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{entry.modified_by}</p>
                        {entry.approver_name && <p className="text-[10px] text-slate-400">Approved by {entry.approver_name}</p>}
                      </td>
                    </tr>
                  ))}
                  {filteredAuditTrail.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-12 text-center">
                        <ShieldCheck className="w-12 h-12 text-slate-300 dark:text-slate-750 mx-auto mb-3" />
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">No audit trail entries match the current filters.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              </div>

              {/* Student Finance Pagination Footer */}
              {filteredAuditTrail.length > 0 && (
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/20 dark:bg-slate-950/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <p className="text-xs font-semibold text-slate-400">
                    Showing {startFinanceIndex + 1} to {Math.min(filteredAuditTrail.length, startFinanceIndex + itemsPerPage)} of {filteredAuditTrail.length} entries
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      title="Previous page"
                      disabled={financePage === 1}
                      onClick={() => setFinancePage(financePage - 1)}
                      className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition-all text-slate-600 dark:text-slate-400"
                    >
                      <ChevronLeftIcon size={14} />
                    </button>

                    {Array.from({ length: totalFinancePages }, (_, i) => i + 1).map((pg) => {
                      if (totalFinancePages > 5 && Math.abs(financePage - pg) > 1 && pg !== 1 && pg !== totalFinancePages) {
                        if (pg === 2 || pg === totalFinancePages - 1) {
                          return <span key={pg} className="px-1 text-slate-400 text-xs font-bold">...</span>;
                        }
                        return null;
                      }
                      return (
                        <button
                          key={pg}
                          type="button"
                          onClick={() => setFinancePage(pg)}
                          className={`w-7 h-7 rounded-lg text-xs font-black transition-all ${financePage === pg ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
                        >
                          {pg}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      title="Next page"
                      disabled={financePage === totalFinancePages || totalFinancePages === 0}
                      onClick={() => setFinancePage(financePage + 1)}
                      className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition-all text-slate-600 dark:text-slate-400"
                    >
                      <ChevronRightIcon size={14} />
                    </button>
                  </div>
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
              <button title="Close report modal" onClick={() => setShowReportModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all">
                <XCircle className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Ethiopian Start Date *</label>
                  <EthiopianDatePicker
                    value={reportStartDate}
                    onChange={setReportStartDate}
                  />
                  <p className="text-xs text-slate-500 mt-2">Use Ethiopian date format: YYYY-MM-DD</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Ethiopian End Date *</label>
                  <EthiopianDatePicker
                    value={reportEndDate}
                    onChange={setReportEndDate}
                  />
                  <p className="text-xs text-slate-500 mt-2">Use Ethiopian date format: YYYY-MM-DD</p>
                </div>
              </div>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                <button
                  onClick={handleGenerateReport}
                  className="w-full md:w-auto bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-bold transition-all shadow-lg shadow-blue-500/20"
                >
                  Generate Report
                </button>
                {financialReport ? (
                  <button
                    onClick={() => {
                      console.log('✅ [AuditorDashboard] Download Excel clicked - Report available:', financialReport);
                      handleExportReport();
                    }}
                    className="w-full md:w-auto bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 justify-center"
                  >
                    <FileText size={16} />
                    <span>Download Excel</span>
                  </button>
                ) : (
                  <p className="text-xs text-slate-400">📌 Generate report first to enable export</p>
                )}
              </div>

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
                            <p className="font-bold text-slate-900 dark:text-white">{formatEthiopianLabel(item.date)}</p>
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
