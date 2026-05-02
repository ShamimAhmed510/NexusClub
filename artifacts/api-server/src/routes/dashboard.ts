import { Router, type IRouter, type Request, type Response } from "express";
import { Club, Event, EventRsvp, JoinRequest, Membership, Notice, Post, User } from "@workspace/db";
import { getCurrentUser, requireAuth } from "../lib/auth.js";
import {
  serializeClub,
  serializeEvent,
  serializeJoinRequest,
  serializeMember,
  serializeNotice,
  serializePost,
} from "../lib/serializers.js";

const router: IRouter = Router();

function s(id: any): string {
  return id.toString();
}

async function getClubWithCounts(doc: any) {
  const clubId = s(doc._id);
  const [memberCount, eventCount] = await Promise.all([
    Membership.countDocuments({ clubId }),
    Event.countDocuments({ clubId, status: "approved" }),
  ]);
  return serializeClub({
    id: clubId,
    slug: doc.slug,
    name: doc.name,
    category: doc.category,
    shortDescription: doc.shortDescription,
    description: doc.description,
    logoUrl: doc.logoUrl ?? null,
    coverUrl: doc.coverUrl ?? null,
    accentColor: doc.accentColor,
    websiteUrl: doc.websiteUrl ?? null,
    facebookUrl: doc.facebookUrl ?? null,
    instagramUrl: doc.instagramUrl ?? null,
    memberCount,
    eventCount,
  });
}

// ─────────────────────────────────────────────────────────────
// STUDENT DASHBOARD
// ─────────────────────────────────────────────────────────────

router.get(
  "/dashboard/student",
  requireAuth,
  async (req: Request, res: Response) => {
    const user = await getCurrentUser(req);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const [memberships, pendingJoinReqs] = await Promise.all([
      Membership.find({ userId: user.id }).lean(),
      JoinRequest.find({ userId: user.id, status: "pending" }).lean(),
    ]);

    const joinedClubIds = memberships.map((m: any) => m.clubId);
    const pendingClubIds = pendingJoinReqs.map((r: any) => r.clubId);

    const [joinedClubDocs, pendingClubDocs] = await Promise.all([
      Club.find({ _id: { $in: joinedClubIds } }).lean(),
      Club.find({ _id: { $in: pendingClubIds } }).lean(),
    ]);

    const joinedClubs = await Promise.all(joinedClubDocs.map(getClubWithCounts));

    const pendingClubMap = new Map(pendingClubDocs.map((c: any) => [s(c._id), c]));
    const pendingRequests = pendingJoinReqs.map((r: any) => {
      const club: any = pendingClubMap.get(s(r.clubId));
      return serializeJoinRequest({
        id: s(r._id),
        userId: s(r.userId),
        clubId: s(r.clubId),
        clubSlug: club?.slug ?? "",
        clubName: club?.name ?? "",
        fullName: user.fullName,
        email: user.email,
        studentId: user.studentId,
        department: user.department,
        batch: null,
        message: r.message ?? null,
        status: r.status,
        createdAt: r.createdAt,
      });
    });

    const now = new Date();
    const upcomingEventDocs = await Event.find({
      clubId: { $in: joinedClubIds },
      status: "approved",
      startsAt: { $gte: now },
    })
      .sort({ startsAt: 1 })
      .limit(10)
      .lean();

    const eventIds = upcomingEventDocs.map((e: any) => e._id);
    const evClubIds = [...new Set(upcomingEventDocs.map((e: any) => s(e.clubId)))];

    const [rsvpAgg, viewerRsvpRows, eventClubDocs] = await Promise.all([
      eventIds.length
        ? EventRsvp.aggregate([
            { $match: { eventId: { $in: eventIds } } },
            { $group: { _id: "$eventId", n: { $sum: 1 } } },
          ])
        : Promise.resolve([]),
      eventIds.length
        ? EventRsvp.find({ userId: user.id, eventId: { $in: eventIds } }).lean()
        : Promise.resolve([]),
      evClubIds.length ? Club.find({ _id: { $in: evClubIds } }).lean() : Promise.resolve([]),
    ]);

    const rsvpCounts = new Map<string, number>(rsvpAgg.map((r: any) => [s(r._id), r.n]));
    const viewerRsvps = new Set<string>((viewerRsvpRows as any[]).map((r: any) => s(r.eventId)));
    const evClubMap = new Map((eventClubDocs as any[]).map((c: any) => [s(c._id), c]));

    const upcomingEvents = upcomingEventDocs.map((e: any) => {
      const club: any = evClubMap.get(s(e.clubId));
      return serializeEvent({
        id: s(e._id),
        clubId: s(e.clubId),
        clubSlug: club?.slug ?? "",
        clubName: club?.name ?? "",
        title: e.title,
        description: e.description,
        startsAt: e.startsAt,
        endsAt: e.endsAt ?? null,
        venue: e.venue,
        capacity: e.capacity ?? null,
        coverUrl: e.coverUrl ?? null,
        status: e.status,
        rsvpCount: rsvpCounts.get(s(e._id)) ?? 0,
        viewerHasRsvp: viewerRsvps.has(s(e._id)),
      });
    });

    const recentNoticeDocs = await Notice.find({
      $or: [{ scope: "university" }, { clubId: { $in: joinedClubIds } }],
      publishAt: { $lte: now },
    })
      .sort({ pinned: -1, publishAt: -1 })
      .limit(10)
      .lean();

    const noticeClubIds = [
      ...new Set(
        recentNoticeDocs.filter((n: any) => n.clubId).map((n: any) => s(n.clubId)),
      ),
    ];
    const noticeClubDocs = noticeClubIds.length
      ? await Club.find({ _id: { $in: noticeClubIds } }).lean()
      : [];
    const noticeClubMap = new Map((noticeClubDocs as any[]).map((c: any) => [s(c._id), c]));

    const recentNotices = recentNoticeDocs.map((n: any) => {
      const club: any = n.clubId ? noticeClubMap.get(s(n.clubId)) : null;
      return serializeNotice({
        id: s(n._id),
        clubId: n.clubId ? s(n.clubId) : null,
        clubSlug: club?.slug ?? null,
        clubName: club?.name ?? null,
        authorId: s(n.authorId),
        title: n.title,
        body: n.body,
        scope: n.scope,
        pinned: n.pinned,
        publishAt: n.publishAt,
        expireAt: n.expireAt ?? null,
        audienceRole: n.audienceRole ?? null,
        createdAt: n.createdAt,
      });
    });

    res.json({ joinedClubs, pendingRequests, upcomingEvents, recentNotices });
  },
);

