import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Create new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      itemType,
      itemId,
      itemName,
      itemPrice,
      quantity,
      subtotal,
      buyerName,
      buyerEmail,
      buyerPhone,
      buyerDni,
      shippingMethod,
      shippingCost,
      shippingAddress,
      shippingProvince,
      shippingCity,
      shippingStreet,
      shippingNumber,
      shippingFloor,
      shippingCp,
      total,
      paymentRef,
      notes,
    } = body

    if (!itemName || !buyerEmail || !buyerName || !itemType) {
      return NextResponse.json({ error: 'Datos incompletos para crear el pedido' }, { status: 400 })
    }

    // Extract shipping fields from shippingAddress object or flat fields
    let finalShippingProvince = shippingProvince || null
    let finalShippingCity = shippingCity || null
    let finalShippingStreet = shippingStreet || null
    let finalShippingNumber = shippingNumber || null
    let finalShippingFloor = shippingFloor || null
    let finalShippingCp = shippingCp || null
    let finalShippingAddress = shippingAddress ? JSON.stringify(shippingAddress) : null

    // If shippingAddress is an object with nested fields, extract them
    if (shippingAddress && typeof shippingAddress === 'object') {
      finalShippingProvince = shippingAddress.province || shippingProvince || null
      finalShippingCity = shippingAddress.city || shippingCity || null
      finalShippingStreet = shippingAddress.street || shippingStreet || null
      finalShippingNumber = shippingAddress.number || shippingNumber || null
      finalShippingFloor = shippingAddress.floor || shippingFloor || null
      finalShippingCp = shippingAddress.postalCode || shippingAddress.postal_code || shippingCp || null
    }

    const order = await db.order.create({
      data: {
        itemType: itemType || 'product',
        itemId: itemId || '',
        itemName,
        itemPrice: parseFloat(itemPrice) || 0,
        quantity: parseInt(quantity) || 1,
        subtotal: parseFloat(subtotal) || 0,
        buyerName,
        buyerEmail,
        buyerPhone: buyerPhone || null,
        buyerDni: buyerDni || null,
        shippingMethod: shippingMethod || null,
        shippingCost: parseFloat(shippingCost) || 0,
        shippingAddress: finalShippingAddress,
        shippingProvince: finalShippingProvince,
        shippingCity: finalShippingCity,
        shippingStreet: finalShippingStreet,
        shippingNumber: finalShippingNumber,
        shippingFloor: finalShippingFloor,
        shippingCp: finalShippingCp,
        total: parseFloat(total) || 0,
        paymentRef: paymentRef || null,
        notes: notes || null,
      },
    })

    return NextResponse.json({ success: true, orderId: order.id })
  } catch (error: any) {
    console.error('Order creation error:', error)
    const message = error?.message || 'Error al crear el pedido'
    return NextResponse.json({ error: message, details: process.env.NODE_ENV === 'development' ? String(error) : undefined }, { status: 500 })
  }
}

// GET - List orders (admin only, auth checked via token)
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('capilux-auth')?.value
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Simple token validation
    const { verifyToken } = await import('@/lib/auth')
    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token invalido' }, { status: 401 })
    }

    const orders = await db.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Orders list error:', error)
    return NextResponse.json({ error: 'Error al obtener pedidos' }, { status: 500 })
  }
}
