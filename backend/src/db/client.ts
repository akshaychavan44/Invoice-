import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required. Add your Neon pooled URL to .env.");

// `channel_binding` is a libpq option. The Neon HTTP driver does not need it;
// remove it while retaining the supplied pooled endpoint and SSL requirement.
const connectionUrl = new URL(databaseUrl);
connectionUrl.searchParams.delete("channel_binding");

// Neon HTTP uses port 443, which is the connection path already proven to work
// for this application. Schema migrations continue to use the direct URL.
export const sql = neon(connectionUrl.toString());
