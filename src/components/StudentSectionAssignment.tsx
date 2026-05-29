import { useState, useEffect } from 'react';
import { ChevronDown, Loader2, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import * as sectionService from '../services/sectionService';
import { useUser } from '../context/UserContext';

interface AssignmentResult {
  success: boolean;
  studentId: string;
  toSection: string;
  message: string;
}

export const StudentSectionAssignment = () => {
  const { branch_id } = useUser();

  // Auto-distribute mode state
  const [selectedGrade, setSelectedGrade] = useState('');
  const [loading, setLoading] = useState(false);
  const [distributing, setDistributing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{
    successful: number;
    failed: number;
    results: AssignmentResult[];
  } | null>(null);
  const [showResults, setShowResults] = useState(false);

  const grades = [
    '7', '8', '9', '10', '11', '12'
  ];

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

      if (result.successful > 0) {
        setTimeout(() => {
          setError(null);
        }, 3000);
      }
    } catch (err: any) {
      const message = err.response?.data?.error?.message ||
        err.message ||
        'Failed to auto-distribute students';
      setError(message);
      console.error('Auto-distribute error:', err);
    } finally {
      setDistributing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Student Section Assignment</h2>

      {/* Auto-Distribute Mode */}
      <div className="space-y-6">
        {/* Grade Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Select Grade to Auto-Distribute Unassigned Students
          </label>
          <div className="relative">
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg appearance-none bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Grade --</option>
              {grades.map(grade => (
                <option key={grade} value={grade}>
                  Grade {grade}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          </div>
          <p className="mt-2 text-sm text-slate-600">
            All students in the selected grade without an assigned section will be automatically distributed across available sections.
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Auto-Distribute Button */}
        <button
          onClick={handleAutoDistribute}
          disabled={distributing || !selectedGrade}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
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

        {/* Results Display */}
        {showResults && results && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-slate-600">Successfully Assigned</p>
                <p className="text-2xl font-bold text-green-600">{results.successful}</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-slate-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">{results.failed}</p>
              </div>
            </div>

            {/* Results List */}
            {results.results.length > 0 && (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-100 p-3 border-b border-slate-200">
                  <h3 className="font-medium text-slate-900 text-sm">Assignment Details</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {results.results.map((result, idx) => (
                    <div
                      key={idx}
                      className={`p-3 border-b border-slate-200 last:border-b-0 ${result.success ? 'bg-green-50' : 'bg-red-50'
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        {result.success ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 text-sm">
                          <p className={result.success ? 'text-green-900' : 'text-red-900'}>
                            {result.message}
                          </p>
                          {result.success && result.toSection && (
                            <p className="text-xs text-green-700 mt-1">
                              Assigned to: {result.toSection}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Clear Results Button */}
            <button
              onClick={() => {
                setShowResults(false);
                setResults(null);
                setSelectedGrade('');
              }}
              className="w-full bg-slate-200 hover:bg-slate-300 text-slate-900 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Clear Results
            </button>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">How it works:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Select a grade from the dropdown</li>
            <li>✓ Click "Auto-Distribute Unassigned Students"</li>
            <li>✓ All students without assigned sections in that grade will be distributed fairly</li>
            <li>✓ Distribution uses round-robin to balance load across available sections</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
