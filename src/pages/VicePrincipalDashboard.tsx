import { Users, GraduationCap, Clock, ChevronRight, BarChart3, Lock, CheckCircle2, Unlock } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getVPDashboard, getStaffAbsentCount } from '../services/vicePrincipalService';
const StatCard = ({ icon: Icon, label, value, color }: any) => (
  <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800/80 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
    <div className="flex items-center justify-between mb-4">
      <div className={`${color} p-3 rounded-2xl text-white`}><Icon size={20} /></div>
    </div>
    <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">{label}</h3>
    <p className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-1">{value}</p>
  </div>
);

export const VicePrincipalDashboard = () => {
  const { user } = useUser();
  const [dashboard, setDashboard] = useState<any>(null);
  const [staffAbsentCount, setStaffAbsentCount] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const [dashboardData, absentData] = await Promise.all([
        getVPDashboard(),
        getStaffAbsentCount(),
      ]);
      setDashboard(dashboardData);
      setStaffAbsentCount(absentData.absentCount);
    } catch (err: any) {
      console.error('VP Dashboard error:', err);
      showToast('Failed to load vice principal dashboard data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <p className="text-slate-500 dark:text-slate-400 animate-pulse font-medium">Assembling VP Portal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header section with glassmorphic visuals */}
      <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 text-white rounded-[2rem] p-8 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.2),_transparent_50%)]" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl transform translate-x-20 -translate-y-20"></div>
        <div className="relative z-10">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-indigo-400 mb-2">Vice Principal Portal</p>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Academic Oversight, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-300">VP {user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-slate-400 text-sm mt-3 max-w-2xl font-medium leading-relaxed">
            Monitor branch attendance counts and absence escalations with verified data from the database.
          </p>
        </div>
      </section>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Link to="/vp-attendance" className="block">
          <StatCard
            icon={Users}
            label="Pending Absences"
            value={staffAbsentCount != null ? staffAbsentCount : dashboard?.pendingAbsencesCount ?? '-'}
            color="bg-rose-600 shadow-lg shadow-rose-600/10"
          />
        </Link>
        <Link to="/vp-attendance" className="block">
          <StatCard
            icon={Clock}
            label="Today's Attendance"
            value={dashboard?.todayAttendanceRate != null ? `${dashboard.todayAttendanceRate.toFixed(1)}%` : '-'}
            color="bg-emerald-600 shadow-lg shadow-emerald-600/10"
          />
        </Link>
      </div>

      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-lg">Staff Absence Summary</h3>
            <p className="text-xs text-slate-500 mt-1">
              {staffAbsentCount != null
                ? `${staffAbsentCount} staff member(s) have not checked in today`
                : 'Calculating absent staff...'}
            </p>
          </div>
          <Link
            to="/vp-attendance"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold transition-all"
          >
            View Details
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Link 
          to="/vp-attendance" 
          className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-3xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group shadow-md shadow-emerald-500/10"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-2xl">
              <BarChart3 size={24} />
            </div>
            <ChevronRight className="group-hover:translate-x-1.5 transition-transform" size={20} />
          </div>
          <h3 className="font-bold text-lg mb-1">Attendance Oversight</h3>
          <p className="text-emerald-50/90 text-sm font-medium">Audit daily student presence matrices</p>
        </Link>

        <Link 
          to="/vp-grade-management" 
          className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white rounded-3xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group shadow-md shadow-blue-500/10"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-2xl">
              <GraduationCap size={24} />
            </div>
            <ChevronRight className="group-hover:translate-x-1.5 transition-transform" size={20} />
          </div>
          <h3 className="font-bold text-lg mb-1">Grade Management</h3>
          <p className="text-blue-50/90 text-sm font-medium">Process and view student grades by section</p>
        </Link>


        <Link 
          to="/vp-transcripts" 
          className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-3xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group shadow-md shadow-indigo-500/10"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-2xl">
              <GraduationCap size={24} />
            </div>
            <ChevronRight className="group-hover:translate-x-1.5 transition-transform" size={20} />
          </div>
          <h3 className="font-bold text-lg mb-1">Transcripts & Record Archive</h3>
          <p className="text-indigo-50/90 text-sm font-medium">Verify student histories and transcripts</p>
        </Link>
      </div>



      {toast.show && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl border ${
            toast.type === 'success'
              ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/40 text-green-800 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-300'
          }`}>
            <CheckCircle2 className="text-emerald-500" size={20} />
            <p className="text-sm font-semibold">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};
