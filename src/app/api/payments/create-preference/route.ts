import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Get MP config from DB or env
async function getMPConfig() {
  const count = await db.config.count()
  if (count > 0) {
    const configs = await db.config.findMany()
    const configMap: Record<string, string> = {}
    for (const c of configs) configMap[c.key] = c.value
    if (configMap.MP_ACCESS_TOKEN) return configMap.MP_ACCESS_TOKEN
  }
  return process.env.MP_ACCESS_TOKEN || ''
}

async function getSiteURL() {
  const count = await db.config.count()
  if (count > 0) {
    const configs = await db.config.findMany()
    const configMap: Record<string, string> = {}
    for (const c of configs) configMap[c.key] = c.value
    if (configMap.NEXT_PUBLIC_SITE_URL) return configMap.NEXT_PUBLIC_SITE_URL
  }
  return process.env.NEXT_PUBLIC_SITE_URL || ''
}

export async function POST(request: NextRequest) {
  try {
    const accessToken = await getMPConfig()
    if (!accessToken) {
      return NextResponse.json(
        { error: 'MercadoPago no configurado. Agrega tu Access Token en el Dashboard o en .env (MP_ACCESS_TOKEN)' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      title,
      description,
      price,
      quantity,
      shippingCost,
      shippingLabel,
      buyerName,
      buyerEmail,
      buyerPhone,
      buyerDni,
      itemType,
      itemId,
      // Shipping address fields
      shippingProvince,
      shippingCity,
      shippingStreet,
      shippingNumber,
      shippingFloor,
      shippingCp,
      orderId,
    } = body

    if (!title || !price || !quantity || !buyerEmail) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    const siteURL = await getSiteURL()
    const itemPrice = parseFloat(price)
    const itemQty = parseInt(quantity)
    const shipCost = parseFloat(shippingCost) || 0
    const totalAmount = itemPrice * itemQty + shipCost
    const externalRef = `${itemType || 'product'}_${itemId}_${Date.now()}`

    // Build receiver address for MercadoPago
    const receiverAddress = (shippingStreet || shippingCity || shippingProvince || shippingCp) ? {
      zip_code: shippingCp || '',
      street_name: shippingStreet || '',
      street_number: shippingNumber || '',
      apartment: shippingFloor || '',
      city_name: shippingCity || '',
      state_name: shippingProvince || '',
    } : undefined

    // Create MercadoPago preference
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `${itemId}-${Date.now()}`,
      },
      body: JSON.stringify({
        items: [
          {
            id: itemId || 'item-1',
            title: title,
            description: description || title,
            quantity: itemQty,
            unit_price: itemPrice,
            currency_id: 'ARS',
            category_id: itemType === 'combo' ? 'combo' : 'supplements',
          },
          ...(shipCost > 0 ? [
            {
              id: `shipping-${Date.now()}`,
              title: shippingLabel || 'Envio',
              description: shippingLabel || 'Costo de envio',
              quantity: 1,
              unit_price: shipCost,
              currency_id: 'ARS',
              category_id: 'shipping',
            }
          ] : []),
        ],
        payer: {
          name: buyerName || '',
          email: buyerEmail,
          phone: {
            number: buyerPhone || '',
          },
          identification: {
            type: 'DNI',
            number: buyerDni || '',
          },
        },
        shipments: {
          receiver_address: receiverAddress,
        },
        back_urls: {
          success: `${siteURL}/#pago-exitoso`,
          failure: `${siteURL}/#pago-fallido`,
          pending: `${siteURL}/#pago-pendiente`,
        },
        auto_return: 'approved',
        notification_url: siteURL ? `${siteURL}/api/payments/webhook` : undefined,
        external_reference: externalRef,
        statement_descriptor: 'CAPILUX',
      }),
    })

    const mpData = await mpResponse.json()

    if (!mpResponse.ok) {
      console.error('MP Error:', mpData)
      return NextResponse.json(
        { error: `Error de MercadoPago: ${mpData.message || 'Error desconocido'}` },
        { status: 400 }
      )
    }

    // Save/update order in database
    if (orderId) {
      await db.order.update({
        where: { id: orderId },
        data: {
          paymentRef: mpData.id || externalRef,
          paymentStatus: 'pending',
        },
      })
    }

    return NextResponse.json({
      initPoint: mpData.init_point,
      sandboxInitPoint: mpData.sandbox_init_point,
      preferenceId: mpData.id,
    })
  } catch (error) {
    console.error('Payment error:', error)
    return NextResponse.json({ error: 'Error al procesar el pago' }, { status: 500 })
  }
}
