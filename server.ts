import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "events.json");

// Ensure data directory and file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface EventItem {
  id: string;
  title: string;
  category: string;
  dateTime: string;
  location: string;
  description: string;
  price: number;
  tags: string[];
  bannerUrl?: string;
  hostName: string;
  rsvpCount: number;
  isCanceled?: boolean;
}

// Initial seed data for Addis Ababa events
const defaultEvents: EventItem[] = [
  {
    id: "evt-1",
    title: "Ethio-Jazz Groove Night",
    category: "Concerts & Music",
    dateTime: "2026-06-20T19:30:00",
    location: "Fendika Cultural Center, Kazanchis",
    description: "Experience the legendary rhythms of Addis Ababa! Join us for an enchanting night of vintage Ethio-jazz fusion and traditional Azmari musicians. Perfect atmosphere with live dance performances, cold beverages, and spiced Ethiopian snacks.",
    price: 400,
    tags: ["EthioJazz", "LiveMusic", "JazzNight", "Kazanchis", "Culture"],
    bannerUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=60",
    hostName: "Melaku Belay (Director)",
    rsvpCount: 54
  },
  {
    id: "evt-2",
    title: "Addis Tech & Founder Mixer 2026",
    category: "Networking & Tech",
    dateTime: "2026-06-24T18:00:00",
    location: "Iceaddis Hub, Bole Atlas",
    description: "Connect with developers, startup founders, and angel investors pioneering the East African technology sector. Come for the open panel about AI integrations in finance & logistics, and stay for the relaxed networking with craft Ethiopian beer & mocktails.",
    price: 0,
    tags: ["TechMixer", "Startups", "AI", "Bole", "Networking"],
    bannerUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60",
    hostName: "Iceaddis Community",
    rsvpCount: 112
  },
  {
    id: "evt-3",
    title: "Entoto Forest Sunrise Hike & Yoga",
    category: "Outdoors & Sports",
    dateTime: "2026-06-21T07:15:00",
    location: "Entoto Natural Park (Main Gate)",
    description: "Breathe in the fresh mountain air of northern Addis! Start Sunday morning with a refreshing 7km guided walk under towering eucalyptus paths, leading to a scenic hilltop platform for outdoor meditation and deep breathing vinyasa yoga. Ideal for finding your inner calm.",
    price: 600,
    tags: ["Hiking", "Yoga", "Entoto", "Nature", "Health"],
    bannerUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=60",
    hostName: "Addis Active Outdoors",
    rsvpCount: 38
  },
  {
    id: "evt-4",
    title: "Traditional Coffee Cupping & Textile Arts",
    category: "Food & Culture",
    dateTime: "2026-06-27T10:00:00",
    location: "Tomoca Coffee Lounge, Piazza",
    description: "Celebrate the rich roots of the birthplace of coffee! This immersive course guides you through historic cupping ceremonies, comparative tastings of Sidamo vs. Yirgacheffe, and bean roasting secrets led byTomoca's certified baristas. In adjacent rooms, enjoy a visual pop-up gallery of authentic Sabahar hand-woven textile crafts.",
    price: 350,
    tags: ["Coffee", "Piazza", "Tomoca", "EthioCulture", "Handmade"],
    bannerUrl: "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800&auto=format&fit=crop&q=60",
    hostName: "Tomoca Coffee & Sabahar",
    rsvpCount: 29
  },
  {
    id: "evt-5",
    title: "Contemporary Ethiopian Art Vernissage",
    category: "Art & Exhibitions",
    dateTime: "2026-06-26T17:00:00",
    location: "Alliance Ethio-Française, Piazza",
    description: "An elegant opening evening celebrating five revolutionary painters from the Addis Ababa University School of Fine Arts and Design. Abstract oil renderings, mixed-media canvas sculptures, and spoken-word digital backdrops capture modern life in Ethiopia's capital city.",
    price: 150,
    tags: ["ArtExhibition", "Piazza", "Alliance", "AbstractArt", "Paintings"],
    bannerUrl: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&auto=format&fit=crop&q=60",
    hostName: "Alliance Ethio-Française",
    rsvpCount: 45
  }
];

