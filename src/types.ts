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
  source: 'StreetEasy' | 'Zillow' | 'Apartments.com';
  sourceUrl: string;
  youtube_search_term: string;
  google_place_id: string;
  mock_crime_data: CrimeData;
  mock_local_reviews: string[];
  bodega_index: number;
  subway_lines: string[];
  train_alert: string | null;
  vibe_tags: string[];
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
