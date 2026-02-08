import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload, FileText, Loader2, CheckCircle, Target,
    AlertCircle, Briefcase, Sparkles, ArrowRight, BookOpen, X
} from 'lucide-react';

interface Skill {
    name: string;
    confidence: number;
}

interface RoadmapPhase {
    phase: string;
    skills: Array<{
        name: string;
        courses: Array<{
            platform: string;
            title: string;
            url: string;
        }>;
    }>;
}

interface Recommendation {
    skill: string;
    confidence: number;
    courses: Array<{ platform: string; title: string; url: string }>;
    source: 'confidence' | 'gap';
    reason?: string;
}

const ResumeUpload: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [skills, setSkills] = useState<Skill[]>([]);
    const [roadmap, setRoadmap] = useState<RoadmapPhase[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const [showRecommendations, setShowRecommendations] = useState(false);
    const [roles, setRoles] = useState<string[]>([]);
    const [selectedRole, setSelectedRole] = useState<string>('');
    const [selectedSector, setSelectedSector] = useState<string>('Technology');
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const userId = localStorage.getItem('user_id');
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const sectors = ['Technology', 'Marketing', 'HR', 'Finance', 'Design', 'Healthcare'];

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/roles');
                const data = await response.json();
                if (response.ok && data.roles) {
                    setRoles(data.roles);
                    if (data.roles.length > 0) setSelectedRole(data.roles[0]);
                }
            } catch (error) { console.error('Failed to fetch roles:', error); }
        };
        fetchRoles();
    }, []);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(e.type === "dragenter" || e.type === "dragover");
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
    };

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        if (selectedRole) formData.append('target_role', selectedRole);
        formData.append('target_sector', selectedSector);

        try {
            const response = await fetch('http://localhost:5000/api/resume/analyze', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (response.ok) {
                const initialSkills = (data.skills || []).map((skill: Skill) => ({ ...skill, confidence: 0.5 }));
                setSkills(initialSkills);
                setRoadmap(data.roadmap || []);
                localStorage.setItem('userSkills', JSON.stringify(initialSkills));
                if (selectedRole) localStorage.setItem('targetRole', selectedRole);
                localStorage.setItem('targetSector', selectedSector);

                if (userId && initialSkills.length > 0) {
                    await fetch(`http://localhost:5000/api/profile/${userId}/skills/bulk`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            skills: initialSkills.map((s: Skill) => ({
                                skill_name: s.name,
                                confidence: s.confidence,
                                source: 'resume'
                            }))
                        })
                    });
                }
            }
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    const handleLocalConfidenceChange = (idx: number, newVal: number) => {
        const updated = [...skills];
        updated[idx].confidence = newVal / 100;
        setSkills(updated);
        // Sync to local storage for persistence across pages
        localStorage.setItem('userSkills', JSON.stringify(updated));
    };

    const getRecommendations = async () => {
        setLoading(true);
        const weakSkills = skills.filter(s => s.confidence < 0.7);
        const confidenceBasedRecs: Recommendation[] = [];
        weakSkills.forEach(ws => {
            roadmap.forEach(ph => {
                ph.skills.forEach(rs => {
                    if (rs.name.toLowerCase() === ws.name.toLowerCase()) {
                        confidenceBasedRecs.push({ skill: ws.name, confidence: ws.confidence, courses: rs.courses, source: 'confidence' });
                    }
                });
            });
        });

        if (userId && selectedRole) {
            try {
                const response = await fetch(`http://localhost:5000/api/gap-analysis/${userId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        target_role: selectedRole,
                        target_sector: selectedSector,
                        skills: skills.map(s => ({ name: s.name, confidence: s.confidence }))
                    })
                });
                const data = await response.json();
                if (data.recommendations) {
                    const uniqueRecs = [...data.recommendations.map((r: any) => ({
                        skill: r.skill,
                        confidence: skills.find(s => s.name.toLowerCase() === r.skill.toLowerCase())?.confidence || 0,
                        courses: r.courses || [],
                        source: 'gap',
                        reason: r.reason
                    })), ...confidenceBasedRecs];
                    setRecommendations(uniqueRecs.filter((v, i, a) => a.findIndex(t => t.skill === v.skill) === i));
                }
            } catch (err) { console.error(err); }
        }
        setShowRecommendations(true);
        setLoading(false);
    };

    return (
        <div className="space-y-8">
            {/* HEADER */}
            <div>
                <h1 className="text-3xl font-black text-[#1A1C1E] tracking-tight mb-1">Analyze Resume</h1>
                <p className="text-[#A0AEC0] font-bold text-[10px] uppercase tracking-widest">Extract DNA and bridge the gap to your target role</p>
            </div>

            {/* DROPZONE & SETTINGS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <motion.div
                    className={`lg:col-span-2 glass-panel p-8 border-2 border-dashed transition-all flex flex-col items-center justify-center text-center ${dragActive ? 'border-[#6366F1] bg-[#6366F1]/5' : 'border-[#F1F3F5] hover:border-[#6366F1]/50'
                        }`}
                    onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
                >
                    {!file ? (
                        <>
                            <div className="w-16 h-16 bg-[#EEF2FF] rounded-2xl flex items-center justify-center text-[#6366F1] mb-4">
                                <Upload className="h-8 w-8" />
                            </div>
                            <h3 className="text-sm font-bold text-[#1A1C1E] mb-1">Drop your resume here</h3>
                            <p className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-widest mb-6">PDF or DOCX accepted</p>
                            <input type="file" id="file-upload" className="hidden" accept=".pdf,.docx" onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])} />
                            <label htmlFor="file-upload" className="btn-primary !w-auto px-8 cursor-pointer">Browse Files</label>
                        </>
                    ) : (
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-[#F8F9FB] rounded-2xl flex items-center justify-center text-[#6366F1]"><FileText /></div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-[#1A1C1E]">{file.name}</p>
                                <p className="text-[10px] font-black text-[#A0AEC0]">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                            <button onClick={() => { setFile(null); setSkills([]); }} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"><X className="h-5 w-5" /></button>
                        </div>
                    )}
                </motion.div>

                <div className="space-y-4">
                    <div className="glass-panel p-6">
                        <label className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-widest mb-3 block">Target Goal</label>
                        <select value={selectedSector} onChange={(e) => setSelectedSector(e.target.value)} className="w-full bg-[#F8F9FB] border-none rounded-xl py-3 px-4 text-sm font-bold mb-3 outline-none focus:ring-2 focus:ring-[#6366F1]/20">
                            {sectors.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="w-full bg-[#F8F9FB] border-none rounded-xl py-3 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#6366F1]/20">
                            {roles.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    {file && !skills.length && (
                        <button onClick={handleUpload} disabled={loading} className="btn-primary">
                            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Extract Skills'}
                        </button>
                    )}
                </div>
            </div>

            {/* SKILL RATINGS (Compact Format) */}
            {skills.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-sm font-black text-[#1A1C1E] uppercase tracking-tight">Rate Your Extracted Skills</h2>
                        <span className="text-[10px] font-bold text-[#A0AEC0] uppercase">{skills.length} skills found</span>
                    </div>
                    <div className="space-y-2">
                        {skills.map((skill, idx) => (
                            <div key={idx} className="glass-panel p-4 flex items-center gap-6 group">
                                <div className="w-1/4 min-w-0">
                                    <p className="text-sm font-bold text-[#1A1C1E] truncate">{skill.name}</p>
                                    <p className="text-[9px] font-black text-[#A0AEC0] uppercase">Extracted from Resume</p>
                                </div>
                                <div className="flex-1 flex items-center gap-4">
                                    <span className="text-[10px] font-black text-[#6366F1] w-8">{Math.round(skill.confidence * 100)}%</span>
                                    <div className="relative flex-1 h-2.5 bg-[#F1F3F5] rounded-full overflow-hidden">
                                        <div className="h-full bg-[#6366F1] rounded-full transition-all" style={{ width: `${skill.confidence * 100}%` }} />
                                        <input type="range" min="0" max="100" value={skill.confidence * 100} onChange={(e) => handleLocalConfidenceChange(idx, parseInt(e.target.value))} className="absolute inset-0 w-full opacity-0 cursor-pointer" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button onClick={getRecommendations} disabled={loading} className="btn-primary group !py-5">
                        {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                            <>Get Course Recommendations <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" /></>
                        )}
                    </button>
                </motion.div>
            )}

            {/* RECOMMENDATIONS (Bento Style) */}
            {showRecommendations && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {recommendations.map((rec, idx) => (
                        <div key={idx} className="glass-panel p-6 flex flex-col justify-between hover:bg-white transition-all">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-md font-black text-[#1A1C1E]">{rec.skill}</h3>
                                    <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase ${rec.source === 'gap' ? 'bg-indigo-50 text-[#6366F1]' : 'bg-amber-50 text-amber-500'}`}>
                                        {rec.source}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {rec.courses.map((c, ci) => (
                                        <a key={ci} href={c.url} target="_blank" className="flex items-center justify-between p-3 bg-[#F8F9FB] rounded-xl hover:bg-[#EEF2FF] transition-colors group">
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-[#1A1C1E] truncate">{c.title}</p>
                                                <p className="text-[9px] font-black text-[#A0AEC0] uppercase">{c.platform}</p>
                                            </div>
                                            <ArrowRight className="h-3 w-3 text-[#CBD5E0] group-hover:text-[#6366F1] transition-all" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ResumeUpload;