import { Router } from "express";
import { getAllListings, getDb, getListingById, HostListing, saveDb } from "./db";
import { AuthedRequest, requireAuth, requireHost } from "./authMiddleware";

const router = Router();

function neighborhoodCoords(neighborhood: string): { lat: number; lng: number; borough: HostListing["borough"] } {
  const map: Record<string, { lat: number; lng: number; borough: HostListing["borough"] }> = {
    soho: { lat: 40.7233, lng: -74.003, borough: "Manhattan" },
    williamsburg: { lat: 40.7081, lng: -73.9571, borough: "Brooklyn" },
    "lower east side": { lat: 40.715, lng: -73.9843, borough: "Manhattan" },
    astoria: { lat: 40.772, lng: -73.9301, borough: "Queens" },
    dumbo: { lat: 40.7033, lng: -73.9881, borough: "Brooklyn" },
    bushwick: { lat: 40.6944, lng: -73.9213, borough: "Brooklyn" },
  };
  const key = neighborhood.trim().toLowerCase();
  return map[key] || { lat: 40.758, lng: -73.9855, borough: "Manhattan" };
}

// Public: all active listings
router.get("/", (_req, res) => {
  res.json(getAllListings());
});

router.get("/:id", (req, res) => {
  const listing = getListingById(req.params.id);
  if (!listing) return res.status(404).json({ error: "Listing not found" });

  // Increment view count
  const db = getDb();
  const idx = db.listings.findIndex((l) => l.id === listing.id);
  if (idx !== -1) {
    db.listings[idx].views = (db.listings[idx].views || 0) + 1;
    saveDb(db);
    return res.json(db.listings[idx]);
  }
  res.json(listing);
});

// Host only: create sublet
router.post("/", requireAuth, requireHost, (req: AuthedRequest, res) => {
  try {
    const {
      title,
      address,
      neighborhood,
      pricePerMonth,
      availableFrom,
      availableTo,
      images = [],
      amenities = [],
      description = "",
      beds = 1,
      baths = 1,
    } = req.body;

    if (!title || !address || !neighborhood || !pricePerMonth || !availableFrom || !availableTo) {
      return res.status(400).json({
        error: "title, address, neighborhood, pricePerMonth, availableFrom, and availableTo are required",
      });
    }

    const coords = neighborhoodCoords(String(neighborhood));
    const imageList: string[] = Array.isArray(images) && images.length > 0
      ? images.map(String)
      : ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1200&auto=format&fit=crop"];

    const listing: HostListing = {
      id: `host-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      hostId: req.user!.id,
      title: String(title).trim(),
      address: String(address).trim(),
      neighborhood: String(neighborhood).trim(),
      borough: coords.borough,
      price: Number(pricePerMonth),
      pricePerMonth: Number(pricePerMonth),
      beds: Number(beds) || 1,
      baths: Number(baths) || 1,
      availableFrom: String(availableFrom),
      availableTo: String(availableTo),
      amenities: Array.isArray(amenities) ? amenities.map(String) : [],
      description: String(description),
      imageUrl: imageList[0],
      galleryImages: imageList,
      images: imageList,
      lat: coords.lat,
      lng: coords.lng,
      views: 0,
      aiRating: 8.5,
      aiRatingBreakdown: { transit: 8.5, safety: 8.2, bodega: 8.8, vibe: 8.6, value: 8.4 },
      source: "Gotham Host",
      sourceUrl: "#",
      youtube_search_term: `${neighborhood} NYC apartment tour`,
      google_place_id: "",
      mock_crime_data: { assault: 2, petit_larceny: 10, noise_complaints: 15 },
      mock_local_reviews: [
        description || "Fresh host listing on GothamIntel.",
        "Host-listed sublet on GothamIntel.",
        "Message the host directly to inquire.",
      ],
      bodega_index: 4,
      subway_lines: ["L", "G"],
      train_alert: null,
      vibe_tags: ["sublet", "furnished", String(neighborhood).toLowerCase()],
      createdAt: new Date().toISOString(),
      active: true,
    };

    const db = getDb();
    db.listings.unshift(listing);
    saveDb(db);

    res.status(201).json(listing);
  } catch (err) {
    console.error("Create listing error:", err);
    res.status(500).json({ error: "Failed to create listing" });
  }
});

export default router;
