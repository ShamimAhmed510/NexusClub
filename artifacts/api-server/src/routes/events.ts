import { Router, type IRouter, type Request, type Response } from "express";
import mongoose from "mongoose";
import { Event, EventRsvp, Club, User } from "@workspace/db";
import { getCurrentUser, requireAuth } from "../lib/auth.js";
import { serializeEvent, serializeUserPublic } from "../lib/serializers.js";

const router: IRouter = Router();

function s(id: any): string {
  return id.toString();
}

router.get("/events", async (req: Request, res: Response) => {
  const scope = (req.query.scope as string | undefined) ?? "all";
  const now = new Date();

  let eventDocs = await Event.find({ status: "approved" })
    .sort({ startsAt: 1 })
    .lean();

  if (scope === "upcoming") {
    eventDocs = eventDocs.filter((e: any) => e.startsAt >= now);
  } else if (scope === "past") {
    eventDocs = eventDocs.filter((e: any) => e.startsAt < now).reverse();
  }

  const ids = eventDocs.map((e: any) => e._id);

  let rsvpCounts = new Map<string, number>();
  let viewerRsvps = new Set<string>();

  if (ids.length > 0) {
    const counts = await EventRsvp.aggregate([
      { $match: { eventId: { $in: ids } } },
      { $group: { _id: "$eventId", n: { $sum: 1 } } },
    ]);
    rsvpCounts = new Map(counts.map((c: any) => [s(c._id), c.n]));

    const viewer = await getCurrentUser(req);
    if (viewer) {
      const vRsvps = await EventRsvp.find({
        userId: viewer.id,
        eventId: { $in: ids },
      }).lean();
      viewerRsvps = new Set(vRsvps.map((r: any) => s(r.eventId)));
    }
  }

  const clubIds = [...new Set(eventDocs.map((e: any) => s(e.clubId)))];
  const clubs = await Club.find({ _id: { $in: clubIds } }).lean();
  const clubMap = new Map(clubs.map((c: any) => [s(c._id), c]));

  res.json(
    eventDocs.map((e: any) => {
      const club = clubMap.get(s(e.clubId));
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
    }),
  );
});

router.get("/events/:id", async (req: Request, res: Response) => {
  const id = req.params.id as string;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const e = await Event.findById(id).lean();
  if (!e) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  const club = await Club.findById((e as any).clubId).lean();
  const rsvpCountAgg = await EventRsvp.countDocuments({ eventId: id });
  const viewer = await getCurrentUser(req);
  let viewerHasRsvp = false;
  if (viewer) {
    const v = await EventRsvp.findOne({ userId: viewer.id, eventId: id }).lean();
    viewerHasRsvp = Boolean(v);
  }
  const attendeeRsvps = await EventRsvp.find({ eventId: id })
    .sort({ createdAt: 1 })
    .lean();
  const attendeeIds = attendeeRsvps.map((r: any) => r.userId);
  const attendeeUsers = await User.find({ _id: { $in: attendeeIds } }).lean();

  res.json({
    event: serializeEvent({
      id: s((e as any)._id),
      clubId: s((e as any).clubId),
      clubSlug: (club as any)?.slug ?? "",
      clubName: (club as any)?.name ?? "",
      title: (e as any).title,
      description: (e as any).description,
      startsAt: (e as any).startsAt,
      endsAt: (e as any).endsAt ?? null,
      venue: (e as any).venue,
      capacity: (e as any).capacity ?? null,
      coverUrl: (e as any).coverUrl ?? null,
      status: (e as any).status,
      rsvpCount: rsvpCountAgg,
      viewerHasRsvp,
    }),
    attendees: attendeeUsers.map((u: any) =>
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
  });
});

router.post(
  "/events/:id/approve",
  requireAuth,
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    if (!mongoose.Types.ObjectId.isValid(id)) {
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
    const body = req.body as { decision?: string };
    const decision = body?.decision === "rejected" ? "rejected" : "approved";
    const updated = await Event.findByIdAndUpdate(
      id,
      decision === "approved"
        ? { status: "approved", approvedById: user.id }
        : { status: "rejected" },
      { new: true },
    ).lean();
    if (!updated) {
      res.status(404).json({ error: "Event not found" });
      return;
    }
    const club = await Club.findById((updated as any).clubId).lean();
    res.json(
      serializeEvent({
        id: s((updated as any)._id),
        clubId: s((updated as any).clubId),
        clubSlug: (club as any)?.slug ?? "",
        clubName: (club as any)?.name ?? "",
        title: (updated as any).title,
        description: (updated as any).description,
        startsAt: (updated as any).startsAt,
        endsAt: (updated as any).endsAt ?? null,
        venue: (updated as any).venue,
        capacity: (updated as any).capacity ?? null,
        coverUrl: (updated as any).coverUrl ?? null,
        status: (updated as any).status,
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
    const id = req.params.id as string;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const user = await getCurrentUser(req);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const event = await Event.findById(id).lean();
    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }
    const existing = await EventRsvp.findOne({ userId: user.id, eventId: id }).lean();
    let attending: boolean;
    if (existing) {
      await EventRsvp.findByIdAndDelete((existing as any)._id);
      attending = false;
    } else {
      await EventRsvp.create({ userId: user.id, eventId: id });
      attending = true;
    }
    const rsvpCount = await EventRsvp.countDocuments({ eventId: id });
    res.json({ attending, rsvpCount });
  },
);

export default router;
