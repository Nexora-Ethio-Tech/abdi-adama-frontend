import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Users, AlertCircle, Plus, X, Search, Receipt, CreditCard, FileText } from 'lucide-react';
import financeClerkService, { type FinanceClerkDashboard as FinanceClerkDashboardType, type StudentFeeInfo, type Transaction, type RecordPaymentRequest } from '../services/financeService';
import { Breadcrumbs } from '../components/Breadcrumbs';

export const FinanceClerkDashboard = () => {
  const [dashboard, setDashboard] = useState<FinanceClerkDashboardType | null>(null);
  const [students, setStudents] = useState<StudentFeeInfo[]>([]);
  const [overdueStudents, setOverdueStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'overdue'>('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentFeeInfo | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [feeStatusFilter, setFeeStatusFilter] = useState<'standard' | 'reduced' | ''>('');
  const [paymentData, setPaymentData] = useState<RecordPaymentRequest>({
    studentId: '',
    amount: 0,
    type: 'Monthly Tuition',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dashboardData, studentsData, overdueData] = await Promise.all([
        financeClerkService.getDashboard(),
        financeClerkService.getStudentsFees({ search: searchTerm, feeStatus: feeStatusFilter || undefined }),
        financeClerkService.getOverduePayments()
      ]);
      setDashboard(dashboardData);
      setStudents(studentsData);
      setOverdueStudents(overdueData);
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
      const totalDue = student.monthly_fee + student.bus_fee + student.penalty_fee;
      setPaymentData({
        studentId: student.id,
        amount: totalDue,
        type: 'Monthly Tuition',
        date: new Date().toISOString().split('T')[0],
      });
    }
    setShowPaymentModal(true);
  };

  const resetPaymentForm = () => {
    setPaymentData({
      studentId: '',
      amount: 0,
      type: 'Monthly Tuition',
      date: new Date().toISOString().split('T')[0],
    });
    setSelectedStudent(null);
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

  if (loading && !dashboard) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Finance Clerk Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mt-1">Manage student fees and payment collection</p>
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

      {/* Dashboard Stats */}
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

      {/* Recent Transactions */}
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

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-6 py-3 font-bold text-sm transition-all ${
            activeTab === 'all'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          All Students ({students.length})
        </button>
        <button
          onClick={() => setActiveTab('overdue')}
          className={`px-6 py-3 font-bold text-sm transition-all ${
            activeTab === 'overdue'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Overdue ({overdueStudents.length})
        </button>
      </div>

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
                fetchData();
              }}
              className="w-full pl-12 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <select
            value={feeStatusFilter}
            onChange={(e) => {
              setFeeStatusFilter(e.target.value as any);
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
              {(activeTab === 'all' ? filteredStudents : overdueStudents).map((student) => {
                const _totalDue = student.monthly_fee + student.bus_fee + student.penalty_fee;
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
                      {student.monthly_fee.toLocaleString()} ETB
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">
                      {student.bus_fee.toLocaleString()} ETB
                    </td>
                    <td className="px-6 py-4">
                      {student.penalty_fee > 0 ? (
                        <span className="text-sm font-bold text-red-600">{student.penalty_fee.toLocaleString()} ETB</span>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`px-2 py-1 text-xs rounded-full font-bold inline-block w-fit ${
                          student.fee_status === 'reduced' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
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
      </div>

      {(activeTab === 'all' ? filteredStudents : overdueStudents).length === 0 && !loading && (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
          <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">No students found.</p>
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
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Payment Type *</label>
                <select
                  required
                  value={paymentData.type}
                  onChange={(e) => setPaymentData({ ...paymentData, type: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="Monthly Tuition">Monthly Tuition</option>
                  <option value="Registration Fee">Registration Fee</option>
                  <option value="Bus Fee">Bus Fee</option>
                  <option value="Penalty Fee">Penalty Fee</option>
                  <option value="Exam Fee">Exam Fee</option>
                  <option value="Activity Fee">Activity Fee</option>
                </select>
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
