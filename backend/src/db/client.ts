import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const fallbackDatabaseUrl = "postgresql://neondb_owner:npg_Z1zperbOCIU4@ep-late-tooth-aybkzicl-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require";
const databaseUrl = process.env.DATABASE_URL || fallbackDatabaseUrl;

// `channel_binding` is a libpq option. The Neon HTTP driver does not need it;
// remove it while retaining the supplied pooled endpoint and SSL requirement.
const connectionUrl = new URL(databaseUrl);
connectionUrl.searchParams.delete("channel_binding");

// Neon HTTP uses port 443, which is the connection path already proven to work
// for this application. Schema migrations continue to use the direct URL.
export const sql = neon(connectionUrl.toString());
