import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Get Andreani config from DB
async function getAndreaniConfig() {
  const configs = await db.config.findMany()
  const map: Record<string, string> = {}
  for (const c of configs) map[c.key] = c.value
  return map
}

// Authenticate with Andreani API and get Bearer token
async function getAndreaniToken(apiUrl: string, username: string, password: string): Promise<string> {
  const url = apiUrl.replace(/\/+$/, '')
  const response = await fetch(`${url}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-username': username,
      'x-password': password,
    },
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Andreani auth failed (${response.status}): ${err}`)
  }

  const data = await response.json()
  return data.token || data.access_token || ''
}

// Get shipping quote from Andreani
async function fetchQuote(
  token: string,
  apiUrl: string,
  contract: string,
  senderCp: string,
  receiverCp: string,
  weight: number,
  dimensions: { length: number; width: number; height: number }
) {
  const url = apiUrl.replace(/\/+$/, '')

  // Andreani API v2 - Tarifas
  const body = {
    contrato: contract,
    origen: {
      codigoPostal: senderCp,
    },
    destino: {
      codigoPostal: receiverCp,
    },
    volumen: {
      tipo: 'PAQUETE',
      cantidad: 1,
      peso: weight,
      largoCm: dimensions.length,
      altoCm: dimensions.height,
      anchoCm: dimensions.width,
    },
  }

  const response = await fetch(`${url}/v2/tarifas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-contrato': contract,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Andreani quote failed (${response.status}): ${err}`)
  }

  return await response.json()
}

export async function POST(request: NextRequest) {
  try {
    const config = await getAndreaniConfig()

    const apiUrl = config.ANDREANI_API_URL || process.env.ANDREANI_API_URL || ''
    const username = config.ANDREANI_USERNAME || process.env.ANDREANI_USERNAME || ''
    const password = config.ANDREANI_PASSWORD || process.env.ANDREANI_PASSWORD || ''
    const contract = config.ANDREANI_CONTRACT || process.env.ANDREANI_CONTRACT || ''
    const senderCp = config.ANDREANI_SENDER_CP || process.env.ANDREANI_SENDER_CP || '1001'

    if (!apiUrl || !username || !password || !contract) {
      return NextResponse.json({
        error: 'Andreani no configurado. Configura las credenciales en el Dashboard.',
        configured: false,
      }, { status: 400 })
    }

    const body = await request.json()
    const { postalCode, weight, dimensions } = body

    if (!postalCode) {
      return NextResponse.json({ error: 'Codigo postal requerido' }, { status: 400 })
    }

    // Authenticate
    const token = await getAndreaniToken(apiUrl, username, password)

    // Fetch quote
    const quoteData = await fetchQuote(
      token,
      apiUrl,
      contract,
      senderCp,
      postalCode,
      weight || 0.5, // Default 500g for supplements
      dimensions || { length: 25, width: 15, height: 10 }
    )

    // Parse Andreani response into shipping options
    const options: Array<{
      id: string
      label: string
      description: string
      cost: number
      estimatedDays: string
      serviceType: string
    }> = []

    if (Array.isArray(quoteData)) {
      for (const rate of quoteData) {
        const tariff = rate.tarifa || rate
        options.push({
          id: tariff.codigoServicio || rate.codigoServicio || 'standard',
          label: tariff.nombreServicio || rate.nombreServicio || 'Envio Andreani',
          description: tariff.descripcion || '',
          cost: parseFloat(tarifa.precio || tariff.importe || rate.precio || rate.importe || 0),
          estimatedDays: tariff.rangoHorario || tariff.plazoEntrega || rate.plazoEntrega || '3 a 7 dias habiles',
          serviceType: tariff.tipoServicio || rate.tipoServicio || 'estandar',
        })
      }
    } else if (quoteData && typeof quoteData === 'object') {
      // Handle single quote or different response format
      const tariff = quoteData.tarifa || quoteData
      if (tariff.precio || tariff.importe || quoteData.precio) {
        options.push({
          id: tariff.codigoServicio || quoteData.codigoServicio || 'standard',
          label: tariff.nombreServicio || quoteData.nombreServicio || 'Envio Andreani',
          description: tariff.descripcion || '',
          cost: parseFloat(tariff.precio || tariff.importe || quoteData.precio || quoteData.importe || 0),
          estimatedDays: tariff.plazoEntrega || quoteData.plazoEntrega || '3 a 7 dias habiles',
          serviceType: tariff.tipoServicio || quoteData.tipoServicio || 'estandar',
        })
      }
    }

    return NextResponse.json({
      configured: true,
      options,
      raw: quoteData,
    })
  } catch (error) {
    console.error('Andreani shipping error:', error)
    const message = error instanceof Error ? error.message : 'Error al obtener cotizacion'
    return NextResponse.json({ error: message, configured: false }, { status: 500 })
  }
}
