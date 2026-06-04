import { motion, useScroll, useTransform } from "framer-motion";
import { useState, useRef } from "react";
import { useLanguage } from "../context/LanguageContext";

export default function ProgramsShowcase() {
  const { translations } = useLanguage();
  const programs = translations.programs.items || [];
  const containerRef = useRef<HTMLDivElement>(null);

  // Tracks which program text is currently in the center of the screen
  const [activeIndex, setActiveIndex] = useState(0);

  // Global scroll progress for the progress bar
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  if (!programs || programs.length === 0) return null;

  return (
    <article 
      ref={containerRef} 
      className="relative w-full bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white selection:bg-amber-500/20 transition-colors duration-300"
    >
      {/* ---------------- MOBILE LAYOUT (Standard Vertical Stack) ---------------- */}
      <div className="block lg:hidden px-6 py-24 space-y-32">
        {programs.map((program, idx) => (
          <div key={idx} className="flex flex-col gap-8">
            <div className="w-full aspect-square relative overflow-hidden rounded-3xl border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-zinc-900 shadow-2xl">
              <img src={program.img} alt={program.title} className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-2xl font-mono font-medium text-zinc-400 dark:text-zinc-500">
                  {String(idx + 1).padStart(2, "0")} //
                </span>
                <span className="text-[10px] font-mono font-semibold tracking-[0.2em] uppercase text-amber-600 dark:text-amber-500">
                  {translations.programs.label || "Program"}
                </span>
              </div>
              <h3 className="text-4xl font-serif font-medium text-zinc-900 dark:text-white tracking-tight mb-4">
                {program.title}
              </h3>
              <p className="text-zinc-600 dark:text-zinc-300 text-base leading-relaxed">
                {program.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ---------------- DESKTOP LAYOUT (Sticky Image Crossfade) ---------------- */}
      <div className="hidden lg:flex relative w-full max-w-[1400px] mx-auto px-12 xl:px-20">
        
        {/* LEFT COLUMN: Scrolling Text */}
        <div className="w-1/2 pb-[30vh]">
          {programs.map((program, idx) => (
            <motion.div
              key={idx}
              // Triggers the active index exactly when this div hits the middle of the screen
              onViewportEnter={() => setActiveIndex(idx)}
              viewport={{ margin: "-50% 0px -50% 0px" }}
              className="min-h-screen flex flex-col justify-center pr-16 xl:pr-24 relative"
            >
              {/* Text fades and shrinks slightly when not active to guide the user's eye */}
              <motion.div
                animate={{
                  opacity: activeIndex === idx ? 1 : 0.2,
                  scale: activeIndex === idx ? 1 : 0.95,
                  x: activeIndex === idx ? 0 : -20,
                }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="origin-left"
              >
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-3xl md:text-4xl font-mono font-medium text-zinc-400 dark:text-zinc-500">
                    {String(idx + 1).padStart(2, "0")} //
                  </span>
                  <span className="text-xs font-mono font-semibold tracking-[0.2em] uppercase text-amber-600 dark:text-amber-500">
                    {translations.programs.label || "Program"}
                  </span>
                </div>

                <h3 className="text-5xl xl:text-7xl font-serif font-medium text-zinc-900 dark:text-white tracking-tight leading-[1.1] mb-8">
                  {program.title}
                </h3>

                <p className="text-zinc-600 dark:text-zinc-300 text-lg xl:text-xl leading-relaxed">
                  {program.desc}
                </p>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* RIGHT COLUMN: Sticky Pinned Image */}
        <div className="w-1/2 h-screen sticky top-0 flex items-center justify-center pl-8">
          <div className="w-full h-[70vh] relative rounded-3xl overflow-hidden border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-zinc-900 shadow-2xl">
            {programs.map((program, idx) => (
              <motion.img
                key={idx}
                src={program.img}
                alt={program.title}
                // Image smoothly crossfades, scales down, and un-blurs when it becomes active
                animate={{
                  opacity: activeIndex === idx ? 1 : 0,
                  scale: activeIndex === idx ? 1 : 1.1,
                  filter: activeIndex === idx ? "blur(0px)" : "blur(10px)",
                }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 w-full h-full object-cover origin-center"
              />
            ))}
            
            {/* Elegant vignette overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950/40 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>

      </div>
    </article>
  );
}