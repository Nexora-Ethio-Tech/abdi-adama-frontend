import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

interface SchoolItem {
  title: string;
  images: string[];
  text: string;
}

const items: SchoolItem[] = [
  {
    title: "School Overview",
    images: [
      "https://www.abdiadama.com/assets/images/schoolBuilding.jpg",
      "https://www.abdiadama.com/assets/images/SchoolBuildingtwo.jpg",
    ],
    text: "Abdi Adama School, founded in 1998 E.C. (2005 G.C.), is one of the leading schools in Adama. The school is known for providing a strong educational foundation and additionally, it places great focus on Afaan Oromo language and culture. Unlike many other schools, we make sure our students learn, speak, and value Afaan Oromo with confidence and pride.\n\nOver the years, our school has expanded and now operates two additional branches — one located within Adama city, and another in a nearby town. This growth reflects the trust our community places in us and our commitment to providing quality education to more families.",
  },
  {
    title: "Our Team",
    images: [
      "https://www.abdiadama.com/assets/images/ourteamtwo.jpg",
      "https://www.abdiadama.com/assets/images/ourteamthree.jpg",
    ],
    text: "Our teachers, administrators, and staff are dedicated, patient, and trained to support students of all learning levels. We believe that learning is more effective when students feel understood and encouraged, so our team works closely with each student to help them grow academically, socially, and personally.",
  },
  {
    title: "Our Transport",
    images: [
      "https://www.abdiadama.com/assets/images/transport.jpg",
    ],
    text: "We provide safe and reliable school transportation services across different areas of Adama. Our buses are regularly inspected, and each route is guided by trained staff to ensure students travel comfortably and safely every day.",
  },
  {
    title: "Uniform",
    images: [
      "https://www.abdiadama.com/assets/images/uniformlast.jpg",
      "https://www.abdiadama.com/assets/images/secondary.jpg",
    ],
    text: "Our uniform represents discipline, neatness, and unity. We encourage students to wear their uniforms properly and proudly, as it reflects their identity as members of Abdi Adama School.",
  },
  {
    title: "Extra-Curricular Activities",
    images: [
      "https://www.abdiadama.com/assets/images/extra.jpg",
      "https://www.abdiadama.com/assets/images/highschooll.jpg",
      "/team.jpg",
    ],
    text: "At Abdi Adama School, education goes beyond the classroom. We encourage students to explore their interests, develop confidence, and learn teamwork through a variety of extra-curricular activities. We also believe deeply in community responsibility, organizing initiatives to provide meals and supplies to those in need, teaching students values of generosity and empathy.\n\nWe offer: Sports clubs (football, basketball, volleyball, athletics), Arts, Music, Dance & Theatre, Science & Innovation, Cultural Heritage & Language, and Debate & Public Speaking.",
  },
  {
    title: "Our Curriculum",
    images: [
      "https://www.abdiadama.com/assets/images/curriculum.jpg",
      "https://www.abdiadama.com/assets/images/curriculumtwo.jpg",
    ],
    text: "Our curriculum is designed to build strong academic foundations while encouraging curiosity and creativity. We focus on core subjects such as Mathematics, English, Science, Amharic, ICT, and Social Studies, while also teaching problem-solving and communication skills.\n\nLearning is interactive — students explore through hands-on activities, discussions, digital tools, and real-life applications. Every student receives guidance and support to progress at their own pace.",
  },
  {
    title: "Our Secondary School",
    images: [
      "https://www.abdiadama.com/assets/images/highschool.jpg",
    ],
    text: "Our secondary school prepares students for higher learning, future careers, and personal growth. Learners develop critical thinking, leadership, teamwork, and self-discipline while strengthening their academic performance in all major subjects.\n\nWe guide students in choosing future paths — whether university studies, skilled professions, entrepreneurship, or innovation. Our goal is to help students become confident, respectful, and purpose-driven young adults.",
  },
  {
    title: "Our Promise to Parents",
    images: [
      "https://www.abdiadama.com/assets/images/promise.jpg",
    ],
    text: "At Abdi Adama school, we understand that you are placing great trust in us when you choose our school for your child. We promise to provide a safe, respectful, and encouraging environment where every student is guided to grow academically, emotionally, socially, and morally. We believe in open communication and partnership with parents, because we know that education is most effective when school and family work together. We are committed to nurturing confidence, curiosity, discipline, and strong values in every student, while ensuring that each child is seen, heard, and supported every step of the way. your child’s success is our shared goal, and we will always work with dedication and integrity to help them reach their full potential.",
  },
];

