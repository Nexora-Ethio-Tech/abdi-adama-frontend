import React from 'react';
import { SiTelegram, SiYoutube, SiInstagram, SiTiktok } from 'react-icons/si';
import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="relative bg-zinc-950 px-6 py-20 md:py-28 flex flex-col justify-between border-t border-zinc-900 text-white selection:bg-amber-500/20">
            <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-8 items-start">

                {/* BRAND COLUMN */}
                <div className="md:col-span-5 space-y-6">
                    <div className="flex items-center gap-4">
                        {/* School Logo */}
                        <img
                            src="https://abdi-adama.vercel.app/assets/images/logo-fTBWQkNS.jpg"
                            className="h-10 w-10 md:h-12 md:w-12 rounded-full grayscale hover:grayscale-0 transition-all duration-300 border border-white/10"
                            alt="Abdi Adama Logo"
                        />
                        <div>
                            <h2 className="text-xl font-serif font-medium tracking-tight text-white leading-none">
                                Abdi Adama
                            </h2>
                        </div>
                    </div>

                    <p className="text-zinc-400 text-sm md:text-base font-sans font-light leading-relaxed max-w-sm">
                        Founded in 2005, Abdi Adama School is a premier educational institution in Ethiopia dedicated to producing competent, confident, and patriotic citizens.
                    </p>
                </div>

                {/* QUICK LINKS COLUMN */}
                <div className="md:col-span-3 pt-8 md:pt-0 md:border-t-0 border-t border-zinc-900/60 space-y-4">
                    <h4 className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-500">
                        Quick Links
                    </h4>
                    <ul className="space-y-3 font-sans font-light text-sm">
                        <li>
                            <Link to="/" className="text-zinc-400 hover:text-white transition-colors duration-200">Home</Link>
                        </li>
                        <li>
                            <Link to="/about" className="text-zinc-400 hover:text-white transition-colors duration-200">About Us</Link>
                        </li>
                        <li>
                            <Link to="/programs" className="text-zinc-400 hover:text-white transition-colors duration-200">Programs</Link>
                        </li>
                        <li>
                            <Link to="/branches" className="text-zinc-400 hover:text-white transition-colors duration-200">Branches</Link>
                        </li>
                    </ul>
                </div>

                {/* CONNECT & SOCIALS COLUMN */}
                <div className="md:col-span-4 pt-8 md:pt-0 md:border-t-0 border-t border-zinc-900/60 space-y-6">
                    <div>
                        <h4 className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-500 mb-4">
                            Connect With Us
                        </h4>

                        <div className="grid grid-cols-2 gap-4 font-sans font-light text-sm text-zinc-400">
                            {/* Telegram */}
                            <a
                                href="https://t.me/abdiadamaschool"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2.5 hover:text-white transition-colors group"
                            >
                                <SiTelegram className="w-4 h-4 text-zinc-600 group-hover:text-sky-400 transition-colors duration-300" />
                                Telegram
                            </a>

                            {/* YouTube */}
                            <a
                                href="https://www.youtube.com/@AbdiadamaSchool-s1c"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2.5 hover:text-white transition-colors group"
                            >
                                <SiYoutube className="w-4 h-4 text-zinc-600 group-hover:text-red-500 transition-colors duration-300" />
                                YouTube
                            </a>

                            {/* Instagram */}
                            <a
                                href="https://www.instagram.com/abdi_adama_school/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2.5 hover:text-white transition-colors group"
                            >
                                <SiInstagram className="w-4 h-4 text-zinc-600 group-hover:text-pink-500 transition-colors duration-300" />
                                Instagram
                            </a>

                            {/* TikTok */}
                            <a
                                href="https://www.tiktok.com/@abdiadama1"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2.5 hover:text-white transition-colors group"
                            >
                                <SiTiktok className="w-4 h-4 text-zinc-600 group-hover:text-teal-400 transition-colors duration-300" />
                                TikTok
                            </a>
                        </div>
                    </div>
                </div>

            </div>

            {/* FOOTER METRICS */}
            <div className="max-w-7xl mx-auto w-full border-t border-zinc-900 mt-20 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-zinc-600 text-xs font-mono">
                <p>© {new Date().getFullYear()} Abdi Adama School. All rights reserved.</p>
                <p className="tracking-widest uppercase text-[10px] text-zinc-500/60">
                    Knowledge • Culture • Discipline
                </p>
            </div>
        </footer>
    );
}