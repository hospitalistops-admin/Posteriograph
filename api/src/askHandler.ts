import OpenAI from "openai";
import type { ApiConfig } from "./config.js";
import { ASSISTANT_SYSTEM_PROMPT, BN_QUERY_TOOL_DEFINITION } from "./methodsContext.js";
import { executeBnQuery, type BnQueryRequest } from "../../site_2/src/lib/bnQuery.js";
import type { EvidenceSet } from "../../site_2/src/types.js";

export interface AskBody {
  question?: string;
  evidence?: EvidenceSet;
  history?: { role: "user" | "assistant"; content: string }[];
}

function sanitizeQuestion(text: string, maxChars: number): string {
  return text.replace(/\0/g, "").slice(0, maxChars).trim();
}

function redactPhiPatterns(text: string): string {
  return text
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[redacted]")
    .replace(/\bMRN[:\s#]*\d+\b/gi, "[redacted]");
}

export async function handleAsk(
  body: AskBody,
  config: ApiConfig
): Promise<{ answer: string; toolCalls: { name: string; result: unknown }[] }> {
  const question = sanitizeQuestion(body.question ?? "", config.maxQuestionChars);
  if (!question) throw new Error("question is required");

  const evidence = body.evidence ?? {};
  const client = new OpenAI({ apiKey: config.openaiApiKey });

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: ASSISTANT_SYSTEM_PROMPT }
  ];

  const safeHistory = (body.history ?? []).slice(-6);
  for (const turn of safeHistory) {
    if (turn.role === "user" || turn.role === "assistant") {
      messages.push({
        role: turn.role,
        content: redactPhiPatterns(turn.content).slice(0, 1500)
      });
    }
  }

  messages.push({
    role: "user",
    content: `Current workbench evidence (JSON): ${JSON.stringify(evidence)}\n\nQuestion: ${redactPhiPatterns(question)}`
  });

  const toolCalls: { name: string; result: unknown }[] = [];
  let response = await client.chat.completions.create({
    model: config.openaiModel,
    messages,
    tools: [BN_QUERY_TOOL_DEFINITION],
    tool_choice: "auto",
    max_tokens: 900,
    temperature: 0.2
  });

  let assistantMessage = response.choices[0]?.message;

  for (let round = 0; round < 3 && assistantMessage?.tool_calls?.length; round += 1) {
    messages.push(assistantMessage);

    for (const call of assistantMessage.tool_calls) {
      if (call.type !== "function" || call.function.name !== "bn_query") continue;
      let parsed: BnQueryRequest;
      try {
        parsed = JSON.parse(call.function.arguments) as BnQueryRequest;
        if (Object.keys(evidence).length > 0 && !parsed.evidence) {
          parsed.evidence = evidence;
        }
      } catch {
        parsed = { operation: "target_marginal" };
      }
      const result = executeBnQuery(parsed);
      toolCalls.push({ name: "bn_query", result });
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result)
      });
    }

    response = await client.chat.completions.create({
      model: config.openaiModel,
      messages,
      tools: [BN_QUERY_TOOL_DEFINITION],
      max_tokens: 900,
      temperature: 0.2
    });
    assistantMessage = response.choices[0]?.message;
  }

  const answer =
    assistantMessage?.content?.trim() ||
    "I could not generate an answer. Try a deterministic BN query from the panel.";

  return { answer, toolCalls };
}
