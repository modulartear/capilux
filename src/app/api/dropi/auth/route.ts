import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { db } from '@/lib/db'

async function authenticate(request: NextRequest) {
  const token = request.cookies.get('capilux-auth')?.value
  if (!token) return false
  const payload = await verifyToken(token)
  return !!payload
}

// URLs de Dropi por pais
const DROPI_API_URLS: Record<string, string> = {
  AR: 'https://api.dropi.ar',
  CO: 'https://api.dropi.co',
  MX: 'https://api.dropi.mx',
  CL: 'https://api.dropi.cl',
  PE: 'https://api.dropi.pe',
  EC: 'https://api.dropi.ec',
  PA: 'https://api.dropi.pa',
  PY: 'https://api.dropi.com.py',
  ES: 'https://api.dropi.com.es',
}

function getDropiApiUrl(country: string): string {
  return DROPI_API_URLS[country] || DROPI_API_URLS.AR || 'https://api.dropi.ar'
}

export async function POST(request: NextRequest) {
  try {
    const isAuth = await authenticate(request)
    if (!isAuth) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { integrationKey, country = 'AR' } = body

    if (!integrationKey) {
      return NextResponse.json(
        { error: 'La Integration Key de Dropi es requerida' },
        { status: 400 }
      )
    }

    const apiUrl = getDropiApiUrl(country)

    // Validar el token haciendo una llamada de prueba a la API de Dropi
    const testRes = await fetch(`${apiUrl}/integrations/products/index`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'dropi-integration-key': integrationKey,
      },
      body: JSON.stringify({ pageSize: 1, startData: 1, no_count: true }),
    })

    const testData = await testRes.json()

    if (!testRes.ok || testData.status === 401) {
      console.error('Dropi auth validation failed:', testRes.status, testData.message)
      const domain = apiUrl.replace('https://api.', '')
      return NextResponse.json(
        { error: `Token invalido para ${domain}. Verifica tu Integration Key en app.${domain}` },
        { status: 401 }
      )
    }

    // Guardar el token y pais en la tabla de configuracion
    await db.config.upsert({
      where: { key: 'DROPI_TOKEN' },
      update: { value: integrationKey },
      create: { key: 'DROPI_TOKEN', value: integrationKey },
    })

    await db.config.upsert({
      where: { key: 'DROPI_COUNTRY' },
      update: { value: country },
      create: { key: 'DROPI_COUNTRY', value: country },
    })

    return NextResponse.json({ success: true, token: integrationKey, country, apiUrl })
  } catch (error) {
    console.error('Dropi auth error:', error)
    return NextResponse.json({ error: 'Error al conectar con Dropi' }, { status: 500 })
  }
}
