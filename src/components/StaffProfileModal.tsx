import { X } from 'lucide-react';

interface StaffProfileModalProps {
  open: boolean;
  title: string;
  staff: any;
  onClose: () => void;
}

const formatValue = (value: any) => {
  if (value === null || value === undefined || value === '') return 'Not provided';
  if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : 'Not provided';
  return String(value);
};

const calculateAge = (dob?: string) => {
  if (!dob) return null;
  const date = new Date(dob);
  if (Number.isNaN(date.getTime())) return null;
  const diff = Date.now() - date.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

export const StaffProfileModal = ({ open, title, staff, onClose }: StaffProfileModalProps) => {
  if (!open || !staff) return null;

  const profile = staff.staffProfile || staff.staff_profile || {};
  const dob = profile.dob || profile.dateOfBirth || profile.birthDate;
  const age = calculateAge(dob);
  const registeredAt = staff.createdAt || staff.created_at || profile.registeredAt || profile.dateRegistered;

  const detailRows = [
    ['Name', staff.name],
    ['Email', staff.email],
    ['Phone Number', profile.phoneNumber || profile.phone || profile.contactNumber],
    ['Emergency Contact', profile.emergencyContactName],
    ['Emergency Contact Phone', profile.emergencyContactPhone],
    ['Education Status', profile.educationLevel || profile.educationStatus],
    ['Specialty / Course', profile.specialty || profile.courseSpecialty],
    ['Date of Birth', dob],
    ['Age', age ? `${age} years` : null],
    ['Previous School', profile.previousSchool],
    ['Years of Experience', profile.experienceYears || profile.experience],
    ['Date Registered', registeredAt],
    ['Digital ID', staff.digitalId || staff.digital_id],
    ['Status', staff.status],
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div>
            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wide text-sm">{title}</h3>
            <p className="text-xs text-slate-500">Detailed profile information</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {detailRows.map(([label, value]) => (
            <div key={label} className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 p-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</div>
              <div className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100 break-words">{formatValue(value)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
