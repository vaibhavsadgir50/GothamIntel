import { Router } from "express";
import { getDb, saveDb } from "./db";
import { AuthedRequest, requireAuth, requireHost } from "./authMiddleware";

const router = Router();

router.use(requireAuth, requireHost);

// GET /api/host/listings
router.get("/listings", (req: AuthedRequest, res) => {
  const db = getDb();
  const listings = db.listings.filter((l) => l.hostId === req.user!.id);
  res.json(listings);
});

// GET /api/host/inquiries
router.get("/inquiries", (req: AuthedRequest, res) => {
  const db = getDb();
  const inquiries = db.inquiries
    .filter((i) => i.hostId === req.user!.id)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  res.json(inquiries);
});

// PATCH /api/host/inquiries/:id — accept / decline
router.patch("/inquiries/:id", (req: AuthedRequest, res) => {
  const { status } = req.body;
  if (status !== "accepted" && status !== "declined" && status !== "pending") {
    return res.status(400).json({ error: "status must be pending, accepted, or declined" });
  }

  const db = getDb();
  const idx = db.inquiries.findIndex(
    (i) => i.id === req.params.id && i.hostId === req.user!.id
  );
  if (idx === -1) return res.status(404).json({ error: "Inquiry not found" });

  db.inquiries[idx].status = status;
  db.inquiries[idx].updatedAt = new Date().toISOString();
  saveDb(db);
  res.json(db.inquiries[idx]);
});

// GET /api/host/stats
router.get("/stats", (req: AuthedRequest, res) => {
  const db = getDb();
  const hostListings = db.listings.filter((l) => l.hostId === req.user!.id);
  const hostInquiries = db.inquiries.filter((i) => i.hostId === req.user!.id);

  const totalViews = hostListings.reduce((sum, l) => sum + (l.views || 0), 0);
  const activeInquiries = hostInquiries.filter((i) => i.status === "pending").length;
  const conversionRate = totalViews > 0 ? Number(((hostInquiries.length / totalViews) * 100).toFixed(1)) : 0;

  const workplaceCounts: Record<string, number> = {};
  hostInquiries.forEach((i) => {
    const workplace = i.seekerWorkplace || "Not specified";
    workplaceCounts[workplace] = (workplaceCounts[workplace] || 0) + 1;
  });

  const topWorkplaces = Object.entries(workplaceCounts)
    .map(([workplace, count]) => ({ workplace, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const neighborhoodViews: Record<string, number> = {};
  hostListings.forEach((l) => {
    neighborhoodViews[l.neighborhood] = (neighborhoodViews[l.neighborhood] || 0) + (l.views || 0);
  });

  res.json({
    totalViews,
    activeInquiries,
    totalInquiries: hostInquiries.length,
    conversionRate,
    activeListings: hostListings.filter((l) => l.active).length,
    topWorkplaces,
    neighborhoodViews,
    acceptedCount: hostInquiries.filter((i) => i.status === "accepted").length,
    declinedCount: hostInquiries.filter((i) => i.status === "declined").length,
  });
});

export default router;
