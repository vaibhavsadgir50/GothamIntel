import React, { useEffect, useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  LogIn,
  UserPlus,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Building2,
  Briefcase,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
  onAuthSuccess?: (role: UserRole) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onAuthSuccess,
}) => {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('seeker');
  const [companyName, setCompanyName] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const res = await login(email, password);
        if (res.success && res.user) {
          setSuccessMsg('Logged in successfully!');
          setTimeout(() => {
            onClose();
            onAuthSuccess?.(res.user!.role);
          }, 500);
        } else {
          setError(res.error || 'Failed to sign in.');
        }
      } else {
        const res = await signup({
          email,
          password,
          name,
          role,
          companyName: role === 'seeker' ? companyName || undefined : undefined,
          bio: bio || undefined,
        });
        if (res.success && res.user) {
          setSuccessMsg(
            role === 'host'
              ? 'Host account created! Opening Host Portal...'
              : 'Account created! Welcome to GothamIntel.'
          );
          setTimeout(() => {
            onClose();
            onAuthSuccess?.(res.user!.role);
          }, 500);
        } else {
          setError(res.error || 'Failed to register account.');
        }
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 font-sans';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="relative bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 sm:p-8 text-slate-800 overflow-hidden max-h-[90vh] overflow-y-auto shadow-lg">
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-full pointer-events-none -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-sky-50 rounded-full pointer-events-none translate-y-1/2 -translate-x-1/4" />

        <div className="relative flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-teal-600 text-white flex items-center justify-center font-black text-lg">
              G
            </div>
            <div>
              <h2 className="text-lg font-bold font-display tracking-tight text-slate-800">
                Gotham<span className="text-teal-700">Auth</span>
              </h2>
              <p className="text-[11px] text-slate-500">
                {mode === 'login' ? 'Sign in to find a place or host one' : 'Create an account to get started'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all border border-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative flex bg-slate-50 p-1 rounded-2xl border border-slate-200 my-5">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
              mode === 'login'
                ? 'bg-teal-600 text-white'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Log in</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
              mode === 'signup'
                ? 'bg-teal-600 text-white'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Sign up</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <Lock className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative space-y-4">
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2">I am a...</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('seeker')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      role === 'seeker'
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <Briefcase className="w-4 h-4 mb-1" />
                    <p className="text-xs font-semibold">Looking</p>
                    <p className="text-[10px] opacity-70">Find a sublet</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('host')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      role === 'host'
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <Building2 className="w-4 h-4 mb-1" />
                    <p className="text-xs font-semibold">Hosting</p>
                    <p className="text-[10px] opacity-70">List your place</p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Tony Stark"
                    className={inputClass}
                  />
                </div>
              </div>

              {role === 'seeker' && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Workplace (optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Where you work / study"
                      className={inputClass}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Bio (optional)</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  placeholder={
                    role === 'host'
                      ? 'Tell people a bit about yourself and your place...'
                      : 'Short intro — move-in timing, preferences, etc.'
                  }
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 font-sans resize-none"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>
          </div>

          {mode === 'login' && (
            <p className="text-[10px] text-slate-400">
              Demo: seeker@gotham.dev / seeker123 · host@gotham.dev / host123
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {isSubmitting
                ? 'Working on it...'
                : mode === 'login'
                  ? 'Sign in'
                  : role === 'host'
                    ? 'Create host account'
                    : 'Create account'}
            </span>
          </button>
        </form>

        <div className="relative mt-6 pt-4 border-t border-slate-200 text-center text-[11px] text-slate-500 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Find a place · or host yours</span>
        </div>
      </div>
    </div>
  );
};
