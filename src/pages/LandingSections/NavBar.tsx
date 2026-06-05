import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.jpg";
import { useTranslation } from "react-i18next";

export default function NavBar({ scrolled }: { scrolled: boolean }) {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    const navItems = [
        { key: "", label: t("nav.home") },
        { key: "about", label: t("nav.about") },
        { key: "programs", label: t("nav.programs") },
        { key: "school-life", label: "School Life" },
        { key: "branches", label: t("nav.branches") },
    ];

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-lg`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <div
                        className="flex items-center gap-3 group cursor-pointer"
                        onClick={() =>
                            window.scrollTo({
                                top: 0,
                                behavior: "smooth",
                            })
                        }
                    >
                        <img
                            src={logo}
                            alt="Logo"
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl shadow-lg transition-transform group-hover:scale-110"
                        />

                        <div>
                            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tighter block leading-none">
                                ABDI ADAMA
                            </span>
                            <span className="text-[10px] sm:text-xs font-black text-school-primary uppercase tracking-widest">
                                School
                            </span>
                        </div>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden lg:flex items-center gap-6">
                        <div className="flex items-center gap-8">
                            {navItems.map((item) => (
                                <Link
                                    key={item.key}
                                    to={`/${item.key}`}
                                    className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-school-primary transition-colors"
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </div>

                        <select
                            aria-label="Select language"
                            value={i18n.language}
                            onChange={(e) => {
                                i18n.changeLanguage(e.target.value);
                                localStorage.setItem(
                                    "abdi_adama_language",
                                    e.target.value
                                );
                            }}
                            className="bg-transparent text-xs font-bold text-slate-500 dark:text-slate-400 outline-none cursor-pointer hover:text-school-primary"
                        >
                            <option value="en">EN</option>
                            <option value="am">AM</option>
                            <option value="om">OM</option>
                        </select>

                        <button
                            onClick={() => navigate("/login")}
                            className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
                        >
                            {t("nav.signIn")}
                        </button>
                    </div>

                    {/* Mobile Controls */}
                    <div className="flex lg:hidden items-center gap-3">
                        <select
                            aria-label="Select language"
                            value={i18n.language}
                            onChange={(e) => {
                                i18n.changeLanguage(e.target.value);
                                localStorage.setItem(
                                    "abdi_adama_language",
                                    e.target.value
                                );
                            }}
                            className="bg-transparent text-xs font-bold text-slate-500 dark:text-slate-400 outline-none"
                        >
                            <option value="en">EN</option>
                            <option value="am">AM</option>
                            <option value="om">OM</option>
                        </select>

                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            aria-label="Toggle menu"
                        >
                            <div className="w-6 flex flex-col gap-1.5">
                                <span
                                    className={`h-0.5 bg-slate-900 dark:bg-white transition-all ${
                                        mobileOpen
                                            ? "rotate-45 translate-y-2"
                                            : ""
                                    }`}
                                />
                                <span
                                    className={`h-0.5 bg-slate-900 dark:bg-white transition-all ${
                                        mobileOpen ? "opacity-0" : ""
                                    }`}
                                />
                                <span
                                    className={`h-0.5 bg-slate-900 dark:bg-white transition-all ${
                                        mobileOpen
                                            ? "-rotate-45 -translate-y-2"
                                            : ""
                                    }`}
                                />
                            </div>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <div
                    className={`lg:hidden overflow-hidden transition-all duration-300 ${
                        mobileOpen
                            ? "max-h-[500px] opacity-100 mt-4"
                            : "max-h-0 opacity-0"
                    }`}
                >
                    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-xl p-4">
                        <div className="flex flex-col">
                            {navItems.map((item) => (
                                <Link
                                    key={item.key}
                                    to={`/${item.key}`}
                                    onClick={() => setMobileOpen(false)}
                                    className="py-3 text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:text-school-primary border-b border-slate-200 dark:border-slate-800 last:border-0"
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </div>

                        <button
                            onClick={() => {
                                setMobileOpen(false);
                                navigate("/login");
                            }}
                            className="w-full mt-4 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg"
                        >
                            {t("nav.signIn")}
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}