import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  Search,
  AlertCircle,
  HelpCircle,
  Award,
  CheckCircle2,
  KeyRound,
} from "lucide-react";

export const LoginPage: React.FC = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [googleNotice, setGoogleNotice] = useState<string | null>(null);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("session_expired") === "true") {
      setSessionExpiredNotice(true);
    }
  }, []);

  // If already authenticated, redirect to authorized dashboard
  React.useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Invalid email or password. Please verify your credentials and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleClick = () => {
    setGoogleNotice(
      "Google OAuth 2.0 Identity Service verifies authorized pre-registered emails. On this instance, please sign in with your official Email & Password."
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col lg:grid lg:grid-cols-12 text-[#343A40] select-none">
      {/* ========================================================= */}
      {/* LEFT PANEL – Welcome & Credential Branding (6 / 12 Cols) */}
      {/* ========================================================= */}
      <div className="lg:col-span-6 xl:col-span-7 bg-[#1F2E4A] text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        {/* Subtle decorative background geometric lines & guilloche mesh */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 800 800" fill="none">
            <circle cx="400" cy="400" r="380" stroke="white" strokeWidth="1" strokeDasharray="4 8" />
            <circle cx="400" cy="400" r="300" stroke="white" strokeWidth="1" />
            <circle cx="400" cy="400" r="220" stroke="white" strokeWidth="1" strokeDasharray="2 4" />
            <circle cx="400" cy="400" r="140" stroke="white" strokeWidth="1" />
            <path d="M 0,400 L 800,400 M 400,0 L 400,800" stroke="white" strokeWidth="0.5" />
          </svg>
        </div>

        {/* Ambient warm gradient flare */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header: Branding */}
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-extrabold text-2xl tracking-tight text-white">
                CertiFlow
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/15 text-white border border-white/20">
                Gov
              </span>
            </div>
            <p className="text-xs text-white/70 font-semibold tracking-wide mt-0.5">
              Pragati Skills Mission Directorate
            </p>
          </div>

          <Link
            to="/verify"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all shadow-xs"
          >
            <Search size={13} />
            <span className="hidden sm:inline">Public Verification</span>
          </Link>
        </div>

        {/* Center: Welcome Headline & Abstract Credential Illustration */}
        <div className="relative z-10 my-10 lg:my-0 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white border border-white/20 mb-4 backdrop-blur-md">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>State Digital Certification Framework</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Welcome to CertiFlow.
          </h2>
          <p className="text-sm sm:text-base text-white/80 mt-3 font-normal leading-relaxed">
            A smarter, transparent approach to certificate issuance and verification.
          </p>

          {/* Abstract Government / Credential Illustration Component */}
          <div className="mt-8 p-5 sm:p-6 rounded-2xl bg-white/8 border border-white/15 backdrop-blur-lg shadow-2xl relative">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Feature 1 */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 shrink-0">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white">Cryptographic QR Verification</h4>
                  <p className="text-[11px] text-white/70 mt-0.5">
                    High-resolution tamper-evident vector certificates.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 shrink-0">
                  <KeyRound size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white">Multi-Officer Quorum</h4>
                  <p className="text-[11px] text-white/70 mt-0.5">
                    Independent district endorsements with race condition guards.
                  </p>
                </div>
              </div>
            </div>

            {/* Credential Seal Emblem */}
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-white/60">
              <span className="flex items-center gap-1.5">
                <Award size={13} className="text-amber-400" />
                <span>Directorate of Vocational Training & Skill Development</span>
              </span>
              <span className="font-mono text-[10px] text-white/40">ISO/IEC 27001 SECURED</span>
            </div>
          </div>
        </div>

        {/* Left Bottom Footer */}
        <div className="relative z-10 text-xs text-white/50 border-t border-white/10 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span>Official Portal for Accredited Training Centres & State Officers</span>
          <span>Pragati Skills Mission © 2026</span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* RIGHT PANEL – Manual Account Sign In (6 / 12 Cols) */}
      {/* ========================================================= */}
      <div className="lg:col-span-6 xl:col-span-5 p-6 sm:p-10 lg:p-16 flex flex-col justify-center items-center">
        <div className="w-full max-w-md">
          {/* Section Header */}
          <div className="mb-8">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#1F2E4A]/70 px-2.5 py-1 rounded-md bg-[#1F2E4A]/5 border border-[#1F2E4A]/10 inline-block mb-2">
              Secure Access
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F2E4A] tracking-tight">
              Official Account Sign In
            </h1>
            <p className="text-xs sm:text-sm text-[#343A40]/70 mt-1">
              Sign in using your registered official account.
            </p>
          </div>

          {/* Error Banner */}
          {sessionExpiredNotice && (
            <div className="mb-6 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle size={16} className="shrink-0 text-amber-600 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                Your previous session expired or required re-authentication. Please sign in with your official account credentials.
              </div>
              <button
                onClick={() => setSessionExpiredNotice(false)}
                className="text-amber-500 hover:text-amber-800 text-xs font-bold"
              >
                ×
              </button>
            </div>
          )}

          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle size={16} className="shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1 font-medium">{error}</div>
              <button
                onClick={() => setError(null)}
                className="text-rose-400 hover:text-rose-800 text-xs font-bold"
              >
                ×
              </button>
            </div>
          )}

          {googleNotice && (
            <div className="mb-6 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle size={16} className="shrink-0 text-blue-600 mt-0.5" />
              <div className="flex-1 leading-relaxed">{googleNotice}</div>
              <button
                onClick={() => setGoogleNotice(null)}
                className="text-blue-500 hover:text-blue-800 text-xs font-bold"
              >
                ×
              </button>
            </div>
          )}

          {/* Primary Form: Manual Email & Password */}
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-[#1F2E4A] mb-1.5">
                Official Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@certiflow.gov"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#CED4DA] bg-white text-xs sm:text-sm text-[#343A40] placeholder-slate-400 focus:outline-none focus:border-[#1F2E4A] focus:ring-1 focus:ring-[#1F2E4A] transition-all"
                />
              </div>
            </div>

            {/* Password Field with Show/Hide Toggle */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#1F2E4A]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] font-semibold text-[#1F2E4A]/80 hover:text-[#1F2E4A] hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#CED4DA] bg-white text-xs sm:text-sm text-[#343A40] placeholder-slate-400 focus:outline-none focus:border-[#1F2E4A] focus:ring-1 focus:ring-[#1F2E4A] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[#1F2E4A] hover:bg-[#162238] text-white text-xs sm:text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#CED4DA]/60" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
              <span className="bg-[#F8F9FA] px-3 text-slate-400">Or continue with identity</span>
            </div>
          </div>

          {/* Continue with Google */}
          <button
            type="button"
            onClick={handleGoogleClick}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-[#CED4DA] bg-white hover:bg-slate-50 text-xs font-bold text-[#343A40] transition-colors shadow-xs cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
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
            <span>Continue with Google</span>
          </button>

          {/* Bottom Public Portal Card */}
          <div className="mt-8 pt-6 border-t border-[#CED4DA]/50 text-center">
            <p className="text-xs text-[#343A40]/70">
              Need to verify a certificate?
            </p>
            <Link
              to="/verify"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1F2E4A] hover:underline mt-1"
            >
              <span>Access Public Verification Portal (No Sign In Required)</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-2.5 text-[#1F2E4A] mb-3">
              <HelpCircle size={20} className="text-[#1F2E4A]" />
              <h3 className="font-extrabold text-base">Credential Recovery Policy</h3>
            </div>
            <p className="text-xs text-[#343A40] leading-relaxed">
              Official accounts are strictly governed under the State Digital Certification Security Framework. Self-service password reset is disabled for role-protected government endpoints.
            </p>
            <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5">
              <div>• <strong>Training Centres:</strong> Contact your assigned District Skills Office.</div>
              <div>• <strong>District & Quality Officers:</strong> Contact the State Mission IT Administration at <code className="bg-white px-1 py-0.5 rounded text-[#1F2E4A] font-mono">support@certiflow.gov</code>.</div>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowForgotModal(false)}
                className="px-4 py-2 rounded-xl bg-[#1F2E4A] text-white text-xs font-bold hover:bg-[#162238] transition-colors cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
