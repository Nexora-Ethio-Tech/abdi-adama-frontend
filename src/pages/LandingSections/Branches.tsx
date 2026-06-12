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

interface BranchInfo {
    name: string;
    address: string;
    email: string;
    logo_url?: string;
}

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

    const { t, i18n } = useTranslation();

    const [branches, setBranches] = useState<BranchInfo[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true); // Added loading state
    const DEFAULT_BRANCH_IMAGE = "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1200&auto=format&fit=crop";

    useEffect(() => {
        // Setup scroll listener
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);

        // Track mount status to prevent memory leaks if the user navigates away mid-fetch
        let isMounted = true;

        const init = async () => {
            setIsLoading(true);
            const result = await fetchBranches();

            // Only update state if the component is still visible/mounted
            if (isMounted) {
                // Safely accessing your API structure nested under result.data.data based on your initial state behavior
                const branchData = result?.data?.data || result?.data || [];
                console.log("Branches fetched successfully: ", branchData);
                setBranches(branchData);
                setIsLoading(false);
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

                <div className="grid md:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6 perspective-2000">
                    {isLoading ? (
                        // Skeleton Layout matching the real card structure
                        Array.from({ length: 4 }).map((_, i) => (
                            <div 
                                key={`skeleton-${i}`}
                                className="animate-pulse overflow-hidden bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl"
                            >
                                {/* Image Box Skeleton */}
                                <div className="relative h-52 bg-slate-200 dark:bg-slate-800 flex items-end p-6">
                                    <div className="absolute top-4 left-4 w-12 h-12 bg-slate-300 dark:bg-slate-700 rounded-2xl" />
                                    <div className="h-6 bg-slate-300 dark:bg-slate-700 rounded w-2/3" />
                                </div>
                                
                                {/* Content Skeleton */}
                                <div className="p-6 space-y-4">
                                    <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-1/2" />
                                    <div className="space-y-2">
                                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6" />
                                    </div>
                                    <div className="pt-2">
                                        <div className="h-3 bg-slate-300 dark:bg-slate-700 rounded w-1/3" />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        // Real Render Layout
                        branches.map((branch, i) => (
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
                                        src={branch.logo_url || DEFAULT_BRANCH_IMAGE}
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
                                        href={`http://maps.google.com/?q=${encodeURIComponent(`${branch.name} ${branch.address}`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-[10px] font-black text-school-primary uppercase tracking-widest hover:gap-3 transition-all"
                                    >
                                        {t("landing.branches.viewMap")}
                                        <ArrowRight size={12} />
                                    </a>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </section>
    );
}