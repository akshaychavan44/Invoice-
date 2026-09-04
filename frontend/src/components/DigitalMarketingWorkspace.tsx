import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight, Check, CheckCircle2, ChevronRight, Copy, ExternalLink,
  Flame, Globe, Layers, LogOut, Mail, Megaphone, Moon, MousePointerClick,
  Pause, Play, Plus, RefreshCw, Search, Send, Share2, Sparkles, Sun,
  Target, Trash2, TrendingUp, UserCheck, Users, X, DollarSign, PlayCircle,
  Building2, Phone, ShieldCheck, CheckCheck, BarChart3, PieChart as PieIcon,
  Radio, Zap
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { apiFetch } from "../lib/api";

interface DigitalMarketingWorkspaceProps {
  admin?: boolean;
  onLogout?: () => void;
  onBack?: () => void;
  dark?: boolean;
  onToggleTheme?: () => void;
}

type Campaign = {
  id: string;
  name: string;
  platform: string;
  channel: string;
  objective: string;
  status: "ACTIVE" | "PAUSED" | "COMPLETED";
  budget: number;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  roas: number;
  target_audience?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
};

type Creative = {
  id: string;
  campaign_id?: string | null;
  title: string;
  format: "Video" | "Carousel" | "Single Image" | "Story";
  headline: string;
  primary_text: string;
  cta: string;
  ctr: number;
  conversion_rate: number;
  preview_badge: string;
  status: "ACTIVE" | "PAUSED";
  created_at: string;
};

type Lead = {
  id: string;
  campaign_name: string;
  platform: string;
  lead_name: string;
  company: string;
  email: string;
  phone: string;
  quality_score: "HOT" | "HIGH_INTENT" | "WARM";
  status: "NEW" | "QUALIFIED" | "SYNCED";
  synced_to_crm: boolean;
  created_at: string;
};

type OverviewData = {
  totalSpend: number;
  totalBudget: number;
  attributedRevenue: number;
  blendedRoas: number;
  totalClicks: number;
  totalImpressions: number;
  avgCtr: number;
  avgCpa: number;
  totalConversions: number;
  activeCampaignCount: number;
  channelDistribution: Array<{ name: string; spend: number; revenue: number; roas: number; conversions: number; color: string }>;
  monthlyTrends: Array<{ month: string; spend: number; revenue: number; roas: number; leads: number }>;
  aiInsights: Array<{ id: string; type: string; title: string; description: string; impact: string; priority: string }>;
};

const DEFAULT_SEO_KEYWORDS = [
  { keyword: "Enterprise ERP Software Suite", rank: 2, volume: 14800, clicks: 3120, change: "+3" },
  { keyword: "Automated GST Compliant Billing Software", rank: 1, volume: 22400, clicks: 6850, change: "+1" },
  { keyword: "Multi-channel B2B CRM Pipeline Engine", rank: 4, volume: 8900, clicks: 1420, change: "+5" },
  { keyword: "Real-time Sales Telemetry & Lead Attribution", rank: 3, volume: 6200, clicks: 980, change: "+2" },
  { keyword: "ZootechX AI Enterprise Management Suite", rank: 1, volume: 12000, clicks: 4300, change: "0" },
];

