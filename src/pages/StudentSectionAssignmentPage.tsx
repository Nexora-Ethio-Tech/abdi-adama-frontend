import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { StudentSectionAssignment } from '../components/StudentSectionAssignment';

export const StudentSectionAssignmentPage = () => {
  const navigate = useNavigate();
  const { role } = useUser();

  useEffect(() => {
    if (role !== 'school-admin' && role !== 'super-admin') {
      navigate('/');
    }
  }, [role, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-bold text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
            Manage Student Sections
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Auto-distribute unassigned students fairly across available sections by grade
          </p>
        </div>

        <StudentSectionAssignment />

        <div className="mt-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl p-6 text-sm text-slate-600 dark:text-slate-400">
          <h3 className="font-bold text-slate-900 dark:text-white mb-3">Key Features</h3>
          <ul className="space-y-2 list-disc list-inside">
            <li>
              <strong className="text-slate-800 dark:text-slate-200">Auto-Distribution:</strong>{' '}
              Round-robin assignment across sections with open capacity
            </li>
            <li>
              <strong className="text-slate-800 dark:text-slate-200">Grades 1–12:</strong> Select
              the grade whose unassigned students you want to place
            </li>
            <li>
              <strong className="text-slate-800 dark:text-slate-200">Students list:</strong> After
              distributing, refresh the Students page to see assigned sections
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
