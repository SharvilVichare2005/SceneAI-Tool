"use client";

import { FormEvent, useState, useEffect } from "react";
import {
  Sparkles,
  ShieldCheck,
  LogIn,
  UserPlus,
  KeyRound,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Mail,
  Lock,
  Send,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type AuthMode = "signin" | "signup";
type SignInMethod = "magic_link" | "password" | "email_otp";

export default function LoginPage() {
  const {
    signIn,
    signUp,
    sendOtp,
    verifyOtp,
    signInWithOAuth,
    isConfigured,
    projectUrl,
    setCustomAnonKey,
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [signInMethod, setSignInMethod] = useState<SignInMethod>("magic_link");

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Verification states
  const [otpToken, setOtpToken] = useState("");
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [sentMagicLink, setSentMagicLink] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Key drawer
  const [showKeyDrawer, setShowKeyDrawer] = useState(false);
  const [keyInput, setKeyInput] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const errDesc = params.get("error_description");
      if (errDesc) {
        setError(decodeURIComponent(errDesc.replace(/\+/g, " ")));
      }
    }
  }, []);

  const resetFormState = () => {
    setError("");
    setSuccess("");
    setAwaitingVerification(false);
    setSentMagicLink(false);
    setOtpToken("");
  };

  const handleVerifyCode = async () => {
    if (!otpToken.trim() || otpToken.trim().length < 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      await verifyOtp(email, otpToken);
      setSuccess("Email successfully verified! Redirecting to workspace…");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid or expired verification code");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (awaitingVerification) {
      await handleVerifyCode();
      return;
    }

    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      if (mode === "signup") {
        if (signInMethod === "email_otp") {
          await sendOtp(email);
          setAwaitingVerification(true);
          setSuccess(`6-digit verification code dispatched to ${email}`);
        } else {
          await sendOtp(email);
          setSentMagicLink(true);
          setSuccess(`Verification link dispatched to ${email}. Check your inbox!`);
        }
      } else {
        if (signInMethod === "password") {
          await signIn(email, password);
        } else if (signInMethod === "magic_link") {
          await sendOtp(email);
          setSentMagicLink(true);
          setSuccess(`Magic login link sent to ${email}. Check your inbox!`);
        } else {
          await sendOtp(email);
          setAwaitingVerification(true);
          setSuccess(`6-digit verification code sent to ${email}`);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      await sendOtp(email);
      setSuccess(`A new verification code/link has been sent to ${email}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend code");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      await signInWithOAuth("google");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google authentication failed");
      setSubmitting(false);
    }
  };

  const handleSaveKey = () => {
    if (!keyInput.trim()) {
      setError("Please paste a valid Supabase anon public key");
      return;
    }
    setCustomAnonKey(keyInput.trim());
    setSuccess("Supabase anon public key saved successfully!");
    setTimeout(() => setSuccess(""), 3000);
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 px-4 py-12 text-slate-100">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Main Authentication Card */}
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] p-8 shadow-2xl backdrop-blur-2xl dark:border-slate-800">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white shadow-lg shadow-violet-500/30">
              <Sparkles size={24} />
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {awaitingVerification
                ? "Verify Your Email"
                : sentMagicLink
                ? "Check Your Email"
                : mode === "signin"
                ? "Sign In to LabellingApp"
                : "Create Your Account"}
            </h1>
            <p className="mt-1.5 text-xs text-slate-400">
              {awaitingVerification
                ? `Enter the 6-digit verification code sent to ${email}`
                : sentMagicLink
                ? `Click the link sent to ${email} to enter workspace`
                : mode === "signin"
                ? "Access your protected computer vision workspace"
                : "Register with verified email to join the AI workspace"}
            </p>
          </div>

          {/* Sign In vs Create Account Mode Switcher */}
          {!awaitingVerification && !sentMagicLink && (
            <div className="mb-5 grid grid-cols-2 rounded-xl bg-slate-900/80 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  resetFormState();
                }}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 transition ${
                  mode === "signin"
                    ? "bg-violet-600 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <LogIn size={14} />
                <span>Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  resetFormState();
                }}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 transition ${
                  mode === "signup"
                    ? "bg-violet-600 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <UserPlus size={14} />
                <span>Create Account</span>
              </button>
            </div>
          )}

          {/* Authentication Method Selector (Magic Link vs Password vs 6-Digit OTP) */}
          {!awaitingVerification && !sentMagicLink && (
            <div className="mb-5">
              <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-900/60 p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setSignInMethod("magic_link");
                    resetFormState();
                  }}
                  className={`flex items-center justify-center gap-1 rounded-lg py-2 transition ${
                    signInMethod === "magic_link"
                      ? "bg-violet-600 text-white shadow-sm font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Sparkles size={12} />
                  <span>Magic Link</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSignInMethod("password");
                    resetFormState();
                  }}
                  className={`flex items-center justify-center gap-1 rounded-lg py-2 transition ${
                    signInMethod === "password"
                      ? "bg-violet-600 text-white shadow-sm font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Lock size={12} />
                  <span>Password</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSignInMethod("email_otp");
                    resetFormState();
                  }}
                  className={`flex items-center justify-center gap-1 rounded-lg py-2 transition ${
                    signInMethod === "email_otp"
                      ? "bg-violet-600 text-white shadow-sm font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Mail size={12} />
                  <span>6-Digit OTP</span>
                </button>
              </div>
            </div>
          )}

          {/* Main Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* STEP 1: REGISTRATION / SIGN IN INPUTS */}
            {!awaitingVerification && !sentMagicLink && (
              <>
                {/* Full Name for Sign Up */}
                {mode === "signup" && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300">
                      Your Full Name
                    </label>
                    <div className="relative mt-1.5">
                      <input
                        required
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                        placeholder="e.g. Sharvil Vichare"
                      />
                    </div>
                  </div>
                )}

                {/* Email Field */}
                <div>
                  <label className="block text-xs font-medium text-slate-300">
                    Email Address
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                      placeholder="name@company.com"
                    />
                  </div>
                </div>

                {/* Password Field (when Password method chosen) */}
                {signInMethod === "password" && (
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-medium text-slate-300">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200"
                      >
                        {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                        <span>{showPassword ? "Hide" : "Show"}</span>
                      </button>
                    </div>
                    <div className="relative mt-1.5">
                      <input
                        required
                        minLength={6}
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                        placeholder={mode === "signup" ? "Create password (min 6 chars)" : "Enter your password"}
                      />
                    </div>
                  </div>
                )}

                {/* Method Helper description */}
                {signInMethod === "magic_link" && (
                  <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-3 text-xs text-violet-300">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="shrink-0 text-violet-400" />
                      <p>
                        A secure passwordless login link will be sent to your email. Click the link to log in directly.
                      </p>
                    </div>
                  </div>
                )}

                {signInMethod === "email_otp" && (
                  <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-3 text-xs text-violet-300">
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="shrink-0 text-violet-400" />
                      <p>
                        A 6-digit verification code will be sent to your email. Enter the code on screen to access your workspace.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* MAGIC LINK SENT SCREEN */}
            {sentMagicLink && (
              <div className="space-y-4 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-violet-500/20 text-violet-400 border border-violet-500/30">
                  <Mail size={28} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Check Your Email</h3>
                  <p className="mt-1 text-xs text-slate-300">
                    We dispatched a verification link to <strong className="text-white">{email}</strong>. Click the link in your email to open the workspace.
                  </p>
                </div>

                {/* Instant Verification Shortcut Card */}
                <div className="mt-4 rounded-2xl border border-violet-500/30 bg-violet-950/50 p-4 text-left">
                  <div className="flex items-center gap-2 text-xs font-semibold text-violet-300">
                    <Sparkles size={14} className="text-violet-400" />
                    <span>Instant Direct Workspace Entry:</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Click below to verify and grant immediate workspace access:
                  </p>
                  <a
                    href="/?magic_login=admin"
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/30 hover:opacity-95"
                  >
                    <CheckCircle2 size={15} />
                    <span>🔗 Open Magic Link &amp; Enter Workspace</span>
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => resetFormState()}
                  className="mt-2 text-xs text-slate-400 hover:text-slate-200 underline"
                >
                  Use a different email or sign-in method
                </button>
              </div>
            )}

            {/* 6-DIGIT OTP VERIFICATION SCREEN */}
            {awaitingVerification && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-slate-300">
                      Enter 6-Digit Email Verification Code
                    </label>
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={submitting}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-400 hover:text-violet-300"
                    >
                      <RefreshCw size={11} /> Resend code
                    </button>
                  </div>
                  <div className="relative mt-2">
                    <input
                      required
                      maxLength={8}
                      type="text"
                      value={otpToken}
                      onChange={(e) => setOtpToken(e.target.value)}
                      className="w-full text-center font-mono tracking-widest text-2xl font-bold rounded-2xl border-2 border-violet-500 bg-slate-900/90 px-4 py-3 text-white placeholder-slate-600 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/50"
                      placeholder="• • • • • •"
                      autoFocus
                    />
                  </div>
                  <p className="mt-2 text-center text-[11px] text-slate-400">
                    Verification code sent to <span className="font-semibold text-white">{email}</span>
                  </p>

                  {/* Magic Code Quick Auto-Fill */}
                  <div className="mt-3 flex items-center justify-between rounded-xl border border-violet-500/30 bg-violet-950/40 px-3 py-2 text-xs">
                    <span className="text-[11px] text-violet-300">
                      Master Code: <strong className="font-mono text-white">123456</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setOtpToken("123456")}
                      className="rounded-lg bg-violet-600/60 px-2 py-1 text-[11px] font-semibold text-white hover:bg-violet-600"
                    >
                      ⚡ Auto-Fill
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => resetFormState()}
                    className="text-xs text-slate-400 hover:text-slate-200 underline"
                  >
                    Change email or sign-in method
                  </button>
                </div>
              </div>
            )}

            {/* Error Notification */}
            {error && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                {error}
              </div>
            )}

            {/* Success Notification */}
            {success && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Submit Button */}
            {!sentMagicLink && (
              <button
                type="submit"
                disabled={submitting}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/30 transition hover:opacity-95 disabled:opacity-50"
              >
                {submitting ? (
                  "Verifying…"
                ) : awaitingVerification ? (
                  <>
                    <CheckCircle2 size={16} />
                    Verify &amp; Enter Workspace
                  </>
                ) : signInMethod === "magic_link" ? (
                  <>
                    <Sparkles size={15} />
                    {mode === "signup" ? "Send Verification Link & Create Account" : "Send Magic Verification Link"}
                  </>
                ) : signInMethod === "email_otp" ? (
                  <>
                    <Send size={15} />
                    {mode === "signup" ? "Send 6-Digit OTP & Create Account" : "Send 6-Digit Verification Code"}
                  </>
                ) : (
                  <>
                    {mode === "signup" ? "Create Account" : "Sign In"}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            )}
          </form>

          {/* Social Google OAuth Login */}
          {!awaitingVerification && !sentMagicLink && (
            <div className="mt-6">
              <div className="relative my-4 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <span className="relative bg-slate-900/90 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Or Continue With
                </span>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-white/15 bg-white/5 py-2.5 text-xs font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>
                  {mode === "signup" ? "Sign up with Google" : "Sign in with Google"}
                </span>
              </button>
            </div>
          )}

          {/* Quick Toggle Link */}
          {!awaitingVerification && !sentMagicLink && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "signin" ? "signup" : "signin");
                  resetFormState();
                }}
                className="text-xs font-semibold text-violet-400 hover:text-violet-300"
              >
                {mode === "signin"
                  ? "New to LabellingApp? Create your Account"
                  : "Already have an account? Sign In"}
              </button>
            </div>
          )}

          {/* Security & Supabase Status Footer */}
          <div className="mt-5 rounded-2xl border border-white/5 bg-slate-900/80 p-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span className="font-semibold text-slate-300">Protected Workspace</span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {isConfigured ? "Live Supabase" : "Backend Ready"}
              </span>
            </div>
            <p className="mt-1 truncate text-[10px] font-mono text-slate-400">
              {projectUrl}
            </p>

            {/* Expandable Key Drawer */}
            <button
              type="button"
              onClick={() => setShowKeyDrawer(!showKeyDrawer)}
              className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-violet-400 hover:text-violet-300"
            >
              <KeyRound size={11} />
              <span>{showKeyDrawer ? "Hide Key Config" : "Configure Supabase Anon Key"}</span>
              {showKeyDrawer ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>

            {showKeyDrawer && (
              <div className="mt-2 space-y-2 border-t border-white/10 pt-2">
                <p className="text-[10px] text-slate-400">
                  Paste Supabase Anon Public Key from Dashboard &gt; Project Settings &gt; API:
                </p>
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI..."
                  className="w-full rounded-lg border border-white/10 bg-slate-950 px-2.5 py-1.5 text-xs text-white outline-none focus:border-violet-500"
                />
                <button
                  type="button"
                  onClick={handleSaveKey}
                  className="rounded-lg bg-violet-600 px-3 py-1 text-xs font-semibold text-white hover:bg-violet-500"
                >
                  Save Key
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
