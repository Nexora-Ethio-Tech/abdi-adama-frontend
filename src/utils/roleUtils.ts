import { UserRole } from '../context/UserContext';

export const normalizeRole = (role: string | null | undefined): UserRole | null => {
  if (!role) return null;
  let normalized = role.toString().toLowerCase().trim();
  normalized = normalized.replace(/[_\s]+/g, '-');

  const roleMap: Record<string, UserRole> = {
    'clinicadmin': 'clinic-admin',
    'clinic-admin': 'clinic-admin',
    'clinic_admin': 'clinic-admin',
    'financeadmin': 'finance-clerk',
    'finance-admin': 'finance-clerk',
    'finance-clerk': 'finance-clerk',
    'finance_clerk': 'finance-clerk',
    'viceprincipal': 'vice-principal',
    'vice-principal': 'vice-principal',
    'vice_principal': 'vice-principal',
    'schooladmin': 'school-admin',
    'school-admin': 'school-admin',
    'school_admin': 'school-admin',
    'superadmin': 'super-admin',
    'super-admin': 'super-admin',
    'super_admin': 'super-admin',
    'audit': 'auditor',
    'auditor': 'auditor',
    'driver': 'driver',
    'librarian': 'librarian',
    'teacher': 'teacher',
    'student': 'student',
    'parent': 'parent'
  };

  return roleMap[normalized] || (normalized as UserRole);
};
