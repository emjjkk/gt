import "dotenv/config";
import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";

// ------------------ Setup ------------------
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.use(cors());

// ------------------ Keep-Alive Endpoint ------------------
app.get("/ping", (req, res) => {
  res.json({ status: "alive", timestamp: new Date().toISOString() });
});


// ------------------ Knowledge ------------------
const KNOWLEDGE_PATH = path.resolve("src/data/knowledge.txt");
const RAW_TEXT = fs.readFileSync(KNOWLEDGE_PATH, "utf8");

function getRelevantChunks(text: string, query: string): string[] {
  if (!query) return [];

  const words = query.toLowerCase().split(/\s+/);

  return text
    .split("\n\n")
    .filter(chunk =>
      words.some(word => chunk.toLowerCase().includes(word))
    )
    .slice(0, 3);
}

// ------------------ Chat Endpoint ------------------

app.post("/chat", async (req, res) => {
  const { message } = req.body;
  console.log("OPENROUTER_API_KEY:", process.env.OPENROUTER_API_KEY);

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "No message provided" });
  }

  const chunks = getRelevantChunks(RAW_TEXT, message);

  const prompt = `
Use ONLY the information below to answer the question. Be descriptive and give comprehensive answers
If the answer is not present, say you don't know. 

INFORMATION:
${chunks.join("\n\n")}
`;

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "arcee-ai/trinity-mini:free",
          messages: [
            { role: "system", content: prompt },
            { role: "user", content: message }
          ]
        })
      }
    );

    let result: any;
    try {
      result = await response.json();
    } catch {
      return res
        .status(500)
        .json({ error: "OpenRouter returned invalid JSON" });
    }

    if (!result.choices || !result.choices[0]?.message?.content) {
      console.error("OpenRouter response:", result);
      return res.status(500).json({
        reply: "OpenRouter did not return a valid response. See server logs."
      });
    }

    return res.status(200).json({
      reply: result.choices[0].message.content
    });
  } catch (err) {
    console.error("OpenRouter request failed:", err);
    return res
      .status(500)
      .json({ reply: "Failed to fetch from OpenRouter" });
  }
});

// ------------------ Start Server ------------------
app.listen(PORT, () => {
  console.log(`Express server running on port ${PORT}`);
});
