import { Router, type IRouter, type Request, type Response } from "express";
import { and, asc, desc, eq, inArray, gte, sql } from "drizzle-orm";
import {
  db,
  clubsTable,
  membershipsTable,
  joinRequestsTable,
  eventsTable,
  eventRsvpsTable,
  postsTable,
  noticesTable,
  usersTable,
} from "@workspace/db";
import { getCurrentUser, requireAuth } from "../lib/auth";
import {
  serializeClub,
  serializeJoinRequest,
  serializeEvent,
  serializeNotice,
  serializeMember,
  serializePost,
} from "../lib/serializers";

const router: IRouter = Router();

router.get(
  "/dashboard/student",
  requireAuth,
  async (req: Request, res: Response) => {
    const user = await getCurrentUser(req);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const memberships = await db
      .select({ m: membershipsTable, c: clubsTable })
      .from(membershipsTable)
      .innerJoin(clubsTable, eq(clubsTable.id, membershipsTable.clubId))
      .where(eq(membershipsTable.userId, user.id));
    const clubIds = memberships.map((r) => r.c.id);
    const memberCounts = clubIds.length
      ? await db
          .select({
            clubId: membershipsTable.clubId,
            n: sql<number>`count(*)::int`,
          })
          .from(membershipsTable)
          .where(inArray(membershipsTable.clubId, clubIds))
          .groupBy(membershipsTable.clubId)
      : [];
    const eventCounts = clubIds.length
      ? await db
          .select({
            clubId: eventsTable.clubId,
            n: sql<number>`count(*)::int`,
          })
          .from(eventsTable)
          .where(
            and(
              inArray(eventsTable.clubId, clubIds),
              eq(eventsTable.status, "approved"),
            ),
          )
          .groupBy(eventsTable.clubId)
      : [];
    const memMap = new Map(memberCounts.map((c) => [c.clubId, Number(c.n)]));
    const evMap = new Map(eventCounts.map((c) => [c.clubId, Number(c.n)]));
    const joinedClubs = memberships.map((r) =>
      serializeClub({
        ...r.c,
        memberCount: memMap.get(r.c.id) ?? 0,
        eventCount: evMap.get(r.c.id) ?? 0,
      }),
    );

    const pendReqRows = await db
      .select({ r: joinRequestsTable, c: clubsTable, u: usersTable })
      .from(joinRequestsTable)
      .innerJoin(clubsTable, eq(clubsTable.id, joinRequestsTable.clubId))
      .innerJoin(usersTable, eq(usersTable.id, joinRequestsTable.userId))
      .where(
        and(
          eq(joinRequestsTable.userId, user.id),
          eq(joinRequestsTable.status, "pending"),
        ),
      )
      .orderBy(desc(joinRequestsTable.createdAt));
    const pendingRequests = pendReqRows.map((row) =>
      serializeJoinRequest({
        ...row.r,
        clubSlug: row.c.slug,
        clubName: row.c.name,
        fullName: row.u.fullName,
        email: row.u.email,
      }),
    );

    const now = new Date();
    const rsvped = await db
      .select({ e: eventsTable, c: clubsTable })
      .from(eventRsvpsTable)
      .innerJoin(eventsTable, eq(eventsTable.id, eventRsvpsTable.eventId))
      .innerJoin(clubsTable, eq(clubsTable.id, eventsTable.clubId))
      .where(
        and(
          eq(eventRsvpsTable.userId, user.id),
          gte(eventsTable.startsAt, now),
        ),
      )
      .orderBy(asc(eventsTable.startsAt));
    const upcomingEvents = rsvped.map((r) =>
      serializeEvent({
        ...r.e,
        clubSlug: r.c.slug,
        clubName: r.c.name,
        rsvpCount: 0,
        viewerHasRsvp: true,
      }),
    );

    const recentNoticeRows = await db
      .select({ n: noticesTable, c: clubsTable })
      .from(noticesTable)
      .leftJoin(clubsTable, eq(clubsTable.id, noticesTable.clubId))
      .orderBy(desc(noticesTable.pinned), desc(noticesTable.publishAt))
      .limit(10);
    const recentNotices = recentNoticeRows.map((r) =>
      serializeNotice({
        ...r.n,
        clubSlug: r.c?.slug ?? null,
        clubName: r.c?.name ?? null,
      }),
    );

    res.json({ joinedClubs, pendingRequests, upcomingEvents, recentNotices });
  },
);

