import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

async function authenticate(request: NextRequest) {
  const token = request.cookies.get('capilux-auth')?.value
  if (!token) return false
  const payload = await verifyToken(token)
  return !!payload
}

// Get all config values
export async function GET() {
  try {
    const configs = await db.config.findMany()
    const configMap: Record<string, string> = {}
    for (const c of configs) {
      configMap[c.key] = c.value
    }
    return NextResponse.json(configMap)
  } catch {
    return NextResponse.json({ error: 'Error al obtener configuracion' }, { status: 500 })
  }
}

// Set config values (admin only)
export async function POST(request: NextRequest) {
  try {
    const isAuth = await authenticate(request)
    if (!isAuth) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { key, value } = body

    if (!key) {
      return NextResponse.json({ error: 'Key es requerida' }, { status: 400 })
    }

    const existing = await db.config.findUnique({ where: { key } })

    if (existing) {
      await db.config.update({ where: { key }, data: { value: value || '' } })
    } else {
      await db.config.create({ data: { key, value: value || '' } })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error al guardar configuracion' }, { status: 500 })
  }
}

// Bulk update config (admin only)
export async function PUT(request: NextRequest) {
  try {
    const isAuth = await authenticate(request)
    if (!isAuth) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { configs } = body as { configs: Record<string, string> }

    if (!configs || typeof configs !== 'object') {
      return NextResponse.json({ error: 'configs es requerido' }, { status: 400 })
    }

    for (const [key, value] of Object.entries(configs)) {
      const existing = await db.config.findUnique({ where: { key } })
      if (existing) {
        await db.config.update({ where: { key }, data: { value } })
      } else {
        await db.config.create({ data: { key, value } })
      }
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error al guardar configuracion' }, { status: 500 })
  }
}
