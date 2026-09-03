import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, CreditCard, Calculator, Users,
  BellRing, Briefcase, Plus, RefreshCw,
  Search, ShieldCheck, Sun, Moon, LogOut, CheckCircle2, AlertCircle, X
} from "lucide-react";
import { apiFetch } from "../lib/api";
import DeveloperWorkspace from "./DeveloperWorkspace";

interface SubAdminDashboardProps {
  onLogout: () => void;
  dark?: boolean;
  onToggleTheme?: () => void;
}

type Client = { id: string; name: string; company: string | null; phone: string | null; email?: string | null };
type Invoice = { id: string; invoice_number: string; total: string | number; paid_amount: string | number; client_name: string; due_date?: string };
type Expense = { id: string; title: string; category: string; amount: string | number; expense_date?: string; payment_method?: string };
type Payment = { id: string; invoice_number: string; amount: string | number; method: string };
type Lead = { id: string; full_name: string; company: string | null; email: string | null; phone: string | null; status: string };
type Followup = { id: string; lead_name: string; type: string; followup_date: string; followup_time: string | null; status: string };

export default function SubAdminDashboard({ onLogout, dark: propDark, onToggleTheme }: SubAdminDashboardProps) {
  const [page, setPage] = useState<"invoices" | "expenses" | "leads" | "clients" | "developers">("invoices");
  const [dark, setDark] = useState<boolean>(() => {
    if (propDark !== undefined) return propDark;
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("zootechx_theme");
      if (saved) return saved === "dark";
    }
    return true;
  });

  useEffect(() => {
    if (propDark !== undefined) {
      setDark(propDark);
    }
  }, [propDark]);

  const handleToggleTheme = () => {
    const nextDark = !dark;
    setDark(nextDark);
    if (typeof window !== "undefined") {
      localStorage.setItem("zootechx_theme", nextDark ? "dark" : "light");
      if (nextDark) {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
      }
    }
    if (onToggleTheme) {
      onToggleTheme();
    }
  };

  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3000);
    return () => clearTimeout(timer);
  }, [notice]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // Data
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [followups, setFollowups] = useState<Followup[]>([]);

  // Sub-view forms
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);

  const [clientForm, setClientForm] = useState({ name: "", company: "", phone: "", email: "" });
  const [invoiceForm, setInvoiceForm] = useState({
    invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
    clientId: "",
    total: "",
    paidAmount: "0",
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  });
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    category: "Operations",
    amount: "",
    expenseDate: new Date().toISOString().slice(0, 10),
    paymentMethod: "UPI",
    description: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const results = await Promise.all([
        apiFetch("/api/clients"),
        apiFetch("/api/invoices"),
        apiFetch("/api/expenses"),
        apiFetch("/api/payments"),
        apiFetch("/api/leads"),
        apiFetch("/api/followups"),
      ]);
      const data = await Promise.all(results.map((r) => r.json()));
      if (results[0].ok) setClients(data[0].data ?? []);
      if (results[1].ok) setInvoices(data[1].data ?? []);
      if (results[2].ok) setExpenses(data[2].data ?? []);
      if (results[3].ok) setPayments(data[3].data ?? []);
      if (results[4].ok) setLeads(data[4].data ?? []);
      if (results[5].ok) setFollowups(data[5].data ?? []);
    } catch {
      setNotice("Unable to load shared records. Working in offline mode.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(), 12000);
    return () => window.clearInterval(interval);
  }, []);

  const saveRecord = async (path: string, body: unknown, onSuccess: () => void) => {
    setSaving(true);
    setNotice("");
    try {
      const response = await apiFetch(path, {
        method: "POST",
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to save record");
      onSuccess();
      setNotice("Record successfully saved.");
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to save record");
    } finally {
      setSaving(false);
    }
  };

  // Summary Metrics
  const totalBilled = useMemo(() => invoices.reduce((s, i) => s + Number(i.total || 0), 0), [invoices]);
  const totalPaid = useMemo(() => invoices.reduce((s, i) => s + Number(i.paid_amount || 0), 0), [invoices]);
  const totalExpenses = useMemo(() => expenses.reduce((s, e) => s + Number(e.amount || 0), 0), [expenses]);

  // Design Tokens
  const bgMain = dark ? "bg-[#090d16] text-[#f1f5f9]" : "bg-slate-50 text-slate-900";
  const bgSidebar = dark ? "bg-[#101422] border-white/10" : "bg-white border-slate-200";
  const bgCard = dark ? "bg-[#141828]/90 border-white/10 text-white" : "bg-white border-slate-200 text-slate-900";
  const inputBg = dark ? "bg-[#1c2236] border-white/10 text-white placeholder-slate-400" : "bg-white border-slate-200 text-slate-900 placeholder-slate-400";
  const mutedText = dark ? "text-slate-400" : "text-slate-500";

  if (page === "developers") {
    return <DeveloperWorkspace admin dark={dark} onBack={() => setPage("invoices")} onToggleTheme={handleToggleTheme} />;
  }

  type SubAdminNavLink = {
    id: "invoices" | "expenses" | "leads" | "clients" | "developers";
    label: string;
    icon: React.ComponentType<any>;
    badge?: number;
  };

  const navLinks: SubAdminNavLink[] = [
    { id: "invoices", label: "Invoices & Billing", icon: FileText, badge: invoices.length },
    { id: "expenses", label: "Expenses", icon: Calculator, badge: expenses.length },
    { id: "leads", label: "Shared Leads & Follow-ups", icon: Users, badge: leads.length },
    { id: "clients", label: "Client Directory", icon: Briefcase, badge: clients.length },
    { id: "developers", label: "Developers & Projects", icon: Briefcase },
  ];

  return (
    <div className={`luxury-app ${dark ? "dark-theme" : "light-theme"} h-screen w-full overflow-hidden flex flex-row ${bgMain} font-sans antialiased transition-colors duration-200`}>
      {/* SIDEBAR */}
      <aside className={`w-[260px] shrink-0 hidden md:flex flex-col border-r ${bgSidebar} h-screen z-20`}>
        {/* Brand */}
        <div className="p-5 border-b border-inherit flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-base shadow-lg shadow-indigo-500/25">
            Z
          </div>
          <div>
            <div className="font-bold text-[14px] leading-tight flex items-center gap-1.5">
              ZootechX.ai
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="text-[11px] text-indigo-400 font-mono font-medium">Sub-Admin Portal</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {navLinks.map((item) => {
            const active = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id as any)}
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

        {/* Footer actions */}
        <div className="p-4 border-t border-inherit space-y-2">
          <button
            onClick={handleToggleTheme}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
              dark ? "bg-white/5 text-slate-300 hover:bg-white/10" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {dark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-indigo-600" />}
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
              {page === "invoices"
                ? "Invoices & Revenue"
                : page === "expenses"
                ? "Company Expenses"
                : page === "leads"
                ? "Leads & Follow-ups"
                : page === "clients"
                ? "Clients Directory"
                : "Developers & Projects"}
            </h2>
            <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 text-[10px] font-bold text-indigo-400">
              Sub-Admin Elevated
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleTheme}
              title={dark ? "Switch to light theme" : "Switch to dark theme"}
              aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
              className={`h-9 w-9 rounded-xl border flex items-center justify-center transition-all ${
                dark ? "border-white/10 bg-white/5 text-amber-400 hover:bg-white/10" : "border-slate-200 bg-white text-indigo-600 hover:bg-slate-50"
              }`}
            >
              {dark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <button
              onClick={() => void load()}
              title="Refresh"
              className={`p-2 rounded-xl border transition ${
                dark ? "border-white/10 text-slate-400 hover:text-white hover:bg-white/5" : "border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <RefreshCw size={15} className={loading ? "animate-spin text-indigo-400" : ""} />
            </button>

            {/* Mobile Tab Icons */}
            <div className="flex md:hidden items-center gap-1">
              {navLinks.map((it) => (
                <button
                  key={it.id}
                  onClick={() => setPage(it.id as any)}
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

        {/* CONTENT */}
        <main className={`flex-1 h-full overflow-y-auto p-6 lg:p-8 space-y-6 ${bgMain}`}>
          {notice && (
            <div className="flex items-center justify-between rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 text-xs font-semibold text-indigo-300">
              <div className="flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{notice}</span>
              </div>
              <button onClick={() => setNotice("")} className="opacity-70 hover:opacity-100">
                <X size={14} />
              </button>
            </div>
          )}

          {/* TAB: INVOICES */}
          {page === "invoices" && (
            <div className="space-y-6 max-w-[1600px] mx-auto w-full">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-xl font-bold ${dark ? "text-white" : "text-slate-900"}`}>Invoices & Billing</h3>
                  <p className={`text-xs mt-1 ${mutedText}`}>Manage company billing and client payment records.</p>
                </div>
                <button
                  onClick={() => setShowAddInvoiceModal(true)}
                  className="flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-xs font-semibold text-white shadow hover:bg-indigo-700"
                >
                  <Plus size={16} />
                  <span>Create Invoice</span>
                </button>
              </div>

              <div className={`overflow-hidden rounded-3xl border ${bgCard} shadow-sm`}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px]">
                    <thead className={`border-b border-inherit ${dark ? "bg-white/5 text-slate-400" : "bg-slate-100 text-slate-600"} text-[11px] uppercase tracking-wider font-bold`}>
                      <tr>
                        <th className="p-3.5 text-left">Invoice No</th>
                        <th className="p-3.5 text-left">Client Name</th>
                        <th className="p-3.5 text-right">Total Amount</th>
                        <th className="p-3.5 text-right">Paid Amount</th>
                        <th className="p-3.5 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y border-inherit">
                      {invoices.map((inv) => {
                        const isPaid = Number(inv.paid_amount) >= Number(inv.total);
                        return (
                          <tr key={inv.id} className={`hover:${dark ? "bg-white/5" : "bg-slate-50"} transition`}>
                            <td className={`p-3.5 text-xs font-mono font-semibold ${dark ? "text-white" : "text-slate-900"}`}>{inv.invoice_number}</td>
                            <td className={`p-3.5 text-xs font-medium ${dark ? "text-slate-200" : "text-slate-800"}`}>{inv.client_name}</td>
                            <td className={`p-3.5 text-xs font-mono font-bold text-right ${dark ? "text-white" : "text-slate-900"}`}>
                              ₹{Number(inv.total).toLocaleString()}
                            </td>
                            <td className="p-3.5 text-xs font-mono text-right text-emerald-400">
                              ₹{Number(inv.paid_amount).toLocaleString()}
                            </td>
                            <td className="p-3.5">
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                                  isPaid
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                }`}
                              >
                                {isPaid ? "Paid in Full" : "Pending Balance"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EXPENSES */}
          {page === "expenses" && (
            <div className="space-y-6 max-w-[1600px] mx-auto w-full">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-xl font-bold ${dark ? "text-white" : "text-slate-900"}`}>Company Expenses</h3>
                  <p className={`text-xs mt-1 ${mutedText}`}>Track operating costs and internal cash outflows.</p>
                </div>
                <button
                  onClick={() => setShowAddExpenseModal(true)}
                  className="flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-xs font-semibold text-white shadow hover:bg-indigo-700"
                >
                  <Plus size={16} />
                  <span>Log Expense</span>
                </button>
              </div>

              <div className={`overflow-hidden rounded-3xl border ${bgCard} shadow-sm`}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px]">
                    <thead className={`border-b border-inherit ${dark ? "bg-white/5 text-slate-400" : "bg-slate-100 text-slate-600"} text-[11px] uppercase tracking-wider font-bold`}>
                      <tr>
                        <th className="p-3.5 text-left">Expense Title</th>
                        <th className="p-3.5 text-left">Category</th>
                        <th className="p-3.5 text-left">Payment Method</th>
                        <th className="p-3.5 text-left">Date</th>
                        <th className="p-3.5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y border-inherit">
                      {expenses.map((e) => (
                        <tr key={e.id} className={`hover:${dark ? "bg-white/5" : "bg-slate-50"} transition`}>
                          <td className={`p-3.5 text-xs font-semibold ${dark ? "text-white" : "text-slate-900"}`}>{e.title}</td>
                          <td className={`p-3.5 text-xs ${dark ? "text-slate-200" : "text-slate-800"}`}>{e.category}</td>
                          <td className={`p-3.5 text-xs ${dark ? "text-slate-200" : "text-slate-800"}`}>{e.payment_method || "UPI"}</td>
                          <td className={`p-3.5 text-xs font-mono ${dark ? "text-slate-200" : "text-slate-800"}`}>
                            {e.expense_date ? new Date(e.expense_date).toLocaleDateString() : "—"}
                          </td>
                          <td className="p-3.5 text-xs font-mono font-bold text-right text-amber-400">
                            ₹{Number(e.amount).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SHARED LEADS & FOLLOW-UPS */}
          {page === "leads" && (
            <div className="space-y-6 max-w-[1600px] mx-auto w-full">
              <h3 className={`text-xl font-bold ${dark ? "text-white" : "text-slate-900"}`}>Shared Leads & Follow-ups Queue</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className={`rounded-3xl border p-5 ${bgCard}`}>
                  <h4 className={`font-bold text-sm mb-3 ${dark ? "text-white" : "text-slate-900"}`}>Recent Leads</h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {leads.map((l) => (
                      <div key={l.id} className={`p-3 rounded-2xl ${dark ? "bg-white/5" : "bg-slate-100"} text-xs flex justify-between items-center`}>
                        <div>
                          <div className={`font-bold ${dark ? "text-white" : "text-slate-900"}`}>{l.full_name}</div>
                          <div className={mutedText}>{l.company || l.phone}</div>
                        </div>
                        <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 text-[10px] font-bold text-indigo-400">
                          {l.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`rounded-3xl border p-5 ${bgCard}`}>
                  <h4 className={`font-bold text-sm mb-3 ${dark ? "text-white" : "text-slate-900"}`}>Follow-up Schedule</h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {followups.map((f) => (
                      <div key={f.id} className={`p-3 rounded-2xl ${dark ? "bg-white/5" : "bg-slate-100"} text-xs flex justify-between items-center`}>
                        <div>
                          <div className={`font-bold ${dark ? "text-white" : "text-slate-900"}`}>{f.lead_name}</div>
                          <div className={`font-mono ${mutedText}`}>
                            {f.type} • {f.followup_date}
                          </div>
                        </div>
                        <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-400">
                          {f.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CLIENTS */}
          {page === "clients" && (
            <div className="space-y-6 max-w-[1600px] mx-auto w-full">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-xl font-bold ${dark ? "text-white" : "text-slate-900"}`}>Client Directory</h3>
                  <p className={`text-xs mt-1 ${mutedText}`}>Registered businesses and customer accounts.</p>
                </div>
                <button
                  onClick={() => setShowAddClientModal(true)}
                  className="flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-xs font-semibold text-white shadow hover:bg-indigo-700"
                >
                  <Plus size={16} />
                  <span>Add Client</span>
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {clients.map((c) => (
                  <div key={c.id} className={`rounded-3xl border p-5 ${bgCard}`}>
                    <div className={`font-bold text-sm ${dark ? "text-white" : "text-slate-900"}`}>{c.company || c.name}</div>
                    <div className={`text-xs mt-0.5 ${mutedText}`}>{c.name}</div>
                    <div className={`mt-3 text-xs ${mutedText}`}>Phone: {c.phone || "—"}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* MODAL: ADD INVOICE */}
      <AnimatePresence>
        {showAddInvoiceModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setShowAddInvoiceModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className={`relative w-full max-w-lg rounded-3xl border p-6 shadow-2xl ${bgCard}`}>
              <div className="flex items-center justify-between mb-4 border-b border-inherit pb-3">
                <h3 className="font-bold text-base">Create Invoice</h3>
                <button onClick={() => setShowAddInvoiceModal(false)} className="text-slate-400 hover:text-white"><X size={18}/></button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void saveRecord(
                    "/api/invoices",
                    {
                      invoiceNumber: invoiceForm.invoiceNumber,
                      clientId: invoiceForm.clientId,
                      total: Number(invoiceForm.total),
                      paidAmount: Number(invoiceForm.paidAmount),
                      dueDate: new Date(invoiceForm.dueDate).toISOString(),
                    },
                    () => setShowAddInvoiceModal(false)
                  );
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-xs font-semibold mb-1">Invoice Number</label>
                  <input required value={invoiceForm.invoiceNumber} onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })} className={`h-10 w-full rounded-xl border px-3 text-xs outline-none ${inputBg}`} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Select Client *</label>
                  <select required value={invoiceForm.clientId} onChange={(e) => setInvoiceForm({ ...invoiceForm, clientId: e.target.value })} className={`h-10 w-full rounded-xl border px-3 text-xs outline-none ${inputBg}`}>
                    <option value="">Choose client...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company || c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Total (₹) *</label>
                    <input required min="1" type="number" value={invoiceForm.total} onChange={(e) => setInvoiceForm({ ...invoiceForm, total: e.target.value })} className={`h-10 w-full rounded-xl border px-3 text-xs outline-none ${inputBg}`} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Amount Paid (₹)</label>
                    <input min="0" type="number" value={invoiceForm.paidAmount} onChange={(e) => setInvoiceForm({ ...invoiceForm, paidAmount: e.target.value })} className={`h-10 w-full rounded-xl border px-3 text-xs outline-none ${inputBg}`} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Due Date</label>
                  <input required type="date" value={invoiceForm.dueDate} onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })} className={`h-10 w-full rounded-xl border px-3 text-xs outline-none ${inputBg}`} />
                </div>
                <div className="pt-3 flex justify-end gap-2">
                  <button type="button" onClick={() => setShowAddInvoiceModal(false)} className="h-9 px-4 rounded-xl border border-inherit text-xs font-semibold">Cancel</button>
                  <button type="submit" disabled={saving || clients.length === 0} className="h-9 px-5 rounded-xl bg-indigo-600 text-xs font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-50">
                    {saving ? "Saving..." : "Create Invoice"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: RECORD EXPENSE */}
      <AnimatePresence>
        {showAddExpenseModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setShowAddExpenseModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className={`relative w-full max-w-lg rounded-3xl border p-6 shadow-2xl ${bgCard}`}>
              <div className="flex items-center justify-between mb-4 border-b border-inherit pb-3">
                <h3 className="font-bold text-base">Record Expense</h3>
                <button onClick={() => setShowAddExpenseModal(false)} className="text-slate-400 hover:text-white"><X size={18}/></button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void saveRecord(
                    "/api/expenses",
                    {
                      ...expenseForm,
                      amount: Number(expenseForm.amount),
                    },
                    () => setShowAddExpenseModal(false)
                  );
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-xs font-semibold mb-1">Expense Title *</label>
                  <input required value={expenseForm.title} onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })} placeholder="e.g. AWS Server Hosting" className={`h-10 w-full rounded-xl border px-3 text-xs outline-none ${inputBg}`} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Category</label>
                    <input required value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })} placeholder="Hosting, Office, Salary..." className={`h-10 w-full rounded-xl border px-3 text-xs outline-none ${inputBg}`} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Amount (₹) *</label>
                    <input required min="1" type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} className={`h-10 w-full rounded-xl border px-3 text-xs outline-none ${inputBg}`} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Payment Method</label>
                    <select value={expenseForm.paymentMethod} onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })} className={`h-10 w-full rounded-xl border px-3 text-xs outline-none ${inputBg}`}>
                      <option>UPI</option>
                      <option>Bank Transfer</option>
                      <option>Credit Card</option>
                      <option>Cash</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Expense Date</label>
                    <input required type="date" value={expenseForm.expenseDate} onChange={(e) => setExpenseForm({ ...expenseForm, expenseDate: e.target.value })} className={`h-10 w-full rounded-xl border px-3 text-xs outline-none ${inputBg}`} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Notes (Optional)</label>
                  <textarea rows={2} value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} placeholder="Additional notes..." className={`w-full rounded-xl border p-2.5 text-xs outline-none ${inputBg}`} />
                </div>
                <div className="pt-3 flex justify-end gap-2">
                  <button type="button" onClick={() => setShowAddExpenseModal(false)} className="h-9 px-4 rounded-xl border border-inherit text-xs font-semibold">Cancel</button>
                  <button type="submit" disabled={saving} className="h-9 px-5 rounded-xl bg-indigo-600 text-xs font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-50">
                    {saving ? "Saving..." : "Save Expense"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: ADD CLIENT */}
      <AnimatePresence>
        {showAddClientModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setShowAddClientModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className={`relative w-full max-w-lg rounded-3xl border p-6 shadow-2xl ${bgCard}`}>
              <div className="flex items-center justify-between mb-4 border-b border-inherit pb-3">
                <h3 className="font-bold text-base">Add Client</h3>
                <button onClick={() => setShowAddClientModal(false)} className="text-slate-400 hover:text-white"><X size={18}/></button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void saveRecord(
                    "/api/clients",
                    {
                      name: clientForm.name,
                      company: clientForm.company || undefined,
                      phone: clientForm.phone,
                      email: clientForm.email || undefined,
                    },
                    () => setShowAddClientModal(false)
                  );
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-xs font-semibold mb-1">Contact Name *</label>
                  <input required value={clientForm.name} onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })} placeholder="e.g. Vikram Singhal" className={`h-10 w-full rounded-xl border px-3 text-xs outline-none ${inputBg}`} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Company / Business Name</label>
                  <input value={clientForm.company} onChange={(e) => setClientForm({ ...clientForm, company: e.target.value })} placeholder="e.g. Apex Innovations Ltd" className={`h-10 w-full rounded-xl border px-3 text-xs outline-none ${inputBg}`} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Phone *</label>
                    <input required value={clientForm.phone} onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })} placeholder="+91 98765 43210" className={`h-10 w-full rounded-xl border px-3 text-xs outline-none ${inputBg}`} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Email</label>
                    <input type="email" value={clientForm.email} onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })} placeholder="client@domain.com" className={`h-10 w-full rounded-xl border px-3 text-xs outline-none ${inputBg}`} />
                  </div>
                </div>
                <div className="pt-3 flex justify-end gap-2">
                  <button type="button" onClick={() => setShowAddClientModal(false)} className="h-9 px-4 rounded-xl border border-inherit text-xs font-semibold">Cancel</button>
                  <button type="submit" disabled={saving} className="h-9 px-5 rounded-xl bg-indigo-600 text-xs font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-50">
                    {saving ? "Saving..." : "Add Client"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
