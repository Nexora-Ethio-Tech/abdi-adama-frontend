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
import { useState, useEffect } from 'react';
import { branchService } from '../../services/branchService';
import { useTranslation } from 'react-i18next';



export default function Branches({ setScrolled }: { setScrolled: (scrolled: boolean) => void }) {
    const fetchBranches = async () => {
        try {
            const branches = await branchService.getAllBranchesGuest();

            if (!branches) {
                throw new Error("Server returned an empty or invalid response");
            }

            return { success: true, data: branches };
        } catch (err) {
            console.error('❌ Error fetching branches (Server likely unreachable):', err);

            // Always return a fallback array so downstream code never crashes
            return {
                success: false,
                data: [],
                error: "Server is unreachable"
            };
        }
    };

    interface BranchInfo {
        name: string;
        address: string;
        email: string;
        profile_image?: string;
    }
    
    const { t, i18n } = useTranslation();

    const [branches, setBranches] = useState<BranchInfo[]>([]);
    const [error, setError] = useState(true)
    const DEFAULT_BRANCH_IMAGE = "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1200&auto=format&fit=crop";

    useEffect(() => {
        // Setup scroll listener
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);

        // Track mount status to prevent memory leaks if the user navigates away mid-fetch
        let isMounted = true;

        const init = async () => {
            const result = await fetchBranches();

            // Only update state if the component is still visible/mounted
            if (isMounted) {
                const branchData = result?.data || [];
                console.log("Branches fetched successfully: ", branchData);
                setError(false);
                setBranches(branchData.data);

                // Handle the error state gracefully in the UI
                if (!result.success) {
                    setError(true);
                }
            }
        };

        init();

        // Clean up scroll listeners and abort state updates on unmount
        return () => {
            isMounted = false;
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <section id="branches" className="py-24 bg-slate-50 dark:bg-slate-950">
            <div className="max-w-7xl mx-auto px-6">
                <div className="section-header">
                    <span className="section-subtitle">{t('landing.branches.subtitle')}</span>
                    <h2 className="section-title">{t('landing.branches.title')}</h2>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 perspective-2000">
                    {branches.map((branch, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 50, rotateX: -30 }}
                            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: i * 0.15 }}
                            whileHover={{ scale: 1.05, rotateY: 5 }}
                            className="group overflow-hidden bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl hover:shadow-2xl transition-all duration-500 preserve-3d"
                        >
                            {/* Branch Image */}
                            <div className="relative h-52 overflow-hidden">
                                <img
                                    src={branch.profile_image || DEFAULT_BRANCH_IMAGE}
                                    alt={branch.name}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />

                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                                {/* Floating Location Icon */}
                                <div className="absolute top-4 left-4 w-12 h-12 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center text-school-primary shadow-lg">
                                    <MapPin size={24} />
                                </div>

                                {/* Branch Name on Image */}
                                <div className="absolute bottom-4 left-4 right-4">
                                    <h4 className="text-xl font-black text-white tracking-tight">
                                        {branch.name}
                                    </h4>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <p className="text-[10px] font-black text-school-primary uppercase tracking-widest mb-4 px-3 py-1 bg-school-primary/5 rounded-full w-fit">
                                    {branch.address}
                                </p>

                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6 break-all">
                                    {branch.email}
                                </p>

                                <a
                                    href={`https://maps.google.com/?q=${encodeURIComponent(
                                        `${branch.name} ${branch.address}`
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-[10px] font-black text-school-primary uppercase tracking-widest hover:gap-3 transition-all"
                                >
                                    {t("landing.branches.viewMap")}
                                    <ArrowRight size={12} />
                                </a>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>

    );
};