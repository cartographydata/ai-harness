import { BrowserSession } from "./browser.js";
import { createTools } from "./1-tools.js";
import { createContext } from "./3-context.js";
import { defaultGuardrails } from "./4-guardrails.js";
import { runLoop } from "./5-loop.js";
import type { LoopResult } from "./5-loop.js";

export type HarnessExecutionResult = LoopResult & {
  task: string;
  model: string;
};

export async function runHarness(
  task: string,
  model: string
): Promise<HarnessExecutionResult> {
  const session = new BrowserSession();
  await session.open();

  try {
    const tools = createTools(session);
    const messages = createContext(task);
    const result = await runLoop(model, messages, defaultGuardrails, tools);
    return { task, model, ...result };
  } finally {
    await session.close();
  }
}

export function printHarnessResult(result: HarnessExecutionResult): void {
  console.log("\n--- Agent trace ---\n");

  for (const iteration of result.trace) {
    const trimNote = iteration.contextTrimmed ? " (trimmed)" : "";
    const ctx = `[ctx: ${iteration.contextSize}${trimNote}]`;

    if (iteration.outcome === "tool_calls") {
      console.log(`[iter ${iteration.index}] ${iteration.toolEvents.length} tool call(s) ${ctx}`);
      for (const event of iteration.toolEvents) {
        console.log(`  -> ${event.tool}(${JSON.stringify(event.args)})`);
        console.log(`     ${event.result.slice(0, 120)}${event.result.length > 120 ? "..." : ""}`);
      }
    } else {
      console.log(`[iter ${iteration.index}] answered ${ctx}`);
    }

    console.log();
  }

  console.log("--- Result ---\n");
  console.log(result.answer);
  console.log(`\nStopped by: ${result.stoppedBy} after ${result.iterations} iteration(s)`);
}
