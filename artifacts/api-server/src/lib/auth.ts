import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { User, Membership, Club } from "@workspace/db";

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

export type AuthRole = "student" | "faculty" | "club_admin" | "overseer";

export type AuthUser = {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: AuthRole;
  studentId: string | null;
  department: string | null;
  avatarUrl: string | null;
  createdAt: Date;
};

export async function loadUser(userId: string): Promise<AuthUser | null> {
  if (!mongoose.Types.ObjectId.isValid(userId)) return null;
  const doc = await User.findById(userId).lean();
  if (!doc) return null;
  return {
    id: (doc._id as any).toString(),
    username: doc.username as string,
    fullName: doc.fullName as string,
    email: doc.email as string,
    role: doc.role as AuthRole,
    studentId: (doc.studentId as string | null) ?? null,
    department: (doc.department as string | null) ?? null,
    avatarUrl: (doc.avatarUrl as string | null) ?? null,
    createdAt: doc.createdAt as Date,
  };
}

export async function adminClubSlugsForUser(userId: string): Promise<string[]> {
  const memberships = await Membership.find({ userId }).select("clubId role").lean();
  const adminRoles = ["president", "vice_president", "secretary"];
  const adminClubIds = memberships
    .filter((m: any) => adminRoles.includes(m.role as string))
    .map((m: any) => m.clubId);

  if (adminClubIds.length === 0) return [];

  const clubs = await Club.find({ _id: { $in: adminClubIds } }).select("slug").lean();
  return clubs.map((c: any) => c.slug as string);
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
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
