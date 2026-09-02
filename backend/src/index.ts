import "dotenv/config";
import bcrypt from "bcryptjs";
import cors from "cors";
import express, { Request, Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { z } from "zod";
import { allow, AuthRequest, requireAuth, signToken } from "./auth";
import { sql } from "./db/client";
import { addFallbackClient, addFallbackFollowup, addFallbackInvoice, addFallbackLead, listFallbackClients, listFallbackFollowups, listFallbackInvoices, listFallbackLeads } from "./db/crmFallback";
import { addFallbackUpdate, createFallbackDeveloper, createFallbackProject, fallbackDeveloperOverview, fallbackProject, findFallbackDeveloper, listFallbackProjects, listFallbackUpdates, removeFallbackDeveloper, setFallbackProjectStatus } from "./db/deliveryFallback";
import { findDemoUser, isDemoPassword } from "./demoUsers";
type UserRow = { id: string; name: string; email: string; role: "SUPER_ADMIN" | "SUB_ADMIN" | "SALES" | "DEVELOPER"; password_hash: string; must_change_password?: boolean; is_active?: boolean };
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
const paymentInput = z.object({ invoiceId: z.string().uuid(), amount: z.number().positive(), method: z.string().min(2).max(40) });
const developerInput = z.object({ name: z.string().min(2).max(120), email: z.string().email(), password: z.string().min(8) });
const projectStatus = z.enum(["NEW", "PENDING", "IN_PROGRESS", "COMPLETED"]);
const projectInput = z.object({ name: z.string().min(2).max(160), clientName: z.string().max(160).optional(), description: z.string().max(5000).optional(), priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"), status: projectStatus.default("NEW"), dueDate: z.string().date().optional(), assignedDeveloperId: z.string().uuid() });
const projectStatusInput = z.object({ status: projectStatus });
const projectUpdateInput = z.object({ message: z.string().max(5000).optional().default(""), progress: z.number().int().min(0).max(100), status: projectStatus.optional() });
app.get("/api/health", async (_request, response) => { await sql`SELECT 1`; response.json({ status: "ok", database: "neon" }); });
app.post("/api/auth/login", async (request: Request, response: Response) => {
  const parsed = login.safeParse(request.body);
  if (!parsed.success) { response.status(400).json({ message: "Valid email and password are required" }); return; }
  try {
    const rows = await sql`SELECT id, name, email, role, password_hash, must_change_password, is_active FROM users WHERE email = ${parsed.data.email.toLowerCase()} LIMIT 1`;
    const user = rows[0] as UserRow | undefined;
    if (!user || !(await bcrypt.compare(parsed.data.password, user.password_hash))) { response.status(401).json({ message: "Invalid email or password" }); return; }
    if (!user.is_active) { response.status(403).json({ message:"This developer account is inactive. Contact your Super Admin." }); return; }
    response.json({ token: signToken(user.id, user.role), mustChangePassword: Boolean(user.must_change_password), user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch {
    const fallbackDeveloper = await findFallbackDeveloper(parsed.data.email.toLowerCase());
    if (fallbackDeveloper && await bcrypt.compare(parsed.data.password, fallbackDeveloper.password_hash)) {
      response.json({ token: signToken(fallbackDeveloper.id, fallbackDeveloper.role), user: { id: fallbackDeveloper.id, name: fallbackDeveloper.name, email: fallbackDeveloper.email, role: fallbackDeveloper.role }, fallback: true });
      return;
    }
    const user = findDemoUser(parsed.data.email.toLowerCase());
    if (!user || !isDemoPassword(parsed.data.password)) { response.status(503).json({ message: "The database is unavailable and this account cannot use offline access." }); return; }
    response.json({ token: signToken(user.id, user.role), user, offline: true });
  }
});
app.post("/api/auth/change-password", requireAuth, async (request: AuthRequest, response: Response) => {
  const parsed = changePasswordInput.safeParse(request.body);
  if (!parsed.success) { response.status(400).json({ message: "Current and new passwords must be at least 8 characters." }); return; }
  if (parsed.data.currentPassword === parsed.data.newPassword) { response.status(400).json({ message: "Your new password must be different from your current password." }); return; }
  try {
    const users = await sql`SELECT id, password_hash FROM users WHERE id = ${request.user!.id} LIMIT 1`;
    const user = users[0] as { id: string; password_hash: string } | undefined;
    if (!user) { response.status(404).json({ message: "Account not found." }); return; }
    if (!(await bcrypt.compare(parsed.data.currentPassword, user.password_hash))) { response.status(401).json({ message: "Your current password is incorrect." }); return; }
    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
    await sql`UPDATE users SET password_hash = ${passwordHash}, must_change_password = false, updated_at = now() WHERE id = ${request.user!.id}`;
    response.json({ message: "Password changed successfully." });
  } catch {
    response.status(503).json({ message: "Unable to change password right now." });
  }
});
app.get("/api/auth/me", requireAuth, async (request: AuthRequest, response) => {
  try { const rows = await sql`SELECT id, name, email, role FROM users WHERE id = ${request.user!.id} LIMIT 1`; response.json({ user: rows[0] ?? null }); }
  catch { response.json({ user: findDemoUser(request.user!.id) ?? null, offline: true }); }
});
app.get("/api/notifications", requireAuth, async (request: AuthRequest, response) => {
  try { const rows = await sql`SELECT id, user_id, title, message, is_read, created_at FROM notifications WHERE user_id = ${request.user!.id} AND hidden_from_bell = false AND NOT (is_read = true AND created_at < now() - interval '7 days') ORDER BY created_at DESC`; response.json({ data:rows }); }
  catch { response.status(503).json({ message:"Unable to load notifications" }); }
});
app.get("/api/notifications/history", requireAuth, async (request: AuthRequest, response) => {
  try { const rows = await sql`SELECT id, user_id, title, message, is_read, created_at FROM notifications WHERE user_id = ${request.user!.id} ORDER BY created_at DESC`; response.json({ data:rows }); }
  catch { response.status(503).json({ message:"Unable to load notification history" }); }
});
app.patch("/api/notifications/:id/read", requireAuth, async (request: AuthRequest, response) => {
  try { const rows = await sql`UPDATE notifications SET is_read = true WHERE id = ${String(request.params.id)} AND user_id = ${request.user!.id} RETURNING id, user_id, title, message, is_read, created_at`; if (!rows[0]) { response.status(404).json({ message:"Notification not found" }); return; } response.json({ data:rows[0] }); }
  catch { response.status(503).json({ message:"Unable to update notification" }); }
});
app.post("/api/notifications/read-all", requireAuth, async (request: AuthRequest, response) => { try { await sql`UPDATE notifications SET is_read = true WHERE user_id = ${request.user!.id} AND is_read = false`; response.status(204).send(); } catch { response.status(503).json({ message:"Unable to update notifications" }); } });
app.post("/api/notifications/clear-read", requireAuth, async (request: AuthRequest, response) => { try { await sql`UPDATE notifications SET hidden_from_bell = true WHERE user_id = ${request.user!.id} AND is_read = true`; response.status(204).send(); } catch { response.status(503).json({ message:"Unable to clear notifications" }); } });
app.get("/api/leads", requireAuth, async (_request: AuthRequest, response) => { try { const rows = await sql`SELECT * FROM leads ORDER BY created_at DESC`; response.json({ data: rows }); } catch { response.status(503).json({ message:"Unable to load leads from the database" }); } });
app.post("/api/leads", requireAuth, allow("SUPER_ADMIN", "SUB_ADMIN"), async (request: AuthRequest, response) => { const parsed = leadInput.safeParse(request.body); if (!parsed.success) { response.status(400).json({ message: "Invalid lead", errors: parsed.error.flatten() }); return; } const data = parsed.data; try { const rows = await sql`INSERT INTO leads (full_name, company, email, phone, source, notes, status, assigned_to_id) VALUES (${data.fullName}, ${data.company ?? null}, ${data.email ?? null}, ${data.phone ?? null}, ${data.source}, ${data.notes ?? null}, ${data.status ?? "NEW"}, ${request.user!.id}) RETURNING *`; response.status(201).json({ data: rows[0] }); } catch { response.status(503).json({ message: "Unable to save lead to the database" }); } });
app.patch("/api/leads/:id", requireAuth, allow("SUPER_ADMIN", "SUB_ADMIN"), async (request, response) => {
  const parsed = leadUpdateInput.safeParse(request.body);
  if (!parsed.success) { response.status(400).json({ message:"Invalid lead update", errors:parsed.error.flatten() }); return; }
  const data = parsed.data;
  try {
    const rows = await sql`UPDATE leads SET full_name = COALESCE(${data.fullName ?? null}, full_name), company = CASE WHEN ${data.company !== undefined} THEN ${data.company ?? null} ELSE company END, email = CASE WHEN ${data.email !== undefined} THEN ${data.email ?? null} ELSE email END, phone = CASE WHEN ${data.phone !== undefined} THEN ${data.phone ?? null} ELSE phone END, source = COALESCE(${data.source ?? null}, source), notes = CASE WHEN ${data.notes !== undefined} THEN ${data.notes ?? null} ELSE notes END, status = COALESCE(${data.status ?? null}, status) WHERE id = ${String(request.params.id)} RETURNING *`;
    if (!rows[0]) { response.status(404).json({ message:"Lead not found" }); return; }
    response.json({ data:rows[0] });
  } catch { response.status(503).json({ message:"Unable to save lead changes" }); }
});
app.delete("/api/leads/:id", requireAuth, allow("SUPER_ADMIN", "SUB_ADMIN"), async (request, response) => {
  try { const rows = await sql`DELETE FROM leads WHERE id = ${String(request.params.id)} RETURNING id`; if (!rows[0]) { response.status(404).json({ message:"Lead not found" }); return; } response.status(204).send(); }
  catch { response.status(503).json({ message:"Unable to delete lead" }); }
});
app.post("/api/leads/:id/convert", requireAuth, allow("SUPER_ADMIN", "SUB_ADMIN"), async (request: AuthRequest, response) => {
  try {
    const rows = await sql`
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
    `;
    if (!rows[0]) {
      const lead = await sql`SELECT id, customer_id, status FROM leads WHERE id = ${String(request.params.id)} LIMIT 1`;
      response.status(lead[0] ? 409 : 404).json({ message:lead[0] ? "Lead has already been converted" : "Lead not found" }); return;
    }
    response.json({ data:rows[0], client:rows[0].client });
  } catch {
    response.status(503).json({ message: "Unable to save the conversion to the database" });
  }
});
app.get("/api/followups", requireAuth, allow("SUPER_ADMIN", "SUB_ADMIN", "SALES"), async (_request, response) => { try { const rows = await sql`SELECT * FROM followups ORDER BY followup_date ASC, followup_time ASC NULLS LAST`; response.json({ data: rows }); } catch { response.status(503).json({ message:"Unable to load follow-ups from the database" }); } });
app.post("/api/followups", requireAuth, allow("SUPER_ADMIN"), async (request, response) => { const parsed = followupInput.safeParse(request.body); if (!parsed.success) { response.status(400).json({ message: "Invalid follow-up", errors: parsed.error.flatten() }); return; } const data = parsed.data; try { const rows = await sql`INSERT INTO followups (lead_id, lead_name, company, property, type, followup_date, followup_time, assigned_to, priority, status, notes) VALUES (${data.leadId ?? null}, ${data.leadName}, ${data.company ?? null}, ${data.property ?? null}, ${data.type}, ${data.date}, ${data.time ?? null}, ${data.assignedTo ?? null}, ${data.priority ?? null}, ${data.status ?? "Scheduled"}, ${data.notes ?? null}) RETURNING *`; response.status(201).json({ data: rows[0] }); } catch { response.status(503).json({ message: "Unable to save follow-up to the database" }); } });
app.patch("/api/followups/:id", requireAuth, allow("SUPER_ADMIN", "SUB_ADMIN"), async (request, response) => {
  const parsed = followupUpdateInput.safeParse(request.body);
  if (!parsed.success) { response.status(400).json({ message:"Invalid follow-up update", errors:parsed.error.flatten() }); return; }
  const data = parsed.data;
  try {
    const markCompleted = data.completed === true || data.status === "Completed";
    const rows = await sql`UPDATE followups SET lead_name = COALESCE(${data.leadName ?? null}, lead_name), company = CASE WHEN ${data.company !== undefined} THEN ${data.company ?? null} ELSE company END, property = CASE WHEN ${data.property !== undefined} THEN ${data.property ?? null} ELSE property END, type = COALESCE(${data.type ?? null}, type), followup_date = COALESCE(${data.date ?? null}, followup_date), followup_time = CASE WHEN ${data.time !== undefined} THEN ${data.time ?? null} ELSE followup_time END, assigned_to = CASE WHEN ${data.assignedTo !== undefined} THEN ${data.assignedTo ?? null} ELSE assigned_to END, priority = CASE WHEN ${data.priority !== undefined} THEN ${data.priority ?? null} ELSE priority END, status = CASE WHEN ${markCompleted} THEN 'Completed' WHEN ${data.status ?? null} IS NOT NULL THEN ${data.status ?? null} ELSE status END, notes = CASE WHEN ${data.notes !== undefined} THEN ${data.notes ?? null} ELSE notes END, completed_at = CASE WHEN ${markCompleted} THEN COALESCE(completed_at, now()) WHEN ${data.completed === false} THEN NULL ELSE completed_at END, updated_at = now() WHERE id = ${String(request.params.id)} RETURNING *`;
    if (!rows[0]) { response.status(404).json({ message:"Follow-up not found" }); return; }
    response.json({ data:rows[0] });
  } catch { response.status(503).json({ message:"Unable to save follow-up changes" }); }
});
app.post("/api/followups/:id/complete", requireAuth, allow("SUPER_ADMIN", "SUB_ADMIN"), async (request, response) => {
  try { const rows = await sql`UPDATE followups SET status = 'Completed', completed_at = COALESCE(completed_at, now()), updated_at = now() WHERE id = ${String(request.params.id)} RETURNING *`; if (!rows[0]) { response.status(404).json({ message:"Follow-up not found" }); return; } response.json({ data:rows[0] }); }
  catch { response.status(503).json({ message:"Unable to complete follow-up" }); }
});
app.delete("/api/followups/:id", requireAuth, allow("SUPER_ADMIN", "SUB_ADMIN"), async (request, response) => {
  try { const rows = await sql`DELETE FROM followups WHERE id = ${String(request.params.id)} RETURNING id`; if (!rows[0]) { response.status(404).json({ message:"Follow-up not found" }); return; } response.status(204).send(); }
  catch { response.status(503).json({ message:"Unable to delete follow-up" }); }
});
app.get("/api/clients", requireAuth, async (_request, response) => { try { const rows = await sql`SELECT * FROM clients ORDER BY created_at DESC`; response.json({ data: rows }); } catch { response.status(503).json({ message:"Unable to load clients from the database" }); } });
app.post("/api/clients", requireAuth, allow("SUPER_ADMIN", "SUB_ADMIN"), async (request: AuthRequest, response) => { const parsed = clientInput.safeParse(request.body); if (!parsed.success) { response.status(400).json({ message: "Invalid client", errors: parsed.error.flatten() }); return; } const data = parsed.data; try { const rows = await sql`INSERT INTO clients (name, company, email, phone, gst_number) VALUES (${data.name}, ${data.company ?? null}, ${data.email ?? null}, ${data.phone}, ${data.gstNumber ?? null}) RETURNING *`; response.status(201).json({ data: rows[0] }); } catch { response.status(503).json({ message: "Unable to save client to the database" }); } });
app.get("/api/quotations", requireAuth, allow("SUPER_ADMIN", "SUB_ADMIN"), async (_request, response) => {
  try { const rows = await sql`SELECT * FROM quotations ORDER BY created_at DESC`; response.json({ data: rows }); }
  catch { response.status(503).json({ message:"Unable to load quotations from the database" }); }
});
app.post("/api/quotations", requireAuth, allow("SUPER_ADMIN", "SUB_ADMIN"), async (request, response) => {
  const parsed = quotationInput.safeParse(request.body);
  if (!parsed.success) { response.status(400).json({ message:"Invalid quotation", errors:parsed.error.flatten() }); return; }
  const data = parsed.data;
  try {
    if (data.clientId) {
      const client = await sql`SELECT id FROM clients WHERE id = ${data.clientId} LIMIT 1`;
      if (!client[0]) { response.status(404).json({ message:"Client not found" }); return; }
    }
    const rows = await sql`INSERT INTO quotations (quotation_number, client_id, client_name, amount, valid_until, status) VALUES (${`Q-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`}, ${data.clientId ?? null}, ${data.clientName}, ${data.amount}, ${data.validUntil}, ${data.status}) RETURNING *`;
    response.status(201).json({ data:rows[0] });
  } catch { response.status(503).json({ message:"Unable to save quotation to the database" }); }
});
app.get("/api/invoices", requireAuth, allow("SUPER_ADMIN", "SUB_ADMIN"), async (_request, response) => { try { const rows = await sql`SELECT invoices.*, clients.name AS client_name, clients.company AS client_company FROM invoices JOIN clients ON clients.id = invoices.client_id ORDER BY invoices.created_at DESC`; response.json({ data: rows }); } catch { response.json({ data: await listFallbackInvoices(), fallback: true }); } });
app.post("/api/invoices", requireAuth, allow("SUPER_ADMIN", "SUB_ADMIN"), async (request: AuthRequest, response) => { const parsed = invoiceInput.safeParse(request.body); if (!parsed.success) { response.status(400).json({ message: "Invalid invoice", errors: parsed.error.flatten() }); return; } const data = parsed.data; try { const rows = await sql`INSERT INTO invoices (invoice_number, client_id, total, paid_amount, due_date) VALUES (${data.invoiceNumber}, ${data.clientId}, ${data.total}, ${data.paidAmount ?? 0}, ${data.dueDate}) RETURNING *`; response.status(201).json({ data: rows[0] }); } catch { response.status(201).json({ data: await addFallbackInvoice({ invoice_number: data.invoiceNumber, client_id: data.clientId, client_name: data.clientName ?? "Client", total: data.total, paid_amount: data.paidAmount ?? 0, due_date: data.dueDate }), fallback: true }); } });
app.get("/api/expenses", requireAuth, allow("SUPER_ADMIN", "SUB_ADMIN"), async (_request, response) => { const rows = await sql`SELECT * FROM expenses ORDER BY expense_date DESC NULLS LAST, created_at DESC`; response.json({ data: rows }); });
app.post("/api/expenses", requireAuth, allow("SUPER_ADMIN", "SUB_ADMIN"), async (request: AuthRequest, response) => { const parsed = expenseInput.safeParse(request.body); if (!parsed.success) { response.status(400).json({ message: "Invalid expense", errors: parsed.error.flatten() }); return; } const data = parsed.data; const rows = await sql`INSERT INTO expenses (title, category, amount, expense_date, payment_method, description) VALUES (${data.title}, ${data.category}, ${data.amount}, ${data.expenseDate ?? null}, ${data.paymentMethod ?? null}, ${data.description ?? null}) RETURNING *`; response.status(201).json({ data: rows[0] }); });
app.get("/api/payments", requireAuth, allow("SUPER_ADMIN", "SUB_ADMIN"), async (_request, response) => { const rows = await sql`SELECT payments.*, invoices.invoice_number FROM payments JOIN invoices ON invoices.id = payments.invoice_id ORDER BY payments.created_at DESC`; response.json({ data: rows }); });
app.post("/api/payments", requireAuth, allow("SUPER_ADMIN", "SUB_ADMIN"), async (request, response) => { const parsed = paymentInput.safeParse(request.body); if (!parsed.success) { response.status(400).json({ message: "Invalid payment", errors: parsed.error.flatten() }); return; } const data = parsed.data; const invoice = await sql`SELECT id FROM invoices WHERE id = ${data.invoiceId} LIMIT 1`; if (!invoice[0]) { response.status(404).json({ message: "Invoice not found" }); return; } const rows = await sql`INSERT INTO payments (invoice_id, amount, method) VALUES (${data.invoiceId}, ${data.amount}, ${data.method}) RETURNING *`; await sql`UPDATE invoices SET paid_amount = paid_amount + ${data.amount} WHERE id = ${data.invoiceId}`; response.status(201).json({ data: rows[0] }); });
app.get("/api/developers", requireAuth, allow("SUPER_ADMIN"), async (_request, response) => {
  try {
  const rows = await sql`
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
  `;
  response.json({ data: rows });
  } catch { response.json({ data: await fallbackDeveloperOverview(), fallback: true }); }
});
app.post("/api/developers", requireAuth, allow("SUPER_ADMIN"), async (request, response) => { const parsed = developerInput.safeParse(request.body); if (!parsed.success) { response.status(400).json({ message: "Invalid developer", errors: parsed.error.flatten() }); return; } const passwordHash = await bcrypt.hash(parsed.data.password, 12); try { const rows = await sql`INSERT INTO users (name, email, password_hash, role, must_change_password) VALUES (${parsed.data.name}, ${parsed.data.email.toLowerCase()}, ${passwordHash}, 'DEVELOPER', true) RETURNING id, name, email, role, created_at`; response.status(201).json({ data: rows[0] }); } catch { response.status(201).json({ data: await createFallbackDeveloper(parsed.data.name, parsed.data.email, passwordHash), fallback: true }); } });
app.delete("/api/developers/:id", requireAuth, allow("SUPER_ADMIN"), async (request, response) => { const developerId = String(request.params.id); try { const assigned = await sql`SELECT COUNT(*)::int AS count FROM projects WHERE assigned_developer_id = ${developerId}`; if (Number(assigned[0]?.count ?? 0) > 0) { response.status(409).json({ message: "Reassign this developer's projects before removing the account" }); return; } const removed = await sql`DELETE FROM users WHERE id = ${developerId} AND role = 'DEVELOPER' RETURNING id`; if (!removed[0]) { response.status(404).json({ message: "Developer not found" }); return; } response.status(204).send(); } catch { try { await removeFallbackDeveloper(developerId); response.status(204).send(); } catch (error) { response.status(409).json({ message: error instanceof Error ? error.message : "Unable to remove developer" }); } } });
app.get("/api/projects", requireAuth, allow("SUPER_ADMIN", "DEVELOPER"), async (request: AuthRequest, response) => { try { const rows = request.user!.role === "DEVELOPER" ? await sql`SELECT projects.*, users.name AS developer_name, COALESCE(latest_update.progress, CASE WHEN projects.status = 'COMPLETED' THEN 100 ELSE 0 END) AS progress FROM projects JOIN users ON users.id = projects.assigned_developer_id LEFT JOIN LATERAL (SELECT progress FROM project_updates WHERE project_id = projects.id ORDER BY created_at DESC LIMIT 1) latest_update ON true WHERE projects.assigned_developer_id = ${request.user!.id} ORDER BY projects.updated_at DESC` : await sql`SELECT projects.*, users.name AS developer_name, COALESCE(latest_update.progress, CASE WHEN projects.status = 'COMPLETED' THEN 100 ELSE 0 END) AS progress FROM projects JOIN users ON users.id = projects.assigned_developer_id LEFT JOIN LATERAL (SELECT progress FROM project_updates WHERE project_id = projects.id ORDER BY created_at DESC LIMIT 1) latest_update ON true ORDER BY projects.updated_at DESC`; response.json({ data: rows }); } catch { response.json({ data: await listFallbackProjects(request.user!), fallback: true }); } });
app.post("/api/projects", requireAuth, allow("SUPER_ADMIN"), async (request: AuthRequest, response) => { const parsed = projectInput.safeParse(request.body); if (!parsed.success) { response.status(400).json({ message: "Invalid project", errors: parsed.error.flatten() }); return; } const data = parsed.data; try { const rows = await sql`INSERT INTO projects (name, client_name, description, status, priority, due_date, assigned_developer_id, created_by_id) VALUES (${data.name}, ${data.clientName ?? null}, ${data.description ?? null}, ${data.status}, ${data.priority}, ${data.dueDate ?? null}, ${data.assignedDeveloperId}, ${request.user!.id}) RETURNING *`; response.status(201).json({ data: rows[0] }); } catch { response.status(201).json({ data: await createFallbackProject({ name: data.name, client_name: data.clientName ?? null, description: data.description ?? null, status: data.status, priority: data.priority, due_date: data.dueDate ?? null, assigned_developer_id: data.assignedDeveloperId, created_by_id: request.user!.id }), fallback: true }); } });
app.patch("/api/projects/:id/status", requireAuth, allow("SUPER_ADMIN", "DEVELOPER"), async (request: AuthRequest, response) => { const parsed = projectStatusInput.safeParse(request.body); if (!parsed.success) { response.status(400).json({ message: "Invalid project status" }); return; } const projectId = String(request.params.id); try { const rows = await sql`UPDATE projects SET status = ${parsed.data.status}, progress_percentage = CASE WHEN ${parsed.data.status} = 'COMPLETED' THEN 100 ELSE progress_percentage END, updated_at = now() WHERE id = ${projectId} AND (${request.user!.role} = 'SUPER_ADMIN' OR assigned_developer_id = ${request.user!.id}) RETURNING *`; if (!rows[0]) { response.status(403).json({ message: "You cannot update this project" }); return; } response.json({ data: rows[0] }); } catch { response.status(503).json({ message:"Unable to update project status" }); } });
app.get("/api/projects/:id/updates", requireAuth, allow("SUPER_ADMIN", "DEVELOPER"), async (request: AuthRequest, response) => { const projectId = String(request.params.id); try { const project = await sql`SELECT assigned_developer_id FROM projects WHERE id = ${projectId} LIMIT 1`; if (!project[0] || (request.user!.role === "DEVELOPER" && project[0].assigned_developer_id !== request.user!.id)) { response.status(403).json({ message: "You cannot view this project" }); return; } const rows = await sql`SELECT project_updates.*, users.name AS author_name FROM project_updates JOIN users ON users.id = project_updates.author_id WHERE project_updates.project_id = ${projectId} ORDER BY project_updates.created_at DESC`; response.json({ data: rows }); } catch { const project = await fallbackProject(projectId); if (!project || (request.user!.role === "DEVELOPER" && project.assigned_developer_id !== request.user!.id)) { response.status(403).json({ message: "You cannot view this project" }); return; } response.json({ data: await listFallbackUpdates(projectId), fallback: true }); } });
app.post("/api/projects/:id/updates", requireAuth, allow("SUPER_ADMIN", "DEVELOPER"), async (request: AuthRequest, response) => { const parsed = projectUpdateInput.safeParse(request.body); if (!parsed.success) { response.status(400).json({ message: "Invalid project update", errors: parsed.error.flatten() }); return; } const data = parsed.data; const projectId = String(request.params.id); try { const project = await sql`SELECT id, assigned_developer_id, status, progress_percentage FROM projects WHERE id = ${projectId} LIMIT 1`; if (!project[0] || (request.user!.role === "DEVELOPER" && project[0].assigned_developer_id !== request.user!.id)) { response.status(403).json({ message: "You cannot update this project" }); return; } const nextStatus = data.status ?? (data.progress === 100 ? "COMPLETED" : data.progress > 0 ? "IN_PROGRESS" : project[0].status); if (nextStatus === "COMPLETED" && data.progress < 100) { response.status(400).json({ message:"Completed projects must be 100% complete" }); return; } const nextProgress = nextStatus === "COMPLETED" ? 100 : data.progress; const rows = await sql`INSERT INTO project_updates (project_id, author_id, message, progress, old_status, new_status, old_percentage, new_percentage) VALUES (${projectId}, ${request.user!.id}, ${data.message}, ${nextProgress}, ${project[0].status}, ${nextStatus}, ${project[0].progress_percentage ?? 0}, ${nextProgress}) RETURNING *`; await sql`UPDATE projects SET status = ${nextStatus}, progress_percentage = ${nextProgress}, updated_at = now() WHERE id = ${projectId}`; response.status(201).json({ data: rows[0], project:{ id:projectId, status:nextStatus, progress:nextProgress } }); } catch { response.status(503).json({ message:"Unable to save project progress" }); } });
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
