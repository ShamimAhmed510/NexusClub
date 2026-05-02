import { Router, type IRouter, type Request, type Response } from "express";
import mongoose from "mongoose";
import {
  Club,
  Event,
  EventRsvp,
  JoinRequest,
  Media,
  Membership,
  Notice,
  Post,
  User,
} from "@workspace/db";
import {
  CreateClubBody,
  UpdateClubBody,
  RequestJoinClubBody,
  DecideJoinRequestBody,
  UpdateMemberRoleBody,
  CreateEventBody,
  CreatePostBody,
  AddClubMediaBody,
} from "@workspace/api-zod";
import { getCurrentUser, requireAuth } from "../lib/auth.js";
import {
  serializeClub,
  serializeEvent,
  serializeJoinRequest,
  serializeMedia,
  serializeMember,
  serializeNotice,
  serializePost,
} from "../lib/serializers.js";
import bcrypt from "bcryptjs";

const router: IRouter = Router();

function s(id: any): string {
  return id.toString();
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function userIsClubAdminOrOverseer(
  userId: string,
  clubId: string,
  role: string,
): Promise<boolean> {
  if (role === "overseer") return true;
  const m = await Membership.findOne({ userId, clubId }).lean();
  if (!m) return false;
  return ["president", "vice_president", "secretary"].includes((m as any).role);
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

async function buildEventRows(
  eventDocs: any[],
  viewerUserId: string | null,
  clubSlug: string,
  clubName: string,
) {
  if (eventDocs.length === 0) return [];
  const ids = eventDocs.map((e: any) => e._id);

  const [rsvpAgg, viewerRsvpRows] = await Promise.all([
    EventRsvp.aggregate([
      { $match: { eventId: { $in: ids } } },
      { $group: { _id: "$eventId", n: { $sum: 1 } } },
    ]),
    viewerUserId
      ? EventRsvp.find({ userId: viewerUserId, eventId: { $in: ids } }).lean()
      : Promise.resolve([]),
  ]);

  const rsvpCounts = new Map<string, number>(rsvpAgg.map((r: any) => [s(r._id), r.n]));
  const viewerRsvps = new Set<string>((viewerRsvpRows as any[]).map((r: any) => s(r.eventId)));

  return eventDocs.map((e: any) =>
    serializeEvent({
      id: s(e._id),
      clubId: s(e.clubId),
      clubSlug,
      clubName,
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
    }),
  );
}

// ─────────────────────────────────────────────────────────────
// CLUBS
// ─────────────────────────────────────────────────────────────

router.get("/clubs", async (_req: Request, res: Response) => {
  const clubs = await Club.find().sort({ name: 1 }).lean();
  if (clubs.length === 0) {
    res.json([]);
    return;
  }

  const [memberCounts, eventCounts] = await Promise.all([
    Membership.aggregate([{ $group: { _id: "$clubId", n: { $sum: 1 } } }]),
    Event.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: "$clubId", n: { $sum: 1 } } },
    ]),
  ]);

  const memMap = new Map<string, number>(memberCounts.map((r: any) => [s(r._id), r.n]));
  const evMap = new Map<string, number>(eventCounts.map((r: any) => [s(r._id), r.n]));

  res.json(
    clubs.map((c: any) =>
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
    ),
  );
});

router.post("/clubs", requireAuth, async (req: Request, res: Response) => {
  const user = await getCurrentUser(req);
  if (!user || user.role !== "overseer") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const parsed = CreateClubBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload" });
    return;
  }
  const { name, category, shortDescription, description, accentColor } = parsed.data;
  let slug = slugify(name);
  const existing = await Club.findOne({ slug }).lean();
  if (existing) slug = `${slug}-${Date.now()}`;

  const club = await Club.create({
    slug,
    name,
    category: category ?? "General",
    shortDescription: shortDescription ?? "",
    description: description ?? "",
    accentColor: accentColor ?? "#1f4e79",
  });

  if (parsed.data.adminUsername && parsed.data.adminPassword && parsed.data.adminFullName) {
    const existingAdmin = await User.findOne({
      username: parsed.data.adminUsername.toLowerCase(),
    }).lean();
    if (!existingAdmin) {
      const hash = await bcrypt.hash(parsed.data.adminPassword, 10);
      const adminUser = await User.create({
        username: parsed.data.adminUsername.toLowerCase(),
        passwordHash: hash,
        fullName: parsed.data.adminFullName,
        email: `${parsed.data.adminUsername.toLowerCase()}@mu.edu`,
        role: "club_admin",
      });
      await Membership.create({
        userId: adminUser._id,
        clubId: club._id,
        role: "president",
        joinedAt: new Date(),
      });
    }
  }

  res.status(201).json(await getClubWithCounts(club.toObject()));
});

