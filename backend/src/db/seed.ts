import bcrypt from "bcryptjs";
import { sql } from "./client";
async function seed(): Promise<void> { const hash = await bcrypt.hash("ChangeMe123!", 12); for (const [name, email, role] of [["ZootechX Super Admin", "admin@erp.com", "SUPER_ADMIN"], ["ZootechX Sub Admin", "subadmin@erp.com", "SUB_ADMIN"], ["ZootechX Sales", "sales@erp.com", "SALES"]] as const) { await sql`INSERT INTO users (name, email, password_hash, role) VALUES (${name}, ${email}, ${hash}, ${role}) ON CONFLICT (email) DO NOTHING`; } console.log("Development users seeded."); }
seed().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
