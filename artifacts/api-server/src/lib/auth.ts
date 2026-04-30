import type { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, membershipsTable, clubsTable } from "@workspace/db";

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

export type AuthRole = "student" | "faculty" | "club_admin" | "overseer";

export type AuthUser = {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: AuthRole;
  studentId: string | null;
  department: string | null;
  avatarUrl: string | null;
  createdAt: Date;
};

export async function loadUser(userId: number): Promise<AuthUser | null> {
  const [row] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    fullName: row.fullName,
    email: row.email,
    role: row.role as AuthRole,
    studentId: row.studentId,
    department: row.department,
    avatarUrl: row.avatarUrl,
    createdAt: row.createdAt,
  };
}

export async function adminClubSlugsForUser(userId: number): Promise<string[]> {
  const rows = await db
    .select({ slug: clubsTable.slug, role: membershipsTable.role })
    .from(membershipsTable)
    .innerJoin(clubsTable, eq(clubsTable.id, membershipsTable.clubId))
    .where(eq(membershipsTable.userId, userId));
  return rows
    .filter((r) =>
      ["president", "vice_president", "secretary"].includes(r.role),
    )
    .map((r) => r.slug);
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.session?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

export async function getCurrentUser(req: Request): Promise<AuthUser | null> {
  if (!req.session?.userId) return null;
  return loadUser(req.session.userId);
}

export function requireRole(...roles: AuthRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = await getCurrentUser(req);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    if (!roles.includes(user.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}

export function serializeUser(user: AuthUser) {
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    studentId: user.studentId,
    department: user.department,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt.toISOString(),
  };
}
