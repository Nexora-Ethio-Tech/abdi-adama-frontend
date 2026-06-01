import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface ApplyButtonProps {
  /** Optional custom Tailwind padding, width, or height classes to override default sizing (e.g., "px-4 py-2 text-xs") */
  className?: string;
}

export default function ApplyButtonSection({ className = "" }: ApplyButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Ensure document is available (Next.js SSR safe)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent background scrolling when form side sheet is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-end overflow-hidden p-0 sm:p-4">
      {/* Backdrop Blur Layer */}
      <div 
        onClick={() => setIsOpen(false)}
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-500"
      />

      {/* Form Side Sheet */}
      <div className="relative w-full max-w-xl h-full sm:h-[95vh] bg-zinc-900 border-l sm:border border-zinc-800 sm:rounded-3xl shadow-2xl flex flex-col z-10">
        
        {/* Header Block */}
        <div className="p-8 border-b border-zinc-800 flex justify-between items-start">
          <div>
            <span className="text-amber-500 font-mono text-[10px] uppercase tracking-[0.25em] block mb-1">
              Admissions 2026
            </span>
            <h3 className="text-2xl font-serif font-medium tracking-tight text-white">
              Application Form
            </h3>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-full bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={(e) => e.preventDefault()} className="flex-1 overflow-y-auto p-8 space-y-6 font-sans font-light text-zinc-300">
          
          {/* Student Details Section */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-500">Student Profile</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400">First Name</label>
                <input type="text" required className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400">Last Name</label>
                <input type="text" required className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors" />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400">Grade Level Entering</label>
              <select required className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors appearance-none">
                <option value="" disabled selected hidden>Select targeted grade...</option>
                <option value="kindergarten">Kindergarten</option>
                <option value="primary">Primary School (Grades 1-6)</option>
                <option value="middle">Middle School (Grades 7-8)</option>
                <option value="secondary">Secondary School (Grades 9-12)</option>
              </select>
            </div>
          </div>

          <hr className="border-zinc-800/60 my-6" />

          {/* Family Details Section */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-500">Guardian Information</h4>
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400">Parent / Guardian Full Name</label>
              <input type="text" required className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors" />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400">Phone Number</label>
                <input type="tel" required placeholder="+251" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400">Email Address</label>
                <input type="email" required className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors" />
              </div>
            </div>
          </div>

          {/* Form Action Footer inside Side Sheet */}
          <div className="pt-8 flex flex-col space-y-3">
            <button
              type="submit"
              className="w-full bg-white text-zinc-950 text-center py-4 rounded-xl font-medium text-sm tracking-wide transition-all duration-200 hover:bg-zinc-100"
            >
              Submit Pre-Registration
            </button>
            <p className="text-[11px] text-center text-zinc-500 leading-normal">
              Submitting this form indexes your entry for the upcoming school window. Admissions administration will contact you directly within 48 business hours.
            </p>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* TRIGGER BUTTON (Stays safely inside Navbar structure) */}
      <button
        onClick={() => setIsOpen(true)}
        className={`group relative inline-flex items-center justify-center gap-2.5 bg-white text-zinc-950 rounded-full font-sans font-medium text-sm tracking-wide transition-all duration-300 hover:bg-zinc-100 hover:scale-[1.01] shadow-xl shadow-white/[0.01] ${
          className || "px-8 py-4"
        }`}
      >
        <span>Apply Now</span>
        <svg 
          className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 stroke-[2.5]" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </button>

      {/* PORTALED MODAL OVERLAY (Bypasses layout traps completely) */}
      {isOpen && mounted && createPortal(modalContent, document.body)}
    </>
  );
}