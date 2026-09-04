import React, { useEffect, useState } from "react";
import { Printer, CheckCircle2, Shield, Calendar, ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";

interface ScopeOfWork {
  id: string;
  sow_number: string;
  client_name: string;
  project_name: string;
  template_name: string;
  rendered_document: string;
  project_value: number;
  payment_terms: string;
  timeline_weeks: number;
  status: string;
  prepared_by_name: string;
  created_at: string;
}

export default function PublicSowViewer({ token, onBack }: { token: string; onBack?: () => void }) {
  const [sow, setSow] = useState<ScopeOfWork | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSow = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:5000/api/sows/share/${token}`);
        const data = await response.json();
        if (!response.ok || !data.data) {
          throw new Error(data.message || "Invalid or expired document link");
        }
        setSow(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load document");
      } finally {
        setLoading(false);
      }
    };
    void fetchSow();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-white flex flex-col items-center justify-center p-4">
        <RefreshCw size={28} className="animate-spin text-[#cca45f] mb-3" />
        <p className="text-sm text-slate-400">Loading Scope of Work document...</p>
      </div>
    );
  }

  if (error || !sow) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl border border-rose-500/20 bg-[#161b22] p-8 text-center shadow-2xl">
          <AlertCircle size={36} className="text-rose-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold">Document Unavailable</h2>
          <p className="text-xs text-slate-400 mt-2">{error || "This document link is invalid or expired."}</p>
          {onBack && (
            <button
              onClick={onBack}
              className="mt-6 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold"
            >
              Return
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-200 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[840px] mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#171f30] border border-[#222d42] text-[#cca45f] font-bold flex items-center justify-center text-sm shadow-md">
              Z
            </div>
            <div>
              <div className="font-bold text-sm text-white flex items-center gap-1.5">
                ZootechX<span className="text-[#cca45f]">.ai</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono tracking-wider">
                OFFSHORE ENGINEERING & CLOUD SOLUTIONS
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="h-9 px-4 rounded-xl bg-[#cca45f] text-black hover:bg-[#d8b26e] text-xs font-bold flex items-center gap-2 transition shadow-md"
            >
              <Printer size={14} />
              <span>Print / Download PDF</span>
            </button>
          </div>
        </div>

        {/* Document Card */}
        <div className="rounded-3xl border border-[#222d42] bg-[#111622] p-6 sm:p-10 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#222d42] gap-4">
            <div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#cca45f]/10 text-[#cca45f] border border-[#cca45f]/30">
                {sow.sow_number}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-white mt-2">
                {sow.project_name}
              </h1>
              <p className="text-xs text-slate-400 mt-1">Prepared for {sow.client_name}</p>
            </div>

            <div className="sm:text-right">
              <div className="text-xl font-bold mono text-emerald-400">
                ₹{Number(sow.project_value).toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Timeline: {sow.timeline_weeks} Weeks</div>
            </div>
          </div>

          {/* Rendered Markdown Body */}
          <div className="p-6 rounded-2xl bg-[#0a0d14] border border-[#1c2438] text-xs leading-relaxed text-slate-300 font-sans whitespace-pre-wrap">
            {sow.rendered_document}
          </div>

          {/* Verification Footer */}
          <div className="pt-6 border-t border-[#222d42] flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
            <div className="flex items-center gap-2">
              <Shield size={15} className="text-[#cca45f]" />
              <span>Certified ZootechX Engagement Agreement</span>
            </div>
            <div className="font-mono text-[11px]">
              Document Verified · Ref: {sow.sow_number}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
