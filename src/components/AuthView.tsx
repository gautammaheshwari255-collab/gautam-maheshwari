import React, { useState, useEffect, useRef } from 'react';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  ExternalLink,
  KeyRound,
  Check,
  RefreshCw,
  HelpCircle,
  ChevronLeft,
  X,
  Info
} from 'lucide-react';
import {
  firebaseSignUp,
  firebaseSignIn,
  firebaseSignInWithGoogle,
  firebaseSendOtp,
  firebaseVerifyOtp,
  firebaseSendPasswordReset,
  getFirestoreUser,
  saveFirestoreUser
} from '../lib/firebase';

interface AuthViewProps {
  onAuthSuccess: (user: { name: string; email: string; stars?: number }) => void;
  incomingLink?: string | null;
}

type AuthMode = 'signin' | 'signup' | 'otp_verify' | 'forgot_password';

export const AuthView: React.FC<AuthViewProps> = ({ onAuthSuccess }) => {
  // Navigation Mode
  const [mode, setMode] = useState<AuthMode>('signup');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 6-Digit OTP State
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timers, Cooldowns & Loading
  const [countdown, setCountdown] = useState(45);
  const [canResend, setCanResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Email Delivery Diagnostics
  const [testEmailPreviewUrl, setTestEmailPreviewUrl] = useState<string | null>(null);
  const [sandboxCode, setSandboxCode] = useState<string | null>(null);
  const [isSandboxMode, setIsSandboxMode] = useState(false);
  const [isDeliveredToInbox, setIsDeliveredToInbox] = useState(false);

  // Modals & Drawers
  const [showTroubleshootModal, setShowTroubleshootModal] = useState(false);
  const [showFirebaseSetupModal, setShowFirebaseSetupModal] = useState(false);

  // Cooldown countdown effect
  useEffect(() => {
    let timer: any;
    if (mode === 'otp_verify' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [mode, countdown]);

  // Focus first OTP input on step enter
  useEffect(() => {
    if (mode === 'otp_verify') {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    }
  }, [mode]);

  // Email format validator
  const isValidEmail = (str: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str.trim());
  };

  // Helper to establish complete session & starter credits in Firestore
  const completeUserSession = async (userEmail: string, userName?: string) => {
    const cleanEmail = userEmail.trim().toLowerCase();
    const cleanName = userName?.trim() || cleanEmail.split('@')[0];

    const existingUser = await getFirestoreUser(cleanEmail);
    let finalStars = 385;

    if (existingUser) {
      finalStars = typeof existingUser.stars === 'number' ? existingUser.stars : 385;
      await saveFirestoreUser(cleanEmail, {
        name: cleanName || existingUser.name || cleanEmail.split('@')[0],
        lastLoginAt: new Date().toISOString()
      });
    } else {
      // First-time verified user: initialize profile with ₹385 Starter Credits
      const newUser = {
        email: cleanEmail,
        name: cleanName,
        stars: 385,
        credits: 385,
        starterCreditsClaimed: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };
      await saveFirestoreUser(cleanEmail, newUser);
    }

    try {
      localStorage.setItem('ogoo_current_user', cleanEmail);
      localStorage.setItem(
        'ogoo_profile',
        JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          stars: finalStars,
          credits: finalStars,
          handle: `@${cleanName.toLowerCase().replace(/\s+/g, '_')}`
        })
      );
    } catch {}

    onAuthSuccess({
      name: cleanName,
      email: cleanEmail,
      stars: finalStars
    });
  };

  // =========================================================================
  // 1. Google 1-Click Sign In (Official Firebase Auth)
  // =========================================================================
  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setStatusMessage(null);
    setIsLoading(true);

    try {
      const res = await firebaseSignInWithGoogle();
      if (!res.success || !res.user) {
        setIsLoading(false);
        if (res.cancelled) {
          // User dismissed popup without signing in — reset cleanly with no noisy error banner
          return;
        }
        setErrorMessage(res.error || 'Google sign-in could not be completed.');
        return;
      }

      await completeUserSession(res.user.email || '', res.user.displayName || undefined);
      setIsLoading(false);
    } catch (err: any) {
      setIsLoading(false);
      const isDismissed =
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request' ||
        err?.message?.includes('popup-closed-by-user') ||
        err?.message?.includes('cancelled-popup-request');

      if (!isDismissed) {
        setErrorMessage(err?.message || 'Google sign-in encountered an error.');
      }
    }
  };

  // =========================================================================
  // 2. Submit Sign Up (Email + Password -> Request OTP)
  // =========================================================================
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);
    setTestEmailPreviewUrl(null);
    setSandboxCode(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();

    if (!cleanName) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify both fields.');
      return;
    }

    setIsLoading(true);

    try {
      const otpRes = await firebaseSendOtp(cleanEmail, cleanName, 'signup');

      if (!otpRes.success) {
        setIsLoading(false);
        setErrorMessage(otpRes.error || 'Failed to dispatch verification email. Please try again.');
        return;
      }

      setIsLoading(false);
      setMode('otp_verify');
      setCountdown(45);
      setCanResend(false);
      setOtpDigits(['', '', '', '', '', '']);

      setIsSandboxMode(Boolean(otpRes.isSandbox));
      setIsDeliveredToInbox(Boolean(otpRes.isDeliveredToInbox));
      if (otpRes.sandboxCode) setSandboxCode(otpRes.sandboxCode);
      if (otpRes.previewUrl) setTestEmailPreviewUrl(otpRes.previewUrl);

      if (otpRes.isDeliveredToInbox) {
        setStatusMessage(`Verification code sent to ${cleanEmail}. Check your inbox and Spam folder.`);
      } else {
        setStatusMessage(otpRes.message || `Verification code prepared for ${cleanEmail}.`);
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || 'Failed to initiate registration.');
    }
  };

  // =========================================================================
  // 3. Submit Sign In (Email + Password -> Verify credentials with Firebase)
  // =========================================================================
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);
    setSandboxCode(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Authenticate with Firebase Authentication
      const authResult = await firebaseSignIn(cleanEmail, password);

      if (!authResult.success) {
        // If Firebase Auth Email/Password provider isn't enabled in console yet
        if (authResult.isConsoleActionNeeded) {
          setIsLoading(false);
          setShowFirebaseSetupModal(true);
          return;
        }

        setIsLoading(false);
        setErrorMessage(authResult.error || 'Invalid email or password.');
        return;
      }

      // 2. Also trigger Email OTP for 2FA security verification
      const otpRes = await firebaseSendOtp(cleanEmail, authResult.user?.displayName || cleanEmail.split('@')[0], 'login');

      setIsLoading(false);
      if (otpRes.success) {
        setMode('otp_verify');
        setCountdown(45);
        setCanResend(false);
        setOtpDigits(['', '', '', '', '', '']);
        setIsSandboxMode(Boolean(otpRes.isSandbox));
        setIsDeliveredToInbox(Boolean(otpRes.isDeliveredToInbox));
        if (otpRes.sandboxCode) setSandboxCode(otpRes.sandboxCode);
        if (otpRes.previewUrl) setTestEmailPreviewUrl(otpRes.previewUrl);
        setStatusMessage(
          otpRes.isDeliveredToInbox
            ? `Security OTP sent to ${cleanEmail}. Check your inbox.`
            : otpRes.message || `Security OTP generated.`
        );
      } else {
        setErrorMessage(otpRes.error || 'Failed to deliver security OTP code.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || 'Authentication error.');
    }
  };

  // =========================================================================
  // 4. Resend OTP Code
  // =========================================================================
  const handleResendOtp = async () => {
    if (!canResend || isLoading) return;
    setErrorMessage(null);
    setStatusMessage(null);
    setIsLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim() || cleanEmail.split('@')[0];

    try {
      const res = await firebaseSendOtp(cleanEmail, cleanName, mode === 'signup' ? 'signup' : 'login');
      setIsLoading(false);

      if (res.success) {
        setCountdown(45);
        setCanResend(false);
        setOtpDigits(['', '', '', '', '', '']);
        setIsSandboxMode(Boolean(res.isSandbox));
        setIsDeliveredToInbox(Boolean(res.isDeliveredToInbox));
        if (res.sandboxCode) setSandboxCode(res.sandboxCode);
        if (res.previewUrl) setTestEmailPreviewUrl(res.previewUrl);

        setStatusMessage(
          res.isDeliveredToInbox
            ? `Fresh verification code sent to ${cleanEmail}. Check inbox and Spam.`
            : res.message || `Fresh verification code generated.`
        );
        otpInputRefs.current[0]?.focus();
      } else {
        setErrorMessage(res.error || 'Could not resend code. Please wait.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || 'Failed to resend code.');
    }
  };

  // =========================================================================
  // 5. Verify Entered OTP & Complete Authentication
  // =========================================================================
  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || otpDigits.join('');
    setErrorMessage(null);

    if (code.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim() || cleanEmail.split('@')[0];

    try {
      // 1. Verify OTP with server authority
      const verifyRes = await firebaseVerifyOtp(cleanEmail, code);

      if (!verifyRes.success) {
        setIsLoading(false);
        setErrorMessage(verifyRes.error || 'Invalid verification code. Please check your email.');
        return;
      }

      // 2. If Sign Up, register in Firebase Auth
      if (mode === 'signup' || !fullName) {
        const signUpRes = await firebaseSignUp(cleanEmail, password, cleanName);
        if (!signUpRes.success && signUpRes.isConsoleActionNeeded) {
          console.warn('Firebase Console Action Notice:', signUpRes.error);
        }
      }

      // 3. Complete user session and allocate starter credits
      await completeUserSession(cleanEmail, cleanName);
      setIsLoading(false);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || 'Verification failed. Please try again.');
    }
  };

  // =========================================================================
  // 6. Handle OTP digit input changes
  // =========================================================================
  const handleDigitChange = (index: number, value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '');

    // Handle paste of complete 6-digit code
    if (cleaned.length >= 6) {
      const newDigits = cleaned.slice(0, 6).split('');
      setOtpDigits(newDigits);
      otpInputRefs.current[5]?.focus();
      handleVerifyOtp(cleaned.slice(0, 6));
      return;
    }

    const singleDigit = cleaned.slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = singleDigit;
    setOtpDigits(newDigits);

    // Auto-advance to next input
    if (singleDigit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are filled
    if (index === 5 && singleDigit && newDigits.every((d) => d !== '')) {
      handleVerifyOtp(newDigits.join(''));
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // =========================================================================
  // 7. Forgot Password Handler
  // =========================================================================
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await firebaseSendPasswordReset(cleanEmail);
      setIsLoading(false);
      if (res.success) {
        setStatusMessage(`Password reset link dispatched to ${cleanEmail}. Check your inbox.`);
      } else {
        setErrorMessage(res.error || 'Failed to dispatch password reset email.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || 'Error requesting password reset.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-radial from-[#10172a] via-[#090d16] to-[#04060a] relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <div className="relative z-10 w-full max-w-md bg-[#0c101c]/95 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 p-0.5 shadow-lg shadow-cyan-500/30 mb-3">
            <div className="w-full h-full bg-[#0a0e1a] rounded-[14px] flex items-center justify-center">
              <span className="font-extrabold text-2xl tracking-tighter bg-gradient-to-r from-cyan-400 to-purple-300 bg-clip-text text-transparent">
                OG
              </span>
            </div>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            OG AI <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Studio</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Firebase Authentication & Secure Gateway
          </p>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed flex-1">{errorMessage}</div>
          </div>
        )}

        {/* Global Status/Success Banner */}
        {statusMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed flex-1">{statusMessage}</div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 1: SIGN IN / SIGN UP FORM                                */}
        {/* ============================================================== */}
        {(mode === 'signin' || mode === 'signup') && (
          <div>
            {/* 1-Click Google Sign-In (Firebase Native) */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-2.5 shadow-lg transition-all cursor-pointer mb-5 hover:scale-[1.01]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px bg-white/10 flex-1" />
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
                Or with Email & OTP
              </span>
              <div className="h-px bg-white/10 flex-1" />
            </div>

            {/* Mode Switch Tabs */}
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-white/5 border border-white/10 mb-5">
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMessage(null);
                  setStatusMessage(null);
                }}
                className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMessage(null);
                  setStatusMessage(null);
                }}
                className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
            </div>

            <form onSubmit={mode === 'signup' ? handleSignUpSubmit : handleSignInSubmit} className="space-y-4">
              {/* Full Name (Sign Up only) */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Alex Mercer"
                      className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:border-cyan-400 outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Email Address */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:border-cyan-400 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Password
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot_password')}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-10 py-3 bg-black/50 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:border-cyan-400 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password (Sign Up only) */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your password"
                      className="w-full pl-10 pr-10 py-3 bg-black/50 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:border-cyan-400 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Sign Up Starter Bonus Card */}
              {mode === 'signup' && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
                  <span className="text-amber-300 font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Starter Bonus Included
                  </span>
                  <span className="font-mono font-bold text-amber-400">₹385 Credits</span>
                </div>
              )}

              {/* Action Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer ${
                  isLoading
                    ? 'bg-cyan-900/60 text-cyan-300 border border-cyan-500/40 cursor-wait'
                    : 'bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-cyan-500/25 hover:scale-[1.01]'
                }`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-cyan-300" />
                    <span>Processing & Sending Code...</span>
                  </>
                ) : (
                  <>
                    <span>{mode === 'signup' ? 'Send Email Verification Code' : 'Sign In & Verify'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: 6-DIGIT EMAIL OTP VERIFICATION SCREEN                   */}
        {/* ============================================================== */}
        {mode === 'otp_verify' && (
          <div className="space-y-5">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 mb-3">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Enter Verification Code</h3>
              <p className="text-xs text-slate-400 mt-1">
                A 6-digit verification code was prepared for:
              </p>
              <p className="text-xs font-mono font-bold text-cyan-300 mt-0.5">{email}</p>
            </div>

            {/* Sandbox Mode / Live Preview Banner */}
            {isSandboxMode && sandboxCode && (
              <div className="p-3.5 rounded-2xl bg-cyan-950/50 border border-cyan-500/40 text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    Sandbox Verification Code
                  </span>
                  <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded-md">
                    SMTP Not Configured
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-2">
                  <div className="font-mono text-xl font-black tracking-widest text-cyan-300 bg-black/70 px-3 py-1.5 rounded-xl border border-cyan-500/30">
                    {sandboxCode}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const digits = sandboxCode.split('').slice(0, 6);
                      setOtpDigits(digits);
                      handleVerifyOtp(sandboxCode);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Auto-Fill Code</span>
                  </button>
                </div>
                {testEmailPreviewUrl && (
                  <div className="mt-2.5 pt-2.5 border-t border-cyan-500/20 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">View generated HTML email:</span>
                    <a
                      href={testEmailPreviewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 underline font-semibold flex items-center gap-1 hover:text-cyan-300"
                    >
                      <span>Preview Email</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Real SMTP Delivery Notification */}
            {isDeliveredToInbox && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Dispatched to your inbox. Check your Spam or Promotions tab if not seen.</span>
              </div>
            )}

            {/* 6 Individual Digit Input Boxes */}
            <div className="flex items-center justify-between gap-2 max-w-xs mx-auto">
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    otpInputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleDigitKeyDown(index, e)}
                  className={`w-11 h-14 text-center text-xl font-mono font-extrabold rounded-xl border outline-none transition-all ${
                    digit
                      ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                      : 'bg-black/50 border-white/15 text-white focus:border-cyan-400 focus:bg-cyan-500/5'
                  }`}
                />
              ))}
            </div>

            {/* Verify Code Button */}
            <button
              type="button"
              disabled={isLoading || otpDigits.some((d) => d === '')}
              onClick={() => handleVerifyOtp()}
              className={`w-full py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer ${
                isLoading || otpDigits.some((d) => d === '')
                  ? 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-cyan-500/30 hover:scale-[1.01]'
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-300" />
                  <span>Verifying Code with Firebase...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Verify Code & Enter OG AI</span>
                </>
              )}
            </button>

            {/* Resend Code & Controls */}
            <div className="flex items-center justify-between text-xs pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setMode(fullName ? 'signup' : 'signin');
                  setErrorMessage(null);
                }}
                className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Change Email</span>
              </button>

              <button
                type="button"
                disabled={!canResend || isLoading}
                onClick={handleResendOtp}
                className={`flex items-center gap-1.5 font-mono cursor-pointer transition-colors ${
                  canResend && !isLoading
                    ? 'text-cyan-400 hover:text-cyan-300 font-bold'
                    : 'text-slate-500 cursor-not-allowed'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{canResend ? 'Resend Code' : `Resend in ${countdown}s`}</span>
              </button>
            </div>

            {/* Not receiving code troubleshooting trigger */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setShowTroubleshootModal(true)}
                className="text-xs text-slate-400 hover:text-cyan-300 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span>Not receiving the code? Tap for help</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 3: FORGOT PASSWORD SCREEN                                 */}
        {/* ============================================================== */}
        {mode === 'forgot_password' && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-white">Reset Password</h3>
              <p className="text-xs text-slate-400 mt-1">
                Enter your email address to receive password reset instructions.
              </p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:border-cyan-400 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg cursor-pointer"
              >
                {isLoading ? 'Dispatching Reset Link...' : 'Send Reset Link'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMessage(null);
                  setStatusMessage(null);
                }}
                className="w-full text-center text-xs text-slate-400 hover:text-white pt-2 cursor-pointer"
              >
                ← Back to Sign In
              </button>
            </form>
          </div>
        )}

        {/* Security Trust Badges Footer */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1 text-cyan-400 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Firebase Auth</span>
          </div>
          <span>Zero-Trust Architecture</span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: OTP TROUBLESHOOTING HELP DRAWER                       */}
      {/* ============================================================== */}
      {showTroubleshootModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0e1424] border border-cyan-500/40 rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setShowTroubleshootModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-xl bg-white/5 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4 text-cyan-400">
              <HelpCircle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-base text-white">Why Haven't I Received the Code?</h3>
            </div>

            <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="font-bold text-white block mb-1">1. Check Spam or Junk Folder</span>
                Automated security emails can occasionally be routed to your Spam, Promotions, or Updates folder in Gmail/Outlook.
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="font-bold text-white block mb-1">2. Server Mail Relay Configuration</span>
                In cloud-hosted sandbox environments, external mail transfer (to `@gmail.com`) requires configuring an SMTP relay (such as a <strong>Gmail App Password</strong>) in the server environment.
              </div>

              {sandboxCode && (
                <div className="p-3.5 rounded-xl bg-cyan-950/60 border border-cyan-400/40">
                  <span className="font-bold text-cyan-300 block mb-1">3. Your Instant Test Code:</span>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-mono text-lg font-bold text-white">{sandboxCode}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const digits = sandboxCode.split('').slice(0, 6);
                        setOtpDigits(digits);
                        setShowTroubleshootModal(false);
                        handleVerifyOtp(sandboxCode);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold transition-colors cursor-pointer"
                    >
                      Fill Code
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setShowTroubleshootModal(false);
                    handleGoogleSignIn();
                  }}
                  className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-2 shadow cursor-pointer"
                >
                  <span>Or Sign In with Google Directly</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: FIREBASE CONSOLE EMAIL PROVIDER GUIDANCE              */}
      {/* ============================================================== */}
      {showFirebaseSetupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0e1424] border border-amber-500/40 rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setShowFirebaseSetupModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-xl bg-white/5 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4 text-amber-400">
              <Info className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-base text-white">Firebase Console Action Needed</h3>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                By default in Google AI Studio, Firebase is provisioned with Google Sign-In. To enable Email + Password authentication in your Firebase Project (<code className="text-cyan-300">gen-lang-client-0029860426</code>):
              </p>

              <ol className="list-decimal pl-4 space-y-1.5 text-slate-200">
                <li>Open the Firebase Console Authentication tab.</li>
                <li>Under <strong>Sign-in method</strong>, click <strong>Email/Password</strong>.</li>
                <li>Toggle <strong>Enable</strong> to ON and tap <strong>Save</strong>.</li>
              </ol>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowFirebaseSetupModal(false);
                    handleGoogleSignIn();
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold text-xs shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Continue with 1-Click Google Sign-In Instead</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
