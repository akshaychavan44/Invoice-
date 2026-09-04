import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldAlert, RefreshCw, Search, Clock, User, CheckCircle2,
  FileText, KeyRound, UserCheck, AlertTriangle
} from "lucide-react";
import { apiFetch } from "../lib/api";

export interface AuditLogEntry {
  id: string;
  action: string;
  entity: string;
  entity_id: string;
  details: string;
  user_id: string;
  user_name: string;
  created_at: string;
}

const actionColors: Record<string, { bg: string; text: string }> = {
  USER_CREATED: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
  USER_UPDATED: { bg: "bg-blue-500/10", text: "text-blue-400" },
  USER_DELETED: { bg: "bg-rose-500/10", text: "text-rose-400" },
  PASSWORD_RESET: { bg: "bg-amber-500/10", text: "text-amber-400" },
  SOW_CREATED: { bg: "bg-purple-500/10", text: "text-purple-400" },
  SOW_APPROVED: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
  INVOICE_CREATED: { bg: "bg-indigo-500/10", text: "text-indigo-400" },
  PAYMENT_RECORDED: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
  DAILY_UPDATE: { bg: "bg-sky-500/10", text: "text-sky-400" },
  TASK_CREATED: { bg: "bg-cyan-500/10", text: "text-cyan-400" },
  SYSTEM_INITIALIZED: { bg: "bg-amber-500/10", text: "text-amber-400" },
};

export default function AuditLogsViewer({ dark = true }: { dark?: boolean }) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [filterEntity, setFilterEntity] = useState("ALL");

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/audit-logs");
      const data = await res.json();
      if (res.ok) setLogs(data.data || []);
    } catch {
      // Offline fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLogs();
  }, []);

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      const matchesEntity = filterEntity === "ALL" || log.entity === filterEntity;
      const matchesQuery =
        log.action.toLowerCase().includes(query.toLowerCase()) ||
        log.details.toLowerCase().includes(query.toLowerCase()) ||
        log.user_name.toLowerCase().includes(query.toLowerCase());
      return matchesEntity && matchesQuery;
    });
  }, [logs, filterEntity, query]);

  // Styling Tokens
  const cardBg = dark ? "bg-[#111622] border-[#222d42]" : "bg-white border-[#eee6da]";
  const muted = dark ? "text-[#94a3b8]" : "text-[#78716c]";
  const inputBg = dark
    ? "bg-[#171f30] border-[#222d42] text-[#f1f5f9] placeholder:text-[#64748b]"
    : "bg-[#fbf8f3] border-[#e8dfd1] text-[#1c1917] placeholder:text-[#a8a29e]";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold tracking-tight ${dark ? "text-white" : "text-[#1c1917]"}`}>
            System Audit Log & Activity Trail
          </h1>
          <p className={`text-xs mt-1 ${muted}`}>
            Immutable ledger of administrative actions, compliance records, and employee changes
          </p>
        </div>
        <button
          onClick={loadLogs}
          disabled={loading}
          className={`h-10 px-4 rounded-xl border flex items-center gap-2 text-xs font-semibold transition ${
            dark ? "border-[#222d42] hover:bg-white/5 text-[#cca45f]" : "border-[#eee6da] hover:bg-black/5 text-[#a07432]"
          }`}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Refresh Trail</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className={`rounded-2xl border p-3.5 flex flex-col sm:flex-row gap-3 items-center justify-between ${cardBg}`}>
        <div className="relative w-full sm:w-80">
          <Search size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${muted}`} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search audit trail..."
            className={`h-9 w-full rounded-xl border pl-9 pr-3 text-xs outline-none ${inputBg}`}
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {["ALL", "USER", "SOW", "INVOICE", "DEVELOPER", "TASK", "SYSTEM"].map((ent) => (
            <button
              key={ent}
              onClick={() => setFilterEntity(ent)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap transition ${
                filterEntity === ent
                  ? dark
                    ? "bg-[#cca45f] text-black shadow-sm font-bold"
                    : "bg-[#a07432] text-white shadow-sm font-bold"
                  : `${muted} hover:bg-white/5`
              }`}
            >
              {ent === "ALL" ? "All Entities" : ent}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className={`rounded-2xl border overflow-hidden ${cardBg} shadow-sm`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left text-xs">
            <thead className={`border-b ${dark ? "bg-[#171f30]/60 border-[#222d42]" : "bg-[#f5eddf]/50 border-[#eee6da]"} ${muted} uppercase tracking-wider text-[10px]`}>
              <tr>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Action</th>
                <th className="p-3.5">Entity</th>
                <th className="p-3.5">Operator</th>
                <th className="p-3.5">Details & Description</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${dark ? "divide-[#222d42]" : "divide-[#eee6da]"}`}>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className={`p-12 text-center text-xs ${muted}`}>
                    No audit records found matching your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => {
                  const style = actionColors[log.action] || { bg: "bg-slate-500/10", text: "text-slate-400" };
                  return (
                    <tr key={log.id} className={`hover:${dark ? "bg-white/[0.02]" : "bg-black/[0.01]"}`}>
                      <td className={`p-3.5 whitespace-nowrap text-[11px] mono ${muted}`}>
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} />
                          <span>{new Date(log.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${style.bg} ${style.text}`}>
                          {log.action.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-3.5 font-semibold text-[11px]">
                        <span className={dark ? "text-slate-300" : "text-slate-700"}>{log.entity}</span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 font-medium">
                          <User size={12} className={muted} />
                          <span className={dark ? "text-[#f1f5f9]" : "text-[#1c1917]"}>{log.user_name}</span>
                        </div>
                      </td>
                      <td className={`p-3.5 text-xs ${dark ? "text-[#cbd5e1]" : "text-[#44403c]"}`}>
                        {log.details}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
