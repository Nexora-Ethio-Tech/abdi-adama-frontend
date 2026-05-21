import { studentCurrentCourses } from '../data/mockData';
import { BookOpen, User, CheckCircle2, Circle, AlertCircle, Calendar, GraduationCap, ChevronDown, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getMyCourses, getMyGrades } from '../services/studentPortalService';
import type { StudentCourse, StudentGrade } from '../services/studentPortalService';

// History lookup database with 11 courses to demonstrate dynamic row rendering
const historyDatabase: Record<string, Array<{ name: string; score: number }>> = {
  '2024/2025-First Semester': [
    { name: 'Amharic', score: 89 },
    { name: 'English', score: 93 },
    { name: 'General Science', score: 84 },
    { name: 'Art', score: 98 },
    { name: 'Mathematics', score: 85 },
    { name: 'Physics', score: 88 },
    { name: 'Chemistry', score: 82 },
    { name: 'Civics', score: 91 },
    { name: 'Physical Education', score: 95 },
    { name: 'Biology', score: 87 },
    { name: 'IT', score: 90 }
  ],
  '2024/2025-Second Semester': [
    { name: 'Amharic', score: 92 },
    { name: 'English', score: 95 },
    { name: 'Chemistry', score: 88 },
    { name: 'Civics', score: 90 },
    { name: 'Mathematics', score: 91 },
    { name: 'Physics', score: 87 },
    { name: 'Biology', score: 93 },
    { name: 'History', score: 86 },
    { name: 'Geography', score: 89 }
  ],
  '2023/2024-First Semester': [
    { name: 'Mathematics', score: 84 },
    { name: 'Physics', score: 88 },
    { name: 'Biology', score: 92 },
    { name: 'Geography', score: 80 },
    { name: 'Amharic', score: 87 },
    { name: 'English', score: 89 }
  ],
  '2023/2024-Second Semester': [
    { name: 'Mathematics', score: 87 },
    { name: 'Physics', score: 90 },
    { name: 'Biology', score: 94 },
    { name: 'Geography', score: 82 },
    { name: 'Amharic', score: 91 },
    { name: 'English', score: 92 }
  ]
};

