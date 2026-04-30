import { Router, type IRouter, type Request, type Response } from "express";
import { and, asc, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import {
  db,
  clubsTable,
  membershipsTable,
  joinRequestsTable,
  eventsTable,
  eventRsvpsTable,
  postsTable,
  noticesTable,
  mediaTable,
  usersTable,
} from "@workspace/db";
import {
  UpdateClubBody,
  RequestJoinClubBody,
  DecideJoinRequestBody,
  UpdateMemberRoleBody,
  CreateEventBody,
  CreatePostBody,
  CreateNoticeBody,
  AddClubMediaBody,
} from "@workspace/api-zod";
import {
  getCurrentUser,
  requireAuth,
  adminClubSlugsForUser,
} from "../lib/auth";
import {
  serializeClub,
  serializeMember,
  serializeJoinRequest,
  serializeEvent,
  serializePost,
  serializeNotice,
  serializeMedia,
  serializeUserPublic,
} from "../lib/serializers";

const router: IRouter = Router();

async function userIsClubAdminOrOverseer(
  userId: number,
  clubId: number,
  role: string,
): Promise<boolean> {
  if (role === "overseer") return true;
  const [m] = await db
    .select()
    .from(membershipsTable)
    .where(
      and(
        eq(membershipsTable.userId, userId),
        eq(membershipsTable.clubId, clubId),
      ),
    )
    .limit(1);
  if (!m) return false;
  return ["president", "vice_president", "secretary"].includes(m.role);
}

async function listClubsWithCounts() {
  const clubs = await db.select().from(clubsTable).orderBy(asc(clubsTable.name));
  if (clubs.length === 0) return [];
  const memberCounts = await db
    .select({
      clubId: membershipsTable.clubId,
      count: sql<number>`count(*)::int`,
    })
    .from(membershipsTable)
    .groupBy(membershipsTable.clubId);
  const eventCounts = await db
    .select({
      clubId: eventsTable.clubId,
      count: sql<number>`count(*)::int`,
    })
    .from(eventsTable)
    .where(eq(eventsTable.status, "approved"))
    .groupBy(eventsTable.clubId);
  const memMap = new Map(memberCounts.map((r) => [r.clubId, Number(r.count)]));
  const evMap = new Map(eventCounts.map((r) => [r.clubId, Number(r.count)]));
  return clubs.map((c) =>
    serializeClub({
      ...c,
      memberCount: memMap.get(c.id) ?? 0,
      eventCount: evMap.get(c.id) ?? 0,
    }),
  );
}

router.get("/clubs", async (_req: Request, res: Response) => {
  res.json(await listClubsWithCounts());
});

router.get("/clubs/:slug", async (req: Request, res: Response) => {
  const slug = String(req.params.slug);
  const [club] = await db
    .select()
    .from(clubsTable)
    .where(eq(clubsTable.slug, slug))
    .limit(1);
  if (!club) {
    res.status(404).json({ error: "Club not found" });
    return;
  }

  const memberRows = await db
    .select({
      mem: membershipsTable,
      user: usersTable,
    })
    .from(membershipsTable)
    .innerJoin(usersTable, eq(usersTable.id, membershipsTable.userId))
    .where(eq(membershipsTable.clubId, club.id))
    .orderBy(asc(membershipsTable.joinedAt));

  const allMembers = memberRows.map((r) =>
    serializeMember({
      ...r.mem,
      fullName: r.user.fullName,
      email: r.user.email,
      avatarUrl: r.user.avatarUrl,
      clubSlug: club.slug,
      clubName: club.name,
    }),
  );
  const leadership = allMembers.filter((m) =>
    ["president", "vice_president", "secretary"].includes(m.role),
  );

  const now = new Date();
  const eventRows = await db
    .select()
    .from(eventsTable)
    .where(
      and(eq(eventsTable.clubId, club.id), eq(eventsTable.status, "approved")),
    )
    .orderBy(asc(eventsTable.startsAt));

  const eventIds = eventRows.map((e) => e.id);
  let rsvpCounts = new Map<number, number>();
  let viewerRsvps = new Set<number>();
  if (eventIds.length > 0) {
    const counts = await db
      .select({
        eventId: eventRsvpsTable.eventId,
        count: sql<number>`count(*)::int`,
      })
      .from(eventRsvpsTable)
      .where(inArray(eventRsvpsTable.eventId, eventIds))
      .groupBy(eventRsvpsTable.eventId);
    rsvpCounts = new Map(counts.map((c) => [c.eventId, Number(c.count)]));
    const viewer = await getCurrentUser(req);
    if (viewer) {
      const v = await db
        .select({ eventId: eventRsvpsTable.eventId })
        .from(eventRsvpsTable)
        .where(
          and(
            eq(eventRsvpsTable.userId, viewer.id),
            inArray(eventRsvpsTable.eventId, eventIds),
          ),
        );
      viewerRsvps = new Set(v.map((r) => r.eventId));
    }
  }

  const upcomingEvents = eventRows
    .filter((e) => e.startsAt >= now)
    .map((e) =>
      serializeEvent({
        ...e,
        clubSlug: club.slug,
        clubName: club.name,
        rsvpCount: rsvpCounts.get(e.id) ?? 0,
        viewerHasRsvp: viewerRsvps.has(e.id),
      }),
    );
  const pastEvents = eventRows
    .filter((e) => e.startsAt < now)
    .reverse()
    .map((e) =>
      serializeEvent({
        ...e,
        clubSlug: club.slug,
        clubName: club.name,
        rsvpCount: rsvpCounts.get(e.id) ?? 0,
        viewerHasRsvp: viewerRsvps.has(e.id),
      }),
    );

  const postRows = await db
    .select({ post: postsTable, author: usersTable })
    .from(postsTable)
    .innerJoin(usersTable, eq(usersTable.id, postsTable.authorId))
    .where(eq(postsTable.clubId, club.id))
    .orderBy(desc(postsTable.createdAt))
    .limit(20);
  const posts = postRows.map((r) =>
    serializePost({
      ...r.post,
      clubSlug: club.slug,
      clubName: club.name,
      authorName: r.author.fullName,
    }),
  );

  const noticeRows = await db
    .select()
    .from(noticesTable)
    .where(eq(noticesTable.clubId, club.id))
    .orderBy(desc(noticesTable.pinned), desc(noticesTable.publishAt))
    .limit(20);
  const notices = noticeRows.map((n) =>
    serializeNotice({ ...n, clubSlug: club.slug, clubName: club.name }),
  );

  const mediaRows = await db
    .select()
    .from(mediaTable)
    .where(eq(mediaTable.clubId, club.id))
    .orderBy(desc(mediaTable.createdAt));
  const allMedia = mediaRows.map((m) =>
    serializeMedia({ ...m, clubSlug: club.slug }),
  );
  const achievements = allMedia.filter((m) => m.category === "achievement");
  const gallery = allMedia.filter((m) => m.category !== "achievement");

  let viewerMembership:
    | {
        status: "none" | "pending" | "approved" | "rejected";
        role: string | null;
        membershipId: number | null;
        requestId: number | null;
      }
    | null = null;
  const viewer = await getCurrentUser(req);
  if (viewer) {
    const [m] = await db
      .select()
      .from(membershipsTable)
      .where(
        and(
          eq(membershipsTable.userId, viewer.id),
          eq(membershipsTable.clubId, club.id),
        ),
      )
      .limit(1);
    if (m) {
      viewerMembership = {
        status: "approved",
        role: m.role,
        membershipId: m.id,
        requestId: null,
      };
    } else {
      const [r] = await db
        .select()
        .from(joinRequestsTable)
        .where(
          and(
            eq(joinRequestsTable.userId, viewer.id),
            eq(joinRequestsTable.clubId, club.id),
          ),
        )
        .orderBy(desc(joinRequestsTable.createdAt))
        .limit(1);
      if (r) {
        viewerMembership = {
          status: r.status as "pending" | "approved" | "rejected",
          role: null,
          membershipId: null,
          requestId: r.id,
        };
      } else {
        viewerMembership = {
          status: "none",
          role: null,
          membershipId: null,
          requestId: null,
        };
      }
    }
  }

  const memberCount = allMembers.length;
  const eventCount = eventRows.length;

  res.json({
    club: serializeClub({ ...club, memberCount, eventCount }),
    leadership,
    members: allMembers,
    upcomingEvents,
    pastEvents,
    posts,
    notices,
    achievements,
    gallery,
    viewerMembership,
  });
});

router.patch(
  "/clubs/:slug",
  requireAuth,
  async (req: Request, res: Response) => {
    const slug = String(req.params.slug);
    const parsed = UpdateClubBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload" });
      return;
    }
    const user = await getCurrentUser(req);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const [club] = await db
      .select()
      .from(clubsTable)
      .where(eq(clubsTable.slug, slug))
      .limit(1);
    if (!club) {
      res.status(404).json({ error: "Club not found" });
      return;
    }
    const allowed = await userIsClubAdminOrOverseer(user.id, club.id, user.role);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const [updated] = await db
      .update(clubsTable)
      .set(parsed.data)
      .where(eq(clubsTable.id, club.id))
      .returning();
    if (!updated) {
      res.status(500).json({ error: "Update failed" });
      return;
    }
    res.json(serializeClub({ ...updated, memberCount: 0, eventCount: 0 }));
  },
);

