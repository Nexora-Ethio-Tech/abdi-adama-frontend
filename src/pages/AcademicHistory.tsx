import { useState } from 'react';
import { Calendar, GraduationCap, ChevronDown, BookOpen } from 'lucide-react';

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

export const AcademicHistory = () => {
  // Academic History Selector States (Dependent Dropdowns)
  const [selectedHistoryYear, setSelectedHistoryYear] = useState<string>('');
  const [selectedHistorySemester, setSelectedHistorySemester] = useState<string>('');

  // Resolve history data
  const historyKey = `${selectedHistoryYear}-${selectedHistorySemester}`;
  const historyCourses = historyDatabase[historyKey] || [];
  const semesterAverage = historyCourses.length > 0
    ? Math.round(historyCourses.reduce((sum, c) => sum + c.score, 0) / historyCourses.length)
    : 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Academic History</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Review your previous courses, semesters, and performance history.</p>
        </div>
      </div>

      {/* Filter Controls */}
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
  );
};