// ─────────────────────────────────────────────────────────────
// CLUB ADMIN DASHBOARD
// ─────────────────────────────────────────────────────────────

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
    const club = await Club.findOne({ slug }).lean();
    if (!club) {
      res.status(404).json({ error: "Club not found" });
      return;
    }
    const clubId = s((club as any)._id);
    const adminRoles = ["president", "vice_president", "secretary"];
    const mem = await Membership.findOne({ userId: user.id, clubId }).lean();

    if (!mem && user.role !== "overseer") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    if (mem && !adminRoles.includes((mem as any).role) && user.role !== "overseer") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const now = new Date();
    const [memberships, pendingReqs, upcomingEv, pendingEv, recentPosts, notices] =
      await Promise.all([
        Membership.find({ clubId }).sort({ joinedAt: 1 }).lean(),
        JoinRequest.find({ clubId, status: "pending" }).sort({ createdAt: 1 }).lean(),
        Event.find({ clubId, status: "approved", startsAt: { $gte: now } })
          .sort({ startsAt: 1 })
          .limit(5)
          .lean(),
        Event.find({ clubId, status: "pending" }).sort({ createdAt: -1 }).lean(),
        Post.find({ clubId }).sort({ createdAt: -1 }).limit(5).lean(),
        Notice.find({ clubId }).sort({ pinned: -1, publishAt: -1 }).limit(10).lean(),
      ]);

    const memberUserIds = memberships.map((m: any) => m.userId);
    const reqUserIds = pendingReqs.map((r: any) => r.userId);
    const postAuthorIds = recentPosts.map((p: any) => p.authorId);
    const allUserIds = [...new Set([...memberUserIds, ...reqUserIds, ...postAuthorIds].map(s))];
    const userDocs = await User.find({ _id: { $in: allUserIds } }).lean();
    const uMap = new Map(userDocs.map((u: any) => [s(u._id), u]));

    const members = memberships.map((m: any) => {
      const u: any = uMap.get(s(m.userId));
      return serializeMember({
        id: s(m._id),
        userId: s(m.userId),
        clubId,
        clubSlug: (club as any).slug,
        clubName: (club as any).name,
        fullName: u?.fullName ?? "",
        email: u?.email ?? "",
        avatarUrl: u?.avatarUrl ?? null,
        role: m.role,
        joinedAt: m.joinedAt,
      });
    });

    const pendingRequests = pendingReqs.map((r: any) => {
      const u: any = uMap.get(s(r.userId));
      return serializeJoinRequest({
        id: s(r._id),
        userId: s(r.userId),
        clubId,
        clubSlug: (club as any).slug,
        clubName: (club as any).name,
        fullName: u?.fullName ?? "",
        email: u?.email ?? "",
        studentId: u?.studentId ?? null,
        department: u?.department ?? null,
        batch: u?.batch ?? null,
        message: r.message ?? null,
        status: r.status,
        createdAt: r.createdAt,
      });
    });

    const evIds = [...upcomingEv, ...pendingEv].map((e: any) => e._id);
    const rsvpAgg = evIds.length
      ? await EventRsvp.aggregate([
          { $match: { eventId: { $in: evIds } } },
          { $group: { _id: "$eventId", n: { $sum: 1 } } },
        ])
      : [];
    const rsvpCounts = new Map<string, number>(rsvpAgg.map((r: any) => [s(r._id), r.n]));

    const buildEvent = (e: any) =>
      serializeEvent({
        id: s(e._id),
        clubId,
        clubSlug: (club as any).slug,
        clubName: (club as any).name,
        title: e.title,
        description: e.description,
        startsAt: e.startsAt,
        endsAt: e.endsAt ?? null,
        venue: e.venue,
        capacity: e.capacity ?? null,
        coverUrl: e.coverUrl ?? null,
        status: e.status,
        rsvpCount: rsvpCounts.get(s(e._id)) ?? 0,
        viewerHasRsvp: false,
      });

    const posts = recentPosts.map((p: any) => {
      const u: any = uMap.get(s(p.authorId));
      return serializePost({
        id: s(p._id),
        clubId,
        clubSlug: (club as any).slug,
        clubName: (club as any).name,
        title: p.title,
        body: p.body,
        imageUrl: p.imageUrl ?? null,
        authorName: u?.fullName ?? "",
        createdAt: p.createdAt,
      });
    });

    const noticesSerialized = notices.map((n: any) =>
      serializeNotice({
        id: s(n._id),
        clubId,
        clubSlug: (club as any).slug,
        clubName: (club as any).name,
        authorId: s(n.authorId),
        title: n.title,
        body: n.body,
        scope: n.scope,
        pinned: n.pinned,
        publishAt: n.publishAt,
        expireAt: n.expireAt ?? null,
        audienceRole: n.audienceRole ?? null,
        createdAt: n.createdAt,
      }),
    );

    const [memberCount, eventCount] = await Promise.all([
      Membership.countDocuments({ clubId }),
      Event.countDocuments({ clubId, status: "approved" }),
    ]);

    res.json({
      club: serializeClub({
        id: clubId,
        slug: (club as any).slug,
        name: (club as any).name,
        category: (club as any).category,
        shortDescription: (club as any).shortDescription,
        description: (club as any).description,
        logoUrl: (club as any).logoUrl ?? null,
        coverUrl: (club as any).coverUrl ?? null,
        accentColor: (club as any).accentColor,
        websiteUrl: (club as any).websiteUrl ?? null,
        facebookUrl: (club as any).facebookUrl ?? null,
        instagramUrl: (club as any).instagramUrl ?? null,
        memberCount,
        eventCount,
      }),
      members,
      pendingRequests,
      upcomingEvents: upcomingEv.map(buildEvent),
      pendingEvents: pendingEv.map(buildEvent),
      recentPosts: posts,
      notices: noticesSerialized,
    });
  },
);

