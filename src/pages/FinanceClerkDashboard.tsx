import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DollarSign, TrendingUp, Users, AlertCircle, Plus, X, Search, Receipt, CreditCard } from 'lucide-react';
import financeClerkService, { type FinanceClerkDashboard as FinanceClerkDashboardType, type StudentFeeInfo, type RecordPaymentRequest, type TransportStudentInfo, type TransportFeePolicy, type TransportDriverInfo } from '../services/financeService';
import payrollService, { type EmployeePayrollProfile } from '../services/payrollService';
import { Breadcrumbs } from '../components/Breadcrumbs';
import FinanceClerkRegistration from '../components/FinanceClerkRegistration';

type ManualTransaction = {
  id: string;
  category: 'expense' | 'income';
  type: string;
  amount: number;
  details: string;
  date: string;
  createdAt: string;
};

export const FinanceClerkDashboard = ({ initialTab }: { initialTab?: 'all' | 'overdue' | 'registrations' | 'staff-payments' | 'aid-requests' | 'transport' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isCollectionsView = location.pathname === '/finance-dashboard';
  const isOverviewView = location.pathname === '/dashboard/finance';

  const [dashboard, setDashboard] = useState<FinanceClerkDashboardType | null>(null);
  const [students, setStudents] = useState<StudentFeeInfo[]>([]);
  const [overdueStudents, setOverdueStudents] = useState<any[]>([]);
  const [staffProfiles, setStaffProfiles] = useState<EmployeePayrollProfile[]>([]);
  const [financeSettings, setFinanceSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'overdue' | 'registrations' | 'staff-payments' | 'aid-requests' | 'transport'>(
    (initialTab as any) || (location.pathname === '/finance-dashboard' ? 'all' : 'all')
  );
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showAidPickerModal, setShowAidPickerModal] = useState(false);
  const [showTransportModal, setShowTransportModal] = useState(false);
  const [showStopTransportModal, setShowStopTransportModal] = useState(false);
  const [showReductionModal, setShowReductionModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentFeeInfo | null>(null);
  const [reductionStudent, setReductionStudent] = useState<StudentFeeInfo | null>(null);
  const [transportStudent, setTransportStudent] = useState<TransportStudentInfo | null>(null);
  const [stopTransportStudent, setStopTransportStudent] = useState<TransportStudentInfo | null>(null);
  const [reductionNotes, setReductionNotes] = useState('');
  const [isRequestingReduction, setIsRequestingReduction] = useState(false);
  const [selectedAidStudentId, setSelectedAidStudentId] = useState('');
  const [aidPickerSearch, setAidPickerSearch] = useState('');
  const [transportSearchTerm, setTransportSearchTerm] = useState('');
  const [transportStatusFilter, setTransportStatusFilter] = useState<'assigned' | 'unassigned' | 'all'>('assigned');
  const [transportDrivers, setTransportDrivers] = useState<TransportDriverInfo[]>([]);
  const [transportPolicies, setTransportPolicies] = useState<TransportFeePolicy[]>([]);
  const [transportStudents, setTransportStudents] = useState<TransportStudentInfo[]>([]);
  const [transportPage, setTransportPage] = useState(1);
  const [transportPerPage, setTransportPerPage] = useState<number>(10);
  const [transportData, setTransportData] = useState({
    driverId: '',
    transportFee: 0,
  });
  const [stopDaysUsed, setStopDaysUsed] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [feeStatusFilter, setFeeStatusFilter] = useState<'standard' | 'reduced' | ''>('');
  const [selectedPaymentTypes, setSelectedPaymentTypes] = useState<string[]>(['Monthly Tuition']);
  const [outstandingData, setOutstandingData] = useState<any | null>(null);
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, number>>({});

  // Student List Pagination
  const [studentPage, setStudentPage] = useState(1);
  const [studentsPerPage, setStudentsPerPage] = useState<number>(10);

  // Staff Payment Filters & Pagination
  const [staffSearchTerm, setStaffSearchTerm] = useState('');
  const [minSalaryFilter, setMinSalaryFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'paid' | 'not_paid'>('not_paid');
  const [staffPage, setStaffPage] = useState(1);
  const [staffPerPage, setStaffPerPage] = useState<number>(10);

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
  const [transactionData, setTransactionData] = useState({
    category: 'expense' as 'expense' | 'income',
    type: 'Materials Bought',
    amount: 0,
    details: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [manualTransactions, setManualTransactions] = useState<ManualTransaction[]>(() => {
    try {
      const saved = localStorage.getItem('manual_finance_transactions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Global items-per-page options
  const perPageOptions = [10, 25, 50];

  useEffect(() => {
    fetchData();
  }, []);

  // respond to `?tab=` query param so sidebar links can open a specific tab
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    const nextTab = tab && ['all', 'overdue', 'registrations', 'staff-payments', 'aid-requests', 'transport'].includes(tab)
      ? (tab as any)
      : 'all';

    setActiveTab(nextTab);
    setStudentPage(1);
    setTransportPage(1);
  }, [location.pathname, location.search]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dashboardData, studentsData, overdueData, staffData] = await Promise.all([
        financeClerkService.getDashboard(),
        financeClerkService.getStudentsFees({ search: searchTerm, feeStatus: feeStatusFilter || undefined }),
        financeClerkService.getOverduePayments(),
        payrollService.getAllProfiles().catch(() => [])
      ]);
      const [transportStudentsData, transportDriversData, transportPoliciesData] = await Promise.all([
        financeClerkService.getTransportStudents({ search: transportSearchTerm, status: transportStatusFilter }),
        financeClerkService.getTransportDrivers(),
        financeClerkService.getTransportPolicies(),
      ]);
      setDashboard(dashboardData);
      setStudents(studentsData);
      setOverdueStudents(overdueData);
      setStaffProfiles(staffData);
      setTransportStudents(transportStudentsData);
      setTransportDrivers(transportDriversData);
      setTransportPolicies(transportPoliciesData);
      setStudentPage(1);
      setTransportPage(1);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Build items array from selectedPaymentTypes using outstandingData if present
      const items: { feeType: string; amount: number }[] = [];
      if (outstandingData) {
        for (const label of selectedPaymentTypes) {
          const key = label === 'Monthly Tuition' ? 'monthly' : label === 'Bus Fee' ? 'bus' : label === 'Penalty Fee' ? 'penalty' : label === 'Registration Fee' ? 'registration' : label;
          const fee = (outstandingData.fees || []).find((f: any) => f.feeType === key);
          const requested = Number(paymentAmounts[key] ?? 0);
          const allowed = Math.max(0, Math.min(requested, Number(fee?.remaining || 0)));
          if (fee && allowed > 0) items.push({ feeType: key, amount: allowed });
        }
      } else {
        // Legacy: use paymentData.amount and type
        const types = Array.isArray(paymentData.type) ? paymentData.type : [paymentData.type as any];
        const amountPer = Number(paymentData.amount || 0) / Math.max(1, types.length);
        for (const t of types) {
          const key = typeof t === 'string' ? (t === 'Monthly Tuition' ? 'monthly' : t === 'Bus Fee' ? 'bus' : t === 'Penalty Fee' ? 'penalty' : t === 'Registration Fee' ? 'registration' : t) : String(t);
          items.push({ feeType: key, amount: amountPer });
        }
      }

      await financeClerkService.recordPayment({ studentId: paymentData.studentId, items, month: paymentData.month, date: paymentData.date, reference: (paymentData as any).reference });
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

  const getCalculatedPaymentAmount = (types: string[], student: StudentFeeInfo | null) => {
    if (!student) return 0;

    let total = 0;
    if (types.includes('Monthly Tuition')) total += Number(student.monthly_fee || 0);
    if (types.includes('Bus Fee')) total += Number(student.bus_fee || 0);
    if (types.includes('Penalty Fee')) total += Number(student.penalty_fee || 0);
    if (types.includes('Registration Fee')) total += 2500;
    if (types.includes('Exam Fee')) total += 350;
    if (types.includes('Activity Fee')) total += 500;

    return total;
  };

  const openPaymentModal = (student?: StudentFeeInfo) => {
    setOutstandingData(null);
    setPaymentAmounts({});
    if (student) {
      setSelectedStudent(student);
      // fetch outstanding for current month
      financeClerkService.getStudentOutstanding(student.id).then((d) => {
            setOutstandingData(d);
            // select all fee items with remaining > 0 by default
            const defaults = (d.fees || []).filter((f: any) => Number(f.remaining || 0) > 0).map((f: any) => f.feeType);
            const amounts: Record<string, number> = {};
            (d.fees || []).forEach((f: any) => {
              amounts[f.feeType] = Number(f.remaining || 0);
            });
            setPaymentAmounts(amounts);
            setSelectedPaymentTypes(defaults.map((k: string) => {
          if (k === 'monthly') return 'Monthly Tuition';
          if (k === 'bus') return 'Bus Fee';
          if (k === 'penalty') return 'Penalty Fee';
          if (k === 'registration') return 'Registration Fee';
          return k;
        }));
            const totalDue = defaults.reduce((acc: number, key: string) => acc + Number(amounts[key] || 0), 0);
        setPaymentData({ studentId: student.id, amount: totalDue, type: defaults, date: new Date().toISOString().split('T')[0], month: d.month });
      }).catch(() => {
        setSelectedStudent(student);
        setSelectedPaymentTypes(['Monthly Tuition']);
        setPaymentData({ studentId: student.id, amount: 0, type: ['Monthly Tuition'], date: new Date().toISOString().split('T')[0], month: new Date().toISOString().slice(0,7) });
      });
    } else {
      setSelectedPaymentTypes(['Monthly Tuition']);
      setPaymentData({ studentId: '', amount: 0, type: ['Monthly Tuition'], date: new Date().toISOString().split('T')[0], month: new Date().toISOString().slice(0,7) });
    }
    setShowPaymentModal(true);
  };

  const openReductionModal = (student: StudentFeeInfo) => {
    setReductionStudent(student);
    setReductionNotes(student.fee_notes || 'Requesting fee reduction due to financial hardship');
    setShowReductionModal(true);
  };

  const openTransportModal = (student: TransportStudentInfo) => {
    const policy = transportPolicies.find((item) => item.grade_level === student.grade)
      || transportPolicies.find((item) => !item.grade_level)
      || transportPolicies[0]
      || null;
    const driverId = student.driver_id || transportDrivers[0]?.id || '';
    setTransportStudent(student);
    setTransportData({
      driverId,
      transportFee: policy ? Number(policy.bus_fee || 0) : Number(student.bus_fee || 0),
    });
    setShowTransportModal(true);
  };

  const openStopTransportModal = (student: TransportStudentInfo) => {
    setStopTransportStudent(student);
    setStopDaysUsed(0);
    setShowStopTransportModal(true);
  };

  const handleRequestReduction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reductionStudent) return;

    try {
      setIsRequestingReduction(true);
      await financeClerkService.updateFeeStatus(reductionStudent.id, {
        feeStatus: 'reduced',
        feeNotes: reductionNotes.trim() || 'Requesting fee reduction due to financial hardship'
      });
      setSuccess('Fee reduction request submitted to auditor for review');
      setShowReductionModal(false);
      setReductionStudent(null);
      setReductionNotes('');
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to submit fee reduction request');
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsRequestingReduction(false);
    }
  };

  const handleAssignTransport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transportStudent || !transportData.driverId) return;

    try {
      await financeClerkService.assignTransport({
        studentId: transportStudent.id,
        driverId: transportData.driverId,
        transportFee: Number(transportData.transportFee),
      });
      setSuccess('Transport assignment saved successfully');
      setShowTransportModal(false);
      setTransportStudent(null);
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save transport assignment');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleStopTransport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stopTransportStudent) return;

    try {
      const result = await financeClerkService.stopTransport({
        studentId: stopTransportStudent.id,
        daysUsed: Number(stopDaysUsed),
      });
      setSuccess(`Transport stopped. Settlement recorded: ${Number(result.amountDue || 0).toLocaleString()} ETB`);
      setShowStopTransportModal(false);
      setStopTransportStudent(null);
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to stop transport');
      setTimeout(() => setError(null), 5000);
    }
  };

  const resetPaymentForm = () => {
    setPaymentData({
      studentId: '',
      amount: 0,
      type: ['Monthly Tuition'],
      date: new Date().toISOString().split('T')[0],
    });
    setPaymentAmounts({});
    setSelectedStudent(null);
    setSelectedPaymentTypes(['Monthly Tuition']);
  };

  const resetTransactionForm = () => {
    setTransactionData({
      category: 'expense',
      type: 'Materials Bought',
      amount: 0,
      details: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const handleRecordTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const newTransaction: ManualTransaction = {
      id: crypto.randomUUID(),
      category: transactionData.category,
      type: transactionData.type,
      amount: transactionData.amount,
      details: transactionData.details.trim(),
      date: transactionData.date,
      createdAt: new Date().toISOString(),
    };

    const updated = [newTransaction, ...manualTransactions];
    setManualTransactions(updated);
    localStorage.setItem('manual_finance_transactions', JSON.stringify(updated));
    setSuccess('Transaction recorded successfully!');
    setShowTransactionModal(false);
    resetTransactionForm();
    setTimeout(() => setSuccess(null), 3000);
  };

  const openAidRequestPicker = () => {
    // Open picker with empty selection and reset search so user can search by name or ID
    setSelectedAidStudentId('');
    setAidPickerSearch('');
    setShowAidPickerModal(true);
  };

  const handleStartAidRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find(s => s.id === selectedAidStudentId);
    if (!student) {
      setError('Please select a student to create a request aid ticket.');
      setTimeout(() => setError(null), 5000);
      return;
    }
    setShowAidPickerModal(false);
    openReductionModal(student);
  };

  const handleCheckboxChange = (type: string) => {
    let updated: string[];
    if (selectedPaymentTypes.includes(type)) updated = selectedPaymentTypes.filter(t => t !== type);
    else updated = [...selectedPaymentTypes, type];
    setSelectedPaymentTypes(updated);

    // Auto-calculate sum based on selected types and outstanding data when available
    let total = 0;
    if (outstandingData) {
      for (const label of updated) {
        const key = label === 'Monthly Tuition' ? 'monthly' : label === 'Bus Fee' ? 'bus' : label === 'Penalty Fee' ? 'penalty' : label === 'Registration Fee' ? 'registration' : label;
        total += Number(paymentAmounts[key] || 0);
      }
    } else {
      total = getCalculatedPaymentAmount(updated, selectedStudent);
    }

    setPaymentData({
      ...paymentData,
      type: updated,
      amount: total
    });
  };

  const confirmStaffPayment = (userId: string) => {
    const updated = {
      ...confirmedStaffPayments,
      [userId]: { date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString() }
    };
    setConfirmedStaffPayments(updated);
    localStorage.setItem('confirmed_staff_payments', JSON.stringify(updated));
  };

  // openPaymentHistory removed per updated UX (history not needed)

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.digital_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOverdueStudents = overdueStudents.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.digital_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedStudents = activeTab === 'all' ? filteredStudents : filteredOverdueStudents;
  const paginatedStudents = displayedStudents.slice((studentPage - 1) * studentsPerPage, studentPage * studentsPerPage);
  const totalStudentPages = Math.max(1, Math.ceil(displayedStudents.length / studentsPerPage));
  const aidRequestedStudents = students.filter(s => ['pending', 'approved', 'rejected'].includes(s.fee_approval_status));
  const aidPaginated = aidRequestedStudents.slice((studentPage - 1) * studentsPerPage, studentPage * studentsPerPage);
  const aidTotalPages = Math.max(1, Math.ceil(aidRequestedStudents.length / studentsPerPage));
  const filteredTransportStudents = transportStudents.filter(student => {
    const searchValue = transportSearchTerm.toLowerCase();
    if (!searchValue) return true;
    return (
      student.name.toLowerCase().includes(searchValue) ||
      student.digital_id.toLowerCase().includes(searchValue) ||
      (student.route_name || '').toLowerCase().includes(searchValue) ||
      (student.driver_name || '').toLowerCase().includes(searchValue)
    );
  });
  const paginatedTransportStudents = filteredTransportStudents.slice((transportPage - 1) * transportPerPage, transportPage * transportPerPage);
  const totalTransportPages = Math.max(1, Math.ceil(filteredTransportStudents.length / transportPerPage));
  const requestedAidCount = students.filter(s => ['pending', 'approved', 'rejected'].includes(s.fee_approval_status)).length;
  const pendingCount = students.filter(s => s.fee_approval_status === 'pending').length;
  const eligibleAidStudents = students.filter(s => s.fee_approval_status === 'none');
  const filteredEligibleStudents = eligibleAidStudents.filter(student => {
    const q = aidPickerSearch.trim().toLowerCase();
    // Only show results if user has typed something in the search box
    if (!q) return false;
    return (
      student.name.toLowerCase().includes(q) ||
      (student.digital_id || '').toLowerCase().includes(q) ||
      (student.id || '').toLowerCase().includes(q)
    );
  });
  const assignedTransportCount = transportStudents.filter(student => student.route_id).length;
  const selectedTransportPolicy = transportStudent
    ? transportPolicies.find((item) => item.grade_level === transportStudent.grade) || transportPolicies.find((item) => !item.grade_level) || null
    : null;
  const headerTitleMap = {
    all: 'Collections',
    overdue: 'Overdue Payments',
    registrations: 'Registrations',
    'staff-payments': 'Staff Payments',
    'aid-requests': 'Request Aid',
    transport: 'Transport Management',
  } as const;
  const headerSubtitleMap = {
    all: 'Collect student fees and manage payment records',
    overdue: 'Review and collect overdue student balances',
    registrations: 'Finalize fee-related registration approvals',
    'staff-payments': 'Disburse salary and confirm payroll payouts',
    'aid-requests': 'Create and track aid requests sent to the auditor',
    transport: 'Assign students to drivers and manage transport fees',
  } as const;

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

  if (isOverviewView) {
    const overviewCards = [
      {
        title: 'Collections',
        value: dashboard?.todayCollection?.toLocaleString() || '0',
        subtitle: 'Today\'s collection',
        color: 'from-emerald-600 to-emerald-500',
        action: () => navigate('/finance-dashboard')
      },
      {
        title: 'Overdue',
        value: overdueStudents.length.toString(),
        subtitle: 'Students needing follow-up',
        color: 'from-amber-600 to-amber-500',
        action: () => navigate('/finance-dashboard?tab=overdue')
      },
      {
        title: 'Request Aid',
        value: requestedAidCount.toString(),
        subtitle: 'Aid requests in progress',
        color: 'from-purple-600 to-purple-500',
        action: () => navigate('/finance-dashboard?tab=aid-requests')
      },
      {
        title: 'Registrations',
        value: dashboard?.pendingApprovals?.toString() || '0',
        subtitle: 'Fee reduction approvals',
        color: 'from-blue-600 to-blue-500',
        action: () => navigate('/finance-dashboard?tab=registrations')
      },
      {
        title: 'Staff Payments',
        value: staffProfiles.length.toString(),
        subtitle: 'Employees in payroll',
        color: 'from-slate-700 to-slate-600',
        action: () => navigate('/finance-dashboard?tab=staff-payments')
      },
      {
        title: 'Transport',
        value: assignedTransportCount.toString(),
        subtitle: 'Students assigned to drivers',
        color: 'from-amber-700 to-orange-600',
        action: () => navigate('/finance-dashboard?tab=transport')
      },
    ];

    return (
      <div className="space-y-6">
        <Breadcrumbs />
        <div className="flex justify-between items-end gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Finance Overview</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mt-1">Use this screen to jump into a specific finance tab for details.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {overviewCards.map((card) => (
            <button
              key={card.title}
              onClick={card.action}
              className={`text-left p-6 rounded-[2rem] shadow-xl bg-gradient-to-br ${card.color} text-white hover:-translate-y-1 transition-all`}
            >
              <p className="text-white/80 text-xs font-bold uppercase tracking-widest mb-2">{card.title}</p>
              <p className="text-4xl font-black">{card.value}</p>
              <p className="text-white/80 text-sm font-medium mt-2">{card.subtitle}</p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800 p-6">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-3">What this page shows</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-6">
              This is a summary-only view. For details like overdue students, aid requests, registrations, or staff payroll, open the specific tab from the quick links.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            {isCollectionsView ? headerTitleMap[activeTab] : 'Finance Overview'}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mt-1">
            {isCollectionsView ? headerSubtitleMap[activeTab] : 'Manage student fees and payment collection'}
          </p>
        </div>
        {activeTab === 'all' && (
          <button
            onClick={() => {
              resetTransactionForm();
              setShowTransactionModal(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all font-bold text-sm"
          >
            <Plus className="w-5 h-5" />
            Record Transaction
          </button>
        )}
        {activeTab === 'aid-requests' && (
          <button
            onClick={openAidRequestPicker}
            disabled={eligibleAidStudents.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-2xl hover:bg-purple-700 shadow-lg shadow-purple-500/20 transition-all font-bold text-sm disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
            Add Request Aid
          </button>
        )}
      </div>

      {isCollectionsView && (activeTab === 'all' || activeTab === 'registrations' || activeTab === 'staff-payments') && (
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
      )}

      {error && (
        <div className="fixed top-6 right-6 z-50 bg-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl text-sm font-bold animate-in slide-in-from-right-8 max-w-md">
          ⚠️ {error}
        </div>
      )}

      {activeTab === 'aid-requests' && (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">Request Aid</h3>
              <p className="text-slate-500 text-xs mt-1">Submit fee reduction / aid requests for students</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-4 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-full text-xs font-black uppercase tracking-wider">
                {pendingCount} Pending
              </span>
              <button
                onClick={openAidRequestPicker}
                disabled={eligibleAidStudents.length === 0}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                Add Request Aid
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Student</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Grade</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-black text-slate-500 uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {aidPaginated.map((student) => (
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
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full font-bold inline-block w-fit ${student.fee_approval_status === 'approved' ? 'bg-emerald-100 text-emerald-800' : student.fee_approval_status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>
                        {student.fee_approval_status === 'approved' ? 'Approved' : student.fee_approval_status === 'pending' ? 'Pending' : 'Not Requested'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {student.fee_approval_status === 'approved' ? (
                        <span className="px-4 py-2 bg-slate-200 text-slate-600 rounded-xl text-xs font-bold">Reduction Approved</span>
                      ) : student.fee_approval_status === 'pending' ? (
                        <span className="px-4 py-2 bg-amber-100 text-amber-800 rounded-xl text-xs font-bold">Review Pending</span>
                      ) : (
                        <button
                          onClick={() => openReductionModal(student)}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all"
                        >
                          Request Aid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {aidRequestedStudents.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400 font-medium">No aid requests found.</p>
            </div>
          )}

          {aidRequestedStudents.length > 0 && aidTotalPages > 1 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
              <button
                onClick={() => setStudentPage((prev) => Math.max(1, prev - 1))}
                disabled={studentPage === 1}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-slate-500 font-medium">Page {studentPage} of {aidTotalPages}</span>
              <button
                onClick={() => setStudentPage((prev) => Math.min(aidTotalPages, prev + 1))}
                disabled={studentPage === aidTotalPages}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'transport' && (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">Transport Management</h3>
              <p className="text-slate-500 text-xs mt-1">Assign students to drivers, change routes, or stop transport.</p>
            </div>
            <span className="px-4 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-full text-xs font-black uppercase tracking-wider">
              {assignedTransportCount} Assigned
            </span>
          </div>

          <div className="p-6 border-b border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search student, digital ID, route, or driver..."
                value={transportSearchTerm}
                onChange={(e) => {
                  setTransportSearchTerm(e.target.value);
                  setTransportPage(1);
                }}
                className="w-full pl-12 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <select
              value={transportStatusFilter}
              onChange={(e) => {
                setTransportStatusFilter(e.target.value as 'assigned' | 'unassigned' | 'all');
                setTransportPage(1);
              }}
              className="px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-amber-500 outline-none"
            >
              <option value="assigned">Assigned only</option>
              <option value="unassigned">Unassigned only</option>
              <option value="all">All</option>
            </select>
            <button
              onClick={fetchData}
              className="px-6 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 font-bold text-sm transition-all"
            >
              Apply Filters
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Student</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Driver</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Route</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Transport Fee</th>
                  <th className="px-6 py-4 text-right text-xs font-black text-slate-500 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedTransportStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{student.name}</p>
                        <p className="text-xs text-slate-500">{student.digital_id} • Grade {student.grade}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs font-bold">
                        {student.driver_name || 'No driver'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-bold">
                        {student.route_name || 'No route'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-emerald-600 dark:text-emerald-400">
                      {Number(student.bus_fee || 0).toLocaleString()} ETB
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                          onClick={() => openTransportModal(student)}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all"
                        >
                          {student.route_id ? 'Change Driver' : 'Assign Transport'}
                        </button>
                        {student.route_id && (
                          <button
                            onClick={() => { if (!overdueStudents.find(s => s.id === student.id)) openStopTransportModal(student); }}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${overdueStudents.find(s => s.id === student.id) ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700 text-white'}`}
                            disabled={!!overdueStudents.find(s => s.id === student.id)}
                            title={overdueStudents.find(s => s.id === student.id) ? 'Student has overdue payments — settle before stopping transport' : 'Stop transport and record settlement'}
                          >
                            Stop Transport
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredTransportStudents.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400 font-medium">No transport assignments found.</p>
            </div>
          )}

          {filteredTransportStudents.length > 0 && totalTransportPages > 1 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
              <button
                onClick={() => setTransportPage((prev) => Math.max(1, prev - 1))}
                disabled={transportPage === 1}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-slate-500 font-medium">Page {transportPage} of {totalTransportPages}</span>
              <button
                onClick={() => setTransportPage((prev) => Math.min(totalTransportPages, prev + 1))}
                disabled={transportPage === totalTransportPages}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {success && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl text-sm font-bold animate-in slide-in-from-right-8 max-w-md">
          ✅ {success}
        </div>
      )}

      {/* Deadline Alerts */}
      {activeTab !== 'transport' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`p-4 rounded-2xl border flex items-center justify-between ${daysToStudentDeadline < 0
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

          <div className={`p-4 rounded-2xl border flex items-center justify-between ${daysToStaffDeadline < 0
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
      )}

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

          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
            <div className="w-40">
              <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">Per page</label>
              <select value={staffPerPage} onChange={(e) => { setStaffPerPage(Number(e.target.value)); setStaffPage(1); }} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                {perPageOptions.map(opt => (
                  <option key={opt} value={opt}>{opt} per page</option>
                ))}
              </select>
            </div>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or ID..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setStudentPage(1);
                  }}
                  className="w-full pl-12 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <select
                value={feeStatusFilter}
                onChange={(e) => {
                  setFeeStatusFilter(e.target.value as any);
                  setStudentPage(1);
                }}
                className="px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">All Fee Status</option>
                <option value="standard">Standard</option>
                <option value="reduced">Reduced</option>
              </select>
              <div className="relative">
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">Per page</label>
                <select
                  value={studentsPerPage}
                  onChange={(e) => { setStudentsPerPage(Number(e.target.value)); setStudentPage(1); }}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {perPageOptions.map(opt => (
                    <option key={opt} value={opt}>{opt} per page</option>
                  ))}
                </select>
              </div>
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
                            {student.fee_approval_status === 'approved' && (
                              <span className="px-2 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full text-xs font-bold inline-block w-fit">
                                Approved
                              </span>
                            )}
                            {student.fee_approval_status === 'rejected' && (
                              <span className="px-2 py-1 bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 rounded-full text-xs font-bold inline-block w-fit">
                                Rejected
                              </span>
                            )}
                            {student.fee_notes && (
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 italic max-w-xs">
                                {student.fee_notes}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <button
                              onClick={() => openPaymentModal(student)}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all"
                            >
                              Record Payment
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

      {/* Manual Transaction Modal */}
      {showTransactionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-md border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Record Transaction</h2>
              <button onClick={() => setShowTransactionModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleRecordTransaction} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Category *</label>
                <select
                  value={transactionData.category}
                  onChange={(e) => setTransactionData({ ...transactionData, category: e.target.value as 'expense' | 'income' })}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Type *</label>
                <input
                  type="text"
                  required
                  value={transactionData.type}
                  onChange={(e) => setTransactionData({ ...transactionData, type: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Example: Materials Bought, Materials Sold"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Amount (ETB) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={transactionData.amount}
                  onChange={(e) => setTransactionData({ ...transactionData, amount: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Details</label>
                <textarea
                  value={transactionData.details}
                  onChange={(e) => setTransactionData({ ...transactionData, details: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Notes, receipt reference, vendor, or context"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Transaction Date *</label>
                <input
                  type="date"
                  required
                  value={transactionData.date}
                  onChange={(e) => setTransactionData({ ...transactionData, date: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTransactionModal(false)}
                  className="flex-1 px-6 py-3 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition-all shadow-lg shadow-blue-500/20"
                >
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Aid Request Picker Modal */}
      {showAidPickerModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-md border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Add Request Aid</h2>
              <button onClick={() => setShowAidPickerModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleStartAidRequest} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Student *</label>
                <div className="relative">
                  <div className="absolute left-3 top-3 text-slate-400"><Search className="w-4 h-4" /></div>
                  <input
                    type="text"
                    placeholder="Search by name or student ID"
                    value={aidPickerSearch}
                    onChange={(e) => setAidPickerSearch(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500 outline-none ${aidPickerSearch.trim().length > 0 ? 'rounded-t-xl' : 'rounded-xl'}`}
                  />
                  {aidPickerSearch.trim().length > 0 && (
                    <select
                      required
                      value={selectedAidStudentId}
                      onChange={(e) => setSelectedAidStudentId(e.target.value)}
                      className="w-full px-4 py-3 border-t-0 border border-slate-200 dark:border-slate-700 rounded-b-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500 outline-none"
                      size={6}
                    >
                      <option value="" disabled>Select a student</option>
                      {filteredEligibleStudents.map((student) => (
                        <option key={student.id} value={student.id}>{student.name} - {student.digital_id}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
              {eligibleAidStudents.length === 0 && (
                <p className="text-sm text-slate-500">All students already have an aid request status.</p>
              )}
              {eligibleAidStudents.length > 0 && filteredEligibleStudents.length === 0 && (
                <p className="text-sm text-slate-500">No matching students. Try a different name or ID.</p>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAidPickerModal(false)}
                  className="flex-1 px-6 py-3 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={eligibleAidStudents.length === 0 || !selectedAidStudentId}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-bold transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        </div>
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
                <div className="grid grid-cols-1 gap-2">
                  {outstandingData ? (
                    outstandingData.fees.map((f: any) => {
                      const label = f.feeType === 'monthly' ? 'Monthly Tuition' : f.feeType === 'bus' ? 'Bus Fee' : f.feeType === 'penalty' ? 'Penalty Fee' : f.feeType === 'registration' ? 'Registration Fee' : f.feeType;
                      const checked = selectedPaymentTypes.includes(label);
                      const disabled = f.remaining <= 0;
                      return (
                        <label key={f.feeType} className={`flex items-center justify-between gap-3 p-3 rounded-xl border-2 ${checked ? 'bg-white border-blue-600 dark:bg-slate-900 dark:border-blue-400' : 'bg-slate-100 border-slate-400 dark:bg-slate-800 dark:border-slate-600'}`}>
                          <div className="flex items-center gap-3 min-w-0">
                            <input type="checkbox" checked={checked} disabled={disabled} onChange={() => handleCheckboxChange(label)} className="w-4 h-4 rounded text-blue-600 border-slate-500 focus:ring-blue-500 cursor-pointer" />
                            <div className="min-w-0">
                              <div className="text-xs font-black text-slate-900 dark:text-slate-100">{label}{disabled ? ' (Paid)' : ''}</div>
                              <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Due: {Number(f.due).toLocaleString()} ETB • Paid: {Number(f.paid).toLocaleString()} ETB</div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div className="text-xs font-black text-slate-900 dark:text-slate-100">Remaining {Number(f.remaining).toLocaleString()} ETB</div>
                            <input
                              type="number"
                              min="0"
                              max={Number(f.remaining || 0)}
                              step="0.01"
                              value={paymentAmounts[f.feeType] ?? Number(f.remaining || 0)}
                              disabled={disabled || !checked}
                              onChange={(e) => {
                                const value = Number(e.target.value || 0);
                                const clamped = Math.max(0, Math.min(value, Number(f.remaining || 0)));
                                const next: Record<string, number> = { ...paymentAmounts, [f.feeType]: clamped };
                                setPaymentAmounts(next);
                                let total = 0;
                                for (const selected of selectedPaymentTypes) {
                                  const selectedKey = selected === 'Monthly Tuition' ? 'monthly' : selected === 'Bus Fee' ? 'bus' : selected === 'Penalty Fee' ? 'penalty' : selected === 'Registration Fee' ? 'registration' : selected;
                                  total += Number(next[selectedKey] || 0);
                                }
                                setPaymentData((prev) => ({ ...prev, amount: total }));
                              }}
                              className="w-28 px-2 py-1 rounded-lg border-2 border-slate-500 bg-white text-slate-900 dark:bg-slate-700 dark:text-white dark:border-slate-400 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
                            />
                          </div>
                        </label>
                      );
                    })
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {[{ key: 'Monthly Tuition', label: 'Monthly Tuition' },{ key: 'Registration Fee', label: 'Registration Fee' },{ key: 'Bus Fee', label: 'Bus Fee' },{ key: 'Penalty Fee', label: 'Penalty Fee' }].map((item) => {
                        const checked = selectedPaymentTypes.includes(item.key);
                        return (
                          <label key={item.key} className={`flex items-center gap-3 p-3 rounded-xl border-2 ${checked ? 'bg-white border-blue-600 dark:bg-slate-900 dark:border-blue-400' : 'bg-slate-100 border-slate-400 dark:bg-slate-800 dark:border-slate-600'}`}>
                            <input type="checkbox" checked={checked} onChange={() => handleCheckboxChange(item.key)} className="w-4 h-4 rounded text-blue-600 border-slate-500 focus:ring-blue-500 cursor-pointer" />
                            <span className="text-xs font-black text-slate-900 dark:text-slate-100">{item.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
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
                  readOnly
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none cursor-not-allowed"
                  placeholder="Auto-calculated"
                />
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Amount is auto-calculated from the selected fee types and configured student fees.</p>
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

      {/* Transport Assignment Modal */}
      {showTransportModal && transportStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-md border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{transportStudent.route_id ? 'Change Driver' : 'Assign Transport'}</h2>
              <button onClick={() => setShowTransportModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleAssignTransport} className="p-6 space-y-4">
              <div className="space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-400">Student: <span className="font-bold text-slate-900 dark:text-white">{transportStudent.name}</span></p>
                <p className="text-sm text-slate-600 dark:text-slate-400">ID: <span className="font-bold text-slate-900 dark:text-white">{transportStudent.digital_id}</span></p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Current Driver: <span className="font-bold text-slate-900 dark:text-white">{transportStudent.driver_name || 'None'}</span></p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Configured Bus Fee: <span className="font-black text-emerald-600 dark:text-emerald-400">{Number(selectedTransportPolicy?.bus_fee ?? transportStudent.bus_fee ?? 0).toLocaleString()} ETB</span></p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Driver *</label>
                <select
                  required
                  value={transportData.driverId}
                  onChange={(e) => {
                    const selectedDriverId = e.target.value;
                    const selectedPolicy = transportPolicies.find((item) => item.grade_level === transportStudent.grade)
                      || transportPolicies.find((item) => !item.grade_level)
                      || transportPolicies[0]
                      || null;
                    setTransportData({
                      driverId: selectedDriverId,
                      transportFee: selectedPolicy ? Number(selectedPolicy.bus_fee || 0) : Number(transportStudent.bus_fee || 0),
                    });
                  }}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="" disabled>Select driver</option>
                  {transportDrivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name} ({driver.digital_id})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Transport Fee (ETB) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={transportData.transportFee}
                  onChange={(e) => setTransportData({ ...transportData, transportFee: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTransportModal(false)}
                  className="flex-1 px-6 py-3 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 font-bold transition-all shadow-lg shadow-amber-500/20"
                >
                  Save Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stop Transport Modal */}
      {showStopTransportModal && stopTransportStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-md border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Stop Transport</h2>
              <button onClick={() => setShowStopTransportModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleStopTransport} className="p-6 space-y-4">
              <div className="space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-400">Student: <span className="font-bold text-slate-900 dark:text-white">{stopTransportStudent.name}</span></p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Current Driver: <span className="font-bold text-slate-900 dark:text-white">{stopTransportStudent.driver_name || 'None'}</span></p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Current Transport Fee: <span className="font-bold text-slate-900 dark:text-white">{Number(stopTransportStudent.bus_fee || 0).toLocaleString()} ETB</span></p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Days Used This Month *</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="30"
                  value={stopDaysUsed}
                  onChange={(e) => setStopDaysUsed(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300">
                <p className="text-xs font-black uppercase tracking-wider">Settlement Preview</p>
                <p className="text-sm font-medium mt-1">
                  Amount due: {Number((Math.max(0, (30 - stopDaysUsed)) * Number(stopTransportStudent.bus_fee || 0)) / 30).toLocaleString()} ETB
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowStopTransportModal(false)}
                  className="flex-1 px-6 py-3 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-rose-600 text-white rounded-xl hover:bg-rose-700 font-bold transition-all shadow-lg shadow-rose-500/20"
                  disabled={!!(stopTransportStudent && overdueStudents.find(s => s.id === stopTransportStudent.id))}
                >
                  Stop & Record Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fee Reduction Request Modal */}
      {showReductionModal && reductionStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-md border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Request Fee Reduction</h2>
              <button onClick={() => setShowReductionModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleRequestReduction} className="p-6 space-y-4">
              <div className="space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-400">Student: <span className="font-bold text-slate-900 dark:text-white">{reductionStudent.name}</span></p>
                <p className="text-sm text-slate-600 dark:text-slate-400">ID: <span className="font-bold text-slate-900 dark:text-white">{reductionStudent.digital_id}</span></p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Current Fee Status: <span className="font-semibold">{reductionStudent.fee_status === 'reduced' ? 'Reduced' : 'Standard'}</span></p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Reduction Notes</label>
                <textarea
                  value={reductionNotes}
                  onChange={(e) => setReductionNotes(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="Add a note for the auditor explaining the financial aid request"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowReductionModal(false)}
                  className="flex-1 px-6 py-3 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRequestingReduction}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-bold transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50"
                >
                  {isRequestingReduction ? 'Submitting…' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  );
};
