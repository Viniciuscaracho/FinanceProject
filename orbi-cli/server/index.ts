/**
 * Orbi dashboard server.
 *
 * Receives telemetry events from the orbi-cli (POST /api/events), keeps them
 * in memory, and streams updates to the browser via SSE (GET /stream).
 * The dashboard HTML is served at GET /.
 *
 * Start with: npx tsx server/index.ts   or   orbi server
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { RunStore } from "./store.js";
import type { OrbEvent } from "../src/core/emitter.js";

const PORT = Number(process.env.ORBI_PORT ?? 3000);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DASHBOARD_HTML = path.join(__dirname, "dashboard.html");

const store = new RunStore();

// SSE clients: each response object that is waiting for events.
const sseClients = new Set<http.ServerResponse>();

store.subscribe((run) => {
  const data = `data: ${JSON.stringify(run)}\n\n`;
  for (const res of sseClients) {
    try { res.write(data); } catch { sseClients.delete(res); }
  }
});

function cors(res: http.ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
}

function json(res: http.ServerResponse, status: number, body: unknown): void {
  cors(res);
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  cors(res);

  // Preflight
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  // Dashboard HTML
  if (req.method === "GET" && url.pathname === "/") {
    try {
      const html = fs.readFileSync(DASHBOARD_HTML, "utf8");
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(html);
    } catch {
      res.writeHead(500);
      res.end("dashboard.html not found");
    }
    return;
  }

  // SSE stream
  if (req.method === "GET" && url.pathname === "/stream") {
    res.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    });
    res.write(": connected\n\n");

    // Send current state immediately
    for (const run of store.all()) {
      res.write(`data: ${JSON.stringify(run)}\n\n`);
    }

    sseClients.add(res);
    req.on("close", () => sseClients.delete(res));

    // Keepalive every 15s
    const timer = setInterval(() => {
      try { res.write(": ping\n\n"); } catch { clearInterval(timer); sseClients.delete(res); }
    }, 15_000);
    req.on("close", () => clearInterval(timer));
    return;
  }

  // List runs
  if (req.method === "GET" && url.pathname === "/api/runs") {
    json(res, 200, store.all());
    return;
  }

  // Single run
  if (req.method === "GET" && url.pathname.startsWith("/api/runs/")) {
    const id = url.pathname.slice("/api/runs/".length);
    const run = store.get(id);
    if (!run) { json(res, 404, { error: "not found" }); return; }
    json(res, 200, run);
    return;
  }

  // Receive events from CLI
  if (req.method === "POST" && url.pathname === "/api/events") {
    let body = "";
    req.on("data", (chunk) => { body += chunk.toString(); });
    req.on("end", () => {
      try {
        const event = JSON.parse(body) as OrbEvent;
        store.apply(event);
        json(res, 202, { ok: true });
      } catch {
        json(res, 400, { error: "invalid JSON" });
      }
    });
    return;
  }

  res.writeHead(404); res.end();
});

server.listen(PORT, () => {
  console.log(`\x1b[36m▸ Orbi dashboard\x1b[0m  http://localhost:${PORT}`);
  console.log(`  Waiting for orbi-cli events…`);
});

process.on("SIGTERM", () => server.close());
process.on("SIGINT",  () => { server.close(); process.exit(0); });
