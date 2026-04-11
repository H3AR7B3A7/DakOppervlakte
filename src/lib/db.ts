import { neon } from '@neondatabase/serverless'

function getDb() {
  const url = process.env.DATABASE_URL
  if (!url || url === 'postgresql://placeholder') {
    throw new Error('DATABASE_URL not configured')
  }
  return neon(url)
}

export default getDb
