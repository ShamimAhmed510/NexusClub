import { Router, type IRouter, type Request, type Response } from "express";
import mongoose from "mongoose";
import { Notification } from "@workspace/db";
import { getCurrentUser, requireAuth } from "../lib/auth.js";

const router: IRouter = Router();

function s(id: any): string {
  return id.toString();
}

router.get("/notifications", requireAuth, async (req: Request, res: Response) => {
  const user = await getCurrentUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const notifications = await Notification.find({ recipientId: user.id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const unreadCount = await Notification.countDocuments({
    recipientId: user.id,
    read: false,
  });

  res.json({
    notifications: notifications.map((n: any) => ({
      id: s(n._id),
      type: n.type,
      message: n.message,
      link: n.link ?? null,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    })),
    unreadCount,
  });
});

router.post(
  "/notifications/:id/read",
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
    await Notification.updateOne(
      { _id: id, recipientId: user.id },
      { $set: { read: true } },
    );
    res.json({ ok: true });
  },
);

router.post(
  "/notifications/mark-all-read",
  requireAuth,
  async (req: Request, res: Response) => {
    const user = await getCurrentUser(req);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    await Notification.updateMany(
      { recipientId: user.id, read: false },
      { $set: { read: true } },
    );
    res.json({ ok: true });
  },
);

export default router;
