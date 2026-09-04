import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight, BarChart3, Eye, EyeOff, ShieldCheck, Sparkles,
  Mail, Lock, CheckCircle2, Megaphone, TrendingUp
} from "lucide-react";
import { apiUrl, AuthUser } from "../lib/api";

interface LoginProps {
  onLoginSuccess: (token: string, user: AuthUser) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const submitLogin = async (loginEmail: string, loginPass: string) => {
    setError("");
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Invalid email or password");
        return;
      }
      localStorage.setItem("zootechx_token", data.token);
      localStorage.setItem("zootechx_user", JSON.stringify(data.user));
      onLoginSuccess(data.token, data.user);
    } catch {
      setError("Unable to connect to the server. Please check your backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    await submitLogin(email, password);
  };

  const handlePasswordChange = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }
    setLoading(true);
    try {
      const loginResponse = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const loginData = await loginResponse.json();
      if (!loginResponse.ok) {
        setError(loginData.message || "Your current password is incorrect.");
        return;
      }
      const response = await fetch(`${apiUrl}/api/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${loginData.token}`,
        },
        body: JSON.stringify({ currentPassword: password, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Unable to change password.");
        return;
      }
      setPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setChangingPassword(false);
      setError("Password changed successfully. You may now sign in.");
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-shell min-h-screen overflow-hidden text-white flex flex-col justify-center relative">
      {/* Luxury Background Layers */}
      <div className="login-aurora" />
      <div className="login-spotlight" />
      <div className="login-orb login-orb-one" />
      <div className="login-orb login-orb-two" />
      <div className="login-orb login-orb-three" />
      <div className="login-grid" />

      {/* Main Responsive Container */}
      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-[1440px] items-center gap-8 px-4 py-8 lg:grid-cols-[1.05fr_.95fr] lg:px-12">
        {/* Left Showcase Hero Panel (Desktop) */}
        <motion.section
          initial={{ opacity: 0, x: -25 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="hidden lg:flex flex-col justify-center pr-4"
        >
          <div className="mb-10 flex items-center gap-3">
            <div className="brand-mark">Z</div>
            <div>
              <div className="text-xl font-extrabold tracking-tight flex items-center gap-2">
                ZootechX<span className="text-indigo-400">.ai</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Executive Operating System
              </div>
            </div>
          </div>

          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3.5 py-1.5 text-xs font-semibold text-indigo-300 shadow-sm shadow-indigo-500/10">
              <Sparkles size={14} className="text-indigo-400" /> Enterprise CRM & Intelligence Suite
            </div>
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-[-0.04em] text-white xl:text-6xl">
              Your entire firm,<br />
              <span className="login-gradient-text">effortlessly orchestrated.</span>
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-slate-300">
              A unified executive cockpit for managing leads, automated invoicing, client settlements, developer projects, and encrypted credentials with zero clutter.
            </p>
          </div>

          {/* Feature Showcase Card */}
          <div className="mt-8 grid max-w-xl grid-cols-2 gap-3.5">
            <div className="login-feature-card col-span-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Live Radar Activity</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                      ACTIVE
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    Real-time deals, invoices, and developer commits
                  </div>
                </div>
                <BarChart3 className="text-cyan-400" size={20} />
              </div>
              <div className="mt-5 flex h-11 items-end gap-1.5">
                {[30, 48, 38, 70, 56, 85, 68, 95, 78, 100].map((height, index) => (
                  <span
                    key={index}
                    className="flex-1 rounded-t bg-gradient-to-t from-indigo-600 via-indigo-400 to-cyan-300"
                    style={{ height: `${height}%`, opacity: 0.5 + index / 20 }}
                  />
                ))}
              </div>
            </div>

            <div className="login-stat flex flex-col justify-between">
              <div className="text-2xl font-bold font-mono text-indigo-300">10×</div>
              <div className="text-xs text-slate-400 mt-1">Faster Deal Close & Invoicing</div>
            </div>
            <div className="login-stat flex flex-col justify-between">
              <div className="text-2xl font-bold font-mono text-cyan-300">100%</div>
              <div className="text-xs text-slate-400 mt-1">Encrypted Secret Isolation</div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-4 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-400" /> Neon Postgres Backed
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-indigo-400" /> Role-Based Access Control
            </span>
          </div>
        </motion.section>

        {/* Right Authentication Card */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08, ease: "easeOut" }}
          className="mx-auto w-full max-w-[500px]"
        >
          <div className="login-panel p-6 sm:p-8">
            {/* Header / Brand */}
            <div className="mb-6 flex items-start justify-between">
              <div>
                <div className="mb-2 flex lg:hidden items-center gap-2">
                  <div className="brand-mark brand-mark-sm">Z</div>
                  <span className="font-extrabold text-white text-base">ZootechX.ai</span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  Sign In to Console
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Enter your authorized credentials to access the console.
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner">
                <ShieldCheck size={22} />
              </div>
            </div>

            {/* Quick Demo Access Pills */}
            <div className="mb-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] p-2.5">
              <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Sparkles size={12} className="text-amber-400" /> Quick Role Access
                </span>
                <span className="text-[10px] text-slate-500 font-mono">1-Click Demo Fill</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmail("marketing@erp.com");
                    setPassword("ChangeMe123!");
                    setError("");
                  }}
                  className={`flex items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs transition border ${
                    email === "marketing@erp.com"
                      ? "bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                      : "bg-slate-800/40 border-slate-700/60 text-slate-300 hover:border-cyan-500/40 hover:bg-slate-800/70"
                  }`}
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
                    <Megaphone size={12} />
                  </div>
                  <div className="truncate">
                    <div className="font-semibold text-[11px] text-white flex items-center gap-1">
                      Digital Mktg <span className="rounded bg-cyan-400/20 px-1 text-[9px] text-cyan-300 font-mono">NEW</span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">marketing@erp.com</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEmail("admin@erp.com");
                    setPassword("ChangeMe123!");
                    setError("");
                  }}
                  className={`flex items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs transition border ${
                    email === "admin@erp.com"
                      ? "bg-indigo-500/20 border-indigo-400 text-indigo-200 shadow-[0_0_12px_rgba(99,102,241,0.25)]"
                      : "bg-slate-800/40 border-slate-700/60 text-slate-300 hover:border-indigo-500/40 hover:bg-slate-800/70"
                  }`}
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
                    <ShieldCheck size={12} />
                  </div>
                  <div className="truncate">
                    <div className="font-semibold text-[11px] text-white">Super Admin</div>
                    <div className="text-[10px] text-slate-400 truncate">admin@erp.com</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={changingPassword ? handlePasswordChange : handleLogin} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 flex items-center gap-1.5">
                  <Mail size={12} className="text-indigo-400" /> Work Email
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@company.com"
                  className="login-input"
                  required
                />
              </label>

              <label className="block">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 flex items-center gap-1.5">
                    <Lock size={12} className="text-indigo-400" /> Password
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setChangingPassword(!changingPassword);
                      setError("");
                    }}
                    className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition"
                  >
                    {changingPassword ? "Sign in instead" : "Change password"}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter account password"
                    className="login-input pr-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-400 transition"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              {/* Password Change Drawer */}
              {changingPassword && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 pt-1"
                >
                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      New Password
                    </span>
                    <input
                      required
                      minLength={8}
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder="Minimum 8 characters"
                      className="login-input"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Confirm New Password
                    </span>
                    <input
                      required
                      minLength={8}
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="Confirm new password"
                      className="login-input"
                    />
                  </label>
                </motion.div>
              )}

              {/* Error / Feedback Alert */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`rounded-xl border px-3.5 py-2.5 text-xs font-semibold ${
                      error.startsWith("Password changed")
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        : "border-rose-500/30 bg-rose-500/10 text-rose-400"
                    }`}
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="login-submit shine-btn mt-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating…
                  </span>
                ) : changingPassword ? (
                  "Save New Password"
                ) : (
                  <>
                    <span>Enter Workspace</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="mt-4 text-center text-[11px] text-slate-500">
            ZootechX.ai Enterprise OS · Protected with AES-256 Encryption
          </p>
        </motion.section>
      </div>
    </main>
  );
}
