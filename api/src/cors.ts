import type { ApiConfig } from "./config.js";

export function corsHeaders(origin: string | undefined, config: ApiConfig): Record<string, string> {
  const allowed =
    origin &&
    config.allowedOrigins.some(
      (entry) => entry === origin || (entry.endsWith("*") && origin.startsWith(entry.slice(0, -1)))
    );

  return {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    ...(allowed && origin ? { "Access-Control-Allow-Origin": origin } : {}),
    Vary: "Origin"
  };
}

export function isOriginAllowed(origin: string | undefined, config: ApiConfig): boolean {
  if (!origin) return true;
  return config.allowedOrigins.includes(origin);
}
