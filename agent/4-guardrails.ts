import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

type GuardrailInput = {
  iterations: number;
  messages: ChatCompletionMessageParam[];
};

export type GuardrailResult = { ok: true } | { ok: false; reason: string };
export type GuardrailFn = (input: GuardrailInput) => GuardrailResult;

// Guardrail 1: If we do too many Messages, stop the loop
const maxIterations =
  (limit: number): GuardrailFn =>
  ({ iterations }) =>
    iterations >= limit
      ? { ok: false, reason: `Guardrail: reached iteration limit (${limit})` }
      : { ok: true };

// Guardrail 2: If we do too many Messages, stop the loop
const maxMessages =
  (limit: number): GuardrailFn =>
  ({ messages }) =>
    messages.length > limit
      ? { ok: false, reason: `Guardrail: context too large (${messages.length} messages)` }
      : { ok: true };

export function combineGuardrails(...fns: GuardrailFn[]): GuardrailFn {
  return (input) => {
    for (const check of fns) {
      const result = check(input);
      if (!result.ok) return result;
    }
    return { ok: true };
  };
}

export const defaultGuardrails = combineGuardrails(
  maxIterations(15),
  maxMessages(50)
);