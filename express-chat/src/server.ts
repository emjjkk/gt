import "dotenv/config";
import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";
import readline from "readline";

// ------------------ Setup ------------------
const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;

// ------------------ Knowledge ------------------
const KNOWLEDGE_PATH = path.resolve("src/data/knowledge.txt");

// Lazy-load and chunk the book at startup
const CHUNK_SIZE = 2000; // 2000 chars per chunk
let knowledgeChunks: string[] = [];

async function loadKnowledge() {
  console.log("Loading book...");
  const fileStream = fs.createReadStream(KNOWLEDGE_PATH, { encoding: "utf8" });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let buffer = "";
  for await (const line of rl) {
    buffer += line + "\n";
    if (buffer.length >= CHUNK_SIZE) {
      knowledgeChunks.push(buffer);
      buffer = "";
    }
  }
  if (buffer.length > 0) knowledgeChunks.push(buffer);

  console.log(`Book loaded with ${knowledgeChunks.length} chunks.`);
}

// Call it immediately
loadKnowledge().catch(err => {
  console.error("Failed to load book:", err);
  process.exit(1);
});

// ------------------ Helpers ------------------
function getRelevantChunks(query: string, maxChunks = 5): string[] {
  if (!query) return [];

  const words = query.toLowerCase().split(/\s+/);

  // Filter chunks containing at least one query word
  const filtered = knowledgeChunks.filter(chunk =>
    words.some(word => chunk.toLowerCase().includes(word))
  );

  return filtered.slice(0, maxChunks);
}

// ------------------ Chat Endpoint ------------------
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "No message provided" });
  }

  const chunks = getRelevantChunks(message, 5);
  const prompt = `
Use ONLY the information below to answer the question.
If the answer is not present, say you don't know.

INFORMATION:
${chunks.join("\n\n")}
`;

  // Prepare payload for OpenRouter
  const payload = {
    model: "google/gemini-1.5-flash", // Free reliable model
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: message }
    ]
  };

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }
    );

    const result = await response.json();

    if (result?.error) {
      console.error("OpenRouter error:", result.error);
      return res.status(503).json({
        reply: "The AI is temporarily unavailable. Please try again."
      });
    }

    const reply = result.choices?.[0]?.message?.content;
    if (!reply) {
      console.error("OpenRouter returned invalid response:", result);
      return res.status(500).json({
        reply: "AI returned invalid response. See server logs."
      });
    }

    res.status(200).json({ reply });
  } catch (err) {
    console.error("OpenRouter request failed:", err);
    res.status(500).json({ reply: "Failed to fetch from OpenRouter" });
  }
});

// ------------------ Keep-Alive Endpoint ------------------
app.get("/ping", (req, res) => {
  // Optional simple auth
  if (process.env.PING_KEY && req.query.key !== process.env.PING_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  res.json({ status: "alive", timestamp: new Date().toISOString() });
});

// ------------------ Start Server ------------------
app.listen(PORT, () => {
  console.log(`Express server running on port ${PORT}`);
});
