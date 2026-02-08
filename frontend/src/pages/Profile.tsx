import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Save,
  User2,
  Mail,
  Briefcase,
  MapPin,
  Sparkles,
  Loader2,
  CheckCircle,
  Target // Repaired: Added missing icon import
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type ProfileUser = {
  user_id: string;
  username: string;
  name?: string | null;
  email?: string | null;
  target_sector?: string | null;
  target_role?: string | null;
};

type ProfileResponse = {
  user: ProfileUser;
  skills: any[];
  courses: any[];
  projects: any[];
  latest_analysis: any | null;
  error?: string;
};

type RolesResponse = {
  available_roles?: string[];
  target_role?: string;
  target_sector?: string;
  error?: string;
};

const SECTORS = ['Healthcare', 'Agriculture', 'Urban', 'Technology', 'Finance'] as const;

const Profile: React.FC = () => {
  const apiBaseUrl = useMemo(
    () => (import.meta as any)?.env?.VITE_API_BASE_URL || 'http://localhost:5000',
    []
  );
  const navigate = useNavigate();
  const userId = localStorage.getItem('user_id');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [user, setUser] = useState<ProfileUser | null>(null);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);

  // Editable fields
  const [name, setName] = useState('');
  const [targetSector, setTargetSector] = useState<string>('Technology');
  const [targetRole, setTargetRole] = useState<string>('software engineer');

  const forceLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    navigate('/');
  };

  const load = async () => {
    setError(null);
    if (!userId) {
      setError('Missing user_id. Please log in again.');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Load Main Profile Data
      const profileRes = await fetch(`${apiBaseUrl}/api/profile/${userId}`);
      if (profileRes.status === 401 || profileRes.status === 404) {
        forceLogout();
        return;
      }

      const profileJson = (await profileRes.json()) as ProfileResponse;
      if (!profileRes.ok) throw new Error(profileJson?.error || 'Failed to load profile');

      setUser(profileJson.user);
      setName(String(profileJson.user?.name || ''));
      setTargetSector(String(profileJson.user?.target_sector || 'Technology'));
      setTargetRole(String(profileJson.user?.target_role || 'software engineer'));

      // Fetch Available Roles (Best Effort)
      const rolesUrl = new URL(`${apiBaseUrl}/api/pathways/tree`);
      rolesUrl.searchParams.set('user_id', userId);
      const rolesRes = await fetch(rolesUrl.toString());
      if (rolesRes.ok) {
        const rolesJson = (await rolesRes.json()) as RolesResponse;
        if (Array.isArray(rolesJson.available_roles)) {
          setAvailableRoles(rolesJson.available_roles);
        }
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    setError(null);
    setSuccess(null);
    if (!userId) return;

    setSaving(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/profile/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || null,
          target_sector: targetSector,
          target_role: targetRole,
        }),
      });

      if (res.status === 401 || res.status === 404) {
        forceLogout();
        return;
      }

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json?.error || 'Failed to save profile');
      }

      // Keep localStorage in sync for other components
      localStorage.setItem('targetRole', targetRole);
      localStorage.setItem('targetSector', targetSector);

      setSuccess('Profile successfully updated');
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
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
    <div className="space-y-8 pb-12">
      {/* PAGE HEADER */}
      <div className="px-4">
        <h1 className="text-3xl font-black text-[#1A1C1E] tracking-tight mb-1">Account Settings</h1>
        <p className="text-[#A0AEC0] font-bold text-[10px] uppercase tracking-widest">Define your professional identity and career goals</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 font-sans text-[#1A1C1E]">
        {/* LEFT COLUMN: IDENTITY CARD */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-panel p-8 bg-white text-center shadow-sm"
          >
            <div className="relative inline-block mb-6">
              <div className="h-24 w-24 rounded-[2rem] bg-gradient-to-tr from-[#6366F1] to-[#A855F7] flex items-center justify-center shadow-xl shadow-[#6366F1]/20">
                <User2 className="h-10 w-10 text-white" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-xl shadow-md flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-[#6366F1]" />
              </div>
            </div>

            <h2 className="text-xl font-black mb-1">{user?.username || 'Professional'}</h2>
            <p className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-widest mb-6">Student</p>

            <div className="space-y-4 pt-6 border-t border-[#F8F9FB]">
              <div className="flex items-center gap-3 text-left">
                <div className="p-2 bg-[#F8F9FB] rounded-lg">
                  <Mail className="h-4 w-4 text-[#6366F1]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-black text-[#A0AEC0] uppercase tracking-tighter">Email Address</p>
                  <p className="text-sm font-bold truncate">{user?.email || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-left">
                <div className="p-2 bg-[#F8F9FB] rounded-lg">
                  <Briefcase className="h-4 w-4 text-[#6366F1]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-black text-[#A0AEC0] uppercase tracking-tighter">Target Path</p>
                  <p className="text-sm font-bold truncate">{targetRole}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {success && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3 text-emerald-600">
              <CheckCircle className="h-5 w-5" />
              <span className="text-xs font-black uppercase tracking-tight">{success}</span>
            </motion.div>
          )}

          {error && (
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-rose-500 text-xs font-black uppercase tracking-tight">
              {error}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: CAREER GOAL FORM */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-10 bg-white shadow-sm"
          >
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 bg-[#6366F1]/10 rounded-xl flex items-center justify-center">
                <Target className="h-6 w-6 text-[#6366F1]" />
              </div>
              <h2 className="text-2xl font-black tracking-tight">Career Architecture</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-[#A0AEC0] uppercase tracking-widest mb-4 ml-2">Full Legal Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-[#A0AEC0] uppercase tracking-widest mb-4 ml-2">Target Sector</label>
                <div className="relative">
                  <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#CBD5E0]" />
                  <select
                    value={targetSector}
                    onChange={(e) => setTargetSector(e.target.value)}
                    className="input-field pl-14 appearance-none cursor-pointer outline-none"
                  >
                    {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-[#A0AEC0] uppercase tracking-widest mb-4 ml-2">Target Role</label>
                <div className="relative">
                  <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#CBD5E0]" />
                  {availableRoles.length > 0 ? (
                    <select
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      className="input-field pl-14 appearance-none cursor-pointer outline-none"
                    >
                      {availableRoles.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  ) : (
                    <input
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      placeholder="e.g. software engineer"
                      className="input-field pl-14"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-[#F8F9FB] flex justify-end">
              <button
                onClick={save}
                disabled={saving}
                className="btn-primary !w-auto px-10 group active:scale-95 transition-all"
              >
                {saving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span className="uppercase tracking-widest text-[10px] font-black">Save Architecture</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Profile;