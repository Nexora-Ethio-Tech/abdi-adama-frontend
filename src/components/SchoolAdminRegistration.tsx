import { useState, useEffect, useCallback } from 'react';
import { Clock, Check, X, ChevronDown, Download, AlertCircle } from 'lucide-react';

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
  payment_confirmed?: boolean;
  created_at: string;
  student_id_generated?: string;
  student_password_temp?: string;
  parent_id_generated?: string;
  parent_password_temp?: string;
}

interface ClassData {
  id: string;
  name: string;
}

interface SectionData {
  id: string;
  name: string;
}

export const SchoolAdminRegistration = () => {
  const [applications, setApplications] = useState<PendingApplication[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [sections, setSections] = useState<SectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [selectedApp, setSelectedApp] = useState<PendingApplication | null>(null);
  const [showFinalizeForm, setShowFinalizeForm] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [finalizing, setFinalizing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'awaiting-payment' | 'payment-confirmed' | 'registered'>('all');

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [appsRes, classesRes, sectionsRes] = await Promise.all([
        fetch(`${API}/api/school-admin/applications`, { headers: authHeaders() }),
        fetch(`${API}/api/school-admin/classes`, { headers: authHeaders() }),
        fetch(`${API}/api/school-admin/classes`, { headers: authHeaders() }), // Using classes endpoint to get sections
      ]);

      if (!appsRes.ok) throw new Error('Failed to fetch applications');
      if (!classesRes.ok) throw new Error('Failed to fetch classes');

      const appsData = await appsRes.json();
      const classesData = await classesRes.json();

      setApplications(appsData.data || []);
      setClasses(classesData.data || []);

      // Mock sections for now - in a real app, these would come from the backend
      setSections([
        { id: '1', name: 'Section A' },
        { id: '2', name: 'Section B' },
        { id: '3', name: 'Section C' },
      ]);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePassApplication = async (applicationId: string) => {
    try {
      const response = await fetch(
        `${API}/api/school-admin/applications/${applicationId}/status`,
        {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({ status: 'awaiting-payment' }),
        }
      );

      if (!response.ok) throw new Error('Failed to pass application');

      setSuccessMessage('✅ Application passed to Finance Clerk for payment approval');
      setApplications(prev =>
        prev.map(app =>
          app.id === applicationId ? { ...app, status: 'awaiting-payment' } : app
        )
      );
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to pass application');
    }
  };

  const handleFinalizeClick = (app: PendingApplication) => {
    if (app.status !== 'payment-confirmed') {
      setError('Only payment-confirmed applications can be finalized');
      return;
    }
    setSelectedApp(app);
    setSelectedClass('');
    setSelectedSection('');
    setShowFinalizeForm(true);
  };

  const handleFinalize = async () => {
    if (!selectedApp || !selectedClass || !selectedSection) {
      setError('Please select both class and section');
      return;
    }

    try {
      setFinalizing(true);
      setError(null);

      const response = await fetch(
        `${API}/api/school-admin/applications/${selectedApp.id}/finalize`,
        {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            classId: selectedClass,
            sectionId: selectedSection,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to finalize registration');
      }

      const result = await response.json();

      setSuccessMessage(
        `✅ Student ${result.data.registrationDetails.applicantName} registered successfully! \n` +
        `Student ID: ${result.data.registrationDetails.studentId}`
      );

      // Update applications list
      setApplications(prev =>
        prev.map(app =>
          app.id === selectedApp.id ? { ...app, status: 'registered' } : app
        )
      );

      // Reset form
      setShowFinalizeForm(false);
      setSelectedApp(null);
      setSelectedClass('');
      setSelectedSection('');

      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to finalize registration');
    } finally {
      setFinalizing(false);
    }
  };

  const filteredApplications = applications.filter(app => {
    if (filterStatus === 'all') return true;
    return app.status === filterStatus;
  });

  const statusColors: Record<string, { bg: string; text: string; icon: string }> = {
    pending: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', icon: '📋' },
    'awaiting-payment': {
      bg: 'bg-yellow-100 dark:bg-yellow-900/20',
      text: 'text-yellow-700 dark:text-yellow-300',
      icon: '💳',
    },
    'payment-confirmed': {
      bg: 'bg-blue-100 dark:bg-blue-900/20',
      text: 'text-blue-700 dark:text-blue-300',
      icon: '✓',
    },
    registered: {
      bg: 'bg-emerald-100 dark:bg-emerald-900/20',
      text: 'text-emerald-700 dark:text-emerald-300',
      icon: '✅',
    },
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
      {/* Messages */}
      {successMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex items-center gap-3">
          <Check className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" size={20} />
          <p className="text-emerald-700 dark:text-emerald-300 font-semibold">{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
          <X className="text-red-600 dark:text-red-400 flex-shrink-0" size={20} />
          <p className="text-red-700 dark:text-red-300 font-semibold">{error}</p>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'awaiting-payment', 'payment-confirmed', 'registered'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status as any)}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${filterStatus === status
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
              }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
          <AlertCircle size={40} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-semibold">
            No applications with status: {filterStatus}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredApplications.map((app) => {
            const colors = statusColors[app.status] || statusColors.pending;

            return (
              <div
                key={app.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:shadow-lg transition-all"
              >
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${colors.bg} ${colors.text}`}>
                      {colors.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {app.applicant_name}
                      </h3>
                      <p className={`text-sm font-semibold ${colors.text}`}>
                        {app.status.replace('-', ' ').toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Applied</p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {new Date(app.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Grade</p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Grade {app.grade_applying || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Parent</p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {app.parent_name || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Email</p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {app.applicant_email || 'Not provided'}
                    </p>
                  </div>
                </div>

                {/* Generated Credentials (if payment-confirmed or registered) */}
                {(app.status === 'payment-confirmed' || app.status === 'registered') && app.student_id_generated && (
                  <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50 rounded-lg p-3 mb-4">
                    <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase mb-2">
                      Generated Credentials
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-[9px] text-blue-600 dark:text-blue-400 font-bold">Student ID</p>
                        <code className="font-mono font-bold text-slate-900 dark:text-white">
                          {app.student_id_generated}
                        </code>
                      </div>
                      <div>
                        <p className="text-[9px] text-blue-600 dark:text-blue-400 font-bold">Parent ID</p>
                        <code className="font-mono font-bold text-slate-900 dark:text-white">
                          {app.parent_id_generated}
                        </code>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  {app.status === 'pending' && (
                    <button
                      onClick={() => handlePassApplication(app.id)}
                      className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all active:scale-95"
                    >
                      <Check size={16} />
                      Pass to Finance
                    </button>
                  )}

                  {app.status === 'payment-confirmed' && (
                    <button
                      onClick={() => handleFinalizeClick(app)}
                      className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all active:scale-95"
                    >
                      <Check size={16} />
                      Complete Registration
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (!app.transcript_file_name) {
                        alert('No transcript uploaded for this application.');
                      } else {
                        window.open(`http://localhost:5000/api/school-admin/applications/${app.id}/transcript`, '_blank');
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm transition-all"
                  >
                    <Download size={16} />
                    Documents
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Finalize Registration Modal */}
      {showFinalizeForm && selectedApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Complete Student Registration
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              {selectedApp.applicant_name} - Grade {selectedApp.grade_applying}
            </p>

            <div className="space-y-4 mb-6">
              {/* Class Selection */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Select Class *
                </label>
                <div className="relative">
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                  >
                    <option value="">-- Choose Class --</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Section Selection */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Select Section *
                </label>
                <div className="relative">
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                  >
                    <option value="">-- Choose Section --</option>
                    {sections.map(sec => (
                      <option key={sec.id} value={sec.id}>
                        {sec.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Generated Credentials Preview */}
              {selectedApp.student_id_generated && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-2">
                    Generated Credentials (will be activated):
                  </p>
                  <div className="text-xs space-y-1 font-mono text-slate-700 dark:text-slate-300">
                    <p>Student ID: {selectedApp.student_id_generated}</p>
                    <p>Parent ID: {selectedApp.parent_id_generated}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowFinalizeForm(false)}
                className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg font-bold transition-all hover:bg-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleFinalize}
                disabled={finalizing || !selectedClass || !selectedSection}
                className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg font-bold transition-all flex items-center justify-center gap-2"
              >
                {finalizing ? (
                  <>
                    <Clock size={16} className="animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Complete Registration
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolAdminRegistration;
