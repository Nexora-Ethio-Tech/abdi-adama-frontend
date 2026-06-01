import { motion } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";

export default function ProgramsPage() {
  const { translations } = useLanguage();
  const t = translations.programs;

  // Re-structured strictly around the new 3-level scope with curated imagery placements
  const academicLevels = [
    {
      num: "01",
      title: "Kindergarten",
      desc: "Playful activities to build basic literacy, numeracy, and social skills alongside art, music, and movement to encourage early creativity.",
      focus: ["Play-based Literacy & Numeracy", "Social-Emotional Milestones", "Creative Expression (Art & Movement)"],
      img: "https://www.abdiadama.com/assets/images/firdosmusa.jpg",
      cta: "More Info."
    },
    {
      num: "02",
      title: "Elementary School",
      desc: "Deepening core competencies in math, science, English, and social studies, while introducing vital computer literacy, digital skills, and active extracurricular clubs.",
      focus: ["Core STEM & Humanities Foundations", "Digital Literacy & Computer Skills", "Sports, Arts & After-school Clubs"],
      img: "https://www.abdiadama.com/assets/images/curriculumtwo.jpg",
      cta: "Details"
    },
    {
      num: "03",
      title: "High School",
      desc: "Rigorous college-preparatory courses in science, mathematics, and the humanities, paired with practical career/technical paths, coding, debate, and entrepreneurship.",
      focus: ["College-Prep Tracks", "Coding & Advanced Electives", "Career & Technical Education (CTE)"],
      img: "https://www.abdiadama.com/assets/images/highschool.jpg",
      cta: "Explore Pathways"
    },
  ];

  return (
    <article className="min-h-screen bg-zinc-950 text-zinc-100 pt-32 pb-32 selection:bg-amber-500/30 selection:text-white overflow-hidden">
      {/* Refined, organic ambient textures instead of hard gradient balls */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-amber-500/[0.03] to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-6">
        {/* EDITORIAL HEADER */}
        <header className="max-w-3xl mb-32 relative">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 mb-6"
          >
            <span className="text-amber-500 font-mono text-xs uppercase tracking-widest">
              Educational Framework
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl md:text-6xl font-serif font-medium tracking-tight text-white mb-8"
          >
            {t.title || "Academic Programs"}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-zinc-400 text-lg md:text-xl font-light leading-relaxed max-w-2xl"
          >
            {t.desc || "A cohesive learning continuum designed to foster intellectual agility, cultural pride, and future-ready skills from early childhood through graduation."}
          </motion.p>
        </header>

        {/* ASYMMETRICAL ACADEMIC STAGES */}
        <section className="space-y-32">
          {academicLevels.map((level, idx) => {
            const isEven = idx % 2 === 0;
            return (
              <motion.div
                key={level.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className={`flex flex-col lg:flex-row items-center gap-12 lg:gap-20 ${isEven ? "" : "lg:flex-row-reverse"
                  }`}
              >
                {/* Visual Half */}
                <div className="w-full lg:w-1/2 relative group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-2xl z-10 pointer-events-none" />
                  <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 relative">
                    <img
                      src={level.img}
                      alt={`${level.title} showcase`}
                      className="w-full h-full object-cover transition duration-1000 ease-[0.16, 1, 0.3, 1] group-hover:scale-102"
                    />
                  </div>
                  {/* Floating Absolute Stage Indicator Badge */}
                  <span className="absolute -top-6 -right-4 lg:-right-6 text-7xl md:text-8xl font-serif italic text-zinc-900 select-none pointer-events-none font-bold z-0 opacity-40 group-hover:text-amber-500/10 transition-colors duration-500">
                    {level.num}
                  </span>
                </div>

                {/* Text Content Half */}
                <div className="w-full lg:w-1/2 space-y-6 relative z-10">
                  <div className="flex items-center gap-4">
                    <h3 className="text-2xl md:text-3xl font-serif tracking-tight text-white">
                      {level.title}
                    </h3>
                  </div>

                  <p className="text-zinc-400 text-base md:text-lg font-light leading-relaxed">
                    {level.desc}
                  </p>

                  <div className="pt-4 border-t border-zinc-900/80 space-y-3">
                    <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 block">
                      Curriculum Highlights
                    </span>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                      {level.focus.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-300 font-light">
                          <span className="w-1 h-1 bg-amber-500 rounded-full mt-2 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>
              </motion.div>
            );
          })}
        </section>
      </div>
    </article>
  );
}