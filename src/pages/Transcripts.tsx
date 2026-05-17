
import { useState, useEffect, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import { FileText, Download, ArrowLeft, Search, Filter, Printer, Calculator, Award, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { apiFetch } from '../utils/apiClient';
import { toast } from '../components/Toast';

export const Transcripts = () => {
  const navigate = useNavigate();
  const { role } = useUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [phase, setPhase] = useState<'Semester 1' | 'Final'>('Semester 1');
  const [students, setStudents] = useState<any[]>([]);
  const [calculatedRanks, setCalculatedRanks] = useState<Record<string, any>>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [loading, setLoading] = useState(true);

  const canManage = role === 'vice-principal' || role === 'super-admin' || role === 'school-admin';

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (filterGrade !== 'all') query.append('grade', filterGrade);
      if (searchTerm) query.append('search', searchTerm);
      
      const res = await apiFetch(`/api/academic/students?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.data || []);
      } else {
        toast.error('Failed to load student records.');
      }
    } catch {
      toast.error('Network error while fetching students.');
    } finally {
      setLoading(false);
    }
  }, [filterGrade, searchTerm]);

  useEffect(() => {
    if (canManage) {
      fetchStudents();
    }
  }, [fetchStudents, canManage]);

  const handleCalculate = async () => {
    setIsCalculating(true);
    try {
      const res = await apiFetch('/api/academic/transcripts/calculate-ranks', {
        method: 'POST',
        body: JSON.stringify({
          grade: filterGrade === 'all' ? null : filterGrade,
          phase: phase
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCalculatedRanks(data.data?.ranks || {});
        toast.success('Ranks calculated and finalized for the selected batch.');
      } else {
        toast.error('Server failed to compute ranks.');
      }
    } catch {
      toast.error('Network error during ranking calculation.');
    } finally {
      setIsCalculating(false);
    }
  };

  const exportCSV = () => {
    if (Object.keys(calculatedRanks).length === 0) {
      toast.error("Please calculate grades first.");
      return;
    }
    
    const headers = ['Student ID', 'Name', 'Grade', 'Average', 'Section Rank', 'Overall Rank'];
    const rows = students.map(s => {
      const data = calculatedRanks[s.id];
      if (!data) return [s.id, s.full_name || s.name, s.grade_level, 'N/A', 'N/A', 'N/A'];
      return [s.id, s.full_name || s.name, s.grade_level, `${data.avg}%`, `${data.sectionRank}/${data.totalInSection}`, `${data.overallRank}/${data.totalInGrade}`];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Grade_Report_${filterGrade}_${phase}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!canManage) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4 bg-white dark:bg-slate-900 rounded-2xl border border-rose-100 dark:border-rose-900/30">
        <div className="p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-full">
          <Award size={48} />
        </div>
        <h2 className="text-xl font-black text-rose-900 dark:text-rose-100 uppercase tracking-tight">Access Denied</h2>
        <p className="text-rose-600 font-medium">Only Vice Principals and Administrators can access transcripts.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <Breadcrumbs />
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline text-xs font-black uppercase tracking-widest"
        >
          <ArrowLeft size={14} />
          Back
        </button>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Transcript Management</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Generate and verify official academic transcripts.</p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
          <button
            onClick={() => setPhase('Semester 1')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${phase === 'Semester 1' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
          >
            Semester 1
          </button>
          <button
            onClick={() => setPhase('Final')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${phase === 'Final' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
          >
            Final Year-End
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 p-6 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-900 dark:to-indigo-900 rounded-[2.5rem] border border-blue-500/20 shadow-2xl shadow-blue-500/20 items-center justify-between text-white">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-white/10 backdrop-blur-md text-white rounded-2xl border border-white/20">
            <Award size={32} />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-tight">Academic Ranking Engine</h3>
            <p className="text-xs text-blue-100 font-medium opacity-80">Compute averages, section ranks, and batch standings for the {phase}.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCalculate}
            disabled={isCalculating}
            className="flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {isCalculating ? <Loader2 size={18} className="animate-spin" /> : <Calculator size={18} />}
            {isCalculating ? 'Computing...' : 'Calculate Ranks'}
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border border-white/10"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="relative md:col-span-2 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
          <input
            type="text"
            placeholder="Search by student name, ID or Grade Level..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-8 py-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-sm shadow-sm"
          />
        </div>
        <div className="relative group">
          <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
          <select
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
            className="w-full pl-14 pr-10 py-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none font-bold text-sm shadow-sm"
          >
            <option value="all">All Grades</option>
            {['KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map(g => (
              <option key={g} value={g}>Grade {g}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Accessing Student Matrix...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Student Identity</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Avg Score</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Batch Ranking</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Status</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Documents</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {students.map((student) => (
                  <tr key={student.id} className="group hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all duration-300">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-gradient-to-br from-slate-100 to-blue-50 dark:from-slate-800 dark:to-blue-900/20 text-slate-600 dark:text-slate-300 rounded-[1.5rem] flex items-center justify-center font-black text-lg shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-transform">
                          {(student.full_name || student.name)[0]}
                        </div>
                        <div>
                          <p className="text-base font-black text-slate-800 dark:text-white transition-colors group-hover:text-blue-600">{student.full_name || student.name}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-wider mt-1">Grade {student.grade_level || student.grade} • ID: {student.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className="text-base font-black text-slate-800 dark:text-slate-200">
                        {calculatedRanks[student.id] ? `${calculatedRanks[student.id].avg}%` : '---'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      {calculatedRanks[student.id] ? (
                        <div className="flex flex-col gap-1.5 items-center">
                          <span className="px-3 py-1 rounded-full text-[9px] font-black bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 uppercase tracking-widest border border-blue-200/50">
                            Sec: #{calculatedRanks[student.id].sectionRank} / {calculatedRanks[student.id].totalInSection}
                          </span>
                          <span className="px-3 py-1 rounded-full text-[9px] font-black bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 uppercase tracking-widest border border-amber-200/50">
                            Ovr: #{calculatedRanks[student.id].overallRank} / {calculatedRanks[student.id].totalInGrade}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-50 italic">Awaiting Calculation</span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                        calculatedRanks[student.id] 
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200/50' 
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border-slate-200'
                      }`}>
                        {calculatedRanks[student.id] ? 'Validated' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button className="p-3 text-amber-500 hover:text-white hover:bg-amber-500 bg-amber-50 dark:bg-amber-900/20 rounded-2xl transition-all hover:scale-110 shadow-sm" title="Merit Award">
                          <Award size={18} />
                        </button>
                        <button className="p-3 text-slate-400 dark:text-slate-600 hover:text-white hover:bg-blue-600 bg-slate-50 dark:bg-slate-800 rounded-2xl transition-all hover:scale-110 shadow-sm" title="Print Hardcopy">
                          <Printer size={18} />
                        </button>
                        <button
                          onClick={() => alert(`Opening Official Transcript for ${student.full_name || student.name}`)}
                          className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-blue-600 shadow-xl active:scale-95"
                        >
                          <FileText size={16} />
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-32 text-center text-slate-400 font-black uppercase tracking-[0.2em] text-xs">
                      No matching student records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

