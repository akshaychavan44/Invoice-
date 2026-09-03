import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, CalendarDays, ClipboardList, Search,
  Sun, Moon, ShieldCheck, Phone, Mail, Clock, ExternalLink,
  ChevronRight, Filter, LogOut, CheckCircle2, AlertCircle, Building, X
} from "lucide-react";
import { apiFetch } from "../lib/api";

interface SalesDashboardProps {
  onLogout: () => void;
  dark?: boolean;
}

type Lead = {
  id: string;
  full_name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  source: string;
  status: string;
  notes: string | null;
  created_at: string;
};

type Followup = {
  id: string;
  lead_name: string;
  company: string | null;
  type: string;
  followup_date: string;
  followup_time: string | null;
  assigned_to: string | null;
  priority: string | null;
  status: string;
  notes: string | null;
};

type Client = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  gst_number: string | null;
};

export default function SalesDashboard({ onLogout, dark: propDark }: SalesDashboardProps) {
  const [page, setPage] = useState<"leads" | "followups" | "clients">("leads");
  const [internalDark, setInternalDark] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("zootechx_theme");
      if (saved) return saved === "dark";
    }
    return true;
  });
  const dark = propDark !== undefined ? propDark : internalDark;
  const setDark = (val: boolean | ((prev: boolean) => boolean)) => {
    const nextVal = typeof val === "function" ? val(dark) : val;
    setInternalDark(nextVal);
    if (typeof window !== "undefined") {
      localStorage.setItem("zootechx_theme", nextVal ? "dark" : "light");
      if (nextVal) {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
      }
    }
  };
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3000);
    return () => clearTimeout(timer);
  }, [notice]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [l, f, c] = await Promise.all([
        apiFetch("/api/leads"),
        apiFetch("/api/followups"),
        apiFetch("/api/clients"),
      ]);
      const [ld, fd, cd] = await Promise.all([l.json(), f.json(), c.json()]);
      if (!l.ok || !f.ok || !c.ok) throw new Error("Unable to load shared CRM data");
      setLeads(ld.data ?? []);
      setFollowups(fd.data ?? []);
      setClients(cd.data ?? []);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(), 12000);
    return () => window.clearInterval(interval);
  }, []);

  const filteredLeads = useMemo(() => {
    return leads.filter(
      (lead) =>
        (status === "ALL" || lead.status === status) &&
        `${lead.full_name} ${lead.company ?? ""} ${lead.phone ?? ""} ${lead.email ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase())
    );
  }, [leads, query, status]);

  const filteredFollowups = useMemo(() => {
    return followups.filter(
      (f) =>
        `${f.lead_name} ${f.company ?? ""} ${f.type}`
          .toLowerCase()
          .includes(query.toLowerCase())
    );
  }, [followups, query]);

  const filteredClients = useMemo(() => {
    return clients.filter(
      (c) =>
        `${c.name} ${c.company ?? ""} ${c.phone ?? ""} ${c.email ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase())
    );
  }, [clients, query]);

  // Design Tokens
  const bgMain = dark ? "bg-[#090d16] text-[#f1f5f9]" : "bg-slate-50 text-slate-900";
  const bgSidebar = dark ? "bg-[#101422] border-white/10" : "bg-white border-slate-200";
  const bgCard = dark ? "bg-[#141828]/90 border-white/10 text-white" : "bg-white border-slate-200 text-slate-900";
  const inputBg = dark ? "bg-[#1c2236] border-white/10 text-white placeholder-slate-400" : "bg-white border-slate-200 text-slate-900 placeholder-slate-400";
  const mutedText = dark ? "text-slate-400" : "text-slate-500";

  type SalesMenuItem = {
    id: "leads" | "followups" | "clients";
    label: string;
    icon: React.ComponentType<any>;
    badge?: number;
  };

  const menu: SalesMenuItem[] = [
    { id: "leads", label: "Lead Intelligence", icon: Users, badge: leads.length },
    { id: "followups", label: "Follow-up Queue", icon: CalendarDays, badge: followups.length },
    { id: "clients", label: "Client Directory", icon: ClipboardList, badge: clients.length },
  ];

  return (
    <div className={`luxury-app ${dark ? "dark-theme" : "light-theme"} h-screen w-full overflow-hidden flex flex-row ${bgMain} font-sans antialiased transition-colors duration-200`}>
      {/* SIDEBAR NAVIGATION */}
      <aside className={`w-[260px] shrink-0 hidden md:flex flex-col border-r ${bgSidebar} h-screen z-20`}>
        {/* Brand Header */}
        <div className="p-5 border-b border-inherit flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-400 via-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-base shadow-lg shadow-cyan-500/20">
            Z
          </div>
          <div>
            <div className="font-bold text-[14px] leading-tight flex items-center gap-1.5">
              ZootechX.ai
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="text-[11px] text-cyan-400 font-mono font-medium">Sales Command</div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {menu.map((item) => {
            const active = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setPage(item.id);
                  setSelectedLead(null);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-[13px] font-medium transition-all ${
                  active
                    ? (dark ? "bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/20" : "bg-slate-900 text-white shadow")
                    : `${mutedText} ${dark ? "hover:bg-white/5 hover:text-white" : "hover:bg-slate-100 hover:text-slate-900"}`
                }`}
              >
                <item.icon size={18} className={active ? "text-white" : (dark ? "text-slate-400" : "text-slate-500")} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                      active
                        ? "bg-white/20 text-white"
                        : (dark ? "bg-white/5 text-slate-400" : "bg-slate-100 text-slate-700")
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-inherit space-y-2">
          <button
            onClick={() => setDark(!dark)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold ${
              dark ? "bg-white/5 text-slate-300 hover:bg-white/10" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {dark ? <Sun size={15} /> : <Moon size={15} />}
            <span>{dark ? "Light Mode" : "Dark Mode"}</span>
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition"
          >
            <LogOut size={15} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <div className="flex-1 min-w-0 h-screen flex flex-col overflow-hidden">
        {/* HEADER */}
        <header className={`h-16 shrink-0 border-b flex items-center justify-between px-6 backdrop-blur-xl ${bgSidebar}`}>
          <div className="flex items-center gap-3">
            <h2 className={`text-lg font-bold tracking-tight capitalize ${dark ? "text-white" : "text-slate-900"}`}>
              {page === "leads"
                ? "Lead Intelligence"
                : page === "followups"
                ? "Follow-up Queue"
                : "Client Directory"}
            </h2>
            <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 text-[10px] font-bold text-cyan-400">
              Live Shared CRM
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile buttons */}
            <div className="flex md:hidden items-center gap-1">
              {menu.map((it) => (
                <button
                  key={it.id}
                  onClick={() => {
                    setPage(it.id);
                    setSelectedLead(null);
                  }}
                  className={`p-2 rounded-xl border ${
                    page === it.id
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : (dark ? "border-white/10 text-slate-400 hover:text-white" : "border-slate-200 text-slate-600 hover:bg-slate-100")
                  }`}
                >
                  <it.icon size={16} />
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <main className={`flex-1 h-full overflow-y-auto p-6 lg:p-8 space-y-6 ${bgMain}`}>
          {notice && (
            <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4 text-xs font-semibold text-indigo-300 flex items-center justify-between">
              <span>{notice}</span>
              <button onClick={() => setNotice("")} className="opacity-70 hover:opacity-100">
                <X size={14} />
              </button>
            </div>
          )}

          {/* TAB: LEADS */}
          {page === "leads" && (
            <div className="space-y-6 max-w-[1600px] mx-auto w-full">
              {/* FILTERS & SEARCH */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-80">
                  <Search size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${mutedText}`} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search leads by name, company, phone..."
                    className={`h-10 w-full rounded-xl border pl-9 pr-3 text-xs outline-none focus:border-indigo-500 ${inputBg}`}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className={`h-10 rounded-xl border px-3 text-xs outline-none ${inputBg}`}
                  >
                    <option value="ALL">All Statuses</option>
                    {Array.from(new Set(leads.map((l) => l.status))).map((st) => (
                      <option key={st} value={st}>
                        {st.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* LEADS GRID */}
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredLeads.map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className={`cursor-pointer rounded-3xl border p-5 transition-all hover:-translate-y-1 hover:border-indigo-500/40 hover:shadow-xl ${bgCard}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className={`font-bold text-sm ${dark ? "text-white" : "text-slate-900"}`}>
                          {lead.full_name}
                        </div>
                        <div className={`text-xs mt-0.5 ${mutedText}`}>
                          {lead.company || "Individual Client"}
                        </div>
                      </div>
                      <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 text-[10px] font-bold text-indigo-400">
                        {lead.status.replaceAll("_", " ")}
                      </span>
                    </div>

                    <div className={`mt-4 space-y-1.5 text-xs ${mutedText}`}>
                      <div className="flex items-center gap-2">
                        <Phone size={13} className="text-indigo-400" />
                        <span>{lead.phone || "No phone"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail size={13} className="text-indigo-400" />
                        <span className="truncate">{lead.email || "No email"}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-inherit flex items-center justify-between text-[11px]">
                      <span className={mutedText}>Source: {lead.source}</span>
                      <span className="text-indigo-400 font-semibold flex items-center gap-1">
                        Details <ChevronRight size={13} />
                      </span>
                    </div>
                  </div>
                ))}

                {filteredLeads.length === 0 && (
                  <div className={`col-span-full rounded-3xl border border-dashed p-14 text-center ${mutedText}`}>
                    No leads match your search criteria.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: FOLLOW-UPS */}
          {page === "followups" && (
            <div className="space-y-6 max-w-[1600px] mx-auto w-full">
              <div className={`overflow-hidden rounded-3xl border ${bgCard} shadow-sm`}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px]">
                    <thead className={`border-b border-inherit ${dark ? "bg-white/5 text-slate-400" : "bg-slate-100 text-slate-600"} text-[11px] uppercase tracking-wider font-bold`}>
                      <tr>
                        <th className="p-3.5 text-left">Lead / Client</th>
                        <th className="p-3.5 text-left">Activity Type</th>
                        <th className="p-3.5 text-left">Scheduled Time</th>
                        <th className="p-3.5 text-left">Assigned</th>
                        <th className="p-3.5 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y border-inherit">
                      {filteredFollowups.map((f) => (
                        <tr key={f.id} className={`hover:${dark ? "bg-white/5" : "bg-slate-50"} transition`}>
                          <td className="p-3.5">
                            <div className={`font-bold text-xs ${dark ? "text-white" : "text-slate-900"}`}>{f.lead_name}</div>
                            <div className={`text-[11px] ${mutedText}`}>{f.company || "—"}</div>
                          </td>
                          <td className={`p-3.5 text-xs ${dark ? "text-slate-200" : "text-slate-800"}`}>{f.type}</td>
                          <td className={`p-3.5 text-xs font-mono ${dark ? "text-slate-200" : "text-slate-800"}`}>
                            {new Date(f.followup_date).toLocaleDateString()}{" "}
                            <span className={mutedText}>{f.followup_time || ""}</span>
                          </td>
                          <td className={`p-3.5 text-xs ${dark ? "text-slate-200" : "text-slate-800"}`}>{f.assigned_to || "Team"}</td>
                          <td className="p-3.5">
                            <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-400">
                              {f.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {filteredFollowups.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-10 text-center text-xs text-slate-400">
                            No follow-ups recorded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: CLIENTS */}
          {page === "clients" && (
            <div className="space-y-6 max-w-[1600px] mx-auto w-full">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredClients.map((client) => (
                  <div
                    key={client.id}
                    className={`rounded-3xl border p-5 transition-all hover:-translate-y-1 hover:border-indigo-500/40 hover:shadow-xl ${bgCard}`}
                  >
                    <div className={`font-bold text-sm ${dark ? "text-white" : "text-slate-900"}`}>{client.company || client.name}</div>
                    <div className={`text-xs mt-0.5 ${mutedText}`}>{client.name}</div>

                    <div className={`mt-4 space-y-1.5 text-xs ${mutedText}`}>
                      <div className="flex items-center gap-2">
                        <Phone size={13} className="text-indigo-400" />
                        <span>{client.phone || "No phone"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail size={13} className="text-indigo-400" />
                        <span className="truncate">{client.email || "No email"}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-inherit text-[11px] font-mono text-slate-400">
                      GSTIN: {client.gst_number || "Unregistered"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* LEAD DETAIL MODAL */}
      <AnimatePresence>
        {selectedLead && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedLead(null)}
            />
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className={`relative h-full w-full max-w-md border-l p-6 overflow-y-auto ${bgCard} shadow-2xl z-10`}
            >
              <div className="flex items-center justify-between border-b border-inherit pb-4">
                <h3 className="font-bold text-base">Lead Information</h3>
                <button onClick={() => setSelectedLead(null)} className="text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="mt-5 space-y-4 text-xs">
                <div>
                  <span className={`block uppercase font-bold text-[10px] ${mutedText}`}>Full Name</span>
                  <div className="text-sm font-bold mt-0.5">{selectedLead.full_name}</div>
                </div>

                <div>
                  <span className={`block uppercase font-bold text-[10px] ${mutedText}`}>Company</span>
                  <div className="text-sm mt-0.5">{selectedLead.company || "—"}</div>
                </div>

                <div>
                  <span className={`block uppercase font-bold text-[10px] ${mutedText}`}>Contact Info</span>
                  <div className="mt-1 space-y-1">
                    <div>{selectedLead.phone || "No phone"}</div>
                    <div>{selectedLead.email || "No email"}</div>
                  </div>
                </div>

                <div>
                  <span className={`block uppercase font-bold text-[10px] ${mutedText}`}>Lead Source</span>
                  <div className="mt-0.5 font-semibold text-indigo-400">{selectedLead.source}</div>
                </div>

                <div>
                  <span className={`block uppercase font-bold text-[10px] ${mutedText}`}>Notes</span>
                  <div className="mt-1 p-3 rounded-xl bg-white/5 border border-inherit leading-relaxed">
                    {selectedLead.notes || "No notes logged."}
                  </div>
                </div>

                <div className="pt-4 flex gap-2">
                  {selectedLead.phone && (
                    <a
                      href={`tel:${selectedLead.phone}`}
                      className="flex-1 h-9 rounded-xl bg-indigo-600 text-white font-semibold flex items-center justify-center gap-1.5 shadow"
                    >
                      <Phone size={14} />
                      Call Lead
                    </a>
                  )}
                  {selectedLead.email && (
                    <a
                      href={`mailto:${selectedLead.email}`}
                      className="flex-1 h-9 rounded-xl border border-inherit text-white font-semibold flex items-center justify-center gap-1.5 hover:bg-white/5"
                    >
                      <Mail size={14} />
                      Email
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
