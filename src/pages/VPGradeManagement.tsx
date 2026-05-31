import { useState, useEffect } from 'react';
import { ChevronDown, Download, BarChart3, Users, BookOpen, CheckCircle2 } from 'lucide-react';
import * as vicePrincipalService from '../services/vicePrincipalService';

interface VpGradeGroup {
  id: string;
  name: string;
  grade_name?: string;
  sections: Section[];
}

interface Section {
  id: string;
  section_name: string;
  student_count: number;
  capacity: number;
}

interface Student {
  id: string;
  user_id: string;
  name: string;
  grade: string;
  section: string;
  enrollment_date: string;
}

interface Course {
  id: string;
  name: string;
  code: string;
  teacher_id?: string;
  teacher_name?: string;
}

interface StudentGrade {
  id: string;
  name: string;
  total?: number;
  average?: number;
  rank?: number;
  grades: Record<string, any>;
}

export const VPGradeManagement = () => {
  const [grades, setGrades] = useState<VpGradeGroup[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [studentGrades, setStudentGrades] = useState<StudentGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSectionData, setLoadingSectionData] = useState(false);
  const [generatingResults, setGeneratingResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  useEffect(() => {
    fetchGradesAndSections();
  }, []);

  const fetchGradesAndSections = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await vicePrincipalService.getGradesAndSections();
      setGrades(
        (Array.isArray(data) ? data : []).map((grade: any) => ({
          id: grade.id,
          name: grade.name ?? grade.grade_name ?? 'Unnamed Grade',
          grade_name: grade.grade_name ?? grade.name,
          sections: Array.isArray(grade.sections) ? grade.sections : [],
        }))
      );
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to fetch grades and sections';
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSectionSelect = async (grade: VpGradeGroup, section: Section) => {
    setSelectedGrade(grade.name);
    setSelectedSection(section);
    setLoadingSectionData(true);

    try {
      const [studentsData, coursesData, gradesData] = await Promise.all([
        vicePrincipalService.getStudentsBySection(section.id),
        vicePrincipalService.getCoursesBySection(section.id),
        vicePrincipalService.getSectionGrades(section.id)
      ]);

      setStudents(studentsData);
      setCourses(coursesData);
      setStudentGrades(gradesData.grades);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to fetch section data';
      showToast(message, 'error');
    } finally {
      setLoadingSectionData(false);
    }
  };

  const handleGenerateResults = async () => {
    if (!selectedSection) return;

    setGeneratingResults(true);
    try {
      const results = await vicePrincipalService.generateSectionResults(selectedSection.id);
      
      // Update the studentGrades with the calculated values
      const updatedGrades = studentGrades.map(sg => {
        const result = results.find((r: any) => r.student_id === sg.id);
        if (result) {
          return {
            ...sg,
            total: result.total,
            average: result.average,
            rank: result.rank
          };
        }
        return sg;
      });
      
      setStudentGrades(updatedGrades);
      showToast('Results generated successfully', 'success');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to generate results';
      showToast(message, 'error');
    } finally {
      setGeneratingResults(false);
    }
  };

  const exportToCSV = () => {
    if (!selectedSection || studentGrades.length === 0) return;

    // Create CSV header
    const headers = ['Student Name', ...courses.map(c => c.name), 'Total', 'Average', 'Rank'];
    
    // Create CSV rows
    const rows = studentGrades.map(student => [
      student.name,
      ...courses.map(course => student.grades[course.id]?.score || ''),
      student.total || '',
      student.average || '',
      student.rank || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Download CSV
    const element = document.createElement('a');
    element.setAttribute('href', `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`);
    element.setAttribute('download', `${selectedGrade}-${selectedSection.section_name}-grades.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    showToast('Grades exported to CSV', 'success');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <p className="text-slate-500 dark:text-slate-400 animate-pulse font-medium">Loading grade management...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 text-white rounded-[2rem] p-8 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.2),_transparent_50%)]" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl transform translate-x-20 -translate-y-20"></div>
        <div className="relative z-10">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-indigo-400 mb-2">Grade Management</p>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-2">Student Grade Processing</h1>
          <p className="text-slate-400 text-sm max-w-2xl font-medium leading-relaxed">
            View student grades by class section, submit grades, and generate comprehensive result reports with totals, averages, and rankings.
          </p>
        </div>
      </section>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl p-4 text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Grades and Sections Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {grades.map((grade) => (
          <div key={grade.name} className="space-y-3">
            <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg border border-indigo-200 dark:border-indigo-800">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">{grade.name}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">{grade.sections.length} section(s)</p>
            </div>
            
            <div className="space-y-2">
              {grade.sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => handleSectionSelect(grade, section)}
                  className={`w-full px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                    selectedSection?.id === section.id
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>Section {section.section_name}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      selectedSection?.id === section.id
                        ? 'bg-white/20'
                        : 'bg-slate-100 dark:bg-slate-700'
                    }`}>
                      {section.student_count}/{section.capacity}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Section Content */}
      {selectedSection && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <Users className="text-blue-600 dark:text-blue-400" size={18} />
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Total Students</p>
              </div>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{students.length}</p>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                  <BookOpen className="text-emerald-600 dark:text-emerald-400" size={18} />
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Total Courses</p>
              </div>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{courses.length}</p>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                  <BarChart3 className="text-purple-600 dark:text-purple-400" size={18} />
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Grades Submitted</p>
              </div>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">
                {studentGrades.filter(sg => Object.keys(sg.grades).length > 0).length}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-100 dark:border-slate-800 p-6">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white">Grade Actions</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Process and calculate grades for this section</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleGenerateResults}
                  disabled={generatingResults || students.length === 0}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/10"
                >
                  {generatingResults ? 'Generating...' : 'Generate Results'}
                </button>
                <button
                  onClick={exportToCSV}
                  disabled={studentGrades.length === 0}
                  className="px-6 py-2.5 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-slate-600/10"
                >
                  <Download size={16} />
                  Export CSV
                </button>
              </div>
            </div>
          </div>

          {/* Grades Table */}
          {loadingSectionData ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400">Loading grades...</p>
              </div>
            </div>
          ) : (
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-100 dark:border-slate-800 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">Student Name</th>
                    {courses.map((course) => (
                      <th key={course.id} className="px-4 py-4 text-center text-xs font-bold text-slate-600 dark:text-slate-300 uppercase whitespace-nowrap">
                        {course.name}
                      </th>
                    ))}
                    <th className="px-4 py-4 text-center text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">Total</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">Average</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">Rank</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {studentGrades.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800 dark:text-white">{student.name}</div>
                      </td>
                      {courses.map((course) => (
                        <td key={course.id} className="px-4 py-4 text-center">
                          {student.grades[course.id] ? (
                            <div className="flex items-center justify-center gap-1">
                              <span className="font-semibold text-slate-800 dark:text-white">
                                {student.grades[course.id].score}
                              </span>
                              {student.grades[course.id].score && (
                                <CheckCircle2 className="text-emerald-500" size={14} />
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 text-sm">-</span>
                          )}
                        </td>
                      ))}
                      <td className="px-4 py-4 text-center font-semibold text-slate-800 dark:text-white">
                        {student.total ? student.total.toFixed(2) : '-'}
                      </td>
                      <td className="px-4 py-4 text-center font-semibold text-slate-800 dark:text-white">
                        {student.average ? student.average.toFixed(2) : '-'}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {student.rank ? (
                          <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-bold">
                            #{student.rank}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-sm">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {studentGrades.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-slate-500 dark:text-slate-400">No grades found for this section</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl border ${
            toast.type === 'success'
              ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/40 text-green-800 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-300'
          }`}>
            <CheckCircle2 className="text-emerald-500" size={20} />
            <p className="text-sm font-semibold">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};
