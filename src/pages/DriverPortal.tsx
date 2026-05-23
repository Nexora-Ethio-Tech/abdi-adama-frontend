
import { Megaphone, Plus, X, Bus, Users, RefreshCw, Trash2, Send, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useTranslation } from 'react-i18next';
import { useStore } from '../context/useStore';
import api from '../services/api';
import { useSSE } from '../hooks/useSSE';

interface ManifestItem {
  student_name: string;
  digital_id: string;
  grade: string;
  route_name: string;
}

interface DriverAlert {
  id: string;
  driver_name: string;
  message: string;
  created_at: string;
  target_route?: string;
}

export const DriverPortal = () => {
  const { t } = useTranslation();
  const { user } = useUser();
  const { notices, addNotice, deleteNotice } = useStore();
  useSSE(); // Connect to SSE for real-time deletion updates

  const [activeTab, setActiveTab] = useState<'manifest' | 'announcements' | 'alerts'>('manifest');
  const [manifest, setManifest] = useState<ManifestItem[]>([]);
  const [alerts, setAlerts] = useState<DriverAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [stations, setStations] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [posting, setPosting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchManifest = async () => {
    setLoading(true);
    try {
      const res = await api.get('/transport/manifest');
      setManifest(res.data?.data?.manifest || []);
    } catch (err) {
      console.error('Failed to fetch manifest:', err);
      setError('Failed to load student manifest');
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/driver/alerts');
      setAlerts(res.data?.data?.alerts || []);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
      setError('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'manifest') {
      fetchManifest();
    } else if (activeTab === 'alerts') {
      fetchAlerts();
    }
  }, [activeTab]);

  const handlePostAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertMessage.trim()) {
      setError('Alert message cannot be empty');
      return;
    }

    setPosting(true);
    try {
      const res = await api.post('/driver/alert', {
        message: alertMessage,
        target_route: null,
      });

      if (res.status === 201) {
        setAlerts([res.data?.data || { message: alertMessage }, ...alerts]);
        setAlertMessage('');
        setSuccess('Alert posted successfully! Students and parents have been notified.');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      console.error('Failed to post alert:', err);
      setError(err.response?.data?.error?.message || 'Failed to post alert');
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteNotice = async (noticeId: string) => {
    if (!window.confirm('Are you sure you want to delete this notice? It will be removed from all users.')) {
      return;
    }

    setDeletingId(noticeId);
    try {
      const res = await api.delete(`/driver/notice/${noticeId}`);

      if (res.status === 200) {
        deleteNotice(noticeId);
        setSuccess('Notice deleted successfully');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Failed to delete notice:', err);
      setError('Failed to delete notice');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    if (!window.confirm('Delete this alert? It will be removed from all dashboards immediately.')) {
      return;
    }

    setDeletingId(alertId);
    try {
      const res = await api.delete(`/driver/alert/${alertId}`);

      if (res.status === 200) {
        setAlerts(alerts.filter(a => a.id !== alertId));
        setSuccess('Alert deleted successfully');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Failed to delete alert:', err);
      setError('Failed to delete alert');
    } finally {
      setDeletingId(null);
    }
  };

  const driverNotices = notices.filter(n => n.category === 'Logistics');

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    addNotice({
      title,
      content,
      stations,
      driverName: user?.name || t('driverPortal.defaultName'),
      category: 'Logistics',
      priority: 'Normal',
      audience: ['super-admin', 'school-admin', 'vice-principal', 'parent', 'student']
    });
    setTitle('');
    setContent('');
    setStations('');
    setShowForm(false);
    setSuccess('Notice posted successfully');
    setTimeout(() => setSuccess(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 rounded-[2rem] p-6 md:p-8 text-white overflow-hidden shadow-2xl shadow-orange-200/40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.15),_transparent_50%)]" />
        <div className="absolute -bottom-8 -right-8 opacity-10">
          <Bus size={160} />
        </div>
        <div className="relative space-y-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
              <Bus size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70">{t('driverPortal.title')}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            {t('driverPortal.greeting', { name: user?.name || t('driverPortal.defaultName') })}
          </h1>
          <p className="text-white/70 text-sm max-w-md">
            Manage your route, students, and send live alerts to parents.
          </p>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-sm font-bold text-red-900">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800">
            <X size={18} />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-2xl flex items-start gap-3">
          <AlertCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-sm font-bold text-green-900">{success}</p>
          </div>
          <button onClick={() => setSuccess(null)} className="ml-auto text-green-600 hover:text-green-800">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl flex-wrap gap-1">
        <button
          onClick={() => setActiveTab('manifest')}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'manifest' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}
        >
          <Users size={18} />
          Route Manifest
        </button>
        <button
          onClick={() => setActiveTab('announcements')}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'announcements' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}
        >
          <Megaphone size={18} />
          Announcements
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'alerts' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}
        >
          <Send size={18} />
          Live Alerts
        </button>
      </div>

      {/* Manifest Tab */}
      {activeTab === 'manifest' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Students on your route</h3>
            <button onClick={fetchManifest} className="text-orange-600 hover:rotate-180 transition-transform duration-500">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Student</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">ID</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {manifest.length > 0 ? manifest.map((student, i) => (
                    <tr key={i} className="hover:bg-orange-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center font-bold text-xs">
                            {student.student_name[0]}
                          </div>
                          <span className="text-sm font-bold dark:text-slate-200">{student.student_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-500">{student.digital_id}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-bold text-slate-600 dark:text-slate-400">
                          {student.grade}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-slate-400 font-bold italic">
                        No students assigned to your route yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-black text-lg uppercase tracking-wider shadow-xl shadow-orange-200/50 transition-all hover:scale-[1.02]"
          >
            <Plus size={24} className="inline-block mr-2" />
            Post New Announcement
          </button>

          <div className="space-y-3">
            {driverNotices.map((notice, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-black uppercase rounded-full">Logistics</span>
                    <span className="text-[10px] text-slate-400 font-bold">{notice.time}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteNotice(notice.id)}
                    disabled={deletingId === notice.id}
                    className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete announcement"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-1">{notice.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{notice.content}</p>
              </div>
            ))}
            {driverNotices.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <p className="font-bold italic">No announcements posted yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Live Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Alert Posting Form */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl border-2 border-blue-200 dark:border-blue-800 p-5 shadow-sm">
            <div className="flex items-start gap-3 mb-3">
              <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-black text-blue-900 dark:text-blue-100 text-sm">Send Live Alert to Students & Parents</h3>
                <p className="text-[10px] text-blue-700 dark:text-blue-300 mt-0.5">
                  Alerts are delivered instantly to all students on your route, their parents, and school administrators. They auto-expire after 3 days.
                </p>
              </div>
            </div>

            <form onSubmit={handlePostAlert} className="space-y-3">
              <textarea
                required
                placeholder="Alert message (e.g., 'Route delayed due to traffic' or 'Bus maintenance today')"
                value={alertMessage}
                onChange={e => setAlertMessage(e.target.value)}
                disabled={posting}
                maxLength={500}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-blue-200 dark:border-blue-700 rounded-xl text-sm font-semibold resize-none placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                rows={3}
              />
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-slate-500">{alertMessage.length} / 500 characters</span>
                <button
                  type="submit"
                  disabled={posting || !alertMessage.trim()}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase rounded-xl shadow-lg shadow-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send size={16} />
                  Send Alert
                </button>
              </div>
            </form>
          </div>

          {/* Active Alerts List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Your Active Alerts (Last 3 Days)</h3>
              <button onClick={fetchAlerts} className="text-blue-600 hover:rotate-180 transition-transform duration-500">
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            <div className="space-y-2">
              {alerts.length > 0 ? alerts.map((alert) => (
                <div key={alert.id} className="bg-white dark:bg-slate-900 rounded-2xl border-l-4 border-l-blue-500 border border-slate-100 dark:border-slate-800 p-4 shadow-sm hover:shadow-md transition-all flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-black uppercase rounded-full">Live Alert</span>
                      <span className="text-[9px] text-slate-400 font-bold">
                        {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{alert.message}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Sent by: {alert.driver_name}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteAlert(alert.id)}
                    disabled={deletingId === alert.id}
                    className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                    title="Delete alert immediately"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )) : (
                <div className="text-center py-8 text-slate-400">
                  <p className="font-bold italic">No active alerts. Post one to notify students & parents.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Announcement Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex items-center justify-between bg-orange-50 dark:bg-orange-900/20">
              <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm uppercase tracking-wider">New Announcement</h3>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form className="p-6 space-y-4" onSubmit={handlePost}>
              <input
                required
                placeholder="Title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm font-bold"
              />
              <textarea
                required
                placeholder="Details..."
                value={content}
                onChange={e => setContent(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm h-24 resize-none"
              />
              <input
                placeholder="Stations (comma separated)"
                value={stations}
                onChange={e => setStations(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm"
              />
              <button type="submit" className="w-full py-4 bg-orange-500 text-white font-black text-sm uppercase rounded-xl shadow-lg shadow-orange-200">Broadcast Announcement</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
