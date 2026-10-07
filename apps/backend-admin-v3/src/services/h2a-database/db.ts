import { Pool } from 'pg'

let pool: Pool | null = null

export const getH2ADbPool = (): Pool => {
  if (!pool) {
    const connectionString = process.env.H2A_DATABASE_URI || process.env.DATABASE_URI || ''
    if (!connectionString) {
      throw new Error(
        'H2A database connection string is not configured. Set H2A_DATABASE_URI or DATABASE_URI environment variable.',
      )
    }
    pool = new Pool({ connectionString })
  }
  return pool
}

export const initH2ADatabase = async (): Promise<void> => {
  const client = await getH2ADbPool().connect()
  try {
    // Schema is now managed by Payload migrations.
    // This function can be used for a quick connection check during startup/seeding.
    await client.query('SELECT 1')
  } finally {
    client.release()
  }
}
