import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { useLanguage, type StudentItem } from "../context/LanguageContext";

export default function StudentBook() {
  const ref = useRef(null);
  const { translations } = useLanguage();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const rotate0 = useTransform(scrollYProgress, [0, 0.2], [0, -180]);
  const rotate1 = useTransform(scrollYProgress, [0.25, 0.45], [0, -180]);
  const rotate2 = useTransform(scrollYProgress, [0.5, 0.7], [0, -180]);
  const rotate3 = useTransform(scrollYProgress, [0.75, 0.95], [0, -180]);

  const z0 = useTransform(scrollYProgress, [0, 0.1, 0.1001], [40, 40, 0]);
  const z1 = useTransform(scrollYProgress, [0, 0.35, 0.3501], [30, 30, 10]);
  const z2 = useTransform(scrollYProgress, [0, 0.6, 0.6001], [20, 20, 20]);
  const z3 = useTransform(scrollYProgress, [0, 0.85, 0.8501], [10, 10, 30]);

  const students = translations.studentBook.students;

  const pages = [
    {
      rotate: rotate0,
      z: z0,
      front: (
        <div className="w-full h-full bg-zinc-900 flex flex-col items-center justify-center p-6 text-center border-l border-zinc-800 shadow-[inset_10px_0_20px_rgba(0,0,0,0.5)]">
          <img src="https://abdi-adama.vercel.app/assets/images/logo-fTBWQkNS.jpg" className="w-16 h-16 md:w-20 md:h-20 rounded-full mb-6 shadow-2xl grayscale" alt="Logo" />
          <h2 className="text-xl md:text-3xl font-black text-white uppercase tracking-widest mb-2">
            {translations.studentBook.coverTitle}
          </h2>
          <p className="text-xs text-zinc-400 tracking-[0.3em] uppercase">
            {translations.studentBook.coverSubtitle}
          </p>
          <div className="mt-8 px-6 py-2 border border-zinc-700 text-zinc-300 text-[10px] uppercase tracking-widest rounded-full">
            {translations.studentBook.coverEdition}
          </div>
        </div>
      ),
      back: (
        <div className="w-full h-full bg-[#f4f4f0] flex flex-col items-center justify-center p-6 md:p-10 text-center relative shadow-[inset_-10px_0_20px_rgba(0,0,0,0.05)]">
          <h3 className="text-lg md:text-2xl font-black text-zinc-900 mb-4 uppercase tracking-tight">
            {translations.studentBook.legacyTitle}
          </h3>
          <p className="text-zinc-600 leading-relaxed text-xs md:text-sm max-w-sm">
            "{translations.studentBook.legacyDesc}"
          </p>
        </div>
      )
    },
    {
      rotate: rotate1,
      z: z1,
      front: <StudentPageFront s={students[0]} index={0} />,
      back: <StudentPageBack s={students[0]} />
    },
    {
      rotate: rotate2,
      z: z2,
      front: <StudentPageFront s={students[1]} index={1} />,
      back: <StudentPageBack s={students[1]} />
    },
    {
      rotate: rotate3,
      z: z3,
      front: <StudentPageFront s={students[2]} index={2} />,
      back: (
        <div className="w-full h-full bg-zinc-900 flex flex-col items-center justify-center p-8 text-center shadow-[inset_-10px_0_20px_rgba(0,0,0,0.5)]">
          <p className="text-zinc-600 font-black text-xs tracking-[0.4em] uppercase mb-3">
            {translations.studentBook.endOfVolume}
          </p>
          <div className="w-8 h-px bg-zinc-700"></div>
        </div>
      )
    }
  ];

  return (
    <section ref={ref} className="min-h-[500vh] bg-zinc-950 relative">
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden py-6">
        
        <div className="mb-6 text-center z-10 px-4">
          <h2 className="text-white text-2xl md:text-4xl font-black tracking-tight mb-2">
            {translations.studentBook.title}
          </h2>
          <p className="text-zinc-400 text-xs md:text-sm font-light tracking-wide">{translations.studentBook.subtitle}</p>
        </div>

        {/* 3D Scene Wrapper */}
        <div className="w-full px-4 md:px-8 perspective-[2500px]">
          <div
            className="relative w-full max-w-3xl aspect-[4/5] md:aspect-[16/10] min-h-[380px] md:min-h-[440px] mx-auto"
            style={{
              transformStyle: "preserve-3d",
              transform: "rotateX(8deg) rotateY(-4deg)"
            }}
          >
            {/* BASE BOOK COVERS */}
            <div className="absolute inset-0 flex rounded-lg shadow-[0_30px_60px_rgba(0,0,0,0.8)] overflow-hidden bg-zinc-800 ring-1 ring-white/10">
              <div className="w-1/2 h-full bg-zinc-900 relative">
                <div className="absolute inset-1 bg-zinc-950 rounded-l-sm shadow-inner"></div>
              </div>
              <div className="w-1/2 h-full bg-zinc-900 relative border-l border-zinc-800">
                <div className="absolute inset-1 bg-zinc-950 rounded-r-sm shadow-inner flex items-center justify-center p-6">
                   <p className="text-zinc-700 uppercase tracking-widest text-xs font-bold">
                     {translations.studentBook.futureAwaits}
                   </p>
                </div>
              </div>
            </div>

            {/* SPINE SHADOW */}
            <div className="absolute top-0 bottom-0 left-1/2 w-12 -ml-6 bg-gradient-to-r from-transparent via-black/80 to-transparent pointer-events-none z-50 transform translate-z-[1px]" />

            {/* PAGES */}
            {pages.map((p, i) => (
              <motion.div
                key={i}
                className="absolute top-1 bottom-1 right-1 left-1/2 origin-left"
                style={{
                  rotateY: p.rotate,
                  zIndex: p.z,
                  transformStyle: "preserve-3d"
                }}
              >
                {/* FRONT FACE (Right Side) */}
                <div
                  className="absolute inset-0 bg-[#fbfbf9] rounded-r-md shadow-[3px_0_10px_rgba(0,0,0,0.1)] overflow-hidden"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  {/* Page curvature gradient */}
                  <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-black/10 via-black/5 to-transparent pointer-events-none z-50"></div>
                  {p.front}
                </div>

                {/* BACK FACE (Left Side) */}
                <div
                  className="absolute inset-0 bg-[#f4f4f0] rounded-l-md shadow-[-3px_0_10px_rgba(0,0,0,0.1)] overflow-hidden"
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                  <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-black/10 via-black/5 to-transparent pointer-events-none z-50"></div>
                  {p.back}
                </div>
              </motion.div>
            ))}

          </div>
        </div>

      </div>
    </section>
  );
}

