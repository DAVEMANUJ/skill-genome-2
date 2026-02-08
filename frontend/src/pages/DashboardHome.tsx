import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { TrendingUp, Target, Github, ArrowRight, Sparkles, BookOpen, Rocket } from 'lucide-react';

const DashboardHome: React.FC = () => {
    const apiBaseUrl = useMemo(() => import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000', []);

    const [skillsTracked, setSkillsTracked] = useState<number | null>(null);
    const [projectsImported, setProjectsImported] = useState<number | null>(null);
    const [displayName, setDisplayName] = useState<string | null>(null);

    useEffect(() => {
        const userId = localStorage.getItem('user_id');
        if (!userId) return;

        const controller = new AbortController();
        (async () => {
            try {
                const res = await fetch(`${apiBaseUrl}/api/profile/${userId}`, { signal: controller.signal });
                if (!res.ok) return;
                const data = await res.json();
                setDisplayName(data?.user?.name || data?.user?.username || null);
                setSkillsTracked(Array.isArray(data?.skills) ? data.skills.length : 0);
                setProjectsImported(Array.isArray(data?.projects) ? data.projects.length : 0);
            } catch (err) {
                console.error("Dashboard fetch error:", err);
            }
        })();
        return () => controller.abort();
    }, [apiBaseUrl]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-10"
        >
            {/* HERO BANNER */}
            <motion.div
                variants={itemVariants}
                className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] p-10 text-white shadow-2xl shadow-[#6366F1]/20"
            >
                <div className="relative z-10 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-black uppercase tracking-widest mb-6">
                        <Sparkles className="h-3 w-3" />
                        AI Career Architect Active
                    </div>
                    <h1 className="text-4xl font-black mb-4 leading-tight">
                        {displayName ? `Sharpen Your Skills, ${displayName.split(' ')[0]}!` : 'Sharpen Your Professional Edge'}
                    </h1>
                    <p className="text-white/80 font-medium mb-8 text-lg">
                        Your Skill Genome is evolving. You have {skillsTracked || 0} skills mapped—keep going to reach your target role.
                    </p>
                    <Link to="/dashboard/recommendations" className="inline-flex items-center gap-3 bg-white text-[#6366F1] px-8 py-4 rounded-full font-black text-sm uppercase tracking-widest hover:bg-[#F8F9FB] transition-all shadow-lg active:scale-95">
                        Continue Learning
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
                {/* Decorative Elements */}
                <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-[-20%] left-[40%] w-48 h-48 bg-purple-400/20 rounded-full blur-2xl" />
            </motion.div>

            {/* CATEGORY SNAPSHOTS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div variants={itemVariants} className="glass-panel p-8 flex items-center justify-between group cursor-pointer hover:bg-white transition-all">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-[#EEF2FF] flex items-center justify-center text-[#6366F1] group-hover:scale-110 transition-transform">
                            <TrendingUp className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="text-3xl font-black text-[#1A1C1E]">{skillsTracked ?? '—'}</p>
                            <p className="text-xs font-black text-[#A0AEC0] uppercase tracking-widest mt-1">Skills Tracked</p>
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[#F8F9FB] flex items-center justify-center text-[#CBD5E0] group-hover:text-[#6366F1] transition-colors">
                        <ChevronRight className="h-5 w-5" />
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="glass-panel p-8 flex items-center justify-between group cursor-pointer hover:bg-white transition-all">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-[#F5F3FF] flex items-center justify-center text-[#8B5CF6] group-hover:scale-110 transition-transform">
                            <Github className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="text-3xl font-black text-[#1A1C1E]">{projectsImported ?? '—'}</p>
                            <p className="text-xs font-black text-[#A0AEC0] uppercase tracking-widest mt-1">Projects Synced</p>
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[#F8F9FB] flex items-center justify-center text-[#CBD5E0] group-hover:text-[#8B5CF6] transition-colors">
                        <ChevronRight className="h-5 w-5" />
                    </div>
                </motion.div>
            </div>

            {/* GET STARTED JOURNEY */}
            <motion.div variants={itemVariants}>
                <div className="flex items-center justify-between mb-8 px-4">
                    <h2 className="text-xl font-black text-[#1A1C1E] uppercase tracking-tight">Your Journey</h2>
                    <Link to="/dashboard/pathways" className="text-[#6366F1] text-xs font-black uppercase tracking-widest hover:underline">View All</Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { title: 'Resume Analysis', desc: 'Map your history', icon: BookOpen, path: '/dashboard/upload', color: 'bg-blue-50' },
                        { title: 'GitHub Sync', desc: 'Import live proof', icon: Github, path: '/dashboard/github', color: 'bg-purple-50' },
                        { title: 'Skill Roadmap', desc: 'Bridge the gaps', icon: Rocket, path: '/dashboard/pathways', color: 'bg-indigo-50' }
                    ].map((step, idx) => (
                        <Link key={idx} to={step.path}>
                            <motion.div
                                whileHover={{ y: -5 }}
                                className="glass-panel p-8 h-full flex flex-col items-center text-center group"
                            >
                                <div className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform`}>
                                    <step.icon className="h-8 w-8 text-[#6366F1]" />
                                </div>
                                <h3 className="font-black text-[#1A1C1E] mb-2">{step.title}</h3>
                                <p className="text-xs font-bold text-[#A0AEC0] uppercase tracking-tighter">{step.desc}</p>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
};

const ChevronRight = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);

export default DashboardHome;