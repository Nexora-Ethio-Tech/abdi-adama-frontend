import { useState, useEffect } from 'react';
import { Users, MessageSquare, Send, Loader, CheckCircle, AlertCircle, Phone, CalendarDays } from 'lucide-react';
import { useUser } from '../context/UserContext';
import api from '../services/api';
import { EthiopianDatePicker } from '../components/EthiopianDatePicker';
import { ethiopianToGregorianIso, getTodayEthiopianDate } from '../utils/ethiopianCalendar';

interface AbsentStudent {
  id: string;
  name: string;
  grade: string;
  section: string;
  parentName: string;
  parentPhone: string;
  studentId: string;
  roomTeacher: string;
}

interface SMSMessage {
  selectedStudents: string[];
  message: string;
  sentAt?: string;
  status?: 'idle' | 'sending' | 'sent' | 'error';
}

export const VPAttendanceOversight = () => {
  const { user } = useUser();

  // Use Ethiopian date picker; default to today's Ethiopian date
  const [selectedDate, setSelectedDate] = useState<string>(getTodayEthiopianDate());
  const [absentStudents, setAbsentStudents] = useState<AbsentStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [showSMSModal, setShowSMSModal] = useState(false);
  const [smsMessage, setSmsMessage] = useState(
    'Your child is absent from school today. Please contact the school if you have any questions.'
  );
  const [smsSending, setSmsSending] = useState(false);
  const [smsStatus, setSmsStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [smsError, setSmsError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });

  // Re-fetch when date changes
  useEffect(() => {
    fetchAbsentStudents();
  }, [selectedDate]);

  const fetchAbsentStudents = async () => {
    setLoading(true);
    setError(null);
    setSelectedStudents(new Set());
    setSelectAll(false);
    try {
      // Convert Ethiopian date (YYYY-MM-DD E.C.) to Gregorian ISO before sending to backend
      const queryDate = selectedDate ? ethiopianToGregorianIso(selectedDate) : undefined;
      const response = await api.get('/vice-principal/attendance/absences-today', {
        params: { date: queryDate },
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache'
        }
      });
      const data = response.data;
      setAbsentStudents(data.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load absent students data');
      console.error('Error fetching absent students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedStudents(new Set(absentStudents.map(s => s.id)));
    } else {
      setSelectedStudents(new Set());
    }
  };

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    const newSelected = new Set(selectedStudents);
    if (checked) {
      newSelected.add(studentId);
    } else {
      newSelected.delete(studentId);
    }
    setSelectedStudents(newSelected);
    setSelectAll(newSelected.size === absentStudents.length && absentStudents.length > 0);
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const handleSendSMS = async () => {
    if (selectedStudents.size === 0) {
      showToast('Please select at least one student', 'error');
      return;
    }

    if (!smsMessage.trim()) {
      showToast('Please enter a message', 'error');
      return;
    }

    setSmsSending(true);
    setSmsStatus('sending');
    setSmsError(null);

    try {
      // Get phone numbers for selected students
      const selectedData = absentStudents.filter(s => selectedStudents.has(s.id));
      const phoneNumbers = selectedData.map(s => s.parentPhone);

      await api.post('/vice-principal/attendance/send-absence-notification', {
        phoneNumbers,
        message: smsMessage,
        studentIds: Array.from(selectedStudents)
      });

      setSmsStatus('sent');
      showToast(`SMS sent to ${selectedStudents.size} parent(s) successfully!`, 'success');

      // Reset modal after 2 seconds
      setTimeout(() => {
        setShowSMSModal(false);
        setSmsMessage('Your child is absent from school today. Please contact the school if you have any questions.');
        setSmsStatus('idle');
        setSelectedStudents(new Set());
        setSelectAll(false);
      }, 2000);
    } catch (err: any) {
      setSmsStatus('error');
      setSmsError(err.message || 'Failed to send SMS notification');
      showToast('Failed to send SMS notification', 'error');
    } finally {
      setSmsSending(false);
    }
  };

  return (
    <div className="space-y-6 p-6 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 min-h-screen max-w-[95vw] xl:max-w-[1400px] mx-auto">
      {/* Header */}
      <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative">
        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.2),_transparent_50%)]" />
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl transform translate-x-20 -translate-y-20" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-indigo-400 mb-2">Daily Attendance Monitoring</p>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-2">
              Absence Oversight & Parent Notifications
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl font-medium leading-relaxed">
              Monitor student absences by date and send instant SMS notifications to parents.
            </p>
          </div>
          {/* Date Picker */}
          <div className="flex-shrink-0 mt-2">
            <label htmlFor="vpAbsenceDatePicker" className="block text-xs font-bold uppercase tracking-widest text-indigo-400 mb-1.5 cursor-pointer">
              <CalendarDays size={12} className="inline mr-1" />
              View Absences For
            </label>
            <EthiopianDatePicker
              id="vpAbsenceDatePicker"
              value={selectedDate}
              onChange={(v) => setSelectedDate(v)}
              placeholder="YYYY-MM-DD"
              title="Select absence date (Ethiopian calendar)"
              className="w-full"
            />
            {selectedDate && (
              <p className="mt-1 text-xs text-indigo-300 font-medium text-center">
                {selectedDate.split('-').reverse().join('-')}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Status Summary Card */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                <AlertCircle className="text-red-600 dark:text-red-400" size={24} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Absent on {selectedDate}</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{absentStudents.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Users className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Selected</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{selectedStudents.size}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <Phone className="text-purple-600 dark:text-purple-400" size={24} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Parents to Notify</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{selectedStudents.size}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl p-6 flex items-start gap-4">
          <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-1" size={20} />
          <div>
            <h3 className="font-bold text-red-900 dark:text-red-300">Error Loading Data</h3>
            <p className="text-sm text-red-700 dark:text-red-200 mt-1">{error}</p>
            <button
              onClick={fetchAbsentStudents}
              className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin mb-4" />
          <p className="text-slate-600 dark:text-slate-300 font-medium">Loading today's absences...</p>
        </div>
      ) : absentStudents.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-12 text-center shadow-sm">
          <CheckCircle className="mx-auto mb-4 text-emerald-500" size={48} />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Perfect Attendance</h3>
          <p className="text-slate-600 dark:text-slate-300 max-w-md mx-auto">
            No absences recorded for <strong>{selectedDate}</strong>. Try a different date or check that attendance has been saved by a teacher.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  aria-label={selectAll ? 'Deselect all students' : 'Select all students'}
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 cursor-pointer"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {selectAll ? 'Deselect All' : 'Select All'}
                </span>
              </label>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                {selectedStudents.size} of {absentStudents.length} selected
              </span>
            </div>
            <button
              onClick={() => setShowSMSModal(true)}
              disabled={selectedStudents.size === 0}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${selectedStudents.size === 0
                  ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20'
                }`}
            >
              <MessageSquare size={18} />
              Send SMS ({selectedStudents.size})
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {absentStudents.map((student) => (
              <div key={student.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={selectedStudents.has(student.id)}
                    onChange={(e) => handleSelectStudent(student.id, e.target.checked)} aria-label={`Select ${student.name}`} className="w-5 h-5 rounded border-slate-300 text-indigo-600 cursor-pointer mt-1 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4 mb-2">
                      <h3 className="font-bold text-slate-900 dark:text-white text-lg">{student.name}</h3>
                      <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-xs font-bold uppercase tracking-widest">
                        {student.grade} - {student.section}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Parent/Guardian</p>
                        <p className="text-slate-700 dark:text-slate-300 font-medium">{student.parentName}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Phone Number</p>
                        <p className="text-slate-700 dark:text-slate-300 font-medium">{student.parentPhone}</p>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      <p>Room Teacher: <span className="font-medium text-slate-700 dark:text-slate-300">{student.roomTeacher}</span></p>
                    </div>
                  </div>
                  {selectedStudents.has(student.id) && (
                    <CheckCircle className="text-emerald-500 flex-shrink-0 mt-1" size={20} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showSMSModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black flex items-center gap-3">
                    <MessageSquare size={28} />
                    Send Absence Notification
                  </h2>
                  <p className="text-indigo-100 text-sm mt-1">
                    SMS will be sent to {selectedStudents.size} parent(s)
                  </p>
                </div>
                <button
                  onClick={() => setShowSMSModal(false)}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {smsStatus === 'sent' ? (
              <div className="p-8 text-center">
                <CheckCircle className="mx-auto mb-4 text-emerald-500" size={48} />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Messages Sent Successfully!</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                  SMS notifications have been sent to {selectedStudents.size} parent(s).
                </p>
                <button
                  onClick={() => setShowSMSModal(false)}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white mb-3">Selected Students ({selectedStudents.size})</h3>
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 max-h-40 overflow-y-auto">
                    <div className="space-y-2 text-sm">
                      {absentStudents
                        .filter((s) => selectedStudents.has(s.id))
                        .map((student) => (
                          <div key={student.id} className="flex items-start gap-2">
                            <span className="text-slate-400">•</span>
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white">{student.name}</p>
                              <p className="text-slate-500 dark:text-slate-400">{student.parentPhone} ({student.parentName})</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-900 dark:text-white mb-2">SMS Message</label>
                  <textarea
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value)}
                    maxLength={160}
                    placeholder="Enter your message here..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 resize-none"
                    rows={4}
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    {smsMessage.length}/160 characters
                  </p>
                </div>

                {smsStatus === 'error' && smsError && (
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl p-4">
                    <p className="text-sm text-red-700 dark:text-red-300">{smsError}</p>
                  </div>
                )}

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowSMSModal(false)}
                    disabled={smsSending}
                    className="px-6 py-2.5 rounded-xl font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendSMS}
                    disabled={smsSending || smsMessage.trim().length === 0}
                    className={`flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold transition-colors ${smsSending || smsMessage.trim().length === 0
                        ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20'
                      }`}
                  >
                    {smsSending ? (
                      <>
                        <Loader size={18} className="animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        Send to {selectedStudents.size} Parent{selectedStudents.size !== 1 ? 's' : ''}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {toast.show && (
        <div className="fixed bottom-6 right-6 z-40 animate-in slide-in-from-bottom-2 duration-300">
          <div
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl border backdrop-blur-md ${toast.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-300'
              }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <p className="font-medium">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};
