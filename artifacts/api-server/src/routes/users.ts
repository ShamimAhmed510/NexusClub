import { Router, type IRouter, type Request, type Response } from "express";
import { and, asc, eq } from "drizzle-orm";
import {
  db,
  usersTable,
  clubsTable,
  membershipsTable,
} from "@workspace/db";
import { UpdateUserRoleBody, AssignClubAdminBody } from "@workspace/api-zod";
import { getCurrentUser, requireAuth } from "../lib/auth";
import { serializeUserPublic, serializeMember } from "../lib/serializers";

const router: IRouter = Router();

router.get("/users", requireAuth, async (req: Request, res: Response) => {
  const user = await getCurrentUser(req);
  if (!user || user.role !== "overseer") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const rows = await db.select().from(usersTable).orderBy(asc(usersTable.id));
  res.json(rows.map((u) => serializeUserPublic(u)));
});

router.patch(
  "/users/:id/role",
  requireAuth,
  async (req: Request, res: Response) => {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "overseer") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const id = Number(req.params.id as string);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const parsed = UpdateUserRoleBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload" });
      return;
    }
    const [updated] = await db
      .update(usersTable)
      .set({ role: parsed.data.role })
      .where(eq(usersTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(serializeUserPublic(updated));
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
    const id = Number(req.params.id as string);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const parsed = AssignClubAdminBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload" });
      return;
    }
    const [u] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);
    if (!u) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const [club] = await db
      .select()
      .from(clubsTable)
      .where(eq(clubsTable.slug, parsed.data.clubSlug))
      .limit(1);
    if (!club) {
      res.status(404).json({ error: "Club not found" });
      return;
    }
    const [existing] = await db
      .select()
      .from(membershipsTable)
      .where(
        and(
          eq(membershipsTable.userId, u.id),
          eq(membershipsTable.clubId, club.id),
        ),
      )
      .limit(1);
    let row;
    if (existing) {
      [row] = await db
        .update(membershipsTable)
        .set({ role: parsed.data.role })
        .where(eq(membershipsTable.id, existing.id))
        .returning();
    } else {
      [row] = await db
        .insert(membershipsTable)
        .values({
          userId: u.id,
          clubId: club.id,
          role: parsed.data.role,
        })
        .returning();
    }
    if (!row) {
      res.status(500).json({ error: "Failed to assign" });
      return;
    }
    if (u.role === "student" && parsed.data.role !== "member") {
      await db
        .update(usersTable)
        .set({ role: "club_admin" })
        .where(eq(usersTable.id, u.id));
    }
    res.json(
      serializeMember({
        ...row,
        fullName: u.fullName,
        email: u.email,
        avatarUrl: u.avatarUrl,
        clubSlug: club.slug,
        clubName: club.name,
      }),
    );
  },
);

export default router;
