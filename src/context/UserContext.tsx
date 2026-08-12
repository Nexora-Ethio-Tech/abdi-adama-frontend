
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type UserRole = 'super-admin' | 'school-admin' | 'vice-principal' | 'teacher' | 'student' | 'parent' | 'finance-clerk' | 'librarian' | 'clinic-admin' | 'driver' | 'auditor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  digitalId?: string;
  isBranchAuditor?: boolean;
}

interface Branch {
  id: string;
  name: string;
  location: string;
}

export interface MultilingualText {
  oromic: string;
  amharic: string;
  english: string;
}

const normalizeUserRole = (role?: string): UserRole | null => {
  if (!role) return null;
  return role.toString().toLowerCase().replace(/[_\s]+/g, '-') as UserRole;
};

const getDashboardRoute = (role?: string) => {
  const normalizedRole = normalizeUserRole(role);
  switch (normalizedRole) {
    case 'super-admin': return '/dashboard/super-admin';
    case 'school-admin': return '/dashboard/school-admin';
    case 'teacher': return '/dashboard/teacher';
    case 'student': return '/dashboard/student';
    case 'parent': return '/dashboard/parent';
    case 'finance-clerk': return '/dashboard/finance';
    case 'vice-principal': return '/dashboard/vice-principal';
    case 'driver': return '/dashboard/driver';
    case 'librarian': return '/dashboard/librarian';
    case 'clinic-admin': return '/dashboard/clinic-admin';
    case 'auditor': return '/auditor-dashboard';
    default: return '/';
  }
};

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  role: UserRole | null;
  selectedBranch: Branch | null;
  setSelectedBranch: (branch: Branch | null) => void;
  branches: Branch[];
  gradesLocked: boolean;
  setGradesLocked: (locked: boolean) => void;
  registrationOpen: boolean;
  setRegistrationOpen: (open: boolean) => void;
  gradeSubmissionOpen: boolean;
  setGradeSubmissionOpen: (open: boolean) => void;
  schoolName: MultilingualText;
  setSchoolName: (name: MultilingualText) => void;
  schoolMotto: MultilingualText;
  setSchoolMotto: (motto: MultilingualText) => void;
  login: (credentials: { digitalIdOrEmail: string; password?: string; otp?: string }) => Promise<{ success: boolean; redirect?: string; error?: string }>;
  logout: () => void;
  switchRole: (role: UserRole) => Promise<string | null>;
  loading: boolean;
}

