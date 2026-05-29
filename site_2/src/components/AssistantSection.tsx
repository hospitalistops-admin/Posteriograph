import { useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { formatPercent } from "../lib/cases";
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

const QUICK_QUERIES = [
  { label: "Cohort marginals (b10)", op: "target_marginal" as const },
  { label: "Current b10 posterior", op: "category_summary" as const },
  { label: "Top evidence shifts", op: "evidence_deltas" as const }
];

export function AssistantSection({ evidence, onBack }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [structuredOut, setStructuredOut] = useState<string | null>(null);
  const configured = isAssistantConfigured();

  async function handleAsk() {
    const question = input.trim();
    if (!question || loading) return;
    setInput("");
    setLoading(true);
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: question }];
    setMessages(nextMessages);
    try {
      const response = await askAssistant({
        question,
        evidence,
        history: nextMessages.slice(0, -1)
      });
      setMessages([...nextMessages, { role: "assistant", content: response.answer }]);
    } catch (error) {
      const text =
        error instanceof AssistantClientError
          ? error.message
          : "Assistant request failed.";
      setMessages([...nextMessages, { role: "assistant", content: text }]);
    } finally {
      setLoading(false);
    }
  }

  async function runQuickQuery(op: (typeof QUICK_QUERIES)[number]["op"]) {
    setLoading(true);
    setStructuredOut(null);
    try {
      const result = await runBnQuery({
        operation: op,
        evidence,
        model: "learnt",
        limit: 8
      });
      setStructuredOut(JSON.stringify(result, null, 2));
    } catch (error) {
      setStructuredOut(
        error instanceof AssistantClientError ? error.message : "BN query failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="assistant-section" aria-label="Site assistant">
      <header className="methods-header cyber-panel">
        <button type="button" className="cyber-button ghost" onClick={onBack}>
          <ArrowLeft size={16} />
          back
        </button>
        <div>
          <span className="terminal-prefix">assistant</span>
          <h2>Ask about the model</h2>
          <p>Educational Q&amp;A — not for real patients or prescribing decisions.</p>
        </div>
      </header>

      <div className="assistant-warning cyber-panel" role="alert">
        <strong>Demo only.</strong> Do not enter names, MRNs, dates of birth, or other identifiers.
        The API key stays on the server; this page never sees it.
        {!configured ? (
          <span>
            {" "}
            Set <code>VITE_API_BASE_URL</code> for production. Dev default: {getApiBaseUrl()}.
          </span>
        ) : null}
      </div>

      <div className="assistant-quick cyber-panel">
        <span className="terminal-prefix">deterministic BN queries</span>
        <div className="assistant-quick-row">
          {QUICK_QUERIES.map((q) => (
            <button
              type="button"
              key={q.op}
              className="cyber-button ghost"
              disabled={loading}
              onClick={() => runQuickQuery(q.op)}
            >
              {q.label}
            </button>
          ))}
        </div>
        {Object.keys(evidence).length > 0 ? (
          <p className="assistant-evidence-hint">
            Using {Object.keys(evidence).length} evidence node(s) from the current workbench.
          </p>
        ) : (
          <p className="assistant-evidence-hint">No workbench evidence set — queries use cohort marginals.</p>
        )}
        {structuredOut ? (
          <pre className="assistant-structured" aria-label="Structured query result">
            {structuredOut}
          </pre>
        ) : null}
      </div>

      <div className="assistant-chat cyber-panel">
        <div className="assistant-messages">
          {messages.length === 0 ? (
            <p className="assistant-empty">
              Ask how posteriors are computed, what came from Ramsay vs this site, or what the four
              b10 categories mean. For counts, the tool returns model probabilities and Netica effective
              case weights — not private patient rows.
            </p>
          ) : (
            messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={message.role === "user" ? "chat-bubble user" : "chat-bubble assistant"}
              >
                {message.content}
              </div>
            ))
          )}
        </div>
        <div className="assistant-input-row">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about derivation, math, or the BN…"
            rows={3}
            disabled={loading}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleAsk();
              }
            }}
          />
          <button
            type="button"
            className="cyber-button"
            disabled={loading || !input.trim()}
            onClick={() => void handleAsk()}
          >
            <Send size={16} />
            {loading ? "…" : "send"}
          </button>
        </div>
      </div>

      <p className="assistant-footnote">
        Marginal example (local, no API): empty-evidence learnt b10 is computed in-browser via exact
        inference — {formatPercent(0.395, 1)} E. coli is the published baseline order of magnitude.
      </p>
    </section>
  );
}
