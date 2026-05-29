import http from "node:http";
import { loadConfig } from "./config.js";
import { corsHeaders, isOriginAllowed } from "./cors.js";
import { handleAsk } from "./askHandler.js";
import { checkRateLimit, clientKeyFromRequest } from "./rateLimit.js";
import { executeBnQuery, type BnQueryRequest } from "../../site_2/src/lib/bnQuery.js";

function readBody(req: http.IncomingMessage, maxBytes: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error("Request body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function sendJson(
  res: http.ServerResponse,
  status: number,
  payload: unknown,
  extraHeaders: Record<string, string> = {}
): void {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    ...extraHeaders
  });
  res.end(body);
}

async function main() {
  const config = loadConfig();

  const server = http.createServer(async (req, res) => {
    const origin = req.headers.origin;
    const headers = corsHeaders(origin, config);

    if (req.method === "OPTIONS") {
      res.writeHead(204, headers);
      res.end();
      return;
    }

    if (origin && !isOriginAllowed(origin, config)) {
      sendJson(res, 403, { error: "Origin not allowed" }, headers);
      return;
    }

    const rateKey = clientKeyFromRequest(
      { headers: { "x-forwarded-for": req.headers["x-forwarded-for"] as string | undefined } },
      req.socket.remoteAddress ?? undefined
    );
    const rate = checkRateLimit(rateKey, config.rateLimitPerMinute);
    if (!rate.allowed) {
      sendJson(
        res,
        429,
        { error: "Rate limit exceeded", retryAfterSec: rate.retryAfterSec },
        { ...headers, "Retry-After": String(rate.retryAfterSec ?? 60) }
      );
      return;
    }

    const url = req.url ?? "/";

    if (req.method === "GET" && url === "/health") {
      sendJson(res, 200, { ok: true }, headers);
      return;
    }

    if (req.method !== "POST") {
      sendJson(res, 404, { error: "Not found" }, headers);
      return;
    }

    try {
      const raw = await readBody(req, config.maxBodyBytes);
      const body = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};

      if (url === "/bn-query") {
        const result = executeBnQuery(body as unknown as BnQueryRequest);
        const status = result.ok ? 200 : 400;
        sendJson(res, status, result, headers);
        return;
      }

      if (url === "/ask") {
        const result = await handleAsk(
          body as { question?: string; evidence?: Record<string, string>; history?: { role: "user" | "assistant"; content: string }[] },
          config
        );
        sendJson(res, 200, result, headers);
        return;
      }

      sendJson(res, 404, { error: "Not found" }, headers);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Server error";
      const status = message.includes("too large") ? 413 : 500;
      sendJson(res, status, { error: message }, headers);
    }
  });

  const host = process.env.HOST ?? "0.0.0.0";
  server.listen(config.port, host, () => {
    console.log(`Posteriograph API listening on http://${host}:${config.port}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
