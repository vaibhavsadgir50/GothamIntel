export type UserRole = 'seeker' | 'host';
export type InquiryStatus = 'pending' | 'accepted' | 'declined';

export interface CrimeData {
  assault: number;
  petit_larceny: number;
  noise_complaints: number;
}

export interface AIRatingBreakdown {
  transit: number;
  safety: number;
  bodega: number;
  vibe: number;
  value: number;
}

export interface Listing {
  id: string;
  title: string;
  price: number;
  beds: number;
  baths: number;
  neighborhood: string;
  borough: 'Manhattan' | 'Brooklyn' | 'Queens';
  address: string;
  lat: number;
  lng: number;
  amenities: string[];
  imageUrl: string;
  galleryImages: string[];
  aiRating: number;
  aiRatingBreakdown: AIRatingBreakdown;
  source: 'StreetEasy' | 'Zillow' | 'Apartments.com' | 'Gotham Host';
  sourceUrl: string;
  youtube_search_term: string;
  google_place_id: string;
  mock_crime_data: CrimeData;
  mock_local_reviews: string[];
  bodega_index: number;
  subway_lines: string[];
  train_alert: string | null;
  vibe_tags: string[];
  hostId?: string;
  pricePerMonth?: number;
  availableFrom?: string;
  availableTo?: string;
  description?: string;
  images?: string[];
  views?: number;
  createdAt?: string;
  active?: boolean;
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

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: UserRole;
  senderName: string;
  text: string;
  createdAt: string;
}

export interface HostStats {
  totalViews: number;
  activeInquiries: number;
  totalInquiries: number;
  conversionRate: number;
  activeListings: number;
  topWorkplaces: { workplace: string; count: number }[];
  neighborhoodViews: Record<string, number>;
  acceptedCount: number;
  declinedCount: number;
}

export interface SassyIntel {
  safetyReality: string;
  noiseVibeForecast: string;
  ultimateLeaseVerdict: string;
  bodegaGrade: string;
  transitHack: string;
  neighborhoodPersonality: string;
}

export interface IntelResponse {
  listingId: string;
  listingTitle: string;
  neighborhood: string;
  borough: string;
  intel: SassyIntel;
  isGeminiLive: boolean;
  timestamp: string;
}

export interface VibeSearchResponse {
  vibeSummary: string;
  filteredIds: string[];
  extractedKeywords: string[];
  aiConfidence: string;
  totalMatches: number;
}

export interface FilterState {
  searchQuery: string;
  borough: string;
  maxPrice: number;
  minBeds: number;
  selectedVibe: string;
  imagePreview: string | null;
  audioRecorded: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
}

export interface AreaProfile {
  vibeSummary: string;
  safetyTake: string;
  noiseTake: string;
  foodAndDrinkScene: string;
  walkabilityScore: number;
  standoutSpots: { name: string; why: string }[];
  notableQuotes: { placeName: string; quote: string }[];
  overallVerdict: string;
}

export interface NearbyPlaceSummary {
  name: string;
  types: string[];
  rating?: number;
  userRatingCount?: number;
  reviews: { authorName: string; rating?: number; text: string; relativeTime?: string }[];
}

export interface AreaIntelResponse {
  listingId: string;
  isLive: boolean;
  reason?: string;
  modelUsed?: string;
  cachedAt?: number;
  profile: AreaProfile | null;
  nearbyPlaces: NearbyPlaceSummary[];
}

export interface AreaStampResponse {
  listingId: string;
  imageDataUrl: string;
  prompt: string;
  modelUsed: string;
  cachedAt: number;
}
