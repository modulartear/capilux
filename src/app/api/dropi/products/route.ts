import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

async function authenticate(request: NextRequest) {
  const token = request.cookies.get('capilux-auth')?.value
  if (!token) return false
  const payload = await verifyToken(token)
  return !!payload
}

const DROPI_API = 'https://api.dropi.co'

export async function POST(request: NextRequest) {
  try {
    const isAuth = await authenticate(request)
    if (!isAuth) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { dropiToken, keywords = '', page = 0, pageSize = 20 } = body

    if (!dropiToken) {
      return NextResponse.json({ error: 'Token de Dropi requerido' }, { status: 400 })
    }

    const searchPayload: Record<string, unknown> = {
      pageSize: Math.min(pageSize, 50),
      startData: page * pageSize,
      keywords: keywords,
      userVerified: false,
      order_by: 'created_at',
      order_type: 'desc',
      with_collection: true,
      get_stock: true,
      no_count: true,
    }

    // When searching, don't send favorite or privated_product
    if (!keywords) {
      searchPayload.favorite = true
    }

    const res = await fetch(`${DROPI_API}/integrations/products/index`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'dropi-integration-key': dropiToken,
        'Origin': 'https://capilux.vercel.app',
        'Referer': 'https://capilux.vercel.app',
      },
      body: JSON.stringify(searchPayload),
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Error al buscar productos en Dropi' },
        { status: res.status }
      )
    }

    const data = await res.json()

    // Normalize product data
    const products = (data.products || []).map((p: Record<string, unknown>) => ({
      id: p.id || p.sku || '',
      sku: p.sku || '',
      name: p.name || p.title || 'Sin nombre',
      description: p.description || '',
      price: parseFloat(p.price) || 0,
      suggestedPrice: parseFloat(p.suggested_price) || 0,
      stock: parseInt(p.stock) || 0,
      warehouse: p.warehouse_name || p.bodega || '',
      image: p.image || p.thumb || '',
      images: p.images || [],
      categories: p.categories || [],
      collection: p.collection || '',
    }))

    return NextResponse.json({
      products,
      total: data.total || 0,
      pageSize: data.pageSize || pageSize,
      startData: data.startData || 0,
    })
  } catch {
    return NextResponse.json({ error: 'Error al conectar con Dropi' }, { status: 500 })
  }
}
