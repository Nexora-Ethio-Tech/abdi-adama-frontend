import { useState, useEffect } from 'react';
import { Award, Edit2, X, Plus, TrendingUp, Trash2, Users, Save } from 'lucide-react';
import * as teacherService from '../services/teacherService';

interface Course {
  id: string;
  name: string;
  code: string;
  gradeLevel: string;
}

interface Student {
  id: string;
  name: string;
  digitalId: string;
  grade: string;
}

interface Grade {
  id: string;
  student_id: string;
  course_id: string;
  type: string;
  score: number;
  total: number;
  weight: string;
  created_at: string;
  student_name: string;
  digital_id: string;
  grade: string;
}

export const TeacherGrades = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [bulkGrades, setBulkGrades] = useState<Record<string, { score: number; total: number }>>({});
  const [formData, setFormData] = useState({
    studentId: '',
    courseId: '',
    type: 'Mid-Exam',
    score: 0,
    total: 100,
    weight: '30',
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchGrades();
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual course endpoint when available
      const classes = await teacherService.getMyClasses();
      // Map classes to courses for now
      const coursesData = classes.map((cls: any) => ({
        id: cls.id,
        name: cls.subject || cls.name,
        code: cls.section || 'N/A',
        gradeLevel: cls.gradeLevel || cls.name,
      }));
      setCourses(coursesData);
      if (coursesData.length > 0) {
        setSelectedCourse(coursesData[0].id);
        setFormData((prev) => ({ ...prev, courseId: coursesData[0].id }));
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGrades = async () => {
    try {
      setLoading(true);
      setError(null);
      const gradesData = await teacherService.getCourseGrades(selectedCourse);
      setGrades(gradesData || []);
      
      // Extract unique students from grades
      const uniqueStudents: Student[] = Array.from(
        new Map(
          gradesData.map((g: Grade) => [
            g.student_id,
            {
              id: g.student_id,
              name: g.student_name,
              digitalId: g.digital_id,
              grade: g.grade,
            } as Student,
          ])
        ).values()
      );
      setStudents(uniqueStudents);
    } catch (err: any) {
      console.error('Failed to fetch grades:', err);
      setError(err.response?.data?.error?.message || 'Failed to load grades');
      setGrades([]);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await teacherService.enterGrade(formData);
      setShowAddModal(false);
      resetForm();
      fetchGrades();
    } catch (err: any) {
      const errorMsg = err.response?.status === 423
        ? 'Grades are locked. Contact Vice Principal to unlock.'
        : err.response?.data?.error?.message || 'Failed to submit grade';
      alert(errorMsg);
    }
  };

  const handleBulkSubmit = async () => {
    try {
      const gradesArray = Object.entries(bulkGrades)
        .filter(([_, data]) => data.score > 0)
        .map(([studentId, data]) => ({
          studentId,
          type: formData.type,
          score: data.score,
          total: data.total,
          weight: formData.weight,
        }));

      if (gradesArray.length === 0) {
        alert('Please enter at least one grade');
        return;
      }

      await teacherService.bulkEnterGrades({
        courseId: selectedCourse,
        grades: gradesArray,
      });
      
      setShowBulkModal(false);
      setBulkGrades({});
      fetchGrades();
    } catch (err: any) {
      const errorMsg = err.response?.status === 423
        ? 'Grades are locked. Contact Vice Principal to unlock.'
        : err.response?.data?.error?.message || 'Failed to submit grades';
      alert(errorMsg);
    }
  };

  const handleUpdateGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGrade) return;
    try {
      await teacherService.updateGrade(selectedGrade.id, {
        score: formData.score,
        total: formData.total,
        type: formData.type,
        weight: formData.weight,
      });
      setShowEditModal(false);
      setSelectedGrade(null);
      fetchGrades();
    } catch (err: any) {
      const errorMsg = err.response?.status === 423
        ? 'Grades are locked. Contact Vice Principal to unlock.'
        : err.response?.data?.error?.message || 'Failed to update grade';
      alert(errorMsg);
    }
  };

  const handleDeleteGrade = async (gradeId: string) => {
    if (!confirm('Are you sure you want to delete this grade?')) return;
    try {
      await teacherService.deleteGrade(gradeId);
      fetchGrades();
    } catch (err: any) {
      const errorMsg = err.response?.status === 423
        ? 'Grades are locked. Contact Vice Principal to unlock.'
        : err.response?.data?.error?.message || 'Failed to delete grade';
      alert(errorMsg);
    }
  };

  const openEditModal = (grade: Grade) => {
    setSelectedGrade(grade);
    setFormData({
      studentId: grade.student_id,
      courseId: grade.course_id,
      type: grade.type,
      score: grade.score,
      total: grade.total,
      weight: grade.weight,
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      studentId: '',
      courseId: selectedCourse,
      type: 'Mid-Exam',
      score: 0,
      total: 100,
      weight: '30',
    });
  };

  const getStudentGrades = (studentId: string) => {
    return grades.filter((g) => g.student_id === studentId);
  };

  const calculateAverage = (studentId: string) => {
    const studentGrades = getStudentGrades(studentId);
    if (studentGrades.length === 0) return 'N/A';
    const avg =
      studentGrades.reduce((sum, g) => sum + (g.score / g.total) * 100, 0) /
      studentGrades.length;
    return avg.toFixed(1) + '%';
  };

  if (loading && !courses.length) {
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Grade Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Enter and manage student grades by course</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowBulkModal(true)}
            disabled={students.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Users className="w-5 h-5" />
            Bulk Entry
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Add Grade
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 bg-white dark:bg-slate-900 rounded-lg shadow p-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Course</label>
        <select
          value={selectedCourse}
          onChange={(e) => {
            setSelectedCourse(e.target.value);
            setFormData((prev) => ({ ...prev, courseId: e.target.value }));
          }}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
        >
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.name} ({course.code}) - {course.gradeLevel}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Grades Entered</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Average</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {students.map((student) => {
              const studentGrades = getStudentGrades(student.id);
              return (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold">
                        {student.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">{student.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{student.digitalId}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {studentGrades.length}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="font-bold text-gray-900">{calculateAverage(student.id)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, studentId: student.id }));
                        setShowAddModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      Add Grade
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {students.length === 0 && !loading && (
        <div className="text-center py-12">
          <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No students found in this class.</p>
        </div>
      )}

      {/* Recent Grades */}
      {grades.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Grades</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assessment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Weight</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {grades.slice(0, 10).map((grade) => {
                  const percentage = ((grade.score / grade.total) * 100).toFixed(1);
                  return (
                  <tr key={grade.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{grade.student_name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                        {grade.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{grade.score}/{grade.total}</td>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${
                        Number(percentage) >= 80 ? 'text-green-600' :
                        Number(percentage) >= 60 ? 'text-blue-600' :
                        Number(percentage) >= 40 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {percentage}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{grade.weight}%</td>
                    <td className="px-6 py-4 text-right flex gap-2 justify-end">
                      <button
                        onClick={() => openEditModal(grade)}
                        className="p-1 text-gray-600 hover:text-blue-600"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteGrade(grade.id)}
                        className="p-1 text-gray-600 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Grade Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add Grade</h2>
              <button onClick={() => setShowAddModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitGrade} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
                <select
                  required
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select Student</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.digitalId})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Type *</label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="Mid-Exam">Mid-Exam</option>
                  <option value="Final-Exam">Final-Exam</option>
                  <option value="Quiz">Quiz</option>
                  <option value="Assignment">Assignment</option>
                  <option value="Class-Work">Class-Work</option>
                  <option value="Home-Work">Home-Work</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Score *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.score}
                    onChange={(e) => setFormData({ ...formData, score: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.total}
                    onChange={(e) => setFormData({ ...formData, total: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight % *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Submit Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Grade Modal */}
      {showEditModal && selectedGrade && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Grade</h2>
              <button onClick={() => setShowEditModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateGrade} className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Student: <span className="font-medium text-gray-900">{selectedGrade.student_name}</span></p>
                <p className="text-sm text-gray-600">Assessment: <span className="font-medium text-gray-900">{selectedGrade.type}</span></p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Score *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.score}
                    onChange={(e) => setFormData({ ...formData, score: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.total}
                    onChange={(e) => setFormData({ ...formData, total: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight % *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Entry Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold">Bulk Grade Entry</h2>
                <p className="text-sm text-gray-600">Enter grades for all students at once</p>
              </div>
              <button onClick={() => { setShowBulkModal(false); setBulkGrades({}); }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 grid grid-cols-3 gap-4 p-4 bg-purple-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="Mid-Exam">Mid-Exam</option>
                  <option value="Final-Exam">Final-Exam</option>
                  <option value="Quiz">Quiz</option>
                  <option value="Assignment">Assignment</option>
                  <option value="Class-Work">Class-Work</option>
                  <option value="Home-Work">Home-Work</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks *</label>
                <input
                  type="number"
                  min="1"
                  value={formData.total}
                  onChange={(e) => setFormData({ ...formData, total: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight % *</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-2">
              {students.map((student) => (
                <div key={student.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{student.name}</p>
                    <p className="text-sm text-gray-600">{student.digitalId}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max={formData.total}
                      placeholder="Score"
                      value={bulkGrades[student.id]?.score || ''}
                      onChange={(e) => {
                        const score = Number(e.target.value);
                        setBulkGrades({
                          ...bulkGrades,
                          [student.id]: { score, total: formData.total }
                        });
                      }}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center"
                    />
                    <span className="text-gray-600">/ {formData.total}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => { setShowBulkModal(false); setBulkGrades({}); }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkSubmit}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Save All Grades
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
