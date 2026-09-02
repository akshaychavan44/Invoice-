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
  for (const [name, email, role] of [["ZootechX Super Admin", "admin@erp.com", "SUPER_ADMIN"], ["ZootechX Sub Admin", "subadmin@erp.com", "SUB_ADMIN"], ["ZootechX Sales", "sales@erp.com", "SALES"]] as const) {
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

  console.log("Development users and CRM demo data seeded.");
}
seed().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
