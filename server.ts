import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load listings data
const listingsPath = path.join(__dirname, "src", "data", "listings.json");
let listingsData = [];
try {
  const raw = fs.readFileSync(listingsPath, "utf-8");
  listingsData = JSON.parse(raw);
} catch (err) {
  console.error("Error reading listings.json:", err);
}

// Initialize Gemini AI client
const geminiApiKey = process.env.GEMINI_API_KEY || "";
let aiClient: GoogleGenAI | null = null;
if (geminiApiKey && geminiApiKey !== "MY_GEMINI_API_KEY") {
  try {
    aiClient = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  } catch (e) {
    console.error("Failed to initialize GoogleGenAI:", e);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "25mb" }));

  // API Route: Get all listings
  app.get("/api/listings", (req, res) => {
    res.json(listingsData);
  });

  // API Route: Get single listing by ID
  app.get("/api/listings/:id", (req, res) => {
    const listing = listingsData.find((l: any) => l.id === req.params.id);
    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }
    res.json(listing);
  });

  // API Route: Real AI Agent Property Chat Assistant
  app.post("/api/chat", async (req, res) => {
    try {
      const { listingId, message, history = [] } = req.body;
      const listing = listingsData.find((l: any) => l.id === listingId);

      if (!message || !message.trim()) {
        return res.status(400).json({ error: "Message is required" });
      }

      let agentReply = "";

      if (aiClient && listing) {
        try {
          const systemPrompt = `
You are GothamIntel's street-smart, razor-sharp, authentic NYC Real Estate AI Assistant.
The user is viewing and asking questions about a specific NYC apartment listing:

LISTING SPECIFICATIONS:
Title: ${listing.title}
Address: ${listing.address}
Neighborhood: ${listing.neighborhood}, ${listing.borough}
Rent: $${listing.price}/month
Beds/Baths: ${listing.beds} Bed, ${listing.baths} Bath
Subway Access: ${listing.subway_lines.join(", ")} lines (${listing.train_alert || "Normal service"})
Amenities: ${listing.amenities.join(", ")}
AI Score: ${listing.aiRating || 9.5}/10
Bodega Index: ${listing.bodega_index}/5

CRIME & STREET REALITY:
Assaults (90d): ${listing.mock_crime_data.assault}, Larceny: ${listing.mock_crime_data.petit_larceny}, Noise Complaints: ${listing.mock_crime_data.noise_complaints}

RESIDENT INSIDER QUOTES:
- "${listing.mock_local_reviews[0]}"
- "${listing.mock_local_reviews[1]}"

INSTRUCTIONS:
- Give a concise, street-smart, friendly, and authentic NYC answer (2-4 sentences max).
- Include genuine local insight (subway commute tips, noise levels, bodega advice, rent value).
- Be direct, informative, and engaging.
`;

          const chatMessages = [
            { role: "user", parts: [{ text: systemPrompt }] },
            ...history.map((h: any) => ({
              role: h.sender === "user" ? "user" : "model",
              parts: [{ text: h.text }],
            })),
            { role: "user", parts: [{ text: message }] },
          ];

          const chatResponse = await aiClient.models.generateContent({
            model: "gemini-3.6-flash",
            contents: chatMessages as any,
          });

          if (chatResponse.text) {
            agentReply = chatResponse.text.trim();
          }
        } catch (err) {
          console.error("Gemini Chat API Error:", err);
        }
      }

      // Fallback response if Gemini fails or client not configured
      if (!agentReply && listing) {
        const queryLower = message.toLowerCase();
        if (queryLower.includes("subway") || queryLower.includes("train") || queryLower.includes("commute")) {
          agentReply = `For ${listing.neighborhood}, you're right on the ${listing.subway_lines.join("/")} train lines! Typical commute to Midtown Manhattan is about 12-18 minutes flat.`;
        } else if (queryLower.includes("noise") || queryLower.includes("loud") || queryLower.includes("quiet")) {
          agentReply = `In terms of street noise, this area clocked ${listing.mock_crime_data.noise_complaints} noise calls over 90 days. It's lively during peak hours, but inside the unit, it's quite cozy!`;
        } else if (queryLower.includes("bodega") || queryLower.includes("food") || queryLower.includes("bec")) {
          agentReply = `Bodega situation is an elite ${listing.bodega_index}/5 rating! You've got a 24/7 bodega within 60 seconds walk for midnight Bacon-Egg-and-Cheese emergencies.`;
        } else if (queryLower.includes("rent") || queryLower.includes("price") || queryLower.includes("deal")) {
          agentReply = `At $${listing.price}/mo for a ${listing.beds}-bed in ${listing.neighborhood}, our Gotham AI algorithm rates this a ${listing.aiRating}/10 value score!`;
        } else {
          agentReply = `Great question about ${listing.title}! In ${listing.neighborhood}, this unit offers ${listing.amenities.slice(0, 3).join(", ")} and instant access to the ${listing.subway_lines.join(", ")} lines. Let me know if you want to inspect crime stats or lease terms!`;
        }
      }

      res.json({ reply: agentReply || "I'm standing by to help with all Gotham real estate questions." });
    } catch (err: any) {
      console.error("Chat route error:", err);
      res.status(500).json({ error: "Failed to process chat request" });
    }
  });

  // API Route: Vibe Search (Multimodal: Text, Image, Audio)
  app.post("/api/vibe-search", async (req, res) => {
    try {
      const { query = "", imageData = "", audioData = "", borough = "all", maxPrice = 10000 } = req.body;

      let extractedKeywords: string[] = [];
      let vibeSummary = "";
      let aiConfidence = "High (Gemini 3.6 Flash)";

      // Fallback keyword extraction logic
      const promptLower = query.toLowerCase();

      if (aiClient) {
        try {
          const contentsParts: any[] = [];

          if (imageData) {
            // Strip base64 prefix if present
            const cleanBase64 = imageData.replace(/^data:image\/\w+;base64,/, "");
            contentsParts.push({
              inlineData: {
                mimeType: "image/jpeg",
                data: cleanBase64,
              },
            });
            contentsParts.push({
              text: "Analyze this image for real estate vibes, architectural style, amenities, and mood (e.g., exposed brick, industrial loft, quiet park view, luxury highrise). Extract matching NYC apartment keywords and write a 2-sentence vibe summary for an NYC apartment buyer.",
            });
          } else if (audioData) {
            const cleanBase64 = audioData.replace(/^data:audio\/\w+;base64,/, "");
            contentsParts.push({
              inlineData: {
                mimeType: "audio/webm",
                data: cleanBase64,
              },
            });
            contentsParts.push({
              text: "Listen to this audio prompt describing a dream NYC apartment. Extract the key rental requirements, desired amenities, price vibe, and neighborhood style. Summarize in 2 sentences and output top keywords.",
            });
          } else {
            contentsParts.push({
              text: `User search query: "${query}". Identify key real estate vibe keywords (e.g., "exposed brick", "L train", "quiet", "luxury", "pre-war", "nightlife", "doorman", "skyline", "park view", "artistic") and write a witty 2-sentence NYC real estate summary matching this search request.`,
            });
          }

          const response = await aiClient.models.generateContent({
            model: "gemini-3.6-flash",
            contents: { parts: contentsParts },
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  vibeSummary: { type: Type.STRING },
                  keywords: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ["vibeSummary", "keywords"],
              },
            },
          });

          if (response.text) {
            const parsed = JSON.parse(response.text.trim());
            vibeSummary = parsed.vibeSummary || "";
            extractedKeywords = parsed.keywords || [];
          }
        } catch (geminiError) {
          console.error("Gemini Vibe Search Error:", geminiError);
          aiConfidence = "Deterministic NYC Vibe Engine";
        }
      }

      // Fallback or augment keywords if Gemini didn't return enough
      if (extractedKeywords.length === 0) {
        const potentialTags = [
          "exposed brick",
          "L train",
          "pre-war",
          "busy nightlife",
          "quiet",
          "luxury",
          "doorman",
          "skyline views",
          "terrace",
          "artistic",
          "speakeasy",
          "walkup",
          "elevator",
        ];
        extractedKeywords = potentialTags.filter((tag) => promptLower.includes(tag.toLowerCase()));
        if (extractedKeywords.length === 0 && query.trim().length > 0) {
          extractedKeywords = query.split(/\s+/).filter((w) => w.length > 3);
        }
        if (!vibeSummary) {
          vibeSummary = query.trim()
            ? `Scanning Gotham listings matching "${query}". Priority filters applied for NYC transport and borough culture.`
            : "Displaying top Gotham curated real estate listings across Manhattan, Brooklyn, and Queens.";
        }
      }

      // Filter listings based on extracted keywords, price, borough
      let filtered = listingsData.filter((listing: any) => {
        // Price check
        if (listing.price > maxPrice) return false;

        // Borough check
        if (borough !== "all" && listing.borough.toLowerCase() !== borough.toLowerCase()) {
          return false;
        }

        return true;
      });

      // Score matching listings based on keywords
      if (extractedKeywords.length > 0) {
        const scored = filtered.map((listing: any) => {
          let score = 0;
          const fullText = (
            listing.title +
            " " +
            listing.neighborhood +
            " " +
            listing.amenities.join(" ") +
            " " +
            listing.vibe_tags.join(" ")
          ).toLowerCase();

          extractedKeywords.forEach((kw) => {
            if (fullText.includes(kw.toLowerCase())) score += 2;
          });

          if (promptLower && fullText.includes(promptLower)) score += 5;

          return { listing, score };
        });

        // Sort by score descending
        scored.sort((a, b) => b.score - a.score);
        filtered = scored.map((s) => s.listing);
      }

      const filteredIds = filtered.map((l: any) => l.id);

      res.json({
        vibeSummary: vibeSummary || `Matched ${filtered.length} NYC properties fitting your criteria.`,
        filteredIds,
        extractedKeywords,
        aiConfidence,
        totalMatches: filtered.length,
      });
    } catch (err: any) {
      console.error("Vibe search route error:", err);
      res.status(500).json({ error: "Failed to process vibe search" });
    }
  });

  // API Route: Sassy New Yorker Neighborhood Intel
  app.get("/api/neighborhood-intel/:id", async (req, res) => {
    try {
      const listing = listingsData.find((l: any) => l.id === req.params.id);
      if (!listing) {
        return res.status(404).json({ error: "Listing not found" });
      }

      let intel: any = null;
      let isGeminiLive = false;

      if (aiClient) {
        try {
          const promptText = `
You are a witty, born-and-raised NYC real estate veteran and street-smart borough expert.
Analyze this NYC rental listing and deliver an unfiltered, authentic "Sassy New Yorker" breakdown:

LISTING INFO:
Title: ${listing.title}
Neighborhood: ${listing.neighborhood}, ${listing.borough}
Address: ${listing.address}
Price: $${listing.price}/mo
Amenities: ${listing.amenities.join(", ")}
Subway Lines: ${listing.subway_lines.join(", ")}
Subway Alert: ${listing.train_alert || "None"}
Crime Data (Last 90 Days): Assaults: ${listing.mock_crime_data.assault}, Petit Larceny: ${listing.mock_crime_data.petit_larceny}, Noise Complaints: ${listing.mock_crime_data.noise_complaints}
Local Resident Reviews:
- "${listing.mock_local_reviews[0]}"
- "${listing.mock_local_reviews[1]}"
- "${listing.mock_local_reviews[2]}"

Please provide JSON with these exact fields:
1. "safetyReality": Factual yet sassy breakdown of safety, crime stats, and street feel.
2. "noiseVibeForecast": Unfiltered review of train noise, bar crowds, delivery trucks, and midnight decibels.
3. "ultimateLeaseVerdict": Highly opinionated advice on whether to sign or pass.
4. "bodegaGrade": Sassy evaluation of the local 24/7 bodega & Bacon-Egg-and-Cheese quality.
5. "transitHack": Local insider subway cheat code (which car to ride, secret entrances, delay shortcuts).
6. "neighborhoodPersonality": A witty 1-sentence archetype of the typical neighbor in this area.
          `;

          const response = await aiClient.models.generateContent({
            model: "gemini-3.6-flash",
            contents: promptText,
            config: {
              systemInstruction: "You are an authentic, witty NYC real estate veteran who gives hilarious, street-smart, razor-sharp advice to NYC renters.",
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  safetyReality: { type: Type.STRING },
                  noiseVibeForecast: { type: Type.STRING },
                  ultimateLeaseVerdict: { type: Type.STRING },
                  bodegaGrade: { type: Type.STRING },
                  transitHack: { type: Type.STRING },
                  neighborhoodPersonality: { type: Type.STRING },
                },
                required: [
                  "safetyReality",
                  "noiseVibeForecast",
                  "ultimateLeaseVerdict",
                  "bodegaGrade",
                  "transitHack",
                  "neighborhoodPersonality",
                ],
              },
            },
          });

          if (response.text) {
            intel = JSON.parse(response.text.trim());
            isGeminiLive = true;
          }
        } catch (aiErr) {
          console.error("Gemini Intel error, falling back to static sassy generator:", aiErr);
        }
      }

      // Fallback structured intel if AI client unavailable or errored
      if (!intel) {
        if (listing.id === "gotham-001") {
          intel = {
            safetyReality: "Prince Street is safer than a bubble-wrapped toddler, but watch out for fashion influencers walking backward while recording TikToks.",
            noiseVibeForecast: "Daytime is a wall of French tourists and coffee snobs. Nights quiet down by 11 PM unless a midnight sample sale breaks out.",
            ultimateLeaseVerdict: "If you have $4,250 and love cobblestone aesthetic, sign immediately before an investment banker outbids you.",
            bodegaGrade: "5/5 🥪 Prince Gourmet makes a BEC that will cure any hangover in under 4 minutes flat.",
            transitHack: "Take the N/R from Prince St, but walk 2 mins to Broadway-Lafayette for the B/D/F/M if you need to hit Brooklyn fast.",
            neighborhoodPersonality: "Art gallery directors, fashion models, and tech founders who pretend they don't care about designer labels."
          };
        } else if (listing.id === "gotham-002") {
          intel = {
            safetyReality: "Solid Brooklyn safety vibe. The worst thing you'll encounter is someone trying to sell you artisanal matcha at 2 AM.",
            noiseVibeForecast: "L Train rumble is subtle, but weekend bar hoppers outside N 8th will test your noise-canceling headphones.",
            ultimateLeaseVerdict: "Classic Williamsburg industrial loft. If you work in tech or media and love rooftop sunsets, this is your flagship.",
            bodegaGrade: "5/5 🥪 Green Gourmet 24/7 on Bedford is legendary. Extra hot sauce on the BEC is mandatory.",
            transitHack: "Board the second car from the back on the Manhattan-bound L to land directly at the 1st Ave exit stairs.",
            neighborhoodPersonality: "E-bike commuters, agency creatives, and dogs with higher Instagram followings than you."
          };
        } else if (listing.id === "gotham-003") {
          intel = {
            safetyReality: "Classic Lower East Side grit and charm. High foot traffic means eyes on the street 24/7.",
            noiseVibeForecast: "Expect 65+ decibels on Friday and Saturday nights. You are literally living inside the nightlife ecosystem.",
            ultimateLeaseVerdict: "5th floor walkup is rough, but $3,400 for a 2-bed in prime LES with exposed brick is a rare Gotham gem.",
            bodegaGrade: "4.5/5 🥪 Orchard Deli packs heavy bacon and uses toasted semolina rolls.",
            transitHack: "Delancey F train platform gets hot in summer; wait near the north turnstiles for the air breeze.",
            neighborhoodPersonality: "Vinyl collectors, natural wine enthusiasts, and night owls who don't go to bed until 4 AM."
          };
        } else if (listing.id === "gotham-004") {
          intel = {
            safetyReality: "Astoria Park is peaceful and super safe. Families, runners, and elderly Greeks keep the neighborhood cozy.",
            noiseVibeForecast: "Whisper quiet. Noise level is 10/10 peaceful compared to Manhattan chaos.",
            ultimateLeaseVerdict: "Absolute bargain alert. $2,750 for a sunlit 1-bed with elevator and balcony in Astoria is a slam dunk.",
            bodegaGrade: "5/5 🥪 Ditmars Deli gives you double cheese without asking. Greek bakery next door is an bonus.",
            transitHack: "Ditmars Blvd is the end of the line for the N/W train — you ALWAYS get a seat on the morning commute.",
            neighborhoodPersonality: "Foodies who know where to get $3 espresso, young couples, and lifelong Queens locals."
          };
        } else if (listing.id === "gotham-005") {
          intel = {
            safetyReality: "DUMBO is heavily patrolled and tranquil. Safe to walk your dog at any hour of the night.",
            noiseVibeForecast: "Cobblestone street noise during daytime tourist hours, dead quiet inside thanks to double-paned glass.",
            ultimateLeaseVerdict: "High-roller status. If you want unmatched bridge views and doorman luxury, this is peak New York living.",
            bodegaGrade: "4/5 🥪 Front St Market is clean and fast, though a BEC will run you $8.50 because... DUMBO.",
            transitHack: "York St F train station has one entrance; walk near the front car to avoid the evening stairwell bottleneck.",
            neighborhoodPersonality: "Venture capitalists, design agency principals, and strollers that cost more than your first car."
          };
        } else {
          intel = {
            safetyReality: "Bushwick street art zone. Busy and vibrant during the day, typical industrial Brooklyn vibes at night.",
            noiseVibeForecast: "Decent weekend bass from local venues, but Wyckoff Ave has excellent food and coffee options.",
            ultimateLeaseVerdict: "Incredible value for $3,100 with a private terrace. Perfect for creatives or roommates wanting room to breathe.",
            bodegaGrade: "5/5 🥪 Wyckoff 24/7 Deli makes BECs with military precision. Never disappoints.",
            transitHack: "Myrtle-Wyckoff station lets you switch between L and M seamlessly without going through turnstiles.",
            neighborhoodPersonality: "DJ collectives, vintage pop-up owners, and mural artists with paint on their boots."
          };
        }
      }

      res.json({
        listingId: listing.id,
        listingTitle: listing.title,
        neighborhood: listing.neighborhood,
        borough: listing.borough,
        intel,
        isGeminiLive,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error("Neighborhood intel route error:", err);
      res.status(500).json({ error: "Failed to generate neighborhood intel" });
    }
  });

  // Vite middleware in dev mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`GothamIntel server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
