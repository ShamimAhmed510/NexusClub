import { Router, type IRouter, type Request, type Response } from "express";
import { and, desc, eq, isNull, or, sql } from "drizzle-orm";
import { db, noticesTable, clubsTable, membershipsTable } from "@workspace/db";
import { CreateNoticeBody } from "@workspace/api-zod";
import { getCurrentUser, requireAuth } from "../lib/auth";
import { serializeNotice } from "../lib/serializers";

const router: IRouter = Router();

router.get("/notices", async (req: Request, res: Response) => {
  const scope = req.query.scope as string | undefined;
  const conds = [];
  if (scope === "university")
    conds.push(eq(noticesTable.scope, "university"));
  else if (scope === "club") conds.push(eq(noticesTable.scope, "club"));
  else if (scope === "pinned") conds.push(eq(noticesTable.pinned, true));
  const rows = await db
    .select({ n: noticesTable, c: clubsTable })
    .from(noticesTable)
    .leftJoin(clubsTable, eq(clubsTable.id, noticesTable.clubId))
    .where(conds.length > 0 ? and(...conds) : sql`TRUE`)
    .orderBy(desc(noticesTable.pinned), desc(noticesTable.publishAt));
  const now = new Date();
  res.json(
    rows
      .filter((r) => !r.n.expireAt || r.n.expireAt > now)
      .filter((r) => r.n.publishAt <= now)
      .map((r) =>
        serializeNotice({
          ...r.n,
          clubSlug: r.c?.slug ?? null,
          clubName: r.c?.name ?? null,
        }),
      ),
  );
});

router.post(
  "/notices",
  requireAuth,
  async (req: Request, res: Response) => {
    const parsed = CreateNoticeBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload" });
      return;
    }
    const user = await getCurrentUser(req);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const publishAt = parsed.data.publishAt
      ? new Date(parsed.data.publishAt)
      : new Date();
    const expireAt = parsed.data.expireAt
      ? new Date(parsed.data.expireAt)
      : null;
    let clubId: number | null = null;
    if (parsed.data.scope === "club" && parsed.data.clubSlug) {
      const [c] = await db
        .select()
        .from(clubsTable)
        .where(eq(clubsTable.slug, parsed.data.clubSlug))
        .limit(1);
      if (!c) {
        res.status(404).json({ error: "Club not found" });
        return;
      }
      clubId = c.id;
      if (user.role !== "overseer") {
        const [membership] = await db
          .select()
          .from(membershipsTable)
          .where(
            and(
              eq(membershipsTable.userId, user.id),
              eq(membershipsTable.clubId, c.id),
            ),
          )
          .limit(1);
        const adminRoles = ["president", "vice_president", "secretary"];
        if (!membership || !adminRoles.includes(membership.role)) {
          res.status(403).json({ error: "Only club admins can publish notices for this club" });
          return;
        }
      }
    } else if (user.role !== "overseer") {
      res.status(403).json({ error: "Only overseer can create university-wide notices" });
      return;
    }
    const [created] = await db
      .insert(noticesTable)
      .values({
        clubId,
        authorId: user.id,
        title: parsed.data.title,
        body: parsed.data.body,
        scope: parsed.data.scope,
        pinned: parsed.data.pinned ?? false,
        publishAt,
        expireAt,
        audienceRole: parsed.data.audienceRole ?? null,
      })
      .returning();
    if (!created) {
      res.status(500).json({ error: "Could not create notice" });
      return;
    }
    let clubSlug: string | null = null;
    let clubName: string | null = null;
    if (clubId) {
      const [c] = await db
        .select()
        .from(clubsTable)
        .where(eq(clubsTable.id, clubId))
        .limit(1);
      clubSlug = c?.slug ?? null;
      clubName = c?.name ?? null;
    }
    res
      .status(201)
      .json(serializeNotice({ ...created, clubSlug, clubName }));
  },
);

export default router;
