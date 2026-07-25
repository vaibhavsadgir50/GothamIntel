// Multi-agent harness: a small pipeline of cheap-model Gemini calls that turn
// real Google Places reviews into (1) a grounded area profile, (2) a visual
// prompt for that area, and (3) a "neighborhood stamp" image via Nano Banana.
//
// Every model call goes through generateWithFallback so an exact model-name
// mismatch (these shift over time) degrades to the next candidate instead of
// hard-failing the whole pipeline.

import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { PlaceWithReviews } from "./googlePlaces";

// Cheapest-first. An explicit GEMINI_CHEAP_MODEL env var always wins.
// "gemini-flash-lite-latest" is a rolling alias to whatever the current
// cheapest flash-lite tier is; pinned names behind it are verified-available
// fallbacks, with the known-good gemini-3.6-flash (used elsewhere in this
// app) as the last, priciest resort so the pipeline never fully stalls.
const CHEAP_TEXT_MODELS = [
  process.env.GEMINI_CHEAP_MODEL,
  "gemini-flash-lite-latest",
  "gemini-3.5-flash-lite",
  "gemini-2.5-flash-lite",
  "gemini-3.6-flash",
].filter((m): m is string => !!m);

// "Nano Banana" image models, cheapest/verified-working first. GEMINI_IMAGE_MODEL overrides.
const IMAGE_MODELS = [
  process.env.GEMINI_IMAGE_MODEL,
  "gemini-2.5-flash-image",
  "gemini-3.1-flash-lite-image",
  "gemini-3.1-flash-image",
  "gemini-3-pro-image-preview",
].filter((m): m is string => !!m);

async function generateWithFallback(aiClient: GoogleGenAI, models: string[], params: any) {
  let lastErr: unknown = null;
  for (const model of models) {
    try {
      const response = await aiClient.models.generateContent({ ...params, model });
      return { response, model };
    } catch (err) {
      lastErr = err;
      console.warn(`[agent-harness] model "${model}" failed, trying next candidate:`, (err as any)?.message || err);
    }
  }
  throw lastErr;
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

// Agent 1: Area Research Agent — synthesizes real nearby-place reviews into a
// structured, evidence-grounded profile (no invented facts).
export async function runAreaResearchAgent(
  aiClient: GoogleGenAI,
  neighborhood: string,
  borough: string,
  dossier: PlaceWithReviews[]
): Promise<{ profile: AreaProfile; modelUsed: string }> {
  const dossierText = dossier
    .map((p) => {
      const reviewLines = p.reviews
        .slice(0, 5)
        .map((r) => `    - (${r.rating ?? "?"}★) "${r.text.slice(0, 300)}"`)
        .join("\n");
      return `PLACE: ${p.name} [${p.types.slice(0, 3).join(", ")}] — ${p.rating ?? "?"}★ (${p.userRatingCount ?? 0} ratings)\n${reviewLines}`;
    })
    .join("\n\n");

  const prompt = `
You are the Area Research Agent inside a multi-agent NYC real estate intelligence system.
You have been handed REAL Google Maps nearby-place data and REAL user reviews (not fabricated) for the area around a listing in ${neighborhood}, ${borough}.

REAL NEARBY PLACES & REVIEWS:
${dossierText || "(Google Maps returned no nearby places with reviews for this exact location.)"}

Based ONLY on the evidence above, produce a grounded area analysis. Reference real reviews when making a claim. If evidence is thin for a field, say so plainly rather than inventing detail.
`;

  const { response, model } = await generateWithFallback(aiClient, CHEAP_TEXT_MODELS, {
    contents: prompt,
    config: {
      systemInstruction:
        "You are a rigorous, evidence-based NYC area analyst agent. Never invent facts. Every claim must trace back to the provided real review data.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          vibeSummary: { type: Type.STRING },
          safetyTake: { type: Type.STRING },
          noiseTake: { type: Type.STRING },
          foodAndDrinkScene: { type: Type.STRING },
          walkabilityScore: { type: Type.NUMBER },
          standoutSpots: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { name: { type: Type.STRING }, why: { type: Type.STRING } },
              required: ["name", "why"],
            },
          },
          notableQuotes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { placeName: { type: Type.STRING }, quote: { type: Type.STRING } },
              required: ["placeName", "quote"],
            },
          },
          overallVerdict: { type: Type.STRING },
        },
        required: [
          "vibeSummary",
          "safetyTake",
          "noiseTake",
          "foodAndDrinkScene",
          "walkabilityScore",
          "standoutSpots",
          "notableQuotes",
          "overallVerdict",
        ],
      },
    },
  });

  const profile: AreaProfile = JSON.parse(response.text?.trim() || "{}");
  return { profile, modelUsed: model };
}

