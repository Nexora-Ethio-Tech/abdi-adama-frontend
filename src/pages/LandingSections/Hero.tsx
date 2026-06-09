import { useScroll, useTransform, useSpring, motion } from 'framer-motion';
import {
    ArrowRight,
    LogIn,
    ArrowLeft,
    Send,
    Video,
    Camera,
    Music2,
    CheckCircle2,
    Users,
    Award,
    BookOpen,
    MapPin,
    Heart,
    Star,
    Zap,
    Globe,
    Quote,
    GraduationCap,
    Lock
} from 'lucide-react';
import { useStore } from '../../context/useStore';
import { useUser } from '../../context/UserContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { formatEthiopianLabel } from '../../utils/ethiopianCalendar';



export default function Hero({ setShowAdmission }: { setShowAdmission: (show: boolean) => void }) {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const { schoolName, schoolMotto, registrationOpen } = useUser();
    const { publicPosts } = useStore();

    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 500], [0, 200]);
    const y2 = useTransform(scrollY, [0, 500], [0, -150]);
    const rotateX = useTransform(scrollY, [0, 1000], [0, 45]);
    const rotateY = useTransform(scrollY, [0, 1000], [0, 25]);
    const scale = useTransform(scrollY, [0, 300], [1, 0.9]);

    const springConfig = { stiffness: 100, damping: 30, restDelta: 0.001 };
    const smoothY1 = useSpring(y1, springConfig);
    const smoothY2 = useSpring(y2, springConfig);
    const smoothRotateX = useSpring(rotateX, springConfig);
    const smoothRotateY = useSpring(rotateY, springConfig);

    return (
        <>
            <section id="home" className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-slate-50 dark:bg-slate-950">
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.1),_transparent_50%)]" />
                    <div className="absolute bottom-0 left-0 w-1/2 h-full bg-[radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.1),_transparent_50%)]" />

                    {/* Floating 3D Elements */}
                    <motion.div
                        style={{ y: smoothY1, rotateX: smoothRotateX, rotateY: smoothRotateY }}
                        className="absolute top-[15%] left-[5%] w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-3xl rounded-[2rem] border border-white/20 shadow-2xl flex items-center justify-center preserve-3d"
                    >
                        <BookOpen size={40} className="text-blue-500/30" />
                    </motion.div>

                    <motion.div
                        style={{ y: smoothY2, rotateX: smoothRotateY, rotateY: smoothRotateX }}
                        className="absolute top-[60%] right-[10%] w-48 h-48 bg-gradient-to-tr from-emerald-500/10 to-blue-500/10 backdrop-blur-3xl rounded-full border border-white/20 shadow-2xl flex items-center justify-center preserve-3d"
                    >
                        <GraduationCap size={60} className="text-emerald-500/30" />
                    </motion.div>

                    <motion.div
                        style={{ y: smoothY1, rotateZ: smoothRotateX }}
                        className="absolute top-[40%] left-[80%] w-24 h-24 bg-rose-500/10 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-xl flex items-center justify-center rotate-12 preserve-3d"
                    >
                        <Music2 size={30} className="text-rose-500/30" />
                    </motion.div>

                    <motion.div
                        animate={{
                            y: [0, -20, 0],
                            rotate: [0, 10, 0]
                        }}
                        transition={{
                            duration: 10,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="absolute top-[25%] right-[20%] w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center"
                    >
                        <Star size={24} className="text-amber-500/40" />
                    </motion.div>

                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] dark:opacity-[0.05]" />
                </div>

                <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8 fade-in-up">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-[10px] font-black uppercase tracking-widest text-school-primary shadow-sm">
                                    <Globe size={14} className="animate-spin-slow" />
                                    {t('landing.heroSubtitle')}
                                </div>
                                <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tight leading-[0.9]">
                                    {t('landing.heroTitle')} <br />
                                    <span className="text-gradient">{t('landing.heroHighlight')}</span> {t('landing.heroEnd')}
                                </h1>
                                <div className="flex flex-col gap-1 text-slate-500 dark:text-slate-400 font-medium italic border-l-4 border-school-primary pl-4 py-2">
                                    <p>{schoolMotto.oromic}</p>
                                    <p>{schoolMotto.amharic}</p>
                                    <p>{schoolMotto.english}</p>
                                </div>
                            </div>

                            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed">
                                {t('landing.heroDesc')}
                            </p>

                            <div className="flex flex-wrap gap-4">
                                <button
                                    onClick={() => registrationOpen && setShowAdmission(true)}
                                    disabled={!registrationOpen}
                                    className={`px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all flex items-center gap-3 group shine ${registrationOpen
                                        ? 'bg-school-primary hover:bg-school-primary/90 text-white shadow-2xl shadow-school-primary/30'
                                        : 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed border-2 border-dashed border-slate-400'
                                        }`}
                                >
                                    {registrationOpen ? t('landing.applyBtn') : t('landing.admissionClosed', 'Admission Closed')}
                                    {registrationOpen && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                                    {!registrationOpen && <Lock size={16} />}
                                </button>
                            </div>
                        </div>

                        <motion.div
                            style={{ rotateX: smoothRotateX, rotateY: smoothRotateY, scale }}
                            className="relative hidden lg:block perspective-1000"
                        >
                            <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white dark:border-slate-900 aspect-[4/5] group preserve-3">
                                <img src="/school.png" alt="Students" className="w-full h-full object-cover slow-zoom" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
                            
                            </div>
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-school-secondary/20 rounded-full blur-3xl animate-pulse" />
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-school-primary/20 rounded-full blur-3xl animate-pulse delay-700" />
                        </motion.div>
                    </div>
                </div>
            </section>
            {/* Updates / Posts Section */}
            {publicPosts.length > 0 && (
                <section
                    id="updates"
                    className="py-16 md:py-24 bg-slate-50 dark:bg-slate-900"
                >
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-8 md:mb-12">
                        <div className="section-header !text-left !mb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <span className="section-subtitle">
                                    {t('landing.stayInformed')}
                                </span>
                                <h2 className="section-title">
                                    {t('landing.updates.title')}
                                </h2>
                            </div>

                            <div className="hidden md:flex gap-2">
                                <button
                                    type="button"
                                    aria-label="Scroll updates left"
                                    onClick={() => {
                                        const el = document.querySelector('.updates-scroll');
                                        if (el) {
                                            el.scrollBy({
                                                left: -450,
                                                behavior: 'smooth',
                                            });
                                        }
                                    }}
                                    className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-school-primary hover:border-school-primary transition-colors"
                                >
                                    <ArrowLeft size={20} />
                                </button>

                                <button
                                    type="button"
                                    aria-label="Scroll updates right"
                                    onClick={() => {
                                        const el = document.querySelector('.updates-scroll');
                                        if (el) {
                                            el.scrollBy({
                                                left: 450,
                                                behavior: 'smooth',
                                            });
                                        }
                                    }}
                                    className="w-10 h-10 rounded-full bg-school-primary text-white flex items-center justify-center shadow-lg hover:bg-school-primary/90 transition-colors"
                                >
                                    <ArrowRight size={20} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div
                        className="
        updates-scroll
        px-4 sm:px-6
        pb-8

        grid grid-cols-1 sm:grid-cols-2 gap-6

        md:flex md:gap-6
        md:overflow-x-auto
        md:snap-x md:snap-mandatory
        md:hide-scrollbar
        md:pl-[calc(50vw-40rem+1.5rem)]
        md:pr-6
      "
                    >
                        {publicPosts.map((post) => (
                            <div
                                key={post.id}
                                className="
            snap-start
            w-full
            md:w-[400px]
            md:shrink-0

            bg-white
            dark:bg-slate-950

            rounded-3xl
            border border-slate-100 dark:border-slate-800
            shadow-xl
            overflow-hidden

            group
            hover:-translate-y-2
            transition-all duration-500

            flex flex-col
          "
                            >
                                <div className="relative aspect-[4/3] bg-slate-100 dark:bg-slate-900 overflow-hidden">
                                    {post.type === 'image' ? (
                                        <img
                                            src={post.mediaUrl}
                                            alt="Update"
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                    ) : (
                                        <iframe
                                            src={post.mediaUrl}
                                            title="Update media"
                                            className="w-full h-full pointer-events-none"
                                        />
                                    )}

                                    <div className="absolute top-4 left-4">
                                        <span className="px-3 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur text-[10px] font-black uppercase tracking-widest rounded-full text-school-primary shadow-sm">
                                            {formatEthiopianLabel(post.timestamp)}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-5 md:p-6 flex-1 flex flex-col">
                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium line-clamp-3">
                                        {post.description}
                                    </p>

                                    <div className="mt-auto pt-6 flex items-center gap-2 text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest group-hover:text-school-primary transition-colors cursor-pointer w-fit">
                                        {t('landing.readMore')}
                                        <ArrowRight
                                            size={14}
                                            className="group-hover:translate-x-1 transition-transform"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </>
    )
}