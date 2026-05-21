
import { NavLink, useNavigate } from 'react-router-dom';
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
  StopCircle
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

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { user, role, logout, schoolName } = useUser();
  const { isExamLockedDown, selectedBranchId, triggerStopExam } = useStore();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const getLocalizedSchoolName = () => {
    switch (i18n.language) {
      case 'am': return schoolName.amharic;
      case 'om': return schoolName.oromic;
      default: return schoolName.english;
    }
  };
  const displaySchoolName = getLocalizedSchoolName();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getNavItems = () => {
    switch (role) {
      case 'super-admin':
        const baseItems = [
          { icon: LayoutDashboard, label: t('nav.overview'), path: '/' },
          { icon: Building2, label: t('nav.branches'), path: '/branches' },
          { icon: PieChart, label: t('nav.analytics'), path: '/analytics' },
        ];

        if (selectedBranchId) {
          baseItems.push(
            { icon: Package, label: t('nav.inventory'), path: '/inventory' },
            { icon: Wallet, label: t('nav.finance'), path: '/finance' }
          );
        }

        baseItems.push(
          { icon: Users, label: t('nav.staffManagement') || 'Staff Management', path: '/staff' },
          { icon: Megaphone, label: t('nav.websitePosts'), path: '/website-posts' },
          { icon: Settings, label: t('nav.settings'), path: '/settings' }
        );
        return baseItems;
      case 'school-admin':
        return [
          { icon: LayoutDashboard, label: t('nav.dashboard'), path: '/' },
          { icon: GraduationCap, label: 'Academic Structure', path: '/academic-management' },
          { icon: ClipboardCheck, label: 'Admissions', path: '/admissions-dashboard' },
          { icon: BookOpen, label: 'Classes', path: '/classes' },
          { icon: Users, label: t('nav.students'), path: '/students' },
          { icon: UserPlus, label: t('nav.registration'), path: '/registration' },
          { icon: UserSquare2, label: t('nav.teachers'), path: '/teachers' },
          { icon: DollarSign, label: 'Finance Staff', path: '/finance-staff' },
          { icon: CalendarCheck, label: t('nav.attendance'), path: '/attendance' },
          { icon: BookOpen, label: t('nav.scheduleBuilder'), path: '/schedule-builder' },
          { icon: Package, label: t('nav.inventory'), path: '/inventory' },
          { icon: Wallet, label: t('nav.finance'), path: '/finance' },
          { icon: Settings, label: t('nav.settings'), path: '/settings' },
        ];
      case 'vice-principal':
        return [
          { icon: LayoutDashboard, label: t('nav.dashboard'), path: '/' },
          { icon: UserSquare2, label: t('nav.teachers'), path: '/teachers' },
          { icon: FileText, label: t('nav.transcripts'), path: '/vp-transcripts' },
          { icon: CalendarCheck, label: 'Attendance Oversight', path: '/vp-attendance' },
          { icon: Lock, label: 'Grade Locks', path: '/vp-grade-locks' },
          { icon: ClipboardList, label: 'Grade Management', path: '/grades' },
        ];
      case 'teacher':
        return [
          { icon: LayoutDashboard, label: t('nav.teacherPortal'), path: '/' },
          { icon: BookOpen, label: t('nav.weeklyPlans'), path: '/?tab=plans' },
          { icon: CalendarCheck, label: t('nav.attendance'), path: '/attendance' },
          { icon: BookOpen, label: t('nav.mySchedule'), path: '/schedule' },
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
          { icon: LayoutDashboard, label: t('nav.myDashboard'), path: '/' },
          { icon: Users, label: t('nav.myChildren'), path: '/students' },
          { icon: HeartPulse, label: t('nav.clinicSupport'), path: '/clinic-chat' },
          { icon: ClipboardList, label: t('nav.exams'), path: '/exams' },
        ];
      case 'finance-clerk':
        return [
          { icon: LayoutDashboard, label: t('nav.overview'), path: '/dashboard/finance' },
          { icon: UserPlus, label: t('nav.registration'), path: '/registration' },
          { icon: Wallet, label: t('nav.finance'), path: '/finance-dashboard' },
          ...(user?.isBranchAuditor ? [{ icon: Users, label: t('nav.specialStudents'), path: '/special-students' }] : []),
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
          { icon: LayoutDashboard, label: t('nav.auditorDashboard'), path: '/auditor-dashboard' },
          { icon: Wallet, label: t('nav.finance'), path: '/finance' },
          { icon: Users, label: t('nav.specialStudents'), path: '/special-students' },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-30 w-72 bg-white dark:bg-black text-slate-900 dark:text-white flex flex-col h-screen transition-all duration-300 lg:translate-x-0 lg:static lg:inset-auto border-r border-slate-200 dark:border-slate-800/50",
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
          onClick={onClose}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg lg:hidden text-slate-500 dark:text-white"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto custom-scrollbar">
        {!isExamLockedDown ? (
          navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
              }}
              className={({ isActive }) => cn(
                "flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 group",
                isActive
                  ? "bg-school-primary text-white shadow-lg shadow-school-primary/20 scale-[1.02]"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              {({ isActive }) => (
                <>
                  <item.icon size={20} className={cn("transition-transform group-hover:scale-110", isActive ? "text-white" : "text-slate-400 dark:text-slate-500 group-hover:text-school-accent")} />
                  <span className="font-bold text-sm tracking-wide">{item.label}</span>
                </>
              )}
            </NavLink>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500 p-6 text-center space-y-3">
            <Lock size={32} className="text-rose-500 animate-pulse" />
            <p className="text-xs font-black uppercase tracking-wider text-rose-500">Exam In Progress</p>
            <p className="text-[11px] leading-relaxed">Navigation is locked to ensure exam security.</p>
          </div>
        )}
      </nav>

      <div className="p-6 border-t border-slate-200 dark:border-slate-800/50 space-y-4">
        {!isExamLockedDown ? (
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 px-5 py-4 w-full text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-400/10 rounded-2xl transition-all duration-300 group"
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold text-sm tracking-wide">{t('sidebar.logout')}</span>
          </button>
        ) : (
          <button
            onClick={triggerStopExam}
            className="flex items-center gap-4 px-5 py-4 w-full bg-rose-500 hover:bg-rose-600 text-white rounded-2xl transition-all duration-300 shadow-lg shadow-rose-500/20 active:scale-[0.98]"
          >
            <StopCircle size={20} className="animate-pulse" />
            <span className="font-extrabold text-sm tracking-wide">Stop Exam</span>
          </button>
        )}
      </div>
    </aside>
  );
};