router.get(
  "/clubs/:slug/members",
  async (req: Request, res: Response) => {
    const slug = String(req.params.slug);
    const [club] = await db
      .select()
      .from(clubsTable)
      .where(eq(clubsTable.slug, slug))
      .limit(1);
    if (!club) {
      res.status(404).json({ error: "Club not found" });
      return;
    }
    const rows = await db
      .select({ mem: membershipsTable, user: usersTable })
      .from(membershipsTable)
      .innerJoin(usersTable, eq(usersTable.id, membershipsTable.userId))
      .where(eq(membershipsTable.clubId, club.id))
      .orderBy(asc(membershipsTable.joinedAt));
    res.json(
      rows.map((r) =>
        serializeMember({
          ...r.mem,
          fullName: r.user.fullName,
          email: r.user.email,
          avatarUrl: r.user.avatarUrl,
          clubSlug: club.slug,
          clubName: club.name,
        }),
      ),
    );
  },
);

router.post(
  "/clubs/:slug/join",
  requireAuth,
  async (req: Request, res: Response) => {
    const slug = String(req.params.slug);
    const parsed = RequestJoinClubBody.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload" });
      return;
    }
    const user = await getCurrentUser(req);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const [club] = await db
      .select()
      .from(clubsTable)
      .where(eq(clubsTable.slug, slug))
      .limit(1);
    if (!club) {
      res.status(404).json({ error: "Club not found" });
      return;
    }
    const [existingMembership] = await db
      .select()
      .from(membershipsTable)
      .where(
        and(
          eq(membershipsTable.userId, user.id),
          eq(membershipsTable.clubId, club.id),
        ),
      )
      .limit(1);
    if (existingMembership) {
      res.status(409).json({ error: "Already a member" });
      return;
    }
    const [pending] = await db
      .select()
      .from(joinRequestsTable)
      .where(
        and(
          eq(joinRequestsTable.userId, user.id),
          eq(joinRequestsTable.clubId, club.id),
          eq(joinRequestsTable.status, "pending"),
        ),
      )
      .limit(1);
    if (pending) {
      res.status(409).json({ error: "Request already pending" });
      return;
    }
    const [created] = await db
      .insert(joinRequestsTable)
      .values({
        userId: user.id,
        clubId: club.id,
        message: parsed.data.message ?? null,
        status: "pending",
      })
      .returning();
    if (!created) {
      res.status(500).json({ error: "Could not create request" });
      return;
    }
    res.status(201).json(
      serializeJoinRequest({
        ...created,
        clubSlug: club.slug,
        clubName: club.name,
        fullName: user.fullName,
        email: user.email,
      }),
    );
  },
);

