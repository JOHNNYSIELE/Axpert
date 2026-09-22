/**
 * @file src/components/AccountRequiredModal.tsx
 * Modal prompt displayed when a guest attempts an action (uploading files,
 * converting documents, running OCR, or extracting audio).
 * Provides immediate in-place account creation or sign-in without losing context.
 */

import React, { useState } from 'react';
import {
  Lock,
  X,
  Eye,
  EyeOff,
  Check,
  ShieldCheck,
  AlertCircle,
  Database,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AccountRequiredModal: React.FC = () => {
  const { authModalState, closeAuthModal, openAuthModal, register, login } = useAuth();

  const [mode, setMode] = useState<'register' | 'signin'>(authModalState.mode);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync mode if changed from external trigger
  React.useEffect(() => {
    setMode(authModalState.mode);
    setError(null);
  }, [authModalState.mode, authModalState.isOpen]);

  if (!authModalState.isOpen) return null;

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
    const username = (firstName.trim() || 'user')
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 20);

    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (!agreeTerms) {
      setError('Please agree to terms to create your offline account.');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalUsername = username || `user_${Date.now().toString().slice(-4)}`;
      const res = await register(finalUsername, email, password, fullName);
      if (!res.success) {
        setError(res.error || 'Registration failed.');
      } else {
        closeAuthModal();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim() || !password) {
      setError('Please enter your email/username and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(identifier, password);
      if (!res.success) {
        setError(res.error || 'Authentication failed. Please verify credentials.');
      } else {
        closeAuthModal();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="account-required-modal"
      className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={closeAuthModal}
    >
      <div
        className="w-full max-w-[460px] bg-[#241f30] border border-[#3e3650] rounded-3xl shadow-2xl p-6 sm:p-7 relative text-[#f2eff8] animate-in zoom-in-95 duration-200 select-none overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle decorative purple glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-[#7c5cfc]/20 blur-3xl pointer-events-none" />

        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#392e54] border border-[#56467a] flex items-center justify-center text-[#b8a1ff]">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#a79bbd] font-semibold">
                Action Restricted
              </span>
              <h2 className="text-xl font-semibold text-white tracking-tight leading-tight">
                {mode === 'register' ? 'Create an account' : 'Sign in to continue'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-account-modal"
            onClick={closeAuthModal}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Specific Action Restriction Notice */}
        <div className="p-3 rounded-xl bg-[#2e2640] border border-[#443761] text-xs text-[#c9bfdf] leading-relaxed mb-4">
          {authModalState.reason ? (
            <p className="font-medium text-white">{authModalState.reason}</p>
          ) : (
            <p>Guest mode is view-only. Create an offline account to unlock all features.</p>
          )}
          <p className="text-[11px] text-[#9a8db3] mt-1">
            Accounts are saved securely in your browser&apos;s local SQLite database.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-[#3d1e2b] border border-[#6b253b] text-[#ff9bb4] text-xs flex items-center gap-2 mb-4 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#ff688f]" />
            <span>{error}</span>
          </div>
        )}

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#1b1725] border border-[#342c46] mb-4 text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`py-2 px-3 rounded-lg transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-[#7354f5] text-white shadow-sm font-semibold'
                : 'text-[#9c91b3] hover:text-white'
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setError(null);
            }}
            className={`py-2 px-3 rounded-lg transition-all cursor-pointer ${
              mode === 'signin'
                ? 'bg-[#7354f5] text-white shadow-sm font-semibold'
                : 'text-[#9c91b3] hover:text-white'
            }`}
          >
            Sign In
          </button>
        </div>

        {/* Registration Form */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-2.5">
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#2e283d] border border-[#443a59] text-xs text-white placeholder-[#7f7495] focus:outline-none focus:border-[#7c5cfc] transition-all"
                required
                autoFocus
              />
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#2e283d] border border-[#443a59] text-xs text-white placeholder-[#7f7495] focus:outline-none focus:border-[#7c5cfc] transition-all"
              />
            </div>

            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#2e283d] border border-[#443a59] text-xs text-white placeholder-[#7f7495] focus:outline-none focus:border-[#7c5cfc] transition-all"
                required
              />
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create password (min 6 chars)"
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-[#2e283d] border border-[#443a59] text-xs text-white placeholder-[#7f7495] focus:outline-none focus:border-[#7c5cfc] transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7f7495] hover:text-white transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center gap-2 pt-0.5">
              <button
                type="button"
                role="checkbox"
                aria-checked={agreeTerms}
                onClick={() => setAgreeTerms(!agreeTerms)}
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                  agreeTerms
                    ? 'bg-[#7c5cfc] border-[#7c5cfc] text-white'
                    : 'bg-[#2e283d] border-[#4f4369]'
                }`}
              >
                {agreeTerms && <Check className="w-3 h-3 stroke-[3]" />}
              </button>
              <label
                onClick={() => setAgreeTerms(!agreeTerms)}
                className="text-[11px] text-[#9c91b3] cursor-pointer select-none"
              >
                I agree to the Terms &amp; Conditions
              </label>
            </div>

            <button
              id="btn-modal-create-account"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-[#7354f5] hover:bg-[#8063f9] text-white font-medium text-xs tracking-wide transition-all cursor-pointer shadow-lg shadow-[#7354f5]/25 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Creating SQLite account...</span>
              ) : (
                <>
                  <span>Create Account &amp; Unlock</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Sign In Form */}
        {mode === 'signin' && (
          <form onSubmit={handleSignInSubmit} className="space-y-3.5">
            <div>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Email or Username"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#2e283d] border border-[#443a59] text-xs text-white placeholder-[#7f7495] focus:outline-none focus:border-[#7c5cfc] transition-all"
                required
                autoFocus
              />
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-[#2e283d] border border-[#443a59] text-xs text-white placeholder-[#7f7495] focus:outline-none focus:border-[#7c5cfc] transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7f7495] hover:text-white transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              id="btn-modal-signin"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-[#7354f5] hover:bg-[#8063f9] text-white font-medium text-xs tracking-wide transition-all cursor-pointer shadow-lg shadow-[#7354f5]/25 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In &amp; Unlock</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer info & dismiss */}
        <div className="pt-4 mt-4 border-t border-[#342c46] flex items-center justify-between text-[11px] text-[#8e82a6]">
          <span className="flex items-center gap-1 font-mono">
            <Database className="w-3 h-3 text-[#7c5cfc]" />
            Local SQLite 3.45
          </span>
          <button
            type="button"
            onClick={closeAuthModal}
            className="text-[#b5a3e8] hover:text-white hover:underline transition-colors cursor-pointer"
          >
            Continue in Guest Mode (View Only)
          </button>
        </div>
      </div>
    </div>
  );
};