export default function SchoolGallery() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const x = useTransform(
    scrollYProgress,
    [0, 1],
    ["0vw", `-${(items.length - 1) * 100}vw`]
  );

  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <article className="relative w-full bg-zinc-950 text-white selection:bg-amber-500/20 selection:text-white">

      {/* IDENTITY SECTION: CULTURE, VALUES, MISSION & VISION */}
      <header className="relative min-h-screen bg-zinc-950 px-6 py-20 md:py-32 flex flex-col justify-between">
        <div className="max-w-7xl mx-auto w-full space-y-24">
          
          {/* Title Block */}
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="h-px w-6 bg-amber-500/50" />
              <span className="text-amber-500 font-mono tracking-[0.3em] uppercase text-xs">
                Our Identity
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-serif font-medium tracking-tight text-white leading-tight">
              What Makes Us Different
            </h1>
          </div>

          {/* Clean 4 Pillars Top-Line Separated Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            
            {/* Integrity */}
            <div className="pt-8 border-t border-zinc-900 flex flex-col justify-between">
              <div>
                <span className="text-amber-500 font-mono text-[11px] uppercase tracking-widest block mb-4">
                  01 / Integrity
                </span>
                <p className="text-zinc-400 text-sm md:text-base leading-relaxed font-light">
                  At Abdi Adama School we believe in doing what is right — always. Our community encourages honesty, responsibility, and respect. We help students build strong moral character that guides them for life.
                </p>
              </div>
            </div>

            {/* Leadership */}
            <div className="pt-8 border-t border-zinc-900 flex flex-col justify-between">
              <div>
                <span className="text-amber-500 font-mono text-[11px] uppercase tracking-widest block mb-4">
                  02 / Leadership
                </span>
                <p className="text-zinc-400 text-sm md:text-base leading-relaxed font-light">
                  Every student has the ability to lead. Through teamwork, projects, and school activities, we help learners build confidence, empathy, and the courage to inspire others.
                </p>
              </div>
            </div>

            {/* Growth & Success */}
            <div className="pt-8 border-t border-zinc-900 flex flex-col justify-between">
              <div>
                <span className="text-amber-500 font-mono text-[11px] uppercase tracking-widest block mb-4">
                  03 / Growth & Success
                </span>
                <p className="text-zinc-400 text-sm md:text-base leading-relaxed font-light">
                  Success is not only about grades — it is about growth. In Abdi Adama we teach students to set goals, work hard, learn from challenges, and believe in their own potential.
                </p>
              </div>
            </div>

            {/* Lifelong Learning */}
            <div className="pt-8 border-t border-zinc-900 flex flex-col justify-between">
              <div>
                <span className="text-amber-500 font-mono text-[11px] uppercase tracking-widest block mb-4">
                  04 / Lifelong Learning
                </span>
                <p className="text-zinc-400 text-sm md:text-base leading-relaxed font-light">
                  Learning does not end in the classroom. We encourage curiosity, creativity, and exploration — helping students become lifelong learners ready for an ever-changing world.
                </p>
              </div>
            </div>

          </div>

          {/* Mission & Vision Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 pt-16 border-t border-zinc-900">
            <div>
              <span className="text-zinc-500 text-xs font-mono uppercase tracking-widest block mb-3">Our Outlook</span>
              <h3 className="text-xl md:text-2xl font-serif font-medium tracking-tight text-white mb-4">Vision</h3>
              <p className="text-zinc-400 text-base leading-relaxed font-light">
                To provide meaningful, modern and value-based education that prepares students to become confident thinkers, problem-solvers and leaders — ready to contribute to the future of Ethiopia and the world.
              </p>
            </div>
            <div>
              <span className="text-zinc-500 text-xs font-mono uppercase tracking-widest block mb-3">Our Purpose</span>
              <h3 className="text-xl md:text-2xl font-serif font-medium tracking-tight text-white mb-4">Mission</h3>
              <p className="text-zinc-400 text-base leading-relaxed font-light">
                To be recognized as a leading school where academic excellence meets strong character development. We proudly teach with quality standards while honoring Ethiopian culture, identity, and tradition.
              </p>
            </div>
          </div>

        </div>

        {/* Minimal Scroll Indicator */}
        <div className="flex flex-col items-center gap-3 text-zinc-500 text-[10px] font-mono uppercase tracking-[0.25em] mt-24">
          <span>Scroll to explore campus gallery</span>
          <div className="h-8 w-[1px] bg-gradient-to-b from-amber-500 to-transparent relative overflow-hidden" />
        </div>
      </header>

      {/* STICKY SCROLL SECTION */}
      <section
        ref={containerRef}
        className="relative"
        style={{ height: `${items.length * 100}vh` }}
      >
        <div className="sticky top-0 h-screen overflow-hidden flex items-center">
          <motion.ul
            style={{ x, width: `${items.length * 100}vw` }}
            className="flex h-full"
          >
            {items.map((item, i) => (
              <li
                key={i}
                className="w-screen h-screen flex flex-col lg:flex-row items-center justify-center flex-shrink-0 px-6 py-12 lg:p-24 gap-8 lg:gap-16"
              >
                {/* TEXT CONTENT */}
                <div className="flex-1 flex flex-col justify-center max-w-xl order-2 lg:order-1 h-1/2 lg:h-auto overflow-y-auto pr-4 custom-scrollbar">
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-3xl md:text-4xl font-mono font-light text-zinc-700">
                      {String(i + 1).padStart(2, "0")} //
                    </span>
                    <h3 className="text-2xl md:text-4xl font-serif font-medium tracking-tight text-white">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-zinc-400 text-sm md:text-base leading-relaxed whitespace-pre-line font-light">
                    {item.text}
                  </p>
                </div>

                {/* IMAGES DISPLAY GRID */}
                <div className="flex-1 w-full max-w-xl h-1/2 lg:h-[65vh] flex items-center justify-center order-1 lg:order-2">
                  <ImageDisplay images={item.images} title={item.title} />
                </div>
              </li>
            ))}
          </motion.ul>
        </div>
      </section>

      {/* PROGRESS BAR */}
      <motion.div
        style={{ scaleX }}
        className="fixed bottom-0 lg:bottom-6 left-0 lg:left-6 right-0 lg:right-6 h-[4px] origin-left bg-amber-500 z-50 lg:rounded-full"
      />
    </article>
  );
}

