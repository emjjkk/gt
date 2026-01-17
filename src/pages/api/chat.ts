export const prerender = false;

import type { APIRoute } from "astro";
import { KNOWLEDGE_TEXT } from "../../data/knowledge";

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

  const prompt = `
Answer the user in a natural, warm, and conversational tone, as if you are thoughtfully explaining something to a curious person. Provide a lot of details and excerpts where helpful.

Acknowledge the emotional tone of the question when appropriate.

Use primarily the information below, a reminiscence written by him, to form your answer.

Give rich, detailed explanations. When helpful, expand on ideas, emotions, or implications instead of giving short factual replies.

When possible, connect specific details to broader themes or personal meaning found in the text.

If you reference supporting details, clearly attribute them to Life A See Saw, but do so naturally (for example: “In Life A See Saw, he reflects on…”).

If the exact answer is not directly stated, make careful inferences based on the text and clearly explain your reasoning step by step.

If the question is unrelated to the text, respond briefly, politely, and without unnecessary detail.

INFORMATION:
${KNOWLEDGE_TEXT}
`;
  console.log(prompt)
  console.log("Prompt character count:", prompt.length);

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