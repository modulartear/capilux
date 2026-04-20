import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { db } from '@/lib/db'

async function authenticate(request: NextRequest) {
  const token = request.cookies.get('capilux-auth')?.value
  if (!token) return false
  const payload = await verifyToken(token)
  return !!payload
}

// Dropi usa un token de integracion (API Key), NO email/password.
// El usuario obtiene su token desde app.dropi.co > Tiendas > Integraciones
// Este endpoint valida que el token sea correcto haciendo una llamada de prueba a la API.

const DROPI_API_BASE = 'https://api.dropi.co'

export async function POST(request: NextRequest) {
  try {
    const isAuth = await authenticate(request)
    if (!isAuth) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { integrationKey } = body

    if (!integrationKey) {
      return NextResponse.json(
        { error: 'La Integration Key de Dropi es requerida' },
        { status: 400 }
      )
    }

    // Validar el token haciendo una llamada de prueba a la API de Dropi
    const testRes = await fetch(`${DROPI_API_BASE}/integrations/warehouses/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'dropi-integration-key': integrationKey,
      },
    })

    if (!testRes.ok) {
      const errorText = await testRes.text().catch(() => 'Sin respuesta')
      console.error('Dropi auth validation failed:', testRes.status, errorText)
      return NextResponse.json(
        { error: 'Token de Dropi invalido. Verifica tu Integration Key en app.dropi.co' },
        { status: 401 }
      )
    }

    // Guardar el token en la tabla de configuracion
    await db.config.upsert({
      where: { key: 'DROPI_TOKEN' },
      update: { value: integrationKey },
      create: { key: 'DROPI_TOKEN', value: integrationKey },
    })

    return NextResponse.json({ success: true, token: integrationKey })
  } catch (error) {
    console.error('Dropi auth error:', error)
    return NextResponse.json({ error: 'Error al conectar con Dropi' }, { status: 500 })
  }
}
