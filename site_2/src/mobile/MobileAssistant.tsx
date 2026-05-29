import { useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import {
  askAssistant,
  AssistantClientError,
  getApiBaseUrl,
  isAssistantConfigured,
  runBnQuery
} from "../lib/assistantClient";
import type { EvidenceSet } from "../types";

interface Props {
  evidence: EvidenceSet;
  onBack: () => void;
}

type ChatMessage = { role: "user" | "assistant"; content: string };

export function MobileAssistant({ evidence, onBack }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [structuredOut, setStructuredOut] = useState<string | null>(null);

  async function handleAsk() {
    const question = input.trim();
    if (!question || loading) return;
    setInput("");
    setLoading(true);
    const next: ChatMessage[] = [...messages, { role: "user", content: question }];
    setMessages(next);
    try {
      const response = await askAssistant({ question, evidence, history: next.slice(0, -1) });
      setMessages([...next, { role: "assistant", content: response.answer }]);
    } catch (error) {
      const text = error instanceof AssistantClientError ? error.message : "Request failed.";
      setMessages([...next, { role: "assistant", content: text }]);
    } finally {
      setLoading(false);
    }
  }

  async function runMarginal() {
    setLoading(true);
    try {
      const result = await runBnQuery({
        operation: "category_summary",
        evidence,
        model: "learnt"
      });
      setStructuredOut(JSON.stringify(result, null, 2));
    } catch (error) {
      setStructuredOut(error instanceof AssistantClientError ? error.message : "Query failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="m-assistant" aria-label="Site assistant">
      <header className="m-methods-head">
        <button type="button" className="m-back-btn" onClick={onBack}>
          <ArrowLeft size={18} />
          Back
        </button>
        <h2>Ask the model</h2>
        <p>Educational only — no real patient data.</p>
      </header>

      <div className="m-assistant-warn" role="alert">
        API key stays on server ({isAssistantConfigured() ? getApiBaseUrl() : "set VITE_API_BASE_URL"}).
      </div>

      <button type="button" className="m-route-btn" disabled={loading} onClick={() => void runMarginal()}>
        <strong>BN category summary</strong>
        <span className="m-route-desc">CauseUTI posteriors + cohort marginal</span>
      </button>

      {structuredOut ? <pre className="m-assistant-pre">{structuredOut}</pre> : null}

      <div className="m-assistant-chat">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={message.role === "user" ? "m-chat-user" : "m-chat-bot"}
          >
            {message.content}
          </div>
        ))}
      </div>

      <div className="m-assistant-input">
        <textarea
          value={input}
          rows={3}
          disabled={loading}
          placeholder="Ask about derivation or the BN…"
          onChange={(event) => setInput(event.target.value)}
        />
        <button type="button" className="m-primary-btn" disabled={loading || !input.trim()} onClick={() => void handleAsk()}>
          <Send size={18} />
          Send
        </button>
      </div>
    </section>
  );
}
