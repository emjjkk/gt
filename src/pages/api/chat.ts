export const prerender = false;

import type { APIRoute } from "astro";

// Store the text in memory after first load
let CACHED_TEXT: string | null = null;

async function getKnowledgeText() {
  if (CACHED_TEXT) return CACHED_TEXT;
  
  // In production, fetch from public folder
  const url = new URL('https://www.oladosuandoluremimemorial.com/knowledge.txt');
  const response = await fetch(url);
  CACHED_TEXT = await response.text();
  return CACHED_TEXT;
}

function getRelevantChunks(text: string, query: string) {
  if (!query) return [];
  const words = query.toLowerCase().split(/\s+/);

  return text
    .split("\n\n")
    .filter(chunk =>
      words.some(word => chunk.toLowerCase().includes(word))
    )
    .slice(0, 3);
}

export const POST: APIRoute = async ({ request }) => {
  let data: any;

  try {
    data = await request.json();
  } catch (err) {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400
    });
  }

  const { message } = data;

  if (!message || typeof message !== "string") {
    return new Response(JSON.stringify({ error: "No message provided" }), {
      status: 400
    });
  }

  const RAW_TEXT = await getKnowledgeText();
  const chunks = getRelevantChunks(RAW_TEXT, message);

  const prompt = `
Use ONLY the information below to answer the question. Give answers as detailed as possible. 
The user does not know what source you are using, so if you tell supporting evidence, specify it's from "Life A See Saw" a reminiscence written by him
If the answer is not present, say you don't know.

INFORMATION:
${chunks.join("\n\n")}
`;

  console.log("Prompt length:", prompt.length);
  console.log("Chunks found:", chunks.length);

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${import.meta.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "xiaomi/mimo-v2-flash:free",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: message }
        ]
      })
    });

    let result: any;
    try {
      result = await res.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "OpenRouter returned invalid JSON" }),
        { status: 500 }
      );
    }

    if (!result.choices || !result.choices[0]?.message?.content) {
      console.error("OpenRouter response:", result);
      return new Response(
        JSON.stringify({
          reply: "OpenRouter did not return a valid response. See server logs."
        }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ reply: result.choices[0].message.content }),
      { status: 200 }
    );
  } catch (err) {
    console.error("OpenRouter request failed:", err);
    return new Response(
      JSON.stringify({ reply: "Failed to fetch from OpenRouter" }),
      { status: 500 }
    );
  }
};