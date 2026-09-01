import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
export type AppRole = "SUPER_ADMIN" | "SUB_ADMIN" | "SALES" | "DEVELOPER";
export interface AuthRequest extends Request { user?: { id: string; role: AppRole } }
const secret = (): string => { const value = process.env.JWT_SECRET; if (!value || value.length < 24) throw new Error("JWT_SECRET must be at least 24 characters"); return value; };
export const signToken = (id: string, role: AppRole): string => jwt.sign({ sub: id, role }, secret(), { expiresIn: "8h" });
export function requireAuth(request: AuthRequest, response: Response, next: NextFunction): void { const token = request.header("authorization")?.replace(/^Bearer\s+/i, ""); if (!token) { response.status(401).json({ message: "Authentication required" }); return; } try { const data = jwt.verify(token, secret()) as { sub: string; role: AppRole }; request.user = { id: data.sub, role: data.role }; next(); } catch { response.status(401).json({ message: "Session expired or invalid" }); } }
export const allow = (...roles: AppRole[]) => (request: AuthRequest, response: Response, next: NextFunction): void => { if (!request.user || !roles.includes(request.user.role)) { response.status(403).json({ message: "Permission denied" }); return; } next(); };
