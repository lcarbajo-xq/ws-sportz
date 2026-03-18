import 'dotenv/config'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined')
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  idleTimeoutMillis: 10000, // 10s
  // Máximo tiempo para establecer una conexión
  connectionTimeoutMillis: 5000,
  // Neon recomienda max: 1 en entornos serverless
  max: 1
})

pool.on('error', (err) => {
  console.error('Idle client error:', err)
  // pg-pool ya maneja la reconexión automáticamente
  // pero puedes añadir logging o alertas aquí
})

export const db = drizzle(pool)
