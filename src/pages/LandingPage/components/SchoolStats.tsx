import { useRef, useEffect, useState } from "react";
import { useInView } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";

const useScramble = (target: string, isTriggered: boolean, duration: number = 1500): string => {
  const [value, setValue] = useState<string>("");
  const chars = "0123456789";

  useEffect(() => {
    if (!isTriggered) {
      setValue(target.split("").map(() => "0").join(""));
      return;
    }

    let iteration = 0;
    const interval = setInterval(() => {
      setValue(
        target
          .split("")
          .map((_char, index) => {
            if (!/\d/.test(target[index])) return target[index]; // Keep non-numeric characters intact
            if (index < iteration) return target[index];
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("")
      );

      if (iteration >= target.length) clearInterval(interval);
      iteration += 1 / 3;
    }, duration / (target.length * 3));

    return () => clearInterval(interval);
  }, [target, isTriggered, duration]);

  return value;
};

interface StatItemProps {
  index: number;
  value: string;
  label: string;
  final: string;
}

function StatItem({ index, value, label, final }: StatItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, {
    once: true,
    margin: "-80px",
  });

  const displayValue = useScramble(value, isInView);

  return (
    <div
      ref={ref}
      className="flex flex-col items-start text-left pt-6 border-t border-zinc-900 relative"
    >
      {/* Index marker */}
      <span className="text-[10px] font-mono tracking-widest text-zinc-600 mb-2">
        0{index + 1} //
      </span>

      <div className="flex items-baseline gap-1">
        <span className="text-5xl sm:text-6xl md:text-7xl font-light text-zinc-100 tracking-tight tabular-nums leading-none">
          {displayValue}
        </span>
        {final && (
          <span className="text-2xl md:text-3xl font-light text-zinc-500 leading-none">
            {final}
          </span>
        )}
      </div>

      <p className="mt-4 text-xs sm:text-sm font-semibold tracking-wider text-zinc-400 uppercase">
        {label}
      </p>
    </div>
  );
}

export default function SchoolStats() {
  const { translations } = useLanguage();
  const stats = translations.stats.items;

  return (
    <section className="min-h-screen bg-zinc-950 text-white flex items-center justify-center py-20 px-6 sm:px-12 md:px-16 lg:px-24">
      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8 items-start">
        
        {/* LEFT COLUMN: Editorial Section Title */}
        <div className="lg:col-span-4 sticky top-24">
          <div className="flex items-center gap-3 mb-6">
            <span className="h-px w-6 bg-zinc-700" />
            <span className="text-xs font-mono tracking-[0.3em] uppercase text-zinc-500">
              {"Key Figures"}
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-none uppercase">
            {translations.stats.title || "Our Impact"}
          </h2>
        </div>

        {/* RIGHT COLUMN: Performance Stats Grid */}
        <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-2 gap-x-8 gap-y-12 md:gap-x-12 md:gap-y-16">
          {stats.map((stat, idx) => (
            <StatItem 
              key={stat.label} 
              index={idx}
              value={stat.value} 
              label={stat.label} 
              final={stat.final} 
            />
          ))}
        </div>

      </div>
    </section>
  );
}