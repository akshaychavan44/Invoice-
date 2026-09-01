import "dotenv/config";
import { neon } from "@neondatabase/serverless";
const url = process.env.DATABASE_URL_UNPOOLED;
if (!url) throw new Error("DATABASE_URL_UNPOOLED is required for migrations. Use the Neon direct connection string.");
const sql = neon(url);
async function migrate(): Promise<void> {
  await sql`DO $$ BEGIN CREATE TYPE role AS ENUM ('SUPER_ADMIN', 'SUB_ADMIN', 'SALES'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`;
  await sql`ALTER TYPE role ADD VALUE IF NOT EXISTS 'DEVELOPER'`;
  await sql`DO $$ BEGIN CREATE TYPE lead_status AS ENUM ('NEW', 'CONTACTED', 'FOLLOW_UP', 'INTERESTED', 'QUOTATION_SENT', 'NEGOTIATION', 'CONVERTED', 'LOST'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`;
  await sql`CREATE TABLE IF NOT EXISTS users (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar(120) NOT NULL, email varchar(255) NOT NULL UNIQUE, password_hash text NOT NULL, role role NOT NULL DEFAULT 'SALES', created_at timestamptz NOT NULL DEFAULT now())`;
  await sql`CREATE TABLE IF NOT EXISTS clients (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar(120) NOT NULL, company varchar(160), email varchar(255), phone varchar(30), gst_number varchar(30), created_at timestamptz NOT NULL DEFAULT now())`;
  await sql`CREATE TABLE IF NOT EXISTS leads (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), full_name varchar(120) NOT NULL, company varchar(160), email varchar(255), phone varchar(30), source varchar(80) NOT NULL, status lead_status NOT NULL DEFAULT 'NEW', notes text, assigned_to_id uuid REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now())`;
  await sql`CREATE TABLE IF NOT EXISTS followups (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), lead_id text, lead_name varchar(160) NOT NULL, company varchar(160), property text, type varchar(40) NOT NULL, followup_date date NOT NULL, followup_time varchar(32), assigned_to varchar(120), priority varchar(20), status varchar(30) NOT NULL DEFAULT 'Scheduled', notes text, created_at timestamptz NOT NULL DEFAULT now())`;
  await sql`CREATE TABLE IF NOT EXISTS invoices (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), invoice_number varchar(32) NOT NULL UNIQUE, client_id uuid NOT NULL REFERENCES clients(id), total numeric(12,2) NOT NULL, paid_amount numeric(12,2) NOT NULL DEFAULT 0, due_date timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now())`;
  await sql`CREATE TABLE IF NOT EXISTS payments (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), invoice_id uuid NOT NULL REFERENCES invoices(id), amount numeric(12,2) NOT NULL, method varchar(40) NOT NULL, created_at timestamptz NOT NULL DEFAULT now())`;
  await sql`CREATE TABLE IF NOT EXISTS expenses (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title varchar(160) NOT NULL, category varchar(80) NOT NULL, amount numeric(12,2) NOT NULL, created_at timestamptz NOT NULL DEFAULT now())`;
  await sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS expense_date date`;
  await sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS payment_method varchar(40)`;
  await sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS description text`;
  await sql`CREATE TABLE IF NOT EXISTS projects (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar(160) NOT NULL, client_name varchar(160), description text, status varchar(40) NOT NULL DEFAULT 'PLANNING', priority varchar(20) NOT NULL DEFAULT 'MEDIUM', due_date date, assigned_developer_id uuid NOT NULL REFERENCES users(id), created_by_id uuid REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now())`;
  await sql`CREATE TABLE IF NOT EXISTS project_updates (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE, author_id uuid NOT NULL REFERENCES users(id), message text NOT NULL, progress integer NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100), created_at timestamptz NOT NULL DEFAULT now())`;
  console.log("Neon schema created.");
}
migrate().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