export const StudentCourses = () => {
  const [viewMode, setViewMode] = useState<'current' | 'history'>('current');
  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [grades, setGrades] = useState<StudentGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Grades & Courses Tab States
  const [selectedSemester, setSelectedSemester] = useState<'First Semester' | 'Second Semester'>('Second Semester');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Academic History Tab States
  const [selectedHistoryYear, setSelectedHistoryYear] = useState<string>('');
  const [selectedHistorySemester, setSelectedHistorySemester] = useState<string>('');

  useEffect(() => {
    if (viewMode === 'current') {
      fetchCourses();
    }
  }, [viewMode]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError('');
      const [coursesData, gradesData] = await Promise.all([
        getMyCourses(),
        getMyGrades()
      ]);
      setCourses(coursesData);
      setGrades(gradesData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Resolve active list of current courses from API or Fallback mock data
  const activeCoursesList = courses.length > 0
    ? courses.map(c => ({
        id: c.id,
        name: c.name,
        code: c.code,
        progress: c.currentGrade || 0,
        teacherName: c.teacher?.name || 'Unknown'
      }))
    : studentCurrentCourses.map(c => ({
        id: c.id,
        name: c.name,
        code: c.code,
        progress: c.progress,
        teacherName: c.teacher
      }));

  // Set default selected course once data is loaded - disabled to allow empty placeholder state
  // useEffect(() => {
  //   if (activeCoursesList.length > 0 && !selectedCourseId) {
  //     setSelectedCourseId(activeCoursesList[0].id);
  //     setSearchQuery(activeCoursesList[0].name);
  //   }
  // }, [activeCoursesList]);

  // Filter courses by typed search term
  const filteredCourses = activeCoursesList.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCourse = activeCoursesList.find(c => c.id === selectedCourseId);

  // Resolve detailed absolute raw grades for the selected course
  const getGradeDetail = (courseId: string, isFirstSemester: boolean) => {
    if (grades.length > 0) {
      const courseGrades = grades.filter(g => g.courseId === courseId);
      const findScore = (type: string) => {
        const g = courseGrades.find(item => item.assessmentType.toLowerCase().includes(type.toLowerCase()));
        return g ? `${g.score}/${g.maxScore}` : '---';
      };
      return {
        quiz1: findScore('Quiz 1'),
        test: findScore('Test'),
        mid: findScore('Mid'),
        quiz2: findScore('Quiz 2'),
        assignment: findScore('Assignment'),
        final: findScore('Final'),
        total: courses.find(c => c.id === courseId)?.currentGrade ? `${courses.find(c => c.id === courseId)?.currentGrade}%` : '---'
      };
    }

    // Fallback Mock Data matching First & Second Semester requirements
    if (isFirstSemester) {
      const mockFirstSem: Record<string, any> = {
        'c1': { quiz1: '18/20', test: '36/40', mid: '85/100', quiz2: '17/20', assignment: '19/20', final: '92/100', total: '90%' },
        'c2': { quiz1: '16/20', test: '34/40', mid: '82/100', quiz2: '15/20', assignment: '18/20', final: '88/100', total: '86%' },
        'c3': { quiz1: '19/20', test: '38/40', mid: '90/100', quiz2: '18/20', assignment: '20/20', final: '94/100', total: '93%' }
      };
      return mockFirstSem[courseId] || { quiz1: '---', test: '---', mid: '---', quiz2: '---', assignment: '---', final: '---', total: '---' };
    } else {
      const mockSecondSem: Record<string, any> = {
        'c1': { quiz1: '15/20', test: '32/40', mid: '---', quiz2: '---', assignment: '18/20', final: '---', total: '65%' },
        'c2': { quiz1: '12/20', test: '---', mid: '---', quiz2: '---', assignment: '15/20', final: '---', total: '40%' },
        'c3': { quiz1: '18/20', test: '38/40', mid: '88/100', quiz2: '19/20', assignment: '20/20', final: '---', total: '80%' }
      };
      return mockSecondSem[courseId] || { quiz1: '---', test: '---', mid: '---', quiz2: '---', assignment: '---', final: '---', total: '---' };
    }
  };

  const gradeDetail = selectedCourse ? getGradeDetail(selectedCourse.id, selectedSemester === 'First Semester') : null;

  // Resolve history data
  const historyKey = `${selectedHistoryYear}-${selectedHistorySemester}`;
  const historyCourses = historyDatabase[historyKey] || [];
  const semesterAverage = historyCourses.length > 0
    ? Math.round(historyCourses.reduce((sum, c) => sum + c.score, 0) / historyCourses.length)
    : 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Grades & Courses</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium italic">Track your real-time academic performance across semesters.</p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 w-full md:w-fit">
          <button
            onClick={() => setViewMode('current')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              viewMode === 'current'
                ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-lg'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Current Term
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              viewMode === 'history'
                ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-lg'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Academic History
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {viewMode === 'current' ? (
        loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* 1. Course Progress Cards Grid at the top */}
            <div className="w-full">
              {selectedCourse ? (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/30 dark:shadow-none hover:border-blue-500/50 transition-all duration-300">
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base line-clamp-1">{selectedCourse.name}</h3>
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 rounded-md mt-1.5 inline-block">{selectedCourse.code}</span>
                    </div>
                    <span className="text-sm font-black text-blue-600 dark:text-blue-400">{selectedCourse.progress}% Progress</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-50 dark:border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000"
                      style={{ width: `${selectedCourse.progress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 font-bold shadow-xl shadow-slate-200/30 dark:shadow-none">
                  Select a course to view term progress
                </div>
              )}
            </div>

            {/* 2. Controls Row: Semester Dropdown and Course Combobox */}
            <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/30 dark:shadow-none relative">
              {/* Semester Dropdown */}
              <div className="relative md:w-64">
                <label className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-2">Select Semester</label>
                <div className="relative">
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value as any)}
                    className="w-full appearance-none pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition-all cursor-pointer text-slate-800 dark:text-slate-100"
                  >
                    <option value="First Semester">First Semester</option>
                    <option value="Second Semester">Second Semester</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>
              </div>

              {/* Searchable Course Dropdown (Combobox style) */}
              <div className="relative flex-1">
                <label className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-2">Search Course</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Type course name to filter..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setDropdownOpen(true);
                    }}
                    onFocus={() => setDropdownOpen(true)}
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition-all text-slate-800 dark:text-slate-100"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setDropdownOpen(false);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-lg font-bold"
                    >
                      &times;
                    </button>
                  )}
                </div>

                {dropdownOpen && (
                  <div className="absolute left-0 right-0 mt-2 max-h-60 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-50">
                    {filteredCourses.length > 0 ? (
                      filteredCourses.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setSelectedCourseId(c.id);
                            setSearchQuery(c.name);
                            setDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-300 transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0"
                        >
                          {c.name} ({c.code})
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-slate-400 italic">No courses match search</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 3. Dynamic Course Detail & Grades Table */}
            {selectedCourse && gradeDetail ? (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none animate-in fade-in duration-300">
                <div className="flex items-center gap-5 mb-8">
                  <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 dark:shadow-none">
                    <BookOpen size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">{selectedCourse.name}</h2>
                    <div className="flex items-center gap-4 mt-1.5">
                      <span className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full">{selectedCourse.code}</span>
                      <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 font-bold">
                        <User size={14} className="text-slate-400" />
                        Instructor: {selectedCourse.teacherName}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800/50">
                        <tr>
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Quiz 1</th>
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Test</th>
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Mid</th>
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Quiz 2</th>
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Assignment</th>
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Final</th>
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-5 text-center text-sm font-bold text-slate-800 dark:text-white">{gradeDetail.quiz1}</td>
                          <td className="px-6 py-5 text-center text-sm font-bold text-slate-800 dark:text-white">{gradeDetail.test}</td>
                          <td className="px-6 py-5 text-center text-sm font-bold text-slate-800 dark:text-white">{gradeDetail.mid}</td>
                          <td className="px-6 py-5 text-center text-sm font-bold text-slate-800 dark:text-white">{gradeDetail.quiz2}</td>
                          <td className="px-6 py-5 text-center text-sm font-bold text-slate-800 dark:text-white">{gradeDetail.assignment}</td>
                          <td className="px-6 py-5 text-center text-sm font-bold text-slate-800 dark:text-white">{gradeDetail.final}</td>
                          <td className="px-6 py-5 text-center text-sm font-black text-blue-600 dark:text-blue-400">{gradeDetail.total}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 p-12 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 text-center text-slate-400 italic">
                Select a course to view detailed scores
              </div>
            )}
          </div>
        )
      ) : (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Controls Row for Academic History */}
          <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/30 dark:shadow-none">
            {/* Academic Year Dropdown Selector */}
            <div className="relative md:w-64">
              <label className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-2">Academic Year</label>
              <div className="relative">
                <select
                  value={selectedHistoryYear}
                  onChange={(e) => setSelectedHistoryYear(e.target.value)}
                  className="w-full appearance-none pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition-all cursor-pointer text-slate-800 dark:text-slate-100"
                >
                  <option value="">Select Academic Year...</option>
                  <option value="2024/2025">2024/2025</option>
                  <option value="2023/2024">2023/2024</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              </div>
            </div>

            {/* Semester Dropdown Selector */}
            <div className="relative md:w-64">
              <label className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-2">Semester</label>
              <div className="relative">
                <select
                  value={selectedHistorySemester}
                  onChange={(e) => setSelectedHistorySemester(e.target.value)}
                  className="w-full appearance-none pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition-all cursor-pointer text-slate-800 dark:text-slate-100"
                >
                  <option value="">Select Semester...</option>
                  <option value="First Semester">First Semester</option>
                  <option value="Second Semester">Second Semester</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              </div>
            </div>
          </div>

          {/* Academic History View or Placeholder */}
          {selectedHistoryYear && selectedHistorySemester ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none animate-in fade-in duration-300">
              
              {/* Metrics Header: Collective Semester Average */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3 mb-3">
                    <Calendar size={16} className="text-blue-600" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Academic Year</span>
                  </div>
                  <p className="text-xl font-black text-slate-800 dark:text-white">{selectedHistoryYear}</p>
                </div>
                <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3 mb-3">
                    <BookOpen size={16} className="text-purple-600" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Term/Semester</span>
                  </div>
                  <p className="text-xl font-black text-slate-800 dark:text-white">{selectedHistorySemester}</p>
                </div>
                <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3 mb-3">
                    <GraduationCap size={16} className="text-emerald-600" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Semester Average</span>
                  </div>
                  <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">Semester Average: {semesterAverage}%</p>
                </div>
              </div>

              {/* Dynamic Academic History Table */}
              <div className="overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Subject/Course Name</th>
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Numeric Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {historyCourses.map((course, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-8 py-5">
                          <p className="font-bold text-slate-800 dark:text-white">{course.name}</p>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <span className="inline-flex items-center px-4 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-sm font-black">
                            {course.score}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none text-center py-16">
              <div className="w-16 h-16 bg-blue-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto mb-4">
                <GraduationCap size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Academic History Lookup</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto text-sm font-medium">
                Select both a past Academic Year and Semester above to load historical course lists and calculate the collective Semester Average.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
