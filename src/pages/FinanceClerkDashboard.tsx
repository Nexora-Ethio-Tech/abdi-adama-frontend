import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { DollarSign, TrendingUp, Users, AlertCircle, Plus, X, Search, Receipt, CreditCard, FileText } from 'lucide-react';
import financeClerkService, { type FinanceClerkDashboard as FinanceClerkDashboardType, type StudentFeeInfo, type Transaction, type RecordPaymentRequest } from '../services/financeService';
import payrollService, { type EmployeePayrollProfile } from '../services/payrollService';
import { Breadcrumbs } from '../components/Breadcrumbs';
import FinanceClerkRegistration from '../components/FinanceClerkRegistration';

export const FinanceClerkDashboard = ({ initialTab }: { initialTab?: 'all' | 'overdue' | 'registrations' | 'staff-payments' }) => {
  const location = useLocation();
  const isCollectionsView = location.pathname === '/finance-dashboard';

  const [dashboard, setDashboard] = useState<FinanceClerkDashboardType | null>(null);
  const [students, setStudents] = useState<StudentFeeInfo[]>([]);
  const [overdueStudents, setOverdueStudents] = useState<any[]>([]);
  const [staffProfiles, setStaffProfiles] = useState<EmployeePayrollProfile[]>([]);
  const [financeSettings, setFinanceSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'overdue' | 'registrations' | 'staff-payments'>(
    initialTab || (location.pathname === '/finance-dashboard' ? 'all' : 'all')
  );
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentFeeInfo | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [feeStatusFilter, setFeeStatusFilter] = useState<'standard' | 'reduced' | ''>('');
  const [selectedPaymentTypes, setSelectedPaymentTypes] = useState<string[]>(['Monthly Tuition']);
  
  // Student List Pagination
  const [studentPage, setStudentPage] = useState(1);
  const studentsPerPage = 12;

  // Staff Payment Filters & Pagination
  const [staffSearchTerm, setStaffSearchTerm] = useState('');
  const [minSalaryFilter, setMinSalaryFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'paid' | 'not_paid'>('not_paid');
  const [staffPage, setStaffPage] = useState(1);
  const staffPerPage = 10;
  
  const [confirmedStaffPayments, setConfirmedStaffPayments] = useState<Record<string, { date: string }>>(() => {
    try {
      const saved = localStorage.getItem('confirmed_staff_payments');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [paymentData, setPaymentData] = useState<RecordPaymentRequest>({
    studentId: '',
    amount: 0,
    type: ['Monthly Tuition'],
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dashboardData, studentsData, overdueData, staffData, settingsData] = await Promise.all([
        financeClerkService.getDashboard(),
        financeClerkService.getStudentsFees({ search: searchTerm, feeStatus: feeStatusFilter || undefined }),
        financeClerkService.getOverduePayments(),
        payrollService.getAllProfiles().catch(() => []),
        payrollService.getFinanceSettings().catch(() => [])
      ]);
      setDashboard(dashboardData);
      setStudents(studentsData);
      setOverdueStudents(overdueData);
      setStaffProfiles(staffData);
      setFinanceSettings(settingsData);
      setStudentPage(1);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await financeClerkService.recordPayment(paymentData);
      setSuccess('Payment recorded successfully!');
      setShowPaymentModal(false);
      resetPaymentForm();
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to record payment');
      setTimeout(() => setError(null), 5000);
    }
  };

  const openPaymentModal = (student?: StudentFeeInfo) => {
    if (student) {
      setSelectedStudent(student);
      const defaultTypes = ['Monthly Tuition'];
      if (student.bus_fee > 0) defaultTypes.push('Bus Fee');
      if (student.penalty_fee > 0) defaultTypes.push('Penalty Fee');
      
      setSelectedPaymentTypes(defaultTypes);
      const totalDue = (student.monthly_fee || 0) + (student.bus_fee || 0) + (student.penalty_fee || 0);
      setPaymentData({
        studentId: student.id,
        amount: totalDue,
        type: defaultTypes,
        date: new Date().toISOString().split('T')[0],
      });
    } else {
      setSelectedPaymentTypes(['Monthly Tuition']);
      setPaymentData({
        studentId: '',
        amount: 0,
        type: ['Monthly Tuition'],
        date: new Date().toISOString().split('T')[0],
      });
    }
    setShowPaymentModal(true);
  };

  const resetPaymentForm = () => {
    setPaymentData({
      studentId: '',
      amount: 0,
      type: ['Monthly Tuition'],
      date: new Date().toISOString().split('T')[0],
    });
    setSelectedStudent(null);
    setSelectedPaymentTypes(['Monthly Tuition']);
  };

  const handleCheckboxChange = (type: string) => {
    let updated: string[];
    if (selectedPaymentTypes.includes(type)) {
      updated = selectedPaymentTypes.filter(t => t !== type);
    } else {
      updated = [...selectedPaymentTypes, type];
    }
    setSelectedPaymentTypes(updated);
    
    // Auto-calculate sum based on selected types
    if (selectedStudent) {
      let sum = 0;
      if (updated.includes('Monthly Tuition')) sum += selectedStudent.monthly_fee;
      if (updated.includes('Bus Fee')) sum += selectedStudent.bus_fee;
      if (updated.includes('Penalty Fee')) sum += selectedStudent.penalty_fee;
      if (updated.includes('Registration Fee')) sum += 2500;
      if (updated.includes('Exam Fee')) sum += 350;
      if (updated.includes('Activity Fee')) sum += 500;
      
      setPaymentData({
        ...paymentData,
        type: updated,
        amount: sum
      });
    } else {
      setPaymentData({
        ...paymentData,
        type: updated
      });
    }
  };

  const confirmStaffPayment = (userId: string) => {
    const updated = {
      ...confirmedStaffPayments,
      [userId]: { date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString() }
    };
    setConfirmedStaffPayments(updated);
    localStorage.setItem('confirmed_staff_payments', JSON.stringify(updated));
  };

  const openPaymentHistory = async (student: StudentFeeInfo) => {
    try {
      const history = await financeClerkService.getPaymentHistory(student.id);
      setPaymentHistory(history);
      setSelectedStudent(student);
      setShowHistoryModal(true);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch payment history');
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.digital_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOverdueStudents = overdueStudents.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.digital_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedStudents = activeTab === 'all' ? filteredStudents : filteredOverdueStudents;
  const paginatedStudents = displayedStudents.slice((studentPage - 1) * studentsPerPage, studentPage * studentsPerPage);
  const totalStudentPages = Math.max(1, Math.ceil(displayedStudents.length / studentsPerPage));

  if (loading && !dashboard) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const studentDeadlineDay = financeSettings.find(s => s.key === 'student_payment_deadline')?.value || 10;
  const staffDeadlineDay = financeSettings.find(s => s.key === 'staff_salary_deadline')?.value || 28;
  const penaltyRate = financeSettings.find(s => s.key === 'student_late_penalty_rate')?.value || 150;

  const today = new Date();
  const todayDay = today.getDate();
  const daysToStudentDeadline = studentDeadlineDay - todayDay;
  const daysToStaffDeadline = staffDeadlineDay - todayDay;

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            {isCollectionsView ? 'Collections & Payments' : 'Finance Overview'}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mt-1">
            {isCollectionsView ? 'Disburse staff salaries and collect student fees' : 'Manage student fees and payment collection'}
          </p>
        </div>
        <button
          onClick={() => {
            resetPaymentForm();
            setShowPaymentModal(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all font-bold text-sm"
        >
          <Plus className="w-5 h-5" />
          Record Payment
        </button>
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

      {/* Deadline Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`p-4 rounded-2xl border flex items-center justify-between ${
          daysToStudentDeadline < 0 
            ? 'bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-800 text-rose-800 dark:text-rose-300'
            : daysToStudentDeadline <= 3
              ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800 text-amber-800 dark:text-amber-300'
              : 'bg-slate-50 border-slate-200 dark:bg-slate-800/30 dark:border-slate-800 text-slate-800 dark:text-slate-300'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${daysToStudentDeadline < 0 ? 'bg-rose-500' : daysToStudentDeadline <= 3 ? 'bg-amber-500' : 'bg-slate-500'} text-white`}>
              <AlertCircle size={20} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider">Student Fee Deadline</p>
              <p className="text-xs font-medium opacity-90 mt-0.5">
                {daysToStudentDeadline < 0 
                  ? `Overdue by ${Math.abs(daysToStudentDeadline)} days (Deadline: Day ${studentDeadlineDay})` 
                  : daysToStudentDeadline === 0
                    ? `Deadline is TODAY (Day ${studentDeadlineDay})`
                    : `${daysToStudentDeadline} days remaining (Deadline: Day ${studentDeadlineDay})`
                }
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 bg-white/50 rounded-full">Penalty: {penaltyRate} ETB</span>
        </div>

        <div className={`p-4 rounded-2xl border flex items-center justify-between ${
          daysToStaffDeadline < 0 
            ? 'bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-800 text-rose-800 dark:text-rose-300'
            : daysToStaffDeadline <= 3
              ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800 text-amber-800 dark:text-amber-300'
              : 'bg-slate-50 border-slate-200 dark:bg-slate-800/30 dark:border-slate-800 text-slate-800 dark:text-slate-300'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${daysToStaffDeadline < 0 ? 'bg-rose-500' : daysToStaffDeadline <= 3 ? 'bg-amber-500' : 'bg-slate-500'} text-white`}>
              <AlertCircle size={20} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider">Staff Payment Deadline</p>
              <p className="text-xs font-medium opacity-90 mt-0.5">
                {daysToStaffDeadline < 0 
                  ? `Overdue by ${Math.abs(daysToStaffDeadline)} days (Deadline: Day ${staffDeadlineDay})` 
                  : daysToStaffDeadline === 0
                    ? `Deadline is TODAY (Day ${staffDeadlineDay})`
                    : `${daysToStaffDeadline} days remaining (Deadline: Day ${staffDeadlineDay})`
                }
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 bg-white/50 rounded-full">Disburse Salary</span>
        </div>
      </div>

      {/* Dashboard Stats - Skip if in collections only view */}
      {!isCollectionsView && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-500 text-white p-6 rounded-[2rem] shadow-xl hover:-translate-y-1 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest mb-2">Today's Collection</p>
                  <p className="text-3xl font-black">{dashboard?.todayCollection.toLocaleString() || 0}</p>
                  <p className="text-emerald-100 text-xs font-bold mt-1">ETB</p>
                </div>
                <div className="p-3 bg-white/20 rounded-2xl">
                  <DollarSign className="w-8 h-8" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800 hover:-translate-y-1 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Monthly Revenue</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-white">{dashboard?.monthlyRevenue.toLocaleString() || 0}</p>
                  <p className="text-slate-500 text-xs font-bold mt-1">ETB</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-2xl">
                  <TrendingUp className="w-8 h-8" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800 hover:-translate-y-1 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Pending Approvals</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-white">{dashboard?.pendingApprovals || 0}</p>
                  <p className="text-slate-500 text-xs font-bold mt-1">Fee Reductions</p>
                </div>
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-2xl">
                  <AlertCircle className="w-8 h-8" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800 hover:-translate-y-1 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Recent Transactions</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-white">{dashboard?.recentTransactions.length || 0}</p>
                  <p className="text-slate-500 text-xs font-bold mt-1">Last 10</p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-2xl">
                  <Receipt className="w-8 h-8" />
                </div>
              </div>
            </div>
          </div>

          {dashboard && dashboard.recentTransactions.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Recent Transactions</h3>
                <p className="text-slate-500 text-xs mt-1">Last 10 payment records</p>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {dashboard.recentTransactions.map((tx) => (
                  <div key={tx.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{tx.student_name}</p>
                        <p className="text-xs text-slate-500">{tx.type} • {new Date(tx.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-emerald-600 text-lg">{tx.amount.toLocaleString()} ETB</p>
                      <p className="text-xs text-slate-500">by {tx.verified_by}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => { setActiveTab('all'); setStudentPage(1); }}
          className={`px-6 py-3 font-bold text-sm transition-all ${activeTab === 'all'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
        >
          All Students ({students.length})
        </button>
        <button
          onClick={() => { setActiveTab('overdue'); setStudentPage(1); }}
          className={`px-6 py-3 font-bold text-sm transition-all ${activeTab === 'overdue'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
        >
          Overdue ({overdueStudents.length})
        </button>
        <button
          onClick={() => setActiveTab('registrations')}
          className={`px-6 py-3 font-bold text-sm transition-all ${activeTab === 'registrations'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
        >
          Registrations
        </button>
        <button
          onClick={() => setActiveTab('staff-payments')}
          className={`px-6 py-3 font-bold text-sm transition-all ${activeTab === 'staff-payments'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
        >
          Staff Payments ({staffProfiles.length})
        </button>
      </div>

      {activeTab === 'registrations' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-6">
          <FinanceClerkRegistration />
        </div>
      )}

      {activeTab === 'staff-payments' && (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">Staff Salary Payments</h3>
              <p className="text-slate-500 text-xs mt-1">Physically disburse salary and record transaction assertions</p>
            </div>
            <span className="px-4 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full text-xs font-black uppercase tracking-wider">
              {staffProfiles.length} Total Employees
            </span>
          </div>

          {/* Staff Filters */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search name or ID..."
                value={staffSearchTerm}
                onChange={(e) => {
                  setStaffSearchTerm(e.target.value);
                  setStaffPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="number"
                placeholder="Min Salary (ETB)..."
                value={minSalaryFilter}
                onChange={(e) => {
                  setMinSalaryFilter(e.target.value);
                  setStaffPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <select
              value={paymentStatusFilter}
              onChange={(e) => {
                setPaymentStatusFilter(e.target.value as any);
                setStaffPage(1);
              }}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Payment Status</option>
              <option value="paid">Paid</option>
              <option value="not_paid">Not Paid</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Employee</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Basic Salary</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Allowances</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Net Salary</th>
                  <th className="px-6 py-4 text-right text-xs font-black text-slate-500 uppercase tracking-widest">Payment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(() => {
                  const filtered = staffProfiles.filter(staff => {
                    const isPaid = confirmedStaffPayments[staff.user_id];
                    const netPay = (staff.basic_salary || 0) + (staff.transport_allowance || 0) + (staff.housing_allowance || 0) + (staff.position_allowance || 0);
                    if (staffSearchTerm && !staff.name.toLowerCase().includes(staffSearchTerm.toLowerCase()) && !staff.digital_id.toLowerCase().includes(staffSearchTerm.toLowerCase())) return false;
                    if (minSalaryFilter && netPay < Number(minSalaryFilter)) return false;
                    if (paymentStatusFilter === 'paid' && !isPaid) return false;
                    if (paymentStatusFilter === 'not_paid' && isPaid) return false;
                    return true;
                  });
                  const paginated = filtered.slice((staffPage - 1) * staffPerPage, staffPage * staffPerPage);
                  
                  return paginated.map((staff) => {
                  const netPay = (staff.basic_salary || 0) + (staff.transport_allowance || 0) + (staff.housing_allowance || 0) + (staff.position_allowance || 0);
                  const isPaid = confirmedStaffPayments[staff.user_id];
                  return (
                    <tr key={staff.user_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{staff.name}</p>
                          <p className="text-xs text-slate-500">{staff.digital_id} • {staff.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs font-bold uppercase tracking-wide">
                          {staff.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">
                        {(staff.basic_salary || 0).toLocaleString()} ETB
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">
                        {((staff.transport_allowance || 0) + (staff.housing_allowance || 0) + (staff.position_allowance || 0)).toLocaleString()} ETB
                      </td>
                      <td className="px-6 py-4 text-sm font-black text-emerald-600 dark:text-emerald-400">
                        {netPay.toLocaleString()} ETB
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isPaid ? (
                          <div className="inline-flex flex-col items-end">
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full text-xs font-black uppercase tracking-wider">
                              Paid ✓
                            </span>
                            <span className="text-[9px] text-slate-400 mt-1 font-medium">{isPaid.date}</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => confirmStaffPayment(staff.user_id)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10"
                          >
                            Confirm Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                });
              })()}
              </tbody>
            </table>
          </div>
          {(() => {
            const filtered = staffProfiles.filter(staff => {
              const isPaid = confirmedStaffPayments[staff.user_id];
              const netPay = (staff.basic_salary || 0) + (staff.transport_allowance || 0) + (staff.housing_allowance || 0) + (staff.position_allowance || 0);
              if (staffSearchTerm && !staff.name.toLowerCase().includes(staffSearchTerm.toLowerCase()) && !staff.digital_id.toLowerCase().includes(staffSearchTerm.toLowerCase())) return false;
              if (minSalaryFilter && netPay < Number(minSalaryFilter)) return false;
              if (paymentStatusFilter === 'paid' && !isPaid) return false;
              if (paymentStatusFilter === 'not_paid' && isPaid) return false;
              return true;
            });
            const totalPages = Math.ceil(filtered.length / staffPerPage);
            return (
              <>
                {filtered.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-slate-400 font-medium">No staff members found matching filters.</p>
                  </div>
                )}
                {totalPages > 1 && (
                  <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                    <button 
                      onClick={() => setStaffPage(prev => Math.max(1, prev - 1))}
                      disabled={staffPage === 1}
                      className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-slate-500 font-medium">Page {staffPage} of {totalPages}</span>
                    <button 
                      onClick={() => setStaffPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={staffPage === totalPages}
                      className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {(activeTab === 'all' || activeTab === 'overdue') && (
        <>
          {/* Filters */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or ID..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setStudentPage(1);
                    fetchData();
                  }}
                  className="w-full pl-12 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <select
                value={feeStatusFilter}
                onChange={(e) => {
                  setFeeStatusFilter(e.target.value as any);
                  setStudentPage(1);
                  fetchData();
                }}
                className="px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">All Fee Status</option>
                <option value="standard">Standard</option>
                <option value="reduced">Reduced</option>
              </select>
              <button
                onClick={fetchData}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-sm transition-all"
              >
                Apply Filters
              </button>
            </div>
          </div>

          {/* Students Table */}
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Student</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Grade</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Monthly Fee</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Bus Fee</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Penalty</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-black text-slate-500 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedStudents.map((student) => {
                    const _totalDue = (student.monthly_fee || 0) + (student.bus_fee || 0) + (student.penalty_fee || 0);
                    return (
                      <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{student.name}</p>
                            <p className="text-xs text-slate-500">{student.digital_id} • {student.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-bold">
                            Grade {student.grade}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">
                          {(student.monthly_fee || 0).toLocaleString()} ETB
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">
                          {(student.bus_fee || 0).toLocaleString()} ETB
                        </td>
                        <td className="px-6 py-4">
                          {student.penalty_fee > 0 ? (
                            <span className="text-sm font-bold text-red-600">{(student.penalty_fee || 0).toLocaleString()} ETB</span>
                          ) : (
                            <span className="text-sm text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className={`px-2 py-1 text-xs rounded-full font-bold inline-block w-fit ${student.fee_status === 'reduced' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'}`}> 
                              {student.fee_status === 'reduced' ? 'Reduced' : 'Standard'}
                            </span>
                            {student.fee_approval_status === 'pending' && (
                              <span className="px-2 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 rounded-full text-xs font-bold inline-block w-fit">
                                Pending Approval
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openPaymentModal(student)}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all"
                            >
                              Record Payment
                            </button>
                            <button
                              onClick={() => openPaymentHistory(student)}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all"
                            >
                              History
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {displayedStudents.length === 0 && !loading && (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
              <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400 font-medium">No students found.</p>
            </div>
          )}

          {displayedStudents.length > 0 && totalStudentPages > 1 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
              <button
                onClick={() => setStudentPage((prev) => Math.max(1, prev - 1))}
                disabled={studentPage === 1}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-slate-500 font-medium">Page {studentPage} of {totalStudentPages}</span>
              <button
                onClick={() => setStudentPage((prev) => Math.min(totalStudentPages, prev + 1))}
                disabled={studentPage === totalStudentPages}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
          </div>
        </>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-md border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Record Payment</h2>
              <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            {selectedStudent && (
              <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border-b border-slate-100 dark:border-slate-800">
                <p className="text-sm text-slate-600 dark:text-slate-400">Student: <span className="font-bold text-slate-900 dark:text-white">{selectedStudent.name}</span></p>
                <p className="text-sm text-slate-600 dark:text-slate-400">ID: <span className="font-bold text-slate-900 dark:text-white">{selectedStudent.digital_id}</span></p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Due: <span className="font-black text-red-600 text-lg">{(selectedStudent.monthly_fee + selectedStudent.bus_fee + selectedStudent.penalty_fee).toLocaleString()} ETB</span></p>
              </div>
            )}
            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              {!selectedStudent && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Student ID *</label>
                  <input
                    type="text"
                    required
                    value={paymentData.studentId}
                    onChange={(e) => setPaymentData({ ...paymentData, studentId: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Enter student ID"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Payment Types *</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'Monthly Tuition', label: 'Monthly Tuition' },
                    { key: 'Registration Fee', label: 'Registration Fee' },
                    { key: 'Bus Fee', label: 'Bus Fee' },
                    { key: 'Penalty Fee', label: 'Penalty Fee' },
                    { key: 'Exam Fee', label: 'Exam Fee' },
                    { key: 'Activity Fee', label: 'Activity Fee' }
                  ].map((item) => {
                    const checked = selectedPaymentTypes.includes(item.key);
                    return (
                      <label
                        key={item.key}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer select-none ${
                          checked
                            ? 'bg-blue-50/50 border-blue-500 text-blue-900 dark:bg-blue-950/20 dark:border-blue-500 dark:text-blue-200'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleCheckboxChange(item.key)}
                          className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-xs font-bold">{item.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Amount (ETB) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Payment Date *</label>
                <input
                  type="date"
                  required
                  value={paymentData.date}
                  onChange={(e) => setPaymentData({ ...paymentData, date: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-6 py-3 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition-all shadow-lg shadow-blue-500/20"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {showHistoryModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-2xl border border-slate-100 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Payment History</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{selectedStudent.name} ({selectedStudent.digital_id})</p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {paymentHistory.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-slate-400 font-medium">No payment history found.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentHistory.map((tx) => (
                    <div key={tx.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg">
                            <CreditCard className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{tx.type}</p>
                            <p className="text-xs text-slate-500">{new Date(tx.date).toLocaleDateString()} • {new Date(tx.created_at).toLocaleTimeString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-emerald-600 text-lg">{tx.amount.toLocaleString()} ETB</p>
                          <p className="text-xs text-slate-500">by {tx.verified_by}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
