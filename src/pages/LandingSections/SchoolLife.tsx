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
    const { t, i18n } = useTranslation();
    const { schoolName, schoolMotto, registrationOpen } = useUser();
    const navigate = useNavigate();

    return (
        <>
            <SchoolLifeSection id="school-life" />

            {/* Media & Life Section */}
            <section id="media" className="py-24 bg-white dark:bg-slate-950 flex justify-center">
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
                                {t('landing.media.introTitle')} <span className="text-gradient">{t('landing.media.introHighlight')}</span>
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
                                        <h4 className="text-white font-black uppercase tracking-widest text-xs mb-1">{t('landing.media.schoolTourTitle')}</h4>
                                        <p className="text-white/70 text-[10px] font-medium">{t('landing.media.schoolTourDesc')}</p>
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

                    </div>
                </motion.div>
                <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-school-primary/10 blur-[150px] -translate-y-1/2" />
                <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-school-secondary/10 blur-[150px] -translate-y-1/2" />
            </section>
        </>
    );
}