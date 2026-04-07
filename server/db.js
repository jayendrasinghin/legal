import dotenv from 'dotenv'
import pg from 'pg'

dotenv.config()

const { Pool } = pg

const connectionString = process.env.DATABASE_URL?.trim()

export const pool = connectionString
  ? new Pool({ connectionString })
  : new Pool({
      host: process.env.POSTGRES_HOST || 'localhost',
      port: Number(process.env.POSTGRES_PORT || 5432),
      database: process.env.POSTGRES_DB || 'seoi',
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
    })
