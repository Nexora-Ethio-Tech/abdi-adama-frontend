
import { useScroll, useTransform, useSpring, motion } from 'framer-motion';;
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
import { useTranslation } from 'react-i18next';
import { useUser } from '../../context/UserContext';


export default function About({setShowAdmission}: {setShowAdmission: (show: boolean) => void}) {
    const { t, i18n } = useTranslation();
    const { schoolName, schoolMotto, registrationOpen } = useUser();
    
    return (
        <section id="programs" className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-header"
          >
            <span className="section-subtitle">{t('landing.programs.subtitle')}</span>
            <h2 className="section-title">{t('landing.programs.title')}</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 perspective-2000">
            {[
              { level: t('landing.programs.kindergartenLevel'), title: t('landing.programs.kindergarten'), desc: t('landing.programs.kindergartenDesc') },
              { level: t('landing.programs.elementaryLevel'), title: t('landing.programs.elementary'), desc: t('landing.programs.elementaryDesc') },
              { level: t('landing.programs.highSchoolLevel'), title: t('landing.programs.highSchool'), desc: t('landing.programs.highSchoolDesc') }
            ].map((prog, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, z: -100, rotateY: 45, y: 50 }}
                whileInView={{ opacity: 1, z: 0, rotateY: 0, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.2, ease: "easeOut" }}
                whileHover={{ scale: 1.05, rotateY: 10, rotateX: -5 }}
                className="group p-10 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-2xl transition-all duration-500 flex flex-col items-center text-center preserve-3d"
              >
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-school-primary mb-8 group-hover:bg-school-primary group-hover:text-white transition-all duration-500 shadow-xl preserve-3d">
                  <BookOpen size={40} />
                </div>
                <span className="text-[10px] font-black text-school-primary uppercase tracking-[0.2em] mb-4 px-4 py-1.5 bg-school-primary/10 rounded-full">{prog.level}</span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">{prog.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm mb-8">{prog.desc}</p>
                <button
                  onClick={() => registrationOpen && setShowAdmission(true)}
                  disabled={!registrationOpen}
                  className={`mt-auto flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-colors group/btn ${registrationOpen ? 'text-slate-900 dark:text-white hover:text-school-primary' : 'text-slate-400'
                    }`}
                >
                  {registrationOpen ? t('landing.programs.explore') : 'Closed'}
                  {registrationOpen && <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />}
                </button>

              </motion.div>
            ))}
          </div>
        </div>
      </section>

    )
}