function StudentPageFront({ s, index }: { s: StudentItem; index: number }) {
  return (
    <div className="w-full h-full bg-[#fbfbf9] flex flex-col p-4 md:p-8 relative text-zinc-900">
      <div className="w-full aspect-square md:aspect-video mb-4 overflow-hidden bg-zinc-200 shrink-0 rounded">
        <img src={s.img} alt={s.name} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" />
      </div>
      <div className="flex-1 flex flex-col justify-center">
        <h3 className="text-xl md:text-3xl font-black uppercase tracking-tight mb-1">{s.name}</h3>
        <p className="text-zinc-500 font-semibold mb-3 uppercase tracking-widest text-[10px]">{s.achievement}</p>
        <p className="text-zinc-800 text-xs md:text-sm leading-relaxed font-serif italic">
          "{s.message}"
        </p>
      </div>
      <div className="absolute top-4 right-4 md:top-6 md:right-6 text-zinc-300 font-black text-xl md:text-2xl pointer-events-none">
        0{index + 1}
      </div>
    </div>
  );
}

function StudentPageBack({ s }: { s: StudentItem }) {
  const { translations } = useLanguage();
  return (
    <div className="w-full h-full bg-[#f4f4f0] flex flex-col items-center justify-center p-6 md:p-8 text-center border-r border-black/5">
      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-zinc-200 mb-4 flex items-center justify-center shadow-inner overflow-hidden">
        <img src={s.img} alt={s.name} className="w-full h-full object-cover opacity-50 mix-blend-multiply" />
      </div>
      <p className="text-zinc-500 font-bold mb-4 uppercase tracking-[0.3em] text-[10px]">
        {translations.studentBook.classOf}
      </p>
      <div className="w-8 h-px bg-zinc-400"></div>
    </div>
  );
}