router.get(
  "/dashboard/club-admin/:slug",
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
    if (user.role !== "overseer") {
      const [m] = await db
        .select()
        .from(membershipsTable)
        .where(
          and(
            eq(membershipsTable.userId, user.id),
            eq(membershipsTable.clubId, club.id),
          ),
        )
        .limit(1);
      if (
        !m ||
        !["president", "vice_president", "secretary"].includes(m.role)
      ) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
    }
    const [{ n: memberCount }] = (await db
      .select({ n: sql<number>`count(*)::int` })
      .from(membershipsTable)
      .where(eq(membershipsTable.clubId, club.id))) as Array<{ n: number }>;
    const [{ n: eventCount }] = (await db
      .select({ n: sql<number>`count(*)::int` })
      .from(eventsTable)
      .where(
        and(eq(eventsTable.clubId, club.id), eq(eventsTable.status, "approved")),
      )) as Array<{ n: number }>;
    const memberRows = await db
      .select({ m: membershipsTable, u: usersTable })
      .from(membershipsTable)
      .innerJoin(usersTable, eq(usersTable.id, membershipsTable.userId))
      .where(eq(membershipsTable.clubId, club.id))
      .orderBy(asc(membershipsTable.joinedAt));
    const members = memberRows.map((r) =>
      serializeMember({
        ...r.m,
        fullName: r.u.fullName,
        email: r.u.email,
        avatarUrl: r.u.avatarUrl,
        clubSlug: club.slug,
        clubName: club.name,
      }),
    );

    const reqRows = await db
      .select({ r: joinRequestsTable, u: usersTable })
      .from(joinRequestsTable)
      .innerJoin(usersTable, eq(usersTable.id, joinRequestsTable.userId))
      .where(
        and(
          eq(joinRequestsTable.clubId, club.id),
          eq(joinRequestsTable.status, "pending"),
        ),
      )
      .orderBy(desc(joinRequestsTable.createdAt));
    const pendingRequests = reqRows.map((row) =>
      serializeJoinRequest({
        ...row.r,
        clubSlug: club.slug,
        clubName: club.name,
        fullName: row.u.fullName,
        email: row.u.email,
      }),
    );

    const now = new Date();
    const upcoming = await db
      .select()
      .from(eventsTable)
      .where(
        and(
          eq(eventsTable.clubId, club.id),
          eq(eventsTable.status, "approved"),
          gte(eventsTable.startsAt, now),
        ),
      )
      .orderBy(asc(eventsTable.startsAt));
    const upcomingEvents = upcoming.map((e) =>
      serializeEvent({
        ...e,
        clubSlug: club.slug,
        clubName: club.name,
        rsvpCount: 0,
        viewerHasRsvp: false,
      }),
    );
    const pending = await db
      .select()
      .from(eventsTable)
      .where(
        and(eq(eventsTable.clubId, club.id), eq(eventsTable.status, "pending")),
      )
      .orderBy(asc(eventsTable.startsAt));
    const pendingEvents = pending.map((e) =>
      serializeEvent({
        ...e,
        clubSlug: club.slug,
        clubName: club.name,
        rsvpCount: 0,
        viewerHasRsvp: false,
      }),
    );

    const postRows = await db
      .select({ p: postsTable, u: usersTable })
      .from(postsTable)
      .innerJoin(usersTable, eq(usersTable.id, postsTable.authorId))
      .where(eq(postsTable.clubId, club.id))
      .orderBy(desc(postsTable.createdAt))
      .limit(10);
    const recentPosts = postRows.map((r) =>
      serializePost({
        ...r.p,
        clubSlug: club.slug,
        clubName: club.name,
        authorName: r.u.fullName,
      }),
    );

    const noticeRows = await db
      .select()
      .from(noticesTable)
      .where(eq(noticesTable.clubId, club.id))
      .orderBy(desc(noticesTable.pinned), desc(noticesTable.publishAt))
      .limit(10);
    const notices = noticeRows.map((n) =>
      serializeNotice({ ...n, clubSlug: club.slug, clubName: club.name }),
    );

    res.json({
      club: serializeClub({
        ...club,
        memberCount: Number(memberCount),
        eventCount: Number(eventCount),
      }),
      members,
      pendingRequests,
      upcomingEvents,
      pendingEvents,
      recentPosts,
      notices,
    });
  },
);

