import { Router, type IRouter, type Request, type Response } from "express";
import mongoose from "mongoose";
import { User, Club, Membership } from "@workspace/db";
import { UpdateUserRoleBody, AssignClubAdminBody } from "@workspace/api-zod";
import { getCurrentUser, requireAuth } from "../lib/auth.js";
import { serializeUserPublic, serializeMember } from "../lib/serializers.js";

const router: IRouter = Router();

function s(id: any): string {
  return id.toString();
}

router.get("/users", requireAuth, async (req: Request, res: Response) => {
  const user = await getCurrentUser(req);
  if (!user || user.role !== "overseer") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const users = await User.find().sort({ createdAt: 1 }).lean();
  res.json(
    users.map((u: any) =>
      serializeUserPublic({
        id: s(u._id),
        username: u.username,
        fullName: u.fullName,
        email: u.email,
        role: u.role,
        studentId: u.studentId ?? null,
        department: u.department ?? null,
        batch: u.batch ?? null,
        avatarUrl: u.avatarUrl ?? null,
        createdAt: u.createdAt,
      }),
    ),
  );
});

router.patch(
  "/users/:id/role",
  requireAuth,
  async (req: Request, res: Response) => {
    const actor = await getCurrentUser(req);
    if (!actor || actor.role !== "overseer") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const id = req.params.id as string;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const parsed = UpdateUserRoleBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload" });
      return;
    }
    const updated = await User.findByIdAndUpdate(
      id,
      { role: parsed.data.role },
      { new: true },
    ).lean();
    if (!updated) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(
      serializeUserPublic({
        id: s((updated as any)._id),
        username: (updated as any).username,
        fullName: (updated as any).fullName,
        email: (updated as any).email,
        role: (updated as any).role,
        studentId: (updated as any).studentId ?? null,
        department: (updated as any).department ?? null,
        batch: (updated as any).batch ?? null,
        avatarUrl: (updated as any).avatarUrl ?? null,
        createdAt: (updated as any).createdAt,
      }),
    );
  },
);

router.post(
  "/users/:id/assign-club-admin",
  requireAuth,
  async (req: Request, res: Response) => {
    const actor = await getCurrentUser(req);
    if (!actor || actor.role !== "overseer") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const id = req.params.id as string;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const parsed = AssignClubAdminBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload" });
      return;
    }

    const u = await User.findById(id).lean();
    if (!u) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const club = await Club.findOne({ slug: parsed.data.clubSlug }).lean();
    if (!club) {
      res.status(404).json({ error: "Club not found" });
      return;
    }

    const existing = await Membership.findOne({ userId: id, clubId: s((club as any)._id) }).lean();
    let row: any;
    if (existing) {
      row = await Membership.findByIdAndUpdate(
        (existing as any)._id,
        { role: parsed.data.role },
        { new: true },
      ).lean();
    } else {
      row = await Membership.create({
        userId: id,
        clubId: s((club as any)._id),
        role: parsed.data.role,
        joinedAt: new Date(),
      });
      row = row.toObject();
    }

    const currentRole = (u as any).role as string;
    const isLeadershipRole = parsed.data.role !== "member";
    if (isLeadershipRole && currentRole !== "overseer" && currentRole !== "club_admin") {
      await User.findByIdAndUpdate(id, { role: "club_admin" });
      req.log.info(
        { targetUserId: id, previousRole: currentRole, membershipRole: parsed.data.role },
        "assign-club-admin: upgraded user role to club_admin",
      );
    }

    res.json(
      serializeMember({
        id: s(row._id),
        userId: s(row.userId),
        clubId: s(row.clubId),
        clubSlug: (club as any).slug,
        clubName: (club as any).name,
        fullName: (u as any).fullName,
        email: (u as any).email,
        avatarUrl: (u as any).avatarUrl ?? null,
        role: row.role,
        joinedAt: row.joinedAt ?? new Date(),
      }),
    );
  },
);

export default router;
