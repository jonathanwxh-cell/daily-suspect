import { randomUUID } from "node:crypto";

function cloneSession(session) {
  return JSON.parse(JSON.stringify(session));
}

function makeSession(input) {
  const now = new Date().toISOString();
  return {
    id: input.id || randomUUID(),
    caseId: input.caseId,
    transcript: input.transcript || [],
    composure: input.composure,
    questionsUsed: input.questionsUsed || 0,
    cracked: input.cracked || false,
    verdict: input.verdict || null,
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
  };
}

export function createMemoryStore() {
  const sessions = new Map();

  return {
    async ensureSchema() {},

    async createSession(input) {
      const session = makeSession(input);
      sessions.set(session.id, cloneSession(session));
      return cloneSession(session);
    },

    async getSession(id) {
      const session = sessions.get(id);
      return session ? cloneSession(session) : null;
    },

    async saveSession(input) {
      const session = makeSession({
        ...input,
        updatedAt: new Date().toISOString(),
      });
      sessions.set(session.id, cloneSession(session));
      return cloneSession(session);
    },
  };
}

export function createPostgresStore({ connectionString }) {
  let poolPromise = null;

  async function getPool() {
    if (!poolPromise) {
      poolPromise = import("pg").then(({ Pool }) => new Pool({ connectionString }));
    }
    return poolPromise;
  }

  function rowToSession(row) {
    if (!row) return null;
    return {
      id: row.id,
      caseId: row.case_id,
      transcript: Array.isArray(row.transcript) ? row.transcript : [],
      composure: Number(row.composure),
      questionsUsed: Number(row.questions_used),
      cracked: Boolean(row.cracked),
      verdict: row.verdict,
      createdAt: row.created_at?.toISOString?.() || row.created_at,
      updatedAt: row.updated_at?.toISOString?.() || row.updated_at,
    };
  }

  return {
    async ensureSchema() {
      if (!connectionString) throw new Error("DATABASE_URL is required");
      const pool = await getPool();
      await pool.query(`
        create table if not exists sessions (
          id text primary key,
          case_id text not null,
          transcript jsonb not null default '[]'::jsonb,
          composure integer not null,
          questions_used integer not null default 0,
          cracked boolean not null default false,
          verdict jsonb,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        );
        create index if not exists sessions_updated_at_idx on sessions(updated_at);
      `);
    },

    async createSession(input) {
      const session = makeSession(input);
      const pool = await getPool();
      const { rows } = await pool.query(
        `insert into sessions
          (id, case_id, transcript, composure, questions_used, cracked, verdict, created_at, updated_at)
         values ($1, $2, $3::jsonb, $4, $5, $6, $7::jsonb, $8, $9)
         returning *`,
        [
          session.id,
          session.caseId,
          JSON.stringify(session.transcript),
          session.composure,
          session.questionsUsed,
          session.cracked,
          JSON.stringify(session.verdict),
          session.createdAt,
          session.updatedAt,
        ]
      );
      return rowToSession(rows[0]);
    },

    async getSession(id) {
      const pool = await getPool();
      const { rows } = await pool.query("select * from sessions where id = $1", [id]);
      return rowToSession(rows[0]);
    },

    async saveSession(session) {
      const updatedAt = new Date().toISOString();
      const pool = await getPool();
      const { rows } = await pool.query(
        `update sessions
            set transcript = $2::jsonb,
                composure = $3,
                questions_used = $4,
                cracked = $5,
                verdict = $6::jsonb,
                updated_at = $7
          where id = $1
          returning *`,
        [
          session.id,
          JSON.stringify(session.transcript),
          session.composure,
          session.questionsUsed,
          session.cracked,
          JSON.stringify(session.verdict || null),
          updatedAt,
        ]
      );
      return rowToSession(rows[0]);
    },
  };
}
