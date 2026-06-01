import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { NavLink, Link } from "react-router-dom";
import { useLanguage, type Language } from "../context/LanguageContext";
import ApplyButtonSection from "./ApplyButton";

export default function Navbar() {
  const { language, setLanguage, translations } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (mobileMenuOpen) return;

    if (latest > previous && latest > 50) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  const navLinks = [
    { path: "/", label: translations.nav.home },
    { path: "/about", label: translations.nav.about },
    { path: "/programs", label: translations.nav.programs },
    { path: "/branches", label: translations.nav.branches },
    { path: "/login", label: "Admin Login" },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: "-100%", opacity: 0 }}
        animate={{ y: hidden ? "-100%" : 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center bg-zinc-950/60 backdrop-blur-xl border-b border-white/5"
      >
        {/* LOGO & BRAND */}
        <Link to="/" className="flex items-center gap-3 md:gap-4 select-none cursor-pointer">
          <img
            src="https://abdi-adama.vercel.app/assets/images/logo-fTBWQkNS.jpg"
            className="h-10 w-10 md:h-12 md:w-12 rounded-full grayscale hover:grayscale-0 transition-all duration-300 border border-white/10"
            alt="Abdi Adama Logo"
          />
          <span className="font-bold tracking-widest uppercase text-xs md:text-sm text-white">
            Abdi Adama
          </span>
        </Link>

        {/* DESKTOP NAV LINKS */}
        <div className="hidden lg:flex items-center gap-8 font-medium text-[10px] tracking-[0.25em] uppercase text-zinc-400">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `hover:text-white transition-all relative py-2 ${
                  isActive ? "text-white font-bold" : ""
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {link.label}
                  {isActive && (
                    <motion.div
                      layoutId="nav-underline"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-500 rounded-full"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* CONTROLS AREA */}
        <div className="flex items-center gap-3 md:gap-6">
          {/* DESKTOP LANGUAGE SELECTOR */}
          <div className="hidden sm:flex relative items-center bg-zinc-900/50 border border-white/5 rounded-full px-3 py-1.5 group select-none">
            <select
              className="appearance-none bg-transparent text-[10px] font-bold uppercase tracking-widest text-zinc-300 outline-none cursor-pointer pr-4 hover:text-white transition-colors"
              name="language"
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              title="Select language"
            >
              <option value="en" className="bg-zinc-950 text-white">EN</option>
              <option value="am" className="bg-zinc-950 text-white">AM</option>
              <option value="or" className="bg-zinc-950 text-white">OR</option>
            </select>
            <ChevronDown className="w-3 h-3 absolute right-2 text-zinc-400 pointer-events-none group-hover:text-white transition-colors" />
          </div>

          {/* DESKTOP ACTION BUTTON */}
          <div className="hidden sm:block">
            <ApplyButtonSection className="px-4 py-2 text-xs md:text-sm" />
          </div>

          {/* MOBILE HAMBURGER TOGGLE */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 text-zinc-400 hover:text-white transition-colors cursor-pointer rounded-full hover:bg-white/5"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </motion.nav>

      {/* MOBILE FULL-SCREEN NAVIGATION MENU */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 bg-zinc-950/98 backdrop-blur-2xl z-[999] flex flex-col p-8 lg:hidden"
          >
            {/* Header section inside drawer */}
            <div className="flex justify-between items-center pb-8 border-b border-white/5">
              <div className="flex items-center gap-3">
                <img
                  src="https://abdi-adama.vercel.app/assets/images/logo-fTBWQkNS.jpg"
                  className="h-10 w-10 rounded-full grayscale"
                  alt="Logo"
                />
                <span className="font-bold tracking-wider text-sm uppercase text-white">
                  Abdi Adama
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-zinc-400 hover:text-white transition-colors cursor-pointer rounded-full hover:bg-white/5"
                aria-label="Close menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Menu Links with stagger build */}
            <div className="flex-1 flex flex-col justify-center gap-6 pl-4">
              {navLinks.map((link, idx) => (
                <motion.div
                  key={link.path}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.05, ease: "easeOut" }}
                >
                  <Link
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-400 hover:text-white uppercase flex items-center gap-4 group"
                  >
                    <span className="text-xs sm:text-sm font-mono text-amber-500/60 group-hover:text-amber-500 transition-colors">
                      0{idx + 1}.
                    </span>
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Mobile Actions Footer */}
            <div className="pt-8 border-t border-white/5 flex flex-col gap-6 items-center">
              {/* Display Language select on tiny screens if hidden from the header */}
              <div className="sm:hidden relative flex items-center bg-zinc-900/50 border border-white/10 rounded-full px-4 py-2 group select-none w-full max-w-[150px] justify-center">
                <select
                  className="appearance-none bg-transparent text-xs font-bold uppercase tracking-widest text-zinc-300 outline-none cursor-pointer pr-4 text-center w-full"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  title="Select language"
                >
                  <option value="en" className="bg-zinc-950 text-white">EN</option>
                  <option value="am" className="bg-zinc-950 text-white">AM</option>
                  <option value="or" className="bg-zinc-950 text-white">OR</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 text-zinc-400 pointer-events-none" />
              </div>

              {/* Display Action Button on tiny screens */}
              <div className="sm:hidden w-full">
                <ApplyButtonSection className="w-full py-3 text-sm text-center block" />
              </div>

              <p className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase mt-2">
                Knowledge • Culture • Discipline
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}