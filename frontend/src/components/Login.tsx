import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BarChart3, CheckCircle2, Eye, EyeOff, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { apiUrl, AuthUser } from "../lib/api";

interface LoginProps { onLoginSuccess: (token: string, user: AuthUser) => void; }
const roles = [
  ["Super Admin", "admin@erp.com", "Full business intelligence"],
  ["Sub Admin", "subadmin@erp.com", "Daily operations workspace"],
  ["Sales", "sales@erp.com", "Focused CRM workspace"],
] as const;

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const selectRole = (accountEmail: string) => { setEmail(accountEmail); setPassword("ChangeMe123!"); setError(""); };
  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault(); setError(""); setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await response.json();
      if (!response.ok) { setError(data.message || "Invalid email or password"); return; }
      localStorage.setItem("zootechx_token", data.token); localStorage.setItem("zootechx_user", JSON.stringify(data.user)); onLoginSuccess(data.token, data.user);
    } catch { setError("Unable to connect to the server"); } finally { setLoading(false); }
  };
  return (
    <main className="login-shell min-h-screen overflow-hidden bg-[#070b16] text-white">
      <div className="login-orb login-orb-one" /><div className="login-orb login-orb-two" /><div className="login-grid" />
      <div className="relative mx-auto grid min-h-screen max-w-[1440px] items-center gap-12 px-5 py-8 lg:grid-cols-[1.1fr_.9fr] lg:px-12">
        <motion.section initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .65, ease: "easeOut" }} className="hidden lg:block">
          <div className="mb-12 flex items-center gap-3"><div className="brand-mark">Z</div><div><div className="text-lg font-bold tracking-tight">ZootechX<span className="text-indigo-300">.ai</span></div><div className="text-[11px] font-medium uppercase tracking-[.18em] text-slate-500">Enterprise operating system</div></div></div>
          <div className="max-w-2xl"><div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1.5 text-xs font-medium text-indigo-200"><Sparkles size={13} /> A smarter way to run your business</div><h1 className="text-5xl font-semibold leading-[1.05] tracking-[-.055em] text-white xl:text-6xl">Your revenue engine,<br/><span className="login-gradient-text">beautifully organized.</span></h1><p className="mt-6 max-w-xl text-base leading-7 text-slate-400">The premium workspace for managing leads, clients, billing and follow-ups in one calm, intelligent flow.</p></div>
          <div className="mt-12 grid max-w-xl grid-cols-2 gap-4"><div className="login-feature-card col-span-2"><div className="flex items-start justify-between"><div><div className="text-sm font-semibold">Live business overview</div><div className="mt-1 text-xs text-slate-400">Revenue, pipeline and activity at a glance</div></div><BarChart3 className="text-cyan-300" size={20}/></div><div className="mt-6 flex h-12 items-end gap-1.5">{[28, 44, 35, 66, 52, 80, 62, 91, 74, 100].map((height, index) => <span key={index} className="flex-1 rounded-t bg-gradient-to-t from-indigo-600 to-cyan-300/90" style={{ height: `${height}%`, opacity: .45 + index / 20 }} />)}</div></div><div className="login-stat"><span className="text-2xl font-semibold">10×</span><span className="text-xs text-slate-400">faster follow-through</span></div><div className="login-stat"><span className="text-2xl font-semibold">360°</span><span className="text-xs text-slate-400">client visibility</span></div></div>
        </motion.section>
        <motion.section initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55, delay: .08, ease: "easeOut" }} className="mx-auto w-full max-w-[470px]">
          <div className="login-panel rounded-[28px] p-6 shadow-2xl shadow-black/30 sm:p-8"><div className="mb-8 flex items-start justify-between"><div><div className="mb-2 flex lg:hidden items-center gap-2"><div className="brand-mark brand-mark-sm">Z</div><span className="font-bold">ZootechX.ai</span></div><h2 className="text-2xl font-semibold tracking-tight text-slate-950">Welcome back</h2><p className="mt-1.5 text-sm text-slate-500">Sign in to your secure workspace.</p></div><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><ShieldCheck size={20}/></div></div>
            <form onSubmit={handleLogin} className="space-y-5"><label className="block"><span className="mb-2 block text-xs font-semibold uppercase tracking-[.12em] text-slate-500">Work email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" className="login-input" required /></label><label className="block"><span className="mb-2 block text-xs font-semibold uppercase tracking-[.12em] text-slate-500">Password</span><span className="relative block"><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" className="login-input pr-12" required /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600">{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></span></label><AnimatePresence>{error && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-600">{error}</motion.div>}</AnimatePresence><button type="submit" disabled={loading} className="login-submit">{loading ? "Signing you in…" : <><span>Enter workspace</span><ArrowRight size={17}/></>}</button></form>
            <div className="my-7 flex items-center gap-3"><div className="h-px flex-1 bg-slate-200"/><span className="text-[10px] font-semibold uppercase tracking-[.16em] text-slate-400">Development access</span><div className="h-px flex-1 bg-slate-200"/></div><div className="grid gap-2">{roles.map(([role, accountEmail, detail]) => <button key={accountEmail} type="button" onClick={() => selectRole(accountEmail)} className="login-role"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><LockKeyhole size={14}/></span><span className="min-w-0 flex-1 text-left"><span className="block text-sm font-semibold text-slate-800">{role}</span><span className="block truncate text-xs text-slate-500">{detail}</span></span><span className="text-xs font-semibold text-indigo-600">Use</span></button>)}</div><p className="mt-5 text-center text-xs text-slate-500">Developers sign in above with the email and temporary password supplied by their Super Admin.</p><div className="mt-4 flex items-center gap-2 text-xs text-slate-400"><CheckCircle2 size={14} className="text-emerald-500"/> Demo password: <span className="font-medium text-slate-600">ChangeMe123!</span></div></div>
          <p className="mt-5 text-center text-xs text-slate-500">Protected with role-based permissions · ZootechX.ai © 2026</p>
        </motion.section>
      </div>
    </main>
  );
}
