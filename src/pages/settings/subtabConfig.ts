import type { SettingsSubTab } from '../../components/settings/SettingsSubTabs';

export const SUPER_ADMIN_SUBTABS: Record<string, SettingsSubTab[]> = {
  General: [
    { id: 'branding', label: 'Branding' },
    { id: 'contact', label: 'Contact' },
    { id: 'controls', label: 'Controls' },
  ],
  Security: [
    { id: 'password', label: 'Password' },
    { id: 'smtp', label: 'Email / SMTP' },
  ],
  'Financial Policy': [
    { id: 'student-fees', label: 'Student Fees' },
    { id: 'payroll-loans', label: 'Payroll & Loans' },
    { id: 'fee-structure', label: 'Fee Structure' },
    { id: 'profit-targets', label: 'Profit Targets' },
    { id: 'audit', label: 'Audit Log' },
  ],
};

export const getDefaultSubTab = (mainTab: string): string =>
  SUPER_ADMIN_SUBTABS[mainTab]?.[0]?.id ?? '';

export const getSubTabLabel = (mainTab: string, subTabId: string): string =>
  SUPER_ADMIN_SUBTABS[mainTab]?.find((t) => t.id === subTabId)?.label ?? mainTab;
