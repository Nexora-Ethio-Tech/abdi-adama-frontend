import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Wallet, Users, CheckCircle, XCircle, Search,
  Clock, ShieldCheck, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon,
  Building, TrendingUp, Landmark
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { Breadcrumbs } from '../components/Breadcrumbs';
import auditorService, {
  type AuditorDashboard as AuditorDashboardData,
  type FeeReduction,
  type Branch,
  type Collection
} from '../services/auditorService';
import {
  formatEthiopianLabel
} from '../utils/ethiopianCalendar';

type AuditorFinanceTab = 'collections' | 'fee-reductions';

const tabFromSearch = (tab: string | null): AuditorFinanceTab => {
  if (
    tab === 'collections' ||
    tab === 'fee-reductions'
  ) {
    return tab;
  }
  return 'collections';
};

export const AuditorFinance = () => {
  const _user = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<AuditorFinanceTab>(
    location.pathname === '/special-students'
      ? 'fee-reductions'
      : tabFromSearch(searchParams.get('tab'))
  );

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(() => {
    return localStorage.getItem('auditor_selected_branch') || '';
  });

  const [dashboard, setDashboard] = useState<AuditorDashboardData | null>(null);
  const [feeReductions, setFeeReductions] = useState<FeeReduction[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filters
  const [feeReductionFilter, setFeeReductionFilter] = useState<'pending' | 'approved' | 'rejected' | ''>('');
  const [collectionStatusFilter, setCollectionStatusFilter] = useState<'Pending' | 'Paid' | 'Overdue' | ''>('');

  // Pagination states
  const [reductionPage, setReductionPage] = useState(1);
  const [collectionPage, setCollectionPage] = useState(1);
  const itemsPerPage = 10;

  // Sync URL (?tab=) and legacy paths with activeTab
  useEffect(() => {
    if (location.pathname === '/special-students') {
      setActiveTab('fee-reductions');
      return;
    }
    setActiveTab(tabFromSearch(searchParams.get('tab')));
  }, [location.pathname, searchParams]);

  // Load branches list
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const branchList = await auditorService.getBranches();
        setBranches(branchList);
        if (branchList.length > 0 && !selectedBranchId) {
          const firstId = branchList[0].id;
          setSelectedBranchId(firstId);
          localStorage.setItem('auditor_selected_branch', firstId);
        }
      } catch (err: any) {
        setError(err.response?.data?.error?.message || err.message || 'Failed to fetch branches');
      }
    };
    fetchBranches();
  }, []);

  // Fetch data on branch selection or filter change
  useEffect(() => {
    if (selectedBranchId) {
      fetchData();
    }
  }, [selectedBranchId, activeTab, feeReductionFilter, collectionStatusFilter]);

  const handleTabChange = (tab: AuditorFinanceTab) => {
    setActiveTab(tab);
    navigate(`/finance?tab=${tab}`);
  };

  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const branchId = e.target.value;
    setSelectedBranchId(branchId);
    localStorage.setItem('auditor_selected_branch', branchId);
  };

  const fetchData = async () => {
    if (!selectedBranchId) return;
    try {
      setLoading(true);
      setError(null);

      // Load specific tab datasets to prevent heavy database queries
      const dashboardPromise = auditorService.getDashboard(selectedBranchId);
      setDashboard(await dashboardPromise);

      if (activeTab === 'fee-reductions') {
        const reductionsData = await auditorService.getFeeReductions({ branchId: selectedBranchId, status: feeReductionFilter || undefined });
        setFeeReductions(reductionsData);
      } else if (activeTab === 'collections') {
        const collectionsData = await auditorService.getCollections({ branchId: selectedBranchId, status: collectionStatusFilter || undefined });
        setCollections(collectionsData);
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.error?.message || err.message || 'Failed to fetch branch data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await auditorService.updateFeeReductionStatus(id, { status }, selectedBranchId);
      setSuccess(`Fee reduction ${status.toLowerCase()} successfully!`);
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to update fee reduction');
      setTimeout(() => setError(null), 5000);
    }
  };

  // Filters logic
  const filteredFeeReductions = feeReductions.filter(reduction =>
    reduction.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    reduction.digital_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCollections = collections.filter(collection =>
    collection.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    collection.digital_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    collection.grade.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination calculation
  const totalReductionPages = Math.ceil(filteredFeeReductions.length / itemsPerPage);
  const startReductionIndex = (reductionPage - 1) * itemsPerPage;
  const paginatedFeeReductions = filteredFeeReductions.slice(startReductionIndex, startReductionIndex + itemsPerPage);

  const totalCollectionPages = Math.ceil(filteredCollections.length / itemsPerPage);
  const startCollectionIndex = (collectionPage - 1) * itemsPerPage;
  const paginatedCollections = filteredCollections.slice(startCollectionIndex, startCollectionIndex + itemsPerPage);

  return (
    <div className="space-y-8 pb-12">
      <Breadcrumbs />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Finance <span className="text-blue-600">Audit Center</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-500" />
            Global branch auditing and real-time transaction reporting
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Branch Selector Dropdown */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-2xl shadow-sm">
            <Building className="w-5 h-5 text-blue-600" />
            <select
              title="Select branch to audit"
              value={selectedBranchId}
              onChange={handleBranchChange}
              className="bg-transparent text-sm font-bold text-slate-850 dark:text-white outline-none cursor-pointer pr-4"
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
        {/* Row 1: Tab switcher + search/filter */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col xl:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full xl:w-fit gap-1">
            <button
              type="button"
              onClick={() => handleTabChange('collections')}
              className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${activeTab === 'collections' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-md border border-slate-200 dark:border-slate-700' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-150 dark:hover:bg-slate-850'}`}
            >
              Fee Collections ({collections.length})
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('fee-reductions')}
              className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${activeTab === 'fee-reductions' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-md border border-slate-200 dark:border-slate-700' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-150 dark:hover:bg-slate-850'}`}
            >
              Fee Reductions ({feeReductions.length})
            </button>
          </div>

          <div className="flex items-center gap-3 w-full xl:w-auto">
            {activeTab === 'fee-reductions' && (
              <select
                title="Filter fee reductions by approval status"
                value={feeReductionFilter}
                onChange={(e) => {
                  setFeeReductionFilter(e.target.value as any);
                }}
                className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-medium text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            )}

            {activeTab === 'collections' && (
              <select
                title="Filter collections by status"
                value={collectionStatusFilter}
                onChange={(e) => {
                  setCollectionStatusFilter(e.target.value as any);
                }}
                className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-medium text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">All Roster Status</option>
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
              </select>
            )}

            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="p-0 overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : (
            <>


              {activeTab === 'collections' && (
                <div>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-800/10">
                        <th className="px-6 py-4.5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Student</th>
                        <th className="px-6 py-4.5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Grade</th>
                        <th className="px-6 py-4.5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Month/Year</th>
                        <th className="px-6 py-4.5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Amount</th>
                        <th className="px-6 py-4.5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Paid</th>
                        <th className="px-6 py-4.5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Balance</th>
                        <th className="px-6 py-4.5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4.5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Due Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {paginatedCollections.map((col) => (
                        <tr key={col.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/20 transition-colors group">
                          <td className="px-6 py-3.5">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{col.student_name}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{col.digital_id}</p>
                          </td>
                          <td className="px-6 py-3.5">
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Grade {col.grade}</span>
                          </td>
                          <td className="px-6 py-3.5">
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-350">
                              {(['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(col.billing_month) - 1] || col.billing_month)} {col.billing_year}
                            </span>
                          </td>
                          <td className="px-6 py-3.5">
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{col.total_amount.toLocaleString()} ETB</span>
                          </td>
                          <td className="px-6 py-3.5">
                            <span className="text-sm font-bold text-emerald-600">{col.amount_paid.toLocaleString()} ETB</span>
                          </td>
                          <td className="px-6 py-3.5">
                            <span className={`text-sm font-bold ${col.balance > 0 ? 'text-red-500' : 'text-slate-600'}`}>
                              {col.balance.toLocaleString()} ETB
                            </span>
                          </td>
                          <td className="px-6 py-3.5">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                              col.status === 'Paid'
                                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 border-emerald-100'
                                : col.status === 'Overdue'
                                  ? 'bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 border-rose-100'
                                  : 'bg-amber-50/50 dark:bg-amber-950/20 text-amber-600 border-amber-100'
                            }`}>
                              {col.status}
                            </span>
                          </td>
                          <td className="px-6 py-3.5">
                            <span className="text-sm text-slate-500">{formatEthiopianLabel(col.due_date)}</span>
                          </td>
                        </tr>
                      ))}
                      {filteredCollections.length === 0 && (
                        <tr>
                          <td colSpan={8} className="p-12 text-center">
                            <Landmark className="w-12 h-12 text-slate-300 dark:text-slate-750 mx-auto mb-3" />
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">No student collections found for this branch.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {filteredCollections.length > 0 && (
                    <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/20 dark:bg-slate-950/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                      <p className="text-xs font-semibold text-slate-400">
                        Showing {startCollectionIndex + 1} to {Math.min(filteredCollections.length, startCollectionIndex + itemsPerPage)} of {filteredCollections.length} records
                      </p>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          title="Previous page"
                          disabled={collectionPage === 1}
                          onClick={() => setCollectionPage(collectionPage - 1)}
                          className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-all text-slate-600"
                        >
                          <ChevronLeftIcon size={14} />
                        </button>
                        {Array.from({ length: totalCollectionPages }, (_, i) => i + 1).map((pg) => (
                          <button
                            key={pg}
                            type="button"
                            onClick={() => setCollectionPage(pg)}
                            className={`w-7 h-7 rounded-lg text-xs font-black transition-all ${collectionPage === pg ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-50 text-slate-500'}`}
                          >
                            {pg}
                          </button>
                        ))}
                        <button
                          type="button"
                          title="Next page"
                          disabled={collectionPage === totalCollectionPages || totalCollectionPages === 0}
                          onClick={() => setCollectionPage(collectionPage + 1)}
                          className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-all text-slate-600"
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
                                <p className="text-xs text-slate-600 dark:text-slate-350 mt-1.5 italic bg-slate-100/70 dark:bg-slate-900/30 p-1.5 rounded-lg border border-slate-200/50 dark:border-slate-800/40">
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
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">No fee reduction requests found for this branch.</p>
                      </div>
                    )}
                  </div>

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
                          className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-all text-slate-650"
                        >
                          <ChevronLeftIcon size={14} />
                        </button>
                        {Array.from({ length: totalReductionPages }, (_, i) => i + 1).map((pg) => (
                          <button
                            key={pg}
                            type="button"
                            onClick={() => setReductionPage(pg)}
                            className={`w-7 h-7 rounded-lg text-xs font-black transition-all ${reductionPage === pg ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-50 text-slate-500'}`}
                          >
                            {pg}
                          </button>
                        ))}
                        <button
                          type="button"
                          title="Next page"
                          disabled={reductionPage === totalReductionPages || totalReductionPages === 0}
                          onClick={() => setReductionPage(reductionPage + 1)}
                          className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-all text-slate-650"
                        >
                          <ChevronRightIcon size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