router.get("/clubs/:slug", async (req: Request, res: Response) => {
  const slug = String(req.params.slug);
  const club = await Club.findOne({ slug }).lean();
  if (!club) {
    res.status(404).json({ error: "Club not found" });
    return;
  }
  const clubId = s((club as any)._id);
  const viewer = await getCurrentUser(req);

  const [memberships, eventDocs, postDocs, noticeDocs, mediaDocs] = await Promise.all([
    Membership.find({ clubId }).sort({ joinedAt: 1 }).lean(),
    Event.find({ clubId, status: "approved" }).sort({ startsAt: 1 }).lean(),
    Post.find({ clubId }).sort({ createdAt: -1 }).limit(10).lean(),
    Notice.find({ clubId }).sort({ pinned: -1, publishAt: -1 }).lean(),
    Media.find({ clubId }).sort({ createdAt: -1 }).lean(),
  ]);

  const memberUserIds = memberships.map((m: any) => m.userId);
  const memberUsers = await User.find({ _id: { $in: memberUserIds } }).lean();
  const userMap = new Map(memberUsers.map((u: any) => [s(u._id), u]));

  const allMembers = memberships.map((m: any) => {
    const u: any = userMap.get(s(m.userId));
    return serializeMember({
      id: s(m._id),
      userId: s(m.userId),
      clubId: s(m.clubId),
      clubSlug: (club as any).slug,
      clubName: (club as any).name,
      fullName: u?.fullName ?? "",
      email: u?.email ?? "",
      avatarUrl: u?.avatarUrl ?? null,
      role: m.role,
      joinedAt: m.joinedAt,
    });
  });

  const leadership = allMembers.filter(
    (m) => m.role !== "member",
  );

  const now = new Date();
  const viewerId = viewer?.id ?? null;
  const allEventSerialized = await buildEventRows(
    eventDocs,
    viewerId,
    (club as any).slug,
    (club as any).name,
  );
  const upcomingEvents = allEventSerialized.filter(
    (e) => new Date(e.startsAt) >= now,
  );
  const pastEvents = allEventSerialized
    .filter((e) => new Date(e.startsAt) < now)
    .reverse();

  const authorIds = [...new Set(postDocs.map((p: any) => s(p.authorId)))];
  const authors = await User.find({ _id: { $in: authorIds } }).lean();
  const authorMap = new Map(authors.map((a: any) => [s(a._id), a]));

  const posts = postDocs.map((p: any) => {
    const author: any = authorMap.get(s(p.authorId));
    return serializePost({
      id: s(p._id),
      clubId: s(p.clubId),
      clubSlug: (club as any).slug,
      clubName: (club as any).name,
      title: p.title,
      body: p.body,
      imageUrl: p.imageUrl ?? null,
      authorName: author?.fullName ?? "",
      createdAt: p.createdAt,
    });
  });

  const notices = noticeDocs.map((n: any) =>
    serializeNotice({
      id: s(n._id),
      clubId: s(n.clubId),
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

  const achievements = mediaDocs
    .filter((m: any) => m.category === "achievement")
    .map((m: any) =>
      serializeMedia({
        id: s(m._id),
        clubId: s(m.clubId),
        clubSlug: (club as any).slug,
        url: m.url,
        caption: m.caption ?? null,
        category: m.category,
        createdAt: m.createdAt,
      }),
    );
  const gallery = mediaDocs
    .filter((m: any) => m.category !== "achievement")
    .map((m: any) =>
      serializeMedia({
        id: s(m._id),
        clubId: s(m.clubId),
        clubSlug: (club as any).slug,
        url: m.url,
        caption: m.caption ?? null,
        category: m.category,
        createdAt: m.createdAt,
      }),
    );

  const [memberCount, eventCount] = await Promise.all([
    Membership.countDocuments({ clubId }),
    Event.countDocuments({ clubId, status: "approved" }),
  ]);

  let viewerMembership = null;
  if (viewer) {
    const mem = await Membership.findOne({ userId: viewer.id, clubId }).lean();
    const req2 = await JoinRequest.findOne({ userId: viewer.id, clubId }).sort({ createdAt: -1 }).lean();
    viewerMembership = {
      status: mem ? "approved" : req2 ? (req2 as any).status : "none",
      role: mem ? (mem as any).role : null,
      membershipId: mem ? s((mem as any)._id) : null,
      requestId: req2 ? s((req2 as any)._id) : null,
    };
  }

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

router.patch("/clubs/:slug", requireAuth, async (req: Request, res: Response) => {
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
  const club = await Club.findOne({ slug }).lean();
  if (!club) {
    res.status(404).json({ error: "Club not found" });
    return;
  }
  const allowed = await userIsClubAdminOrOverseer(user.id, s((club as any)._id), user.role);
  if (!allowed) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const updates: Record<string, any> = {};
  const d = parsed.data;
  if (d.name !== undefined) updates.name = d.name;
  if (d.category !== undefined) updates.category = d.category;
  if (d.shortDescription !== undefined) updates.shortDescription = d.shortDescription;
  if (d.description !== undefined) updates.description = d.description;
  if (d.logoUrl !== undefined) updates.logoUrl = d.logoUrl;
  if (d.coverUrl !== undefined) updates.coverUrl = d.coverUrl;
  if (d.accentColor !== undefined) updates.accentColor = d.accentColor;
  if (d.websiteUrl !== undefined) updates.websiteUrl = d.websiteUrl;
  if (d.facebookUrl !== undefined) updates.facebookUrl = d.facebookUrl;
  if (d.instagramUrl !== undefined) updates.instagramUrl = d.instagramUrl;

  const updated = await Club.findByIdAndUpdate((club as any)._id, updates, { new: true }).lean();
  if (!updated) {
    res.status(404).json({ error: "Club not found" });
    return;
  }
  res.json(await getClubWithCounts(updated));
});

// ─────────────────────────────────────────────────────────────
// MEMBERS
// ─────────────────────────────────────────────────────────────

router.get("/clubs/:slug/members", async (req: Request, res: Response) => {
  const slug = String(req.params.slug);
  const club = await Club.findOne({ slug }).lean();
  if (!club) {
    res.status(404).json({ error: "Club not found" });
    return;
  }
  const memberships = await Membership.find({ clubId: s((club as any)._id) })
    .sort({ joinedAt: 1 })
    .lean();
  const userIds = memberships.map((m: any) => m.userId);
  const users = await User.find({ _id: { $in: userIds } }).lean();
  const userMap = new Map(users.map((u: any) => [s(u._id), u]));

  res.json(
    memberships.map((m: any) => {
      const u: any = userMap.get(s(m.userId));
      return serializeMember({
        id: s(m._id),
        userId: s(m.userId),
        clubId: s(m.clubId),
        clubSlug: (club as any).slug,
        clubName: (club as any).name,
        fullName: u?.fullName ?? "",
        email: u?.email ?? "",
        avatarUrl: u?.avatarUrl ?? null,
        role: m.role,
        joinedAt: m.joinedAt,
      });
    }),
  );
});

router.post(
  "/clubs/:slug/join",
  requireAuth,
  async (req: Request, res: Response) => {
    const slug = String(req.params.slug);
    const parsed = RequestJoinClubBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload" });
      return;
    }
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
    const existing = await Membership.findOne({ userId: user.id, clubId }).lean();
    if (existing) {
      res.status(409).json({ error: "Already a member" });
      return;
    }
    const pendingReq = await JoinRequest.findOne({
      userId: user.id,
      clubId,
      status: "pending",
    }).lean();
    if (pendingReq) {
      res.status(409).json({ error: "Join request already pending" });
      return;
    }
    const created = await JoinRequest.create({
      userId: user.id,
      clubId,
      message: parsed.data.message ?? null,
      status: "pending",
    });
    res.status(201).json(
      serializeJoinRequest({
        id: created._id.toString(),
        userId: user.id,
        clubId,
        clubSlug: (club as any).slug,
        clubName: (club as any).name,
        fullName: user.fullName,
        email: user.email,
        studentId: user.studentId,
        department: user.department,
        batch: null,
        message: created.message as string | null,
        status: "pending",
        createdAt: created.createdAt as Date,
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
    const club = await Club.findOne({ slug }).lean();
    if (!club) {
      res.status(404).json({ error: "Club not found" });
      return;
    }
    const clubId = s((club as any)._id);
    const allowed = await userIsClubAdminOrOverseer(user.id, clubId, user.role);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const requests = await JoinRequest.find({ clubId, status: "pending" })
      .sort({ createdAt: 1 })
      .lean();
    const userIds = requests.map((r: any) => r.userId);
    const users = await User.find({ _id: { $in: userIds } }).lean();
    const uMap = new Map(users.map((u: any) => [s(u._id), u]));

    res.json(
      requests.map((r: any) => {
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
      }),
    );
  },
);

router.post(
  "/join-requests/:id/decision",
  requireAuth,
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const parsed = DecideJoinRequestBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload" });
      return;
    }
    const actor = await getCurrentUser(req);
    if (!actor) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const joinReq = await JoinRequest.findById(id).lean();
    if (!joinReq) {
      res.status(404).json({ error: "Request not found" });
      return;
    }
    if ((joinReq as any).status !== "pending") {
      res.status(409).json({ error: "Already decided" });
      return;
    }
    const clubId = s((joinReq as any).clubId);
    const club = await Club.findById(clubId).lean();
    if (!club) {
      res.status(404).json({ error: "Club not found" });
      return;
    }
    const allowed = await userIsClubAdminOrOverseer(actor.id, clubId, actor.role);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const { decision } = parsed.data;
    const updated = await JoinRequest.findByIdAndUpdate(
      id,
      { status: decision, decidedAt: new Date() },
      { new: true },
    ).lean();
    if (decision === "approved") {
      const existing = await Membership.findOne({
        userId: s((joinReq as any).userId),
        clubId,
      }).lean();
      if (!existing) {
        await Membership.create({
          userId: s((joinReq as any).userId),
          clubId,
          role: "member",
          joinedAt: new Date(),
        });
      }
    }
    const u = await User.findById((joinReq as any).userId).lean();
    res.json(
      serializeJoinRequest({
        id,
        userId: s((updated as any).userId),
        clubId,
        clubSlug: (club as any).slug,
        clubName: (club as any).name,
        fullName: (u as any)?.fullName ?? "",
        email: (u as any)?.email ?? "",
        studentId: (u as any)?.studentId ?? null,
        department: (u as any)?.department ?? null,
        batch: (u as any)?.batch ?? null,
        message: (updated as any).message ?? null,
        status: (updated as any).status,
        createdAt: (updated as any).createdAt,
      }),
    );
  },
);

router.patch(
  "/memberships/:id/role",
  requireAuth,
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const parsed = UpdateMemberRoleBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload" });
      return;
    }
    const actor = await getCurrentUser(req);
    if (!actor) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const m = await Membership.findById(id).lean();
    if (!m) {
      res.status(404).json({ error: "Membership not found" });
      return;
    }
    const clubId = s((m as any).clubId);
    const allowed = await userIsClubAdminOrOverseer(actor.id, clubId, actor.role);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const updated = await Membership.findByIdAndUpdate(
      id,
      { role: parsed.data.role },
      { new: true },
    ).lean();
    const club = await Club.findById(clubId).lean();
    const u = await User.findById((m as any).userId).lean();
    res.json(
      serializeMember({
        id,
        userId: s((updated as any).userId),
        clubId,
        clubSlug: (club as any)?.slug ?? "",
        clubName: (club as any)?.name ?? "",
        fullName: (u as any)?.fullName ?? "",
        email: (u as any)?.email ?? "",
        avatarUrl: (u as any)?.avatarUrl ?? null,
        role: (updated as any).role,
        joinedAt: (updated as any).joinedAt,
      }),
    );
  },
);

// ─────────────────────────────────────────────────────────────
// EVENTS
// ─────────────────────────────────────────────────────────────

router.get("/clubs/:slug/events", async (req: Request, res: Response) => {
  const slug = String(req.params.slug);
  const club = await Club.findOne({ slug }).lean();
  if (!club) {
    res.status(404).json({ error: "Club not found" });
    return;
  }
  const clubId = s((club as any)._id);
  const includePending = req.query.status === "pending";
  const statusFilter = includePending ? "pending" : "approved";
  const viewer = await getCurrentUser(req);

  const eventDocs = await Event.find({ clubId, status: statusFilter })
    .sort({ startsAt: 1 })
    .lean();

  const rows = await buildEventRows(
    eventDocs,
    viewer?.id ?? null,
    (club as any).slug,
    (club as any).name,
  );
  res.json(rows);
});

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
    const club = await Club.findOne({ slug }).lean();
    if (!club) {
      res.status(404).json({ error: "Club not found" });
      return;
    }
    const clubId = s((club as any)._id);
    const allowed = await userIsClubAdminOrOverseer(user.id, clubId, user.role);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const created = await Event.create({
      clubId,
      title: parsed.data.title,
      description: parsed.data.description,
      startsAt: new Date(parsed.data.startsAt),
      endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : null,
      venue: parsed.data.venue,
      capacity: parsed.data.capacity ?? null,
      coverUrl: parsed.data.coverUrl ?? null,
      status: "pending",
      createdById: user.id,
    });
    res.status(201).json(
      serializeEvent({
        id: created._id.toString(),
        clubId,
        clubSlug: (club as any).slug,
        clubName: (club as any).name,
        title: created.title as string,
        description: created.description as string,
        startsAt: created.startsAt as Date,
        endsAt: (created.endsAt as Date | null) ?? null,
        venue: created.venue as string,
        capacity: (created.capacity as number | null) ?? null,
        coverUrl: (created.coverUrl as string | null) ?? null,
        status: created.status as string,
        rsvpCount: 0,
        viewerHasRsvp: false,
      }),
    );
  },
);

// ─────────────────────────────────────────────────────────────
// POSTS
// ─────────────────────────────────────────────────────────────

router.get("/clubs/:slug/posts", async (req: Request, res: Response) => {
  const slug = String(req.params.slug);
  const club = await Club.findOne({ slug }).lean();
  if (!club) {
    res.status(404).json({ error: "Club not found" });
    return;
  }
  const posts = await Post.find({ clubId: s((club as any)._id) })
    .sort({ createdAt: -1 })
    .lean();
  const authorIds = [...new Set(posts.map((p: any) => s(p.authorId)))];
  const authors = await User.find({ _id: { $in: authorIds } }).lean();
  const authorMap = new Map(authors.map((a: any) => [s(a._id), a]));

  res.json(
    posts.map((p: any) => {
      const author: any = authorMap.get(s(p.authorId));
      return serializePost({
        id: s(p._id),
        clubId: s(p.clubId),
        clubSlug: (club as any).slug,
        clubName: (club as any).name,
        title: p.title,
        body: p.body,
        imageUrl: p.imageUrl ?? null,
        authorName: author?.fullName ?? "",
        createdAt: p.createdAt,
      });
    }),
  );
});

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
    const club = await Club.findOne({ slug }).lean();
    if (!club) {
      res.status(404).json({ error: "Club not found" });
      return;
    }
    const clubId = s((club as any)._id);
    const allowed = await userIsClubAdminOrOverseer(user.id, clubId, user.role);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const created = await Post.create({
      clubId,
      authorId: user.id,
      title: parsed.data.title,
      body: parsed.data.body,
      imageUrl: parsed.data.imageUrl ?? null,
    });
    res.status(201).json(
      serializePost({
        id: created._id.toString(),
        clubId,
        clubSlug: (club as any).slug,
        clubName: (club as any).name,
        title: created.title as string,
        body: created.body as string,
        imageUrl: (created.imageUrl as string | null) ?? null,
        authorName: user.fullName,
        createdAt: created.createdAt as Date,
      }),
    );
  },
);

