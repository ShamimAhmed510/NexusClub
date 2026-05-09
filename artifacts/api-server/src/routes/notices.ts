import { Router, type IRouter, type Request, type Response } from "express";
import mongoose from "mongoose";
import { Notice, Club, Membership } from "@workspace/db";
import { CreateNoticeBody, ApproveNoticeBody } from "@workspace/api-zod";
import { getCurrentUser, requireAuth } from "../lib/auth.js";
import { serializeNotice } from "../lib/serializers.js";
import { createNotification } from "../lib/notify.js";

const router: IRouter = Router();

function s(id: any): string {
  return id.toString();
}

// ── GET /notices ─────────────────────────────────────────────
// Public: only approved notices are returned.
// University-scoped notices from overseer are always approved.
// Club-scoped notices are pending until overseer approves.

router.get("/notices", async (req: Request, res: Response) => {
  const scope = req.query.scope as string | undefined;
  const filter: Record<string, any> = { status: "approved" };

  if (scope === "university") filter.scope = "university";
  else if (scope === "club") filter.scope = "club";
  else if (scope === "pinned") {
    filter.pinned = true;
    delete filter.status; // pinned can show all approved
    filter.status = "approved";
  }

  const notices = await Notice.find(filter)
    .sort({ pinned: -1, publishAt: -1 })
    .lean();

  const now = new Date();
  const validNotices = notices.filter(
    (n: any) => (!n.expireAt || n.expireAt > now) && n.publishAt <= now,
  );

  const clubIds = [
    ...new Set(
      validNotices.filter((n: any) => n.clubId).map((n: any) => s(n.clubId)),
    ),
  ];
  const clubs = clubIds.length
    ? await Club.find({ _id: { $in: clubIds } }).lean()
    : [];
  const clubMap = new Map(clubs.map((c: any) => [s(c._id), c]));

  res.json(
    validNotices.map((n: any) => {
      const club = n.clubId ? clubMap.get(s(n.clubId)) : null;
      return serializeNotice({
        id: s(n._id),
        clubId: n.clubId ? s(n.clubId) : null,
        clubSlug: (club as any)?.slug ?? null,
        clubName: (club as any)?.name ?? null,
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
    }),
  );
});

// ── GET /clubs/:slug/notices ──────────────────────────────────
// Returns approved notices for a specific club (via clubs.ts routing)

// ── POST /notices ─────────────────────────────────────────────
// University notices (overseer only): auto-approved
// Club notices (club admin): start as pending, need overseer approval

router.post("/notices", requireAuth, async (req: Request, res: Response) => {
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

  const publishAt = parsed.data.publishAt ? new Date(parsed.data.publishAt) : new Date();
  const expireAt = parsed.data.expireAt ? new Date(parsed.data.expireAt) : null;

  let clubId: string | null = null;
  let clubSlug: string | null = null;
  let clubName: string | null = null;
  let status = "pending";

  if (parsed.data.scope === "club" && parsed.data.clubSlug) {
    const club = await Club.findOne({ slug: parsed.data.clubSlug }).lean();
    if (!club) {
      res.status(404).json({ error: "Club not found" });
      return;
    }
    clubId = s((club as any)._id);
    clubSlug = (club as any).slug;
    clubName = (club as any).name;

    if (user.role !== "overseer") {
      const membership = await Membership.findOne({ userId: user.id, clubId }).lean();
      const adminRoles = ["president", "vice_president", "secretary"];
      if (!membership || !adminRoles.includes((membership as any).role)) {
        res.status(403).json({ error: "Only club admins can publish notices for this club" });
        return;
      }
      // Club admin notices start as pending (await overseer approval)
      status = "pending";
    } else {
      // Overseer-created club notices are auto-approved
      status = "approved";
    }
  } else if (user.role === "overseer") {
    // University-wide notice by overseer: auto-approved
    status = "approved";
  } else {
    res.status(403).json({ error: "Only overseer can create university-wide notices" });
    return;
  }

  const created = await Notice.create({
    clubId,
    authorId: user.id,
    title: parsed.data.title,
    body: parsed.data.body,
    scope: parsed.data.scope,
    status,
    pinned: parsed.data.pinned ?? false,
    publishAt,
    expireAt,
    audienceRole: parsed.data.audienceRole ?? null,
  });

  const c = created as any;
  res.status(201).json(
    serializeNotice({
      id: c._id.toString(),
      clubId,
      clubSlug,
      clubName,
      authorId: user.id,
      title: c.title,
      body: c.body,
      scope: c.scope,
      status: c.status,
      pinned: c.pinned,
      publishAt: c.publishAt,
      expireAt: c.expireAt ?? null,
      audienceRole: c.audienceRole ?? null,
      createdAt: c.createdAt,
    }),
  );
});

// ── DELETE /notices/:id ───────────────────────────────────────
// Club admin (for their own club notice) or overseer can delete

router.delete(
  "/notices/:id",
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
    const notice = await Notice.findById(id).lean();
    if (!notice) {
      res.status(404).json({ error: "Notice not found" });
      return;
    }
    if (user.role === "overseer") {
      await Notice.findByIdAndDelete(id);
      res.status(204).send();
      return;
    }
    if ((notice as any).clubId) {
      const clubId = s((notice as any).clubId);
      const membership = await Membership.findOne({ userId: user.id, clubId }).lean();
      const adminRoles = ["president", "vice_president", "secretary"];
      if (membership && adminRoles.includes((membership as any).role)) {
        await Notice.findByIdAndDelete(id);
        res.status(204).send();
        return;
      }
    }
    res.status(403).json({ error: "Forbidden" });
  },
);

// ── POST /notices/:id/approve ─────────────────────────────────
// Overseer approves or rejects a pending club notice

router.post(
  "/notices/:id/approve",
  requireAuth,
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const user = await getCurrentUser(req);
    if (!user || user.role !== "overseer") {
      res.status(403).json({ error: "Only overseers can approve notices" });
      return;
    }

    const parsed = ApproveNoticeBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload — decision must be approved or rejected" });
      return;
    }

    const updated = await Notice.findByIdAndUpdate(
      id,
      { status: parsed.data.decision },
      { new: true },
    ).lean();

    if (!updated) {
      res.status(404).json({ error: "Notice not found" });
      return;
    }

    let clubSlug: string | null = null;
    let clubName: string | null = null;
    if ((updated as any).clubId) {
      const club = await Club.findById((updated as any).clubId).lean();
      clubSlug = (club as any)?.slug ?? null;
      clubName = (club as any)?.name ?? null;
    }

    // Notify the notice author of the decision
    await createNotification({
      recipientId: s((updated as any).authorId),
      type: parsed.data.decision === "approved" ? "notice_approved" : "notice_rejected",
      message:
        parsed.data.decision === "approved"
          ? `Your notice "${(updated as any).title}" has been approved and is now live.`
          : `Your notice "${(updated as any).title}" was rejected by the overseer.`,
      link: "/notices",
    });

    res.json(
      serializeNotice({
        id: s((updated as any)._id),
        clubId: (updated as any).clubId ? s((updated as any).clubId) : null,
        clubSlug,
        clubName,
        authorId: s((updated as any).authorId),
        title: (updated as any).title,
        body: (updated as any).body,
        scope: (updated as any).scope,
        pinned: (updated as any).pinned,
        publishAt: (updated as any).publishAt,
        expireAt: (updated as any).expireAt ?? null,
        audienceRole: (updated as any).audienceRole ?? null,
        createdAt: (updated as any).createdAt,
      }),
    );
  },
);

export default router;
