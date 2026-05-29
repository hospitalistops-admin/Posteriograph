import type { BnQueryRequest, BnQueryResponse } from "./bnQuery";
import type { EvidenceSet } from "../types";

const DEFAULT_API_BASE = "http://127.0.0.1:8787";

export function getApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL as string | undefined;
  return (fromEnv?.trim() || DEFAULT_API_BASE).replace(/\/$/, "");
}

export function isAssistantConfigured(): boolean {
  return Boolean(import.meta.env.VITE_API_BASE_URL?.trim() || import.meta.env.DEV);
}

export interface AskRequest {
  question: string;
  evidence?: EvidenceSet;
  history?: { role: "user" | "assistant"; content: string }[];
}

export interface AskResponse {
  answer: string;
  toolCalls?: { name: string; result: unknown }[];
}

export class AssistantClientError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
    this.name = "AssistantClientError";
  }
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const url = `${getApiBaseUrl()}${path}`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
  } catch {
    throw new AssistantClientError(
      "Could not reach the assistant API. Start the local proxy (see api/README.md) or set VITE_API_BASE_URL."
    );
  }

  const payload = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) {
    throw new AssistantClientError(payload.error ?? `Request failed (${response.status})`, response.status);
  }
  return payload;
}

export async function askAssistant(request: AskRequest): Promise<AskResponse> {
  return postJson<AskResponse>("/ask", request);
}

export async function runBnQuery(request: BnQueryRequest): Promise<BnQueryResponse> {
  return postJson<BnQueryResponse>("/bn-query", request);
}
