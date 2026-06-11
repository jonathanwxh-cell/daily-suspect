// State store for Casefile mode. Separate table (`season_sessions`) from the daily `sessions` table.
// Progress is rich and evolving, so it lives as a single jsonb `state` blob.
import { randomUUID } from "node:crypto";

function clone(v) {
  return JSON.parse(JSON.stringify(v));
}

export function createMemorySeasonStore() {
  const sessions = new Map();
  return {
    async ensureSchema() {},
    async createSession(state) {
      const id = state.id || randomUUID();
      const now = new Date().toISOString();
      const full = { ...state, id, createdAt: now, updatedAt: now };
      sessions.set(id, clone(full));
      return clone(full);
    },
    async getSession(id) {
      const s = sessions.get(id);
      return s ? clone(s) : null;
    },
    async saveSession(state) {
      const full = { ...state, updatedAt: new Date().toISOString() };
      sessions.set(full.id, clone(full));
      return clone(full);
    },
  };
}

export function createPostgresSeasonStore({ connectionString }) {
  let poolPromise = null;
  async function getPool() {
    if (!poolPromise) poolPromise = import("pg").then(({ Pool }) => new Pool({ connectionString }));
    return poolPromise;
  }
  function rowToState(row) {
    if (!row) return null;
    const state = typeof row.state === "string" ? JSON.parse(row.state) : row.state;
    return {
      ...state,
      id: row.id,
      seasonId: row.season_id,
      createdAt: row.created_at?.toISOString?.() || row.created_at,
      updatedAt: row.updated_at?.toISOString?.() || row.updated_at,
    };
  }
  return {
    async ensureSchema() {
      if (!connectionString) throw new Error("DATABASE_URL is required");
      const pool = await getPool();
      await pool.query(`
        create table if not exists season_sessions (
          id text primary key,
          season_id text not null,
          state jsonb not null default '{}'::jsonb,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        );
        create index if not exists season_sessions_updated_at_idx on season_sessions(updated_at);
      `);
    },
    async createSession(state) {
      const id = state.id || randomUUID();
      const pool = await getPool();
      const { rows } = await pool.query(
        `insert into season_sessions (id, season_id, state) values ($1, $2, $3::jsonb) returning *`,
        [id, state.seasonId, JSON.stringify({ ...state, id })]
      );
      return rowToState(rows[0]);
    },
    async getSession(id) {
      const pool = await getPool();
      const { rows } = await pool.query("select * from season_sessions where id = $1", [id]);
      return rowToState(rows[0]);
    },
    async saveSession(state) {
      const pool = await getPool();
      const { rows } = await pool.query(
        `update season_sessions set state = $2::jsonb, updated_at = now() where id = $1 returning *`,
        [state.id, JSON.stringify(state)]
      );
      return rowToState(rows[0]);
    },
  };
}
