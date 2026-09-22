/**
 * @file src/components/AuthLandingWindow.tsx
 * Minimalist Desktop Authentication Window inspired by clean modern UI design.
 * Features a left-hand atmospheric carousel and a clean right-hand authentication form,
 * fully integrated with the local offline SQLite database.
 */

import React, { useState, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  Sparkles,
  Database,
  ArrowRight,
  ShieldCheck,
  Check,
  HardDrive,
  KeyRound,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { TitleBar } from './TitleBar';
import { ThemeSelectorModal } from './ThemeSelector';

interface CarouselSlide {
  id: number;
  image: string;
  fallbackBg: string;
  titlePart1: string;
  titlePart2: string;
  subtitle: string;
  tag: string;
}

const CAROUSEL_SLIDES: CarouselSlide[] = [
  {
    id: 0,
    image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80',
    fallbackBg: 'linear-gradient(145deg, #2e2640, #1c1829)',
    titlePart1: 'Capturing Moments,',
    titlePart2: 'Creating Memories',
    subtitle: 'Native offline workstation with zero network ingress and 100% data privacy.',
    tag: 'OFFLINE SQLITE'
  },
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1518457607834-6e8d80c183c5?auto=format&fit=crop&w=1200&q=80',
    fallbackBg: 'linear-gradient(145deg, #221f33, #151320)',
    titlePart1: 'High-Velocity Engine,',
    titlePart2: 'Local Media Suite',
    subtitle: 'Transform documents, audio tracks, and images in milliseconds.',
    tag: 'TURBO CONVERTER'
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
    fallbackBg: 'linear-gradient(145deg, #1f1b2b, #13101c)',
    titlePart1: 'Salted Cryptography,',
    titlePart2: 'Uncompromised Safety',
    subtitle: 'Relational SQLite 3.45 with SHA-256 password hashing stored locally in IndexedDB.',
    tag: 'HARDENED SECURITY'
  }
];