// Agent 2: Creative Direction Agent — turns the grounded profile into a
// concrete visual prompt for an image model.
export async function runImagePromptAgent(
  aiClient: GoogleGenAI,
  neighborhood: string,
  profile: AreaProfile
): Promise<{ prompt: string; modelUsed: string }> {
  const req = `
You are the Creative Direction Agent. Turn this real, evidence-grounded area profile for "${neighborhood}" into a single vivid visual description (3-5 sentences max) for an image-generation model.

The image is a circular "neighborhood stamp" badge, but the art direction is a maximalist Gen Z infographic / visual map aesthetic — think a hyper-stickered map doodle: bold saturated gradient backgrounds, glossy sticker-style icons with thick white outlines, hand-drawn doodle arrows and dashed paths connecting mini map pins, chunky rounded badges and star-rating bursts, subway-dot icons, food/drink emoji-style icons, a playful collaged/scrapbook layout energy.
Specify: a bright, high-contrast color palette (2-3 dominant colors + one pop accent), 3-5 concrete iconography elements drawn from the profile below (e.g. subway pin, bodega/coffee cup, skyline silhouette, trees/park bench, nightlife sign), and lay them out like a mini illustrated map/infographic inside the circular frame.
Do not request any readable text/words/letters/numbers inside the image itself — sticker iconography and doodles only, no typography.

AREA PROFILE:
Vibe: ${profile.vibeSummary}
Food & drink: ${profile.foodAndDrinkScene}
Standout spots: ${profile.standoutSpots.map((s) => s.name).join(", ")}
Overall verdict: ${profile.overallVerdict}
`;

  const { response, model } = await generateWithFallback(aiClient, CHEAP_TEXT_MODELS, {
    contents: req,
  });

  return {
    prompt:
      response.text?.trim() ||
      `A vintage wax-seal emblem representing the neighborhood of ${neighborhood}, New York City.`,
    modelUsed: model,
  };
}

// Agent 3: Nano Banana stamp image agent — renders the prompt from Agent 2.
// Unlike generateWithFallback's plain try/catch, a model that responds
// without throwing but omits image bytes (e.g. text-only refusal) also counts
// as a miss here, so the next candidate model still gets a shot.
export async function runStampImageAgent(
  aiClient: GoogleGenAI,
  imagePrompt: string
): Promise<{ imageBase64: string; mimeType: string; modelUsed: string }> {
  let lastErr: unknown = null;

  for (const model of IMAGE_MODELS) {
    try {
      const response = await aiClient.models.generateContent({
        model,
        contents: imagePrompt,
        config: { responseModalities: [Modality.TEXT, Modality.IMAGE] },
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      const imgPart = parts.find((p: any) => p.inlineData?.data);

      if (imgPart?.inlineData?.data) {
        return {
          imageBase64: imgPart.inlineData.data,
          mimeType: imgPart.inlineData.mimeType || "image/png",
          modelUsed: model,
        };
      }

      lastErr = new Error(`Model "${model}" responded without image data`);
      console.warn(`[agent-harness] ${(lastErr as Error).message}, trying next candidate`);
    } catch (err) {
      lastErr = err;
      console.warn(`[agent-harness] model "${model}" failed, trying next candidate:`, (err as any)?.message || err);
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error("All image model candidates failed");
}
