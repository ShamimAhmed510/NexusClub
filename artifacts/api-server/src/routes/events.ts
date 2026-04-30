import { Router, type IRouter, type Request, type Response } from "express";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import {
  db,
  eventsTable,
  eventRsvpsTable,
  clubsTable,
  usersTable,
} from "@workspace/db";
import { getCurrentUser, requireAuth } from "../lib/auth";
import { serializeEvent, serializeUserPublic } from "../lib/serializers";

const router: IRouter = Router();

router.get("/events", async (req: Request, res: Response) => {
  const scope = (req.query.scope as string | undefined) ?? "all";
  const conds = [eq(eventsTable.status, "approved")];
  const now = new Date();
  const rows = await db
    .select({ e: eventsTable, c: clubsTable })
    .from(eventsTable)
    .innerJoin(clubsTable, eq(clubsTable.id, eventsTable.clubId))
    .where(and(...conds))
    .orderBy(asc(eventsTable.startsAt));
  let filtered = rows;
  if (scope === "upcoming") filtered = rows.filter((r) => r.e.startsAt >= now);
  else if (scope === "past")
    filtered = rows.filter((r) => r.e.startsAt < now).reverse();
  const ids = filtered.map((r) => r.e.id);
  let counts = new Map<number, number>();
  let viewerRsvps = new Set<number>();
  if (ids.length > 0) {
    const c = await db
      .select({
        eventId: eventRsvpsTable.eventId,
        n: sql<number>`count(*)::int`,
      })
      .from(eventRsvpsTable)
      .where(inArray(eventRsvpsTable.eventId, ids))
      .groupBy(eventRsvpsTable.eventId);
    counts = new Map(c.map((x) => [x.eventId, Number(x.n)]));
    const viewer = await getCurrentUser(req);
    if (viewer) {
      const v = await db
        .select({ eventId: eventRsvpsTable.eventId })
        .from(eventRsvpsTable)
        .where(
          and(
            eq(eventRsvpsTable.userId, viewer.id),
            inArray(eventRsvpsTable.eventId, ids),
          ),
        );
      viewerRsvps = new Set(v.map((x) => x.eventId));
    }
  }
  res.json(
    filtered.map((r) =>
      serializeEvent({
        ...r.e,
        clubSlug: r.c.slug,
        clubName: r.c.name,
        rsvpCount: counts.get(r.e.id) ?? 0,
        viewerHasRsvp: viewerRsvps.has(r.e.id),
      }),
    ),
  );
});

router.get("/events/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id as string);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [row] = await db
    .select({ e: eventsTable, c: clubsTable })
    .from(eventsTable)
    .innerJoin(clubsTable, eq(clubsTable.id, eventsTable.clubId))
    .where(eq(eventsTable.id, id))
    .limit(1);
  if (!row) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  const [{ n: cnt }] = (await db
    .select({ n: sql<number>`count(*)::int` })
    .from(eventRsvpsTable)
    .where(eq(eventRsvpsTable.eventId, id))) as Array<{ n: number }>;
  const viewer = await getCurrentUser(req);
  let viewerHasRsvp = false;
  if (viewer) {
    const [v] = await db
      .select()
      .from(eventRsvpsTable)
      .where(
        and(
          eq(eventRsvpsTable.userId, viewer.id),
          eq(eventRsvpsTable.eventId, id),
        ),
      )
      .limit(1);
    viewerHasRsvp = Boolean(v);
  }
  const attendees = await db
    .select({ u: usersTable })
    .from(eventRsvpsTable)
    .innerJoin(usersTable, eq(usersTable.id, eventRsvpsTable.userId))
    .where(eq(eventRsvpsTable.eventId, id))
    .orderBy(asc(eventRsvpsTable.createdAt));
  res.json({
    event: serializeEvent({
      ...row.e,
      clubSlug: row.c.slug,
      clubName: row.c.name,
      rsvpCount: Number(cnt),
      viewerHasRsvp,
    }),
    attendees: attendees.map((r) => serializeUserPublic(r.u)),
  });
});

router.post(
  "/events/:id/approve",
  requireAuth,
  async (req: Request, res: Response) => {
    const id = Number(req.params.id as string);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const user = await getCurrentUser(req);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    if (user.role !== "overseer") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const [updated] = await db
      .update(eventsTable)
      .set({ status: "approved", approvedById: user.id })
      .where(eq(eventsTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Event not found" });
      return;
    }
    const [club] = await db
      .select()
      .from(clubsTable)
      .where(eq(clubsTable.id, updated.clubId))
      .limit(1);
    res.json(
      serializeEvent({
        ...updated,
        clubSlug: club?.slug ?? "",
        clubName: club?.name ?? "",
        rsvpCount: 0,
        viewerHasRsvp: false,
      }),
    );
  },
);

router.post(
  "/events/:id/rsvp",
  requireAuth,
  async (req: Request, res: Response) => {
    const id = Number(req.params.id as string);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const user = await getCurrentUser(req);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const [event] = await db
      .select()
      .from(eventsTable)
      .where(eq(eventsTable.id, id))
      .limit(1);
    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }
    const [existing] = await db
      .select()
      .from(eventRsvpsTable)
      .where(
        and(
          eq(eventRsvpsTable.userId, user.id),
          eq(eventRsvpsTable.eventId, id),
        ),
      )
      .limit(1);
    let attending: boolean;
    if (existing) {
      await db
        .delete(eventRsvpsTable)
        .where(eq(eventRsvpsTable.id, existing.id));
      attending = false;
    } else {
      await db
        .insert(eventRsvpsTable)
        .values({ userId: user.id, eventId: id });
      attending = true;
    }
    const [{ n: cnt }] = (await db
      .select({ n: sql<number>`count(*)::int` })
      .from(eventRsvpsTable)
      .where(eq(eventRsvpsTable.eventId, id))) as Array<{ n: number }>;
    res.json({ attending, rsvpCount: Number(cnt) });
  },
);

export default router;
