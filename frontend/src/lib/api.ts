export const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000").replace(/\/$/, "");

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "SUB_ADMIN" | "SALES" | "DEVELOPER";
};

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = typeof window === "undefined" ? null : localStorage.getItem("zootechx_token");
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(`${apiUrl}${path}`, { ...options, headers });
}
