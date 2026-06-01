import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { useLanguage } from "../context/LanguageContext";

export default function HorizontalScroll() {
  const ref = useRef(null);
  const { translations } = useLanguage();
  const { scrollYProgress } = useScroll({ target: ref });
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-66.66%"]);

  const programs = translations.programs.items;

  return (
    <section ref={ref} className="h-[300vh] bg-zinc-950 relative">
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <motion.div style={{ x }} className="flex w-[300vw]">
          {programs.map((program, idx) => (
            <div key={idx} className="w-screen h-screen flex items-center justify-center p-6 md:p-12 lg:p-20 relative">

              <div className="absolute inset-0 overflow-hidden">
                <img src={program.img} className="w-full h-full object-cover scale-105" alt={program.title} />
                <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-[2px]" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950" />
              </div>

              <div className="relative z-10 max-w-5xl w-full flex flex-col md:flex-row gap-6 md:gap-12 items-start md:items-center justify-between">

                {/* TITLE SIDE */}
                <h3 className="w-full md:w-1/2 min-w-0 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white uppercase tracking-tighter leading-[0.95] break-words">
                  {program.title.split(' ').map((word, i) => (
                    <span key={i} className="block">{word}</span>
                  ))}
                </h3>

                {/* DESCRIPTION SIDE */}
                <div className="w-full md:w-1/2 min-w-0 md:pl-10 md:border-l border-zinc-800">
                  <p className="text-base sm:text-lg md:text-xl text-zinc-300 font-light leading-relaxed">
                    {program.desc}
                  </p>
                  <div className="mt-6 flex items-center gap-4 text-xs sm:text-sm font-bold tracking-widest uppercase text-amber-500">
                    <span>0{idx + 1}</span>
                    <div className="h-px w-12 bg-amber-500/50" />
                    <span>{translations.programs.label}</span>
                  </div>
                </div>

              </div>

            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}