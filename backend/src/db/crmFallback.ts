import { mkdir, readFile, rename, writeFile } from "fs/promises";
import { randomUUID } from "crypto";
import path from "path";

type LocalLead = { id: string; full_name: string; company: string | null; email: string | null; phone: string | null; source: string; status: string; notes: string | null; assigned_to_id: string | null; created_at: string };
type LocalFollowup = { id: string; lead_id: string | null; lead_name: string; company: string | null; property: string | null; type: string; followup_date: string; followup_time: string | null; assigned_to: string | null; priority: string | null; status: string; notes: string | null; created_at: string };
type LocalClient = { id: string; name: string; company: string | null; email: string | null; phone: string | null; gst_number: string | null; created_at: string };
type LocalInvoice = { id: string; invoice_number: string; client_id: string; client_name: string; total: number; paid_amount: number; due_date: string; created_by_id?: string; created_by_name?: string; created_at: string };
type Store = { leads: LocalLead[]; followups: LocalFollowup[]; clients: LocalClient[]; invoices: LocalInvoice[] };
const runtimeDir = path.join(process.cwd(), ".runtime"); const file = path.join(runtimeDir, "crm-fallback.json");
const read = async (): Promise<Store> => { try { const data = JSON.parse(await readFile(file, "utf8")) as Partial<Store>; return { leads: data.leads ?? [], followups: data.followups ?? [], clients: data.clients ?? [], invoices: data.invoices ?? [] }; } catch { return { leads: [], followups: [], clients: [], invoices: [] }; } };
const save = async (store: Store) => { await mkdir(runtimeDir, { recursive: true }); const temp = `${file}.tmp`; await writeFile(temp, JSON.stringify(store, null, 2)); await rename(temp, file); };
export const listFallbackLeads = async () => (await read()).leads;
export async function addFallbackLead(input: Omit<LocalLead, "id" | "status" | "created_at">) { const store = await read(); const lead: LocalLead = { ...input, id: randomUUID(), status: "NEW", created_at: new Date().toISOString() }; store.leads.unshift(lead); await save(store); return lead; }
export const listFallbackFollowups = async () => (await read()).followups.sort((a, b) => a.followup_date.localeCompare(b.followup_date));
export async function addFallbackFollowup(input: Omit<LocalFollowup, "id" | "created_at">) { const store = await read(); const followup: LocalFollowup = { ...input, id: randomUUID(), created_at: new Date().toISOString() }; store.followups.unshift(followup); await save(store); return followup; }
export const listFallbackClients = async () => (await read()).clients;
export async function addFallbackClient(input: Omit<LocalClient, "id" | "created_at">) { const store = await read(); const client: LocalClient = { ...input, id: randomUUID(), created_at: new Date().toISOString() }; store.clients.unshift(client); await save(store); return client; }
export const listFallbackInvoices = async (createdById?: string) => (await read()).invoices.filter(invoice => !createdById || invoice.created_by_id === createdById);
export async function addFallbackInvoice(input: Omit<LocalInvoice, "id" | "created_at">) { const store = await read(); const invoice: LocalInvoice = { ...input, id: randomUUID(), created_at: new Date().toISOString() }; store.invoices.unshift(invoice); await save(store); return invoice; }
