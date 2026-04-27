import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

async function authenticate(request: NextRequest) {
  const token = request.cookies.get('capilux-auth')?.value
  if (!token) return false
  const payload = await verifyToken(token)
  return !!payload
}

export async function GET(request: NextRequest) {
  try {
    const isAuth = await authenticate(request)
    const combos = await db.combo.findMany({
      where: isAuth ? {} : { isActive: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(combos)
  } catch {
    return NextResponse.json({ error: 'Error al obtener combos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAuth = await authenticate(request)
    if (!isAuth) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, items, originalPrice, price, image1, image2 } = body

    if (!name || !description || !items || price === undefined) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const combo = await db.combo.create({
      data: {
        name,
        description,
        items,
        originalPrice: originalPrice ? parseFloat(originalPrice) : 0,
        price: parseFloat(price),
        image1: image1 || null,
        image2: image2 || null,
      },
    })

    return NextResponse.json(combo, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error al crear combo' }, { status: 500 })
  }
}
