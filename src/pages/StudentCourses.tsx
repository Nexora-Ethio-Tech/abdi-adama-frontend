
import { studentCurrentCourses, studentAcademicHistory } from '../data/mockData';
import { BookOpen, User, Calendar, GraduationCap, Search } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { getMyCourses, getMyGrades, StudentCourse, StudentGrade } from '../services/studentPortalService';

export const StudentCourses = () => {
  const [viewMode, setViewMode] = useState<'current' | 'history'>('current');
  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Current Term state
  const [selectedSemester, setSelectedSemester] = useState('First Semester');
  const [selectedCourse, setSelectedCourse] = useState<StudentCourse | null>(null);
  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Academic History state
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string | null>(null);
  const [selectedHistorySemester, setSelectedHistorySemester] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<any>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (viewMode === 'current') {
      fetchCourses();
    }
  }, [viewMode]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError('');
      const coursesData = await getMyCourses();
      setCourses(coursesData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Generate past academic years relative to 2026
  const academicYears = useMemo(() => {
    const years = [];
    for (let i = 3; i >= 0; i--) {
      const startYear = 2026 - i - 1;
      const endYear = startYear + 1;
      years.push(`${startYear}/${String(endYear).slice(-2)}`);
    }
    return years;
  }, []);

  // Filter courses by search query
  const filteredCourses = useMemo(() => {
    return courses.filter(c =>
      c.name.toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(courseSearchQuery.toLowerCase())
    );
  }, [courses, courseSearchQuery]);

  // Auto-load history data when both year and semester are selected
  useEffect(() => {
    if (selectedAcademicYear && selectedHistorySemester) {
      loadHistoryData();
    }
  }, [selectedAcademicYear, selectedHistorySemester]);

  const loadHistoryData = () => {
    if (!selectedAcademicYear || !selectedHistorySemester) return;

    setHistoryLoading(true);
    // Simulate fetching history data
    setTimeout(() => {
      const matchingHistory = studentAcademicHistory.find(
        h => h.year === selectedAcademicYear && h.semester.toLowerCase().includes(selectedHistorySemester.toLowerCase())
      );
      setHistoryData(matchingHistory || null);
      setHistoryLoading(false);
    }, 300);
  };

  // Calculate semester average
  const semesterAverage = useMemo(() => {
    if (!historyData || !historyData.courses) return 0;
    const scores = historyData.courses.map((c: any) => {
      // Extract numeric value from percentage string if needed
      const numScore = typeof c.score === 'string' ? parseFloat(c.score) : c.score;
      return isNaN(numScore) ? 0 : numScore;
    });
    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length);
  }, [historyData]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header & Tab Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Grades & Courses</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium italic">Track your real-time academic performance across semesters.</p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 w-full md:w-fit">
          <button
            onClick={() => setViewMode('current')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'current'
                ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-lg'
                : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            Current Term
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'history'
                ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-lg'
                : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            Academic History
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* CURRENT TERM TAB */}
      {viewMode === 'current' ? (
        loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Course Progress Summary Card - KEEP EXACTLY AS IS */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 rounded-[2rem] border border-blue-100 dark:border-slate-700 p-8 shadow-lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Course Progress</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Overview of your current semester</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(courses.length > 0 ? courses : studentCurrentCourses).map((course) => {
                  const courseProgress = (course as any).progress || 65;
                  return (
                    <div key={course.id} className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-blue-100 dark:border-slate-700">
                      <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">{course.name}</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-black text-blue-600">{courseProgress}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Controls Row - Semester & Course Selector */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-8 shadow-lg">
              <div className="space-y-6">
                {/* Semester Dropdown */}
                <div>
                  <label className="block text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-3">Select Semester</label>
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    className="w-full appearance-none px-6 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option>First Semester</option>
                    <option>Second Semester</option>
                  </select>
                </div>

                {/* Searchable Course Combobox */}
                <div>
                  <label className="block text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-3">Search & Select Course</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      placeholder="Type course name or code..."
                      value={courseSearchQuery}
                      onChange={(e) => {
                        setCourseSearchQuery(e.target.value);
                        setDropdownOpen(true);
                      }}
                      onFocus={() => setDropdownOpen(true)}
                      className="w-full pl-12 pr-6 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all"
                    />
                  </div>

                  {/* Dropdown List */}
                  {dropdownOpen && (
                    <div className="mt-3 max-h-[300px] overflow-y-auto space-y-2 bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                      {filteredCourses.length > 0 ? (
                        filteredCourses.map((course) => (
                          <button
                            key={course.id}
                            onClick={() => {
                              setSelectedCourse(course);
                              setCourseSearchQuery('');
                              setDropdownOpen(false);
                            }}
                            className={`w-full text-left p-3 rounded-xl transition-all ${selectedCourse?.id === course.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-blue-50 dark:hover:bg-slate-600'
                              }`}
                          >
                            <p className="font-bold">{course.name}</p>
                            <p className="text-xs opacity-70">{course.code}</p>
                          </button>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500 text-center py-4">No courses found</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Selected Course Details - Metadata Card */}
            {selectedCourse && (
              <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-8 shadow-lg">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <BookOpen size={32} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedCourse.name}</h2>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full">{selectedCourse.code}</span>
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-bold">
                        <User size={14} />
                        Instructor: {selectedCourse.teacher.name}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Grade Detail Table - Raw Numerical Scores Only */}
            {selectedCourse && (
              <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-lg overflow-hidden">
                <div className="p-8">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6">Grade Details</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-800/50">
                        <tr>
                          <th className="px-4 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Quiz 1</th>
                          <th className="px-4 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Test</th>
                          <th className="px-4 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Mid</th>
                          <th className="px-4 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Quiz 2</th>
                          <th className="px-4 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Assignment</th>
                          <th className="px-4 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Final</th>
                          <th className="px-4 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors border-t border-slate-100 dark:border-slate-800">
                          <td className="px-4 py-6">
                            <div className="flex justify-center items-center w-10 h-10 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg font-bold text-sm mx-auto">
                              {(selectedCourse as any).quiz_1 ?? '--'}
                            </div>
                          </td>
                          <td className="px-4 py-6">
                            <div className="flex justify-center items-center w-10 h-10 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-sm mx-auto">
                              {(selectedCourse as any).test_1 ?? '--'}
                            </div>
                          </td>
                          <td className="px-4 py-6">
                            <div className="flex justify-center items-center w-10 h-10 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-sm mx-auto">
                              {(selectedCourse as any).mid_exam ?? '--'}
                            </div>
                          </td>
                          <td className="px-4 py-6">
                            <div className="flex justify-center items-center w-10 h-10 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-sm mx-auto">
                              {(selectedCourse as any).quiz_2 ?? '--'}
                            </div>
                          </td>
                          <td className="px-4 py-6">
                            <div className="flex justify-center items-center w-10 h-10 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-sm mx-auto">
                              {(selectedCourse as any).participation ?? '--'}
                            </div>
                          </td>
                          <td className="px-4 py-6">
                            <div className="flex justify-center items-center w-10 h-10 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-sm mx-auto">
                              {(selectedCourse as any).final_exam ?? '--'}
                            </div>
                          </td>
                          <td className="px-4 py-6">
                            <div className="flex justify-center items-center min-w-12 h-10 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg font-bold text-sm mx-auto">
                              {(selectedCourse as any).total ?? '--'}
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      ) : (
        // ACADEMIC HISTORY TAB
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-8 shadow-lg">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <GraduationCap size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Academic History</h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">Archive of verified results</p>
              </div>
            </div>

            {/* Filter Controls - Dependent Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-3">Select Academic Year</label>
                <select
                  value={selectedAcademicYear || ''}
                  onChange={(e) => {
                    setSelectedAcademicYear(e.target.value || null);
                    setSelectedHistorySemester(null);
                    setHistoryData(null);
                  }}
                  className="w-full appearance-none px-6 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all cursor-pointer"
                >
                  <option value="">-- Select Year --</option>
                  {academicYears.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-3">Select Semester</label>
                <select
                  value={selectedHistorySemester || ''}
                  onChange={(e) => setSelectedHistorySemester(e.target.value || null)}
                  disabled={!selectedAcademicYear}
                  className="w-full appearance-none px-6 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">-- Select Semester --</option>
                  <option value="First Semester">First Semester</option>
                  <option value="Second Semester">Second Semester</option>
                </select>
              </div>
            </div>

            {/* Metrics Header - Shows only when both selections made */}
            {selectedAcademicYear && selectedHistorySemester && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3 mb-3">
                    <Calendar size={16} className="text-blue-600" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Academic Year</span>
                  </div>
                  <p className="text-xl font-black text-slate-800 dark:text-white">{selectedAcademicYear}</p>
                </div>

                <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3 mb-3">
                    <BookOpen size={16} className="text-purple-600" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Semester</span>
                  </div>
                  <p className="text-xl font-black text-slate-800 dark:text-white">{selectedHistorySemester}</p>
                </div>

                <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3 mb-3">
                    <GraduationCap size={16} className="text-emerald-600" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Semester Average</span>
                  </div>
                  <p className="text-xl font-black text-slate-800 dark:text-white">{semesterAverage}%</p>
                </div>
              </div>
            )}

            {/* Academic History Table - Two Columns Only */}
            {historyLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : historyData && historyData.courses ? (
              <div className="overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Subject/Course Name</th>
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Numeric Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {historyData.courses.map((course: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-8 py-5">
                          <p className="font-bold text-slate-800 dark:text-white">{course.name}</p>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <span className="inline-flex items-center px-4 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-sm font-black">
                            {typeof course.score === 'string' && course.score.includes('%') ? course.score : `${course.score}%`}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : selectedAcademicYear && selectedHistorySemester ? (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                <p className="font-medium">No data available for the selected period</p>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                <p className="font-medium">Select both Academic Year and Semester to view historical data</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

