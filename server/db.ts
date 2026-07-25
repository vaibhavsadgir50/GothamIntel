import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// esbuild bundles this to CJS for production, where import.meta.url is empty
// (esbuild warns and strips it) but the CJS module wrapper's native __dirname
// exists; tsx runs this file as ESM in dev, where __dirname doesn't exist but
// import.meta.url does. Naming this the same as __dirname would shadow it and
// hit the TDZ, so it's kept as a separate constant.
const moduleDir: string =
  typeof __dirname !== "undefined" ? __dirname : path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(moduleDir, "..", "data");
const DB_PATH = path.join(DATA_DIR, "platform-db.json");
const SEED_LISTINGS_PATH = path.join(moduleDir, "..", "src", "data", "listings.json");

export type UserRole = "seeker" | "host";
export type InquiryStatus = "pending" | "accepted" | "declined";

export interface DbUser {
  id: string;
  email: string;
  password: string;
  name: string;
  avatarUrl: string;
  role: UserRole;
  companyName?: string;
  bio?: string;
  savedListingIds: string[];
  createdAt: string;
}

export interface HostListing {
  id: string;
  hostId: string;
  title: string;
  address: string;
  neighborhood: string;
  borough: "Manhattan" | "Brooklyn" | "Queens";
  price: number;
  pricePerMonth: number;
  beds: number;
  baths: number;
  availableFrom: string;
  availableTo: string;
  amenities: string[];
  description: string;
  imageUrl: string;
  galleryImages: string[];
  images: string[];
  lat: number;
  lng: number;
  views: number;
  aiRating: number;
  aiRatingBreakdown: {
    transit: number;
    safety: number;
    bodega: number;
    vibe: number;
    value: number;
  };
  source: "StreetEasy" | "Zillow" | "Apartments.com" | "Gotham Host";
  sourceUrl: string;
  youtube_search_term: string;
  google_place_id: string;
  mock_crime_data: {
    assault: number;
    petit_larceny: number;
    noise_complaints: number;
  };
  mock_local_reviews: string[];
  bodega_index: number;
  subway_lines: string[];
  train_alert: string | null;
  vibe_tags: string[];
  createdAt: string;
  active: boolean;
}

export interface Inquiry {
  id: string;
  listingId: string;
  listingTitle: string;
  hostId: string;
  seekerId: string;
  seekerName: string;
  seekerEmail: string;
  seekerWorkplace?: string;
  message: string;
  status: InquiryStatus;
  conversationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  listingId: string;
  listingTitle: string;
  inquiryId?: string;
  hostId: string;
  hostName: string;
  seekerId: string;
  seekerName: string;
  lastMessageAt: string;
  lastMessagePreview: string;
}

export interface ChatMessageRecord {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: UserRole;
  senderName: string;
  text: string;
  createdAt: string;
}

export interface SessionRecord {
  token: string;
  userId: string;
  createdAt: string;
}

interface PlatformDb {
  users: DbUser[];
  sessions: SessionRecord[];
  listings: HostListing[];
  inquiries: Inquiry[];
  conversations: Conversation[];
  messages: ChatMessageRecord[];
}

const DEMO_HOST_ID = "user_demo_host";
const DEMO_SEEKER_ID = "user_demo_seeker";

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadSeedListings(): HostListing[] {
  try {
    const raw = fs.readFileSync(SEED_LISTINGS_PATH, "utf-8");
    const seeds = JSON.parse(raw) as any[];
    return seeds.map((l, index) => ({
      ...l,
      hostId: DEMO_HOST_ID,
      pricePerMonth: l.price,
      availableFrom: "2026-08-01",
      availableTo: "2026-12-31",
      description: l.mock_local_reviews?.[0] || l.title,
      images: l.galleryImages || [l.imageUrl],
      views: 40 + index * 17,
      createdAt: new Date(Date.now() - index * 86400000).toISOString(),
      active: true,
      source: l.source || "Gotham Host",
    }));
  } catch (err) {
    console.error("Failed to load seed listings:", err);
    return [];
  }
}

function createDefaultDb(): PlatformDb {
  const avatar = (seed: string) =>
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;

  return {
    users: [
      {
        id: DEMO_HOST_ID,
        email: "host@gotham.dev",
        password: "host123",
        name: "Alex Rivera",
        avatarUrl: avatar("Alex Rivera"),
        role: "host",
        bio: "Listing my furnished NYC place while I'm away for a few months.",
        savedListingIds: [],
        createdAt: new Date().toISOString(),
      },
      {
        id: DEMO_SEEKER_ID,
        email: "seeker@gotham.dev",
        password: "seeker123",
        name: "Jordan Lee",
        avatarUrl: avatar("Jordan Lee"),
        role: "seeker",
        companyName: "Freelance",
        bio: "Looking for a quiet Brooklyn sublet this fall.",
        savedListingIds: [],
        createdAt: new Date().toISOString(),
      },
    ],
    sessions: [],
    listings: loadSeedListings(),
    inquiries: [],
    conversations: [],
    messages: [],
  };
}

function readDb(): PlatformDb {
  ensureDataDir();
  if (!fs.existsSync(DB_PATH)) {
    const fresh = createDefaultDb();
    writeDb(fresh);
    return fresh;
  }
  try {
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(raw) as PlatformDb;
  } catch {
    const fresh = createDefaultDb();
    writeDb(fresh);
    return fresh;
  }
}

function writeDb(db: PlatformDb) {
  ensureDataDir();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

export function getDb(): PlatformDb {
  return readDb();
}

export function saveDb(db: PlatformDb) {
  writeDb(db);
}

export function publicUser(user: DbUser) {
  const { password: _pw, ...rest } = user;
  return rest;
}

export function createToken(): string {
  return `tok_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

export function findUserByToken(token: string | undefined): DbUser | null {
  if (!token) return null;
  const db = readDb();
  const session = db.sessions.find((s) => s.token === token);
  if (!session) return null;
  return db.users.find((u) => u.id === session.userId) || null;
}

export function getAllListings(): HostListing[] {
  return readDb().listings.filter((l) => l.active !== false);
}

export function getListingById(id: string): HostListing | undefined {
  return readDb().listings.find((l) => l.id === id);
}

export { DEMO_HOST_ID, DEMO_SEEKER_ID };
