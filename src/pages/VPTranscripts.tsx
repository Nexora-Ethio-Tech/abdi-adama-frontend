import { useState } from 'react';
import { Search, FileText, Award, Calendar, TrendingUp } from 'lucide-react';
import * as vicePrincipalService from '../services/vicePrincipalService';

export const VPTranscripts = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [transcript, setTranscript] = useState<vicePrincipalService.StudentTranscript | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await vicePrincipalService.getStudentTranscript(searchQuery);
      setTranscript(data);
      setSelectedStudent({ id: searchQuery, name: data.studentName });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Student not found');
      setTranscript(null);
      setSelectedStudent(null);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Student Transcripts</h1>
        <p className="text-gray-600">View complete academic records for any student</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6 flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Enter Student ID (e.g., ST001)"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {transcript && (
        <>
          {/* Student Header */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{transcript.studentName}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="font-medium">ID: {transcript.studentId}</span>
                  <span>•</span>
                  <span>{transcript.className}</span>
                  <span>•</span>
                  <span>{transcript.section}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <span className="text-3xl font-bold text-gray-900">{transcript.overallAverage}%</span>
                </div>
                <span className="text-sm text-gray-600">Overall Average</span>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Courses</p>
                  <p className="text-xl font-bold text-gray-900">{transcript.courses.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Award className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Highest Grade</p>
                  <p className="text-xl font-bold text-gray-900">
                    {Math.max(...transcript.courses.flatMap(c => c.grades.map(g => g.percentage)))}%
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Assessments</p>
                  <p className="text-xl font-bold text-gray-900">
                    {transcript.courses.reduce((sum, c) => sum + c.grades.length, 0)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className={`text-xl font-bold ${
                    transcript.overallAverage >= 75 ? 'text-green-600' :
                    transcript.overallAverage >= 60 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {transcript.overallAverage >= 75 ? 'Excellent' :
                     transcript.overallAverage >= 60 ? 'Good' : 'Needs Support'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Courses */}
          <div className="space-y-4">
            {transcript.courses.map((course) => (
              <div key={course.courseId} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">{course.courseName}</h3>
                      <p className="text-sm text-gray-600">Teacher: {course.teacherName}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getGradeColor(course.courseAverage)}`}>
                        {course.courseAverage}%
                      </div>
                      <p className="text-sm text-gray-600">Course Average</p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assessment Type</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Score</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Percentage</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Weight</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {course.grades.map((grade, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">{grade.type}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-bold text-gray-900">{grade.score}</span>
                          </td>
                          <td className="px-6 py-4 text-center text-sm text-gray-600">{grade.total}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`font-bold ${getGradeColor(grade.percentage)}`}>
                              {grade.percentage}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center text-sm text-gray-600">{grade.weight}%</td>
                          <td className="px-6 py-4 text-right text-sm text-gray-600">
                            {new Date(grade.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!transcript && !loading && !error && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Search for a student to view their transcript</p>
        </div>
      )}
    </div>
  );
};
