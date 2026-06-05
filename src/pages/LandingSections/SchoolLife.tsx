import { formatEthiopianLabel } from '../../utils/ethiopianCalendar';
import { useScroll, useTransform, useSpring, motion } from 'framer-motion';
import { PillarsSection, VisionMissionSection, CommunitySection, PromiseSection, SchoolLifeSection, TeamSection } from '../../components/LandingSections';
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
import { useTranslation } from 'react-i18next';
import { useUser } from '../../context/UserContext';
import { useState, useEffect } from 'react';
import { branchService } from '../../services/branchService';
import { useNavigate } from 'react-router-dom';



export default function SchoolLife({ setShowAdmission }: { setShowAdmission: (show: boolean) => void }) {
    const { publicPosts } = useStore();
    const { t, i18n } = useTranslation();
    const { schoolName, schoolMotto, registrationOpen } = useUser();
    const navigate = useNavigate();

    return (
        <>
            <PillarsSection />
            <VisionMissionSection />
            <CommunitySection />
            <PromiseSection />
            <SchoolLifeSection id="school-life" />
            <TeamSection />

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

            {/* Media & Life Section */}
            <section id="media" className="py-24 bg-white dark:bg-slate-950">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="section-header">
                        <span className="section-subtitle">{t('landing.communitySubtitle')}</span>
                        <h2 className="section-title">{t('landing.communityTitle')}</h2>
                    </div>

                    <div className="space-y-16">
                        {/* Header Text */}
                        <div className="max-w-3xl">
                            <div className="inline-flex items-center gap-3 px-4 py-2 bg-school-primary/10 rounded-full text-school-primary mb-6">
                                <Video size={18} />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t('landing.media.introVideo')}</span>
                            </div>
                            <h3 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-6">
                                {t('landing.media.introTitle')} meets <span className="text-gradient">{t('landing.media.introHighlight')}</span>
                            </h3>
                            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                {t('landing.media.introDesc1')}
                            </p>
                        </div>

                        {/* Videos Grid */}
                        <div className="grid lg:grid-cols-2 gap-12">
                            {/* Culture Day Video (YouTube) */}
                            <motion.div
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="group relative rounded-[3rem] overflow-hidden bg-slate-900 aspect-video shadow-2xl border-8 border-white dark:border-slate-800 perspective-1000"
                            >
                                <iframe
                                    className="w-full h-full opacity-90 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105"
                                    src="https://www.youtube.com/embed/DMtKs79RUmA"
                                    title="Abdi Adama Culture Day"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent opacity-40 pointer-events-none" />
                                <div className="absolute bottom-6 left-6 right-6 pointer-events-none">
                                    <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
                                        <h4 className="text-white font-black uppercase tracking-widest text-xs mb-1">{t('landing.media.cultureDay')}</h4>
                                        <p className="text-white/70 text-[10px] font-medium">{t('landing.media.cultureDesc')}</p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* School Intro Video (Google Drive) */}
                            <motion.div
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2 }}
                                className="group relative rounded-[3rem] overflow-hidden bg-slate-900 aspect-video shadow-2xl border-8 border-white dark:border-slate-800 perspective-1000"
                            >
                                <iframe
                                    className="w-full h-full opacity-90 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105"
                                    src="https://drive.google.com/file/d/1dGwyS7pClTRLflLSDkj8a332nTsS8lNw/preview"
                                    title="Abdi Adama Intro"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent opacity-40 pointer-events-none" />
                                <div className="absolute bottom-6 left-6 right-6 pointer-events-none">
                                    <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
                                        <h4 className="text-white font-black uppercase tracking-widest text-xs mb-1">SCHOOL TOUR</h4>
                                        <p className="text-white/70 text-[10px] font-medium">Take a look at our campus and facilities</p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 relative overflow-hidden perspective-1000">
                <motion.div
                    initial={{ opacity: 0, y: 100, rotateX: 45 }}
                    whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="max-w-7xl mx-auto px-6 text-center space-y-10 relative z-10 preserve-3d"
                >
                    <h2 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.9]">
                        {t('landing.cta.title')} <br /> <span className="text-gradient">{t('landing.cta.highlight')}</span>
                    </h2>
                    <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        {t('landing.cta.desc')}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <motion.button
                            whileHover={registrationOpen ? { scale: 1.05, y: -5 } : {}}
                            whileTap={registrationOpen ? { scale: 0.95 } : {}}
                            onClick={() => registrationOpen && setShowAdmission(true)}
                            disabled={!registrationOpen}
                            className={`px-12 py-6 rounded-[2rem] font-black uppercase tracking-widest text-sm flex items-center gap-4 transition-all ${registrationOpen
                                ? 'bg-school-primary text-white shadow-2xl shadow-school-primary/40 hover:bg-school-primary/90 shine'
                                : 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed grayscale'
                                }`}
                        >
                            {registrationOpen ? t('landing.cta.startAdmission') : 'Admission Closed'}
                            {registrationOpen ? <CheckCircle2 size={24} /> : <Lock size={20} />}
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05, y: -5 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/login')}
                            className="px-12 py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-all border-4 border-slate-900/5 dark:border-white/5"
                        >
                            {t('landing.cta.parentLogin')}
                        </motion.button>
                    </div>
                </motion.div>
                <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-school-primary/10 blur-[150px] -translate-y-1/2" />
                <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-school-secondary/10 blur-[150px] -translate-y-1/2" />
            </section>
        </>
    );
}