router.get(
  "/dashboard/overseer",
  requireAuth,
  async (req: Request, res: Response) => {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "overseer") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const [{ n: clubsCount }] = (await db
      .select({ n: sql<number>`count(*)::int` })
      .from(clubsTable)) as Array<{ n: number }>;

    const roleCountsRows = await db
      .select({
        role: usersTable.role,
        n: sql<number>`count(*)::int`,
      })
      .from(usersTable)
      .groupBy(usersTable.role);
    const roleMap = new Map(
      roleCountsRows.map((r) => [r.role, Number(r.n)]),
    );

    const [{ n: approvedEvents }] = (await db
      .select({ n: sql<number>`count(*)::int` })
      .from(eventsTable)
      .where(eq(eventsTable.status, "approved"))) as Array<{ n: number }>;
    const [{ n: pendingEventsCount }] = (await db
      .select({ n: sql<number>`count(*)::int` })
      .from(eventsTable)
      .where(eq(eventsTable.status, "pending"))) as Array<{ n: number }>;
    const [{ n: noticesCount }] = (await db
      .select({ n: sql<number>`count(*)::int` })
      .from(noticesTable)) as Array<{ n: number }>;
    const [{ n: pendingReqs }] = (await db
      .select({ n: sql<number>`count(*)::int` })
      .from(joinRequestsTable)
      .where(eq(joinRequestsTable.status, "pending"))) as Array<{ n: number }>;

    const totals = {
      clubs: Number(clubsCount),
      students: roleMap.get("student") ?? 0,
      faculty: roleMap.get("faculty") ?? 0,
      clubAdmins: roleMap.get("club_admin") ?? 0,
      approvedEvents: Number(approvedEvents),
      pendingEvents: Number(pendingEventsCount),
      notices: Number(noticesCount),
      pendingRequests: Number(pendingReqs),
    };

    const allClubs = await db.select().from(clubsTable);
    const memCounts = await db
      .select({
        clubId: membershipsTable.clubId,
        n: sql<number>`count(*)::int`,
      })
      .from(membershipsTable)
      .groupBy(membershipsTable.clubId);
    const evCounts = await db
      .select({
        clubId: eventsTable.clubId,
        n: sql<number>`count(*)::int`,
      })
      .from(eventsTable)
      .where(eq(eventsTable.status, "approved"))
      .groupBy(eventsTable.clubId);
    const mc = new Map(memCounts.map((r) => [r.clubId, Number(r.n)]));
    const ec = new Map(evCounts.map((r) => [r.clubId, Number(r.n)]));
    const clubsByMembers = allClubs
      .map((c) =>
        serializeClub({
          ...c,
          memberCount: mc.get(c.id) ?? 0,
          eventCount: ec.get(c.id) ?? 0,
        }),
      )
      .sort((a, b) => b.memberCount - a.memberCount)
      .slice(0, 8);

    const pendingEvtRows = await db
      .select({ e: eventsTable, c: clubsTable })
      .from(eventsTable)
      .innerJoin(clubsTable, eq(clubsTable.id, eventsTable.clubId))
      .where(eq(eventsTable.status, "pending"))
      .orderBy(asc(eventsTable.startsAt))
      .limit(20);
    const pendingEvents = pendingEvtRows.map((r) =>
      serializeEvent({
        ...r.e,
        clubSlug: r.c.slug,
        clubName: r.c.name,
        rsvpCount: 0,
        viewerHasRsvp: false,
      }),
    );

    const recReqRows = await db
      .select({ r: joinRequestsTable, c: clubsTable, u: usersTable })
      .from(joinRequestsTable)
      .innerJoin(clubsTable, eq(clubsTable.id, joinRequestsTable.clubId))
      .innerJoin(usersTable, eq(usersTable.id, joinRequestsTable.userId))
      .orderBy(desc(joinRequestsTable.createdAt))
      .limit(15);
    const recentRequests = recReqRows.map((row) =>
      serializeJoinRequest({
        ...row.r,
        clubSlug: row.c.slug,
        clubName: row.c.name,
        fullName: row.u.fullName,
        email: row.u.email,
      }),
    );

    const recNoticeRows = await db
      .select({ n: noticesTable, c: clubsTable })
      .from(noticesTable)
      .leftJoin(clubsTable, eq(clubsTable.id, noticesTable.clubId))
      .orderBy(desc(noticesTable.publishAt))
      .limit(10);
    const recentNotices = recNoticeRows.map((r) =>
      serializeNotice({
        ...r.n,
        clubSlug: r.c?.slug ?? null,
        clubName: r.c?.name ?? null,
      }),
    );

    res.json({
      totals,
      clubsByMembers,
      pendingEvents,
      recentRequests,
      recentNotices,
    });
  },
);

export default router;
