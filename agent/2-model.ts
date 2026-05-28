import Anthropic from "@anthropic-ai/sdk";
import "dotenv/config";

export const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export type { MessageParam as AgentMessage } from "@anthropic-ai/sdk/resources/messages";
