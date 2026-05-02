import { Router, type IRouter, type Request, type Response } from "express";
import { Club, Event, Post, Media, User } from "@workspace/db";
import { getCurrentUser, requireAuth } from "../lib/auth.js";
import { cloudinaryEnabled, uploadToCloudinary } from "../lib/cloudinary.js";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage.js";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

const STORAGE_PREFIX = "/api/storage/objects/";

type MigrationStatus = "migrated" | "skipped" | "failed";

interface MigrationResult {
  model: string;
  id: string;
  field: string;
  oldUrl: string;
  newUrl: string;
  status: MigrationStatus;
  error?: string;
}

/**
 * Downloads a Replit Object Storage URL, converts it to a base64 data URI,
 * uploads to Cloudinary, and returns the permanent CDN URL.
 *
 * Accepts paths like: /api/storage/objects/uploads/<uuid>
 */
async function migrateUrl(
  model: string,
  id: string,
  field: string,
  url: string,
): Promise<MigrationResult> {
  if (!url || !url.startsWith(STORAGE_PREFIX)) {
    return { model, id, field, oldUrl: url, newUrl: url, status: "skipped" };
  }

  try {
    // Strip /api/storage prefix → /objects/uploads/<uuid>
    const objectPath = url.replace(/^\/api\/storage/, "");
    const objectFile = await objectStorageService.getObjectEntityFile(objectPath);

    const [metadata] = await objectFile.getMetadata();
    const contentType = (metadata.contentType as string) || "image/jpeg";

    // Stream the file into a Buffer
    const chunks: Buffer[] = [];
    const stream = objectFile.createReadStream();
    await new Promise<void>((resolve, reject) => {
      stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      stream.on("end", resolve);
      stream.on("error", reject);
    });

    const buffer = Buffer.concat(chunks);
    const dataUri = `data:${contentType};base64,${buffer.toString("base64")}`;

    const cdnUrl = await uploadToCloudinary(dataUri, "mu-portal");
    return { model, id, field, oldUrl: url, newUrl: cdnUrl, status: "migrated" };
  } catch (error: any) {
    const msg =
      error instanceof ObjectNotFoundError
        ? "File not found in Object Storage"
        : (error?.message ?? "Unknown error");
    return { model, id, field, oldUrl: url, newUrl: url, status: "failed", error: msg };
  }
}

/**
 * POST /api/admin/migrate-images
 *
 * Overseer-only. Scans all MongoDB collections for `/api/storage/objects/`
 * URLs, downloads each from Replit Object Storage, uploads to Cloudinary,
 * and updates the document with the permanent CDN URL.
 */
