import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { StudentRegistration } from "../../../components/StudentRegistration";
import { useUser } from "../../../context/UserContext";
import logo from "../../../assets/logo.jpg";

interface ApplyButtonProps {
  /** Optional extra Tailwind classes for the trigger button */
  className?: string;
}

export default function ApplyButtonSection({ className = "" }: ApplyButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { registrationOpen } = useUser();

  useEffect(() => { setMounted(true); }, []);

  // Prevent background scrolling while modal is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // ─── Modal Content ──────────────────────────────────────────────────────────
  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsOpen(false)}
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
      />

      {/* Card */}
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col z-10 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">

        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="p-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
              <img src={logo} alt="School Logo" className="w-10 h-10 rounded-xl object-cover" />
            </div>
            <div>
              <span className="text-amber-500 font-bold text-[10px] uppercase tracking-[0.25em] block">
                Admissions 2026
              </span>
              <h3 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">
                New Student Admission
              </h3>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/30 dark:bg-slate-950/20">
          {!registrationOpen ? (
            /* Registration Closed Banner */
            <div className="flex flex-col items-center text-center py-12 space-y-5">
              <div className="w-20 h-20 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-full flex items-center justify-center border border-rose-100 dark:border-rose-900">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-black text-slate-900 dark:text-white">
                  Online applications are currently closed
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Please contact the school administration or check back later for registration updates.
                </p>
              </div>
            </div>
          ) : (
            /* Full Registration Form */
            <StudentRegistration
              isAdminView={false}
              onCreated={() => {
                setTimeout(() => setIsOpen(false), 3000);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`group relative inline-flex items-center justify-center gap-2.5 rounded-full font-sans font-medium text-sm tracking-wide transition-all duration-300 cursor-pointer ${
          registrationOpen
            ? "bg-white text-zinc-950 hover:bg-zinc-100 hover:scale-[1.01] shadow-xl shadow-white/[0.01]"
            : "bg-zinc-800/60 text-zinc-400 border border-zinc-700/50"
        } ${className || "px-8 py-4"}`}
      >
        <span>{registrationOpen ? "Apply Now" : "Admissions Closed"}</span>
        {registrationOpen ? (
          <svg
            className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 stroke-[2.5]"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        ) : (
          <svg className="w-4 h-4 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {/* Portaled Modal */}
      {isOpen && mounted && createPortal(modalContent, document.body)}
    </>
  );
}