/**
 * Handles rendering cohesive grid layouts for multiple image patterns.
 */
function ImageDisplay({ images, title }: { images: string[]; title: string }) {
  if (!images || images.length === 0) return null;

  // Single Image Layout
  if (images.length === 1) {
    return (
      <div className="w-full h-full relative overflow-hidden rounded-2xl group border border-white/5 bg-zinc-900">
        <img
          src={images[0]}
          alt={title}
          className="w-full h-full object-cover transition-all duration-700 ease-out grayscale hover:grayscale-0 scale-100 group-hover:scale-102"
        />
      </div>
    );
  }

  // Two Images Layout (Offset structural frames)
  if (images.length === 2) {
    return (
      <div className="grid grid-cols-12 gap-4 w-full h-full items-center">
        <div className="col-span-7 h-[85%] relative overflow-hidden rounded-2xl border border-white/5 group shadow-lg bg-zinc-900">
          <img
            src={images[0]}
            alt={`${title} - view 1`}
            className="w-full h-full object-cover transition-all duration-700 ease-out grayscale hover:grayscale-0 scale-100 group-hover:scale-102"
          />
        </div>
        <div className="col-span-5 h-[70%] relative overflow-hidden rounded-2xl border border-white/5 group shadow-lg translate-y-4 bg-zinc-900">
          <img
            src={images[1]}
            alt={`${title} - view 2`}
            className="w-full h-full object-cover transition-all duration-700 ease-out grayscale hover:grayscale-0 scale-100 group-hover:scale-102"
          />
        </div>
      </div>
    );
  }

  // Three or more Images Layout (Architectural Bento Grid)
  return (
    <div className="grid grid-cols-12 gap-3 w-full h-full">
      <div className="col-span-8 h-full relative overflow-hidden rounded-2xl border border-white/5 group shadow-lg bg-zinc-900">
        <img
          src={images[0]}
          alt={`${title} - main`}
          className="w-full h-full object-cover transition-all duration-700 ease-out grayscale hover:grayscale-0 scale-100 group-hover:scale-102"
        />
      </div>
      <div className="col-span-4 flex flex-col gap-3 h-full">
        <div className="flex-1 relative overflow-hidden rounded-xl border border-white/5 group shadow-md min-h-0 bg-zinc-900">
          <img
            src={images[1]}
            alt={`${title} - detail 1`}
            className="w-full h-full object-cover transition-all duration-700 ease-out grayscale hover:grayscale-0 scale-100 group-hover:scale-102"
          />
        </div>
        <div className="flex-1 relative overflow-hidden rounded-xl border border-white/5 group shadow-md min-h-0 bg-zinc-900">
          <img
            src={images[2]}
            alt={`${title} - detail 2`}
            className="w-full h-full object-cover transition-all duration-700 ease-out grayscale hover:grayscale-0 scale-100 group-hover:scale-102"
          />
        </div>
      </div>
    </div>
  );
}