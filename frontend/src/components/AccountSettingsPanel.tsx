import { LogOut, Settings } from "lucide-react";
import ChangePasswordControl from "./ChangePasswordControl";
import CredentialsVault from "./CredentialsVault";

export default function AccountSettingsPanel({ onLogout, dark = false }: { onLogout: () => void; dark?: boolean }) {
  const card = dark ? "border-[#2a2a40] bg-[#171725] text-white" : "border-slate-200 bg-white text-slate-900";
  return <section className={`mx-auto max-w-2xl rounded-2xl border p-6 shadow-sm ${card}`}>
    <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500"><Settings size={19}/></div><div><h2 className="font-semibold">Account settings</h2><p className={dark ? "text-sm text-slate-400" : "text-sm text-slate-500"}>Manage your password and session.</p></div></div>
    <div className="mt-6 flex flex-wrap gap-3"><ChangePasswordControl className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"/><button type="button" onClick={onLogout} className="inline-flex items-center gap-2 rounded-xl border border-rose-300 px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"><LogOut size={16}/>Log out</button></div>
    <CredentialsVault dark={dark}/>
  </section>;
}
