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
    const products = await db.product.findMany({
      where: {
        isCombo: false,
        ...(isAuth ? {} : { isActive: true }),
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(products)
  } catch {
    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAuth = await authenticate(request)
    if (!isAuth) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, price, image1, image2 } = body

    if (!name || !description || price === undefined) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const product = await db.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        image1: image1 || null,
        image2: image2 || null,
        isCombo: false,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 })
  }
}
