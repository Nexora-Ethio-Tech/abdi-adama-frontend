
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AbsenceQueueItem {
  id: string;
  studentId: string;
  studentName: string;
  grade: string;
  parentName: string;
  parentPhone: string;
  reportedAt: string;
  reportedBy: string;
  reason: string;
  date: string;
  status: 'pending' | 'excused' | 'notified';
}

export interface PublicPost {
  id: string;
  type: 'image' | 'video';
  mediaUrl: string;
  description: string;
  timestamp: string;
}

export interface SchoolNotice {
  id: string;
  title: string;
  content: string;
  priority: 'Normal' | 'Medium' | 'High';
  time: string;
  expiresAt?: string;
  category: 'Academic' | 'Logistics' | 'Finance';
  audience: string[];
  driverName?: string;
  stations?: string;
}

export interface ExamControl {
  isHidden: boolean;
  isLocked: boolean;
  lockOwnerId: string | null;
  lockPassword: string | null;
  principalPassword: string;
}

interface AppState {
  // Exam Lockdown
  isExamLockedDown: boolean;
  lockdownPassword: string | null;
  setExamLockedDown: (isLocked: boolean, password?: string) => void;

  // Branch Selection
  selectedBranchId: string | null;
  setSelectedBranchId: (id: string | null) => void;

  // Attendance Escalation Queue
  absenceQueue: AbsenceQueueItem[];
  enqueueAbsences: (items: AbsenceQueueItem[]) => void;
  updateAbsenceStatus: (id: string, status: AbsenceQueueItem['status']) => void;

  // Examiner Promotion (frontend authority source)
  examinerTeacherIds: string[];
  setTeacherExaminerStatus: (teacherId: string, isExaminer: boolean) => void;

  // Exam Access Controls
  examControls: Record<string, ExamControl>;
  ensureExamControl: (examId: string) => void;
  setExamHidden: (examId: string, hidden: boolean) => void;
  lockExam: (examId: string, ownerId: string, password: string) => void;
  unlockExam: (examId: string, ownerId: string, password: string) => boolean;
  setPrincipalPassword: (examId: string, password: string) => void;

  // Public Landing Page Posts
  publicPosts: PublicPost[];
  addPublicPost: (post: Omit<PublicPost, 'id' | 'timestamp'>) => void;
  updatePublicPost: (id: string, updates: Partial<PublicPost>) => void;
  deletePublicPost: (id: string) => void;

  // School Notices
  notices: SchoolNotice[];
  addNotice: (notice: Omit<SchoolNotice, 'id' | 'time'>) => void;
  deleteNotice: (id: string) => void;
}

const defaultExamControl = (): ExamControl => ({
  isHidden: true,
  isLocked: false,
  lockOwnerId: null,
  lockPassword: null,
  principalPassword: 'principal123',
});

export const useStore = create<AppState>()(persist((set, get) => ({
  isExamLockedDown: false,
  lockdownPassword: null,
  setExamLockedDown: (isLocked: boolean, password?: string) => set({
    isExamLockedDown: isLocked,
    lockdownPassword: password || null
  }),

  selectedBranchId: null,
  setSelectedBranchId: (id: string | null) => set({ selectedBranchId: id }),

  absenceQueue: [],
  enqueueAbsences: (items: AbsenceQueueItem[]) => set((state) => ({
    absenceQueue: [...items, ...state.absenceQueue]
  })),
  updateAbsenceStatus: (id: string, status: AbsenceQueueItem['status']) => set((state) => ({
    absenceQueue: state.absenceQueue.map((q) => q.id === id ? { ...q, status } : q)
  })),

  examinerTeacherIds: ['T1'],
  setTeacherExaminerStatus: (teacherId: string, isExaminer: boolean) => set((state) => {
    const normalized = teacherId.toUpperCase();
    if (isExaminer && !state.examinerTeacherIds.includes(normalized)) {
      return { examinerTeacherIds: [...state.examinerTeacherIds, normalized] };
    }
    if (!isExaminer) {
      return { examinerTeacherIds: state.examinerTeacherIds.filter((id) => id !== normalized) };
    }
    return state;
  }),

  examControls: {},
  ensureExamControl: (examId: string) => set((state) => ({
    examControls: state.examControls[examId]
      ? state.examControls
      : { ...state.examControls, [examId]: defaultExamControl() }
  })),
  setExamHidden: (examId: string, hidden: boolean) => set((state) => ({
    examControls: {
      ...state.examControls,
      [examId]: {
        ...(state.examControls[examId] || defaultExamControl()),
        isHidden: hidden
      }
    }
  })),
  lockExam: (examId: string, ownerId: string, password: string) => set((state) => ({
    examControls: {
      ...state.examControls,
      [examId]: {
        ...(state.examControls[examId] || defaultExamControl()),
        isLocked: true,
        lockOwnerId: ownerId,
        lockPassword: password
      }
    }
  })),
  unlockExam: (examId: string, ownerId: string, password: string) => {
    const control = get().examControls[examId] || defaultExamControl();
    const canUnlock = control.isLocked && control.lockOwnerId === ownerId && control.lockPassword === password;
    if (!canUnlock) {
      return false;
    }
    set((state) => ({
      examControls: {
        ...state.examControls,
        [examId]: {
          ...control,
          isLocked: false,
          lockOwnerId: null,
          lockPassword: null
        }
      }
    }));
    return true;
  },
  setPrincipalPassword: (examId: string, password: string) => set((state) => ({
    examControls: {
      ...state.examControls,
      [examId]: {
        ...(state.examControls[examId] || defaultExamControl()),
        principalPassword: password
      }
    }
  })),

  publicPosts: [],
  addPublicPost: (post) => set((state) => ({
    publicPosts: [
      {
        ...post,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      },
      ...state.publicPosts
    ]
  })),
  updatePublicPost: (id, updates) => set((state) => ({
    publicPosts: state.publicPosts.map(p => p.id === id ? { ...p, ...updates } : p)
  })),
  deletePublicPost: (id) => set((state) => ({
    publicPosts: state.publicPosts.filter(p => p.id !== id)
  })),

  notices: [],
  addNotice: (notice) => set((state) => ({
    notices: [
      {
        ...notice,
        id: crypto.randomUUID(),
        time: 'Just now',
      },
      ...state.notices
    ]
  })),
  deleteNotice: (id) => set((state) => ({
    notices: state.notices.filter(n => n.id !== id)
  })),
}), {
  name: 'abdi-adama-front-store',
  partialize: (state) => ({
    selectedBranchId: state.selectedBranchId,
    absenceQueue: state.absenceQueue,
    examinerTeacherIds: state.examinerTeacherIds,
    examControls: state.examControls,
    publicPosts: state.publicPosts,
    notices: state.notices,
  })
}));
