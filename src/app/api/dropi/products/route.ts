import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { db } from '@/lib/db'

async function authenticate(request: NextRequest) {
  const token = request.cookies.get('capilux-auth')?.value
  if (!token) return false
  const payload = await verifyToken(token)
  return !!payload
}

// Dropi API: https://api.dropi.co/integrations/
// Autenticacion via header: dropi-integration-key
// Respuesta usa formato: { isSuccess: true, objects: [...], message: "..." }

const DROPI_API_BASE = 'https://api.dropi.co'

export async function POST(request: NextRequest) {
  try {
    const isAuth = await authenticate(request)
    if (!isAuth) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener el token de Dropi desde el body o desde la DB
    const body = await request.json()
    const dropiToken = body.dropiToken
    const keywords = body.keywords || ''
    const page = body.page || 0
    const pageSize = Math.min(body.pageSize || 20, 50)

    if (!dropiToken) {
      return NextResponse.json({ error: 'Token de Dropi requerido' }, { status: 400 })
    }

    // Construir payload segun la documentacion oficial de Dropi
    const searchPayload: Record<string, unknown> = {
      startData: page * pageSize + 1,
      pageSize: pageSize,
      order_type: keywords ? 'desc' : 'asc',
      order_by: keywords ? 'created_at' : 'name',
      no_count: true,
      active: true,
      get_stock: true,
      userVerified: true,
      notNulldescription: true,
      stockmayor: 0,
    }

    // Agregar keywords solo si hay busqueda
    if (keywords) {
      searchPayload.keywords = keywords
    } else {
      // Sin busqueda: traer productos favoritos/destacados
      searchPayload.favorite = true
    }

    const res = await fetch(`${DROPI_API_BASE}/integrations/products/index`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'dropi-integration-key': dropiToken,
      },
      body: JSON.stringify(searchPayload),
    })

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Sin respuesta')
      console.error('Dropi products search failed:', res.status, errorText)
      return NextResponse.json(
        { error: `Error al buscar productos en Dropi (${res.status})` },
        { status: res.status }
      )
    }

    const data = await res.json()

    // Dropi responde con { isSuccess, objects: [...productos...], message }
    const rawProducts = data.objects || data.products || []

    // Normalizar datos de productos de Dropi al formato de nuestra app
    const products = rawProducts.map((p: Record<string, unknown>) => {
      // Las imagenes vienen en formato: photos: [{ url, urlS3 }] o images: [string]
      const photos = p.photos || []
      let image1 = ''
      let image2 = ''
      const images: string[] = []

      if (Array.isArray(photos) && photos.length > 0) {
        // Dropi devuelve photos con url relativa, necesitamos prefijar con la API base
        for (const photo of photos) {
          const photoObj = photo as Record<string, unknown>
          const url = photoObj.urlS3 || photoObj.url || String(photo)
          // Completar URL si es relativa
          if (url.startsWith('http')) {
            images.push(url)
          } else if (photoObj.urlS3) {
            images.push(`https://d39ru7awumhhs2.cloudfront.net/${url}`)
          } else {
            images.push(`${DROPI_API_BASE}${url.startsWith('/') ? '' : '/'}${url}`)
          }
        }
        image1 = images[0] || ''
        image2 = images[1] || ''
      } else if (p.image || p.thumb) {
        image1 = p.image as string || p.thumb as string || ''
        if (image1 && !image1.startsWith('http')) {
          image1 = `${DROPI_API_BASE}${image1.startsWith('/') ? '' : '/'}${image1}`
        }
      }

      // Obtener categorias como string
      const categories = p.categories || []
      const categoryName = Array.isArray(categories) && categories.length > 0
        ? (categories[0] as Record<string, unknown>).name || String(categories[0])
        : ''

      // Obtener nombre del deposito
      const warehouseProduct = p.warehouse_product
      const warehouseName = warehouseProduct
        ? (warehouseProduct as Record<string, unknown>).warehouse_name || ''
        : (p.warehouse_name || p.bodega || '')

      return {
        id: p.id || p.sku || '',
        sku: p.sku || '',
        name: p.name || p.title || 'Sin nombre',
        description: p.description || '',
        price: parseFloat(p.price) || 0,
        suggestedPrice: parseFloat(p.suggested_price) || 0,
        stock: parseInt(String(p.stock)) || 0,
        warehouse: warehouseName as string,
        image: image1,
        image1,
        image2,
        images,
        categoryName,
        type: p.type || 'SIMPLE',
      }
    })

    // Contar total (Dropi puede no devolverlo con no_count: true)
    const total = data.total || data.count || (rawProducts.length > 0 ? (page + 1) * pageSize : 0)

    return NextResponse.json({
      products,
      total,
      pageSize,
      page,
    })
  } catch (error) {
    console.error('Dropi products error:', error)
    return NextResponse.json({ error: 'Error al conectar con Dropi' }, { status: 500 })
  }
}