// ─────────────────────────────────────────────────────────────
// NOTICES
// ─────────────────────────────────────────────────────────────

router.get("/clubs/:slug/notices", async (req: Request, res: Response) => {
  const slug = String(req.params.slug);
  const club = await Club.findOne({ slug }).lean();
  if (!club) {
    res.status(404).json({ error: "Club not found" });
    return;
  }
  const clubId = s((club as any)._id);
  const notices = await Notice.find({ clubId })
    .sort({ pinned: -1, publishAt: -1 })
    .lean();
  res.json(
    notices.map((n: any) =>
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
    ),
  );
});

// ─────────────────────────────────────────────────────────────
// MEDIA
// ─────────────────────────────────────────────────────────────

router.get("/clubs/:slug/media", async (req: Request, res: Response) => {
  const slug = String(req.params.slug);
  const category = req.query.category as string | undefined;
  const club = await Club.findOne({ slug }).lean();
  if (!club) {
    res.status(404).json({ error: "Club not found" });
    return;
  }
  const clubId = s((club as any)._id);
  const filter: Record<string, any> = { clubId };
  if (category && category !== "all") filter.category = category;

  const rows = await Media.find(filter).sort({ createdAt: -1 }).lean();
  res.json(
    rows.map((m: any) =>
      serializeMedia({
        id: s(m._id),
        clubId,
        clubSlug: (club as any).slug,
        url: m.url,
        caption: m.caption ?? null,
        category: m.category,
        createdAt: m.createdAt,
      }),
    ),
  );
});

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
    const club = await Club.findOne({ slug }).lean();
    if (!club) {
      res.status(404).json({ error: "Club not found" });
      return;
    }
    const clubId = s((club as any)._id);
    const allowed = await userIsClubAdminOrOverseer(user.id, clubId, user.role);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const created = await Media.create({
      clubId,
      uploaderId: user.id,
      url: parsed.data.url,
      caption: parsed.data.caption ?? null,
      category: parsed.data.category,
    });
    res.status(201).json(
      serializeMedia({
        id: created._id.toString(),
        clubId,
        clubSlug: (club as any).slug,
        url: created.url as string,
        caption: (created.caption as string | null) ?? null,
        category: created.category as string,
        createdAt: created.createdAt as Date,
      }),
    );
  },
);

export default router;
