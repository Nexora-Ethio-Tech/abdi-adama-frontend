import { useState } from 'react';
import { ChevronDown, Loader2, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import * as sectionService from '../services/sectionService';

interface AssignmentResult {
  success: boolean;
  studentId: string;
  toSection: string;
  message: string;
}

export const StudentSectionAssignment = () => {
  const [selectedGrade, setSelectedGrade] = useState('');
  const [distributing, setDistributing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{
    successful: number;
    failed: number;
    results: AssignmentResult[];
  } | null>(null);
  const [showResults, setShowResults] = useState(false);

  const grades = Array.from({ length: 12 }, (_, i) => String(i + 1));

  const handleAutoDistribute = async () => {
    if (!selectedGrade) {
      setError('Please select a grade');
      return;
    }

    setDistributing(true);
    setError(null);
    setShowResults(false);

    try {
      const result = await sectionService.autoDistributeStudents(selectedGrade);
      setResults(result);
      setShowResults(true);

      if (result.successful === 0 && result.failed === 0) {
        setError(
          `No unassigned students found for Grade ${selectedGrade}. Confirm students exist with no section and matching grade.`
        );
      }
    } catch (err: any) {
      const message =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Failed to auto-distribute students';
      setError(message);
      console.error('Auto-distribute error:', err);
    } finally {
      setDistributing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-6 max-w-2xl">
      <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6">
        Student Section Assignment
      </h2>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">
            Select Grade to Auto-Distribute Unassigned Students
          </label>
          <div className="relative">
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl appearance-none bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Grade (1–12) --</option>
              {grades.map((grade) => (
                <option key={grade} value={grade}>
                  Grade {grade}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          </div>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Students in this grade without a section will be distributed across available class
            sections (round-robin).
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</p>
          </div>
        )}

        <button
          onClick={handleAutoDistribute}
          disabled={distributing || !selectedGrade}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {distributing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Distributing...
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5" />
              Auto-Distribute Unassigned Students
            </>
          )}
        </button>

        {showResults && results && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">Successfully Assigned</p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {results.successful}
                </p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">Failed</p>
                <p className="text-2xl font-black text-red-600 dark:text-red-400">{results.failed}</p>
              </div>
            </div>

            {results.results.length > 0 && (
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-800 p-3 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Assignment Details
                  </h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {results.results.map((result, idx) => (
                    <div
                      key={idx}
                      className={`p-3 border-b border-slate-100 dark:border-slate-800 last:border-b-0 ${
                        result.success
                          ? 'bg-emerald-50/50 dark:bg-emerald-900/10'
                          : 'bg-red-50/50 dark:bg-red-900/10'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {result.success ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 text-sm">
                          <p
                            className={
                              result.success
                                ? 'text-emerald-900 dark:text-emerald-200'
                                : 'text-red-900 dark:text-red-200'
                            }
                          >
                            {result.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setShowResults(false);
                setResults(null);
                setError(null);
              }}
              className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold py-2.5 px-4 rounded-xl transition-colors"
            >
              Clear Results
            </button>
          </div>
        )}

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <h3 className="font-bold text-blue-900 dark:text-blue-200 mb-2">How it works</h3>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
            <li>Select grades 1–12 from the dropdown</li>
            <li>Click Auto-Distribute to assign all unassigned students in that grade</li>
            <li>Sections are created under Classes (e.g. Grade 7, Section A)</li>
            <li>Load is balanced evenly across sections with available capacity</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
