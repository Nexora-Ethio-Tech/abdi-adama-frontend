
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../services/api';
import {
  LayoutDashboard,
  Users,
  UserSquare2,
  CalendarCheck,
  Wallet,
  Settings,
  LogOut,
  Building2,
  BookOpen,
  PieChart,
  Package,
  ClipboardList,
  X,
  HeartPulse,
  FileText,
  UserPlus,
  Megaphone,
  GraduationCap,
  ClipboardCheck,
  Lock,
  DollarSign,
  Truck,
  Landmark,
  AlertCircle,
  MessageSquare,
  ChevronDown,
  Film,
} from 'lucide-react';
import logo from '../assets/logo.jpg';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useUser } from '../context/UserContext';
import { useStore } from '../context/useStore';
import { useTranslation } from 'react-i18next';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const checkClinicNotifications = async (userId?: string) => {
  try {
    // 1. Check Chat Messages
    const chatRes = await api.get('/clinic/chat');
    const msgs = chatRes.data?.data || [];
    const hasUnreadChat = msgs.some((m: any) => {
      const senderRole = m.role || m.sender_role;
      const readStatus = m.read ?? m.is_read;
      return senderRole === 'clinic' && !readStatus;
    });

    // 2. Check Clinic Visits
    const dashRes = await api.get('/parent/dashboard');
    const kids = dashRes.data?.data?.children || [];

    let hasNewVisit = false;
    await Promise.all(
      kids.map(async (child: any) => {
        try {
          const res = await api.get(`/parent/child/${child.id}/clinic-updates`);
          const visits = res.data?.data?.visits || [];
          if (visits.length > 0) {
            const latestVisitId = visits[0].id;
            const lastViewed = localStorage.getItem(`last_viewed_clinic_visit_id_${child.id}`);
            if (latestVisitId !== lastViewed) {
              hasNewVisit = true;
            }
          }
        } catch (err) {
          console.error(`Failed to check visits for child ${child.id}:`, err);
        }
      })
    );

    return { hasUnreadChat, hasNewVisit };
  } catch (err) {
    console.error('Failed to check clinic notifications:', err);
    return { hasUnreadChat: false, hasNewVisit: false };
  }
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { user, role, logout, schoolName } = useUser();
  const { isExamLockedDown, selectedBranchId } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [clinicChatNotification, setClinicChatNotification] = useState(false);
  const [clinicVisitsNotification, setClinicVisitsNotification] = useState(false);

  useEffect(() => {
    if (role !== 'parent') return;

    const check = async () => {
      const { hasUnreadChat, hasNewVisit } = await checkClinicNotifications(user?.id);
      setClinicChatNotification(hasUnreadChat);
      setClinicVisitsNotification(hasNewVisit);
    };

    check();

    const handleUpdate = () => {
      check();
    };
    window.addEventListener('clinic-notification-update', handleUpdate);
    const interval = setInterval(check, 30000);

    return () => {
      window.removeEventListener('clinic-notification-update', handleUpdate);
      clearInterval(interval);
    };
  }, [role, user]);

  const toggleExpanded = (label: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(label)) {
      newExpanded.delete(label);
    } else {
      newExpanded.add(label);
    }
    setExpandedItems(newExpanded);
  };

  const getLocalizedSchoolName = () => {
    switch (i18n.language) {
      case 'am': return schoolName.amharic;
      case 'om': return schoolName.oromic;
      default: return schoolName.english;
    }
  };
  const displaySchoolName = getLocalizedSchoolName();

  const parentChildId =
    role === 'parent' && location.pathname.includes('/dashboard/parent')
      ? new URLSearchParams(location.search).get('childId')
      : null;

  const buildParentPortalPath = (tab: string) => {
    const params = new URLSearchParams({ tab });
    if (parentChildId) params.set('childId', parentChildId);
    return `/dashboard/parent?${params.toString()}`;
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  type NavItem = {
    icon: any;
    label: string;
    path?: string;
    children?: Array<{ icon: any; label: string; path: string }>;
  };

  const getNavItems = () => {
    switch (role) {
      case 'super-admin':
        const baseItems: NavItem[] = [
          { icon: LayoutDashboard, label: t('nav.overview'), path: '/' },
          { icon: Building2, label: t('nav.branches'), path: '/branches' },
          { icon: PieChart, label: t('nav.analytics'), path: '/analytics' },
        ];

        if (selectedBranchId) {
          baseItems.push(
            { icon: Package, label: t('nav.inventory'), path: '/inventory' },
            { icon: Wallet, label: t('nav.finance'), path: '/finance' },
            { icon: Users, label: t('nav.staffManagement') || 'Staff Management', path: '/staff' }
          );
        }

        baseItems.push(
          {
            icon: Film,
            label: 'Media',
            path: '/website-posts',
            children: [
              { icon: Megaphone, label: t('nav.websitePosts'), path: '/website-posts' },
              { icon: MessageSquare, label: 'Chatbot Management', path: '/chatbot-management' },
            ],
          },
          {
            icon: DollarSign,
            label: 'Financial Tools',
            path: '/employee-profiles',
            children: [
              { icon: DollarSign, label: 'Payroll Ledger', path: '/payroll' },
              { icon: Landmark, label: 'Loan Accounts', path: '/loans' },
              { icon: UserSquare2, label: 'Salary Profiles', path: '/employee-profiles' },
            ],
          },
          { icon: Settings, label: t('nav.settings'), path: '/settings' }
        );
        return baseItems;
      case 'school-admin':
        return [
          { icon: LayoutDashboard, label: t('nav.dashboard'), path: '/' },
          { icon: BookOpen, label: 'Classes', path: '/classes' },
          { icon: Users, label: t('nav.students'), path: '/students' },
          { icon: Users, label: 'Staff Management', path: '/staff' },
          { icon: CalendarCheck, label: t('nav.attendance'), path: '/attendance' },
          { icon: BookOpen, label: t('nav.scheduleBuilder'), path: '/schedule-builder' },
          { icon: Package, label: t('nav.inventory'), path: '/inventory' },
          { icon: Settings, label: t('nav.settings'), path: '/settings' },
        ];
      case 'vice-principal':
        return [
          { icon: LayoutDashboard, label: t('nav.dashboard'), path: '/' },
          { icon: UserSquare2, label: t('nav.teachers'), path: '/teachers' },
          { icon: FileText, label: t('nav.transcripts'), path: '/vp-transcripts' },
          { icon: CalendarCheck, label: 'Attendance Oversight', path: '/vp-attendance' },
          { icon: ClipboardList, label: 'Grade Management', path: '/vp-grade-management' },
          { icon: BookOpen, label: 'Communication Book', path: '/vp-communication' },
        ];
      case 'teacher':
        return [
          { icon: LayoutDashboard, label: t('nav.teacherPortal'), path: '/' },
          { icon: BookOpen, label: t('nav.weeklyPlans'), path: '/dashboard/teacher?tab=plans' },
          { icon: CalendarCheck, label: t('nav.attendance'), path: '/attendance' },
          { icon: BookOpen, label: t('nav.mySchedule'), path: '/schedule' },
          { icon: ClipboardCheck, label: 'Grade Entry', path: '/grades' },
          { icon: ClipboardList, label: t('nav.exams'), path: '/exams' },
        ];
      case 'student':
        return [
          { icon: LayoutDashboard, label: t('nav.myDashboard'), path: '/' },
          { icon: BookOpen, label: t('nav.gradesCourses'), path: '/courses' },
          { icon: CalendarCheck, label: t('nav.academicHistory'), path: '/attendance' },
          { icon: ClipboardList, label: t('nav.exams'), path: '/exams' },
        ];
      case 'parent':
        return [
          { icon: LayoutDashboard, label: t('nav.myDashboard') || 'My Dashboard', path: buildParentPortalPath('dashboard') },
          { icon: BookOpen, label: 'Grades & Courses', path: buildParentPortalPath('grades') },
          { icon: GraduationCap, label: 'Academic History', path: buildParentPortalPath('history') },
          { icon: ClipboardList, label: 'Communication Book', path: buildParentPortalPath('communication-book') },
          { icon: HeartPulse, label: 'Clinic Support', path: buildParentPortalPath('clinic') },
        ];
      case 'finance-clerk':
        return [
          { icon: LayoutDashboard, label: t('nav.overview'), path: '/dashboard/finance' },
          { icon: Wallet, label: 'Collections', path: '/finance-dashboard' },
          { icon: AlertCircle, label: 'Overdue', path: '/finance-dashboard?tab=overdue' },
          { icon: Package, label: 'Inventory', path: '/finance-dashboard?tab=inventory' },
          { icon: HeartPulse, label: 'Request Aid', path: '/finance-dashboard?tab=aid-requests' },
          { icon: Truck, label: 'Transport', path: '/finance-dashboard?tab=transport' },
          { icon: Landmark, label: 'Loan Accounts', path: '/loans' },
        ];
      case 'librarian':
        return [
          { icon: LayoutDashboard, label: t('nav.librarianPortal'), path: '/' },
          { icon: BookOpen, label: t('nav.library'), path: '/library' },
        ];
      case 'clinic-admin':
        return [
          { icon: LayoutDashboard, label: t('nav.clinicDashboard'), path: '/' },
          { icon: HeartPulse, label: t('nav.clinicManagement'), path: '/clinic' },
          { icon: ClipboardList, label: t('nav.chats'), path: '/clinic?tab=chat' },
        ];
      case 'driver':
        return [
          { icon: LayoutDashboard, label: t('nav.myDashboard'), path: '/' },
          { icon: Megaphone, label: t('nav.postNotice'), path: '/' },
        ];
      case 'auditor':
        return [
          { icon: LayoutDashboard, label: t('nav.dashboard'), path: '/auditor-dashboard' },
          { icon: Wallet, label: 'Student Finance', path: '/finance' },
          { icon: DollarSign, label: 'Payroll Ledger', path: '/payroll' },
          { icon: Landmark, label: 'Loan Accounts', path: '/loans' },
          { icon: UserSquare2, label: 'Salary Profiles', path: '/employee-profiles' },
        ];
      default:
        return [];
    }
  };

  const getDashboardRoute = (role: string | null) => {
    switch (role) {
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
      default: return '/login';
    }
  };

  const checkActive = (itemPath: string) => {
    if (isExamLockedDown) return false;
    const currentFull = location.pathname + location.search;

    if (role === 'parent') {
      const itemTab = new URLSearchParams(itemPath.split('?')[1] || '').get('tab') || 'dashboard';
      const currentTab = new URLSearchParams(location.search).get('tab') || 'dashboard';
      return itemTab === currentTab;
    }

    if (itemPath === '/') {
      return location.pathname === '/' || location.pathname === getDashboardRoute(role);
    }
    // support items with query tab, e.g. /finance-dashboard?tab=overdue
    const [basePath, query] = itemPath.split('?');
    if (query) {
      const itemTab = new URLSearchParams(query).get('tab');
      const currentTab = new URLSearchParams(location.search).get('tab');
      return location.pathname === basePath && itemTab === currentTab;
    }
    if (role === 'finance-clerk' && itemPath === '/finance-dashboard') {
      return location.pathname === '/finance-dashboard' && !new URLSearchParams(location.search).get('tab');
    }
    return location.pathname === itemPath;
  };

  const navItems = getNavItems();

  const isNavItemActive = (item: NavItem) => {
    if (item.path) return checkActive(item.path);
    return item.children?.some((child) => checkActive(child.path)) || false;
  };

  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-30 w-72 flex flex-col h-screen transition-all duration-300 lg:translate-x-0 lg:static lg:inset-auto border-r border-slate-200 dark:border-slate-800/50",
      role === 'parent'
        ? "bg-slate-950 text-white border-slate-900"
        : "bg-white dark:bg-black text-slate-900 dark:text-white",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="p-8 mt-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative p-1 bg-slate-100 dark:bg-white rounded-xl shadow-lg">
            <img src={logo} alt="Abdi Adama Logo" className="w-14 h-14 rounded-lg object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-black text-xl tracking-tight block truncate text-slate-900 dark:text-white">{displaySchoolName}</span>
            <span className="text-xs text-school-accent font-bold uppercase tracking-widest block truncate">Smart-School</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('sidebar.closeMenu') || 'Close sidebar'}
          title={t('sidebar.closeMenu') || 'Close sidebar'}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg lg:hidden text-slate-500 dark:text-white"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = isNavItemActive(item);
          const isExpanded = expandedItems.has(item.label);

          if (item.children?.length) {
            return (
              <div key={item.label} className="space-y-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    toggleExpanded(item.label);
                  }}
                  className={cn(
                    "w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300",
                    isActive
                      ? role === 'parent'
                        ? "bg-blue-600/10 text-blue-400 font-bold"
                        : "bg-school-primary text-white shadow-lg shadow-school-primary/20"
                      : role === 'parent'
                        ? "text-slate-400 hover:text-white hover:bg-white/5"
                        : "text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/20 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                  )}
                >
                  <item.icon size={20} className={cn("text-slate-400 dark:text-slate-500", isActive ? (role === 'parent' ? "text-blue-400" : "text-white") : "")} />
                  <span className="font-bold text-sm tracking-wide flex-1 text-left">{item.label}</span>
                  <ChevronDown size={18} className={cn("transition-transform", isExpanded ? "rotate-180" : "")} />
                </button>
                {isExpanded && (
                  <div className="space-y-1 pl-12">
                    {item.children.map((child) => {
                      const childActive = checkActive(child.path);
                      return (
                        <NavLink
                          key={`${child.path}-${child.label}`}
                          to={isExamLockedDown ? '#' : child.path}
                          onClick={(e) => {
                            if (isExamLockedDown) {
                              e.preventDefault();
                              return;
                            }
                            if (window.innerWidth < 1024) onClose();
                          }}
                          className={cn(
                            "flex items-center gap-3 px-5 py-2 rounded-2xl transition-all duration-300",
                            childActive
                              ? role === 'parent'
                                ? "bg-blue-600/10 text-blue-400 font-bold"
                                : "bg-school-primary text-white shadow-lg shadow-school-primary/20 scale-[1.02]"
                              : role === 'parent'
                                ? "text-slate-400 hover:text-white hover:bg-white/5"
                                : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                          )}
                        >
                          <child.icon size={18} className={cn("transition-transform group-hover:scale-110", childActive ? (role === 'parent' ? "text-blue-400" : "text-white") : "text-slate-400 dark:text-slate-500 group-hover:text-school-accent")} />
                          <span className="text-sm tracking-wide">{child.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={`${item.path}-${item.label}`}
              to={isExamLockedDown ? '#' : item.path || '#'}
              onClick={(e) => {
                if (isExamLockedDown) {
                  e.preventDefault();
                  return;
                }
                if (window.innerWidth < 1024) onClose();
              }}
              className={cn(
                "flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 group",
                isExamLockedDown && "opacity-50 cursor-not-allowed",
                isActive
                  ? role === 'parent'
                    ? "bg-blue-600/10 text-blue-400 font-bold"
                    : "bg-school-primary text-white shadow-lg shadow-school-primary/20 scale-[1.02]"
                  : role === 'parent'
                    ? "text-slate-400 hover:text-white hover:bg-white/5"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <item.icon size={20} className={cn("transition-transform group-hover:scale-110", isActive ? (role === 'parent' ? "text-blue-400" : "text-white") : "text-slate-400 dark:text-slate-500 group-hover:text-school-accent")} />
              <span className="font-bold text-sm tracking-wide flex items-center gap-2">
                {item.label}
                {item.label === 'Clinic Support' && (clinicChatNotification || clinicVisitsNotification) && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-450 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                )}
              </span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-6 border-t border-slate-200 dark:border-slate-800/50 space-y-4">
        <button
          onClick={handleLogout}
          disabled={isExamLockedDown}
          className={cn(
            "flex items-center gap-4 px-5 py-4 w-full text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-400/10 rounded-2xl transition-all duration-300 group",
            isExamLockedDown && "opacity-50 cursor-not-allowed"
          )}
        >
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold text-sm tracking-wide">{t('sidebar.logout') || 'Logout Session'}</span>
        </button>
      </div>
    </aside>
  );
};
