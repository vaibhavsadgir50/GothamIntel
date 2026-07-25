import { Router } from "express";
import { getDb, saveDb } from "./db";
import { AuthedRequest, requireAuth } from "./authMiddleware";

const router = Router();

// Seeker creates an inquiry on a listing
router.post("/", requireAuth, (req: AuthedRequest, res) => {
  try {
    if (req.user!.role !== "seeker") {
      return res.status(403).json({ error: "Only seekers can submit inquiries" });
    }

    const { listingId, message } = req.body;
    if (!listingId || !String(message || "").trim()) {
      return res.status(400).json({ error: "listingId and message are required" });
    }

    const db = getDb();
    const listing = db.listings.find((l) => l.id === listingId);
    if (!listing) return res.status(404).json({ error: "Listing not found" });

    const existing = db.inquiries.find(
      (i) => i.listingId === listingId && i.seekerId === req.user!.id && i.status === "pending"
    );
    if (existing) {
      return res.status(409).json({ error: "You already have a pending inquiry on this listing", inquiry: existing });
    }

    const inquiry = {
      id: `inq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      listingId: listing.id,
      listingTitle: listing.title,
      hostId: listing.hostId,
      seekerId: req.user!.id,
      seekerName: req.user!.name,
      seekerEmail: req.user!.email,
      seekerWorkplace: req.user!.companyName,
      message: String(message).trim(),
      status: "pending" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.inquiries.unshift(inquiry);
    saveDb(db);
    res.status(201).json(inquiry);
  } catch (err) {
    console.error("Create inquiry error:", err);
    res.status(500).json({ error: "Failed to create inquiry" });
  }
});

// Seeker: my inquiries
router.get("/mine", requireAuth, (req: AuthedRequest, res) => {
  const db = getDb();
  const inquiries = db.inquiries
    .filter((i) => i.seekerId === req.user!.id)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  res.json(inquiries);
});

export default router;
