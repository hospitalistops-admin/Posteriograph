export interface ApiConfig {
  port: number;
  openaiApiKey: string;
  openaiModel: string;
  allowedOrigins: string[];
  rateLimitPerMinute: number;
  maxBodyBytes: number;
  maxQuestionChars: number;
}

function parseOrigins(value: string | undefined): string[] {
  const defaults = [
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    "https://hospitalistops-admin.github.io"
  ];
  if (!value?.trim()) return defaults;
  return value.split(",").map((origin) => origin.trim()).filter(Boolean);
}

export function loadConfig(): ApiConfig {
  const openaiApiKey = process.env.OPENAI_API_KEY?.trim() ?? "";
  if (!openaiApiKey) {
    throw new Error("OPENAI_API_KEY is required in api/.env (never in site_2 Vite env)");
  }

  return {
    port: Number(process.env.PORT ?? 8787),
    openaiApiKey,
    openaiModel: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
    allowedOrigins: parseOrigins(process.env.ALLOWED_ORIGINS),
    rateLimitPerMinute: Number(process.env.RATE_LIMIT_PER_MINUTE ?? 20),
    maxBodyBytes: Number(process.env.MAX_BODY_BYTES ?? 16_384),
    maxQuestionChars: Number(process.env.MAX_QUESTION_CHARS ?? 2000)
  };
}
