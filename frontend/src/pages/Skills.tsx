import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Loader2, CheckCircle, Sparkles, X, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UserSkill {
    id: number;
    skill_name: string;
    confidence: number;
    sector_context: string;
    source: string;
}

const Skills: React.FC = () => {
    const apiBaseUrl = useMemo(
        () => (import.meta as any)?.env?.VITE_API_BASE_URL || 'http://localhost:5000',
        []
    );

    const navigate = useNavigate();
    const [skills, setSkills] = useState<UserSkill[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newSkill, setNewSkill] = useState({ name: '', confidence: 50 });
    const userId = localStorage.getItem('user_id');

    // We use a ref to debounce the slider updates to the API
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const forceLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user_id');
        navigate('/');
    };

    useEffect(() => {
        fetchSkills();
    }, []);

    const fetchSkills = async () => {
        if (!userId) return;
        try {
            const response = await fetch(`${apiBaseUrl}/api/profile/${userId}/skills`);
            if (response.status === 401 || response.status === 404) {
                forceLogout();
                return;
            }
            const data = await response.json();
            if (response.ok) {
                setSkills(data.skills || []);
            }
        } catch (error) {
            console.error('Failed to fetch skills:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSkill = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSkill.name || !userId) return;

        try {
            const response = await fetch(`${apiBaseUrl}/api/profile/${userId}/skills/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    skills: [{
                        skill_name: newSkill.name,
                        confidence: newSkill.confidence / 100,
                        source: 'manual'
                    }]
                })
            });

            if (response.ok) {
                await fetchSkills();
                setNewSkill({ name: '', confidence: 50 });
                setIsAdding(false);
            }
        } catch (error) {
            console.error('Failed to add skill:', error);
        }
    };

    // Optimistically update UI and debounce API call
    const handleLocalConfidenceChange = (skillId: number, newConfidenceVal: number) => {
        setSkills(prev => prev.map(s => s.id === skillId ? { ...s, confidence: newConfidenceVal / 100 } : s));

        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(async () => {
            if (!userId) return;
            try {
                await fetch(`${apiBaseUrl}/api/profile/${userId}/skills/${skillId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ confidence: newConfidenceVal / 100 })
                });
                // Optional: re-fetch to ensure sync, but optimistic UI is usually enough
                // fetchSkills();
            } catch (error) {
                console.error('Failed to update confidence:', error);
                fetchSkills(); // Revert on error
            }
        }, 500); // Wait 500ms after last slide event to send API request
    };


    const handleDeleteSkill = async (skillId: number) => {
        if (!userId) return;
        try {
            const response = await fetch(`${apiBaseUrl}/api/profile/${userId}/skills/${skillId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setSkills(skills.filter(s => s.id !== skillId));
            }
        } catch (error) {
            console.error('Failed to delete skill:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="h-10 w-10 animate-spin text-[#6366F1]" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* PAGE HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-[#1A1C1E] tracking-tight mb-1">My Skill Genome</h1>
                    <p className="text-[#A0AEC0] font-bold text-[10px] uppercase tracking-widest">Visualize and define your professional DNA</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="btn-primary group !w-auto px-6 py-3"
                >
                    <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
                    <span className="uppercase tracking-widest text-[10px] font-black">Add Skill</span>
                </button>
            </div>

            {/* ADD SKILL DRAWER (Compact) */}
            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <form onSubmit={handleAddSkill} className="glass-panel p-6 bg-white shadow-xl shadow-[#6366F1]/5 relative mb-6 flex flex-col md:flex-row items-end gap-4">
                            <button
                                type="button"
                                onClick={() => setIsAdding(false)}
                                className="absolute top-4 right-4 text-[#CBD5E0] hover:text-rose-500 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>

                            <div className="flex-1 w-full">
                                <label className="block text-[10px] font-black text-[#A0AEC0] uppercase tracking-widest mb-2 ml-1">Skill Name</label>
                                <input
                                    type="text"
                                    value={newSkill.name}
                                    onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                                    className="input-field !py-3 !text-sm"
                                    placeholder="e.g. React, Python..."
                                    required
                                />
                            </div>
                            <div className="w-full md:w-64">
                                <div className="flex justify-between items-center px-1 mb-2">
                                    <label className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-widest">Confidence</label>
                                    <span className="text-xs font-black text-[#6366F1]">{newSkill.confidence}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={newSkill.confidence}
                                    onChange={(e) => setNewSkill({ ...newSkill, confidence: parseInt(e.target.value) })}
                                    className="w-full h-2 bg-[#F1F3F5] rounded-full appearance-none cursor-pointer accent-[#6366F1]"
                                />
                            </div>
                            <button type="submit" className="btn-primary !w-auto px-8 py-3">
                                Save
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* COMPACT SKILLS LIST */}
            <div className="space-y-3">
                {skills.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-12 text-center bg-white/50 border-dashed border-2 border-[#E2E8F0]">
                        <Sparkles className="h-12 w-12 mx-auto mb-4 text-[#CBD5E0]" />
                        <h3 className="text-lg font-black text-[#1A1C1E] mb-1">Genome Empty</h3>
                        <p className="text-[#A0AEC0] text-sm font-medium">Add skills manually or sync GitHub to begin.</p>
                    </motion.div>
                ) : (
                    <AnimatePresence>
                        {skills.map((skill) => {
                            const confidencePercent = Math.round(skill.confidence * 100);
                            let colorClass = 'bg-rose-500';
                            let bgClass = 'bg-rose-50 text-rose-500';

                            if (skill.confidence > 0.7) {
                                colorClass = 'bg-emerald-500';
                                bgClass = 'bg-emerald-50 text-emerald-500';
                            } else if (skill.confidence > 0.4) {
                                colorClass = 'bg-amber-500';
                                bgClass = 'bg-amber-50 text-amber-500';
                            }

                            return (
                                <motion.div
                                    key={skill.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="glass-panel p-4 bg-white hover:shadow-md transition-all flex flex-col md:flex-row items-center gap-4 group"
                                >
                                    {/* 1. Icon & Info (Compact Left) */}
                                    <div className="flex items-center gap-4 w-full md:w-1/4">
                                        <div className={`p-2.5 rounded-xl ${bgClass}`}>
                                            <Sparkles className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-sm font-bold text-[#1A1C1E] truncate">{skill.skill_name}</h3>
                                            <p className="text-[9px] font-black text-[#A0AEC0] uppercase tracking-tighter truncate">Src: {skill.source}</p>
                                        </div>
                                    </div>

                                    {/* 2. Interactive Slider (The Core Fix) */}
                                    <div className="flex-1 w-full md:mx-4 relative flex items-center gap-4">
                                        <span className="text-xs font-black text-[#1A1C1E] w-10 text-right">{confidencePercent}%</span>
                                        <div className="relative flex-1 h-3 bg-[#F1F3F5] rounded-full overflow-hidden group/slider">
                                            {/* Visual Progress Bar */}
                                            <motion.div
                                                className={`h-full rounded-full ${colorClass}`}
                                                initial={false}
                                                animate={{ width: `${confidencePercent}%` }}
                                                transition={{ type: 'spring', stiffness: 100 }}
                                            />
                                            {/* Invisible Interactive Input Overlay */}
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={confidencePercent}
                                                onChange={(e) => handleLocalConfidenceChange(skill.id, parseInt(e.target.value))}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                title="Drag to adjust confidence"
                                            />
                                        </div>
                                    </div>

                                    {/* 3. Badges & Actions (Right) */}
                                    <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                                        <div className="px-2.5 py-1 bg-[#F8F9FB] rounded-full text-[9px] font-black text-[#718096] uppercase flex items-center gap-1">
                                            <CheckCircle className="h-3 w-3 text-[#6366F1]" />
                                            Verified
                                        </div>
                                        {skill.confidence < 0.4 && (
                                            <div className="px-2.5 py-1 bg-rose-50 rounded-full text-[9px] font-black text-rose-500 uppercase flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                Focus
                                            </div>
                                        )}
                                        <button
                                            onClick={() => handleDeleteSkill(skill.id)}
                                            className="p-2 text-[#CBD5E0] hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all md:opacity-0 md:group-hover:opacity-100"
                                            title="Delete Skill"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
};

export default Skills;