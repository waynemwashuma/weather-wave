import pg from 'pg'
import { config } from './config.js'

const { Pool } = pg

export const pool = new Pool({
  host: config.databaseHost,
  port: config.databasePort,
  database: config.databaseName,
  user: config.databaseUser,
  password: config.databasePassword,
})

const schemaStatements = [
  `
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS favorite_cities (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      city TEXT NOT NULL,
      city_normalized TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, city_normalized)
    )
  `,
  `
    CREATE INDEX IF NOT EXISTS idx_favorite_cities_user_id
    ON favorite_cities(user_id)
  `,
]

export async function ensureSchema() {
  for (const statement of schemaStatements) {
    await pool.query(statement)
  }
}
