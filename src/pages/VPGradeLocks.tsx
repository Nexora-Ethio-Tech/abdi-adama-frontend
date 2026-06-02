import { useState, useEffect } from 'react';
import { Lock, Unlock, BookOpen, Calendar, User } from 'lucide-react';
import * as vicePrincipalService from '../services/vicePrincipalService';
import { formatEthiopianLabel } from '../utils/ethiopianCalendar';

interface GradeLock {
  gradeLevel?: string;
  isLocked: boolean;
  academicYearId?: string;
  // fields from incoming branch data
  courseId?: string;
  courseName?: string;
  teacherName?: string;
  className?: string;
  lastModified?: string;
}

export const VPGradeLocks = () => {
  const [locks, setLocks] = useState<GradeLock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLocks();
  }, []);

  const fetchLocks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await vicePrincipalService.getGradeLocks();
      setLocks(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch grade locks');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLock = async (gradeLevel: string, currentStatus: boolean) => {
    try {
      await vicePrincipalService.toggleGradeLock({
        gradeLevel,
        isLocked: !currentStatus
      });
      fetchLocks();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to toggle grade lock');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Grade Lock Management</h1>
        <p className="text-gray-600">Control grade entry access for all courses</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Modified</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {locks.map((lock) => (
              <tr key={lock.courseId} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-gray-400" />
                    <span className="font-medium text-gray-900">{lock.courseName}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{lock.teacherName}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{lock.className}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                    lock.isLocked
                      ? 'bg-red-100 text-red-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {lock.isLocked ? (
                      <>
                        <Lock className="w-3 h-3" />
                        Locked
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3 h-3" />
                        Unlocked
                      </>
                    )}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {lock.lastModified ? `${formatEthiopianLabel(lock.lastModified)} ${new Date(lock.lastModified).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => handleToggleLock(lock.courseId || lock.gradeLevel || 'unknown', lock.isLocked)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      lock.isLocked
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    {lock.isLocked ? 'Unlock' : 'Lock'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {locks.length === 0 && !loading && (
        <div className="text-center py-12">
          <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No courses found.</p>
        </div>
      )}
    </div>
  );
};