// Helper to read events safely
function getEvents(): EventItem[] {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(defaultEvents, null, 2), "utf-8");
      return defaultEvents;
    }
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading events storage file.", err);
    return defaultEvents;
  }
}

// Helper to save events safely
function saveEvents(data: EventItem[]): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed writing events store file.", err);
  }
}

// Lazy Gemini API instantiation
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is not configured in Secrets panel.");
    }
    geminiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

// Middleware
app.use(express.json());

// API Endpoints
// ====================

// 1. Fetch all events
app.get("/api/events", (req: Request, res: Response) => {
  const events = getEvents();
  res.json({ success: true, events });
});

// 2. Publish/Create an event
app.post("/api/events", (req: Request, res: Response) => {
  const { title, category, dateTime, location, description, price, tags, bannerUrl, hostName } = req.body;

  if (!title || !category || !dateTime || !location || !description || hostName === undefined) {
    res.status(400).json({ success: false, error: "Missing required event details." });
    return;
  }

  const events = getEvents();
  const newEvent: EventItem = {
    id: "evt-" + Date.now(),
    title: String(title).trim(),
    category: String(category).trim(),
    dateTime: String(dateTime).trim(),
    location: String(location).trim(),
    description: String(description).trim(),
    price: Number(price) || 0,
    tags: Array.isArray(tags) ? tags.map(t => String(t).trim()).filter(Boolean) : [],
    bannerUrl: bannerUrl ? String(bannerUrl).trim() : "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60",
    hostName: String(hostName).trim(),
    rsvpCount: 0
  };

  events.push(newEvent);
  saveEvents(events);

  res.status(201).json({ success: true, event: newEvent });
});

// 3. Update an existing event
app.put("/api/events/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, category, dateTime, location, description, price, tags, bannerUrl, hostName, isCanceled } = req.body;

  const events = getEvents();
  const index = events.findIndex(e => e.id === id);

  if (index === -1) {
    res.status(404).json({ success: false, error: "Event not found" });
    return;
  }

  const updated: EventItem = {
    ...events[index],
    title: title !== undefined ? String(title).trim() : events[index].title,
    category: category !== undefined ? String(category).trim() : events[index].category,
    dateTime: dateTime !== undefined ? String(dateTime).trim() : events[index].dateTime,
    location: location !== undefined ? String(location).trim() : events[index].location,
    description: description !== undefined ? String(description).trim() : events[index].description,
    price: price !== undefined ? Number(price) : events[index].price,
    tags: Array.isArray(tags) ? tags.map(t => String(t).trim()).filter(Boolean) : events[index].tags,
    bannerUrl: bannerUrl !== undefined ? String(bannerUrl).trim() : events[index].bannerUrl,
    hostName: hostName !== undefined ? String(hostName).trim() : events[index].hostName,
    isCanceled: isCanceled !== undefined ? Boolean(isCanceled) : events[index].isCanceled
  };

  events[index] = updated;
  saveEvents(events);

  res.json({ success: true, event: updated });
});

// 4. Delete an event
app.delete("/api/events/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const events = getEvents();
  const nextEvents = events.filter(e => e.id !== id);

  if (events.length === nextEvents.length) {
    res.status(404).json({ success: false, error: "Event lookup failed." });
    return;
  }

  saveEvents(nextEvents);
  res.json({ success: true, message: "Event removed successfully" });
});

// 5. RSVP / Book a ticket spot
app.post("/api/events/:id/rsvp", (req: Request, res: Response) => {
  const { id } = req.params;
  const events = getEvents();
  const index = events.findIndex(e => e.id === id);

  if (index === -1) {
    res.status(404).json({ success: false, error: "Requested event is unavailable." });
    return;
  }

  events[index].rsvpCount = (events[index].rsvpCount || 0) + 1;
  saveEvents(events);

  res.json({ success: true, rsvpCount: events[index].rsvpCount });
});

