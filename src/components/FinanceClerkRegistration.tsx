import { useState, useEffect, useCallback } from 'react';
import { Clock, Check, X, CreditCard, Eye, EyeOff, Download } from 'lucide-react';
import financeClerkService from '../services/financeService';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api$/, '');

const getToken = () => localStorage.getItem('abdi_adama_token') || '';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`,
});

interface PendingApplication {
  id: string;
  applicant_name: string;
  applicant_email?: string;
  applicant_phone?: string;
  parent_name?: string;
  grade_applying?: string;
  status: string;
  registration_fee_status?: string;
  created_at: string;
  transcript_file_name?: string;
}

interface ApprovalPayload {
  amount: number;
  reference?: string;
}

export const FinanceClerkRegistration = () => {
  const [pendingApplications, setPendingApplications] = useState<PendingApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPolicy, setLoadingPolicy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<PendingApplication | null>(null);
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [approvalData, setApprovalData] = useState({ amount: 0, reference: '' });
  const [feeSource, setFeeSource] = useState<string>('unknown');
  const [feeLoadError, setFeeLoadError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showCredentials, setShowCredentials] = useState(false);
  const [approvedApp, setApprovedApp] = useState<any>(null);

  const copyText = async (text: string, label: string) => {
    if (!text || text === 'N/A') return;
    try {
      await navigator.clipboard.writeText(text);
      setSuccessMessage(`${label} copied to clipboard`);
      setTimeout(() => setSuccessMessage(null), 2500);
    } catch (copyError) {
      console.error('Copy failed', copyError);
      setError(`Unable to copy ${label}.`);
    }
  };

  const getStudentCredential = () => ({
    id: approvedApp?.student?.user?.digital_id || approvedApp?.application?.student_id_generated || 'N/A',
    password: approvedApp?.student?.temporaryPassword || approvedApp?.application?.student_password_temp || 'N/A',
  });

  const getParentCredential = () => ({
    id: approvedApp?.parent?.user?.digital_id || approvedApp?.application?.parent_id_generated || 'N/A',
    password: approvedApp?.parent?.temporaryPassword || approvedApp?.application?.parent_password_temp || 'N/A',
  });

  // Fetch pending applications
  const fetchPendingApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API}/api/finance-clerk/applications?status=awaiting-payment`, {
        headers: authHeaders(),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => null);
        throw new Error(errBody?.error?.message || errBody?.message || 'Failed to fetch pending applications');
      }

      const result = await response.json();
      setPendingApplications(Array.isArray(result) ? result : (result.data || []));
    } catch (err: any) {
      console.error('Error fetching applications:', err);
      setError(err.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingApplications();
  }, [fetchPendingApplications]);

  useEffect(() => {
    const loadFee = async () => {
      try {
        setLoadingPolicy(true);
        const fee = await financeClerkService.getGlobalRegistrationFee();
        setApprovalData((prev) => ({ ...prev, amount: Number(fee.amount) || 0 }));
        setFeeSource(fee.source || 'unknown');
        setFeeLoadError(null);
      } catch (err: any) {
        console.error('Failed to load global registration fee:', err);
        setApprovalData((prev) => ({ ...prev, amount: 0 }));
        setFeeSource('unknown');
        setFeeLoadError('Unable to load the current registration fee. Enter the amount manually.');
      } finally {
        setLoadingPolicy(false);
      }
    };

    loadFee();
  }, []);

  const handleApproveClick = (app: PendingApplication) => {
    setSelectedApp(app);
    setApprovalData({
      amount: approvalData.amount,
      reference: ''
    });
    setShowApprovalForm(true);
  };

  const handleApprove = async () => {
    if (!selectedApp) return;

    try {
      setApproving(true);
      setError(null);

      const payload: ApprovalPayload = {
        amount: approvalData.amount,
        reference: approvalData.reference || undefined,
      };

      const result = await financeClerkService.approveApplication(selectedApp.id, payload);

      setApprovedApp(result);
      setSuccessMessage(`✅ Payment approved! Student ID: ${result.student?.user?.digital_id || result.application?.student_id_generated || 'Generated'}`);
      setShowCredentials(false);

      // Remove from pending list
      setPendingApplications(prev =>
        prev.filter(app => app.id !== selectedApp.id)
      );

      // Reset form
      setShowApprovalForm(false);
      setApprovalData({ amount: 0, reference: '' });
      setSelectedApp(null);

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to approve application');
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async (applicationId: string) => {
    if (!confirm('Are you sure you want to reject this application?')) return;

    try {
      const response = await fetch(
        `${API}/api/school-admin/applications/${applicationId}/status`,
        {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({ status: 'declined' }),
        }
      );

      if (response.ok) {
        setSuccessMessage('Application rejected');
        setPendingApplications(prev =>
          prev.filter(app => app.id !== applicationId)
        );
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err: any) {
      setError('Failed to reject application');
    }
  };

  const handleDownloadTranscript = (app: PendingApplication) => {
    if (!app.transcript_file_name) {
      alert('No transcript uploaded for this application.');
      return;
    }
    // Open the backend endpoint to download the file directly from DB
    window.open(`http://localhost:5000/api/school-admin/applications/${app.id}/transcript`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin mb-4">
            <Clock size={32} className="text-blue-600" />
          </div>
          <p className="text-slate-500 font-semibold">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex items-center gap-3">
          <Check className="text-emerald-600 dark:text-emerald-400" size={20} />
          <p className="text-emerald-700 dark:text-emerald-300 font-semibold">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
          <X className="text-red-600 dark:text-red-400" size={20} />
          <p className="text-red-700 dark:text-red-300 font-semibold">{error}</p>
        </div>
      )}

      {/* Applications List */}
      {pendingApplications.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Clock size={40} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-semibold">
            No pending applications awaiting payment
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {pendingApplications.map((app) => (
            <div
              key={app.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:shadow-lg transition-all"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* Student Info */}
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Student Name
                  </p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {app.applicant_name}
                  </p>
                </div>

                {/* Grade */}
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Grade
                  </p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    Grade {app.grade_applying || 'N/A'}
                  </p>
                </div>

                {/* Parent Name */}
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Parent/Guardian
                  </p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {app.parent_name || 'Not provided'}
                  </p>
                </div>

                {/* Application Date */}
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Applied On
                  </p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {new Date(app.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Email
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {app.applicant_email || 'Not provided'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Phone
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {app.applicant_phone || 'Not provided'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => handleApproveClick(app)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all active:scale-95"
                >
                  <Check size={16} />
                  Approve & Proceed to Registration
                </button>

                <button
                  onClick={() => handleReject(app.id)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl font-bold text-sm transition-all"
                >
                  <X size={16} />
                  Reject
                </button>

                <button
                  onClick={() => handleDownloadTranscript(app)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm transition-all"
                >
                  <Download size={16} />
                  Documents
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalForm && selectedApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              Approve Payment & Generate Credentials
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  Student: {selectedApp.applicant_name}
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Payment Amount (ETB) *
                </label>
                <input
                  type="number"
                  value={approvalData.amount}
                  onChange={(e) => setApprovalData({ ...approvalData, amount: Number(e.target.value) })}
                  placeholder={
                    loadingPolicy
                      ? 'Loading global fee...'
                      : approvalData.amount > 0
                      ? 'Auto-filled from global fee settings'
                      : 'Enter amount manually'
                  }
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  disabled={loadingPolicy}
                />
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {approvalData.amount > 0
                    ? 'This amount is populated from the backend registration fee settings.'
                    : 'No registration fee is currently configured; enter the payment amount manually.'}
                </p>
                {feeSource !== 'unknown' && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Source: {feeSource}
                  </p>
                )}
                {feeLoadError && (
                  <p className="mt-2 text-xs text-red-600 dark:text-red-400 font-semibold">
                    {feeLoadError}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Payment Reference (optional)
                </label>
                <input
                  type="text"
                  value={approvalData.reference}
                  onChange={(e) =>
                    setApprovalData({ ...approvalData, reference: e.target.value })
                  }
                  placeholder="e.g., Receipt #12345"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  ✓ This will generate Student ID, Password, Parent ID, and Password
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowApprovalForm(false)}
                className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg font-bold transition-all hover:bg-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={approving || approvalData.amount <= 0 || loadingPolicy}
                className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg font-bold transition-all flex items-center justify-center gap-2"
              >
                {approving ? (
                  <>
                    <Clock size={16} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Approve Payment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credentials Display Modal */}
      {approvedApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-emerald-600 mb-4 flex items-center gap-2">
              <Check size={24} />
              Payment Approved!
            </h2>

            <div className="space-y-4 mb-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Student ID</p>
                <div className="flex items-center gap-2">
                  <code className="text-lg font-mono font-bold text-slate-900 dark:text-white flex-1 bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700">
                    {getStudentCredential().id}
                  </code>
                  <button
                    onClick={() => copyText(getStudentCredential().id, 'Student ID')}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">
                  Student Password (Temporary)
                </p>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono font-bold text-slate-900 dark:text-white flex-1 bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700">
                    {showCredentials
                      ? getStudentCredential().password
                      : '••••••••'}
                  </code>
                  <button
                    onClick={() => setShowCredentials(!showCredentials)}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                  >
                    {showCredentials ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    onClick={() => copyText(getStudentCredential().password, 'Student password')}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Parent ID</p>
                <code className="text-lg font-mono font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700 block">
                  {getParentCredential().id}
                </code>
                <button
                  onClick={() => copyText(getParentCredential().id, 'Parent ID')}
                  className="mt-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 text-sm font-semibold"
                >
                  Copy
                </button>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">
                  Parent Password (Temporary)
                </p>
                <code className="text-sm font-mono font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700 block">
                  {showCredentials
                    ? getParentCredential().password
                    : '••••••••'}
                </code>
                <button
                  onClick={() => copyText(getParentCredential().password, 'Parent password')}
                  className="mt-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 text-sm font-semibold"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 mb-4">
              <button
                onClick={() => {
                  const student = getStudentCredential();
                  const parent = getParentCredential();
                  copyText(
                    `Student ID: ${student.id}\nStudent Password: ${student.password}\nParent ID: ${parent.id}\nParent Password: ${parent.password}`,
                    'All credentials'
                  );
                }}
                className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl font-semibold transition-all"
              >
                Copy all credentials
              </button>
              <button
                onClick={() => {
                  if (!showCredentials) {
                    setShowCredentials(true);
                    setTimeout(() => window.print(), 120);
                  } else {
                    window.print();
                  }
                }}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all"
              >
                Print credentials
              </button>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-6">
              <p className="text-xs text-amber-700 dark:text-amber-300 font-semibold">
                ⚠️ Note: School Admin will now complete final registration by selecting a class and section. These credentials will be activated after finalization.
              </p>
            </div>

            <button
              onClick={() => {
                setApprovedApp(null);
                setSuccessMessage(null);
                setShowCredentials(false);
              }}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceClerkRegistration;
