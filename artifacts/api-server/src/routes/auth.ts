import { Router, type IRouter, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { LoginBody, RegisterBody } from "@workspace/api-zod";
import {
  adminClubSlugsForUser,
  getCurrentUser,
  loadUser,
  requireAuth,
  serializeUser,
} from "../lib/auth";

const router: IRouter = Router();

router.post("/auth/login", async (req: Request, res: Response) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid credentials payload" });
    return;
  }
  const { username, password } = parsed.data;
  const [row] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username.toLowerCase()))
    .limit(1);
  if (!row) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }
  const ok = await bcrypt.compare(password, row.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }
  req.session.userId = row.id;
  const user = await loadUser(row.id);
  if (!user) {
    res.status(500).json({ error: "Login failed" });
    return;
  }
  const adminClubSlugs = await adminClubSlugsForUser(user.id);
  res.json({ user: serializeUser(user), adminClubSlugs });
});

router.post("/auth/register", async (req: Request, res: Response) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid registration payload" });
    return;
  }
  const { username, password, fullName, email, role, studentId, department } =
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
  const [existingByUsername] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.username, lcUsername))
    .limit(1);
  if (existingByUsername) {
    res.status(409).json({ error: "Username already taken" });
    return;
  }
  const [existingByEmail] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, lcEmail))
    .limit(1);
  if (existingByEmail) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const [created] = await db
    .insert(usersTable)
    .values({
      username: lcUsername,
      passwordHash,
      fullName,
      email: lcEmail,
      role,
      studentId: studentId ?? null,
      department: department ?? null,
    })
    .returning();
  if (!created) {
    res.status(500).json({ error: "Failed to create user" });
    return;
  }
  req.session.userId = created.id;
  const user = await loadUser(created.id);
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
  res.json({ user: serializeUser(user), adminClubSlugs });
});

export default router;
