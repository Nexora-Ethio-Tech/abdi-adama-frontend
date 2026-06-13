import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScroll, useTransform, useSpring, motion } from 'framer-motion';
import { StudentRegistration } from '../components/StudentRegistration';
import { Chatbot } from '../components/Chatbot';
import logo from '../assets/logo.jpg';
import SchoolLife from './LandingSections/SchoolLife';
import { useUser } from '../context/UserContext';
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
  Lock,
  X
} from 'lucide-react';
import About from './LandingSections/About';
import Programs from './LandingSections/Programs';
import Branches from './LandingSections/Branches';
import { Routes, Route, useLocation } from "react-router-dom";

import { useTranslation } from 'react-i18next';
import NavBar from './LandingSections/NavBar';
import { branchService } from '../services/branchService';
import Hero from './LandingSections/Hero';

const Home = ({ showAdmission, scrolled, setScrolled, displaySchoolName, setShowAdmission }: { showAdmission: boolean, scrolled: boolean, setScrolled: React.Dispatch<React.SetStateAction<boolean>>, displaySchoolName: string, setShowAdmission: (show: boolean) => void }) => {


  if (showAdmission) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
        <div className="max-w-4xl mx-auto mt-8">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            {/* Header with Close Button */}
            <div className="flex items-center justify-between p-8 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-4">
                <img src={logo} alt="School Logo" className="w-16 h-16 rounded-2xl shadow-lg object-cover" />
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admission Portal</h1>
                  <p className="text-sm text-slate-500">{displaySchoolName}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAdmission(false)}
                className="p-3 text-slate-600 dark:text-slate-300 hover:text-white hover:bg-school-primary dark:hover:bg-school-primary bg-slate-100 dark:bg-slate-800 rounded-lg transition-all font-bold flex-shrink-0"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
            {/* Form Content */}
            <div className="p-1">
              <StudentRegistration isAdminView={false} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Students', value: '2,500+', icon: Users, color: 'text-blue-500' },
    { label: 'Qualified Teachers', value: '120+', icon: Award, color: 'text-emerald-500' },
    { label: 'School Branches', value: '4', icon: MapPin, color: 'text-rose-500' },
    { label: 'Clubs & Activities', value: '15+', icon: Zap, color: 'text-amber-500' },
  ];



  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-500 overflow-x-hidden">
      <Hero setShowAdmission={setShowAdmission} />
      {/* Stats Section */}
      <section className="py-20 relative z-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 50, rotateX: -45 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
                className="text-center space-y-2 group perspective-1000"
              >
                <div className={`mx-auto w-16 h-16 ${stat.color} bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 border border-slate-100 dark:border-slate-800 preserve-3d`}>
                  <stat.icon size={28} />
                </div>
                <h4 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-4">{stat.value}</h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className='block sm:hidden'>
        <About />
        <Programs setShowAdmission={setShowAdmission} />
        <SchoolLife showAdmission={showAdmission} setShowAdmission={setShowAdmission} displaySchoolName={displaySchoolName} />
        <Branches setScrolled={setScrolled} />
        <div />
        <Chatbot />
      </div>
    </div>
  );
};

export const LandingPage = () => {
  const [showAdmission, setShowAdmission] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { schoolName, schoolMotto, registrationOpen } = useUser();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const displaySchoolName = schoolName.english;
  return (
    <>
      <NavBar scrolled={scrolled} />
      <Routes>
        <Route path="/" element={<Home setScrolled={setScrolled} showAdmission={showAdmission} scrolled={scrolled} displaySchoolName={displaySchoolName} setShowAdmission={setShowAdmission} />} />
        <Route path="/about" element={<About />} />
        <Route path="/programs" element={<Programs setShowAdmission={setShowAdmission} />} />
        <Route path="/school-life" element={<SchoolLife showAdmission={showAdmission} setShowAdmission={setShowAdmission} displaySchoolName={displaySchoolName} />} />
        <Route path="/branches" element={<Branches setScrolled={setScrolled} />} />
      </Routes>
      <footer className="bg-white dark:bg-slate-950 pt-24 pb-12 border-t border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <img src={logo} alt="Logo" className="w-12 h-12 rounded-xl shadow-md" />
                <div>
                  <span className="font-black text-slate-900 dark:text-white tracking-tighter block leading-none">ABDI ADAMA</span>
                  <span className="text-[10px] font-black text-school-primary uppercase tracking-widest">Smart School</span>
                </div>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('landing.footer.founded')}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-black uppercase tracking-[0.3em] text-slate-900 dark:text-white mb-6">{t('landing.footer.quickLinks')}</h4>
              <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
                {Object.entries(t('landing.footer.links', { returnObjects: true }) as any).map(([key, label]) => (
                  <li key={key}><span onClick={() => navigate(key)} className="hover:text-school-primary transition-colors font-bold uppercase tracking-widest text-[10px]">{label as string}</span></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-black uppercase tracking-[0.3em] text-slate-900 dark:text-white mb-6">{t('landing.footer.connect')}</h4>
              <div className="flex gap-4">
                {[
                  { icon: Send, url: 'https://t.me/abdiadamaschool', color: 'hover:text-blue-500', name: 'Telegram' },
                  { icon: Video, url: 'https://www.youtube.com/@AbdiadamaSchool-s1c', color: 'hover:text-rose-600', name: 'YouTube' },
                  { icon: Camera, url: 'https://www.instagram.com/abdi_adama_school/', color: 'hover:text-pink-500', name: 'Instagram' },
                  { icon: Music2, url: 'https://www.tiktok.com/@abdiadama1', color: 'hover:text-black dark:hover:text-white', name: 'TikTok' }
                ].map((social, i) => (
                  <a key={i} href={social.url} target="_blank" rel="noopener noreferrer" className={`flex flex-col items-center gap-1.5 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-400 ${social.color} transition-all shadow-sm group`}>
                    <social.icon size={20} />
                    <span className="text-[9px] font-black uppercase tracking-widest">{social.name}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-12 border-t border-slate-100 dark:border-slate-800 text-center space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">{t('landing.footer.rights')}</p>
          </div>
        </div>
      </footer>
    </>
  );
}

