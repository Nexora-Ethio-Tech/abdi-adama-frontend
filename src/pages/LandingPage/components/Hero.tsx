import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { useLanguage } from "../context/LanguageContext";

export default function Hero() {
  const ref = useRef(null);
  const { translations } = useLanguage();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const yText = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const iconOpacity = useTransform(scrollYProgress, [0, 0.05], [1, 0]);

  return (
    <section ref={ref} className="relative h-[150vh] bg-zinc-950">
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Cinematic background image layer */}
        <motion.img
          style={{ scale, opacity }}
          src="https://www.abdiadama.com/assets/images/SchoolBuildingtwo.jpg"
          className="absolute inset-0 w-full h-full object-cover opacity-45 mix-blend-luminosity"
          alt="High School Campus"
        />
        
        {/* Editorial vignette & lighting overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/45 via-zinc-950/60 to-zinc-950" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(9,9,11,0.85)_100%)] pointer-events-none" />

        {/* Core Content */}
        <motion.div
          style={{ opacity, y: yText }}
          className="relative z-10 h-full max-w-5xl mx-auto px-6 flex flex-col items-center justify-center text-center"
        >
          {/* Welcome Tag */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-[10px] md:text-xs font-sans font-light tracking-[0.4em] text-zinc-400 uppercase">
              {translations.hero.welcome}
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-extrabold font-serif tracking-tight text-white leading-[1.05] uppercase max-w-4xl">
            {translations.hero.title}
          </h1>

          {/* Subtitle */}
          <p className="text-zinc-400 mt-8 text-base sm:text-lg md:text-xl font-sans font-light tracking-wide max-w-xl leading-relaxed">
            {translations.hero.subtitlePrefix}
            <span className="text-zinc-200 font-sans font-light"> {translations.hero.subtitleExcellence} </span>
            {translations.hero.subtitleSuffix}
          </p>
        </motion.div>

        {/* Minimalist Architectural Scroll Prompt */}
        <motion.div
          style={{ opacity: iconOpacity }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20"
        >
          <div className="flex flex-col items-center gap-3">
            <span className="text-[9px] font-mono tracking-[0.35em] uppercase text-zinc-500">
              {translations.hero.scroll || "Scroll"}
            </span>
            <div className="h-10 w-[1px] bg-gradient-to-b from-zinc-700 to-transparent relative overflow-hidden">
              <motion.div
                animate={{ y: ["-100%", "100%"] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-0 left-0 w-full h-1/2 bg-white/80"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}