// 6. AI Copywriter Enhancer
app.post("/api/ai/enhance", async (req: Request, res: Response) => {
  const { rawText } = req.body;
  if (!rawText || String(rawText).trim().length === 0) {
    res.status(400).json({ success: false, error: "Please enter some raw event details." });
    return;
  }

  try {
    const ai = getGemini();
    const prompt = `You are a high-quality copywriter and event organization consultant in Addis Ababa, Ethiopia.
Your task is to review the following rough event details, and output a highly attractive, fully dynamic, well-formatted JSON structure containing a polished title, category name, engaging description, and relevant tags.

Rough event details: "${rawText}"

The category name must exactly be one of: "Concerts & Music", "Art & Exhibitions", "Networking & Tech", "Food & Culture", "Outdoors & Sports", "Theater & Film".
Write tags relevant to the area (mention subcities where appropriate, like Bole, Piazza, Kazanchis, Mexico, Sarbet, Gerji, etc.).

Return strictly JSON conforming to this schema without any markdown wrapping (do not include \`\`\`json block):
{
  "title": "A refined engaging catchy title",
  "category": "One of the category names above",
  "description": "Engaging description with vibrant and helpful host formatting details. Keep it inspiring to read for tourists and locals alike.",
  "tags": ["tag1", "tag2", "tag3"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            category: { type: Type.STRING },
            description: { type: Type.STRING },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["title", "category", "description", "tags"]
        }
      }
    });

    const resultText = response.text ? response.text.trim() : "{}";
    res.json({ success: true, data: JSON.parse(resultText) });
  } catch (err: any) {
    console.error("AI Copywriter service failure", err);
    res.status(500).json({ success: false, error: err.message || "Something went wrong in AI service." });
  }
});

// 7. AI Semantic Search / Assistant Advisor
app.post("/api/ai/search", async (req: Request, res: Response) => {
  const { userQuery } = req.body;
  if (!userQuery || String(userQuery).trim().length === 0) {
    res.status(400).json({ success: false, error: "Please express your event preferences." });
    return;
  }

  try {
    const events = getEvents();
    const ai = getGemini();

    const formattedEvents = events.map(e => ({
      id: e.id,
      title: e.title,
      category: e.category,
      dateTime: e.dateTime,
      location: e.location,
      description: e.description,
      price: e.price,
      tags: e.tags
    }));

    const prompt = `You are "Ferenj & Habesha Advisor", a stylish and cultural Addis Ababa event matchmaker assistant.
The viewer is looking for things to do, eat, enjoy, or network with in Addis Ababa. Here is their natural language search query:

"${userQuery}"

Here is the current listing of live events in our database:
${JSON.stringify(formattedEvents, null, 2)}

Analyze the query and semantically match it to our listing.
You must return a JSON response containing:
1. "recommendations": An array of objects, each containing:
   - "id": the matched event item id.
   - "score": match strength from 0 to 100 (integer values).
   - "reason": A short 1-to-2 sentence personalized explanation explaining why this event matches their preference and sounds fun.
2. "chatResponse": A friendly, encouraging, 2-to-3 sentence overview response in the persona of a warm Addis host, suggesting what they should do or how they can make the best of their Addis weekends.

Return strictly JSON matching this structure (no markdown wrappers):
{
  "recommendations": [
    { "id": "evt-1", "score": 95, "reason": "Since you want Ethio-jazz, this legendary night in Kazanchis with traditional dances is absolutely perfect." }
  ],
  "chatResponse": "Welcome to Addis! If you're looking for great food and music, I highly encourage you to try Kazanchis..."
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  score: { type: Type.INTEGER },
                  reason: { type: Type.STRING }
                },
                required: ["id", "score", "reason"]
              }
            },
            chatResponse: { type: Type.STRING }
          },
          required: ["recommendations", "chatResponse"]
        }
      }
    });

    const resultText = response.text ? response.text.trim() : "{}";
    res.json({ success: true, data: JSON.parse(resultText) });
  } catch (err: any) {
    console.error("AI Semantic search service failure.", err);
    res.status(500).json({ success: false, error: err.message || "Custom AI recommendation service unavailable." });
  }
});

// Setup Vite Dev server or Serve static files
async function serveApp() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[AddisEvents Server] Launched on port ${PORT}`);
  });
}

serveApp().catch(err => {
  console.error("Critical server failure", err);
});
