import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { db } from '@/lib/db'

async function authenticate(request: NextRequest) {
  const token = request.cookies.get('capilux-auth')?.value
  if (!token) return false
  const payload = await verifyToken(token)
  return !!payload
}

export async function POST(request: NextRequest) {
  try {
    const isAuth = await authenticate(request)
    if (!isAuth) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      dropiId,
      name,
      description,
      price,
      image1,
      image2,
      dropiPrice,
      stock,
      sku,
    } = body

    if (!dropiId || !name) {
      return NextResponse.json({ error: 'Datos del producto requeridos' }, { status: 400 })
    }

    // Verificar si el producto ya existe (por dropiId)
    const existing = await db.product.findUnique({
      where: { dropiId },
    })

    if (existing) {
      // Actualizar producto existente manteniendo el precio que el usuario haya configurado
      const updated = await db.product.update({
        where: { dropiId },
        data: {
          name,
          description: description || existing.description,
          price: parseFloat(price) || existing.price,
          image1: image1 || existing.image1,
          image2: image2 || existing.image2,
          isActive: true,
        },
      })
      return NextResponse.json({ success: true, product: updated, updated: true })
    }

    // Crear nuevo producto
    const product = await db.product.create({
      data: {
        name,
        description: description || `Producto importado de Dropi${sku ? ` - SKU: ${sku}` : ''}`,
        price: parseFloat(price) || 0,
        image1: image1 || null,
        image2: image2 || null,
        isCombo: false,
        isActive: true,
        dropiId,
      },
    })

    return NextResponse.json({ success: true, product, updated: false })
  } catch (error) {
    console.error('Dropi import error:', error)
    return NextResponse.json({ error: 'Error al importar producto' }, { status: 500 })
  }
}