router.get(
  "/clubs/:slug/requests",
  requireAuth,
  async (req: Request, res: Response) => {
    const slug = String(req.params.slug);
    const user = await getCurrentUser(req);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const [club] = await db
      .select()
      .from(clubsTable)
      .where(eq(clubsTable.slug, slug))
      .limit(1);
    if (!club) {
      res.status(404).json({ error: "Club not found" });
      return;
    }
    const allowed = await userIsClubAdminOrOverseer(user.id, club.id, user.role);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const rows = await db
      .select({ r: joinRequestsTable, u: usersTable })
      .from(joinRequestsTable)
      .innerJoin(usersTable, eq(usersTable.id, joinRequestsTable.userId))
      .where(eq(joinRequestsTable.clubId, club.id))
      .orderBy(desc(joinRequestsTable.createdAt));
    res.json(
      rows.map((row) =>
        serializeJoinRequest({
          ...row.r,
          clubSlug: club.slug,
          clubName: club.name,
          fullName: row.u.fullName,
          email: row.u.email,
        }),
      ),
    );
  },
);

router.post(
  "/join-requests/:id/decision",
  requireAuth,
  async (req: Request, res: Response) => {
    const id = Number(req.params.id as string);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const parsed = DecideJoinRequestBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload" });
      return;
    }
    const user = await getCurrentUser(req);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const [reqRow] = await db
      .select()
      .from(joinRequestsTable)
      .where(eq(joinRequestsTable.id, id))
      .limit(1);
    if (!reqRow) {
      res.status(404).json({ error: "Request not found" });
      return;
    }
    const [club] = await db
      .select()
      .from(clubsTable)
      .where(eq(clubsTable.id, reqRow.clubId))
      .limit(1);
    if (!club) {
      res.status(404).json({ error: "Club not found" });
      return;
    }
    const allowed = await userIsClubAdminOrOverseer(user.id, club.id, user.role);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    if (reqRow.status !== "pending") {
      res.status(409).json({ error: "Request already decided" });
      return;
    }
    const [updated] = await db
      .update(joinRequestsTable)
      .set({ status: parsed.data.decision, decidedAt: new Date() })
      .where(eq(joinRequestsTable.id, id))
      .returning();
    if (!updated) {
      res.status(500).json({ error: "Update failed" });
      return;
    }
    if (parsed.data.decision === "approved") {
      const [existing] = await db
        .select()
        .from(membershipsTable)
        .where(
          and(
            eq(membershipsTable.userId, reqRow.userId),
            eq(membershipsTable.clubId, reqRow.clubId),
          ),
        )
        .limit(1);
      if (!existing) {
        await db.insert(membershipsTable).values({
          userId: reqRow.userId,
          clubId: reqRow.clubId,
          role: "member",
        });
      }
    }
    const [requester] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, updated.userId))
      .limit(1);
    res.json(
      serializeJoinRequest({
        ...updated,
        clubSlug: club.slug,
        clubName: club.name,
        fullName: requester?.fullName ?? "",
        email: requester?.email ?? "",
      }),
    );
  },
);