const mockBranches: Branch[] = [
  { id: '1', name: 'Main Branch', location: 'Addis Ababa' },
  { id: '2', name: 'Bole Branch', location: 'Bole, AA' },
  { id: '3', name: 'Megenagna Branch', location: 'Megenagna, AA' },
  { id: '4', name: 'Adama Branch', location: 'Adama' },
];

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  // ─── SECURITY FIX ──────────────────────────────────────────────────────────
  // Do NOT trust localStorage on initial load. Start with null.
  // The verifyToken effect will restore the user ONLY if the token is valid.
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Block rendering until verified
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [branches, setBranches] = useState<Branch[]>(mockBranches); // Start with mock, fetch real
  const [gradesLocked, setGradesLocked] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(() => {
    return localStorage.getItem('registration_open') !== 'false';
  });
  const [gradeSubmissionOpen, setGradeSubmissionOpen] = useState(() => {
    return localStorage.getItem('grade_submission_open') !== 'false';
  });

  const [schoolName, setSchoolName] = useState<MultilingualText>(() => {
    const saved = localStorage.getItem('school_name');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return {
          oromic: 'Mana Barumsaa Abdii Adaamaa',
          amharic: 'አብዲ አዳማ ትምህርት ቤት',
          english: 'Abdi Adama School'
        };
      }
    }
    return {
      oromic: 'Mana Barumsaa Abdii Adaamaa',
      amharic: 'አብዲ አዳማ ትምህርት ቤት',
      english: 'Abdi Adama School'
    };
  });

  const [schoolMotto, setSchoolMotto] = useState<MultilingualText>(() => {
    const saved = localStorage.getItem('school_motto');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return {
          oromic: 'ijooleen kessaan ijolee kenyaa',
          amharic: 'ልጆቻቹ ልጆቻችን ናቸዉ',
          english: 'Your children are our children'
        };
      }
    }
    return {
      oromic: 'ijooleen kessaan ijolee kenyaa',
      amharic: 'ልጆቻቹ ልጆቻችን ናቸዉ',
      english: 'Your children are our children'
    };
  });

  // ─── Load public system settings (branding, global flags) ────────────────
  useEffect(() => {
    const loadPublicSettings = async () => {
      try {
        const { default: settingsService } = await import('../services/settingsService');
        const settings = await settingsService.getPublicSystemSettings();
        if (settings.school_name_oromic) {
          setSchoolName({
            oromic: settings.school_name_oromic,
            amharic: settings.school_name_amharic || '',
            english: settings.school_name_english || '',
          });
        }
        if (settings.school_motto_oromic) {
          setSchoolMotto({
            oromic: settings.school_motto_oromic,
            amharic: settings.school_motto_amharic || '',
            english: settings.school_motto_english || '',
          });
        }
        if (settings.grades_locked !== undefined) {
          setGradesLocked(settings.grades_locked === 'true');
        }
        if (settings.registration_open !== undefined) {
          setRegistrationOpen(settings.registration_open !== 'false');
        }
        if (settings.grade_submission_open !== undefined) {
          setGradeSubmissionOpen(settings.grade_submission_open !== 'false');
        }
      } catch {
        // Keep local defaults if API unavailable
      }
    };
    loadPublicSettings();
  }, []);

  // ─── Fetch Real Branches ───────────────────────────────────────────────────
  useEffect(() => {
    const fetchBranches = async () => {
      if (!user) return;

      try {
        if (user.role === 'super-admin') {
          const { default: api } = await import('../services/api');
          // Super Admin: Fetch all branches
          const res = await api.get('/super-admin/branches');
          if (res.data.success && Array.isArray(res.data.data)) {
            const apiBranches = res.data.data.map((b: any) => ({
              id: b.id,
              name: b.name,
              location: b.address || b.location || 'N/A'
            }));
            setBranches(apiBranches);
          }
        } else if (user.role === 'auditor') {
          const { default: api } = await import('../services/api');
          // Auditor: Fetch all branches using auditor endpoint
          const res = await api.get('/auditor/branches');
          if (res.data.success && Array.isArray(res.data.data)) {
            const apiBranches = res.data.data.map((b: any) => ({
              id: b.id,
              name: b.name,
              location: b.address || b.location || 'N/A'
            }));
            setBranches(apiBranches);
          }
        } else if ((user as any).branchId) {
          // Branch-level users: Use their assigned branch from profile (avoids 403 routes)
          setBranches([{
            id: (user as any).branchId,
            name: (user as any).branchName || 'My Branch',
            location: 'N/A'
          }]);
        }
      } catch (err) {
        console.error('Failed to fetch branches:', err);
      }
    };
    fetchBranches();
  }, [user]);

  // ─── Token Verification on Load ────────────────────────────────────────────
  // This is the ONLY way a user gets restored after page refresh.
  // No token → no user. Invalid token → user cleared.
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('abdi_adama_token');
      console.log('[VerifyToken] Token exists:', !!token);

      if (!token) {
        // No token at all — clear any stale user data and stop loading
        localStorage.removeItem('abdi_adama_user');
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        // Use axios api instance instead of fetch to leverage interceptors
        const { default: api } = await import('../services/api');
        console.log('[VerifyToken] Calling /auth/me...');
        const res = await api.get('/auth/me');

        if (res.data.success) {
          const rawUser = res.data.data;
          const normalizedRole = normalizeUserRole(rawUser.role) || (rawUser.role as UserRole);
          console.log('[VerifyToken] Got user from /auth/me:', { role: rawUser.role, normalizedRole, email: rawUser.email });

          const user = {
            id: rawUser.id,
            name: rawUser.name,
            email: rawUser.email,
            role: normalizedRole,
            digitalId: rawUser.digital_id || rawUser.digitalId,
            branchId: rawUser.branch_id || rawUser.branchId,
            branchName: rawUser.branch_name || rawUser.branchName || 'My Branch',
            status: rawUser.status,
          };
          console.log('[VerifyToken] Setting user with role:', user.role);
          setUser(user);
          localStorage.setItem('abdi_adama_user', JSON.stringify(user));
        } else {
          console.warn('[VerifyToken] /auth/me returned success: false', res.data);
          localStorage.removeItem('abdi_adama_user');
          localStorage.removeItem('abdi_adama_token');
          localStorage.removeItem('abdi_adama_refresh_token');
          setUser(null);
        }
      } catch (err) {
        console.error('[VerifyToken] Error:', err instanceof Error ? err.message : err,
          err instanceof Error && (err as any).response?.data ? (err as any).response.data : '');
        // Token expired or invalid — force logout
        localStorage.removeItem('abdi_adama_user');
        localStorage.removeItem('abdi_adama_token');
        localStorage.removeItem('abdi_adama_refresh_token');
        setUser(null);
      } finally {
        console.log('[VerifyToken] Done, setting loading: false');
        setLoading(false);
      }
    };
    verifyToken();
  }, []);

  // Persist user to localStorage when it changes (for display only, never trusted)
  useEffect(() => {
    if (user) {
      localStorage.setItem('abdi_adama_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('abdi_adama_user');
      // DO NOT clear tokens here, as user starts as null on app initialization
      // and clearing them here prevents verifyToken from working on page reload/refresh.
      // Token clearing is handled explicitly during logout or verification failure.
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('school_name', JSON.stringify(schoolName));
  }, [schoolName]);

  useEffect(() => {
    localStorage.setItem('school_motto', JSON.stringify(schoolMotto));
  }, [schoolMotto]);

  useEffect(() => {
    localStorage.setItem('registration_open', registrationOpen.toString());
  }, [registrationOpen]);

  useEffect(() => {
    localStorage.setItem('grade_submission_open', gradeSubmissionOpen.toString());
  }, [gradeSubmissionOpen]);

  const role = user?.role || null;


  const login = async (credentials: { digitalIdOrEmail: string; password?: string; otp?: string }): Promise<{ success: boolean; redirect?: string; error?: string }> => {
    try {
      const { default: api } = await import('../services/api');
      const res = await api.post('/auth/login', {
        email: credentials.digitalIdOrEmail,
        password: credentials.password
      });

      if (res.data.success) {
        const rawUser = res.data.data.user;
        const normalizedRole = normalizeUserRole(rawUser.role) || (rawUser.role as UserRole);
        console.log('[Login] Backend returned user:', { role: rawUser.role, normalizedRole, email: rawUser.email });

        const user = {
          id: rawUser.id,
          name: rawUser.name,
          email: rawUser.email,
          role: normalizedRole,
          digitalId: rawUser.digital_id || rawUser.digitalId,
          branchId: rawUser.branch_id || rawUser.branchId,
          branchName: rawUser.branch_name || rawUser.branchName || 'My Branch',
          status: rawUser.status,
        };

        // Store tokens BEFORE updating user state
        localStorage.setItem('abdi_adama_token', res.data.data.accessToken);
        localStorage.setItem('abdi_adama_refresh_token', res.data.data.refreshToken);
        localStorage.setItem('abdi_adama_user', JSON.stringify(user));

        console.log('[Login] Tokens stored, setting user state...');
        setUser(user);

        const redirectUrl = getDashboardRoute(user.role);
        console.log('[Login] Redirecting to:', redirectUrl, 'User role:', user.role);
        return { success: true, redirect: redirectUrl };
      }
      return { success: false, error: res.data.error?.message || 'Invalid credentials' };
    } catch (err: any) {
      console.error('Login error:', err);
      return {
        success: false,
        error: err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Unable to connect to server'
      };
    }
  };

  const logout = async () => {
    try {
      console.log("START");
      const token = localStorage.getItem('abdi_adama_token');
      if (token) {
        const { default: api } = await import('../services/api');
        await api.post('/auth/logout');
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setSelectedBranch(null);
      localStorage.removeItem('abdi_adama_user');
      localStorage.removeItem('abdi_adama_token');
      localStorage.removeItem('abdi_adama_refresh_token');
      window.location.href = '/';
    }
  };

  const switchRole = async (_newRole: UserRole): Promise<string | null> => {
    // Note: Backend doesn't support role switching yet
    // This is a placeholder for future implementation
    console.warn('Role switching not implemented in backend');
    return null;
  };

  return (
    <UserContext.Provider value={{
      user,
      setUser,
      role,
      selectedBranch,
      setSelectedBranch,
      branches,
      gradesLocked,
      setGradesLocked,
      registrationOpen,
      setRegistrationOpen,
      gradeSubmissionOpen,
      setGradeSubmissionOpen,
      schoolName,
      setSchoolName,
      schoolMotto,
      setSchoolMotto,
      login,
      logout,
      switchRole,
      loading
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
