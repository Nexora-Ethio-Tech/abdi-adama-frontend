import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, User, Calendar, GraduationCap, Search, Award, AlertCircle } from 'lucide-react';
import { StudentCourse, getMyGradesForSemester, getMyHistory } from '../services/studentPortalService';

export const StudentCourses = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const viewMode = location.pathname === '/attendance' ? 'history' : 'current';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Current Term state
  const [selectedSemester, setSelectedSemester] = useState('Second Semester');
  const [selectedYear, setSelectedYear] = useState('2025/2026');
  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<StudentCourse | null>(null);
  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  const [gradingMethods, setGradingMethods] = useState<Array<{ id: string; label: string; maxWeight: number }>>([]);
  const gradingWeightSum = useMemo(() => gradingMethods.reduce((sum, m) => sum + (m.maxWeight || 0), 0), [gradingMethods]);
  const weightSumError = gradingWeightSum !== 100;
  const [dropdownOpen, setDropdownOpen] = useState(false);



  // Academic History state
  const [historyYear, setHistoryYear] = useState<string | null>(null);
  const [historySemester, setHistorySemester] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<any>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Available academic years
  const academicYears = useMemo(() => ['2025/2026', '2024/2025', '2023/2024'], []);

  // Status check helper
  const getStatus = (course: any) => {
    if (!course || course.total === null || course.total === undefined) {
      return 'PENDING';
    }
    const totalScore = Number(course.total) || 0;
    return totalScore >= 50 ? 'PASSED' : 'FAILED';
  };

  // Fetch current term courses and grades
  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError('');
      const semNum = selectedSemester === 'First Semester' ? 1 : 2;
      const data = await getMyGradesForSemester(semNum, selectedYear);
      const coursesData = data.courses || [];
      const methods = data.gradingMethods || [];
      setCourses(coursesData);
      setGradingMethods(methods);
      if (coursesData.length > 0) {
        setSelectedCourse(coursesData[0]);
      } else {
        setSelectedCourse(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'current') {
      fetchCourses();
    }
  }, [viewMode, selectedSemester, selectedYear]);

  // Sync search input query when selected course changes
  useEffect(() => {
    if (selectedCourse) {
      setCourseSearchQuery(selectedCourse.name);
    } else {
      setCourseSearchQuery('');
    }
  }, [selectedCourse]);

  // Filter courses for searchable combobox
  const filteredCourses = useMemo(() => {
    const query = courseSearchQuery.trim().toLowerCase();
    if (!query || (selectedCourse && query === selectedCourse.name.toLowerCase())) {
      return courses;
    }
    return courses.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.code.toLowerCase().includes(query)
    );
  }, [courses, courseSearchQuery, selectedCourse]);

  // Fetch history data when both selections are made
  const loadHistoryData = async () => {
    if (!historyYear || !historySemester) return;

    try {
      setHistoryLoading(true);
      const semNum = historySemester === 'First Semester' ? 1 : 2;
      const data = await getMyHistory(historyYear, semNum);
      setHistoryData(data && data.length > 0 ? data[0] : null);
    } catch (err: any) {
      console.error(err);
      setHistoryData(null);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'history') {
      loadHistoryData();
    }
  }, [viewMode, historyYear, historySemester]);

  // Calculate semester average for history metrics
  const semesterAverage = useMemo(() => {
    if (!historyData || !historyData.courses) return 0;
    const scores = historyData.courses.map((c: any) => {
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
            onClick={() => navigate('/courses')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'current'
                ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-lg'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
          >
            Current Term
          </button>
          <button
            onClick={() => navigate('/attendance')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'history'
                ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-lg'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
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

      {/* CURRENT TERM VIEW */}
      {viewMode === 'current' ? (
        loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* First Div: Controls Row */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-8 shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Year Selector */}
                <div>
                  <label className="block text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-3">Academic Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => {
                      setSelectedYear(e.target.value);
                      setSelectedCourse(null);
                    }}
                    className="w-full appearance-none px-6 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all cursor-pointer text-slate-900 dark:text-white"
                  >
                    {academicYears.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                {/* Semester Selector */}
                <div>
                  <label className="block text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-3">Semester</label>
                  <select
                    value={selectedSemester}
                    onChange={(e) => {
                      setSelectedSemester(e.target.value);
                      setSelectedCourse(null);
                    }}
                    className="w-full appearance-none px-6 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all cursor-pointer text-slate-900 dark:text-white"
                  >
                    <option>First Semester</option>
                    <option>Second Semester</option>
                  </select>
                </div>

                {/* Searchable Course Dropdown (Combobox) */}
                <div className="relative">
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
                      onFocus={() => {
                        setDropdownOpen(true);
                        if (selectedCourse && courseSearchQuery === selectedCourse.name) {
                          setCourseSearchQuery('');
                        }
                      }}
                      onBlur={() => {
                        setTimeout(() => {
                          setDropdownOpen(false);
                          if (selectedCourse) {
                            setCourseSearchQuery(selectedCourse.name);
                          }
                        }, 250);
                      }}
                      className="w-full pl-12 pr-6 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all text-slate-900 dark:text-white"
                    />
                  </div>

                  {dropdownOpen && (
                    <div className="absolute z-50 left-0 right-0 mt-2 max-h-[250px] overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-2 space-y-1">
                      {filteredCourses.length > 0 ? (
                        filteredCourses.map((course) => (
                          <button
                            key={course.id}
                            type="button"
                            onMouseDown={() => {
                              setSelectedCourse(course);
                              setCourseSearchQuery(course.name);
                              setDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 rounded-xl transition-all ${selectedCourse?.id === course.id
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                              }`}
                          >
                            <p className="text-sm font-bold">{course.name}</p>
                            <p className="text-xs opacity-75">{course.code}</p>
                          </button>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500 text-center py-4">No courses found</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Second Div: Selected Course Metadata & Grades */}
            {selectedCourse ? (
              <div className="space-y-6">
                {/* Course Metadata Card with Course Progress on Right */}
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-8 shadow-lg">
                  <div className="flex items-start gap-8 justify-between">
                    <div className="flex items-center gap-5 flex-1">
                      <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
                        <BookOpen size={32} />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedCourse.name}</h2>
                        <div className="flex flex-wrap items-center gap-4 mt-3">
                          <span className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full">{selectedCourse.code}</span>
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-bold">
                            <User size={14} />
                            Instructor: {typeof selectedCourse.teacher === 'string' ? selectedCourse.teacher : (selectedCourse.teacher as any)?.name || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Course Progress - Compact Version on Right */}
                    <div className="shrink-0 w-48">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4 border border-blue-100 dark:border-slate-600">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                            <BookOpen size={16} />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-900 dark:text-white">Course Progress</h4>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">Your score</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-end">
                            <span className="text-3xl font-black text-blue-600 dark:text-blue-400">
                              {selectedCourse.total !== null && selectedCourse.total !== undefined ? Math.round(Number(selectedCourse.total)) : 0}%
                            </span>
                          </div>

                          <div className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${getStatus(selectedCourse) === 'PASSED'
                                  ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                                  : getStatus(selectedCourse) === 'FAILED'
                                    ? 'bg-gradient-to-r from-rose-400 to-red-500'
                                    : 'bg-gradient-to-r from-amber-400 to-orange-500'
                                }`}
                              style={{ width: `${selectedCourse.total !== null && selectedCourse.total !== undefined ? Math.min(100, Math.max(0, Number(selectedCourse.total))) : 0}%` }}
                            ></div>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center">Based on course completion</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grade Detail Table */}
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-lg overflow-hidden">
                  <div className="p-8">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6">Grade Details</h3>
                    {weightSumError && (
  <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 px-4 py-3 rounded-lg mb-4">
    <AlertCircle size={18} />
    <span>Grading weights total {gradingWeightSum}%, which does not equal 100%.</span>
  </div>
)}
<div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-800">
                          <tr>
                            <th className="px-6 py-4 font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-left">Assessment Component</th>
                            <th className="px-6 py-4 font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">Weight</th>
                            <th className="px-6 py-4 font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Your Mark</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {gradingMethods.length > 0 ? (
                            gradingMethods.map((method) => {
                              const gradeVal = selectedCourse.grades?.[method.id];
                              return (
                                <tr key={method.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                  <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">{method.label}</td>
                                  <td className="px-6 py-4 text-center text-slate-500 dark:text-slate-400 font-medium">{method.maxWeight}%</td>
                                  <td className="px-6 py-4 text-right font-black text-slate-800 dark:text-white">
                                    {gradeVal !== null && gradeVal !== undefined ? Number(gradeVal).toFixed(1) : '--'}
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <>
                              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">Quiz 1</td>
                                <td className="px-6 py-4 text-center text-slate-500 dark:text-slate-400 font-medium">10%</td>
                                <td className="px-6 py-4 text-right font-black text-slate-800 dark:text-white">
                                  {selectedCourse.quiz_10 !== null && selectedCourse.quiz_10 !== undefined ? Number(selectedCourse.quiz_10).toFixed(1) : '--'}
                                </td>
                              </tr>
                              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">Test</td>
                                <td className="px-6 py-4 text-center text-slate-500 dark:text-slate-400 font-medium">10%</td>
                                <td className="px-6 py-4 text-right font-black text-slate-800 dark:text-white">
                                  {selectedCourse.assignment_10 !== null && selectedCourse.assignment_10 !== undefined ? Number(selectedCourse.assignment_10).toFixed(1) : '--'}
                                </td>
                              </tr>
                              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">Assignment</td>
                                <td className="px-6 py-4 text-center text-slate-500 dark:text-slate-400 font-medium">--</td>
                                <td className="px-6 py-4 text-right font-black text-slate-800 dark:text-white">--</td>
                              </tr>
                              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">Midterm Exam</td>
                                <td className="px-6 py-4 text-center text-slate-500 dark:text-slate-400 font-medium">30%</td>
                                <td className="px-6 py-4 text-right font-black text-slate-800 dark:text-white">
                                  {selectedCourse.mid_30 !== null && selectedCourse.mid_30 !== undefined ? Number(selectedCourse.mid_30).toFixed(1) : '--'}
                                </td>
                              </tr>
                              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">Quiz 2</td>
                                <td className="px-6 py-4 text-center text-slate-500 dark:text-slate-400 font-medium">--</td>
                                <td className="px-6 py-4 text-right font-black text-slate-800 dark:text-white">--</td>
                              </tr>
                              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">Final Exam</td>
                                <td className="px-6 py-4 text-center text-slate-500 dark:text-slate-400 font-medium">50%</td>
                                <td className="px-6 py-4 text-right font-black text-slate-800 dark:text-white">
                                  {selectedCourse.final_50 !== null && selectedCourse.final_50 !== undefined ? Number(selectedCourse.final_50).toFixed(1) : '--'}
                                </td>
                              </tr>
                            </>
                          )}
                          <tr className="bg-slate-50/30 dark:bg-slate-800/20 font-black">
                            <td className="px-6 py-4 text-blue-600 dark:text-blue-400">Total Score</td>
                            <td className="px-6 py-4 text-center text-blue-600 dark:text-blue-400">100%</td>
                            <td className="px-6 py-4 text-right text-emerald-600 dark:text-emerald-400 text-base">
                              {selectedCourse.total !== null && selectedCourse.total !== undefined ? Number(selectedCourse.total).toFixed(1) : '--'}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Status and Progress Bar Container */}
                    <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Academic Standing</p>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Course Status:</span>
                            {(() => {
                              const status = getStatus(selectedCourse);
                              if (status === 'PASSED') {
                                return (
                                  <span className="px-3.5 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 rounded-full text-xs font-black tracking-widest uppercase">
                                    PASSED
                                  </span>
                                );
                              } else if (status === 'FAILED') {
                                return (
                                  <span className="px-3.5 py-1 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 rounded-full text-xs font-black tracking-widest uppercase">
                                    FAILED
                                  </span>
                                );
                              } else {
                                return (
                                  <span className="px-3.5 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 rounded-full text-xs font-black tracking-widest uppercase">
                                    PENDING
                                  </span>
                                );
                              }
                            })()}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-2xl font-black text-slate-800 dark:text-white">
                            {selectedCourse.total !== null && selectedCourse.total !== undefined ? Number(selectedCourse.total).toFixed(1) : '--'}
                          </span>
                          <span className="text-sm text-slate-400 font-bold"> / 100</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400">
                          <span>Total Score Progress</span>
                          <span>{selectedCourse.total !== null && selectedCourse.total !== undefined ? Math.round(Number(selectedCourse.total)) + '%' : '0%'}</span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${getStatus(selectedCourse) === 'PASSED'
                                ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                                : getStatus(selectedCourse) === 'FAILED'
                                  ? 'bg-gradient-to-r from-rose-400 to-red-500'
                                  : 'bg-gradient-to-r from-amber-400 to-orange-500'
                              }`}
                            style={{ width: `${selectedCourse.total !== null && selectedCourse.total !== undefined ? Math.min(100, Math.max(0, Number(selectedCourse.total))) : 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-12 text-center text-slate-500 dark:text-slate-400">
                <p className="font-bold text-lg">No courses found for the selected Academic Year and Semester.</p>
              </div>
            )}
          </div>
        )
      ) : (
        // ACADEMIC HISTORY VIEW
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-8 shadow-lg">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
                <GraduationCap size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Academic History</h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">Archive of verified results</p>
              </div>
            </div>

            {/* First Div: Year and Semester selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-3">Select Academic Year</label>
                <select
                  value={historyYear || ''}
                  onChange={(e) => {
                    setHistoryYear(e.target.value || null);
                    setHistoryData(null);
                  }}
                  className="w-full appearance-none px-6 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all cursor-pointer text-slate-900 dark:text-white"
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
                  value={historySemester || ''}
                  onChange={(e) => {
                    setHistorySemester(e.target.value || null);
                    setHistoryData(null);
                  }}
                  disabled={!historyYear}
                  className="w-full appearance-none px-6 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 dark:text-white"
                >
                  <option value="">-- Select Semester --</option>
                  <option>First Semester</option>
                  <option>Second Semester</option>
                </select>
              </div>
            </div>

            {/* Metrics Header */}
            {historyYear && historySemester && historyData && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3 mb-3">
                    <Calendar size={16} className="text-blue-600" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Academic Year</span>
                  </div>
                  <p className="text-xl font-black text-slate-800 dark:text-white">{historyYear}</p>
                </div>

                <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3 mb-3">
                    <BookOpen size={16} className="text-purple-600" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Semester</span>
                  </div>
                  <p className="text-xl font-black text-slate-800 dark:text-white">{historySemester}</p>
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

            {/* Second Div: History Data Table with Subject and Total columns */}
            {historyLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : historyData && historyData.courses ? (
              <div className="overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Subject</th>
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
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
            ) : historyYear && historySemester ? (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                <p className="font-medium">No results found for the selected period.</p>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                <p className="font-medium">Select both Academic Year and Semester to load results.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
