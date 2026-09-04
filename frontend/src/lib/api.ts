const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL;
const isDeployedBrowser = typeof window !== "undefined" && window.location.hostname !== "localhost";
const pointsToLocalApi = !configuredApiUrl || /^https?:\/\/localhost(?::\d+)?\/?$/i.test(configuredApiUrl);

// Local development keeps using localhost. Production always uses the same
// Vercel domain's /api rewrite, so an untracked local .env.local can never be
// baked into a deployed frontend by mistake.
const resolvedApiUrl = (isDeployedBrowser && pointsToLocalApi ? "" : (configuredApiUrl ?? "http://localhost:5000")).replace(/\/$/, "");

// All callers already start their path with `/api`. Treat `/api` as the
// same-origin base rather than creating `/api/api/...` in production.
export const apiUrl = resolvedApiUrl === "/api" ? "" : resolvedApiUrl;

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "SUB_ADMIN" | "SALES" | "DEVELOPER" | "DIGITAL_MARKETING";
};

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = typeof window === "undefined" ? null : localStorage.getItem("zootechx_token");
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(`${apiUrl}${path}`, { ...options, headers });
}