router.patch(
  "/memberships/:id/role",
  requireAuth,
  async (req: Request, res: Response) => {
    const id = Number(req.params.id as string);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const parsed = UpdateMemberRoleBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload" });
      return;
    }
    const user = await getCurrentUser(req);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const [mem] = await db
      .select()
      .from(membershipsTable)
      .where(eq(membershipsTable.id, id))
      .limit(1);
    if (!mem) {
      res.status(404).json({ error: "Membership not found" });
      return;
    }
    const [club] = await db
      .select()
      .from(clubsTable)
      .where(eq(clubsTable.id, mem.clubId))
      .limit(1);
    if (!club) {
      res.status(404).json({ error: "Club not found" });
      return;
    }
    const allowed = await userIsClubAdminOrOverseer(user.id, club.id, user.role);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const [updated] = await db
      .update(membershipsTable)
      .set({ role: parsed.data.role })
      .where(eq(membershipsTable.id, id))
      .returning();
    if (!updated) {
      res.status(500).json({ error: "Update failed" });
      return;
    }
    const [u] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, updated.userId))
      .limit(1);
    if (u && updated.role !== "member" && u.role === "student") {
      await db
        .update(usersTable)
        .set({ role: "club_admin" })
        .where(eq(usersTable.id, u.id));
    }
    res.json(
      serializeMember({
        ...updated,
        fullName: u?.fullName ?? "",
        email: u?.email ?? "",
        avatarUrl: u?.avatarUrl ?? null,
        clubSlug: club.slug,
        clubName: club.name,
      }),
    );
  },
);

