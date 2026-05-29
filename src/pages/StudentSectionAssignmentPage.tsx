import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { StudentSectionAssignment } from '../components/StudentSectionAssignment';

export const StudentSectionAssignmentPage = () => {
  const navigate = useNavigate();
  const { role } = useUser();

  // Only allow school admins and super admins
  useEffect(() => {
    if (role !== 'school-admin' && role !== 'super-admin') {
      navigate('/');
    }
  }, [role, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Manage Student Sections
          </h1>
          <p className="text-lg text-slate-600">
            Auto-distribute unassigned students fairly across available sections
          </p>
        </div>

        {/* Main Component */}
        <StudentSectionAssignment />

        {/* Footer Info */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6 text-sm text-slate-600">
          <h3 className="font-semibold text-slate-900 mb-3">Key Features:</h3>
          <ul className="space-y-2">
            <li>
              <strong>Auto-Distribution:</strong> Fairly distribute unassigned students across available sections with automatic round-robin load balancing
            </li>
            <li>
              <strong>Grade-Based Filtering:</strong> Select a specific grade to work with only that grade's unassigned students
            </li>
            <li>
              <strong>Real-Time Feedback:</strong> See detailed results of successful and failed assignments
            </li>
            <li>
              <strong>Audit Logging:</strong> All assignments are automatically logged for compliance and tracking
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
