import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User,
    Lock,
    ArrowRight,
    Loader,
    Sparkles,
    Mail
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../apiConfig';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        password: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const endpoint = isSignUp ? '/auth/register' : '/auth/login';
            const payload = isSignUp
                ? { name: formData.name, username: formData.username, email: formData.email, password: formData.password }
                : { username: formData.username, password: formData.password };

            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                if (isSignUp) {
                    alert(`Account created! You can now login.`);
                    setIsSignUp(false);
                } else {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user_id', data.user_id);
                    navigate('/dashboard');
                }
            } else {
                alert(`Error: ${data.error || 'Something went wrong'}`);
            }
        } catch (error) {
            alert(`Network error: ${error}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB] p-6 font-sans text-[#1A1C1E]">
            {/* Soft background branding glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#6366F1]/5 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[420px] z-10"
            >
                {/* Branding Header */}
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        className="inline-flex items-center justify-center w-14 h-14 bg-[#6366F1] rounded-[1.2rem] shadow-xl shadow-[#6366F1]/20 mb-6"
                    >
                        <Sparkles className="h-7 w-7 text-white" />
                    </motion.div>
                    <h1 className="text-5xl font-black tracking-tighter mb-2 leading-none">SkillGenome</h1>
                    <p className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-[0.3em]">AI Career Architect</p>
                </div>

                {/* Main Auth Card */}
                <div className="glass-panel p-10 bg-white shadow-2xl shadow-[#6366F1]/5">
                    <div className="mb-8">
                        <h2 className="text-2xl font-black tracking-tight mb-1">
                            {isSignUp ? 'Create Profile' : 'System Access'}
                        </h2>
                        <p className="text-xs font-bold text-[#718096] uppercase tracking-widest">
                            {isSignUp ? 'Begin your DNA mapping' : 'Initialize session'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <AnimatePresence mode="wait">
                            {isSignUp && (
                                <motion.div
                                    key="signup-fields"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-4 overflow-hidden"
                                >
                                    <div className="relative">
                                        <User className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#CBD5E0]" />
                                        <input
                                            type="text"
                                            placeholder="FULL NAME"
                                            className="input-field pl-14 !rounded-full !bg-[#F8F9FB] !text-[11px] !tracking-widest uppercase !font-black"
                                            required={isSignUp}
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="relative">
                                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#CBD5E0]" />
                                        <input
                                            type="email"
                                            placeholder="EMAIL ADDRESS"
                                            className="input-field pl-14 !rounded-full !bg-[#F8F9FB] !text-[11px] !tracking-widest uppercase !font-black"
                                            required={isSignUp}
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="relative">
                            <User className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#CBD5E0]" />
                            <input
                                type="text"
                                placeholder="USERNAME"
                                className="input-field pl-14 !rounded-full !bg-[#F8F9FB] !text-[11px] !tracking-widest uppercase !font-black"
                                required
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            />
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#CBD5E0]" />
                            <input
                                type="password"
                                placeholder="PASSWORD"
                                className="input-field pl-14 !rounded-full !bg-[#F8F9FB] !text-[11px] !tracking-widest uppercase !font-black"
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary !w-full !rounded-full !py-6 !text-[11px] mt-4 flex items-center justify-center gap-3 active:scale-95 group shadow-2xl shadow-[#6366F1]/10"
                        >
                            {loading ? <Loader className="animate-spin h-5 w-5" /> : (
                                <>
                                    <span>{isSignUp ? 'SIGN UP' : 'LOGIN'}</span>
                                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 text-center">
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A0AEC0] hover:text-[#6366F1] transition-colors"
                        >
                            {isSignUp ? 'Already mapped? Login' : 'New Architect? Sign Up'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;