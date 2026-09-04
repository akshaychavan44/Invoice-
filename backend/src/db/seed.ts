import bcrypt from "bcryptjs";
import { sql } from "./client";

type ClientSeed = { name:string; company:string; email:string; phone:string };
async function findOrCreateClient(client: ClientSeed) {
  const existing = await sql`SELECT * FROM clients WHERE email = ${client.email} LIMIT 1`;
  if (existing[0]) return existing[0] as { id:string };
  const rows = await sql`INSERT INTO clients (name, company, email, phone, gst_number) VALUES (${client.name}, ${client.company}, ${client.email}, ${client.phone}, ${"27DEMO" + client.phone.replace(/\D/g, "").slice(-6) + "F1Z5"}) RETURNING *`;
  return rows[0] as { id:string };
}

async function seed(): Promise<void> {
  const hash = await bcrypt.hash("ChangeMe123!", 12);
  for (const [name, email, role] of [
    ["ZootechX Super Admin", "admin@erp.com", "SUPER_ADMIN"],
    ["ZootechX Sub Admin", "subadmin@erp.com", "SUB_ADMIN"],
    ["ZootechX Sales", "sales@erp.com", "SALES"],
    ["ZootechX Growth & Marketing", "marketing@erp.com", "DIGITAL_MARKETING"]
  ] as const) {
    await sql`INSERT INTO users (name, email, password_hash, role) VALUES (${name}, ${email}, ${hash}, ${role}) ON CONFLICT (email) DO NOTHING`;
  }
  const admin = await sql`SELECT id FROM users WHERE email = ${"admin@erp.com"} LIMIT 1`;
  if (admin[0]) for (const notification of [{ title:"Follow-up due", message:"Northstar Ventures needs a call today." }, { title:"New lead", message:"Dev Shah was added from the website." }, { title:"Invoice reminder", message:"DEMO-INV-002 is due soon." }]) {
    await sql`INSERT INTO notifications (user_id, title, message) SELECT ${admin[0].id}, ${notification.title}, ${notification.message} WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE user_id = ${admin[0].id} AND title = ${notification.title})`;
  }

  const [northstar, cedar, atlas] = await Promise.all([
    findOrCreateClient({ name:"Aditi Kapoor", company:"Northstar Ventures", email:"aditi.kapoor.demo@zootechx.test", phone:"+91 98765 10001" }),
    findOrCreateClient({ name:"Rohan Malhotra", company:"Cedar & Co.", email:"rohan.malhotra.demo@zootechx.test", phone:"+91 98765 10002" }),
    findOrCreateClient({ name:"Meera Iyer", company:"Atlas Retail", email:"meera.iyer.demo@zootechx.test", phone:"+91 98765 10003" }),
  ]);

  for (const lead of [
    { name:"Aditi Kapoor", company:"Northstar Ventures", email:"aditi.kapoor.demo@zootechx.test", phone:"+91 98765 10001", source:"Website", status:"NEW" },
    { name:"Rohan Malhotra", company:"Cedar & Co.", email:"rohan.malhotra.demo@zootechx.test", phone:"+91 98765 10002", source:"Referral", status:"NEGOTIATION" },
    { name:"Meera Iyer", company:"Atlas Retail", email:"meera.iyer.demo@zootechx.test", phone:"+91 98765 10003", source:"LinkedIn", status:"CONVERTED" },
    { name:"Dev Shah", company:"Meridian Labs", email:"dev.shah.demo@zootechx.test", phone:"+91 98765 10004", source:"Website", status:"FOLLOW_UP" },
  ]) {
    const existing = await sql`SELECT id FROM leads WHERE email = ${lead.email} LIMIT 1`;
    if (!existing[0]) await sql`INSERT INTO leads (full_name, company, email, phone, source, status, notes) VALUES (${lead.name}, ${lead.company}, ${lead.email}, ${lead.phone}, ${lead.source}, ${lead.status}, ${"Demo CRM record"})`;
  }

  for (const invoice of [
    { number:"DEMO-INV-001", client:northstar, total:185000, paid:185000, due:"2026-09-10" },
    { number:"DEMO-INV-002", client:cedar, total:96000, paid:0, due:"2026-09-18" },
    { number:"DEMO-INV-003", client:atlas, total:142500, paid:60000, due:"2026-09-25" },
  ]) {
    await sql`INSERT INTO invoices (invoice_number, client_id, total, paid_amount, due_date) VALUES (${invoice.number}, ${invoice.client.id}, ${invoice.total}, ${invoice.paid}, ${invoice.due}) ON CONFLICT (invoice_number) DO NOTHING`;
  }

  for (const followup of [
    { lead:"Aditi Kapoor", company:"Northstar Ventures", type:"Phone Call", date:"2026-09-03", time:"10:30 AM", priority:"High" },
    { lead:"Dev Shah", company:"Meridian Labs", type:"Meeting", date:"2026-09-04", time:"03:00 PM", priority:"Medium" },
    { lead:"Rohan Malhotra", company:"Cedar & Co.", type:"Email", date:"2026-09-05", time:"11:00 AM", priority:"Medium" },
  ]) {
    const existing = await sql`SELECT id FROM followups WHERE lead_name = ${followup.lead} AND followup_date = ${followup.date} AND type = ${followup.type} LIMIT 1`;
    if (!existing[0]) await sql`INSERT INTO followups (lead_name, company, type, followup_date, followup_time, assigned_to, priority, status, notes) VALUES (${followup.lead}, ${followup.company}, ${followup.type}, ${followup.date}, ${followup.time}, ${"ZootechX Team"}, ${followup.priority}, ${"Scheduled"}, ${"Demo follow-up"})`;
  }

  // Seed marketing campaigns if empty
  const existingCamps = await sql`SELECT id FROM marketing_campaigns LIMIT 1`;
  if (!existingCamps[0]) {
    for (const c of [
      { name: "Enterprise ERP Search Acquisition", platform: "Google Ads", channel: "Search Intent", objective: "LEAD_GENERATION", status: "ACTIVE", budget: 15000, spend: 12450, impressions: 84200, clicks: 4120, conversions: 384, roas: 5.42, target_audience: "CTOs, CFOs, VPs in Manufacturing & Retail", start_date: "2026-08-01", end_date: "2026-09-30" },
      { name: "High-Intent Retargeting & Brand Uplift", platform: "Meta Ads", channel: "Instagram & FB", objective: "CONVERSIONS", status: "ACTIVE", budget: 10000, spend: 8420, impressions: 192000, clicks: 6240, conversions: 265, roas: 4.25, target_audience: "Website Visitors (Past 60d), Pricing Page Dropped-off Users", start_date: "2026-08-10", end_date: "2026-09-25" },
      { name: "C-Suite & Tech Leadership InMail Suite", platform: "LinkedIn Ads", channel: "Sponsored InMail", objective: "LEAD_GENERATION", status: "ACTIVE", budget: 12000, spend: 9680, impressions: 48000, clicks: 1850, conversions: 218, roas: 6.18, target_audience: "Founders, MDs, Partners at Series A-C Companies", start_date: "2026-08-05", end_date: "2026-09-20" },
      { name: "Next-Gen Cloud Architecture Showcase", platform: "YouTube Ads", channel: "In-Stream TrueView", objective: "BRAND_AWARENESS", status: "ACTIVE", budget: 8000, spend: 5620, impressions: 310000, clicks: 3410, conversions: 142, roas: 3.84, target_audience: "Enterprise Software Architects & DevOps Leads", start_date: "2026-08-15", end_date: "2026-09-15" },
      { name: "Executive Summit & VIP Demo Registration", platform: "Google Ads", channel: "Performance Max", objective: "CONVERSIONS", status: "PAUSED", budget: 5000, spend: 6000, impressions: 65000, clicks: 2200, conversions: 113, roas: 4.80, target_audience: "Delegates & Registrants for Q3 Tech Conclave", start_date: "2026-07-15", end_date: "2026-08-30" },
    ]) {
      await sql`INSERT INTO marketing_campaigns (name, platform, channel, objective, status, budget, spend, impressions, clicks, conversions, roas, target_audience, start_date, end_date) VALUES (${c.name}, ${c.platform}, ${c.channel}, ${c.objective}, ${c.status}, ${c.budget}, ${c.spend}, ${c.impressions}, ${c.clicks}, ${c.conversions}, ${c.roas}, ${c.target_audience}, ${c.start_date}, ${c.end_date})`;
    }

    for (const cr of [
      { title: "10x Faster Invoicing Engine Visual", format: "Single Image", headline: "Stop Wasting 15 Hours Weekly on Legacy ERP Invoicing", primary_text: "Discover ZootechX.ai: Automated GST compliance, real-time developer metrics, and instant payment reconciliation.", cta: "Book Executive Demo", ctr: 5.12, conversion_rate: 8.85, preview_badge: "Top Performer", status: "ACTIVE" },
      { title: "Dark Mode Executive Dashboard Teaser", format: "Video", headline: "The Luxury Command Center Your Business Deserves", primary_text: "Experience frictionless client pipeline visibility with aerospace-grade telemetry and instant Neon Postgres cloud sync.", cta: "Explore Live Tour", ctr: 4.82, conversion_rate: 7.64, preview_badge: "Viral Hook", status: "ACTIVE" },
      { title: "C-Suite Case Study Carousel", format: "Carousel", headline: "How 120+ Enterprises Cut Closing Times by 40%", primary_text: "Swipe through verified transformation metrics from Northstar Ventures, Cedar & Co., and Atlas Retail.", cta: "Read Case Study", ctr: 6.45, conversion_rate: 9.30, preview_badge: "Highest ROAS", status: "ACTIVE" },
      { title: "Engineering Speed Benchmark 60s Reel", format: "Story", headline: "From Quotation to GST Invoice in Under 60 Seconds", primary_text: "Watch our product lead create, audit, and dispatch an enterprise GST quotation in real-time.", cta: "Start 14-Day Pilot", ctr: 3.95, conversion_rate: 5.40, preview_badge: "Scaling Fast", status: "ACTIVE" },
    ]) {
      await sql`INSERT INTO marketing_creatives (title, format, headline, primary_text, cta, ctr, conversion_rate, preview_badge, status) VALUES (${cr.title}, ${cr.format}, ${cr.headline}, ${cr.primary_text}, ${cr.cta}, ${cr.ctr}, ${cr.conversion_rate}, ${cr.preview_badge}, ${cr.status})`;
    }

    for (const l of [
      { campaign_name: "Enterprise ERP Search Acquisition", platform: "Google Ads", lead_name: "Vikram Singhania", company: "Singhania Logistics Corp", email: "vikram.s@singhanialogistics.com", phone: "+91 98200 44102", quality_score: "HOT", status: "NEW", synced_to_crm: false },
      { campaign_name: "C-Suite & Tech Leadership InMail Suite", platform: "LinkedIn Ads", lead_name: "Elena Rostova", company: "Apex Global FinTech", email: "elena.rostova@apexfintech.io", phone: "+1 415 890 2314", quality_score: "HOT", status: "QUALIFIED", synced_to_crm: false },
      { campaign_name: "High-Intent Retargeting & Brand Uplift", platform: "Meta Ads", lead_name: "Rahul Kothari", company: "Kothari Infra Build", email: "rahul@kothari-infra.com", phone: "+91 99301 88204", quality_score: "HIGH_INTENT", status: "NEW", synced_to_crm: false },
      { campaign_name: "Enterprise ERP Search Acquisition", platform: "Google Ads", lead_name: "Pooja Deshmukh", company: "Nova Pharma Tech", email: "pooja.d@novapharma.in", phone: "+91 97654 32190", quality_score: "HIGH_INTENT", status: "NEW", synced_to_crm: false },
      { campaign_name: "Next-Gen Cloud Architecture Showcase", platform: "YouTube Ads", lead_name: "Arthur Pendelton", company: "Vanguard Systems UK", email: "arthur.p@vanguardsys.co.uk", phone: "+44 20 7946 0912", quality_score: "WARM", status: "NEW", synced_to_crm: false },
    ]) {
      await sql`INSERT INTO marketing_leads (campaign_name, platform, lead_name, company, email, phone, quality_score, status, synced_to_crm) VALUES (${l.campaign_name}, ${l.platform}, ${l.lead_name}, ${l.company}, ${l.email}, ${l.phone}, ${l.quality_score}, ${l.status}, ${l.synced_to_crm})`;
    }
  }

  console.log("Development users, CRM demo data, and Digital Marketing records seeded.");
}
seed().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
