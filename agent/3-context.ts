import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";

const SYSTEM_PROMPT = `
You are a helpful assistant with access to tools.
Use tools whenever they help you give a more accurate answer.
When you have enough information, respond directly and concisely.
`.trim();

export type AgentContext = {
  system: string;
  messages: MessageParam[];
};

// Build the initial context for a new task
export function createContext(task: string): AgentContext {
  return {
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: task }],
  };
}
