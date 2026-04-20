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

const DROPI_APP_URLS: Record<string, string> = {
  AR: 'app.dropi.ar',
  CO: 'app.dropi.co',
  MX: 'app.dropi.mx',
  CL: 'app.dropi.cl',
  PE: 'app.dropi.pe',
  EC: 'app.dropi.ec',
  PA: 'app.dropi.pa',
  PY: 'app.dropi.com.py',
  ES: 'app.dropi.com.es',
}

function getDropiApiUrl(country: string): string {
  return DROPI_API_URLS[country] || DROPI_API_URLS.AR || 'https://api.dropi.ar'
}

function getDropiAppUrl(country: string): string {
  return DROPI_APP_URLS[country] || DROPI_APP_URLS.AR || 'app.dropi.ar'
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

    const cleanKey = integrationKey.trim()
    const apiUrl = getDropiApiUrl(country)
    const appUrl = getDropiAppUrl(country)

    console.log(`[Dropi Auth] Validando token para ${country} via ${apiUrl}`)
    console.log(`[Dropi Auth] Token length: ${cleanKey.length}, first 4 chars: ${cleanKey.substring(0, 4)}`)

    // Validar el token haciendo una llamada de prueba a la API de Dropi
    let testRes: Response
    let testData: Record<string, unknown>

    try {
      testRes = await fetch(`${apiUrl}/integrations/products/index`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          'dropi-integration-key': cleanKey,
        },
        body: JSON.stringify({ pageSize: 1, startData: 1, no_count: true }),
      })

      const responseText = await testRes.text()
      console.log(`[Dropi Auth] Response status: ${testRes.status}`)
      console.log(`[Dropi Auth] Response body: ${responseText.substring(0, 500)}`)

      try {
        testData = JSON.parse(responseText)
      } catch {
        console.error('[Dropi Auth] No se pudo parsear la respuesta como JSON')
        return NextResponse.json(
          { error: `Error inesperado de ${appUrl}. La API no respondio correctamente. Intenta de nuevo.` },
          { status: 502 }
        )
      }
    } catch (fetchError) {
      console.error('[Dropi Auth] Error de conexion con Dropi:', fetchError)
      return NextResponse.json(
        { error: `No se pudo conectar con ${appUrl}. Verifica tu conexion a internet e intenta de nuevo.` },
        { status: 502 }
      )
    }

    // Verificar si la respuesta es exitosa
    if (!testRes.ok || testData.status === 401 || testData.isSuccess === false) {
      const dropiMessage = testData.message || ''
      const dropiStatus = testData.status || testRes.status
      const dropiIp = testData.ip || ''

      console.error(`[Dropi Auth] Validacion fallida. Status: ${dropiStatus}, Message: ${dropiMessage}`)

      // Construir mensaje de error detallado
      let errorMsg = ''

      if (dropiStatus === 401) {
        if (cleanKey.length < 10) {
          errorMsg = `El token parece demasiado corto (${cleanKey.length} caracteres). Asegurate de copiar el token completo desde ${appUrl}`
        } else if (dropiMessage.toLowerCase().includes('ip')) {
          errorMsg = `Dropi bloqueo la conexion desde la IP del servidor (${dropiIp}). Es posible que necesites contactar a soporte de Dropi para habilitar el acceso a la API desde servidores externos.`
        } else {
          errorMsg = `Token invalido para ${appUrl}. Verifica que sea el token correcto de Integration Key.`
        }
      } else if (dropiStatus === 404) {
        errorMsg = `Endpoint no encontrado en ${appUrl}. Es posible que la API no este disponible temporalmente.`
      } else {
        errorMsg = `Error ${dropiStatus} de ${appUrl}: ${dropiMessage || 'Error desconocido'}. Intenta de nuevo o contacta a soporte de Dropi.`
      }

      return NextResponse.json(
        {
          error: errorMsg,
          debug: {
            status: dropiStatus,
            message: dropiMessage,
            serverIp: dropiIp,
            hint: 'Asegurate de usar el "Token de integracion" de tu tienda en Dropi, no otro tipo de token.'
          }
        },
        { status: 401 }
      )
    }

    // Token valido - guardar configuracion
    await db.config.upsert({
      where: { key: 'DROPI_TOKEN' },
      update: { value: cleanKey },
      create: { key: 'DROPI_TOKEN', value: cleanKey },
    })

    await db.config.upsert({
      where: { key: 'DROPI_COUNTRY' },
      update: { value: country },
      create: { key: 'DROPI_COUNTRY', value: country },
    })

    console.log(`[Dropi Auth] Token validado exitosamente para ${appUrl}`)

    return NextResponse.json({ success: true, token: cleanKey, country, apiUrl })
  } catch (error) {
    console.error('[Dropi Auth] Error inesperado:', error)
    return NextResponse.json({ error: 'Error al conectar con Dropi' }, { status: 500 })
  }
}
