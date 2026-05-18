import { useState, useEffect } from 'react';
import { Users, BookOpen, ChevronRight, ArrowLeft, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import teacherService, { TeacherClass, ClassStudent } from '../services/teacherService';

export const TeacherClasses = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<TeacherClass | null>(null);
  const [students, setStudents] = useState<ClassStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await teacherService.getMyClasses();
      setClasses(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch classes');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (classId: string) => {
    try {
      setLoading(true);
      const data = await teacherService.getClassStudents(classId);
      setStudents(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handleClassClick = (cls: TeacherClass) => {
    setSelectedClass(cls);
    fetchStudents(cls.id);
  };

  if (loading && !classes.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (selectedClass) {
    return (
      <div className="p-6">
        <button
          onClick={() => setSelectedClass(null)}
          className="flex items-center gap-2 mb-6 text-blue-600 hover:text-blue-700 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Classes
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{selectedClass.name} - {selectedClass.section}</h1>
          <p className="text-gray-600">{selectedClass.subject} • {selectedClass.enrolledStudents} students</p>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{student.digitalId}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
                        {student.firstName[0]}{student.lastName[0]}
                      </div>
                      <span className="font-medium text-gray-900">{student.firstName} {student.lastName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{student.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{student.grade}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      student.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {student.attendanceRate ? `${student.attendanceRate}%` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => navigate(`/teacher-student-grades/${student.id}`)}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      <Award className="w-4 h-4" />
                      View Grades
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {students.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No students found in this class.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Classes</h1>
        <p className="text-gray-600">View your assigned classes and students</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((cls) => (
          <button
            key={cls.id}
            onClick={() => handleClassClick(cls)}
            className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all text-left"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{cls.name}</h3>
                  <p className="text-sm text-gray-500">{cls.section}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subject:</span>
                <span className="font-medium text-gray-900">{cls.subject}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Students:</span>
                <span className="font-medium text-gray-900">{cls.enrolledStudents}/{cls.capacity}</span>
              </div>
              {cls.schedule && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Schedule:</span>
                  <span className="font-medium text-gray-900">{cls.schedule}</span>
                </div>
              )}
              {cls.room && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Room:</span>
                  <span className="font-medium text-gray-900">{cls.room}</span>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {classes.length === 0 && !loading && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No classes assigned yet.</p>
        </div>
      )}
    </div>
  );
};