router.get(
  "/clubs/:slug/posts",
  async (req: Request, res: Response) => {
    const slug = String(req.params.slug);
    const [club] = await db
      .select()
      .from(clubsTable)
      .where(eq(clubsTable.slug, slug))
      .limit(1);
    if (!club) {
      res.status(404).json({ error: "Club not found" });
      return;
    }
    const rows = await db
      .select({ p: postsTable, u: usersTable })
      .from(postsTable)
      .innerJoin(usersTable, eq(usersTable.id, postsTable.authorId))
      .where(eq(postsTable.clubId, club.id))
      .orderBy(desc(postsTable.createdAt));
    res.json(
      rows.map((r) =>
        serializePost({
          ...r.p,
          clubSlug: club.slug,
          clubName: club.name,
          authorName: r.u.fullName,
        }),
      ),
    );
  },
);

router.post(
  "/clubs/:slug/posts",
  requireAuth,
  async (req: Request, res: Response) => {
    const slug = String(req.params.slug);
    const parsed = CreatePostBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload" });
      return;
    }
    const user = await getCurrentUser(req);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const [club] = await db
      .select()
      .from(clubsTable)
      .where(eq(clubsTable.slug, slug))
      .limit(1);
    if (!club) {
      res.status(404).json({ error: "Club not found" });
      return;
    }
    const allowed = await userIsClubAdminOrOverseer(user.id, club.id, user.role);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const [created] = await db
      .insert(postsTable)
      .values({
        clubId: club.id,
        authorId: user.id,
        title: parsed.data.title,
        body: parsed.data.body,
        imageUrl: parsed.data.imageUrl ?? null,
      })
      .returning();
    if (!created) {
      res.status(500).json({ error: "Could not create post" });
      return;
    }
    res.status(201).json(
      serializePost({
        ...created,
        clubSlug: club.slug,
        clubName: club.name,
        authorName: user.fullName,
      }),
    );
  },
);

router.get(
  "/clubs/:slug/notices",
  async (req: Request, res: Response) => {
    const slug = String(req.params.slug);
    const [club] = await db
      .select()
      .from(clubsTable)
      .where(eq(clubsTable.slug, slug))
      .limit(1);
    if (!club) {
      res.status(404).json({ error: "Club not found" });
      return;
    }
    const rows = await db
      .select()
      .from(noticesTable)
      .where(eq(noticesTable.clubId, club.id))
      .orderBy(desc(noticesTable.pinned), desc(noticesTable.publishAt));
    res.json(
      rows.map((n) =>
        serializeNotice({ ...n, clubSlug: club.slug, clubName: club.name }),
      ),
    );
  },
);

router.get(
  "/clubs/:slug/media",
  async (req: Request, res: Response) => {
    const slug = String(req.params.slug);
    const category = req.query.category as string | undefined;
    const [club] = await db
      .select()
      .from(clubsTable)
      .where(eq(clubsTable.slug, slug))
      .limit(1);
    if (!club) {
      res.status(404).json({ error: "Club not found" });
      return;
    }
    const conds = [eq(mediaTable.clubId, club.id)];
    if (category) conds.push(eq(mediaTable.category, category));
    const rows = await db
      .select()
      .from(mediaTable)
      .where(and(...conds))
      .orderBy(desc(mediaTable.createdAt));
    res.json(rows.map((m) => serializeMedia({ ...m, clubSlug: club.slug })));
  },
);

router.post(
  "/clubs/:slug/media",
  requireAuth,
  async (req: Request, res: Response) => {
    const slug = String(req.params.slug);
    const parsed = AddClubMediaBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload" });
      return;
    }
    const user = await getCurrentUser(req);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const [club] = await db
      .select()
      .from(clubsTable)
      .where(eq(clubsTable.slug, slug))
      .limit(1);
    if (!club) {
      res.status(404).json({ error: "Club not found" });
      return;
    }
    const allowed = await userIsClubAdminOrOverseer(user.id, club.id, user.role);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const [created] = await db
      .insert(mediaTable)
      .values({
        clubId: club.id,
        uploaderId: user.id,
        url: parsed.data.url,
        caption: parsed.data.caption ?? null,
        category: parsed.data.category,
      })
      .returning();
    if (!created) {
      res.status(500).json({ error: "Could not add media" });
      return;
    }
    res
      .status(201)
      .json(serializeMedia({ ...created, clubSlug: club.slug }));
  },
);

