// ─────────────────────────────────────────────
// PART 2: The model
//
// One function. Takes a prompt, returns a string.
// The harness doesn't care what's inside —
// swap the model string to test a different one.
// ─────────────────────────────────────────────

import Anthropic from "@anthropic-ai/sdk";
import "dotenv/config";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function callModel(
  model: string,
  prompt: string
): Promise<string> {
  const response = await client.messages.create({
    model,
    max_tokens: 64,
    system:
      "Answer as briefly as possible. One word or number if you can. No punctuation.",
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  return text.trim();
}
