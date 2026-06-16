import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  TrendingUp,
  Clock,
  ShieldCheck,
  ArrowRight,
  Users,
  DollarSign,
  Landmark,
  UserSquare2,
  Building,
  BarChart3,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import auditorService, { type AuditorDashboard as AuditorDashboardData, type Branch } from '../services/auditorService';
import { useStore } from '../context/useStore';

const OverviewCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  accent = 'blue',
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: typeof Wallet;
  accent?: 'blue' | 'emerald' | 'amber' | 'purple';
}) => {
  const accents = {
    blue: 'from-blue-600 to-blue-500 text-white bg-gradient-to-br',
    emerald: 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-100 dark:border-slate-800',
    amber: 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-100 dark:border-slate-800',
    purple: 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-100 dark:border-slate-800',
  };
  const iconAccents = {
    blue: 'bg-white/20 text-white',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
  };

  return (
    <div className={`p-6 rounded-[2.5rem] shadow-xl ${accents[accent]}`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${accent === 'blue' ? 'text-blue-100' : 'text-slate-500'}`}>
            {title}
          </p>
          <p className="text-3xl font-black">{value}</p>
          {subtitle && (
            <p className={`text-xs font-bold mt-1 ${accent === 'blue' ? 'text-blue-100' : 'text-slate-500'}`}>
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-2xl ${iconAccents[accent]}`}>
          <Icon className="w-8 h-8" />
        </div>
      </div>
    </div>
  );
};

const QuickLink = ({
  to,
  title,
  description,
  icon: Icon,
}: {
  to: string;
  title: string;
  description: string;
  icon: typeof Wallet;
}) => (
  <Link
    to={to}
    className="group flex items-center justify-between gap-4 p-6 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-lg hover:border-blue-300 dark:hover:border-blue-700 hover:-translate-y-0.5 transition-all"
  >
    <div className="flex items-start gap-4">
      <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600">
        <Icon size={22} />
      </div>
      <div>
        <h3 className="font-black text-slate-900 dark:text-white">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
      </div>
    </div>
    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all shrink-0" />
  </Link>
);

export const AuditorDashboard = () => {
  const { t } = useTranslation();
  const [branches, setBranches] = useState<Branch[]>([]);
  const { selectedBranchId, setSelectedBranchId } = useStore();
  const [dashboard, setDashboard] = useState<AuditorDashboardData | null>(null);
  const [otherTransactions, setOtherTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync with localStorage on load if store is empty
  useEffect(() => {
    if (!selectedBranchId) {
      const saved = localStorage.getItem('auditor_selected_branch');
      if (saved) {
        setSelectedBranchId(saved);
      }
    }
  }, [selectedBranchId, setSelectedBranchId]);

  // Load branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const branchList = await auditorService.getBranches();
        setBranches(branchList);
        
        const saved = localStorage.getItem('auditor_selected_branch');
        const currentSelection = useStore.getState().selectedBranchId || saved;
        const exists = branchList.some(b => b.id === currentSelection);
        
        if (branchList.length > 0 && (!currentSelection || !exists)) {
          const firstBranchId = branchList[0].id;
          setSelectedBranchId(firstBranchId);
          localStorage.setItem('auditor_selected_branch', firstBranchId);
        } else if (exists && useStore.getState().selectedBranchId !== currentSelection) {
          setSelectedBranchId(currentSelection);
        }
      } catch (err: any) {
        console.error('Failed to load branches:', err);
      }
    };
    fetchBranches();
  }, [setSelectedBranchId]);

  // Load dashboard data whenever selected branch changes
  useEffect(() => {
    const loadDashboard = async () => {
      if (!selectedBranchId) return;
      try {
        setLoading(true);
        setError(null);
        const [data, otherData] = await Promise.all([
          auditorService.getDashboard(selectedBranchId),
          auditorService.getOtherTransactions({ branchId: selectedBranchId }).catch(() => [])
        ]);
        setDashboard(data);
        setOtherTransactions(otherData || []);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, [selectedBranchId]);

  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const branchId = e.target.value;
    setSelectedBranchId(branchId);
    localStorage.setItem('auditor_selected_branch', branchId);
  };

  const regFeeCount = dashboard?.registrationFees.count ?? 0;
  const regFeeTotal = dashboard?.registrationFees.total ?? 0;
  const otherNet = otherTransactions.reduce((s, t) => s + Number(t.amount ?? 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('nav.dashboard')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-500" />
            Global Auditor Portal — View unique database records for any selected branch
          </p>
        </div>

        {/* Branch Selector Dropdown */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-sm w-full md:w-auto">
          <Building className="w-5 h-5 text-blue-600 shrink-0" />
          <div className="flex flex-col w-full">
            <span className="text-[10px] font-black uppercase text-slate-400">Selected Branch</span>
            <select
              title="Select branch to audit"
              value={selectedBranchId || ''}
              onChange={handleBranchChange}
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
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-6 py-4 rounded-2xl text-sm font-bold">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            <OverviewCard
              accent="blue"
              title="Total Payments"
              value={dashboard?.totalPayments.count ?? 0}
              subtitle={`${(dashboard?.totalPayments.total ?? 0).toLocaleString()} ETB`}
              icon={Wallet}
            />
            <OverviewCard
              accent="emerald"
              title="Monthly Payments"
              value={dashboard?.monthlyPayments.count ?? 0}
              subtitle={`${(dashboard?.monthlyPayments.total ?? 0).toLocaleString()} ETB`}
              icon={TrendingUp}
            />
            <OverviewCard
              accent="amber"
              title="Pending Approvals"
              value={dashboard?.pendingApprovals ?? 0}
              subtitle={`${dashboard?.pendingLoans ?? 0} loans · ${dashboard?.pendingFeeReductions ?? 0} fee reductions`}
              icon={Clock}
            />
            <OverviewCard
              accent="purple"
              title="Other Transactions"
              value={`${otherNet >= 0 ? '+' : ''}${otherNet.toLocaleString()} ETB`}
              subtitle={`${otherTransactions.length} non-student tx`}
              icon={BarChart3}
            />
            <OverviewCard
              accent="emerald"
              title="Registration Fee"
              value={regFeeCount}
              subtitle={`${regFeeTotal.toLocaleString()} ETB collected`}
              icon={DollarSign}
            />
          </div>

          <div>
            <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-widest mb-4">
              Student Finance Workspace
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <QuickLink
                to="/finance?tab=collections"
                title="Fee Collections"
                description="Audit student payment collections and billing status"
                icon={Wallet}
              />
              <QuickLink
                to="/finance?tab=fee-reductions"
                title="Fee Reductions"
                description="Review and approve special student fee reduction requests"
                icon={Users}
              />
              <QuickLink
                to="/finance?tab=registration-fees"
                title="Registration Fees"
                description="View annual registration fee status for all students"
                icon={DollarSign}
              />
            </div>
          </div>

          <div>
            <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-widest mb-4">
              Other Modules
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <QuickLink to="/payroll" title="Payroll Ledger" description="Staff payroll records" icon={DollarSign} />
              <QuickLink to="/loans" title="Loan Accounts" description="Branch loan oversight" icon={Landmark} />
              <QuickLink to="/employee-profiles" title="Salary Profiles" description="Employee compensation" icon={UserSquare2} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
