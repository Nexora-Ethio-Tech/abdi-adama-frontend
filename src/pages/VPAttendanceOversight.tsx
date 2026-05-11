import { useState, useEffect } from 'react';
import { Users, AlertTriangle, CheckCircle, TrendingDown, Calendar, Flag, Check, X } from 'lucide-react';
import vicePrincipalService, { VPDashboard, AttendanceOverview, AttendanceAlert } from '../services/vicePrincipalService';

export const VPAttendanceOversight = () => {
  const [dashboard, setDashboard] = useState<VPDashboard | null>(null);
  const [overview, setOverview] = useState<AttendanceOverview[]>([]);
  const [alerts, setAlerts] = useState<AttendanceAlert[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'alerts'>('overview');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<AttendanceAlert | null>(null);
  const [approvalRemarks, setApprovalRemarks] = useState('');

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dashboardData, overviewData, alertsData] = await Promise.all([
        vicePrincipalService.getDashboard(),
        vicePrincipalService.getAttendanceOverview(selectedDate),
        vicePrincipalService.getAttendanceAlerts()
      ]);
      setDashboard(dashboardData);
      setOverview(overviewData);
      setAlerts(alertsData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (status: 'Approved' | 'Flagged') => {
    if (!selectedAlert) return;
    try {
      await vicePrincipalService.approveAttendance(selectedAlert.id, {
        status,
        remarks: approvalRemarks
      });
      setShowApproveModal(false);
      setSelectedAlert(null);
      setApprovalRemarks('');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to process attendance');
    }
  };

  if (loading && !dashboard) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Attendance Oversight</h1>
        <p className="text-gray-600">Monitor and review attendance across all classes</p>
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
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{dashboard?.totalStudents || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Today's Attendance</p>
              <p className="text-2xl font-bold text-gray-900">{dashboard?.todayAttendanceRate || 0}%</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Reviews</p>
              <p className="text-2xl font-bold text-gray-900">{dashboard?.pendingAttendanceReviews || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{dashboard?.attendanceAlerts || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'overview'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Class Overview
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'alerts'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Alerts ({alerts.filter(a => a.status === 'Pending').length})
        </button>
      </div>

      {activeTab === 'overview' ? (
        <>
          <div className="mb-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-600" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Present</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Absent</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Late</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {overview.map((item) => (
                  <tr key={item.classId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{item.className}</p>
                        <p className="text-sm text-gray-500">{item.section}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.teacherName}</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900">{item.totalStudents}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">
                        {item.presentToday}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm font-medium">
                        {item.absentToday}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm font-medium">
                        {item.lateToday}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-bold ${
                        item.attendanceRate >= 90 ? 'text-green-600' :
                        item.attendanceRate >= 75 ? 'text-blue-600' :
                        item.attendanceRate >= 60 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {item.attendanceRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {overview.length === 0 && !loading && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No attendance data for this date.</p>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="space-y-4">
            {alerts.filter(a => a.status === 'Pending').map((alert) => (
              <div
                key={alert.id}
                className={`bg-white rounded-lg shadow p-6 border-l-4 ${
                  alert.severity === 'High' ? 'border-red-500' :
                  alert.severity === 'Medium' ? 'border-yellow-500' :
                  'border-blue-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        alert.severity === 'High' ? 'bg-red-100 text-red-800' :
                        alert.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {alert.severity}
                      </span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                        {alert.type}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">{alert.studentName}</h3>
                    <p className="text-sm text-gray-600 mb-2">{alert.className} • {alert.date}</p>
                    <p className="text-sm text-gray-700">{alert.details}</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => {
                        setSelectedAlert(alert);
                        setShowApproveModal(true);
                      }}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                      title="Approve"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedAlert(alert);
                        setShowApproveModal(true);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Flag"
                    >
                      <Flag className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {alerts.filter(a => a.status === 'Pending').length === 0 && !loading && (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No pending alerts. All attendance issues resolved!</p>
            </div>
          )}
        </>
      )}

      {/* Approve/Flag Modal */}
      {showApproveModal && selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Review Attendance Alert</h2>
              <button onClick={() => setShowApproveModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Student: <span className="font-medium text-gray-900">{selectedAlert.studentName}</span></p>
              <p className="text-sm text-gray-600">Alert: <span className="font-medium text-gray-900">{selectedAlert.type}</span></p>
              <p className="text-sm text-gray-600 mt-2">{selectedAlert.details}</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
              <textarea
                value={approvalRemarks}
                onChange={(e) => setApprovalRemarks(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={3}
                placeholder="Add your remarks..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleApprove('Approved')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Check className="w-5 h-5" />
                Approve
              </button>
              <button
                onClick={() => handleApprove('Flagged')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Flag className="w-5 h-5" />
                Flag Issue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
