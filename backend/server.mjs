import http from "node:http";
import { createApp } from "./app.mjs";
import { createSeasonApp } from "./season-app.mjs";
import { createSapiensModel } from "./sapiens.mjs";
import { createMemoryStore, createPostgresStore } from "./stores.mjs";
import { createMemorySeasonStore, createPostgresSeasonStore } from "./season-store.mjs";

const port = Number(process.env.PORT || 4117);
const corsOrigins = (process.env.CORS_ORIGINS || "https://daily-suspect.vercel.app,http://127.0.0.1:3000,http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const model = createSapiensModel();

const store = process.env.DATABASE_URL
  ? createPostgresStore({ connectionString: process.env.DATABASE_URL })
  : createMemoryStore();
await store.ensureSchema();

const app = createApp({ store, model, corsOrigins });

// Casefile mode (additive): its own store/table, mounted on /api/season/*. Daily app untouched.
const seasonStore = process.env.DATABASE_URL
  ? createPostgresSeasonStore({ connectionString: process.env.DATABASE_URL })
  : createMemorySeasonStore();
await seasonStore.ensureSchema();
const seasonApp = createSeasonApp({ store: seasonStore, model, corsOrigins });

const server = http.createServer(async (req, res) => {
  const request = new Request(`http://${req.headers.host}${req.url}`, {
    method: req.method,
    headers: req.headers,
    body: req.method === "GET" || req.method === "HEAD" ? undefined : req,
    duplex: "half",
  });

  try {
    const targetApp = new URL(request.url).pathname.startsWith("/api/season") ? seasonApp : app;
    const response = await targetApp.handle(request);
    res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
    if (response.body) {
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    }
    res.end();
  } catch (err) {
    console.error(err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Internal server error" }));
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`daily-suspect-api listening on http://127.0.0.1:${port}`);
});
