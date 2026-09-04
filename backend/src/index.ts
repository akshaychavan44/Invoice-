import "dotenv/config";
import bcrypt from "bcryptjs";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import cors from "cors";
import express, { Request, Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { z } from "zod";
import { allow, AuthRequest, requireAuth, signToken } from "./auth";
import { sql } from "./db/client";
import {
  addFallbackClient,
  addFallbackExpense,
  addFallbackFollowup,
  addFallbackInvoice,
  addFallbackLead,
  addFallbackPayment,
  addFallbackQuotation,
  completeFallbackFollowup,
  convertFallbackLead,
  deleteFallbackFollowup,
  deleteFallbackLead,
  listFallbackClients,
  listFallbackExpenses,
  listFallbackFollowups,
  listFallbackInvoices,
  listFallbackLeads,
  listFallbackPayments,
  listFallbackQuotations,
  updateFallbackFollowup,
  updateFallbackLead,
} from "./db/crmFallback";
import { addFallbackUpdate, createFallbackDeveloper, createFallbackProject, fallbackDeveloperOverview, fallbackProject, findFallbackDeveloper, listFallbackProjects, listFallbackUpdates, removeFallbackDeveloper, setFallbackProjectStatus } from "./db/deliveryFallback";

async function withDbTimeout<T>(promise: Promise<T>, ms = 1200): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Database timeout")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

import {
  addMarketingClient,
  addMarketingClientAsset,
  addMarketingClientProject,
  createMarketingCampaign,
  createMarketingCreative,
  deleteMarketingCampaign,
  deleteMarketingClient,
  deleteMarketingClientAsset,
  deleteMarketingClientProject,
  deleteMarketingCreative,
  getMarketingClientsOverview,
  getMarketingOverview,
  getUnsyncedMarketingLeads,
  listMarketingCampaigns,
  listMarketingClientAssets,
  listMarketingClientProjects,
  listMarketingClients,
  listMarketingCreatives,
  listMarketingLeads,
  markMarketingLeadSynced,
  toggleMarketingCampaignStatus,
  updateMarketingCampaign,
  updateMarketingClient,
  updateMarketingClientAsset,
  updateMarketingClientProject,
} from "./db/marketingFallback";
import { findDemoUser, isDemoPassword } from "./demoUsers";
type UserRow = { id: string; name: string; email: string; role: "SUPER_ADMIN" | "SUB_ADMIN" | "SALES" | "DEVELOPER" | "DIGITAL_MARKETING"; password_hash: string; must_change_password?: boolean; is_active?: boolean };
const app = express();
const frontendOrigin = process.env.FRONTEND_URL ?? "http://localhost:3000";
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    // Permit the configured deployment plus any local Next.js development port.
    if (!origin || origin === frontendOrigin || /^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
    return callback(new Error("Origin not allowed by CORS"));
  },
}));
app.use(express.json({ limit: "1mb" })); app.use(rateLimit({ windowMs: 900_000, limit: 5_000, standardHeaders: "draft-7" }));
const login = z.object({ email: z.string().email(), password: z.string().min(8) });
const changePasswordInput = z.object({ currentPassword: z.string().min(8), newPassword: z.string().min(8).max(128) });
const leadInput = z.object({ fullName: z.string().min(2), company: z.string().max(160).optional(), email: z.string().email().optional(), phone: z.string().max(30).optional(), source: z.string().min(2), notes: z.string().optional(), status: z.enum(["NEW", "CONTACTED", "FOLLOW_UP", "INTERESTED", "QUOTATION_SENT", "NEGOTIATION", "CONVERTED", "LOST"]).optional() });
const leadStatus = z.enum(["NEW", "CONTACTED", "FOLLOW_UP", "INTERESTED", "QUOTATION_SENT", "NEGOTIATION", "CONVERTED", "LOST"]);
const leadUpdateInput = z.object({ fullName: z.string().min(2).optional(), company: z.string().max(160).nullable().optional(), email: z.string().email().nullable().optional(), phone: z.string().max(30).nullable().optional(), source: z.string().min(2).optional(), notes: z.string().nullable().optional(), status: leadStatus.optional() }).refine(data => Object.keys(data).length > 0, { message: "At least one lead field is required" });
const followupInput = z.object({ leadId: z.string().optional(), leadName: z.string().min(2).max(160), company: z.string().max(160).optional(), property: z.string().max(300).optional(), type: z.string().min(2).max(40), date: z.string().date(), time: z.string().max(32).optional(), assignedTo: z.string().max(120).optional(), priority: z.string().max(20).optional(), status: z.string().max(30).optional(), notes: z.string().max(2000).optional() });
const followupUpdateInput = z.object({ leadName: z.string().min(2).max(160).optional(), company: z.string().max(160).nullable().optional(), property: z.string().max(300).nullable().optional(), type: z.string().min(2).max(40).optional(), date: z.string().date().optional(), time: z.string().max(32).nullable().optional(), assignedTo: z.string().max(120).nullable().optional(), priority: z.string().max(20).nullable().optional(), status: z.string().max(30).optional(), notes: z.string().max(2000).nullable().optional(), completed: z.boolean().optional() }).refine(data => Object.keys(data).length > 0, { message: "At least one follow-up field is required" });
const clientInput = z.object({ name: z.string().min(2), company: z.string().max(160).optional(), email: z.string().email().optional(), phone: z.string().min(5).max(30), gstNumber: z.string().max(30).optional() });
const quotationInput = z.object({ clientId: z.string().uuid().optional(), clientName: z.string().min(2).max(160), amount: z.number().positive(), validUntil: z.string().date(), status: z.enum(["Draft", "Sent", "Accepted"]).default("Draft") });
const invoiceInput = z.object({ invoiceNumber: z.string().min(3).max(32), clientId: z.string().min(1), clientName: z.string().min(1).max(160).optional(), total: z.number().positive(), paidAmount: z.number().min(0).optional(), dueDate: z.string().datetime() });
const expenseInput = z.object({ title: z.string().min(2).max(160), category: z.string().min(2).max(80), amount: z.number().positive(), expenseDate: z.string().date().optional(), paymentMethod: z.string().min(2).max(40).optional(), description: z.string().max(2000).optional() });
const paymentInput = z.object({ invoiceId: z.string().uuid(), amount: z.number().positive(), method: z.enum(["Cash", "UPI", "Bank Transfer", "Cheque"]), paymentDate: z.string().date().optional(), notes: z.string().max(2000).optional() });
const developerInput = z.object({ name: z.string().min(2).max(120), email: z.string().email(), password: z.string().min(8) });
const projectStatus = z.enum(["NEW", "PENDING", "IN_PROGRESS", "COMPLETED"]);
const projectInput = z.object({ name: z.string().min(2).max(160), clientName: z.string().max(160).optional(), description: z.string().max(5000).optional(), priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"), status: projectStatus.default("NEW"), dueDate: z.string().date().optional(), assignedDeveloperId: z.string().uuid() });
const projectStatusInput = z.object({ status: projectStatus });
const projectUpdateInput = z.object({ message: z.string().max(5000).optional().default(""), progress: z.number().int().min(0).max(100), status: projectStatus.optional() });
const vaultItemInput = z.object({ label: z.string().min(2).max(120), service: z.string().min(2).max(160), username: z.string().min(1).max(500), secret: z.string().min(1).max(4000), notes: z.string().max(2000).optional() });
const campaignInput = z.object({
  name: z.string().min(2).max(160),
  platform: z.string().min(2).max(60),
  channel: z.string().min(2).max(60),
  objective: z.string().min(2).max(60),
  budget: z.number().positive(),
  targetAudience: z.string().max(500).optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
});
const campaignUpdateInput = z.object({
  name: z.string().min(2).max(160).optional(),
  budget: z.number().positive().optional(),
  status: z.enum(["ACTIVE", "PAUSED", "COMPLETED"]).optional(),
  targetAudience: z.string().max(500).optional(),
  channel: z.string().max(60).optional(),
  platform: z.string().max(60).optional(),
}).refine(data => Object.keys(data).length > 0, { message: "At least one field is required for update" });
const creativeInput = z.object({
  campaignId: z.string().optional(),
  title: z.string().min(2).max(160),
  format: z.enum(["Video", "Carousel", "Single Image", "Story"]),
  headline: z.string().min(2).max(300),
  primaryText: z.string().min(2).max(2000),
  cta: z.string().min(2).max(60),
});
const vaultKey = (): Buffer => {
  const value = process.env.VAULT_ENCRYPTION_KEY;
  if (value) {
    try {
      const key = Buffer.from(value, "base64");
      if (key.length === 32) return key;
    } catch {}
    return createHash("sha256").update(value).digest();
  }
  const fallbackSeed = process.env.JWT_SECRET || "zootechx-secure-vault-encryption-seed-2026";
  return createHash("sha256").update(fallbackSeed).digest();
};
const encryptVaultValue = (value: string, key: Buffer, iv: Buffer) => { const cipher = createCipheriv("aes-256-gcm", key, iv); return { value: Buffer.concat([cipher.update(value, "utf8"), cipher.final()]).toString("base64"), tag: cipher.getAuthTag().toString("base64") }; };
const decryptVaultValue = (value: string, tag: string, key: Buffer, iv: Buffer) => { const decipher = createDecipheriv("aes-256-gcm", key, iv); decipher.setAuthTag(Buffer.from(tag, "base64")); return Buffer.concat([decipher.update(Buffer.from(value, "base64")), decipher.final()]).toString("utf8"); };
app.get("/api/health", async (_request, response) => {
  try {
    await withDbTimeout(sql`SELECT 1`, 800);
    response.json({ status: "ok", database: "neon" });
  } catch {
    response.json({ status: "ok", database: "offline_fallback" });
  }
});
app.post("/api/auth/login", async (request: Request, response: Response) => {
  const parsed = login.safeParse(request.body);
  if (!parsed.success) { response.status(400).json({ message: "Valid email and password are required" }); return; }
  const email = parsed.data.email.toLowerCase();
  const password = parsed.data.password;

  // 1. Check known demo accounts with demo password
  const demoUser = findDemoUser(email);
  if (demoUser && isDemoPassword(password)) {
    try {
      const rows = await withDbTimeout(sql`SELECT id, name, email, role, must_change_password, is_active FROM users WHERE email = ${email} LIMIT 1`, 800);
      if (rows[0]) {
        const u = rows[0] as UserRow;
        response.json({ token: signToken(u.id, u.role), mustChangePassword: Boolean(u.must_change_password), user: { id: u.id, name: u.name, email: u.email, role: u.role } });
        return;
      }
    } catch {}
    response.json({ token: signToken(demoUser.id, demoUser.role), mustChangePassword: false, user: demoUser, demo: true });
    return;
  }

  // 2. Query database for registered user accounts
  try {
    const rows = await withDbTimeout(sql`SELECT id, name, email, role, password_hash, must_change_password, is_active FROM users WHERE email = ${email} LIMIT 1`, 1000);
    const user = rows[0] as UserRow | undefined;
    if (!user || !(await bcrypt.compare(password, user.password_hash))) { response.status(401).json({ message: "Invalid email or password" }); return; }
    if (!user.is_active) { response.status(403).json({ message:"This developer account is inactive. Contact your Super Admin." }); return; }
    response.json({ token: signToken(user.id, user.role), mustChangePassword: Boolean(user.must_change_password), user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch {
    const fallbackDeveloper = await findFallbackDeveloper(email);
    if (fallbackDeveloper && await bcrypt.compare(password, fallbackDeveloper.password_hash)) {
      response.json({ token: signToken(fallbackDeveloper.id, fallbackDeveloper.role), user: { id: fallbackDeveloper.id, name: fallbackDeveloper.name, email: fallbackDeveloper.email, role: fallbackDeveloper.role }, fallback: true });
      return;
    }
    if (demoUser && isDemoPassword(password)) {
      response.json({ token: signToken(demoUser.id, demoUser.role), user: demoUser, offline: true });
      return;
    }
    response.status(503).json({ message: "The database is unavailable and this account cannot use offline access." });
  }
});
app.post("/api/auth/change-password", requireAuth, async (request: AuthRequest, response: Response) => {
  const parsed = changePasswordInput.safeParse(request.body);
  if (!parsed.success) { response.status(400).json({ message: "Current and new passwords must be at least 8 characters." }); return; }
  if (parsed.data.currentPassword === parsed.data.newPassword) { response.status(400).json({ message: "Your new password must be different from your current password." }); return; }
  try {
    const users = await withDbTimeout(sql`SELECT id, password_hash FROM users WHERE id = ${request.user!.id} LIMIT 1`, 1000);
    const user = users[0] as { id: string; password_hash: string } | undefined;
    if (!user) { response.status(404).json({ message: "Account not found." }); return; }
    if (!(await bcrypt.compare(parsed.data.currentPassword, user.password_hash))) { response.status(401).json({ message: "Your current password is incorrect." }); return; }
    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
    await withDbTimeout(sql`UPDATE users SET password_hash = ${passwordHash}, must_change_password = false, updated_at = now() WHERE id = ${request.user!.id}`, 1000);
    response.json({ message: "Password changed successfully." });
  } catch {
    response.status(503).json({ message: "Unable to change password right now." });
  }
});
app.get("/api/auth/me", requireAuth, async (request: AuthRequest, response) => {
  try {
    const rows = await withDbTimeout(sql`SELECT id, name, email, role FROM users WHERE id = ${request.user!.id} LIMIT 1`, 800);
    response.json({ user: rows[0] ?? findDemoUser(request.user!.id) ?? null });
  } catch {
    response.json({ user: findDemoUser(request.user!.id) ?? null, offline: true });
  }
});
type MemoryNotification = {
  id: string;
  user_id?: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  hidden_from_bell?: boolean;
};

const memoryNotifications: MemoryNotification[] = [];

export function recordNotification(title: string, message: string, userId?: string) {
  const notif: MemoryNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    user_id: userId,
    title,
    message,
    is_read: false,
    created_at: new Date().toISOString(),
    hidden_from_bell: false,
  };
  memoryNotifications.unshift(notif);
  if (memoryNotifications.length > 50) memoryNotifications.pop();

  if (userId) {
    withDbTimeout(sql`INSERT INTO notifications (user_id, title, message, is_read, created_at) VALUES (${userId}, ${title}, ${message}, false, now())`, 800).catch(() => {});
  }
}

app.get("/api/notifications", requireAuth, async (request: AuthRequest, response) => {
  let dbRows: any[] = [];
  try {
    dbRows = await withDbTimeout(sql`SELECT id, user_id, title, message, is_read, created_at FROM notifications WHERE (user_id = ${request.user!.id} OR user_id IS NULL) AND hidden_from_bell = false AND NOT (is_read = true AND created_at < now() - interval '7 days') ORDER BY created_at DESC LIMIT 30`, 800);
  } catch {
    dbRows = [];
  }

  const combined: MemoryNotification[] = [...dbRows];
  const seenIds = new Set(dbRows.map((r: any) => String(r.id)));

  for (const m of memoryNotifications) {
    if (!m.hidden_from_bell && (!m.user_id || m.user_id === request.user!.id) && !seenIds.has(m.id)) {
      combined.push(m);
      seenIds.add(m.id);
    }
  }

  // Synthesize live real-time notifications from CRM entities if list is small
  if (combined.length < 3) {
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      const followups = await withDbTimeout(sql`SELECT id, lead_name, company, followup_date, status FROM followups WHERE status != 'Completed' ORDER BY followup_date ASC LIMIT 3`, 600)
        .catch(async () => (await listFallbackFollowups()).filter(f => f.status !== "Completed").slice(0, 3));

      for (const f of followups) {
        const isOverdue = f.followup_date < todayStr;
        const title = isOverdue ? "Follow-up Overdue" : "Follow-up Scheduled";
        const msg = `${f.lead_name}${f.company ? ` (${f.company})` : ""} is ${isOverdue ? "overdue since" : "due on"} ${f.followup_date}`;
        const autoId = `auto-f-${f.id}`;
        const fDate = new Date(f.followup_date);
        const autoCreated = !isNaN(fDate.getTime()) ? fDate.toISOString() : new Date(Date.now() - 3600000).toISOString();
        if (!seenIds.has(autoId)) {
          combined.push({
            id: autoId,
            user_id: request.user!.id,
            title,
            message: msg,
            is_read: false,
            created_at: autoCreated,
          });
          seenIds.add(autoId);
        }
      }

      const invoices = await withDbTimeout(sql`SELECT id, invoice_number, client_name, total, paid_amount, due_date, created_at FROM invoices ORDER BY created_at DESC LIMIT 3`, 600)
        .catch(async () => (await listFallbackInvoices()).slice(0, 3));

      for (const inv of invoices) {
        const isUnpaid = Number(inv.paid_amount || 0) < Number(inv.total || 0);
        const title = isUnpaid ? "Invoice Payment Pending" : "Invoice Paid";
        const msg = `${inv.invoice_number} for ${inv.client_name} (₹${Number(inv.total).toLocaleString()})`;
        const autoId = `auto-i-${inv.id}`;
        if (!seenIds.has(autoId)) {
          combined.push({
            id: autoId,
            user_id: request.user!.id,
            title,
            message: msg,
            is_read: !isUnpaid,
            created_at: inv.created_at || new Date(Date.now() - 7200000).toISOString(),
          });
          seenIds.add(autoId);
        }
      }

      const leads = await withDbTimeout(sql`SELECT id, full_name, company, status, created_at FROM leads ORDER BY created_at DESC LIMIT 2`, 600)
        .catch(async () => (await listFallbackLeads()).slice(0, 2));

      for (const l of leads) {
        const title = "New Lead Activity";
        const msg = `${l.full_name}${l.company ? ` from ${l.company}` : ""} status: ${l.status}`;
        const autoId = `auto-l-${l.id}`;
        if (!seenIds.has(autoId)) {
          combined.push({
            id: autoId,
            user_id: request.user!.id,
            title,
            message: msg,
            is_read: false,
            created_at: l.created_at || new Date(Date.now() - 10800000).toISOString(),
          });
          seenIds.add(autoId);
        }
      }
    } catch {}
  }

  combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  response.json({ data: combined.slice(0, 25) });
});

app.get("/api/notifications/history", requireAuth, async (request: AuthRequest, response) => {
  try {
    const rows = await withDbTimeout(sql`SELECT id, user_id, title, message, is_read, created_at FROM notifications WHERE user_id = ${request.user!.id} ORDER BY created_at DESC`, 800);
    response.json({ data: rows });
  } catch {
    response.json({ data: memoryNotifications.filter(m => !m.user_id || m.user_id === request.user!.id) });
  }
});

app.patch("/api/notifications/:id/read", requireAuth, async (request: AuthRequest, response) => {
  const notifId = String(request.params.id);
  const mem = memoryNotifications.find(m => m.id === notifId);
  if (mem) mem.is_read = true;
  try {
    const rows = await withDbTimeout(sql`UPDATE notifications SET is_read = true WHERE id = ${notifId} AND user_id = ${request.user!.id} RETURNING id, user_id, title, message, is_read, created_at`, 800);
    response.json({ data: rows[0] || { id: notifId, is_read: true } });
  } catch {
    response.json({ data: { id: notifId, is_read: true } });
  }
});

app.post("/api/notifications/read-all", requireAuth, async (request: AuthRequest, response) => {
  for (const m of memoryNotifications) {
    if (!m.user_id || m.user_id === request.user!.id) m.is_read = true;
  }
  try {
    await withDbTimeout(sql`UPDATE notifications SET is_read = true WHERE user_id = ${request.user!.id} AND is_read = false`, 800);
  } catch {}
  response.status(204).send();
});

app.post("/api/notifications/clear-read", requireAuth, async (request: AuthRequest, response) => {
  for (let i = memoryNotifications.length - 1; i >= 0; i--) {
    if (memoryNotifications[i].is_read && (!memoryNotifications[i].user_id || memoryNotifications[i].user_id === request.user!.id)) {
      memoryNotifications[i].hidden_from_bell = true;
    }
  }
  try {
    await withDbTimeout(sql`UPDATE notifications SET hidden_from_bell = true WHERE user_id = ${request.user!.id} AND is_read = true`, 800);
  } catch {}
  response.status(204).send();
});
app.get("/api/leads", requireAuth, async (_request: AuthRequest, response) => {
  try {
    const rows = await withDbTimeout(sql`SELECT * FROM leads ORDER BY created_at DESC`, 1200);
    response.json({ data: rows });
  } catch {
    const fallback = await listFallbackLeads();
    response.json({ data: fallback, offline: true });
  }
});
app.post("/api/leads", requireAuth, allow("SUPER_ADMIN", "SUB_ADMIN", "SALES"), async (request: AuthRequest, response) => {
  const parsed = leadInput.safeParse(request.body);
  if (!parsed.success) { response.status(400).json({ message: "Invalid lead", errors: parsed.error.flatten() }); return; }
  const data = parsed.data;
  try {
    const rows = await withDbTimeout(sql`INSERT INTO leads (full_name, company, email, phone, source, notes, status, assigned_to_id) VALUES (${data.fullName}, ${data.company ?? null}, ${data.email ?? null}, ${data.phone ?? null}, ${data.source}, ${data.notes ?? null}, ${data.status ?? "NEW"}, ${request.user!.id}) RETURNING *`, 1200);
    recordNotification("New Lead Created", `${data.fullName}${data.company ? ` (${data.company})` : ""} was added to CRM`, request.user!.id);
    response.status(201).json({ data: rows[0] });
  } catch {
    const lead = await addFallbackLead({
      full_name: data.fullName,
      company: data.company ?? null,
      email: data.email ?? null,
      phone: data.phone ?? null,
      source: data.source,
      notes: data.notes ?? null,
      assigned_to_id: request.user!.id,
    });
    recordNotification("New Lead Created", `${data.fullName}${data.company ? ` (${data.company})` : ""} was added to CRM`, request.user!.id);
    response.status(201).json({ data: lead, fallback: true });
  }
});
app.patch("/api/leads/:id", requireAuth, allow("SUPER_ADMIN", "SUB_ADMIN", "SALES"), async (request, response) => {
  const parsed = leadUpdateInput.safeParse(request.body);
  if (!parsed.success) { response.status(400).json({ message:"Invalid lead update", errors:parsed.error.flatten() }); return; }
  const data = parsed.data;
  try {
    const rows = await withDbTimeout(sql`UPDATE leads SET full_name = COALESCE(${data.fullName ?? null}, full_name), company = CASE WHEN ${data.company !== undefined} THEN ${data.company ?? null} ELSE company END, email = CASE WHEN ${data.email !== undefined} THEN ${data.email ?? null} ELSE email END, phone = CASE WHEN ${data.phone !== undefined} THEN ${data.phone ?? null} ELSE phone END, source = COALESCE(${data.source ?? null}, source), notes = CASE WHEN ${data.notes !== undefined} THEN ${data.notes ?? null} ELSE notes END, status = COALESCE(${data.status ?? null}, status) WHERE id = ${String(request.params.id)} RETURNING *`, 1200);
    if (!rows[0]) { response.status(404).json({ message:"Lead not found" }); return; }
    response.json({ data:rows[0] });
  } catch {
    const updated = await updateFallbackLead(String(request.params.id), {
      ...(data.fullName ? { full_name: data.fullName } : {}),
      ...(data.company !== undefined ? { company: data.company } : {}),
      ...(data.email !== undefined ? { email: data.email } : {}),
      ...(data.phone !== undefined ? { phone: data.phone } : {}),
      ...(data.source ? { source: data.source } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      ...(data.status ? { status: data.status } : {}),
    });
    if (!updated) { response.status(404).json({ message:"Lead not found" }); return; }
    response.json({ data: updated, fallback: true });
  }
});
app.delete("/api/leads/:id", requireAuth, allow("SUPER_ADMIN", "SUB_ADMIN", "SALES"), async (request, response) => {
  try {
    const rows = await withDbTimeout(sql`DELETE FROM leads WHERE id = ${String(request.params.id)} RETURNING id`, 1200);
    if (!rows[0]) { response.status(404).json({ message:"Lead not found" }); return; }
    response.status(204).send();
  } catch {
    const deleted = await deleteFallbackLead(String(request.params.id));
    if (!deleted) { response.status(404).json({ message:"Lead not found" }); return; }
    response.status(204).send();
  }
});
app.post("/api/leads/:id/convert", requireAuth, allow("SUPER_ADMIN", "SUB_ADMIN", "SALES"), async (request: AuthRequest, response) => {
  try {
    const rows = await withDbTimeout(sql`
      WITH source_lead AS (
        SELECT id, full_name, company, email, phone FROM leads
        WHERE id = ${String(request.params.id)} AND customer_id IS NULL AND status <> 'CONVERTED'::lead_status
        FOR UPDATE
      ), existing_client AS (
        SELECT clients.* FROM clients JOIN source_lead ON clients.name = source_lead.full_name AND clients.email IS NOT DISTINCT FROM source_lead.email LIMIT 1
      ), new_client AS (
        INSERT INTO clients (name, company, email, phone)
        SELECT full_name, company, email, phone FROM source_lead WHERE NOT EXISTS (SELECT 1 FROM existing_client)
        RETURNING *
      ), linked_client AS (
        SELECT * FROM existing_client UNION ALL SELECT * FROM new_client
      ), converted_lead AS (
        UPDATE leads SET status = 'CONVERTED', customer_id = (SELECT id FROM linked_client LIMIT 1), converted_at = now()
        WHERE id = (SELECT id FROM source_lead) RETURNING *
      ) SELECT converted_lead.*, (SELECT row_to_json(linked_client) FROM linked_client LIMIT 1) AS client FROM converted_lead
    `, 1500);
    if (!rows[0]) {
      const lead = await sql`SELECT id, customer_id, status FROM leads WHERE id = ${String(request.params.id)} LIMIT 1`;
      response.status(lead[0] ? 409 : 404).json({ message:lead[0] ? "Lead has already been converted" : "Lead not found" }); return;
    }
    recordNotification("Lead Converted", `${rows[0].full_name || "Lead"} has been converted to an active client`, request.user!.id);
    response.json({ data:rows[0], client:rows[0].client });
  } catch {
    const res = await convertFallbackLead(String(request.params.id));
    if (!res) { response.status(404).json({ message: "Lead not found" }); return; }
    recordNotification("Lead Converted", `${res.full_name || "Lead"} has been converted to an active client`, request.user!.id);
    response.json({ data: res, client: res.client, fallback: true });
  }
});
app.get("/api/followups", requireAuth, allow("SUPER_ADMIN", "SUB_ADMIN", "SALES"), async (_request, response) => {
  try {
    const rows = await withDbTimeout(sql`SELECT * FROM followups ORDER BY followup_date ASC, followup_time ASC NULLS LAST`, 1200);
    response.json({ data: rows });
  } catch {
    response.json({ data: await listFallbackFollowups(), fallback: true });
  }
});
app.post("/api/followups", requireAuth, allow("SUPER_ADMIN", "SUB_ADMIN", "SALES"), async (request: AuthRequest, response) => {
  const parsed = followupInput.safeParse(request.body);
  if (!parsed.success) { response.status(400).json({ message: "Invalid follow-up", errors: parsed.error.flatten() }); return; }
  const data = parsed.data;
  try {
    const rows = await withDbTimeout(sql`INSERT INTO followups (lead_id, lead_name, company, property, type, followup_date, followup_time, assigned_to, priority, status, notes) VALUES (${data.leadId ?? null}, ${data.leadName}, ${data.company ?? null}, ${data.property ?? null}, ${data.type}, ${data.date}, ${data.time ?? null}, ${data.assignedTo ?? null}, ${data.priority ?? null}, ${data.status ?? "Scheduled"}, ${data.notes ?? null}) RETURNING *`, 1200);
    recordNotification("Follow-up Scheduled", `Follow-up with ${data.leadName} scheduled for ${data.date}`, request.user!.id);
    response.status(201).json({ data: rows[0] });
  } catch {
    const followup = await addFallbackFollowup({
      lead_id: data.leadId ?? null,
      lead_name: data.leadName,
      company: data.company ?? null,
      property: data.property ?? null,
      type: data.type,
      followup_date: data.date,
      followup_time: data.time ?? null,
      assigned_to: data.assignedTo ?? null,
      priority: data.priority ?? null,
      status: data.status ?? "Scheduled",
      notes: data.notes ?? null,
    });
    recordNotification("Follow-up Scheduled", `Follow-up with ${data.leadName} scheduled for ${data.date}`, request.user!.id);
    response.status(201).json({ data: followup, fallback: true });
  }
});
app.patch("/api/followups/:id", requireAuth, allow("SUPER_ADMIN", "SUB_ADMIN", "SALES"), async (request, response) => {
  const parsed = followupUpdateInput.safeParse(request.body);
  if (!parsed.success) { response.status(400).json({ message:"Invalid follow-up update", errors:parsed.error.flatten() }); return; }
  const data = parsed.data;
  try {
    const markCompleted = data.completed === true || data.status === "Completed";
    const rows = await withDbTimeout(sql`UPDATE followups SET lead_name = COALESCE(${data.leadName ?? null}, lead_name), company = CASE WHEN ${data.company !== undefined} THEN ${data.company ?? null} ELSE company END, property = CASE WHEN ${data.property !== undefined} THEN ${data.property ?? null} ELSE property END, type = COALESCE(${data.type ?? null}, type), followup_date = COALESCE(${data.date ?? null}, followup_date), followup_time = CASE WHEN ${data.time !== undefined} THEN ${data.time ?? null} ELSE followup_time END, assigned_to = CASE WHEN ${data.assignedTo !== undefined} THEN ${data.assignedTo ?? null} ELSE assigned_to END, priority = CASE WHEN ${data.priority !== undefined} THEN ${data.priority ?? null} ELSE priority END, status = CASE WHEN ${markCompleted} THEN 'Completed' WHEN ${data.status ?? null} IS NOT NULL THEN ${data.status ?? null} ELSE status END, notes = CASE WHEN ${data.notes !== undefined} THEN ${data.notes ?? null} ELSE notes END, completed_at = CASE WHEN ${markCompleted} THEN COALESCE(completed_at, now()) WHEN ${data.completed === false} THEN NULL ELSE completed_at END, updated_at = now() WHERE id = ${String(request.params.id)} RETURNING *`, 1200);
    if (!rows[0]) { response.status(404).json({ message:"Follow-up not found" }); return; }
    response.json({ data:rows[0] });
  } catch {
    const markCompleted = data.completed === true || data.status === "Completed";
    const updated = await updateFallbackFollowup(String(request.params.id), {
      ...(data.leadName ? { lead_name: data.leadName } : {}),
      ...(data.company !== undefined ? { company: data.company } : {}),
      ...(data.property !== undefined ? { property: data.property } : {}),
      ...(data.type ? { type: data.type } : {}),
      ...(data.date ? { followup_date: data.date } : {}),
      ...(data.time !== undefined ? { followup_time: data.time } : {}),
      ...(data.assignedTo !== undefined ? { assigned_to: data.assignedTo } : {}),
      ...(data.priority !== undefined ? { priority: data.priority } : {}),
      ...(markCompleted ? { status: "Completed" } : data.status ? { status: data.status } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
    });
    if (!updated) { response.status(404).json({ message:"Follow-up not found" }); return; }
    response.json({ data: updated, fallback: true });
  }
});
app.post("/api/followups/:id/complete", requireAuth, allow("SUPER_ADMIN", "SUB_ADMIN", "SALES"), async (request: AuthRequest, response) => {
  try {
    const rows = await withDbTimeout(sql`UPDATE followups SET status = 'Completed', completed_at = COALESCE(completed_at, now()), updated_at = now() WHERE id = ${String(request.params.id)} RETURNING *`, 1200);
    if (!rows[0]) { response.status(404).json({ message:"Follow-up not found" }); return; }
    recordNotification("Follow-up Completed", `Follow-up with ${rows[0].lead_name || "lead"} marked as completed`, request.user!.id);
    response.json({ data:rows[0] });
  } catch {
    const updated = await completeFallbackFollowup(String(request.params.id));
    if (!updated) { response.status(404).json({ message:"Follow-up not found" }); return; }
    recordNotification("Follow-up Completed", `Follow-up with ${updated.lead_name || "lead"} marked as completed`, request.user!.id);
    response.json({ data: updated, fallback: true });
  }
});
app.delete("/api/followups/:id", requireAuth, allow("SUPER_ADMIN", "SUB_ADMIN", "SALES"), async (request, response) => {
  try {
    const rows = await withDbTimeout(sql`DELETE FROM followups WHERE id = ${String(request.params.id)} RETURNING id`, 1200);
    if (!rows[0]) { response.status(404).json({ message:"Follow-up not found" }); return; }
    response.status(204).send();
  } catch {
    const deleted = await deleteFallbackFollowup(String(request.params.id));
    if (!deleted) { response.status(404).json({ message:"Follow-up not found" }); return; }
    response.status(204).send();
  }
});
app.get("/api/clients", requireAuth, async (_request, response) => {
  try {
    const rows = await withDbTimeout(sql`SELECT * FROM clients ORDER BY created_at DESC`, 1200);
    response.json({ data: rows });
  } catch {
    response.json({ data: await listFallbackClients(), fallback: true });
  }
});
app.post("/api/clients", requireAuth, allow("SUPER_ADMIN", "SUB_ADMIN", "SALES"), async (request: AuthRequest, response) => {
  const parsed = clientInput.safeParse(request.body);
  if (!parsed.success) { response.status(400).json({ message: "Invalid client", errors: parsed.error.flatten() }); return; }
  const data = parsed.data;
  try {
    const rows = await withDbTimeout(sql`INSERT INTO clients (name, company, email, phone, gst_number) VALUES (${data.name}, ${data.company ?? null}, ${data.email ?? null}, ${data.phone}, ${data.gstNumber ?? null}) RETURNING *`, 1200);
    recordNotification("Client Onboarded", `${data.name}${data.company ? ` (${data.company})` : ""} was added to CRM`, request.user!.id);
    response.status(201).json({ data: rows[0] });
  } catch {
    const client = await addFallbackClient({
      name: data.name,
      company: data.company ?? null,
      email: data.email ?? null,
      phone: data.phone,
      gst_number: data.gstNumber ?? null,
    });
    recordNotification("Client Onboarded", `${data.name}${data.company ? ` (${data.company})` : ""} was added to CRM`, request.user!.id);
    response.status(201).json({ data: client, fallback: true });
  }
});
app.get("/api/quotations", requireAuth, allow("SUPER_ADMIN", "SUB_ADMIN", "SALES"), async (_request, response) => {
  try {
    const rows = await withDbTimeout(sql`SELECT * FROM quotations ORDER BY created_at DESC`, 1200);
    response.json({ data: rows });
  } catch {
    response.json({ data: await listFallbackQuotations(), fallback: true });
  }
});
app.post("/api/quotations", requireAuth, allow("SUPER_ADMIN", "SUB_ADMIN", "SALES"), async (request: AuthRequest, response) => {
  const parsed = quotationInput.safeParse(request.body);
  if (!parsed.success) { response.status(400).json({ message:"Invalid quotation", errors:parsed.error.flatten() }); return; }
  const data = parsed.data;
  try {
    if (data.clientId) {
      const client = await withDbTimeout(sql`SELECT id FROM clients WHERE id = ${data.clientId} LIMIT 1`, 800);
      if (!client[0]) { response.status(404).json({ message:"Client not found" }); return; }
    }
    const qNum = `Q-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const rows = await withDbTimeout(sql`INSERT INTO quotations (quotation_number, client_id, client_name, amount, valid_until, status) VALUES (${qNum}, ${data.clientId ?? null}, ${data.clientName}, ${data.amount}, ${data.validUntil}, ${data.status}) RETURNING *`, 1200);
    recordNotification("Quotation Generated", `Quotation #${qNum} (₹${Number(data.amount).toLocaleString()}) for ${data.clientName}`, request.user!.id);
    response.status(201).json({ data:rows[0] });
  } catch {
    const quotation = await addFallbackQuotation({
      quotation_number: `Q-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      client_id: data.clientId ?? null,
      client_name: data.clientName,
      amount: data.amount,
      valid_until: data.validUntil,
      status: data.status,
    });
    recordNotification("Quotation Generated", `Quotation #${quotation.quotation_number} (₹${Number(data.amount).toLocaleString()}) for ${data.clientName}`, request.user!.id);
    response.status(201).json({ data: quotation, fallback: true });
  }
});
app.get("/api/invoices", requireAuth, allow("SUPER_ADMIN", "SUB_ADMIN"), async (request: AuthRequest, response) => {
  try {
    const rows = request.user!.role === "SUPER_ADMIN"
      ? await withDbTimeout(sql`SELECT invoices.*, clients.name AS client_name, clients.company AS client_company FROM invoices JOIN clients ON clients.id = invoices.client_id ORDER BY invoices.created_at DESC`, 1200)
      : await withDbTimeout(sql`SELECT invoices.*, clients.name AS client_name, clients.company AS client_company FROM invoices JOIN clients ON clients.id = invoices.client_id WHERE invoices.created_by_id = ${request.user!.id} ORDER BY invoices.created_at DESC`, 1200);
    response.json({ data: rows });
  } catch {
    response.json({ data: await listFallbackInvoices(request.user!.role === "SUPER_ADMIN" ? undefined : request.user!.id), fallback: true });
  }
});
app.post("/api/invoices", requireAuth, allow("SUPER_ADMIN", "SUB_ADMIN"), async (request: AuthRequest, response) => {
  const parsed = invoiceInput.safeParse(request.body);
  if (!parsed.success) { response.status(400).json({ message: "Invalid invoice", errors: parsed.error.flatten() }); return; }
  const data = parsed.data;
  try {
    const creator = await withDbTimeout(sql`SELECT name FROM users WHERE id = ${request.user!.id} LIMIT 1`, 800);
    const creatorName = creator[0]?.name ?? (findDemoUser(request.user!.id)?.name || request.user!.role);
    const rows = await withDbTimeout(sql`INSERT INTO invoices (invoice_number, client_id, total, paid_amount, due_date, created_by_id, created_by_name) VALUES (${data.invoiceNumber}, ${data.clientId}, ${data.total}, ${data.paidAmount ?? 0}, ${data.dueDate}, ${request.user!.id}, ${creatorName}) RETURNING *`, 1200);
    recordNotification("Invoice Created", `Invoice #${data.invoiceNumber} for ${data.clientName ?? "Client"} (₹${Number(data.total).toLocaleString()})`, request.user!.id);
    response.status(201).json({ data: rows[0] });
  } catch {
    const invoice = await addFallbackInvoice({
      invoice_number: data.invoiceNumber,
      client_id: data.clientId,
      client_name: data.clientName ?? "Client",
      total: data.total,
      paid_amount: data.paidAmount ?? 0,
      due_date: data.dueDate,
      created_by_id: request.user!.id,
      created_by_name: findDemoUser(request.user!.id)?.name || request.user!.role,
    });
    recordNotification("Invoice Created", `Invoice #${data.invoiceNumber} for ${data.clientName ?? "Client"} (₹${Number(data.total).toLocaleString()})`, request.user!.id);
    response.status(201).json({ data: invoice, fallback: true });
  }
});
app.get("/api/expenses", requireAuth, allow("SUPER_ADMIN", "SUB_ADMIN"), async (_request, response) => {
  try {
    const rows = await withDbTimeout(sql`SELECT * FROM expenses ORDER BY expense_date DESC NULLS LAST, created_at DESC`, 1200);
    response.json({ data: rows });
  } catch {
    response.json({ data: await listFallbackExpenses(), fallback: true });
  }
});
app.post("/api/expenses", requireAuth, allow("SUPER_ADMIN", "SUB_ADMIN"), async (request: AuthRequest, response) => {
  const parsed = expenseInput.safeParse(request.body);
  if (!parsed.success) { response.status(400).json({ message: "Invalid expense", errors: parsed.error.flatten() }); return; }
  const data = parsed.data;
  try {
    const rows = await withDbTimeout(sql`INSERT INTO expenses (title, category, amount, expense_date, payment_method, description) VALUES (${data.title}, ${data.category}, ${data.amount}, ${data.expenseDate ?? null}, ${data.paymentMethod ?? null}, ${data.description ?? null}) RETURNING *`, 1200);
    response.status(201).json({ data: rows[0] });
  } catch {
    const expense = await addFallbackExpense({
      title: data.title,
      category: data.category,
      amount: data.amount,
      expense_date: data.expenseDate ?? null,
      payment_method: data.paymentMethod ?? null,
      description: data.description ?? null,
    });
    response.status(201).json({ data: expense, fallback: true });
  }
});
app.get("/api/payments", requireAuth, allow("SUPER_ADMIN", "SUB_ADMIN"), async (request: AuthRequest, response) => {
  try {
    const rows = request.user!.role === "SUPER_ADMIN"
      ? await withDbTimeout(sql`SELECT payments.*, invoices.invoice_number FROM payments JOIN invoices ON invoices.id = payments.invoice_id ORDER BY payments.created_at DESC`, 1200)
      : await withDbTimeout(sql`SELECT payments.*, invoices.invoice_number FROM payments JOIN invoices ON invoices.id = payments.invoice_id WHERE payments.created_by_id = ${request.user!.id} ORDER BY payments.created_at DESC`, 1200);
    response.json({ data: rows });
  } catch {
    response.json({ data: await listFallbackPayments(), fallback: true });
  }
});
app.get("/api/payments/summary", requireAuth, allow("SUPER_ADMIN", "SUB_ADMIN"), async (request: AuthRequest, response) => {
  const summary = "SELECT i.id AS invoice_id, i.invoice_number, i.total AS invoice_total, i.created_by_name AS invoice_created_by_name, c.name AS client_name, c.company AS client_company, i.due_date, COALESCE(SUM(p.amount), 0) AS total_paid, MAX(COALESCE(p.payment_date, p.created_at::date)) AS latest_payment_date, (SELECT method FROM payments WHERE invoice_id = i.id ORDER BY COALESCE(payment_date, created_at::date) DESC, created_at DESC LIMIT 1) AS payment_method, (SELECT created_by_name FROM payments WHERE invoice_id = i.id ORDER BY COALESCE(payment_date, created_at::date) DESC, created_at DESC LIMIT 1) AS payment_created_by_name FROM invoices i JOIN clients c ON c.id = i.client_id LEFT JOIN payments p ON p.invoice_id = i.id";
  try {
    const rows = request.user!.role === "SUPER_ADMIN"
      ? await withDbTimeout(sql.query(`${summary} GROUP BY i.id, i.invoice_number, i.total, i.created_by_name, c.name, c.company, i.due_date ORDER BY i.created_at DESC`), 1200)
      : await withDbTimeout(sql.query(`${summary} WHERE i.created_by_id = $1 GROUP BY i.id, i.invoice_number, i.total, i.created_by_name, c.name, c.company, i.due_date ORDER BY i.created_at DESC`, [request.user!.id]), 1200);
    response.json({ data: rows });
  } catch {
    const invoices = await listFallbackInvoices(request.user!.role === "SUPER_ADMIN" ? undefined : request.user!.id);
    const payments = await listFallbackPayments();
    const summaryRows = invoices.map(inv => {
      const invPayments = payments.filter(p => p.invoice_id === inv.id || p.invoice_number === inv.invoice_number);
      const totalPaid = invPayments.reduce((acc, curr) => acc + curr.amount, 0);
      const latest = invPayments[0];
      return {
        invoice_id: inv.id,
        invoice_number: inv.invoice_number,
        invoice_total: inv.total,
        invoice_created_by_name: inv.created_by_name || "Admin",
        client_name: inv.client_name,
        client_company: null,
        due_date: inv.due_date,
        total_paid: totalPaid,
        latest_payment_date: latest?.payment_date || null,
        payment_method: latest?.method || null,
        payment_created_by_name: latest?.created_by_name || null,
      };
    });
    response.json({ data: summaryRows, fallback: true });
  }
});
app.post("/api/payments", requireAuth, allow("SUPER_ADMIN", "SUB_ADMIN"), async (request: AuthRequest, response) => {
  const parsed = paymentInput.safeParse(request.body);
  if (!parsed.success) { response.status(400).json({ message: "Invalid payment", errors: parsed.error.flatten() }); return; }
  const data = parsed.data;
  try {
    const invoice = request.user!.role === "SUPER_ADMIN"
      ? await withDbTimeout(sql`SELECT id, total, invoice_number FROM invoices WHERE id = ${data.invoiceId} LIMIT 1`, 800)
      : await withDbTimeout(sql`SELECT id, total, invoice_number FROM invoices WHERE id = ${data.invoiceId} AND created_by_id = ${request.user!.id} LIMIT 1`, 800);
    if (!invoice[0]) { response.status(404).json({ message: "Invoice not found" }); return; }
    const paidRows = await withDbTimeout(sql`SELECT COALESCE(SUM(amount), 0) AS total_paid FROM payments WHERE invoice_id = ${data.invoiceId}`, 800);
    const alreadyPaid = Number(paidRows[0]?.total_paid ?? 0); const remaining = Number(invoice[0].total) - alreadyPaid;
    if (data.amount > remaining) { response.status(400).json({ message: `Payment exceeds the remaining balance of ${remaining.toFixed(2)}.` }); return; }
    const creator = await withDbTimeout(sql`SELECT name FROM users WHERE id = ${request.user!.id} LIMIT 1`, 800);
    const creatorName = creator[0]?.name ?? (findDemoUser(request.user!.id)?.name || request.user!.role);
    const rows = await withDbTimeout(sql`INSERT INTO payments (invoice_id, amount, method, payment_date, notes, created_by_id, created_by_name) VALUES (${data.invoiceId}, ${data.amount}, ${data.method}, ${data.paymentDate ?? null}, ${data.notes ?? null}, ${request.user!.id}, ${creatorName}) RETURNING *`, 1200);
    await withDbTimeout(sql`UPDATE invoices SET paid_amount = ${alreadyPaid + data.amount} WHERE id = ${data.invoiceId}`, 800);
    recordNotification("Payment Recorded", `Payment of ₹${Number(data.amount).toLocaleString()} received (${data.method}) for #${invoice[0].invoice_number || "Invoice"}`, request.user!.id);
    response.status(201).json({ data: rows[0] });
  } catch {
    const payment = await addFallbackPayment({
      invoice_id: data.invoiceId,
      amount: data.amount,
      method: data.method,
      payment_date: data.paymentDate ?? null,
      notes: data.notes ?? null,
      created_by_id: request.user!.id,
      created_by_name: findDemoUser(request.user!.id)?.name || request.user!.role,
    });
    recordNotification("Payment Recorded", `Payment of ₹${Number(data.amount).toLocaleString()} received (${data.method})`, request.user!.id);
    response.status(201).json({ data: payment, fallback: true });
  }
});
app.get("/api/developers", requireAuth, allow("SUPER_ADMIN"), async (_request, response) => {
  try {
    const rows = await withDbTimeout(sql`
      SELECT u.id, u.name, u.email, u.role, u.created_at,
        COUNT(p.id)::int AS assigned_projects,
        COUNT(p.id) FILTER (WHERE p.status = 'COMPLETED')::int AS completed_projects,
        COUNT(p.id) FILTER (WHERE p.status IN ('PLANNING', 'IN_PROGRESS'))::int AS active_projects,
        COALESCE(ROUND(AVG(COALESCE(latest_update.progress, CASE WHEN p.status = 'COMPLETED' THEN 100 ELSE 0 END)))::int, 0) AS average_progress,
        MAX(COALESCE(latest_update.created_at, p.updated_at)) AS last_activity_at
      FROM users u
      LEFT JOIN projects p ON p.assigned_developer_id = u.id
      LEFT JOIN LATERAL (
        SELECT progress, created_at FROM project_updates
        WHERE project_id = p.id ORDER BY created_at DESC LIMIT 1
      ) latest_update ON true
      WHERE u.role = 'DEVELOPER'
      GROUP BY u.id, u.name, u.email, u.role, u.created_at
      ORDER BY last_activity_at DESC NULLS LAST, u.created_at DESC
    `, 1200);
    response.json({ data: rows });
  } catch {
    response.json({ data: await fallbackDeveloperOverview(), fallback: true });
  }
});
app.post("/api/developers", requireAuth, allow("SUPER_ADMIN"), async (request, response) => {
  const parsed = developerInput.safeParse(request.body);
  if (!parsed.success) { response.status(400).json({ message: "Invalid developer", errors: parsed.error.flatten() }); return; }
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  try {
    const rows = await withDbTimeout(sql`INSERT INTO users (name, email, password_hash, role, must_change_password) VALUES (${parsed.data.name}, ${parsed.data.email.toLowerCase()}, ${passwordHash}, 'DEVELOPER', true) RETURNING id, name, email, role, created_at`, 1200);
    response.status(201).json({ data: rows[0] });
  } catch {
    response.status(201).json({ data: await createFallbackDeveloper(parsed.data.name, parsed.data.email, passwordHash), fallback: true });
  }
});
app.delete("/api/developers/:id", requireAuth, allow("SUPER_ADMIN"), async (request, response) => {
  const developerId = String(request.params.id);
  try {
    const assigned = await withDbTimeout(sql`SELECT COUNT(*)::int AS count FROM projects WHERE assigned_developer_id = ${developerId}`, 800);
    if (Number(assigned[0]?.count ?? 0) > 0) { response.status(409).json({ message: "Reassign this developer's projects before removing the account" }); return; }
    const removed = await withDbTimeout(sql`DELETE FROM users WHERE id = ${developerId} AND role = 'DEVELOPER' RETURNING id`, 1000);
    if (!removed[0]) { response.status(404).json({ message: "Developer not found" }); return; }
    response.status(204).send();
  } catch {
    try {
      await removeFallbackDeveloper(developerId);
      response.status(204).send();
    } catch (error) {
      response.status(409).json({ message: error instanceof Error ? error.message : "Unable to remove developer" });
    }
  }
});
app.get("/api/projects", requireAuth, allow("SUPER_ADMIN", "DEVELOPER"), async (request: AuthRequest, response) => {
  try {
    const rows = request.user!.role === "DEVELOPER"
      ? await withDbTimeout(sql`SELECT projects.*, users.name AS developer_name, COALESCE(latest_update.progress, CASE WHEN projects.status = 'COMPLETED' THEN 100 ELSE 0 END) AS progress FROM projects JOIN users ON users.id = projects.assigned_developer_id LEFT JOIN LATERAL (SELECT progress FROM project_updates WHERE project_id = projects.id ORDER BY created_at DESC LIMIT 1) latest_update ON true WHERE projects.assigned_developer_id = ${request.user!.id} ORDER BY projects.updated_at DESC`, 1200)
      : await withDbTimeout(sql`SELECT projects.*, users.name AS developer_name, COALESCE(latest_update.progress, CASE WHEN projects.status = 'COMPLETED' THEN 100 ELSE 0 END) AS progress FROM projects JOIN users ON users.id = projects.assigned_developer_id LEFT JOIN LATERAL (SELECT progress FROM project_updates WHERE project_id = projects.id ORDER BY created_at DESC LIMIT 1) latest_update ON true ORDER BY projects.updated_at DESC`, 1200);
    response.json({ data: rows });
  } catch {
    response.json({ data: await listFallbackProjects(request.user!), fallback: true });
  }
});
app.post("/api/projects", requireAuth, allow("SUPER_ADMIN"), async (request: AuthRequest, response) => {
  const parsed = projectInput.safeParse(request.body);
  if (!parsed.success) { response.status(400).json({ message: "Invalid project", errors: parsed.error.flatten() }); return; }
  const data = parsed.data;
  try {
    const rows = await withDbTimeout(sql`INSERT INTO projects (name, client_name, description, status, priority, due_date, assigned_developer_id, created_by_id) VALUES (${data.name}, ${data.clientName ?? null}, ${data.description ?? null}, ${data.status}, ${data.priority}, ${data.dueDate ?? null}, ${data.assignedDeveloperId}, ${request.user!.id}) RETURNING *`, 1200);
    recordNotification("Project Assigned", `Project "${data.name}" was initialized`, request.user!.id);
    response.status(201).json({ data: rows[0] });
  } catch {
    const project = await createFallbackProject({ name: data.name, client_name: data.clientName ?? null, description: data.description ?? null, status: data.status, priority: data.priority, due_date: data.dueDate ?? null, assigned_developer_id: data.assignedDeveloperId, created_by_id: request.user!.id });
    recordNotification("Project Assigned", `Project "${data.name}" was initialized`, request.user!.id);
    response.status(201).json({ data: project, fallback: true });
  }
});
app.patch("/api/projects/:id/status", requireAuth, allow("SUPER_ADMIN", "DEVELOPER"), async (request: AuthRequest, response) => {
  const parsed = projectStatusInput.safeParse(request.body);
  if (!parsed.success) { response.status(400).json({ message: "Invalid project status" }); return; }
  const projectId = String(request.params.id);
  try {
    const rows = await withDbTimeout(sql`UPDATE projects SET status = ${parsed.data.status}, progress_percentage = CASE WHEN ${parsed.data.status} = 'COMPLETED' THEN 100 ELSE progress_percentage END, updated_at = now() WHERE id = ${projectId} AND (${request.user!.role} = 'SUPER_ADMIN' OR assigned_developer_id = ${request.user!.id}) RETURNING *`, 1200);
    if (!rows[0]) { response.status(403).json({ message: "You cannot update this project" }); return; }
    response.json({ data: rows[0] });
  } catch {
    try {
      const updated = await setFallbackProjectStatus(projectId, parsed.data.status);
      response.json({ data: updated, fallback: true });
    } catch {
      response.status(503).json({ message:"Unable to update project status" });
    }
  }
});
app.get("/api/projects/:id/updates", requireAuth, allow("SUPER_ADMIN", "DEVELOPER"), async (request: AuthRequest, response) => {
  const projectId = String(request.params.id);
  try {
    const project = await withDbTimeout(sql`SELECT assigned_developer_id FROM projects WHERE id = ${projectId} LIMIT 1`, 800);
    if (!project[0] || (request.user!.role === "DEVELOPER" && project[0].assigned_developer_id !== request.user!.id)) {
      response.status(403).json({ message: "You cannot view this project" }); return;
    }
    const rows = await withDbTimeout(sql`SELECT project_updates.*, users.name AS author_name FROM project_updates JOIN users ON users.id = project_updates.author_id WHERE project_updates.project_id = ${projectId} ORDER BY project_updates.created_at DESC`, 1200);
    response.json({ data: rows });
  } catch {
    const project = await fallbackProject(projectId);
    if (!project || (request.user!.role === "DEVELOPER" && project.assigned_developer_id !== request.user!.id)) {
      response.status(403).json({ message: "You cannot view this project" }); return;
    }
    response.json({ data: await listFallbackUpdates(projectId), fallback: true });
  }
});
app.post("/api/projects/:id/updates", requireAuth, allow("SUPER_ADMIN", "DEVELOPER"), async (request: AuthRequest, response) => {
  const parsed = projectUpdateInput.safeParse(request.body);
  if (!parsed.success) { response.status(400).json({ message: "Invalid project update", errors: parsed.error.flatten() }); return; }
  const data = parsed.data;
  const projectId = String(request.params.id);
  try {
    const project = await withDbTimeout(sql`SELECT id, assigned_developer_id, status, progress_percentage FROM projects WHERE id = ${projectId} LIMIT 1`, 800);
    if (!project[0] || (request.user!.role === "DEVELOPER" && project[0].assigned_developer_id !== request.user!.id)) {
      response.status(403).json({ message: "You cannot update this project" }); return;
    }
    const nextStatus = data.status ?? (data.progress === 100 ? "COMPLETED" : data.progress > 0 ? "IN_PROGRESS" : project[0].status);
    if (nextStatus === "COMPLETED" && data.progress < 100) {
      response.status(400).json({ message:"Completed projects must be 100% complete" }); return;
    }
    const nextProgress = nextStatus === "COMPLETED" ? 100 : data.progress;
    const rows = await withDbTimeout(sql`INSERT INTO project_updates (project_id, author_id, message, progress, old_status, new_status, old_percentage, new_percentage) VALUES (${projectId}, ${request.user!.id}, ${data.message}, ${nextProgress}, ${project[0].status}, ${nextStatus}, ${project[0].progress_percentage ?? 0}, ${nextProgress}) RETURNING *`, 1200);
    await withDbTimeout(sql`UPDATE projects SET status = ${nextStatus}, progress_percentage = ${nextProgress}, updated_at = now() WHERE id = ${projectId}`, 800);
    recordNotification("Project Update", `Project update: ${data.message.slice(0, 35)} (${nextProgress}% done)`, request.user!.id);
    response.status(201).json({ data: rows[0], project:{ id:projectId, status:nextStatus, progress:nextProgress } });
  } catch {
    try {
      const update = await addFallbackUpdate(projectId, request.user!.id, data.message, data.progress);
      const nextStatus = data.status ?? (data.progress === 100 ? "COMPLETED" : data.progress > 0 ? "IN_PROGRESS" : "PENDING");
      recordNotification("Project Update", `Project update: ${data.message.slice(0, 35)} (${data.progress}% done)`, request.user!.id);
      response.status(201).json({ data: update, project: { id: projectId, status: nextStatus, progress: data.progress }, fallback: true });
    } catch (err: any) {
      response.status(503).json({ message: err?.message || "Unable to save project progress" });
    }
  }
});

app.get("/api/vault", requireAuth, async (request: AuthRequest, response) => {
  const key = vaultKey();
  if (!key) { response.status(503).json({ message: "Credentials Vault is not configured. Add VAULT_ENCRYPTION_KEY to the API environment." }); return; }
  try {
    const data = await withDbTimeout(sql`SELECT id, label, service, notes, created_at, updated_at FROM credential_vault_items WHERE owner_id = ${request.user!.id} ORDER BY updated_at DESC`, 1200);
    response.json({ data });
  } catch { response.json({ data: [] }); }
});
app.post("/api/vault", requireAuth, async (request: AuthRequest, response) => {
  const parsed = vaultItemInput.safeParse(request.body); const key = vaultKey();
  if (!parsed.success) { response.status(400).json({ message:"Enter a label, service, username, and secret." }); return; }
  if (!key) { response.status(503).json({ message: "Credentials Vault is not configured. Add VAULT_ENCRYPTION_KEY to the API environment." }); return; }
  try {
    const iv = randomBytes(12); const encrypted = encryptVaultValue(JSON.stringify({ username:parsed.data.username, secret:parsed.data.secret }), key, iv);
    const rows = await withDbTimeout(sql`INSERT INTO credential_vault_items (owner_id, label, service, username_ciphertext, secret_ciphertext, iv, auth_tag, notes) VALUES (${request.user!.id}, ${parsed.data.label}, ${parsed.data.service}, ${encrypted.value}, ${"vault-v1"}, ${iv.toString("base64")}, ${encrypted.tag}, ${parsed.data.notes ?? null}) RETURNING id, label, service, notes, created_at, updated_at`, 1200);
    response.status(201).json({ data:{ ...rows[0], username:parsed.data.username, secret:parsed.data.secret } });
  } catch { response.status(503).json({ message:"Unable to save this credential." }); }
});
app.post("/api/vault/:id/reveal", requireAuth, async (request: AuthRequest, response) => {
  const key = vaultKey();
  if (!key) { response.status(503).json({ message: "Credentials Vault is not configured." }); return; }
  try {
    const rows = await withDbTimeout(sql`SELECT username_ciphertext, iv, auth_tag FROM credential_vault_items WHERE id = ${String(request.params.id)} AND owner_id = ${request.user!.id} LIMIT 1`, 1200);
    if (!rows[0]) { response.status(404).json({ message:"Vault item not found." }); return; }
    const row: any = rows[0]; const value = JSON.parse(decryptVaultValue(row.username_ciphertext, row.auth_tag, key, Buffer.from(row.iv, "base64"))) as { username:string; secret:string };
    response.json({ data:value });
  } catch { response.status(503).json({ message:"Unable to reveal this credential." }); }
});
app.delete("/api/vault/:id", requireAuth, async (request: AuthRequest, response) => {
  try { const rows = await withDbTimeout(sql`DELETE FROM credential_vault_items WHERE id = ${String(request.params.id)} AND owner_id = ${request.user!.id} RETURNING id`, 1200); if (!rows[0]) { response.status(404).json({ message:"Vault item not found." }); return; } response.status(204).send(); }
  catch { response.status(503).json({ message:"Unable to remove this credential." }); }
});
app.get("/api/marketing/overview", requireAuth, allow("SUPER_ADMIN", "DIGITAL_MARKETING"), async (_request, response) => {
  try {
    const overview = await getMarketingOverview();
    response.json({ data: overview });
  } catch {
    response.status(500).json({ message: "Unable to load marketing overview" });
  }
});
app.get("/api/marketing/campaigns", requireAuth, allow("SUPER_ADMIN", "DIGITAL_MARKETING"), async (request, response) => {
  try {
    const platform = typeof request.query.platform === "string" ? request.query.platform : undefined;
    const status = typeof request.query.status === "string" ? request.query.status : undefined;
    const search = typeof request.query.search === "string" ? request.query.search : undefined;
    const campaigns = await listMarketingCampaigns({ platform, status, search });
    response.json({ data: campaigns });
  } catch {
    response.status(500).json({ message: "Unable to load campaigns" });
  }
});
app.post("/api/marketing/campaigns", requireAuth, allow("SUPER_ADMIN", "DIGITAL_MARKETING"), async (request: AuthRequest, response) => {
  const parsed = campaignInput.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid campaign parameters", errors: parsed.error.flatten() });
    return;
  }
  try {
    const campaign = await createMarketingCampaign(parsed.data);
    recordNotification("Marketing Campaign Created", `Campaign "${parsed.data.name}" (${parsed.data.platform}) was launched`, request.user!.id);
    response.status(201).json({ data: campaign });
  } catch {
    response.status(500).json({ message: "Unable to create campaign" });
  }
});
app.patch("/api/marketing/campaigns/:id/status", requireAuth, allow("SUPER_ADMIN", "DIGITAL_MARKETING"), async (request, response) => {
  try {
    const updated = await toggleMarketingCampaignStatus(String(request.params.id));
    response.json({ data: updated });
  } catch {
    response.status(404).json({ message: "Campaign not found" });
  }
});
app.delete("/api/marketing/campaigns/:id", requireAuth, allow("SUPER_ADMIN", "DIGITAL_MARKETING"), async (request, response) => {
  try {
    await deleteMarketingCampaign(String(request.params.id));
    response.status(204).send();
  } catch {
    response.status(404).json({ message: "Campaign not found" });
  }
});
app.get("/api/marketing/creatives", requireAuth, allow("SUPER_ADMIN", "DIGITAL_MARKETING"), async (_request, response) => {
  try {
    const creatives = await listMarketingCreatives();
    response.json({ data: creatives });
  } catch {
    response.status(500).json({ message: "Unable to load creatives" });
  }
});
app.post("/api/marketing/creatives", requireAuth, allow("SUPER_ADMIN", "DIGITAL_MARKETING"), async (request, response) => {
  const parsed = creativeInput.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid creative parameters", errors: parsed.error.flatten() });
    return;
  }
  try {
    const creative = await createMarketingCreative(parsed.data);
    response.status(201).json({ data: creative });
  } catch {
    response.status(500).json({ message: "Unable to create creative" });
  }
});
app.get("/api/marketing/leads", requireAuth, allow("SUPER_ADMIN", "DIGITAL_MARKETING"), async (_request, response) => {
  try {
    const leads = await listMarketingLeads();
    response.json({ data: leads });
  } catch {
    response.status(500).json({ message: "Unable to load marketing leads" });
  }
});
app.patch("/api/marketing/campaigns/:id", requireAuth, allow("SUPER_ADMIN", "DIGITAL_MARKETING"), async (request, response) => {
  const parsed = campaignUpdateInput.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid update fields", errors: parsed.error.flatten() });
    return;
  }
  try {
    const updated = await updateMarketingCampaign(String(request.params.id), {
      ...(parsed.data.name ? { name: parsed.data.name } : {}),
      ...(parsed.data.budget ? { budget: parsed.data.budget } : {}),
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
      ...(parsed.data.targetAudience !== undefined ? { target_audience: parsed.data.targetAudience } : {}),
      ...(parsed.data.channel ? { channel: parsed.data.channel } : {}),
      ...(parsed.data.platform ? { platform: parsed.data.platform } : {}),
    });
    response.json({ data: updated, message: "Campaign updated successfully" });
  } catch {
    response.status(404).json({ message: "Campaign not found" });
  }
});
app.delete("/api/marketing/creatives/:id", requireAuth, allow("SUPER_ADMIN", "DIGITAL_MARKETING"), async (request, response) => {
  try {
    await deleteMarketingCreative(String(request.params.id));
    response.status(204).send();
  } catch {
    response.status(404).json({ message: "Creative asset not found" });
  }
});
app.post("/api/marketing/leads/batch-sync", requireAuth, allow("SUPER_ADMIN", "DIGITAL_MARKETING"), async (request: AuthRequest, response) => {
  try {
    const unsynced = await getUnsyncedMarketingLeads();
    const syncedResults = [];
    for (const lead of unsynced) {
      await markMarketingLeadSynced(lead.id);
      try {
        const dbInsert = sql`INSERT INTO leads (full_name, company, email, phone, source, notes, status, assigned_to_id) VALUES (${lead.lead_name}, ${lead.company}, ${lead.email}, ${lead.phone}, ${"Digital Marketing (" + lead.platform + ")"}, ${"Inbound lead from " + lead.campaign_name + " [" + lead.quality_score + "]"}, 'NEW', ${request.user!.id}) RETURNING *`;
        await withDbTimeout(dbInsert, 800);
      } catch {
        await addFallbackLead({
          full_name: lead.lead_name,
          company: lead.company,
          email: lead.email,
          phone: lead.phone,
          source: `Digital Marketing (${lead.platform})`,
          notes: `Inbound lead from ${lead.campaign_name} [${lead.quality_score}]`,
          assigned_to_id: request.user!.id,
        });
      }
      syncedResults.push(lead.id);
    }
    response.json({ message: `Successfully synced ${syncedResults.length} leads into the CRM sales pipeline`, count: syncedResults.length });
  } catch {
    response.status(500).json({ message: "Unable to batch sync leads" });
  }
});
app.post("/api/marketing/recommendations/apply", requireAuth, allow("SUPER_ADMIN", "DIGITAL_MARKETING"), async (request, response) => {
  const { title } = request.body || {};
  try {
    if (typeof title === "string" && title.toLowerCase().includes("scale google search")) {
      const campaigns = await listMarketingCampaigns({ platform: "Google Ads" });
      const targetCamp = campaigns[0];
      if (targetCamp) {
        await updateMarketingCampaign(targetCamp.id, { budget: targetCamp.budget + 2500 });
      }
    }
    const overview = await getMarketingOverview();
    response.json({ data: overview, message: `Recommendation applied: ${title}` });
  } catch {
    response.status(500).json({ message: "Unable to apply recommendation" });
  }
});
app.post("/api/marketing/leads/:id/sync-crm", requireAuth, allow("SUPER_ADMIN", "DIGITAL_MARKETING"), async (request: AuthRequest, response) => {
  try {
    const marketingLead = await markMarketingLeadSynced(String(request.params.id));
    try {
      const dbInsert = sql`INSERT INTO leads (full_name, company, email, phone, source, notes, status, assigned_to_id) VALUES (${marketingLead.lead_name}, ${marketingLead.company}, ${marketingLead.email}, ${marketingLead.phone}, ${"Digital Marketing (" + marketingLead.platform + ")"}, ${"Inbound lead from " + marketingLead.campaign_name + " [" + marketingLead.quality_score + "]"}, 'NEW', ${request.user!.id}) RETURNING *`;
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Database timeout")), 1200));
      await Promise.race([dbInsert, timeout]);
    } catch {
      await addFallbackLead({
        full_name: marketingLead.lead_name,
        company: marketingLead.company,
        email: marketingLead.email,
        phone: marketingLead.phone,
        source: `Digital Marketing (${marketingLead.platform})`,
        notes: `Inbound lead from ${marketingLead.campaign_name} [${marketingLead.quality_score}]`,
        assigned_to_id: request.user!.id,
      });
    }
    response.json({ data: marketingLead, message: "Lead synced to CRM successfully" });
  } catch (err) {
    response.status(404).json({ message: err instanceof Error ? err.message : "Unable to sync lead to CRM" });
  }
});

// ==========================================
// CLIENT MANAGEMENT ROUTES
// ==========================================

const marketingClientInput = z.object({
  name: z.string().min(1),
  industry: z.string().min(1),
  contact_name: z.string().min(1),
  contact_email: z.string().email(),
  monthly_retainer: z.number().min(0),
  status: z.enum(["ACTIVE", "ONBOARDING", "PAUSED"]).optional(),
  website: z.string().optional(),
});

const marketingClientProjectInput = z.object({
  client_id: z.string().min(1),
  title: z.string().min(1),
  category: z.enum(["Paid Search", "Paid Social", "SEO & Content", "Brand & Creative", "Email & CRM"]),
  budget: z.number().min(0),
  target_roas: z.number().optional(),
  deadline: z.string().min(1),
  deliverables: z.string().optional(),
});

const marketingClientAssetInput = z.object({
  client_id: z.string().min(1),
  project_id: z.string().optional().nullable(),
  name: z.string().min(1),
  asset_type: z.enum(["Ad Creative", "Video Script", "Copywriting", "Brand Asset", "Landing Page", "Report"]),
  file_format: z.enum(["Figma", "Video / MP4", "Graphic / PNG", "PDF", "Drive / Doc"]),
  asset_url: z.string().min(1),
  status: z.enum(["APPROVED", "IN_REVIEW", "NEEDS_REVISION", "DRAFT"]).optional(),
  version: z.string().optional(),
  notes: z.string().optional(),
});

// Overview
app.get("/api/marketing/clients/overview", requireAuth, allow("SUPER_ADMIN", "DIGITAL_MARKETING"), async (_request, response) => {
  try {
    const overview = await getMarketingClientsOverview();
    response.json({ data: overview });
  } catch {
    response.status(500).json({ message: "Unable to fetch client management overview" });
  }
});

// Clients
app.get("/api/marketing/clients", requireAuth, allow("SUPER_ADMIN", "DIGITAL_MARKETING"), async (_request, response) => {
  try {
    const clients = await listMarketingClients();
    response.json({ data: clients });
  } catch {
    response.status(500).json({ message: "Unable to fetch clients" });
  }
});

app.post("/api/marketing/clients", requireAuth, allow("SUPER_ADMIN", "DIGITAL_MARKETING"), async (request, response) => {
  const parsed = marketingClientInput.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid client input", errors: parsed.error.issues });
    return;
  }
  try {
    const client = await addMarketingClient({
      ...parsed.data,
      status: parsed.data.status || "ACTIVE",
    });
    response.status(201).json({ data: client, message: "Client created successfully" });
  } catch {
    response.status(500).json({ message: "Unable to create client" });
  }
});

app.patch("/api/marketing/clients/:id", requireAuth, allow("SUPER_ADMIN", "DIGITAL_MARKETING"), async (request, response) => {
  try {
    const updated = await updateMarketingClient(String(request.params.id), request.body);
    response.json({ data: updated, message: "Client updated successfully" });
  } catch (err) {
    response.status(404).json({ message: err instanceof Error ? err.message : "Unable to update client" });
  }
});

app.delete("/api/marketing/clients/:id", requireAuth, allow("SUPER_ADMIN", "DIGITAL_MARKETING"), async (request, response) => {
  try {
    await deleteMarketingClient(String(request.params.id));
    response.status(204).send();
  } catch {
    response.status(404).json({ message: "Client not found" });
  }
});

// Projects
app.get("/api/marketing/projects", requireAuth, allow("SUPER_ADMIN", "DIGITAL_MARKETING"), async (request, response) => {
  try {
    const clientId = typeof request.query.clientId === "string" ? request.query.clientId : undefined;
    const projects = await listMarketingClientProjects(clientId);
    response.json({ data: projects });
  } catch {
    response.status(500).json({ message: "Unable to fetch client projects" });
  }
});

app.post("/api/marketing/projects", requireAuth, allow("SUPER_ADMIN", "DIGITAL_MARKETING"), async (request, response) => {
  const parsed = marketingClientProjectInput.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid project input", errors: parsed.error.issues });
    return;
  }
  try {
    const project = await addMarketingClientProject(parsed.data);
    response.status(201).json({ data: project, message: "Client project created successfully" });
  } catch {
    response.status(500).json({ message: "Unable to create client project" });
  }
});

app.patch("/api/marketing/projects/:id", requireAuth, allow("SUPER_ADMIN", "DIGITAL_MARKETING"), async (request, response) => {
  try {
    const updated = await updateMarketingClientProject(String(request.params.id), request.body);
    response.json({ data: updated, message: "Project updated successfully" });
  } catch (err) {
    response.status(404).json({ message: err instanceof Error ? err.message : "Unable to update project" });
  }
});

app.delete("/api/marketing/projects/:id", requireAuth, allow("SUPER_ADMIN", "DIGITAL_MARKETING"), async (request, response) => {
  try {
    await deleteMarketingClientProject(String(request.params.id));
    response.status(204).send();
  } catch {
    response.status(404).json({ message: "Project not found" });
  }
});

// Assets
app.get("/api/marketing/assets", requireAuth, allow("SUPER_ADMIN", "DIGITAL_MARKETING"), async (request, response) => {
  try {
    const clientId = typeof request.query.clientId === "string" ? request.query.clientId : undefined;
    const projectId = typeof request.query.projectId === "string" ? request.query.projectId : undefined;
    const assets = await listMarketingClientAssets(clientId, projectId);
    response.json({ data: assets });
  } catch {
    response.status(500).json({ message: "Unable to fetch client assets" });
  }
});

app.post("/api/marketing/assets", requireAuth, allow("SUPER_ADMIN", "DIGITAL_MARKETING"), async (request, response) => {
  const parsed = marketingClientAssetInput.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid asset input", errors: parsed.error.issues });
    return;
  }
  try {
    const asset = await addMarketingClientAsset(parsed.data);
    response.status(201).json({ data: asset, message: "Client asset registered successfully" });
  } catch {
    response.status(500).json({ message: "Unable to register client asset" });
  }
});

app.patch("/api/marketing/assets/:id", requireAuth, allow("SUPER_ADMIN", "DIGITAL_MARKETING"), async (request, response) => {
  try {
    const updated = await updateMarketingClientAsset(String(request.params.id), request.body);
    response.json({ data: updated, message: "Asset updated successfully" });
  } catch (err) {
    response.status(404).json({ message: err instanceof Error ? err.message : "Unable to update asset" });
  }
});

app.delete("/api/marketing/assets/:id", requireAuth, allow("SUPER_ADMIN", "DIGITAL_MARKETING"), async (request, response) => {
  try {
    await deleteMarketingClientAsset(String(request.params.id));
    response.status(204).send();
  } catch {
    response.status(404).json({ message: "Asset not found" });
  }
});

app.use((_request, response) => response.status(404).json({ message: "Route not found" }));
app.use((error: Error, _request: Request, response: Response, _next: express.NextFunction) => {
  console.error(error);
  const databaseUnavailable = error.message.includes("Error connecting to database") || error.message.includes("fetch failed");
  response.status(databaseUnavailable ? 503 : 500).json({ message: databaseUnavailable ? "The backend cannot reach Neon. Start it from a regular Windows PowerShell terminal, then try again." : "Something went wrong" });
});
export default app;

// Vercel invokes the exported Express application. Keep the listener only for
// the existing local development and standalone backend workflow.
if (!process.env.VERCEL) {
  app.listen(Number(process.env.PORT ?? 5000), () => console.log("ZootechX Neon API listening on port 5000"));
}