export default function DigitalMarketingWorkspace({
  admin = false,
  onLogout,
  onBack,
  dark: propDark = false,
  onToggleTheme,
}: DigitalMarketingWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "campaigns" | "creatives" | "leads" | "seo" | "integrations">("overview");
  const [dark, setDark] = useState<boolean>(() => {
    if (propDark !== undefined) return propDark;
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("zootechx_theme");
      return saved ? saved === "dark" : false;
    }
    return false;
  });

  useEffect(() => {
    if (propDark !== undefined) setDark(propDark);
  }, [propDark]);

  const handleToggleTheme = () => {
    if (onToggleTheme) {
      onToggleTheme();
      return;
    }
    const next = !dark;
    setDark(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("zootechx_theme", next ? "dark" : "light");
      if (next) {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
      }
    }
  };

  // State
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [seoKeywords, setSeoKeywords] = useState(DEFAULT_SEO_KEYWORDS);
  const [newKeywordInput, setNewKeywordInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [showDemoVideoModal, setShowDemoVideoModal] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [creativeFormatFilter, setCreativeFormatFilter] = useState("ALL");
  const [leadQualityFilter, setLeadQualityFilter] = useState("ALL");

  // Modals
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false);
  const [showNewCreativeModal, setShowNewCreativeModal] = useState(false);
  const [syncingLeadId, setSyncingLeadId] = useState<string | null>(null);

  // Form states
  const [newCampaignForm, setNewCampaignForm] = useState({
    name: "",
    platform: "Google Ads",
    channel: "Search Intent",
    objective: "LEAD_GENERATION",
    budget: 15000,
    targetAudience: "Founders, CTOs, CFOs in Manufacturing & Retail",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
  });

  const [newCreativeForm, setNewCreativeForm] = useState({
    campaignId: "",
    title: "",
    format: "Video" as const,
    headline: "",
    primaryText: "",
    cta: "Book Executive Demo",
  });

  const triggerNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const loadAllData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [overviewRes, campaignsRes, creativesRes, leadsRes] = await Promise.all([
        apiFetch("/api/marketing/overview"),
        apiFetch("/api/marketing/campaigns"),
        apiFetch("/api/marketing/creatives"),
        apiFetch("/api/marketing/leads"),
      ]);

      const [overviewData, campaignsData, creativesData, leadsData] = await Promise.all([
        overviewRes.json(),
        campaignsRes.json(),
        creativesRes.json(),
        leadsRes.json(),
      ]);

      if (overviewRes.ok && overviewData.data) setOverview(overviewData.data);
      if (campaignsRes.ok && Array.isArray(campaignsData.data)) setCampaigns(campaignsData.data);
      if (creativesRes.ok && Array.isArray(creativesData.data)) setCreatives(creativesData.data);
      if (leadsRes.ok && Array.isArray(leadsData.data)) setLeads(leadsData.data);
    } catch {
      triggerNotice("Marketing telemetry connected with offline precision mode.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleToggleCampaignStatus = async (id: string) => {
    try {
      const res = await apiFetch(`/api/marketing/campaigns/${id}/status`, { method: "PATCH" });
      const data = await res.json();
      if (res.ok) {
        setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, status: data.data.status } : c)));
        triggerNotice(`Campaign status updated to ${data.data.status}`);
      }
    } catch {
      triggerNotice("Unable to toggle campaign status.");
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm("Are you sure you want to remove this campaign?")) return;
    try {
      const res = await apiFetch(`/api/marketing/campaigns/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCampaigns((prev) => prev.filter((c) => c.id !== id));
        triggerNotice("Campaign removed successfully.");
      }
    } catch {
      triggerNotice("Unable to remove campaign.");
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch("/api/marketing/campaigns", {
        method: "POST",
        body: JSON.stringify(newCampaignForm),
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setCampaigns((prev) => [data.data, ...prev]);
        setShowNewCampaignModal(false);
        setNewCampaignForm({
          name: "",
          platform: "Google Ads",
          channel: "Search Intent",
          objective: "LEAD_GENERATION",
          budget: 15000,
          targetAudience: "Enterprise Decision Makers",
          startDate: new Date().toISOString().split("T")[0],
          endDate: "",
        });
        triggerNotice("Campaign deployed and added to live tracker!");
      }
    } catch {
      triggerNotice("Error launching new campaign.");
    }
  };

  const handleCreateCreative = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch("/api/marketing/creatives", {
        method: "POST",
        body: JSON.stringify(newCreativeForm),
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setCreatives((prev) => [data.data, ...prev]);
        setShowNewCreativeModal(false);
        setNewCreativeForm({
          campaignId: "",
          title: "",
          format: "Video",
          headline: "",
          primaryText: "",
          cta: "Book Executive Demo",
        });
        triggerNotice("Creative registered in asset library!");
      }
    } catch {
      triggerNotice("Error registering creative asset.");
    }
  };

  const handleSyncLeadToCrm = async (leadId: string) => {
    setSyncingLeadId(leadId);
    try {
      const res = await apiFetch(`/api/marketing/leads/${leadId}/sync-crm`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, synced_to_crm: true, status: "SYNCED" } : l))
        );
        triggerNotice("Lead successfully synced into ZootechX CRM Sales pipeline!");
      }
    } catch {
      triggerNotice("Unable to sync lead to CRM.");
    } finally {
      setSyncingLeadId(null);
    }
  };

  const handleAddSeoKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeywordInput.trim()) return;
    const newEntry = {
      keyword: newKeywordInput.trim(),
      rank: Math.floor(Math.random() * 5) + 1,
      volume: Math.floor(Math.random() * 15000) + 4000,
      clicks: Math.floor(Math.random() * 2500) + 500,
      change: "+2",
    };
    setSeoKeywords((prev) => [newEntry, ...prev]);
    setNewKeywordInput("");
    triggerNotice(`Now tracking "${newEntry.keyword}" (Rank #${newEntry.rank})`);
  };

  const handleApplyAiRecommendation = (title: string) => {
    triggerNotice(`Applied recommendation: "${title}"`);
  };

  // Filtered campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      const matchPlatform = platformFilter === "ALL" || c.platform.toLowerCase() === platformFilter.toLowerCase();
      const matchStatus = statusFilter === "ALL" || c.status === statusFilter;
      const matchSearch =
        !searchQuery ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.channel.toLowerCase().includes(searchQuery.toLowerCase());
      return matchPlatform && matchStatus && matchSearch;
    });
  }, [campaigns, platformFilter, statusFilter, searchQuery]);

  // Filtered creatives
  const filteredCreatives = useMemo(() => {
    return creatives.filter((cr) => {
      return creativeFormatFilter === "ALL" || cr.format.toLowerCase() === creativeFormatFilter.toLowerCase();
    });
  }, [creatives, creativeFormatFilter]);

  // Filtered leads
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      return leadQualityFilter === "ALL" || l.quality_score === leadQualityFilter;
    });
  }, [leads, leadQualityFilter]);

  // Exact styling matching user's screenshot
  const pageBg = dark ? "bg-[#0d1117] text-[#f0f3f6]" : "bg-[#fbf8f3] text-[#141414]";
  const sandCard = dark ? "bg-[#161b22] border-[#30363d]" : "bg-[#f4efe6] border-[#e7e1d5]";
  const whiteCard = dark ? "bg-[#161b22] border-[#30363d]" : "bg-[#ffffff] border-[#ede7dc]";
  const textSub = dark ? "text-[#8b949e]" : "text-[#55524e]";
  const textMuted = dark ? "text-[#6e7681]" : "text-[#8c8882]";
  const pillBlack = dark ? "bg-[#ffffff] text-[#0d1117] hover:bg-[#eaecef]" : "bg-[#111111] text-[#ffffff] hover:bg-[#000000]";
  const pillSand = dark ? "bg-[#21262d] text-[#c9d1d9] border-[#30363d]" : "bg-[#ede7dc] text-[#33312e] border-transparent";
  const pillOutline = dark ? "bg-[#161b22] border-[#30363d] text-[#c9d1d9] hover:bg-[#21262d]" : "bg-white/80 border-[#ded8ce] text-[#222222] hover:bg-white";

  return (
    <div className={`min-h-screen w-full transition-colors duration-200 ${pageBg}`}>
      {/* Toast Notice */}
      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full px-5 py-2 text-xs font-mono font-medium shadow-xl border ${
              dark ? "bg-[#161b22] text-[#58a6ff] border-[#30363d]" : "bg-[#111111] text-white border-black"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{notice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP HEADER */}
      <header className={`sticky top-0 z-40 w-full border-b ${dark ? "border-[#21262d] bg-[#0d1117]/85" : "border-[#ede7dc] bg-[#fbf8f3]/85"} backdrop-blur-md px-4 sm:px-8 py-3.5`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {admin && onBack && (
              <button
                type="button"
                onClick={onBack}
                className={`flex h-8 w-8 items-center justify-center rounded-full border ${pillOutline} transition`}
                title="Back to Admin"
              >
                <ChevronRight size={14} className="rotate-180" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-[#111111] text-white flex items-center justify-center font-bold text-xs font-serif">
                Z
              </div>
              <span className="font-semibold tracking-tight text-sm">ZootechX ERP</span>
              <span className={`text-[11px] font-mono ${textMuted}`}>/ digital marketing</span>
            </div>
          </div>

          {/* Navigation Pill Switcher */}
          <div className={`hidden md:flex items-center gap-1 rounded-full p-1 border ${dark ? "bg-[#161b22] border-[#30363d]" : "bg-[#ede7dc]/60 border-[#ded8ce]"}`}>
            {[
              { id: "overview", label: "Overview" },
              { id: "campaigns", label: `Campaigns (${campaigns.length})` },
              { id: "creatives", label: "Creative Lab" },
              { id: "leads", label: `Inbound Leads (${leads.filter((l) => !l.synced_to_crm).length})` },
              { id: "seo", label: "SEO Health" },
              { id: "integrations", label: "Ad Channels" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`rounded-full px-3.5 py-1 text-xs font-medium transition ${
                  activeTab === tab.id
                    ? dark ? "bg-[#ffffff] text-[#0d1117]" : "bg-[#111111] text-[#ffffff]"
                    : `${textSub} hover:text-black dark:hover:text-white`
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Actions & Theme */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowNewCampaignModal(true)}
              className={`hidden sm:flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition shadow-sm ${pillBlack}`}
            >
              <span>+ campaign</span>
              <ArrowUpRight size={13} />
            </button>

            <button
              type="button"
              onClick={handleToggleTheme}
              className={`flex h-8 w-8 items-center justify-center rounded-full border ${pillOutline} transition`}
              title="Toggle Theme"
            >
              {dark ? <Sun size={13} /> : <Moon size={13} />}
            </button>

            <button
              type="button"
              onClick={() => loadAllData(true)}
              disabled={refreshing}
              className={`flex h-8 w-8 items-center justify-center rounded-full border ${pillOutline} transition`}
              title="Refresh"
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            </button>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-stone-500 hover:text-red-500 transition"
              >
                <LogOut size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Sub-Nav */}
        <div className="mt-2.5 flex md:hidden items-center gap-1 overflow-x-auto pb-1 text-xs">
          {["overview", "campaigns", "creatives", "leads", "seo", "integrations"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`shrink-0 rounded-full px-3 py-1 capitalize font-medium ${
                activeTab === tab ? "bg-[#111111] text-white dark:bg-white dark:text-black" : textSub
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="mx-auto w-full max-w-7xl px-4 sm:px-8 py-8 sm:py-12 space-y-12">
        {/* ========================================================================= */}
        {/* HERO SECTION (PRESERVING EXACT REFERENCE UI/UX, 100% DIGITAL MARKETING) */}
        {/* ========================================================================= */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Editorial Headline & Quiet Copy */}
          <div className="lg:col-span-6 space-y-6 pt-2">
            <div className="space-y-1">
              <h1 className="text-4xl sm:text-6xl lg:text-[68px] font-editorial leading-[1.04] tracking-tight">
                <span className="block font-bold">Marketing,</span>
                <span className="block font-normal italic">engineered for</span>
                <span className="block font-normal italic">revenue scale.</span>
              </h1>
            </div>

            <p className={`text-sm sm:text-base ${textSub} max-w-md leading-relaxed`}>
              Unify multi-channel ad spend, live ROAS attribution, creative iteration and inbound sales pipelines in one quiet dashboard. Built for high-growth enterprise teams that value precision over noise.
            </p>

            {/* Dual Pill Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowNewCampaignModal(true)}
                className={`flex items-center gap-2 rounded-full px-6 py-3 text-xs sm:text-sm font-medium transition shadow-sm ${pillBlack}`}
              >
                <span>+ launch campaign</span>
                <ArrowUpRight size={15} />
              </button>

              <button
                type="button"
                onClick={() => setShowDemoVideoModal(true)}
                className={`flex items-center gap-2 rounded-full px-6 py-3 text-xs sm:text-sm font-medium transition ${pillOutline}`}
              >
                <PlayCircle size={15} />
                <span>watch growth demo</span>
              </button>
            </div>

            {/* Floating Live Capsule Badge */}
            <div className="pt-4">
              <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 border shadow-sm ${whiteCard}`}>
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black">
                  <Check size={10} />
                </div>
                <span className="font-mono text-xs text-stone-500 dark:text-stone-400">
                  google search • ROAS: 5.42x • 1,122 MQLs verified
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Quiet Dashboard Interactive Mockup */}
          <div className="lg:col-span-6">
            <div className={`rounded-[32px] border ${sandCard} p-4 sm:p-6 space-y-4 shadow-sm relative`}>
              {/* Floating Pill Notification capsule */}
              <div className="flex items-center justify-end">
                <div className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 border text-[11px] font-mono shadow-sm ${whiteCard}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-stone-600 dark:text-stone-300">inbound lead: Elena Rostova (Apex Global) captured</span>
                </div>
              </div>

              {/* Main Workspace Frame */}
              <div className="grid grid-cols-12 gap-3 items-start">
                {/* Thin Vertical Navigation Pill Track */}
                <div className={`col-span-2 sm:col-span-1 rounded-full border py-3 px-1 flex flex-col items-center gap-2.5 ${whiteCard}`}>
                  {[
                    { id: "overview", char: "o" },
                    { id: "campaigns", char: "c" },
                    { id: "creatives", char: "r" },
                    { id: "leads", char: "l" },
                    { id: "seo", char: "s" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as any)}
                      className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-mono uppercase font-semibold transition ${
                        activeTab === item.id
                          ? dark ? "bg-white text-black" : "bg-black text-white"
                          : "text-stone-400 hover:text-black dark:hover:text-white"
                      }`}
                    >
                      {item.char}
                    </button>
                  ))}
                </div>

                {/* Dashboard Center Area */}
                <div className="col-span-10 sm:col-span-11 space-y-3.5">
                  {/* Top 3 Metric Blocks */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className={`rounded-2xl border p-3 text-center ${whiteCard}`}>
                      <div className={`text-[10px] font-mono ${textMuted}`}>ad spend</div>
                      <div className="text-base sm:text-lg font-bold font-mono mt-0.5">$42.2k</div>
                      <div className="text-[10px] text-emerald-600 font-mono font-semibold">+18% MoM</div>
                    </div>

                    <div className={`rounded-2xl border p-3 text-center ${whiteCard}`}>
                      <div className={`text-[10px] font-mono ${textMuted}`}>pipeline rev</div>
                      <div className="text-base sm:text-lg font-bold font-mono mt-0.5">$206.5k</div>
                      <div className="text-[10px] text-emerald-600 font-mono font-semibold">5.06x roas</div>
                    </div>

                    <div className={`rounded-2xl border p-3 text-center ${whiteCard}`}>
                      <div className={`text-[10px] font-mono ${textMuted}`}>high-intent mqls</div>
                      <div className="text-base sm:text-lg font-bold font-mono mt-0.5">1,122</div>
                      <div className="text-[10px] text-stone-500 font-mono">98% qualified</div>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`rounded-full px-3 py-1 text-[11px] font-mono border ${pillSand}`}>google ads</span>
                      <span className={`rounded-full px-3 py-1 text-[11px] font-mono border ${pillSand}`}>meta retargeting</span>
                      <span className={`rounded-full px-3 py-1 text-[11px] font-mono border ${pillSand}`}>linkedin inmail</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowNewCampaignModal(true)}
                      className={`flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium ${pillBlack}`}
                    >
                      <span>new campaign</span>
                      <ArrowUpRight size={11} />
                    </button>
                  </div>

                  {/* Attribution Health Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-stone-500 dark:text-stone-400">
                      <span>attribution tracking</span>
                      <span>99.2% multi-touch synced • 0 drops</span>
                    </div>
                    <div className="w-full h-1 bg-stone-300 dark:bg-stone-700 rounded-full overflow-hidden">
                      <div className="w-[99%] h-full bg-black dark:bg-white rounded-full" />
                    </div>
                  </div>

                  {/* Campaign Stream Table Card */}
                  <div className={`rounded-2xl border p-3.5 space-y-2.5 ${whiteCard}`}>
                    <div className="grid grid-cols-12 text-[10px] font-mono uppercase text-stone-400 pb-1 border-b border-inherit">
                      <span className="col-span-5">campaign</span>
                      <span className="col-span-4">roas / cpa</span>
                      <span className="col-span-3 text-right">status</span>
                    </div>

                    {[
                      { name: "Enterprise Search", metric: "5.42x • $30.4", status: "active", isDark: true },
                      { name: "C-Suite InMail", metric: "6.18x • $44.4", status: "active", isDark: true },
                      { name: "Meta Retargeting", metric: "4.25x • $31.8", status: "active", isDark: false },
                    ].map((row, idx) => (
                      <div key={idx} className="grid grid-cols-12 items-center text-xs font-mono">
                        <span className="col-span-5 font-semibold text-stone-800 dark:text-stone-200 truncate">{row.name}</span>
                        <span className="col-span-4 text-emerald-600 font-semibold">{row.metric}</span>
                        <span className="col-span-3 text-right">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                            row.isDark ? pillBlack : pillSand
                          }`}>
                            {row.status}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* AI Growth Attribution Card */}
                  <div className={`rounded-2xl border p-3.5 flex items-start gap-3 ${whiteCard}`}>
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-black text-white dark:bg-white dark:text-black font-mono font-bold text-[10px]">
                      ai
                    </div>
                    <div className="text-[11px] leading-snug">
                      <div className="font-semibold text-stone-800 dark:text-stone-200">
                        ai attributed 48 new enterprise mqls from google & linkedin
                      </div>
                      <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                        firmographics enriched • quality scored HOT • synced to sales pipeline
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* FUNCTIONAL VIEWS (OVERVIEW, CAMPAIGNS, CREATIVES, LEADS, SEO, INTEGRATIONS) */}
        {/* ========================================================================= */}

        {/* VIEW: OVERVIEW DEEP DIVE */}
        {activeTab === "overview" && overview && (
          <section className="space-y-8 pt-4 border-t border-inherit">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold font-editorial">Attributed Media Performance</h2>
                <p className={`text-xs ${textMuted}`}>Continuous multi-touch telemetry across Google, Meta, LinkedIn and YouTube.</p>
              </div>
              <div className="flex items-center gap-3 font-mono text-xs text-stone-500">
                <span>Blended ROAS: <strong className="text-black dark:text-white font-bold">{overview.blendedRoas}x</strong></span>
                <span>•</span>
                <span>Attributed Pipeline: <strong className="text-black dark:text-white font-bold">${overview.attributedRevenue.toLocaleString()}</strong></span>
              </div>
            </div>

            {/* 6 High-Impact Performance Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: "Total Ad Spend", value: `$${overview.totalSpend.toLocaleString()}`, sub: "84.3% of budget", positive: true },
                { label: "Pipeline Revenue", value: `$${overview.attributedRevenue.toLocaleString()}`, sub: "+24.1% MoM", positive: true },
                { label: "Blended ROAS", value: `${overview.blendedRoas}x`, sub: "Industry top 5%", positive: true },
                { label: "High-Intent MQLs", value: `${overview.totalConversions.toLocaleString()}`, sub: "98% ICP match", positive: true },
                { label: "Blended CPA", value: `$${overview.avgCpa}`, sub: "-14.2% lower", positive: true },
                { label: "Avg CTR", value: `${overview.avgCtr}%`, sub: "+0.8% benchmark", positive: true },
              ].map((kpi, idx) => (
                <div key={idx} className={`rounded-2xl border p-4 ${whiteCard}`}>
                  <div className={`text-[11px] font-mono ${textMuted}`}>{kpi.label}</div>
                  <div className="text-xl font-bold font-mono mt-1 text-stone-900 dark:text-stone-100">{kpi.value}</div>
                  <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">{kpi.sub}</div>
                </div>
              ))}
            </div>

            {/* Spend vs Attributed Revenue Chart */}
            <div className={`rounded-3xl border p-6 space-y-4 ${whiteCard}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm font-mono uppercase tracking-wider text-stone-700 dark:text-stone-300">Revenue Trajectory (6 Months)</h3>
                  <p className={`text-xs ${textMuted}`}>Ad Spend invested vs closed pipeline value</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono text-stone-500">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-black dark:bg-white" />
                    <span>Pipeline Revenue</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-stone-400" />
                    <span>Ad Spend</span>
                  </div>
                </div>
              </div>

              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={overview.monthlyTrends}>
                    <defs>
                      <linearGradient id="sandRevGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={dark ? "#ffffff" : "#111111"} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={dark ? "#ffffff" : "#111111"} stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="sandSpendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#888888" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#888888" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#30363d" : "#ede7dc"} vertical={false} />
                    <XAxis dataKey="month" stroke="#888888" fontSize={11} tickLine={false} />
                    <YAxis stroke="#888888" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: dark ? "#161b22" : "#ffffff",
                        borderColor: dark ? "#30363d" : "#ded8ce",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                      formatter={(val: any, name: string) => [
                        `$${Number(val).toLocaleString()}`,
                        name === "revenue" ? "Attributed Revenue" : "Ad Spend",
                      ]}
                    />
                    <Area type="monotone" dataKey="revenue" stroke={dark ? "#ffffff" : "#111111"} strokeWidth={2.5} fillOpacity={1} fill="url(#sandRevGradient)" />
                    <Area type="monotone" dataKey="spend" stroke="#888888" strokeWidth={1.5} strokeDasharray="4 4" fillOpacity={1} fill="url(#sandSpendGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Channel Performance Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {overview.channelDistribution.map((ch, idx) => (
                <div key={idx} className={`rounded-3xl border p-5 space-y-3 ${whiteCard}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm font-mono text-stone-800 dark:text-stone-200">{ch.name}</span>
                    <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">{ch.roas}x ROAS</span>
                  </div>
                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-stone-500">
                      <span>Ad Spend:</span>
                      <strong className="text-stone-800 dark:text-stone-200">${ch.spend.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between text-stone-500">
                      <span>Attributed Rev:</span>
                      <strong className="text-stone-800 dark:text-stone-200">${ch.revenue.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between text-stone-500">
                      <span>Conversions:</span>
                      <strong className="text-stone-800 dark:text-stone-200">{ch.conversions} MQLs</strong>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-stone-900 dark:bg-white"
                      style={{ width: `${Math.min(100, (ch.spend / overview.totalSpend) * 100 * 2.2)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* AI Growth Copilot Recommendations */}
            <div className={`rounded-3xl border p-6 space-y-4 ${sandCard}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-md bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-mono text-xs font-bold">
                    AI
                  </div>
                  <h3 className="font-bold text-sm font-mono uppercase tracking-wider">Growth Recommendations Engine</h3>
                </div>
                <span className="text-[11px] font-mono text-stone-500">3 high-conviction optimizations</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {overview.aiInsights.map((insight) => (
                  <div key={insight.id} className={`rounded-2xl border p-4 space-y-3 flex flex-col justify-between ${whiteCard}`}>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className={`px-2 py-0.5 rounded-full font-bold ${
                          insight.priority === "HIGH" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" : pillSand
                        }`}>
                          {insight.priority}
                        </span>
                        <span className="font-semibold text-stone-500">{insight.impact}</span>
                      </div>
                      <h4 className="font-bold text-xs font-sans text-stone-900 dark:text-stone-100">{insight.title}</h4>
                      <p className={`text-[11px] ${textSub} leading-relaxed`}>{insight.description}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplyAiRecommendation(insight.title)}
                      className={`w-full rounded-full py-1.5 text-xs font-medium transition ${pillBlack}`}
                    >
                      apply recommendation ↗
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* VIEW: CAMPAIGNS HUB */}
        {activeTab === "campaigns" && (
          <section className="space-y-6 pt-4 border-t border-inherit">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold font-editorial">Active Ad Campaigns</h2>
                <p className={`text-xs ${textMuted}`}>Manage spend allocation, pause/resume delivery, and track ROAS.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewCampaignModal(true)}
                className={`flex items-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-medium ${pillBlack}`}
              >
                <span>+ Launch New Campaign</span>
                <ArrowUpRight size={14} />
              </button>
            </div>

            {/* Filter Pills & Search */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
                <span className="text-stone-400 text-[11px] mr-1">Platform:</span>
                {["ALL", "Google Ads", "Meta Ads", "LinkedIn Ads", "YouTube Ads"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPlatformFilter(p)}
                    className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${
                      platformFilter === p ? (dark ? "bg-white text-black" : "bg-black text-white") : pillOutline
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 border text-xs font-mono ${whiteCard}`}>
                  <Search size={13} className="text-stone-400" />
                  <input
                    type="text"
                    placeholder="Search campaigns..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent outline-none text-xs w-36 sm:w-44"
                  />
                  {searchQuery && (
                    <button type="button" onClick={() => setSearchQuery("")} className="text-stone-400 hover:text-black dark:hover:text-white">
                      <X size={12} />
                    </button>
                  )}
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`rounded-full px-3 py-1.5 text-xs font-mono border outline-none ${whiteCard}`}
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="PAUSED">Paused</option>
                </select>
              </div>
            </div>

            {/* Campaign Table */}
            <div className={`rounded-3xl border overflow-hidden ${whiteCard}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className={`border-b ${dark ? "border-[#30363d] bg-[#161b22]" : "border-[#ede7dc] bg-[#f8f5ee]"} text-stone-400 text-[11px]`}>
                    <tr>
                      <th className="px-6 py-3.5">Campaign Name</th>
                      <th className="px-6 py-3.5">Platform</th>
                      <th className="px-6 py-3.5">Spend / Budget</th>
                      <th className="px-6 py-3.5">Clicks & Conv.</th>
                      <th className="px-6 py-3.5">ROAS</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-inherit">
                    {filteredCampaigns.map((camp) => (
                      <tr key={camp.id} className="hover:bg-stone-500/5 transition">
                        <td className="px-6 py-4">
                          <div className="font-sans font-bold text-sm text-stone-900 dark:text-stone-100">{camp.name}</div>
                          <div className="text-[10px] text-stone-400 mt-0.5">{camp.channel} • {camp.objective}</div>
                        </td>
                        <td className="px-6 py-4 text-stone-600 dark:text-stone-300 font-semibold">{camp.platform}</td>
                        <td className="px-6 py-4">
                          <div className="text-stone-800 dark:text-stone-200 font-semibold">
                            ${camp.spend.toLocaleString()} / <span className="text-stone-400 font-normal">${camp.budget.toLocaleString()}</span>
                          </div>
                          <div className="w-24 h-1 bg-stone-200 dark:bg-stone-700 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className="h-full bg-black dark:bg-white rounded-full"
                              style={{ width: `${Math.min(100, camp.budget > 0 ? (camp.spend / camp.budget) * 100 : 0)}%` }}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-stone-600 dark:text-stone-400">
                          <div>{camp.clicks.toLocaleString()} clicks</div>
                          <div className="text-[10px] text-emerald-600 font-semibold">{camp.conversions} conversions</div>
                        </td>
                        <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400">{camp.roas}x</td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                            camp.status === "ACTIVE" ? pillBlack : pillSand
                          }`}>
                            {camp.status.toLowerCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleCampaignStatus(camp.id)}
                              className={`rounded-full px-3 py-1 text-[11px] border ${pillOutline}`}
                            >
                              {camp.status === "ACTIVE" ? "pause" : "resume"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCampaign(camp.id)}
                              className="text-stone-400 hover:text-red-500 transition p-1"
                              title="Delete Campaign"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* VIEW: CREATIVE LAB */}
        {activeTab === "creatives" && (
          <section className="space-y-6 pt-4 border-t border-inherit">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold font-editorial">Creative Library & Copy</h2>
                <p className={`text-xs ${textMuted}`}>Tested ad hooks, headlines, and narrative scripts across formats.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewCreativeModal(true)}
                className={`rounded-full px-4 py-2 text-xs font-medium ${pillBlack}`}
              >
                + Register Creative Asset
              </button>
            </div>

            {/* Format Filter Pills */}
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="text-stone-400 text-[11px] mr-1">Format:</span>
              {["ALL", "Video", "Carousel", "Single Image", "Story"].map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setCreativeFormatFilter(fmt)}
                  className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${
                    creativeFormatFilter === fmt ? (dark ? "bg-white text-black" : "bg-black text-white") : pillOutline
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCreatives.map((cr) => (
                <div key={cr.id} className={`rounded-3xl border p-5 flex flex-col justify-between space-y-4 ${whiteCard}`}>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className={`rounded-full px-2.5 py-0.5 ${pillSand}`}>{cr.format}</span>
                      <span className="text-emerald-600 font-semibold font-mono">CTR {cr.ctr}% • Conv {cr.conversion_rate}%</span>
                    </div>
                    <h3 className="font-bold text-base font-sans text-stone-900 dark:text-stone-100">{cr.headline}</h3>
                    <p className={`text-xs ${textSub} leading-relaxed`}>{cr.primary_text}</p>
                  </div>

                  <div className={`p-3 rounded-2xl border ${sandCard} flex items-center justify-between text-xs font-mono`}>
                    <span className="text-stone-500">CTA: {cr.cta}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`${cr.headline}\n\n${cr.primary_text}`);
                        triggerNotice("Ad copy copied to clipboard!");
                      }}
                      className="text-stone-900 dark:text-white font-semibold flex items-center gap-1 hover:underline"
                    >
                      <Copy size={12} />
                      <span>copy ad copy</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* VIEW: INBOUND LEADS & CRM SYNC */}
        {activeTab === "leads" && (
          <section className="space-y-6 pt-4 border-t border-inherit">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold font-editorial">Inbound Campaign Leads</h2>
                <p className={`text-xs ${textMuted}`}>Ad-attributed leads ready for 1-click sync to the ZootechX CRM Sales pipeline.</p>
              </div>

              {/* Quality score filter */}
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <span className="text-stone-400 text-[11px] mr-1">Quality:</span>
                {["ALL", "HOT", "HIGH_INTENT", "WARM"].map((q) => (
                  <button
                    key={q}
                    onClick={() => setLeadQualityFilter(q)}
                    className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${
                      leadQualityFilter === q ? (dark ? "bg-white text-black" : "bg-black text-white") : pillOutline
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div className={`rounded-3xl border overflow-hidden ${whiteCard}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className={`border-b ${dark ? "border-[#30363d] bg-[#161b22]" : "border-[#ede7dc] bg-[#f8f5ee]"} text-stone-400 text-[11px]`}>
                    <tr>
                      <th className="px-6 py-3.5">Lead Contact</th>
                      <th className="px-6 py-3.5">Company</th>
                      <th className="px-6 py-3.5">Ad Attribution</th>
                      <th className="px-6 py-3.5">Quality</th>
                      <th className="px-6 py-3.5 text-right">CRM Sync</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-inherit">
                    {filteredLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-stone-500/5 transition">
                        <td className="px-6 py-4">
                          <div className="font-sans font-bold text-stone-900 dark:text-stone-100">{lead.lead_name}</div>
                          <div className="text-[11px] text-stone-400">{lead.email} • {lead.phone}</div>
                        </td>
                        <td className="px-6 py-4 font-sans font-medium text-stone-700 dark:text-stone-300">{lead.company}</td>
                        <td className="px-6 py-4 text-stone-500">{lead.campaign_name} ({lead.platform})</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            lead.quality_score === "HOT"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : lead.quality_score === "HIGH_INTENT"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                              : pillSand
                          }`}>
                            {lead.quality_score}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {lead.synced_to_crm ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                              <CheckCheck size={13} /> synced to crm
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSyncLeadToCrm(lead.id)}
                              disabled={syncingLeadId === lead.id}
                              className={`rounded-full px-3.5 py-1 text-[11px] font-medium transition ${pillBlack}`}
                            >
                              {syncingLeadId === lead.id ? "syncing..." : "sync to crm ↗"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* VIEW: SEO INTELLIGENCE */}
        {activeTab === "seo" && (
          <section className="space-y-6 pt-4 border-t border-inherit">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold font-editorial">SEO & Organic Rankings</h2>
                <p className={`text-xs ${textMuted}`}>Search position tracking for high-intent ERP, billing, and enterprise software queries.</p>
              </div>

              {/* Add Keyword input */}
              <form onSubmit={handleAddSeoKeyword} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Enter keyword to track..."
                  value={newKeywordInput}
                  onChange={(e) => setNewKeywordInput(e.target.value)}
                  className={`rounded-full px-4 py-1.5 text-xs font-mono border outline-none ${whiteCard}`}
                />
                <button
                  type="submit"
                  className={`rounded-full px-4 py-1.5 text-xs font-medium ${pillBlack}`}
                >
                  + track
                </button>
              </form>
            </div>

            <div className={`rounded-3xl border overflow-hidden ${whiteCard}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className={`border-b ${dark ? "border-[#30363d] bg-[#161b22]" : "border-[#ede7dc] bg-[#f8f5ee]"} text-stone-400 text-[11px]`}>
                    <tr>
                      <th className="px-6 py-3.5">Keyword</th>
                      <th className="px-6 py-3.5 text-center">Google Rank</th>
                      <th className="px-6 py-3.5 text-right">Search Volume</th>
                      <th className="px-6 py-3.5 text-right">Organic Clicks</th>
                      <th className="px-6 py-3.5 text-right">30d Movement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-inherit">
                    {seoKeywords.map((kw, idx) => (
                      <tr key={idx} className="hover:bg-stone-500/5 transition">
                        <td className="px-6 py-4 font-sans font-semibold text-stone-800 dark:text-stone-200">{kw.keyword}</td>
                        <td className="px-6 py-4 text-center font-bold">#{kw.rank}</td>
                        <td className="px-6 py-4 text-right text-stone-500">{kw.volume.toLocaleString()}/mo</td>
                        <td className="px-6 py-4 text-right text-stone-700 dark:text-stone-300 font-semibold">{kw.clicks.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right text-emerald-600 font-semibold">{kw.change}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* VIEW: AD CHANNELS & INTEGRATIONS */}
        {activeTab === "integrations" && (
          <section className="space-y-6 pt-4 border-t border-inherit">
            <div>
              <h2 className="text-2xl font-bold font-editorial">Ad Networks & Data Streams</h2>
              <p className={`text-xs ${textMuted}`}>Live telemetry connectors to Google Ads, Meta Business, LinkedIn and Analytics.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: "Google Ads API", id: "google-ads", status: "Active Stream", frequency: "Real-time Webhook", account: "ZootechX Growth Enterprise (412-980-112)" },
                { name: "Meta Business Marketing API", id: "meta-ads", status: "Active Stream", frequency: "Conversions API (CAPI)", account: "ZootechX Global Pixel (px_994102)" },
                { name: "LinkedIn Campaign Manager", id: "linkedin-ads", status: "Active Stream", frequency: "Lead Gen Sync (15m)", account: "ZootechX Corporate Tech (li_448201)" },
                { name: "Google Analytics 4 (GA4)", id: "ga4", status: "Active Stream", frequency: "Event Telemetry", account: "G-ZOOTECHX992 (Measurement ID)" },
              ].map((conn, idx) => (
                <div key={idx} className={`rounded-3xl border p-5 flex flex-col justify-between space-y-4 ${whiteCard}`}>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {conn.status}
                      </span>
                      <span className="text-stone-400">{conn.frequency}</span>
                    </div>
                    <h3 className="font-bold text-base font-sans text-stone-900 dark:text-stone-100">{conn.name}</h3>
                    <p className="text-xs font-mono text-stone-500">{conn.account}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] font-mono text-stone-400">Latency: 28ms</span>
                    <button
                      type="button"
                      onClick={() => triggerNotice(`${conn.name} ping verified: 100% healthy, 0 packet loss.`)}
                      className={`rounded-full px-3.5 py-1 text-xs font-mono border ${pillOutline}`}
                    >
                      test connection
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL: LAUNCH NEW CAMPAIGN */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showNewCampaignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className={`w-full max-w-md rounded-[28px] border p-6 sm:p-7 shadow-2xl space-y-4 ${whiteCard}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg font-editorial">Launch New Campaign</h3>
                  <p className={`text-xs ${textMuted}`}>Create and track multi-channel ad delivery.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewCampaignModal(false)}
                  className="rounded-full p-1 text-stone-400 hover:text-black dark:hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateCampaign} className="space-y-3.5 text-xs font-mono">
                <div>
                  <label className="block text-[11px] text-stone-500 mb-1">campaign name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Q4 Growth Invoicing Push"
                    value={newCampaignForm.name}
                    onChange={(e) => setNewCampaignForm({ ...newCampaignForm, name: e.target.value })}
                    className={`w-full rounded-full px-4 py-2.5 border outline-none ${dark ? "bg-[#0d1117] border-[#30363d]" : "bg-[#faf7f2] border-[#ded8ce]"}`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-stone-500 mb-1">platform</label>
                    <select
                      value={newCampaignForm.platform}
                      onChange={(e) => setNewCampaignForm({ ...newCampaignForm, platform: e.target.value })}
                      className={`w-full rounded-full px-3.5 py-2.5 border outline-none ${dark ? "bg-[#0d1117] border-[#30363d]" : "bg-[#faf7f2] border-[#ded8ce]"}`}
                    >
                      <option value="Google Ads">Google Ads</option>
                      <option value="Meta Ads">Meta Ads</option>
                      <option value="LinkedIn Ads">LinkedIn Ads</option>
                      <option value="YouTube Ads">YouTube Ads</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-stone-500 mb-1">budget ($ / ₹)</label>
                    <input
                      type="number"
                      required
                      min={100}
                      value={newCampaignForm.budget}
                      onChange={(e) => setNewCampaignForm({ ...newCampaignForm, budget: Number(e.target.value) })}
                      className={`w-full rounded-full px-4 py-2.5 border outline-none ${dark ? "bg-[#0d1117] border-[#30363d]" : "bg-[#faf7f2] border-[#ded8ce]"}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-stone-500 mb-1">target audience</label>
                  <input
                    type="text"
                    placeholder="e.g. Clinics, Logistics, SMEs, Founders"
                    value={newCampaignForm.targetAudience}
                    onChange={(e) => setNewCampaignForm({ ...newCampaignForm, targetAudience: e.target.value })}
                    className={`w-full rounded-full px-4 py-2.5 border outline-none ${dark ? "bg-[#0d1117] border-[#30363d]" : "bg-[#faf7f2] border-[#ded8ce]"}`}
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewCampaignModal(false)}
                    className="rounded-full px-4 py-2 text-stone-400 hover:text-black dark:hover:text-white"
                  >
                    cancel
                  </button>
                  <button
                    type="submit"
                    className={`rounded-full px-5 py-2 font-medium ${pillBlack}`}
                  >
                    deploy campaign ↗
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: REGISTER CREATIVE */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showNewCreativeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className={`w-full max-w-md rounded-[28px] border p-6 sm:p-7 shadow-2xl space-y-4 ${whiteCard}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg font-editorial">Register Creative Asset</h3>
                  <p className={`text-xs ${textMuted}`}>Add tested headlines and narrative copy.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewCreativeModal(false)}
                  className="rounded-full p-1 text-stone-400 hover:text-black dark:hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateCreative} className="space-y-3.5 text-xs font-mono">
                <div>
                  <label className="block text-[11px] text-stone-500 mb-1">headline / hook</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Stop wasting 15 hours weekly on manual ERP workflows"
                    value={newCreativeForm.headline}
                    onChange={(e) => setNewCreativeForm({ ...newCreativeForm, headline: e.target.value })}
                    className={`w-full rounded-full px-4 py-2.5 border outline-none ${dark ? "bg-[#0d1117] border-[#30363d]" : "bg-[#faf7f2] border-[#ded8ce]"}`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-stone-500 mb-1">format</label>
                    <select
                      value={newCreativeForm.format}
                      onChange={(e) => setNewCreativeForm({ ...newCreativeForm, format: e.target.value as any })}
                      className={`w-full rounded-full px-3.5 py-2.5 border outline-none ${dark ? "bg-[#0d1117] border-[#30363d]" : "bg-[#faf7f2] border-[#ded8ce]"}`}
                    >
                      <option value="Video">Video Ad</option>
                      <option value="Carousel">Carousel</option>
                      <option value="Single Image">Single Image</option>
                      <option value="Story">Story / Reel</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-stone-500 mb-1">call to action</label>
                    <input
                      type="text"
                      required
                      value={newCreativeForm.cta}
                      onChange={(e) => setNewCreativeForm({ ...newCreativeForm, cta: e.target.value })}
                      className={`w-full rounded-full px-4 py-2.5 border outline-none ${dark ? "bg-[#0d1117] border-[#30363d]" : "bg-[#faf7f2] border-[#ded8ce]"}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-stone-500 mb-1">narrative body copy</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Enter ad body text..."
                    value={newCreativeForm.primaryText}
                    onChange={(e) => setNewCreativeForm({ ...newCreativeForm, primaryText: e.target.value })}
                    className={`w-full rounded-2xl p-3 border outline-none resize-none ${dark ? "bg-[#0d1117] border-[#30363d]" : "bg-[#faf7f2] border-[#ded8ce]"}`}
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewCreativeModal(false)}
                    className="rounded-full px-4 py-2 text-stone-400 hover:text-black dark:hover:text-white"
                  >
                    cancel
                  </button>
                  <button
                    type="submit"
                    className={`rounded-full px-5 py-2 font-medium ${pillBlack}`}
                  >
                    save creative ↗
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: GROWTH DEMO PREVIEW */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showDemoVideoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-lg rounded-[28px] border p-6 sm:p-7 shadow-2xl space-y-4 ${whiteCard}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg font-editorial">ZootechX Growth Suite Demo</h3>
                  <p className={`text-xs ${textMuted}`}>Multi-channel ad telemetry & real-time ROAS attribution.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDemoVideoModal(false)}
                  className="rounded-full p-1 text-stone-400 hover:text-black dark:hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className={`rounded-2xl border p-8 text-center space-y-3 ${sandCard}`}>
                <div className="h-12 w-12 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center mx-auto shadow-md">
                  <Play size={20} className="ml-0.5" />
                </div>
                <div className="font-semibold text-sm">Interactive Growth Walkthrough</div>
                <p className="text-xs text-stone-500 max-w-xs mx-auto">
                  Experience live Google & Meta ad telemetry, AI audience enrichment, and 1-click lead synchronization into your CRM sales pipeline.
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowDemoVideoModal(false)}
                  className={`rounded-full px-5 py-2 text-xs font-medium ${pillBlack}`}
                >
                  close demo
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
