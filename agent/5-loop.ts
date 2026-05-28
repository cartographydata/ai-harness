import type {
  MessageParam,
  ToolResultBlockParam,
} from "@anthropic-ai/sdk/resources/messages";
import { client } from "./2-model.js";
import type { AgentContext } from "./3-context.js";
import type { ToolRegistry } from "./1-tools.js";

const MAX_TOKENS = 4096;

// A single tool call + its result, captured for the trace
export type ToolEvent = {
  tool: string;
  args: Record<string, unknown>;
  result: string;
};

// One loop iteration: the model either called tools or gave a final answer
export type LoopIteration = {
  index: number;
  outcome: "tool_calls" | "answer";
  toolEvents: ToolEvent[];    // empty if outcome is "answer"
  contextSize: number;        // how many messages were in context for this call
};

export type LoopResult = {
  answer: string;
  iterations: number;
  trace: LoopIteration[];
  stoppedBy: "model" | "guardrail" | "success";
};


export async function runLoop(
  model: string,
  context: AgentContext,
  tools: ToolRegistry,
): Promise<LoopResult> {
  const trace: LoopIteration[] = [];
  const messages: MessageParam[] = [...context.messages];

  while (true) {
    const iterationIndex = trace.length + 1;

    // ── Model call ────────────────────────────
    process.stdout.write(`[iter ${iterationIndex}] calling model... `);
    const response = await client.messages.create({
      model,
      max_tokens: MAX_TOKENS,
      system: context.system,
      messages,
      tools: tools.definitions,
    });

    const contextSize = messages.length;
    console.log(response.stop_reason ?? "unknown");

    messages.push({ role: "assistant", content: response.content });

    // ── Final answer ──────────────────────────
    if (response.stop_reason === "end_turn") {
      const answer = response.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("");
      trace.push({ index: iterationIndex, outcome: "answer", toolEvents: [], contextSize });
      return {
        answer: answer || "(no response)",
        iterations: trace.length,
        trace,
        stoppedBy: "model",
      };
    }

    // ── Tool calls → execute → loop ───────────
    if (response.stop_reason === "tool_use") {
      const toolEvents: ToolEvent[] = [];
      const toolResults: ToolResultBlockParam[] = [];

      for (const block of response.content) {
        if (block.type !== "tool_use") continue;

        const name = block.name;
        const args = block.input as Record<string, unknown>;

        const tool = tools.byName.get(name);
        process.stdout.write(`           → ${name}(${JSON.stringify(args)}) ... `);
        let result: string;
        try {
          result = tool ? await tool.execute(args) : `Unknown tool: "${name}"`;
          console.log(`done`);
        } catch (err) {
          result = `Error: ${err instanceof Error ? err.message : String(err)}`;
          console.log(`error`);
        }

        toolEvents.push({ tool: name, args, result });
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: result,
        });
      }

      messages.push({ role: "user", content: toolResults });
      trace.push({ index: iterationIndex, outcome: "tool_calls", toolEvents, contextSize });
    }
  }
}
