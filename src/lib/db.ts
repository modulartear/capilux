import { readFileSync } from 'fs'
import { join } from 'path'
import { PrismaClient } from '@prisma/client'

// Force load .env to override system DATABASE_URL (container sets file: custom.db)
let DATABASE_URL = process.env.DATABASE_URL || ''
try {
  const envPath = join(process.cwd(), '.env')
  const envContent = readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIndex = trimmed.indexOf('=')
      if (eqIndex > 0) {
        const key = trimmed.slice(0, eqIndex).trim()
        let value = trimmed.slice(eqIndex + 1).trim()
        // Remove surrounding quotes
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1)
        }
        process.env[key] = value
        if (key === 'DATABASE_URL') DATABASE_URL = value
      }
    }
  }
} catch {}

const POSTGRES_URL = 'postgres://5e2d1ed17a6a9f666959fc0391ef5fab9562fadbfa588b89ab0dd0337a521f7f:sk_TP8XrOblb8JVNEH6H3CRK@db.prisma.io:5432/postgres?sslmode=require'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
    datasources: {
      db: {
        url: POSTGRES_URL,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
