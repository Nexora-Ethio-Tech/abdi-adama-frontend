import { motion } from "framer-motion";
import { useLanguage, type StudentItem } from "../context/LanguageContext";

export default function StudentBook() {
  const { translations } = useLanguage();
  const students = translations.studentBook.students || [];

  // To create a flawless infinite scroll, we duplicate the student list multiple times.
  // We create a "base set" that is guaranteed to be wider than any screen, 
  // and then double it so we can seamlessly animate exactly 50% of the total width.
  const baseSet = [...students, ...students, ...students, ...students];
  const marqueeItems = [...baseSet, ...baseSet];

  if (!students || students.length === 0) return null;

  return (
    <section className="relative w-full bg-zinc-50 dark:bg-zinc-950 py-24 lg:py-32 overflow-hidden selection:bg-amber-500/20 transition-colors duration-300">
      
      {/* HEADER */}
      <div className="max-w-4xl mx-auto px-6 text-center mb-16 lg:mb-24 relative z-20">
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="h-[2px] w-8 bg-amber-500" />
          <span className="text-xs font-mono font-semibold tracking-[0.2em] uppercase text-amber-600 dark:text-amber-500">
            {translations.studentBook.subtitle || "Student Spotlight"}
          </span>
          <span className="h-[2px] w-8 bg-amber-500" />
        </div>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-medium text-zinc-900 dark:text-white tracking-tight leading-tight">
          {translations.studentBook.title}
        </h2>
      </div>

      {/* MARQUEE WRAPPER */}
      <div className="relative flex overflow-hidden">
        
        {/* LEFT & RIGHT EDGE FADES (Creates the disappearing illusion) */}
        <div className="absolute top-0 bottom-0 left-0 w-16 md:w-48 bg-gradient-to-r from-zinc-50 dark:from-zinc-950 to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-0 w-16 md:w-48 bg-gradient-to-l from-zinc-50 dark:from-zinc-950 to-transparent z-10 pointer-events-none" />

        {/* SCROLLING TRACK */}
        <motion.div
          // Moving from 0 to -50% translates exactly one "baseSet" of width, looping perfectly.
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 40, ease: "linear", repeat: Infinity }}
          className="flex gap-6 md:gap-8 w-max px-3 md:px-4"
        >
          {marqueeItems.map((student, idx) => (
            <StudentCard key={idx} student={student} />
          ))}
        </motion.div>
      </div>

    </section>
  );
}

/**
 * Individual Student Marquee Card
 */
function StudentCard({ student }: { student: StudentItem }) {
  return (
    <div className="w-[280px] sm:w-[320px] md:w-[400px] flex-shrink-0 flex flex-col rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 group hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors duration-500 cursor-grab active:cursor-grabbing">
      
      {/* CARD IMAGE */}
      <div className="h-[250px] md:h-[300px] w-full relative overflow-hidden bg-zinc-100 dark:bg-zinc-950">
        <img 
          src={student.img} 
          alt={student.name} 
          // Image starts grayscale and slightly zooms/colors up on hover
          className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-105"
        />
        
        {/* Inner shadow to blend image into the card base */}
        <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-zinc-900 via-transparent to-transparent opacity-90" />
        
        {/* Floating Achievement Badge */}
        <div className="absolute top-4 left-4 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md border border-zinc-200 dark:border-white/10 px-3 py-1.5 rounded-full">
          <span className="text-[10px] sm:text-xs font-mono font-bold text-amber-600 dark:text-amber-500 tracking-widest uppercase">
            {student.achievement}
          </span>
        </div>
      </div>

      {/* CARD TEXT CONTENT */}
      <div className="p-6 md:p-8 flex flex-col flex-1 relative">
        {/* Giant background quote graphic */}
        <span className="absolute top-4 right-6 text-6xl font-serif text-zinc-200 dark:text-zinc-800/50 select-none pointer-events-none">
          "
        </span>
        
        <h3 className="text-xl md:text-2xl font-serif font-medium text-zinc-900 dark:text-white tracking-wide mb-4">
          {student.name}
        </h3>
        
        <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base leading-relaxed italic">
          "{student.message}"
        </p>
      </div>
      
    </div>
  );
}