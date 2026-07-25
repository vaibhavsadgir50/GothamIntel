// Thin client for the Places API (New). Used by the area-intel agent harness
// to ground its answers in real nearby places and real Google Maps reviews
// instead of the fabricated `mock_local_reviews` in listings.json.

const PLACES_BASE = "https://places.googleapis.com/v1";

const NEARBY_TYPES = [
  "restaurant",
  "cafe",
  "bar",
  "bakery",
  "supermarket",
  "grocery_store",
  "subway_station",
  "park",
  "gym",
  "night_club",
];

export interface NearbyPlace {
  id: string;
  name: string;
  types: string[];
  rating?: number;
  userRatingCount?: number;
}

export interface PlaceReview {
  authorName: string;
  rating?: number;
  text: string;
  relativeTime?: string;
}

export interface PlaceWithReviews extends NearbyPlace {
  reviews: PlaceReview[];
}

export async function searchNearbyPlaces(
  lat: number,
  lng: number,
  apiKey: string,
  radiusMeters = 700
): Promise<NearbyPlace[]> {
  const res = await fetch(`${PLACES_BASE}/places:searchNearby`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.types,places.rating,places.userRatingCount",
    },
    body: JSON.stringify({
      includedTypes: NEARBY_TYPES,
      maxResultCount: 20,
      rankPreference: "POPULARITY",
      locationRestriction: {
        circle: { center: { latitude: lat, longitude: lng }, radius: radiusMeters },
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Places nearby search failed (${res.status}): ${body}`);
  }

  const data: any = await res.json();
  const places: any[] = data.places || [];
  return places.map((p) => ({
    id: p.id,
    name: p.displayName?.text || "Unnamed place",
    types: p.types || [],
    rating: p.rating,
    userRatingCount: p.userRatingCount,
  }));
}

export async function getPlaceReviews(
  placeId: string,
  apiKey: string
): Promise<PlaceWithReviews | null> {
  const res = await fetch(`${PLACES_BASE}/places/${placeId}`, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "id,displayName,types,rating,userRatingCount,reviews",
    },
  });

  if (!res.ok) return null;

  const p: any = await res.json();
  const reviews: PlaceReview[] = (p.reviews || [])
    .map((r: any) => ({
      authorName: r.authorAttribution?.displayName || "Local Guide",
      rating: r.rating,
      text: r.text?.text || r.originalText?.text || "",
      relativeTime: r.relativePublishTimeDescription,
    }))
    .filter((r: PlaceReview) => r.text.trim().length > 0);

  return {
    id: p.id,
    name: p.displayName?.text || "Unnamed place",
    types: p.types || [],
    rating: p.rating,
    userRatingCount: p.userRatingCount,
    reviews,
  };
}

function popularityScore(p: NearbyPlace): number {
  return (p.rating || 0) * Math.log10((p.userRatingCount || 0) + 10);
}

// Fetches nearby places, ranks them, and pulls real reviews for the top N —
// this bounded fan-out keeps Places Details calls (and therefore cost) capped
// regardless of how dense the neighborhood is.
export async function buildAreaDossier(
  lat: number,
  lng: number,
  apiKey: string,
  limit = 8
): Promise<PlaceWithReviews[]> {
  const nearby = await searchNearbyPlaces(lat, lng, apiKey);
  const top = [...nearby].sort((a, b) => popularityScore(b) - popularityScore(a)).slice(0, limit);

  const detailed = await Promise.all(top.map((p) => getPlaceReviews(p.id, apiKey)));
  return detailed.filter((p): p is PlaceWithReviews => p !== null && p.reviews.length > 0);
}