// ─────────────────────────────────────────────────────────────
// OVERSEER DASHBOARD
// ─────────────────────────────────────────────────────────────

router.get(
  "/dashboard/overseer",
  requireAuth,
  async (req: Request, res: Response) => {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "overseer") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const now = new Date();

    const [
      clubs,
      students,
      faculty,
      clubAdmins,
      approvedEvents,
      pendingEventsCount,
      noticesCount,
      pendingRequests,
      pendingEventDocs,
      recentRequestDocs,
      recentNoticeDocs,
    ] = await Promise.all([
      Club.countDocuments(),
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "faculty" }),
      User.countDocuments({ role: "club_admin" }),
      Event.countDocuments({ status: "approved" }),
      Event.countDocuments({ status: "pending" }),
      Notice.countDocuments(),
      JoinRequest.countDocuments({ status: "pending" }),
      Event.find({ status: "pending" }).sort({ createdAt: -1 }).limit(10).lean(),
      JoinRequest.find({ status: "pending" }).sort({ createdAt: -1 }).limit(10).lean(),
      Notice.find({ publishAt: { $lte: now } })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const pendingEvClubIds = [...new Set(pendingEventDocs.map((e: any) => s(e.clubId)))];
    const reqClubIds = [...new Set(recentRequestDocs.map((r: any) => s(r.clubId)))];
    const noticeClubIds = [
      ...new Set(
        recentNoticeDocs.filter((n: any) => n.clubId).map((n: any) => s(n.clubId)),
      ),
    ];
    const allRelatedClubIds = [...new Set([...pendingEvClubIds, ...reqClubIds, ...noticeClubIds])];
    const reqUserIds = recentRequestDocs.map((r: any) => r.userId);

    const [relatedClubs, reqUsers] = await Promise.all([
      allRelatedClubIds.length
        ? Club.find({ _id: { $in: allRelatedClubIds } }).lean()
        : Promise.resolve([]),
      reqUserIds.length
        ? User.find({ _id: { $in: reqUserIds } }).lean()
        : Promise.resolve([]),
    ]);
    const clubMap = new Map((relatedClubs as any[]).map((c: any) => [s(c._id), c]));
    const userMap = new Map((reqUsers as any[]).map((u: any) => [s(u._id), u]));

    const pendingEventsSerialized = pendingEventDocs.map((e: any) => {
      const club: any = clubMap.get(s(e.clubId));
      return serializeEvent({
        id: s(e._id),
        clubId: s(e.clubId),
        clubSlug: club?.slug ?? "",
        clubName: club?.name ?? "",
        title: e.title,
        description: e.description,
        startsAt: e.startsAt,
        endsAt: e.endsAt ?? null,
        venue: e.venue,
        capacity: e.capacity ?? null,
        coverUrl: e.coverUrl ?? null,
        status: e.status,
        rsvpCount: 0,
        viewerHasRsvp: false,
      });
    });

    const recentRequests = recentRequestDocs.map((r: any) => {
      const club: any = clubMap.get(s(r.clubId));
      const u: any = userMap.get(s(r.userId));
      return serializeJoinRequest({
        id: s(r._id),
        userId: s(r.userId),
        clubId: s(r.clubId),
        clubSlug: club?.slug ?? "",
        clubName: club?.name ?? "",
        fullName: u?.fullName ?? "",
        email: u?.email ?? "",
        studentId: u?.studentId ?? null,
        department: u?.department ?? null,
        batch: u?.batch ?? null,
        message: r.message ?? null,
        status: r.status,
        createdAt: r.createdAt,
      });
    });

    const recentNotices = recentNoticeDocs.map((n: any) => {
      const club: any = n.clubId ? clubMap.get(s(n.clubId)) : null;
      return serializeNotice({
        id: s(n._id),
        clubId: n.clubId ? s(n.clubId) : null,
        clubSlug: club?.slug ?? null,
        clubName: club?.name ?? null,
        authorId: s(n.authorId),
        title: n.title,
        body: n.body,
        scope: n.scope,
        pinned: n.pinned,
        publishAt: n.publishAt,
        expireAt: n.expireAt ?? null,
        audienceRole: n.audienceRole ?? null,
        createdAt: n.createdAt,
      });
    });

    const allClubs = await Club.find().sort({ name: 1 }).lean();
    const [memberCounts, eventCounts] = await Promise.all([
      Membership.aggregate([{ $group: { _id: "$clubId", n: { $sum: 1 } } }]),
      Event.aggregate([
        { $match: { status: "approved" } },
        { $group: { _id: "$clubId", n: { $sum: 1 } } },
      ]),
    ]);
    const memMap = new Map<string, number>(memberCounts.map((r: any) => [s(r._id), r.n]));
    const evMap = new Map<string, number>(eventCounts.map((r: any) => [s(r._id), r.n]));

    const clubsByMembers = (allClubs as any[])
      .map((c: any) =>
        serializeClub({
          id: s(c._id),
          slug: c.slug,
          name: c.name,
          category: c.category,
          shortDescription: c.shortDescription,
          description: c.description,
          logoUrl: c.logoUrl ?? null,
          coverUrl: c.coverUrl ?? null,
          accentColor: c.accentColor,
          websiteUrl: c.websiteUrl ?? null,
          facebookUrl: c.facebookUrl ?? null,
          instagramUrl: c.instagramUrl ?? null,
          memberCount: memMap.get(s(c._id)) ?? 0,
          eventCount: evMap.get(s(c._id)) ?? 0,
        }),
      )
      .sort((a, b) => b.memberCount - a.memberCount);

    res.json({
      totals: {
        clubs,
        students,
        faculty,
        clubAdmins,
        approvedEvents,
        pendingEvents: pendingEventsCount,
        notices: noticesCount,
        pendingRequests,
      },
      clubsByMembers,
      pendingEvents: pendingEventsSerialized,
      recentRequests,
      recentNotices,
    });
  },
);

export default router;
