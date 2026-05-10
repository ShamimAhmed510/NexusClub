import { Router, type IRouter, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { User } from "@workspace/db";
import { LoginBody, RegisterBody } from "@workspace/api-zod";
import {
  adminClubSlugsForUser,
  getCurrentUser,
  loadUser,
  requireAuth,
  serializeUser,
} from "../lib/auth.js";
import { sendPasswordResetEmail } from "../lib/mailer.js";

const router: IRouter = Router();

router.post("/auth/login", async (req: Request, res: Response) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid credentials payload" });
    return;
  }
  const { username, password } = parsed.data;
  const doc = await User.findOne({ username: username.toLowerCase() }).lean();
  if (!doc) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }
  const ok = await bcrypt.compare(password, (doc as any).passwordHash as string);
  if (!ok) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }
  const userId = (doc._id as any).toString();
  req.session.userId = userId;
  const user = await loadUser(userId);
  if (!user) {
    res.status(500).json({ error: "Login failed" });
    return;
  }
  const adminClubSlugs = await adminClubSlugsForUser(user.id);
  req.log.info(
    { userId: user.id, role: user.role, adminClubSlugCount: adminClubSlugs.length },
    "auth/login: session created",
  );
  res.json({ user: serializeUser(user), adminClubSlugs });
});

router.post("/auth/register", async (req: Request, res: Response) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid registration payload" });
    return;
  }
  const { username, password, fullName, email, role, studentId, department, batch } =
    parsed.data;
  const lcUsername = username.toLowerCase().trim();
  const lcEmail = email.toLowerCase().trim();
  if (lcUsername.length < 3) {
    res.status(400).json({ error: "Username must be at least 3 characters" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }
  const existingByUsername = await User.findOne({ username: lcUsername }).lean();
  if (existingByUsername) {
    res.status(409).json({ error: "Username already taken" });
    return;
  }
  const existingByEmail = await User.findOne({ email: lcEmail }).lean();
  if (existingByEmail) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const created = await User.create({
    username: lcUsername,
    passwordHash,
    fullName,
    email: lcEmail,
    role,
    studentId: studentId ?? null,
    department: department ?? null,
    batch: batch ?? null,
  });
  const userId = created._id.toString();
  req.session.userId = userId;
  const user = await loadUser(userId);
  if (!user) {
    res.status(500).json({ error: "Failed to load user" });
    return;
  }
  res.status(201).json({ user: serializeUser(user), adminClubSlugs: [] });
});

router.post("/auth/logout", (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

router.get("/auth/me", requireAuth, async (req: Request, res: Response) => {
  const user = await getCurrentUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const adminClubSlugs = await adminClubSlugsForUser(user.id);
  req.log.info(
    { userId: user.id, role: user.role, adminClubSlugs },
    "auth/me: session resolved",
  );
  res.json({ user: serializeUser(user), adminClubSlugs });
});

router.post("/auth/forgot-password", async (req: Request, res: Response) => {
  const { email } = req.body as { email?: string };
  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "Email is required" });
    return;
  }
  const lcEmail = email.toLowerCase().trim();
  const doc = await User.findOne({ email: lcEmail }).lean();

  if (!doc) {
    res.json({ ok: true, message: "If that email exists, a reset link has been sent." });
    return;
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  await User.updateOne(
    { _id: (doc as any)._id },
    { $set: { passwordResetToken: token, passwordResetExpires: expires } },
  );

  const appUrl =
    process.env["APP_URL"] ||
    (process.env["REPLIT_DOMAINS"]
      ? `https://${process.env["REPLIT_DOMAINS"].split(",")[0]}`
      : "http://localhost:80");

  try {
    await sendPasswordResetEmail({
      to: lcEmail,
      fullName: (doc as any).fullName as string,
      resetUrl: `${appUrl}/reset-password?token=${token}`,
    });
  } catch (err) {
    req.log.warn({ err }, "Failed to send password reset email");
  }

  res.json({ ok: true, message: "If that email exists, a reset link has been sent." });
});

router.post("/auth/reset-password", async (req: Request, res: Response) => {
  const { token, password } = req.body as { token?: string; password?: string };
  if (!token || !password || typeof token !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "Token and password are required" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  const doc = await User.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: new Date() },
  }).lean();

  if (!doc) {
    res.status(400).json({ error: "Invalid or expired reset token" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await User.updateOne(
    { _id: (doc as any)._id },
    {
      $set: { passwordHash },
      $unset: { passwordResetToken: 1, passwordResetExpires: 1 },
    },
  );

  res.json({ ok: true, message: "Password reset successfully. You can now log in." });
});

export default router;
