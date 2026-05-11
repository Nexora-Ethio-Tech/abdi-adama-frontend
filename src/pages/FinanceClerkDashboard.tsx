import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Users, AlertCircle, Plus, X, Search } from 'lucide-react';
import financeService, { FinanceDashboard, FeeRecord, FeePayment } from '../services/financeService';

export const FinanceClerkDashboard = () => {
  const [dashboard, setDashboard] = useState<FinanceDashboard | null>(null);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [pendingPayments, setPendingPayments] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState<FeeRecord | null>(null);
  const [filters, setFilters] = useState({ status: '', grade: '', term: '', academicYear: '2024/2025' });
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentData, setPaymentData] = useState<FeePayment>({
    studentId: '',
    feeType: 'Tuition',
    amount: 0,
    paymentMethod: 'Cash',
    transactionReference: '',
    remarks: '',
    academicYear: '2024/2025',
    term: 'Term 1',
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dashboardData, feesData, pendingData] = await Promise.all([
        financeService.getDashboard(),
        financeService.getAllFees(filters),
        financeService.getPendingPayments()
      ]);
      setDashboard(dashboardData);
      setFees(feesData);
      setPendingPayments(pendingData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await financeService.recordPayment(paymentData);
      setShowPaymentModal(false);
      resetPaymentForm();
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to record payment');
    }
  };

  const openPaymentModal = (fee?: FeeRecord) => {
    if (fee) {
      setSelectedFee(fee);
      setPaymentData({
        studentId: fee.studentId,
        feeType: fee.feeType,
        amount: fee.remainingAmount,
        paymentMethod: 'Cash',
        transactionReference: '',
        remarks: '',
        academicYear: fee.academicYear,
        term: fee.term,
      });
    }
    setShowPaymentModal(true);
  };

  const resetPaymentForm = () => {
    setPaymentData({
      studentId: '',
      feeType: 'Tuition',
      amount: 0,
      paymentMethod: 'Cash',
      transactionReference: '',
      remarks: '',
      academicYear: '2024/2025',
      term: 'Term 1',
    });
    setSelectedFee(null);
  };

  const filteredFees = fees.filter(fee =>
    fee.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fee.studentDigitalId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && !dashboard) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance Dashboard</h1>
          <p className="text-gray-600">Manage fee collection and payments</p>
        </div>
        <button
          onClick={() => {
            resetPaymentForm();
            setShowPaymentModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Record Payment
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">ETB {dashboard?.totalRevenue.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900">ETB {dashboard?.monthlyRevenue.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Payments</p>
              <p className="text-2xl font-bold text-gray-900">{dashboard?.pendingPayments || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Paid Students</p>
              <p className="text-2xl font-bold text-gray-900">{dashboard?.paidStudents || 0}/{dashboard?.totalStudents || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'all'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All Fees
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'pending'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Pending ({pendingPayments.length})
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search student..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Partial">Partial</option>
            <option value="Overdue">Overdue</option>
          </select>
          <select
            value={filters.grade}
            onChange={(e) => setFilters({ ...filters, grade: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Grades</option>
            <option value="9">Grade 9</option>
            <option value="10">Grade 10</option>
            <option value="11">Grade 11</option>
            <option value="12">Grade 12</option>
          </select>
          <select
            value={filters.term}
            onChange={(e) => setFilters({ ...filters, term: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Terms</option>
            <option value="Term 1">Term 1</option>
            <option value="Term 2">Term 2</option>
            <option value="Term 3">Term 3</option>
          </select>
        </div>
      </div>

      {/* Fee Records Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fee Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remaining</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {(activeTab === 'all' ? filteredFees : pendingPayments).map((fee) => (
              <tr key={fee.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900">{fee.studentName}</p>
                    <p className="text-sm text-gray-500">{fee.studentDigitalId} • Grade {fee.grade}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{fee.feeType}</td>
                <td className="px-6 py-4 text-sm text-gray-900">ETB {fee.totalAmount.toLocaleString()}</td>
                <td className="px-6 py-4 text-sm text-green-600 font-medium">ETB {fee.paidAmount.toLocaleString()}</td>
                <td className="px-6 py-4 text-sm text-red-600 font-medium">ETB {fee.remainingAmount.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    fee.status === 'Paid' ? 'bg-green-100 text-green-800' :
                    fee.status === 'Partial' ? 'bg-blue-100 text-blue-800' :
                    fee.status === 'Overdue' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {fee.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{fee.dueDate}</td>
                <td className="px-6 py-4 text-right">
                  {fee.status !== 'Paid' && (
                    <button
                      onClick={() => openPaymentModal(fee)}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      Record Payment
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(activeTab === 'all' ? filteredFees : pendingPayments).length === 0 && !loading && (
        <div className="text-center py-12">
          <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No fee records found.</p>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Record Payment</h2>
              <button onClick={() => setShowPaymentModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            {selectedFee && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Student: <span className="font-medium text-gray-900">{selectedFee.studentName}</span></p>
                <p className="text-sm text-gray-600">Fee Type: <span className="font-medium text-gray-900">{selectedFee.feeType}</span></p>
                <p className="text-sm text-gray-600">Remaining: <span className="font-medium text-red-600">ETB {selectedFee.remainingAmount.toLocaleString()}</span></p>
              </div>
            )}
            <form onSubmit={handleRecordPayment} className="space-y-4">
              {!selectedFee && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Student ID *</label>
                    <input
                      type="text"
                      required
                      value={paymentData.studentId}
                      onChange={(e) => setPaymentData({ ...paymentData, studentId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fee Type *</label>
                    <select
                      required
                      value={paymentData.feeType}
                      onChange={(e) => setPaymentData({ ...paymentData, feeType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="Tuition">Tuition</option>
                      <option value="Registration">Registration</option>
                      <option value="Exam">Exam</option>
                      <option value="Library">Library</option>
                      <option value="Transport">Transport</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (ETB) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
                <select
                  required
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Mobile Money">Mobile Money</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Reference</label>
                <input
                  type="text"
                  value={paymentData.transactionReference}
                  onChange={(e) => setPaymentData({ ...paymentData, transactionReference: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <textarea
                  value={paymentData.remarks}
                  onChange={(e) => setPaymentData({ ...paymentData, remarks: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={2}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
