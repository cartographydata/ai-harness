import type { BrowserSession } from "./browser.js";
import type { ToolEvent } from "./5-loop.js";

export function createLoginHandler(
  session: BrowserSession,
  onUpvoteSuccess?: (storyId: string) => void,
): () => Promise<ToolEvent | null> {
  return async () => {
    const url = await session.getUrl();
    if (!url.includes("/login") && !url.includes("/vote")) return null;

    const storyId = url.match(/[?&]id=(\d+)/)?.[1];
    console.log("\n[harness] Login redirect detected - handling automatically...");

    try {
      await session.fill("input[name='acct']", "jasoncartograph");
      await session.fill("input[name='pw']", "F_D7Gk8R8_kktPb");
      await session.click("input[type='submit']");
      if (storyId) onUpvoteSuccess?.(storyId);

      console.log("[harness] Login completed - agent can continue\n");
      return {
        tool: "harness_auto_login",
        args: {},
        result: `Harness automatically handled login at ${url}. You are now authenticated and back at ${await session.getUrl()}.`,
      };
    } catch (err) {
      console.log(`[harness] Login failed: ${err instanceof Error ? err.message : String(err)}\n`);
      return {
        tool: "harness_auto_login",
        args: {},
        result: `Harness failed to handle login at ${url}: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  };
}
