import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ExternalLink, Github, Loader2, RefreshCcw,
  Save, Sparkles, Code2, Star, GitBranch
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type GitHubSkill = {
  name: string;
  confidence: number;
  source: 'github';
  evidence: string;
};

type GitHubProject = {
  name: string;
  description: string;
  url: string;
  language: string;
  language_breakdown?: Record<string, number>;
  topics?: string[];
  stars?: number;
  updated_at?: string;
};

type ImportResponse = {
  status: 'success';
  imported: { projects: number; skills: number };
  github_username: string;
  total_repos: number;
  projects: GitHubProject[];
  skills: GitHubSkill[];
  message: string;
};

function parseUsernameFromGithubUrl(value: string): string | null {
  const raw = (value || '').trim();
  if (!raw) return null;
  if (raw.startsWith('http')) {
    try {
      const u = new URL(raw);
      const parts = u.pathname.split('/').filter(Boolean);
      return parts[0] ?? null;
    } catch { return null; }
  }
  return raw;
}

const GitHubTab: React.FC = () => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  const navigate = useNavigate();
  const userId = localStorage.getItem('user_id');

  const [githubInput, setGithubInput] = useState<string>('');
  const [includeLanguageBreakdown, setIncludeLanguageBreakdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResponse | null>(null);
  const [existingProjects, setExistingProjects] = useState<any[]>([]);
  const [existingSkills, setExistingSkills] = useState<any[]>([]);
  const [refreshingProfile, setRefreshingProfile] = useState(false);

  const githubUsername = useMemo(() => parseUsernameFromGithubUrl(githubInput), [githubInput]);

  const forceLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    navigate('/');
  };

  const refreshProfile = async () => {
    if (!userId) return;
    setRefreshingProfile(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/profile/${userId}`);
      if (res.status === 401 || res.status === 404) { forceLogout(); return; }
      const data = await res.json();
      setExistingProjects(data?.projects || []);
      setExistingSkills(data?.skills || []);
    } finally { setRefreshingProfile(false); }
  };

  useEffect(() => { refreshProfile(); }, []);

  const runImport = async () => {
    setError(null);
    if (!userId || !githubUsername) {
      setError('Please enter a valid GitHub identity.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/import/github`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          github_username: githubUsername,
          github_url: githubInput,
          include_language_breakdown: includeLanguageBreakdown,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.message || 'Import failed'); return; }
      setImportResult(data as ImportResponse);
      await refreshProfile();
    } catch (e: any) { setError('Network error'); } finally { setLoading(false); }
  };

  const languageSkillSummary = useMemo(() => {
    if (!importResult?.skills?.length) return [];
    return [...importResult.skills].sort((a, b) => b.confidence - a.confidence).slice(0, 10);
  }, [importResult]);

  return (
    <div className="space-y-8 pb-12 font-sans text-[#1A1C1E]">
      {/* HEADER */}
      <div className="px-4">
        <h1 className="text-3xl font-black tracking-tight mb-1 flex items-center gap-3">
          <Github className="h-8 w-8 text-[#6366F1]" />
          GitHub Intelligence
        </h1>
        <p className="text-[#A0AEC0] font-bold text-[10px] uppercase tracking-widest">Verify your skills through live repository analysis</p>
      </div>

      {/* MISSION CONTROL BAR */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-4">
        <div className="glass-panel p-6 bg-white flex flex-col md:flex-row gap-4 items-end shadow-sm">
          <div className="flex-1 w-full">
            <label className="block text-[10px] font-black text-[#A0AEC0] uppercase tracking-widest mb-3 ml-1">GitHub Profile / Username</label>
            <div className="relative">
              <Github className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#CBD5E0]" />
              <input
                value={githubInput}
                onChange={(e) => setGithubInput(e.target.value)}
                placeholder="https://github.com/username"
                className="input-field pl-14 !py-4"
              />
            </div>
            <label className="mt-4 flex items-center gap-2 text-[10px] font-bold text-[#718096] uppercase cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeLanguageBreakdown}
                onChange={(e) => setIncludeLanguageBreakdown(e.target.checked)}
                className="w-4 h-4 rounded border-[#CBD5E0] text-[#6366F1] focus:ring-[#6366F1]/20"
              />
              Deep Analysis (Language Breakdown)
            </label>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            {/* FIXED: Centered and Spaced Import Button */}
            <button
              onClick={runImport}
              disabled={loading}
              className="btn-primary flex-1 md:!w-40 !py-4 flex items-center justify-center gap-2 group transition-all active:scale-95"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Save className="h-4 w-4 text-white" />
                  <span className="uppercase tracking-widest text-[10px] font-black">Import</span>
                </>
              )}
            </button>

            <button
              onClick={refreshProfile}
              disabled={refreshingProfile}
              className="px-6 py-4 rounded-2xl bg-[#F8F9FB] text-[#718096] font-black text-[10px] uppercase tracking-widest hover:bg-[#EEF2FF] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {refreshingProfile ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4" />
              )}
              <span>Refresh</span>
            </button>
          </div>
        </div>
        {error && <p className="mt-3 text-rose-500 text-[10px] font-black uppercase tracking-tight ml-2">{error}</p>}
      </motion.div>

      {/* STATS BENTO */}
      <AnimatePresence>
        {importResult && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Imported Projects', val: importResult.imported.projects, icon: Code2, color: 'text-blue-500 bg-blue-50' },
              { label: 'Derived Skills', val: importResult.imported.skills, icon: Sparkles, color: 'text-[#6366F1] bg-[#EEF2FF]' },
              { label: 'Public Repos', val: importResult.total_repos, icon: GitBranch, color: 'text-purple-500 bg-purple-50' }
            ].map((stat, i) => (
              <div key={i} className="glass-panel p-6 bg-white flex items-center gap-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-black leading-tight">{stat.val}</p>
                  <p className="text-[9px] font-black text-[#A0AEC0] uppercase tracking-widest">{stat.label}</p>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* REPO GRID */}
      <div className="px-4 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-sm font-black uppercase tracking-tight ml-2 mb-4">Live Analysis Feed</h2>
          {importResult?.projects?.map((p) => (
            <div key={p.url} className="glass-panel p-5 bg-white group hover:shadow-lg transition-all border border-transparent hover:border-[#6366F1]/10">
              <div className="flex justify-between items-start mb-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black truncate">{p.name}</p>
                  <p className="text-xs text-[#A0AEC0] font-medium mt-1 truncate max-w-xs">{p.description}</p>
                </div>
                <a href={p.url} target="_blank" rel="noreferrer" className="p-2 bg-[#F8F9FB] rounded-xl text-[#CBD5E0] hover:text-[#6366F1] transition-colors ml-3">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
              <div className="flex flex-wrap gap-2">
                {p.language && <span className="px-2 py-0.5 rounded-lg bg-[#6366F1]/5 text-[#6366F1] text-[9px] font-black uppercase">{p.language}</span>}
                {p.stars !== undefined && p.stars > 0 && (
                  <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-500 text-[9px] font-black uppercase flex items-center gap-1">
                    <Star className="h-3 w-3" fill="currentColor" /> {p.stars}
                  </span>
                )}
              </div>
            </div>
          ))}
          {!importResult && <div className="glass-panel p-12 text-center text-[#A0AEC0] font-bold text-xs uppercase bg-white/50 border-dashed border-2">Awaiting Synchronization</div>}
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-black uppercase tracking-tight ml-2 mb-4">Genome Impact</h2>
          <div className="glass-panel p-8 bg-white h-fit">
            <div className="space-y-6">
              {languageSkillSummary.length > 0 ? languageSkillSummary.map((s) => (
                <div key={s.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black">{s.name}</span>
                    <span className="text-[10px] font-black text-[#6366F1] bg-[#EEF2FF] px-2 py-0.5 rounded-md uppercase">{Math.round(s.confidence * 100)}% Match</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#F1F3F5] rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${s.confidence * 100}%` }} className="h-full bg-[#6366F1] rounded-full" />
                  </div>
                </div>
              )) : (
                <div className="text-center py-10">
                  <Sparkles className="h-10 w-10 text-[#CBD5E0] mx-auto mb-4" />
                  <p className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-widest">Connect GitHub to see impact</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GitHubTab;