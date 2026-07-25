import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, LogIn, UserPlus, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const res = await login(email, password);
        if (res.success) {
          setSuccessMsg('Logged in successfully!');
          setTimeout(() => {
            onClose();
          }, 600);
        } else {
          setError(res.error || 'Failed to sign in.');
        }
      } else {
        const res = await signup(email, password, name);
        if (res.success) {
          setSuccessMsg('Account created! Welcome to GothamIntel.');
          setTimeout(() => {
            onClose();
          }, 600);
        } else {
          setError(res.error || 'Failed to register account.');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="relative bg-neutral-950 border border-white/20 shadow-2xl rounded-3xl max-w-md w-full p-6 sm:p-8 text-white overflow-hidden">
        {/* Subtle Ambient Background Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-emerald-500 text-black flex items-center justify-center font-black text-lg shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              G
            </div>
            <div>
              <h2 className="text-lg font-bold font-mono tracking-tight uppercase">
                GOTHAM<span className="text-emerald-400">AUTH</span>
              </h2>
              <p className="text-[11px] text-neutral-400 font-mono">
                {mode === 'login' ? 'Sign in to access your saved shortlist' : 'Create an account to save properties'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 my-6">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 ${
              mode === 'login'
                ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>LOG IN</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 ${
              mode === 'signup'
                ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>SIGN UP</span>
          </button>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center gap-2">
            <Lock className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-mono text-neutral-400 mb-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tony Stark"
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neutral-600 text-sm focus:outline-none focus:border-emerald-500 font-sans"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono text-neutral-400 mb-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neutral-600 text-sm focus:outline-none focus:border-emerald-500 font-sans"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-neutral-400 mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neutral-600 text-sm focus:outline-none focus:border-emerald-500 font-sans"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-extrabold text-xs tracking-wider uppercase shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isSubmitting ? 'PROCESSING...' : mode === 'login' ? 'SIGN IN TO GOTHAM' : 'CREATE ACCOUNT'}</span>
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-white/10 text-center text-[11px] font-mono text-neutral-500 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Encrypted Gotham Profile & Saved Shortlist Storage</span>
        </div>
      </div>
    </div>
  );
};
