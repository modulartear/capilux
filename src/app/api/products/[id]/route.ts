import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

async function authenticate(request: NextRequest) {
  const token = request.cookies.get('capilux-auth')?.value
  if (!token) return false
  const payload = await verifyToken(token)
  return !!payload
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Determine item type from query param (default: product)
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'product'

    if (type === 'combo') {
      const combo = await db.combo.findUnique({ where: { id } })
      if (!combo) {
        return NextResponse.json({ error: 'Combo no encontrado' }, { status: 404 })
      }
      // Fetch other active combos as upsell candidates
      const otherCombos = await db.combo.findMany({
        where: { isActive: true, id: { not: id } },
        orderBy: { createdAt: 'desc' },
      })
      // Also fetch active products for broader upsell candidates
      const allProducts = await db.product.findMany({
        where: { isActive: true, isCombo: false },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json({ item: combo, type: 'combo', otherItems: [...otherCombos, ...allProducts] })
    }

    // Default: product
    const product = await db.product.findUnique({ where: { id } })
    if (!product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }
    // Fetch other active products as upsell candidates
    const otherProducts = await db.product.findMany({
      where: { isActive: true, isCombo: false, id: { not: id } },
      orderBy: { createdAt: 'desc' },
    })
    // Also fetch active combos for broader upsell candidates
    const allCombos = await db.combo.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ item: product, type: 'product', otherItems: [...otherProducts, ...allCombos] })
  } catch {
    return NextResponse.json({ error: 'Error al obtener producto' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuth = await authenticate(request)
    if (!isAuth) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, description, price, image1, image2, isActive } = body

    const product = await db.product.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(image1 !== undefined && { image1: image1 || null }),
        ...(image2 !== undefined && { image2: image2 || null }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json(product)
  } catch {
    return NextResponse.json({ error: 'Error al actualizar producto' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuth = await authenticate(request)
    if (!isAuth) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    await db.product.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error al eliminar producto' }, { status: 500 })
  }
}
