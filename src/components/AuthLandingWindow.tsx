/**
 * @file src/components/AuthLandingWindow.tsx
 * Primary Desktop Landing Window for User Registration & Sign In.
 * Powered by local offline SQLite with zero cloud dependencies.
 */

import React, { useState } from 'react';
import {
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  Database,
  ArrowRight,
  ShieldCheck,
  HardDrive,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Download,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { TitleBar } from './TitleBar';
import { ThemeSelectorModal } from './ThemeSelector';

export const AuthLandingWindow: React.FC = () => {
  const { login, register, exportDatabaseFile, isReady } = useAuth();
  const { mode, currentPreset } = useTheme();

  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState<boolean>(false);

  // Sign In state
  const [loginIdentifier, setLoginIdentifier] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');

  // Register state
  const [regFullName, setRegFullName] = useState<string>('');
  const [regUsername, setRegUsername] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [regRole, setRegRole] = useState<'operator' | 'analyst' | 'admin'>('operator');

  // Status & error states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!loginIdentifier.trim() || !loginPassword) {
      setErrorMessage('Please enter both your email/username and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(loginIdentifier, loginPassword);
      if (!res.success) {
        setErrorMessage(res.error || 'Authentication failed. Please verify credentials.');
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!regUsername.trim()) {
      setErrorMessage('Please provide a unique username.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match. Please verify.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await register(regUsername, regEmail, regPassword, regFullName);
      if (!res.success) {
        setErrorMessage(res.error || 'Registration failed.');
      } else {
        setSuccessMessage('Account registered and authenticated successfully!');
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoAdmin = () => {
    setActiveTab('signin');
    setLoginIdentifier('admin@axpert.local');
    setLoginPassword('AdminPass123!');
    setErrorMessage(null);
  };

  return (
    <div
      id="landing-auth-window"
      className={`w-screen h-screen flex flex-col font-sans overflow-hidden select-none transition-colors duration-200 ${
        mode === 'dark' ? 'bg-[#0b0f17] text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* Native Desktop Window Frame */}
      <TitleBar
        platform="win32"
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
      />

      {/* Main Authentication Landing Canvas */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto relative">
        {/* Subtle Decorative Ambient Background Glow */}
        <div
          className="absolute w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none opacity-20 -top-20 -right-20"
          style={{ backgroundColor: currentPreset.primary }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full blur-[140px] pointer-events-none opacity-15 -bottom-20 -left-20"
          style={{ backgroundColor: currentPreset.secondary }}
        />

        <div className="w-full max-w-lg z-10 space-y-5 animate-in fade-in zoom-in-95 duration-200">
          {/* Brand Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl text-white font-bold tracking-tight mb-1"
                style={{
                  background: `linear-gradient(135deg, ${currentPreset.secondary}, ${currentPreset.primary})`,
                  boxShadow: `0 8px 24px ${currentPreset.primary}40`
                }}
              >
                <span className="text-2xl font-mono">AX</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              AXpert Desktop Suite
            </h1>
            <p className="text-xs text-slate-400 font-mono flex items-center justify-center gap-2">
              <span>Native Offline Workstation</span>
              <span>•</span>
              <span className="text-cyan-400 flex items-center gap-1">
                <Database className="w-3 h-3" />
                SQLite Engine v3.45 (Local)
              </span>
            </p>
          </div>

          {/* Database Architecture Notice Banner */}
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-3 transition-colors ${
              mode === 'dark'
                ? 'bg-slate-900/90 border-slate-800 text-slate-300'
                : 'bg-white border-slate-200 text-slate-600 shadow-sm'
            }`}
          >
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">
                  100% Offline SQLite Database
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/80">
                  OFFLINE READY
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                User accounts, salted SHA-256 password digests, and audit logs are safely stored in a local SQLite file (<code>axpert_auth.sqlite</code>) backed by browser IndexedDB. Zero cloud network telemetry required.
              </p>
            </div>
          </div>

          {/* Auth Card Container */}
          <div
            id="auth-main-card"
            className={`rounded-2xl border shadow-2xl p-6 space-y-5 backdrop-blur-md transition-colors ${
              mode === 'dark'
                ? 'bg-slate-900/95 border-slate-800 text-slate-100'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Segmented Tab Bar (Sign In vs Register) */}
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <button
                id="tab-btn-signin"
                type="button"
                onClick={() => {
                  setActiveTab('signin');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'signin'
                    ? 'bg-slate-800 text-cyan-400 shadow-sm border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                id="tab-btn-register"
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'register'
                    ? 'bg-slate-800 text-cyan-400 shadow-sm border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Create Account (Register)
              </button>
            </div>

            {/* Error & Success Alerts */}
            {errorMessage && (
              <div
                id="auth-error-alert"
                className="p-3 rounded-xl bg-rose-950/50 border border-rose-900/80 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div
                id="auth-success-alert"
                className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-900/80 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* SIGN IN FORM */}
            {activeTab === 'signin' && (
              <form id="form-signin" onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-cyan-400" />
                    Email or Username
                  </label>
                  <div className="relative">
                    <input
                      id="input-login-identifier"
                      type="text"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="admin@axpert.local or username"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-xs font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                      autoFocus
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-cyan-400" />
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showPassword ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="input-login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-xs font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    id="btn-submit-signin"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 rounded-xl theme-btn-primary text-xs font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-[0.99] disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        AUTHENTICATING IN SQLITE...
                      </span>
                    ) : (
                      <>
                        <span>SIGN IN TO WORKSTATION</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* REGISTER FORM */}
            {activeTab === 'register' && (
              <form id="form-register" onSubmit={handleRegister} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-cyan-400" />
                      Full Name
                    </label>
                    <input
                      id="input-reg-fullname"
                      type="text"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700/80 text-xs font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                      Username *
                    </label>
                    <input
                      id="input-reg-username"
                      type="text"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="e.g. alex_operator"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700/80 text-xs font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-cyan-400" />
                    Email Address *
                  </label>
                  <input
                    id="input-reg-email"
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="alex@company.local"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-xs font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-cyan-400" />
                      Password *
                    </label>
                    <input
                      id="input-reg-password"
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min. 6 chars"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700/80 text-xs font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-cyan-400" />
                      Confirm Password *
                    </label>
                    <input
                      id="input-reg-confirm-password"
                      type="password"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700/80 text-xs font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Assigned Role
                  </label>
                  <select
                    id="select-reg-role"
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as 'operator' | 'analyst' | 'admin')}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700/80 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500 transition-all"
                  >
                    <option value="operator">Operator (Standard File Processing)</option>
                    <option value="analyst">Analyst (Metadata & OCR Lead)</option>
                    <option value="admin">Administrator (Full Diagnostic & Architecture)</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    id="btn-submit-register"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 rounded-xl theme-btn-primary text-xs font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-[0.99] disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        CREATING SQLITE USER RECORD...
                      </span>
                    ) : (
                      <>
                        <span>CREATE OFFLINE ACCOUNT</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Quick Demo Helper & SQLite Actions */}
            <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
              <button
                id="btn-fill-demo-credentials"
                type="button"
                onClick={fillDemoAdmin}
                className="px-3 py-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border border-blue-800/60 font-mono text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Fill credentials for default offline administrator"
              >
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>Fill Demo Admin</span>
              </button>

              <button
                id="btn-export-sqlite-file-landing"
                type="button"
                onClick={exportDatabaseFile}
                className="px-3 py-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-700/80 text-slate-300 border border-slate-700/70 font-mono text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Download axpert_auth.sqlite raw database file"
              >
                <Download className="w-3 h-3 text-emerald-400" />
                <span>Download .sqlite File</span>
              </button>
            </div>
          </div>

          {/* Bottom Security / Architecture Note */}
          <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 font-mono">
            <span className="flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-cyan-500" />
              IndexedDB Persisted
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              Salted SHA-256 Hashes
            </span>
            <span>•</span>
            <span>Zero Network Ingress</span>
          </div>
        </div>
      </div>

      {/* Theme Modal */}
      <ThemeSelectorModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />
    </div>
  );
};