router.get(
  "/clubs/:slug/events",
  async (req: Request, res: Response) => {
    const slug = String(req.params.slug);
    const [club] = await db
      .select()
      .from(clubsTable)
      .where(eq(clubsTable.slug, slug))
      .limit(1);
    if (!club) {
      res.status(404).json({ error: "Club not found" });
      return;
    }
    const includePending = req.query.status === "pending";
    const conds = [eq(eventsTable.clubId, club.id)];
    if (includePending) conds.push(eq(eventsTable.status, "pending"));
    else conds.push(eq(eventsTable.status, "approved"));
    const rows = await db
      .select()
      .from(eventsTable)
      .where(and(...conds))
      .orderBy(asc(eventsTable.startsAt));
    const ids = rows.map((e) => e.id);
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
      rows.map((e) =>
        serializeEvent({
          ...e,
          clubSlug: club.slug,
          clubName: club.name,
          rsvpCount: counts.get(e.id) ?? 0,
          viewerHasRsvp: viewerRsvps.has(e.id),
        }),
      ),
    );
  },
);

router.post(
  "/clubs/:slug/events",
  requireAuth,
  async (req: Request, res: Response) => {
    const slug = String(req.params.slug);
    const parsed = CreateEventBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload" });
      return;
    }
    const user = await getCurrentUser(req);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const [club] = await db
      .select()
      .from(clubsTable)
      .where(eq(clubsTable.slug, slug))
      .limit(1);
    if (!club) {
      res.status(404).json({ error: "Club not found" });
      return;
    }
    const allowed = await userIsClubAdminOrOverseer(user.id, club.id, user.role);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const startsAt = new Date(parsed.data.startsAt);
    const endsAt = parsed.data.endsAt ? new Date(parsed.data.endsAt) : null;
    const status = user.role === "overseer" ? "approved" : "pending";
    const [created] = await db
      .insert(eventsTable)
      .values({
        clubId: club.id,
        createdById: user.id,
        title: parsed.data.title,
        description: parsed.data.description,
        startsAt,
        endsAt,
        venue: parsed.data.venue,
        capacity: parsed.data.capacity ?? null,
        coverUrl: parsed.data.coverUrl ?? null,
        status,
        approvedById: status === "approved" ? user.id : null,
      })
      .returning();
    if (!created) {
      res.status(500).json({ error: "Could not create event" });
      return;
    }
    res.status(201).json(
      serializeEvent({
        ...created,
        clubSlug: club.slug,
        clubName: club.name,
        rsvpCount: 0,
        viewerHasRsvp: false,
      }),
    );
  },
);

router.post(
  "/clubs/:slug/notices",
  requireAuth,
  async (req: Request, res: Response) => {
    const slug = String(req.params.slug);
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
    const [club] = await db
      .select()
      .from(clubsTable)
      .where(eq(clubsTable.slug, slug))
      .limit(1);
    if (!club) {
      res.status(404).json({ error: "Club not found" });
      return;
    }
    const allowed = await userIsClubAdminOrOverseer(user.id, club.id, user.role);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const publishAt = parsed.data.publishAt
      ? new Date(parsed.data.publishAt)
      : new Date();
    const expireAt = parsed.data.expireAt
      ? new Date(parsed.data.expireAt)
      : null;
    const [created] = await db
      .insert(noticesTable)
      .values({
        clubId: club.id,
        authorId: user.id,
        title: parsed.data.title,
        body: parsed.data.body,
        scope: "club",
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
    res
      .status(201)
      .json(
        serializeNotice({
          ...created,
          clubSlug: club.slug,
          clubName: club.name,
        }),
      );
  },
);

export default router;
