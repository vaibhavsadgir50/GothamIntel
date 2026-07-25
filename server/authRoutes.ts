import { Router } from "express";
import {
  createToken,
  getDb,
  publicUser,
  saveDb,
  UserRole,
} from "./db";
import { AuthedRequest, requireAuth } from "./authMiddleware";

const router = Router();

router.post("/signup", (req, res) => {
  try {
    const { email, password, name, role = "seeker", companyName, bio } = req.body;
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanName = String(name || "").trim();
    const cleanPassword = String(password || "");
    const cleanRole: UserRole = role === "host" ? "host" : "seeker";

    if (!cleanEmail || !cleanPassword || !cleanName) {
      return res.status(400).json({ error: "Name, email, and password are required." });
    }
    if (cleanPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long." });
    }

    const db = getDb();
    if (db.users.some((u) => u.email === cleanEmail)) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    const user = {
      id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      email: cleanEmail,
      password: cleanPassword,
      name: cleanName,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanName)}`,
      role: cleanRole,
      companyName:
        cleanRole === "seeker" && companyName ? String(companyName).trim() : undefined,
      bio: bio ? String(bio).trim() : undefined,
      savedListingIds: [] as string[],
      createdAt: new Date().toISOString(),
    };

    const token = createToken();
    db.users.push(user);
    db.sessions.push({ token, userId: user.id, createdAt: new Date().toISOString() });
    saveDb(db);

    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Failed to create account" });
  }
});

router.post("/login", (req, res) => {
  try {
    const cleanEmail = String(req.body.email || "").trim().toLowerCase();
    const cleanPassword = String(req.body.password || "");

    if (!cleanEmail || !cleanPassword) {
      return res.status(400).json({ error: "Please enter both email and password." });
    }

    const db = getDb();
    const user = db.users.find((u) => u.email === cleanEmail && u.password === cleanPassword);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = createToken();
    db.sessions.push({ token, userId: user.id, createdAt: new Date().toISOString() });
    saveDb(db);

    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Authentication failed" });
  }
});

router.post("/logout", requireAuth, (req: AuthedRequest, res) => {
  const db = getDb();
  db.sessions = db.sessions.filter((s) => s.token !== req.token);
  saveDb(db);
  res.json({ success: true });
});

router.get("/me", requireAuth, (req: AuthedRequest, res) => {
  res.json({ user: publicUser(req.user!) });
});

router.patch("/me", requireAuth, (req: AuthedRequest, res) => {
  const db = getDb();
  const idx = db.users.findIndex((u) => u.id === req.user!.id);
  if (idx === -1) return res.status(404).json({ error: "User not found" });

  const { companyName, bio, name, savedListingIds } = req.body;
  if (typeof companyName === "string") db.users[idx].companyName = companyName.trim();
  if (typeof bio === "string") db.users[idx].bio = bio.trim();
  if (typeof name === "string" && name.trim()) db.users[idx].name = name.trim();
  if (Array.isArray(savedListingIds)) db.users[idx].savedListingIds = savedListingIds;

  saveDb(db);
  res.json({ user: publicUser(db.users[idx]) });
});

export default router;
