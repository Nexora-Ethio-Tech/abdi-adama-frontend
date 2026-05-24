import { useState } from 'react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUser } from '../context/UserContext';
import SchoolAdminRegistration from '../components/SchoolAdminRegistration';

export const AdminApplications = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { role } = useUser();

  // Only school admins can access this page
  if (role !== 'school-admin') {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <h2 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2">
            Access Denied
          </h2>
          <p className="text-red-600 dark:text-red-300">
            Only School Admins can access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <Breadcrumbs />
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-blue-600 hover:underline text-xs font-bold uppercase tracking-widest"
        >
          <ArrowLeft size={14} />
          {t('common.back') || 'Back'}
        </button>
      </div>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">
            📋 Application Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Review and process student applications through the admission workflow
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
        <SchoolAdminRegistration />
      </div>
    </div>
  );
};
