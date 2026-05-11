
import { useState, useEffect } from 'react';
import { 
  Wallet, Users, AlertCircle, CheckCircle, XCircle, Search, 
  Download, Clock, ShieldCheck,
  ArrowUpRight, Eye
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { 
  getAuditorDashboard, 
  getAllPayments, 
  getFeeReductions, 
  updateFeeReductionStatus,
  AuditorDashboard as AuditorDashboardData,
  Payment,
  FeeReduction
} from '../services/auditorService';

export const AuditorDashboard = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'transactions' | 'special-students'>('transactions');
  const [dashboard, setDashboard] = useState<AuditorDashboardData | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [feeReductions, setFeeReductions] = useState<FeeReduction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [dashboardData, paymentsData, feeReductionsData] = await Promise.all([
        getAuditorDashboard(),
        getAllPayments(),
        getFeeReductions()
      ]);
      setDashboard(dashboardData);
      setPayments(paymentsData);
      setFeeReductions(feeReductionsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string, approved: boolean) => {
    try {
      await updateFeeReductionStatus(id, {
        status: approved ? 'Approved' : 'Rejected',
        remarks: approved ? 'Approved by auditor' : 'Rejected by auditor'
      });
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-8 pb-12">
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
          <button className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all shadow-sm">
            <Download size={20} />
          </button>
          <button className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95">
            Generate Report
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Revenue', value: `${dashboard?.totalRevenue.toLocaleString() || 0} ETB`, trend: `+${((dashboard?.totalRevenue || 0) / 1000000).toFixed(1)}M`, icon: Wallet, color: 'blue' },
          { label: 'Total Students', value: dashboard?.totalStudents || 0, trend: `${dashboard?.paidStudents || 0} Paid`, icon: Users, color: 'purple' },
          { label: 'Pending Approvals', value: dashboard?.pendingFeeReductions || 0, trend: 'Priority', icon: Clock, color: 'amber' },
          { label: 'Net Profit', value: `${dashboard?.netProfit.toLocaleString() || 0} ETB`, trend: 'Audit OK', icon: ShieldCheck, color: 'emerald' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none flex flex-col justify-between group hover:border-blue-500/30 transition-all duration-500">
            <div className="flex justify-between items-start">
              <div className={`p-4 bg-${stat.color}-50 dark:bg-${stat.color}-900/20 rounded-2xl text-${stat.color}-600 dark:text-${stat.color}-400 group-hover:scale-110 transition-transform`}>
                <stat.icon size={24} />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-${stat.color}-100/50 dark:bg-${stat.color}-900/30 text-${stat.color}-700 dark:text-${stat.color}-400`}>
                {stat.trend}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
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
              Transactions
            </button>
            <button
              onClick={() => setActiveTab('special-students')}
              className={`flex-1 md:flex-none px-8 py-3 rounded-[1.2rem] text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'special-students' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xl' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Special Students
            </button>
          </div>

          <div className="relative w-full md:w-96">
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

        <div className="p-0 overflow-x-auto">
          {activeTab === 'transactions' ? (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Student</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Amount</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Type</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Branch</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Verified By</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold">
                          {payment.studentName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{payment.studentName}</p>
                          <p className="text-[10px] text-slate-400 font-bold">ID: {payment.studentId.slice(0, 8)}</p>
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
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{payment.paymentMethod}</p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{payment.status}</p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{new Date(payment.date).toLocaleDateString()}</p>
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
              {feeReductions.map((reduction) => (
                <div key={reduction.id} className="p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center text-purple-700 dark:text-purple-400 group-hover:scale-110 transition-transform">
                      <Users size={32} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="text-lg font-black text-slate-800 dark:text-white">{reduction.studentName}</h4>
                        <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500">
                          {reduction.reductionPercentage}% Reduction
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium italic">"{reduction.reason}"</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-8">
                    <div className="text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current → Requested</p>
                      <p className="text-xl font-black text-blue-600 dark:text-blue-400">{reduction.currentFee.toLocaleString()} → {reduction.requestedFee.toLocaleString()} ETB</p>
                    </div>

                    <div className="flex flex-col items-center">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Approval Status</p>
                       <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border ${
                         reduction.status === 'Pending' ? 'bg-amber-100/50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50' :
                         reduction.status === 'Approved' ? 'bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50' :
                         'bg-rose-100/50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/50'
                       }`}>
                         {reduction.status === 'Pending' && <Clock size={12} />}
                         {reduction.status === 'Approved' && <CheckCircle size={12} />}
                         {reduction.status === 'Rejected' && <XCircle size={12} />}
                         {reduction.status}
                       </span>
                    </div>

                    {reduction.status === 'Pending' && (
                      <div className="flex items-center gap-3 ml-4">
                        <button 
                          onClick={() => handleApprove(reduction.id, false)}
                          className="p-3 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-2xl border border-rose-100 dark:border-rose-900/30 transition-all"
                        >
                          <XCircle size={24} />
                        </button>
                        <button 
                          onClick={() => handleApprove(reduction.id, true)}
                          className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
                        >
                          Approve
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
        </>
      )}

      {/* Audit Log Hint */}
      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 p-6 rounded-[2rem] flex items-start gap-4">
        <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-2xl">
          <AlertCircle size={24} />
        </div>
        <div>
          <h4 className="text-sm font-black text-amber-800 dark:text-amber-400 uppercase tracking-widest">Auditor Tip</h4>
          <p className="text-xs text-amber-700 dark:text-amber-500 mt-1 font-medium">
            All fee reductions must be accompanied by a valid reason in the notes section. Approved reductions will be immediately reflected in the student's next billing cycle.
            Check the detailed **Audit Log** in the Settings for granular change history.
          </p>
        </div>
      </div>
    </div>
  );
};