export const AuthLandingWindow: React.FC = () => {
  const { login, register, enterAsGuest, isReady } = useAuth();
  const { mode } = useTheme();

  // Mode: 'register' (matches screenshot default) or 'signin'
  const [activeTab, setActiveTab] = useState<'register' | 'signin'>('register');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState<boolean>(false);
  const [agreeTerms, setAgreeTerms] = useState<boolean>(true);
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);

  // Carousel active index
  const [currentSlide, setCurrentSlide] = useState<number>(0);

  // Register Form Fields (Clean inputs with no preconfigured values)
  const [regFirstName, setRegFirstName] = useState<string>('');
  const [regLastName, setRegLastName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');

  // Sign In Form Fields
  const [loginIdentifier, setLoginIdentifier] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');

  // State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auto advance carousel every 7 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!loginIdentifier.trim() || !loginPassword) {
      setErrorMessage('Please enter both your email or username and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(loginIdentifier, loginPassword);
      if (!res.success) {
        setErrorMessage(res.error || 'Invalid credentials. Please verify and try again.');
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

    const fullName = [regFirstName.trim(), regLastName.trim()].filter(Boolean).join(' ');
    const username = (regFirstName.trim() || 'user')
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 20);

    if (!regEmail.trim() || !regEmail.includes('@')) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (!agreeTerms) {
      setErrorMessage('Please accept the Terms & Conditions to proceed.');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalUsername = username || `user_${Date.now().toString().slice(-4)}`;
      const res = await register(finalUsername, regEmail, regPassword, fullName);
      if (!res.success) {
        setErrorMessage(res.error || 'Registration failed.');
      } else {
        setSuccessMessage('Account created successfully!');
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const slide = CAROUSEL_SLIDES[currentSlide];

  return (
    <div
      id="landing-auth-window"
      className="w-screen h-screen flex flex-col font-sans overflow-hidden select-none bg-[#201d2a] text-[#f2eff8]"
    >
      {/* Native Desktop Window Frame */}
      <TitleBar
        platform="win32"
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
      />

      {/* Main Centered Stage */}
      <main className="flex-1 flex items-center justify-center p-3 sm:p-6 md:p-8 overflow-y-auto">
        {/* Master Card Frame matching the uploaded design */}
        <div
          id="auth-master-card"
          className="w-full max-w-[1020px] rounded-3xl bg-[#262232] border border-[#352f45] shadow-2xl p-3 sm:p-4 md:p-5 flex flex-col md:grid md:grid-cols-12 gap-5 md:gap-8 items-stretch overflow-hidden transition-all duration-300"
        >
          {/* ========================================================================= */}
          {/* LEFT SIDE: Atmospheric Visual Card with Dune Image and Carousel          */}
          {/* ========================================================================= */}
          <section
            aria-label="Welcome Visual Carousel"
            className="md:col-span-6 min-h-[380px] sm:min-h-[460px] md:min-h-[580px] relative rounded-2xl overflow-hidden flex flex-col justify-between p-6 sm:p-7 md:p-8 bg-[#1a1724] border border-[#373147] shadow-inner group"
          >
            {/* Background Image with Twilight Purple Dusk Overlays */}
            <div className="absolute inset-0 z-0 overflow-hidden">
              <img
                key={slide.id}
                src={slide.image}
                alt={slide.titlePart1}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center transform scale-105 transition-transform duration-1000 ease-out"
                onError={(e) => {
                  // Fallback to elegant CSS twilight dune gradient if network restricts images
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
              {/* Deep Dusk Violet Gradients for Exact Visual Atmosphere */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(24, 21, 33, 0.45) 0%, rgba(30, 24, 45, 0.2) 40%, rgba(19, 16, 28, 0.92) 85%, rgba(17, 14, 25, 0.98) 100%)'
                }}
              />
              {/* Subtle Ambient Radial Glow */}
              <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[#161321] via-[#211a33]/60 to-transparent pointer-events-none" />
            </div>

            {/* Top Navigation Row inside Left Panel */}
            <div className="relative z-10 flex items-center justify-between">
              {/* Stylized Modern Brand Logo (Inspired by AMU mark) */}
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-xl sm:text-2xl text-white font-sans flex items-center">
                  <span className="tracking-widest">AMU</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7c5cfc] ml-1.5 animate-pulse" />
                </span>
                <span className="hidden sm:inline-block text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-md text-slate-300 border border-white/10">
                  v3.45 Local
                </span>
              </div>

              {/* Explore as Guest Preview Button */}
              <button
                type="button"
                id="btn-explore-as-guest-top"
                onClick={enterAsGuest}
                className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-xs text-white font-medium flex items-center gap-1.5 transition-all duration-200 cursor-pointer shadow-sm active:scale-95"
                title="Explore workstation features in view-only preview mode"
              >
                <span>Explore as Guest</span>
                <span className="text-white/70">→</span>
              </button>
            </div>

            {/* Bottom Caption & Interactive Carousel Indicators */}
            <div className="relative z-10 space-y-5 pt-20">
              <div className="space-y-1.5 max-w-sm">
                <h2 className="text-2xl sm:text-3xl font-normal tracking-tight text-white leading-tight">
                  <span className="block">{slide.titlePart1}</span>
                  <span className="block text-white/95 font-medium">{slide.titlePart2}</span>
                </h2>
                <p className="text-xs sm:text-[13px] text-white/75 font-light leading-relaxed line-clamp-2">
                  {slide.subtitle}
                </p>
              </div>

              {/* Minimalist Carousel Indicators */}
              <div className="flex items-center gap-2 pt-1" role="tablist" aria-label="Slide indicators">
                {CAROUSEL_SLIDES.map((s, idx) => {
                  const isActive = idx === currentSlide;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-label={`Slide ${idx + 1}`}
                      onClick={() => setCurrentSlide(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                        isActive
                          ? 'w-7 bg-white shadow-sm'
                          : 'w-3.5 bg-white/35 hover:bg-white/60'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* RIGHT SIDE: Clean Minimalist Authentication Form                          */}
          {/* ========================================================================= */}
          <section
            aria-label="Authentication Form"
            className="md:col-span-6 flex flex-col justify-center px-2 sm:px-4 md:px-6 py-4 sm:py-6 space-y-6"
          >
            {/* Header: Title & Switch Link */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                {activeTab === 'register' ? 'Create an account' : 'Welcome back'}
              </h1>
              <div className="text-xs sm:text-sm text-[#9a94ab] flex items-center gap-1.5">
                <span>
                  {activeTab === 'register' ? 'Already have an account?' : "Don't have an account?"}
                </span>
                <button
                  type="button"
                  id="auth-toggle-tab-link"
                  onClick={() => {
                    setActiveTab(activeTab === 'register' ? 'signin' : 'register');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="text-[#9e86fc] hover:text-[#b4a0ff] font-medium underline underline-offset-4 transition-colors cursor-pointer"
                >
                  {activeTab === 'register' ? 'Log in' : 'Create an account'}
                </button>
              </div>
            </div>

            {/* Error and Success Notices */}
            {errorMessage && (
              <div
                id="auth-error-banner"
                className="p-3 rounded-xl bg-[#3d1e2b] border border-[#6b253b] text-[#ff9bb4] text-xs leading-relaxed animate-in fade-in"
              >
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div
                id="auth-success-banner"
                className="p-3 rounded-xl bg-[#19362a] border border-[#2a614b] text-[#86efac] text-xs leading-relaxed animate-in fade-in"
              >
                {successMessage}
              </div>
            )}

            {/* =================================================================== */}
            {/* REGISTER FORM                                                       */}
            {/* =================================================================== */}
            {activeTab === 'register' && (
              <form id="form-register" onSubmit={handleRegister} className="space-y-4">
                {/* First Name & Last Name (Side-by-side as in uploaded image) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      id="input-reg-firstname"
                      type="text"
                      value={regFirstName}
                      onChange={(e) => setRegFirstName(e.target.value)}
                      placeholder="First name"
                      className="w-full px-3.5 py-3 rounded-xl bg-[#312c3f] border border-[#443d57] text-xs sm:text-sm text-white placeholder-[#7e7792] focus:outline-none focus:border-[#7c5cfc] focus:ring-1 focus:ring-[#7c5cfc] transition-all"
                      required
                    />
                  </div>
                  <div>
                    <input
                      id="input-reg-lastname"
                      type="text"
                      value={regLastName}
                      onChange={(e) => setRegLastName(e.target.value)}
                      placeholder="Last name"
                      className="w-full px-3.5 py-3 rounded-xl bg-[#312c3f] border border-[#443d57] text-xs sm:text-sm text-white placeholder-[#7e7792] focus:outline-none focus:border-[#7c5cfc] focus:ring-1 focus:ring-[#7c5cfc] transition-all"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <input
                    id="input-reg-email"
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full px-3.5 py-3 rounded-xl bg-[#312c3f] border border-[#443d57] text-xs sm:text-sm text-white placeholder-[#7e7792] focus:outline-none focus:border-[#7c5cfc] focus:ring-1 focus:ring-[#7c5cfc] transition-all"
                    required
                  />
                </div>

                {/* Password with Eye Icon */}
                <div className="relative">
                  <input
                    id="input-reg-password"
                    type={showPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-3.5 py-3 pr-10 rounded-xl bg-[#312c3f] border border-[#443d57] text-xs sm:text-sm text-white placeholder-[#7e7792] focus:outline-none focus:border-[#7c5cfc] focus:ring-1 focus:ring-[#7c5cfc] transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7e7792] hover:text-white transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Terms Checkbox */}
                <div className="flex items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={agreeTerms}
                    onClick={() => setAgreeTerms(!agreeTerms)}
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                      agreeTerms
                        ? 'bg-[#7c5cfc] border-[#7c5cfc] text-white'
                        : 'bg-[#312c3f] border-[#4f4765]'
                    }`}
                  >
                    {agreeTerms && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>
                  <label
                    onClick={() => setAgreeTerms(!agreeTerms)}
                    className="text-xs text-[#9a94ab] cursor-pointer select-none"
                  >
                    I agree to the{' '}
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowTermsModal(true);
                      }}
                      className="text-[#c4b5fd] hover:underline"
                    >
                      Terms &amp; Conditions
                    </span>
                  </label>
                </div>

                {/* Primary Button */}
                <div className="pt-2">
                  <button
                    id="btn-create-account"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-4 rounded-xl bg-[#7354f5] hover:bg-[#8063f9] active:bg-[#6544e8] text-white font-medium text-sm tracking-wide transition-all duration-150 cursor-pointer shadow-lg shadow-[#7354f5]/25 active:scale-[0.99] disabled:opacity-50"
                  >
                    {isSubmitting ? 'Creating account in SQLite...' : 'Create account'}
                  </button>
                </div>
              </form>
            )}

            {/* =================================================================== */}
            {/* SIGN IN FORM                                                        */}
            {/* =================================================================== */}
            {activeTab === 'signin' && (
              <form id="form-signin" onSubmit={handleSignIn} className="space-y-4">
                {/* Email or Username */}
                <div>
                  <input
                    id="input-login-identifier"
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="Email or Username"
                    className="w-full px-3.5 py-3 rounded-xl bg-[#312c3f] border border-[#443d57] text-xs sm:text-sm text-white placeholder-[#7e7792] focus:outline-none focus:border-[#7c5cfc] focus:ring-1 focus:ring-[#7c5cfc] transition-all"
                    required
                    autoFocus
                  />
                </div>

                {/* Password */}
                <div className="relative">
                  <input
                    id="input-login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-3.5 py-3 pr-10 rounded-xl bg-[#312c3f] border border-[#443d57] text-xs sm:text-sm text-white placeholder-[#7e7792] focus:outline-none focus:border-[#7c5cfc] focus:ring-1 focus:ring-[#7c5cfc] transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7e7792] hover:text-white transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Remember Session Option */}
                <div className="flex items-center justify-between text-xs text-[#9a94ab] pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <span className="w-4 h-4 rounded bg-[#7c5cfc] border border-[#7c5cfc] text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                    <span>Remember local SQLite session</span>
                  </label>
                  <span className="text-[#847d95] text-[11px] font-mono">100% Offline</span>
                </div>

                {/* Primary Sign In Button */}
                <div className="pt-2">
                  <button
                    id="btn-signin-submit"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-4 rounded-xl bg-[#7354f5] hover:bg-[#8063f9] active:bg-[#6544e8] text-white font-medium text-sm tracking-wide transition-all duration-150 cursor-pointer shadow-lg shadow-[#7354f5]/25 active:scale-[0.99] disabled:opacity-50"
                  >
                    {isSubmitting ? 'Authenticating in SQLite...' : 'Sign in'}
                  </button>
                </div>
              </form>
            )}

            {/* Divider "Or register with" / "Or sign in with" */}
            <div className="relative flex items-center justify-center pt-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#3b354e]" />
              </div>
              <span className="relative px-3 bg-[#262232] text-[11px] text-[#7a748c]">
                {activeTab === 'register' ? 'Or register with' : 'Or sign in with'}
              </span>
            </div>

            {/* Secondary Action: Guest Preview Mode */}
            <div className="space-y-2 pt-1">
              <button
                id="btn-guest-explore-main"
                type="button"
                onClick={enterAsGuest}
                className="w-full py-3 px-4 rounded-xl bg-[#312c3f] hover:bg-[#39334a] active:bg-[#282333] border border-[#443d57] text-xs font-medium text-white flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-sm group active:scale-[0.99]"
                title="Explore workstation features in view-only preview mode"
              >
                <Eye className="w-4 h-4 text-[#9b82ff] group-hover:text-white transition-colors" />
                <span>Explore Features as Guest (View Only)</span>
              </button>
              <p className="text-[11px] text-center text-[#7e7690]">
                Guests can explore all tools and inspectors. Uploads and conversions prompt account creation.
              </p>
            </div>
          </section>
        </div>
      </main>

      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#262232] border border-[#3f3852] p-6 text-left space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#352f45] pb-3">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#7c5cfc]" />
                Terms &amp; Offline Privacy Policy
              </h3>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="text-[#9a94ab] hover:text-white text-xs px-2 py-1 rounded-lg bg-[#312c3f]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#a7a1b8] leading-relaxed max-h-60 overflow-y-auto pr-1">
              <p>
                <strong>1. 100% Offline Storage:</strong> All account data, credentials, and configuration
                are stored exclusively on your device inside an embedded SQLite 3 database backed by browser
                IndexedDB.
              </p>
              <p>
                <strong>2. Zero Cloud Tracking:</strong> We do not transmit passwords, conversion files,
                or metadata to external telemetry servers. Your media processing happens client-side in WebAssembly.
              </p>
              <p>
                <strong>3. Cryptographic Salting:</strong> Passwords are cryptographically salted and hashed
                using the Web Crypto API (SHA-256) before touching local tables.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setAgreeTerms(true);
                setShowTermsModal(false);
              }}
              className="w-full py-2.5 rounded-xl bg-[#7354f5] hover:bg-[#8063f9] text-white text-xs font-semibold uppercase tracking-wider"
            >
              I Understand &amp; Agree
            </button>
          </div>
        </div>
      )}

      {/* Theme Selector Modal */}
      <ThemeSelectorModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />
    </div>
  );
};

