import { randomUUID } from "crypto";

export type MarketingCampaign = {
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
  updated_at: string;
};

export type MarketingCreative = {
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

export type MarketingLead = {
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

type FallbackMarketingStore = {
  campaigns: MarketingCampaign[];
  creatives: MarketingCreative[];
  leads: MarketingLead[];
};

const initialCampaigns: MarketingCampaign[] = [
  {
    id: "mkt-camp-001",
    name: "Enterprise ERP Search Acquisition",
    platform: "Google Ads",
    channel: "Search Intent",
    objective: "LEAD_GENERATION",
    status: "ACTIVE",
    budget: 15000,
    spend: 12450,
    impressions: 84200,
    clicks: 4120,
    conversions: 384,
    roas: 5.42,
    target_audience: "CTOs, CFOs, VPs of Operations in Manufacturing & Retail (US/IN)",
    start_date: "2026-08-01",
    end_date: "2026-09-30",
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "mkt-camp-002",
    name: "High-Intent Retargeting & Brand Uplift",
    platform: "Meta Ads",
    channel: "Instagram & FB",
    objective: "CONVERSIONS",
    status: "ACTIVE",
    budget: 10000,
    spend: 8420,
    impressions: 192000,
    clicks: 6240,
    conversions: 265,
    roas: 4.25,
    target_audience: "Website Visitors (Past 60d), Pricing Page Dropped-off Users",
    start_date: "2026-08-10",
    end_date: "2026-09-25",
    created_at: new Date(Date.now() - 22 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "mkt-camp-003",
    name: "C-Suite & Tech Leadership InMail Suite",
    platform: "LinkedIn Ads",
    channel: "Sponsored InMail & Feed",
    objective: "LEAD_GENERATION",
    status: "ACTIVE",
    budget: 12000,
    spend: 9680,
    impressions: 38500,
    clicks: 1940,
    conversions: 218,
    roas: 6.18,
    target_audience: "Founders, Managing Directors, Tech Heads, Company size 50-500",
    start_date: "2026-08-15",
    end_date: "2026-10-15",
    created_at: new Date(Date.now() - 18 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "mkt-camp-004",
    name: "Next-Gen Cloud Architecture 2026 Showcase",
    platform: "YouTube Ads",
    channel: "TrueView In-Stream",
    objective: "BRAND_AWARENESS",
    status: "ACTIVE",
    budget: 8000,
    spend: 5620,
    impressions: 310000,
    clicks: 7450,
    conversions: 142,
    roas: 3.84,
    target_audience: "Tech Enthusiasts, Cloud Architects, Software Engineering Leaders",
    start_date: "2026-08-20",
    end_date: "2026-09-30",
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "mkt-camp-005",
    name: "Executive Summit & VIP Demo Registration",
    platform: "Google Ads",
    channel: "Performance Max",
    objective: "CONVERSIONS",
    status: "PAUSED",
    budget: 6000,
    spend: 6000,
    impressions: 98000,
    clicks: 3410,
    conversions: 113,
    roas: 4.60,
    target_audience: "Enterprise Decision Makers seeking Next-Gen ERP Migration",
    start_date: "2026-07-15",
    end_date: "2026-08-30",
    created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const initialCreatives: MarketingCreative[] = [
  {
    id: "mkt-cr-001",
    campaign_id: "mkt-camp-001",
    title: "10x Faster Invoicing Engine Visual",
    format: "Single Image",
    headline: "Stop Wasting 15 Hours Weekly on Legacy ERP Invoicing",
    primary_text: "Discover ZootechX.ai: Automated GST compliance, real-time developer metrics, and instant payment reconciliation.",
    cta: "Book Executive Demo",
    ctr: 5.12,
    conversion_rate: 8.85,
    preview_badge: "Top Performer",
    status: "ACTIVE",
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: "mkt-cr-002",
    campaign_id: "mkt-camp-002",
    title: "Dark Mode Executive Dashboard Teaser",
    format: "Video",
    headline: "The Luxury Command Center Your Business Deserves",
    primary_text: "Experience frictionless client pipeline visibility with aerospace-grade telemetry and instant Neon Postgres cloud sync.",
    cta: "Explore Live Tour",
    ctr: 4.82,
    conversion_rate: 7.64,
    preview_badge: "Viral Hook",
    status: "ACTIVE",
    created_at: new Date(Date.now() - 16 * 86400000).toISOString(),
  },
  {
    id: "mkt-cr-003",
    campaign_id: "mkt-camp-003",
    title: "C-Suite Case Study Carousel",
    format: "Carousel",
    headline: "How 120+ Enterprises Cut Closing Times by 40%",
    primary_text: "Swipe through verified transformation metrics from Northstar Ventures, Cedar & Co., and Atlas Retail.",
    cta: "Read Case Study",
    ctr: 6.45,
    conversion_rate: 9.30,
    preview_badge: "Highest ROAS",
    status: "ACTIVE",
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
  {
    id: "mkt-cr-004",
    campaign_id: "mkt-camp-004",
    title: "Engineering Speed Benchmark 60s Reel",
    format: "Story",
    headline: "From Quotation to GST Invoice in Under 60 Seconds",
    primary_text: "Watch our product lead create, audit, and dispatch an enterprise GST quotation in real-time.",
    cta: "Start 14-Day Pilot",
    ctr: 3.95,
    conversion_rate: 5.40,
    preview_badge: "Scaling Fast",
    status: "ACTIVE",
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

const initialLeads: MarketingLead[] = [
  {
    id: "mkt-lead-001",
    campaign_name: "Enterprise ERP Search Acquisition",
    platform: "Google Ads",
    lead_name: "Vikram Singhania",
    company: "Singhania Logistics Corp",
    email: "vikram.s@singhanialogistics.com",
    phone: "+91 98200 44102",
    quality_score: "HOT",
    status: "NEW",
    synced_to_crm: false,
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: "mkt-lead-002",
    campaign_name: "C-Suite & Tech Leadership InMail Suite",
    platform: "LinkedIn Ads",
    lead_name: "Elena Rostova",
    company: "Apex Global FinTech",
    email: "elena.rostova@apexfintech.io",
    phone: "+1 415 890 2314",
    quality_score: "HOT",
    status: "QUALIFIED",
    synced_to_crm: false,
    created_at: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
  {
    id: "mkt-lead-003",
    campaign_name: "High-Intent Retargeting & Brand Uplift",
    platform: "Meta Ads",
    lead_name: "Rahul Kothari",
    company: "Kothari Infra Build",
    email: "rahul@kothari-infra.com",
    phone: "+91 99301 88204",
    quality_score: "HIGH_INTENT",
    status: "NEW",
    synced_to_crm: false,
    created_at: new Date(Date.now() - 14 * 3600000).toISOString(),
  },
  {
    id: "mkt-lead-004",
    campaign_name: "Enterprise ERP Search Acquisition",
    platform: "Google Ads",
    lead_name: "Pooja Deshmukh",
    company: "Nova Pharma Tech",
    email: "pooja.d@novapharma.in",
    phone: "+91 97654 32190",
    quality_score: "HIGH_INTENT",
    status: "NEW",
    synced_to_crm: false,
    created_at: new Date(Date.now() - 26 * 3600000).toISOString(),
  },
  {
    id: "mkt-lead-005",
    campaign_name: "Next-Gen Cloud Architecture 2026 Showcase",
    platform: "YouTube Ads",
    lead_name: "Arthur Pendelton",
    company: "Vanguard Systems UK",
    email: "arthur.p@vanguardsys.co.uk",
    phone: "+44 20 7946 0912",
    quality_score: "WARM",
    status: "NEW",
    synced_to_crm: false,
    created_at: new Date(Date.now() - 38 * 3600000).toISOString(),
  },
];

const store: FallbackMarketingStore = {
  campaigns: [...initialCampaigns],
  creatives: [...initialCreatives],
  leads: [...initialLeads],
};

export async function getMarketingOverview() {
  const totalSpend = store.campaigns.reduce((sum, c) => sum + Number(c.spend), 0);
  const totalBudget = store.campaigns.reduce((sum, c) => sum + Number(c.budget), 0);
  const totalClicks = store.campaigns.reduce((sum, c) => sum + Number(c.clicks), 0);
  const totalImpressions = store.campaigns.reduce((sum, c) => sum + Number(c.impressions), 0);
  const totalConversions = store.campaigns.reduce((sum, c) => sum + Number(c.conversions), 0);

  // Attributed revenue calculation based on campaign ROAS * spend
  const attributedRevenue = store.campaigns.reduce(
    (sum, c) => sum + Number(c.spend) * Number(c.roas),
    0
  );
  const blendedRoas = totalSpend > 0 ? Number((attributedRevenue / totalSpend).toFixed(2)) : 0;
  const avgCtr = totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0;
  const avgCpa = totalConversions > 0 ? Number((totalSpend / totalConversions).toFixed(2)) : 0;

  const channelDistribution = [
    { name: "Google Ads", spend: 18450, revenue: 95400, roas: 5.17, conversions: 497, color: "#4285F4" },
    { name: "LinkedIn Ads", spend: 9680, revenue: 59822, roas: 6.18, conversions: 218, color: "#0A66C2" },
    { name: "Meta Ads", spend: 8420, revenue: 35785, roas: 4.25, conversions: 265, color: "#E1306C" },
    { name: "YouTube Ads", spend: 5620, revenue: 21580, roas: 3.84, conversions: 142, color: "#FF0000" },
  ];

  const monthlyTrends = [
    { month: "Apr 2026", spend: 28000, revenue: 118000, roas: 4.21, leads: 620 },
    { month: "May 2026", spend: 32500, revenue: 146000, roas: 4.49, leads: 740 },
    { month: "Jun 2026", spend: 36000, revenue: 168000, roas: 4.66, leads: 860 },
    { month: "Jul 2026", spend: 39500, revenue: 189000, roas: 4.78, leads: 990 },
    { month: "Aug 2026", spend: 42170, revenue: 206450, roas: 4.89, leads: 1122 },
    { month: "Sep (Proj)", spend: 45000, revenue: 228000, roas: 5.06, leads: 1250 },
  ];

  const aiInsights = [
    {
      id: "ai-1",
      type: "SCALE_OPPORTUNITY",
      title: "Scale Google Search ERP Acquisition",
      description: "Search Intent ROAS hit 5.42x with a 4.89% CTR. Increasing daily spend by $250 is projected to yield 48 additional qualified enterprise MQLs.",
      impact: "+$24,000 Pipeline Value",
      priority: "HIGH",
    },
    {
      id: "ai-2",
      type: "CREATIVE_REFRESH",
      title: "Ad Fatigue Detected on Meta Video Ad #2",
      description: "Frequency reached 4.6 with a 1.2% dip in CTR over the last 4 days. Recommend cycling in the newly approved Carousel format.",
      impact: "-14% CPA Reduction",
      priority: "MEDIUM",
    },
    {
      id: "ai-3",
      type: "AUDIENCE_INSIGHT",
      title: "LinkedIn InMail High-Intent Conversion Surge",
      description: "Founders and CTOs in Manufacturing show a 9.30% landing page conversion rate—2.8x higher than industry average.",
      impact: "6.18x Peak ROAS",
      priority: "POSITIVE",
    },
  ];

  return {
    totalSpend,
    totalBudget,
    attributedRevenue: Math.round(attributedRevenue),
    blendedRoas,
    totalClicks,
    totalImpressions,
    avgCtr,
    avgCpa,
    totalConversions,
    activeCampaignCount: store.campaigns.filter((c) => c.status === "ACTIVE").length,
    channelDistribution,
    monthlyTrends,
    aiInsights,
  };
}

export async function listMarketingCampaigns(filter?: { platform?: string; status?: string; search?: string }) {
  let list = [...store.campaigns];
  if (filter?.platform && filter.platform !== "ALL") {
    list = list.filter((c) => c.platform.toLowerCase() === filter.platform!.toLowerCase());
  }
  if (filter?.status && filter.status !== "ALL") {
    list = list.filter((c) => c.status === filter.status);
  }
  if (filter?.search) {
    const query = filter.search.toLowerCase();
    list = list.filter((c) => c.name.toLowerCase().includes(query) || c.channel.toLowerCase().includes(query));
  }
  return list.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function createMarketingCampaign(data: {
  name: string;
  platform: string;
  channel: string;
  objective: string;
  budget: number;
  targetAudience?: string;
  startDate?: string;
  endDate?: string;
}) {
  const newCamp: MarketingCampaign = {
    id: `mkt-camp-${randomUUID().slice(0, 8)}`,
    name: data.name,
    platform: data.platform,
    channel: data.channel,
    objective: data.objective,
    status: "ACTIVE",
    budget: Number(data.budget),
    spend: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    roas: 0,
    target_audience: data.targetAudience ?? null,
    start_date: data.startDate ?? new Date().toISOString().split("T")[0],
    end_date: data.endDate ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  store.campaigns.unshift(newCamp);
  return newCamp;
}

export async function toggleMarketingCampaignStatus(id: string) {
  const campaign = store.campaigns.find((c) => c.id === id);
  if (!campaign) throw new Error("Campaign not found");
  campaign.status = campaign.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
  campaign.updated_at = new Date().toISOString();
  return campaign;
}

export async function deleteMarketingCampaign(id: string) {
  const index = store.campaigns.findIndex((c) => c.id === id);
  if (index === -1) throw new Error("Campaign not found");
  store.campaigns.splice(index, 1);
  return true;
}

export async function listMarketingCreatives() {
  return [...store.creatives].sort((a, b) => b.ctr - a.ctr);
}

export async function createMarketingCreative(data: {
  campaignId?: string;
  title: string;
  format: "Video" | "Carousel" | "Single Image" | "Story";
  headline: string;
  primaryText: string;
  cta: string;
}) {
  const newCr: MarketingCreative = {
    id: `mkt-cr-${randomUUID().slice(0, 8)}`,
    campaign_id: data.campaignId ?? null,
    title: data.title,
    format: data.format,
    headline: data.headline,
    primary_text: data.primaryText,
    cta: data.cta,
    ctr: Number((Math.random() * 2 + 3.5).toFixed(2)),
    conversion_rate: Number((Math.random() * 3 + 5.5).toFixed(2)),
    preview_badge: "New Creative",
    status: "ACTIVE",
    created_at: new Date().toISOString(),
  };
  store.creatives.unshift(newCr);
  return newCr;
}

export async function listMarketingLeads() {
  return [...store.leads].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function markMarketingLeadSynced(id: string) {
  const lead = store.leads.find((l) => l.id === id);
  if (!lead) throw new Error("Marketing lead not found");
  lead.synced_to_crm = true;
  lead.status = "SYNCED";
  return lead;
}

export async function updateMarketingCampaign(id: string, updates: Partial<MarketingCampaign>) {
  const campaign = store.campaigns.find((c) => c.id === id);
  if (!campaign) throw new Error("Campaign not found");
  if (updates.name !== undefined) campaign.name = updates.name;
  if (updates.budget !== undefined) campaign.budget = Number(updates.budget);
  if (updates.status !== undefined) campaign.status = updates.status;
  if (updates.platform !== undefined) campaign.platform = updates.platform;
  if (updates.channel !== undefined) campaign.channel = updates.channel;
  if (updates.objective !== undefined) campaign.objective = updates.objective;
  if (updates.target_audience !== undefined) campaign.target_audience = updates.target_audience;
  campaign.updated_at = new Date().toISOString();
  return campaign;
}

export async function deleteMarketingCreative(id: string) {
  const index = store.creatives.findIndex((c) => c.id === id);
  if (index === -1) throw new Error("Creative not found");
  store.creatives.splice(index, 1);
  return true;
}

export async function getUnsyncedMarketingLeads() {
  return store.leads.filter((l) => !l.synced_to_crm);
}