router.post(
  "/admin/migrate-images",
  requireAuth,
  async (req: Request, res: Response) => {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "overseer") {
      res.status(403).json({ error: "Overseer access required" });
      return;
    }

    if (!cloudinaryEnabled) {
      res.status(400).json({
        error:
          "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.",
      });
      return;
    }

    const results: MigrationResult[] = [];

    // ── Clubs: logoUrl + coverUrl ──────────────────────────────────────────────
    const clubs = (await Club.find({
      $or: [
        { logoUrl: { $regex: "^/api/storage/objects/" } },
        { coverUrl: { $regex: "^/api/storage/objects/" } },
      ],
    }).lean()) as any[];

    for (const club of clubs) {
      const updates: Record<string, string> = {};
      const id = String(club._id);

      if (typeof club.logoUrl === "string" && club.logoUrl.startsWith(STORAGE_PREFIX)) {
        const r = await migrateUrl("Club", id, "logoUrl", club.logoUrl);
        results.push(r);
        if (r.status === "migrated") updates.logoUrl = r.newUrl;
      }
      if (typeof club.coverUrl === "string" && club.coverUrl.startsWith(STORAGE_PREFIX)) {
        const r = await migrateUrl("Club", id, "coverUrl", club.coverUrl);
        results.push(r);
        if (r.status === "migrated") updates.coverUrl = r.newUrl;
      }
      if (Object.keys(updates).length > 0) {
        await Club.updateOne({ _id: club._id }, { $set: updates });
      }
    }

    // ── Events: coverUrl ──────────────────────────────────────────────────────
    const events = (await Event.find({
      coverUrl: { $regex: "^/api/storage/objects/" },
    }).lean()) as any[];

    for (const event of events) {
      const id = String(event._id);
      if (typeof event.coverUrl === "string") {
        const r = await migrateUrl("Event", id, "coverUrl", event.coverUrl);
        results.push(r);
        if (r.status === "migrated") {
          await Event.updateOne({ _id: event._id }, { $set: { coverUrl: r.newUrl } });
        }
      }
    }

    // ── Posts: imageUrl ───────────────────────────────────────────────────────
    const posts = (await Post.find({
      imageUrl: { $regex: "^/api/storage/objects/" },
    }).lean()) as any[];

    for (const post of posts) {
      const id = String(post._id);
      if (typeof post.imageUrl === "string") {
        const r = await migrateUrl("Post", id, "imageUrl", post.imageUrl);
        results.push(r);
        if (r.status === "migrated") {
          await Post.updateOne({ _id: post._id }, { $set: { imageUrl: r.newUrl } });
        }
      }
    }

    // ── Media gallery: url ────────────────────────────────────────────────────
    const mediaItems = (await Media.find({
      url: { $regex: "^/api/storage/objects/" },
    }).lean()) as any[];

    for (const media of mediaItems) {
      const id = String(media._id);
      if (typeof media.url === "string") {
        const r = await migrateUrl("Media", id, "url", media.url);
        results.push(r);
        if (r.status === "migrated") {
          await Media.updateOne({ _id: media._id }, { $set: { url: r.newUrl } });
        }
      }
    }

    // ── Users: avatarUrl ──────────────────────────────────────────────────────
    const dbUsers = (await User.find({
      avatarUrl: { $regex: "^/api/storage/objects/" },
    }).lean()) as any[];

    for (const dbUser of dbUsers) {
      const id = String(dbUser._id);
      if (typeof dbUser.avatarUrl === "string") {
        const r = await migrateUrl("User", id, "avatarUrl", dbUser.avatarUrl);
        results.push(r);
        if (r.status === "migrated") {
          await User.updateOne({ _id: dbUser._id }, { $set: { avatarUrl: r.newUrl } });
        }
      }
    }

    const summary = {
      total: results.length,
      migrated: results.filter((r) => r.status === "migrated").length,
      skipped: results.filter((r) => r.status === "skipped").length,
      failed: results.filter((r) => r.status === "failed").length,
    };

    req.log.info({ summary }, "Image migration to Cloudinary complete");
    res.json({ success: true, summary, results });
  },
);

/**
 * GET /api/admin/migrate-images/status
 *
 * Overseer-only. Counts how many documents still have Object Storage URLs
 * so the UI can show whether a migration is needed before running it.
 */
router.get(
  "/admin/migrate-images/status",
  requireAuth,
  async (req: Request, res: Response) => {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "overseer") {
      res.status(403).json({ error: "Overseer access required" });
      return;
    }

    const [clubCount, eventCount, postCount, mediaCount, userCount] = await Promise.all([
      Club.countDocuments({
        $or: [
          { logoUrl: { $regex: "^/api/storage/objects/" } },
          { coverUrl: { $regex: "^/api/storage/objects/" } },
        ],
      }),
      Event.countDocuments({ coverUrl: { $regex: "^/api/storage/objects/" } }),
      Post.countDocuments({ imageUrl: { $regex: "^/api/storage/objects/" } }),
      Media.countDocuments({ url: { $regex: "^/api/storage/objects/" } }),
      User.countDocuments({ avatarUrl: { $regex: "^/api/storage/objects/" } }),
    ]);

    const pending = clubCount + eventCount + postCount + mediaCount + userCount;
    res.json({
      pending,
      breakdown: { clubs: clubCount, events: eventCount, posts: postCount, media: mediaCount, users: userCount },
      cloudinaryEnabled,
    });
  },
);

export default router;
