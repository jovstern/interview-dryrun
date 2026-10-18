// Checks the database in POSTGRES_URL answers. Prints no credentials.
// Run: node --env-file=.env scripts/db-check.mjs
import postgres from 'postgres'

if (!process.env.POSTGRES_URL) {
  console.error('POSTGRES_URL is not set in .env')
  process.exit(1)
}

const sql = postgres(process.env.POSTGRES_URL, { ssl: 'require' })
try {
  let start = Date.now()
  const [{ db }] = await sql`select current_database() as db`
  const first = Date.now() - start
  start = Date.now()
  await sql`select 1`
  const tables = await sql`
    select count(*)::int as n from information_schema.tables where table_schema = 'public'
  `
  console.log(`OK: database "${db}", ${tables[0].n} tables in public`)
  console.log(`first query ${first} ms (includes wake-up), next query ${Date.now() - start} ms`)
} catch (error) {
  console.error('FAILED:', error.message)
  process.exitCode = 1
} finally {
  await sql.end()
}
