import { useState, useEffect } from 'react';
import { Award, Edit2, X, Plus, TrendingUp } from 'lucide-react';
import teacherService, { TeacherClass, ClassStudent, Grade, SubmitGradeData, UpdateGradeData } from '../services/teacherService';

export const TeacherGrades = () => {
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState<ClassStudent[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [formData, setFormData] = useState<SubmitGradeData>({
    studentId: '',
    classId: '',
    subject: '',
    assessmentType: 'Quiz',
    score: 0,
    maxScore: 100,
    term: 'Term 1',
    academicYear: '2024/2025',
    remarks: '',
  });

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudentsAndGrades();
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const data = await teacherService.getMyClasses();
      setClasses(data);
      if (data.length > 0) {
        setSelectedClass(data[0].id);
        setFormData(prev => ({ ...prev, classId: data[0].id, subject: data[0].subject }));
      }
    } catch (err) {
      console.error('Failed to fetch classes:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsAndGrades = async () => {
    try {
      setLoading(true);
      setError(null);
      const [studentsData, gradesData] = await Promise.all([
        teacherService.getClassStudents(selectedClass),
        teacherService.getClassGrades(selectedClass)
      ]);
      setStudents(studentsData);
      setGrades(gradesData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await teacherService.submitGrade(formData);
      setShowAddModal(false);
      resetForm();
      fetchStudentsAndGrades();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit grade');
    }
  };

  const handleUpdateGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGrade) return;
    try {
      const updateData: UpdateGradeData = {
        score: formData.score,
        maxScore: formData.maxScore,
        remarks: formData.remarks,
      };
      await teacherService.updateGrade(selectedGrade.id, updateData);
      setShowEditModal(false);
      setSelectedGrade(null);
      fetchStudentsAndGrades();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update grade');
    }
  };

  const openEditModal = (grade: Grade) => {
    setSelectedGrade(grade);
    setFormData({
      studentId: grade.studentId,
      classId: grade.classId,
      subject: grade.subject,
      assessmentType: grade.assessmentType,
      score: grade.score,
      maxScore: grade.maxScore,
      term: grade.term,
      academicYear: grade.academicYear,
      remarks: grade.remarks || '',
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    const selectedClassData = classes.find(c => c.id === selectedClass);
    setFormData({
      studentId: '',
      classId: selectedClass,
      subject: selectedClassData?.subject || '',
      assessmentType: 'Quiz',
      score: 0,
      maxScore: 100,
      term: 'Term 1',
      academicYear: '2024/2025',
      remarks: '',
    });
  };

  const getStudentGrades = (studentId: string) => {
    return grades.filter(g => g.studentId === studentId);
  };

  const calculateAverage = (studentId: string) => {
    const studentGrades = getStudentGrades(studentId);
    if (studentGrades.length === 0) return 'N/A';
    const avg = studentGrades.reduce((sum, g) => sum + g.percentage, 0) / studentGrades.length;
    return avg.toFixed(1) + '%';
  };

  if (loading && !classes.length) {
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
          <h1 className="text-2xl font-bold text-gray-900">Grade Management</h1>
          <p className="text-gray-600">Enter and manage student grades</p>
        </div>
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

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
        <select
          value={selectedClass}
          onChange={(e) => {
            setSelectedClass(e.target.value);
            const cls = classes.find(c => c.id === e.target.value);
            setFormData(prev => ({ ...prev, classId: e.target.value, subject: cls?.subject || '' }));
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        >
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.name} - {cls.section} ({cls.subject})
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
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
                        {student.firstName[0]}{student.lastName[0]}
                      </div>
                      <span className="font-medium text-gray-900">{student.firstName} {student.lastName}</span>
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
                        setFormData(prev => ({ ...prev, studentId: student.id }));
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Term</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {grades.slice(0, 10).map((grade) => (
                  <tr key={grade.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{grade.studentName}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                        {grade.assessmentType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{grade.score}/{grade.maxScore}</td>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${
                        grade.percentage >= 80 ? 'text-green-600' :
                        grade.percentage >= 60 ? 'text-blue-600' :
                        grade.percentage >= 40 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {grade.percentage}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{grade.term}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEditModal(grade)}
                        className="p-1 text-gray-600 hover:text-blue-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
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
                      {student.firstName} {student.lastName} ({student.digitalId})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Type *</label>
                <select
                  required
                  value={formData.assessmentType}
                  onChange={(e) => setFormData({ ...formData, assessmentType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="Quiz">Quiz</option>
                  <option value="Exam">Exam</option>
                  <option value="Assignment">Assignment</option>
                  <option value="Project">Project</option>
                  <option value="Midterm">Midterm</option>
                  <option value="Final">Final</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Score *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.maxScore}
                    onChange={(e) => setFormData({ ...formData, maxScore: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Term *</label>
                  <select
                    required
                    value={formData.term}
                    onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Term 3">Term 3</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
                  <input
                    type="text"
                    required
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={2}
                />
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
                <p className="text-sm text-gray-600">Student: <span className="font-medium text-gray-900">{selectedGrade.studentName}</span></p>
                <p className="text-sm text-gray-600">Assessment: <span className="font-medium text-gray-900">{selectedGrade.assessmentType}</span></p>
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Score *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.maxScore}
                    onChange={(e) => setFormData({ ...formData, maxScore: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={2}
                />
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
    </div>
  );
};
