import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// MercadoPago Webhook - receives payment notifications
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Handle different notification types
    if (body.type === 'payment') {
      const paymentId = body.data?.id
      if (paymentId) {
        // Get payment details from MP
        const configs = await db.config.findMany()
        const configMap: Record<string, string> = {}
        for (const c of configs) configMap[c.key] = c.value

        const accessToken = configMap.MP_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN
        if (accessToken) {
          const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` },
          })
          if (mpRes.ok) {
            const paymentData = await mpRes.json()
            const externalRef = paymentData.external_reference
            const status = paymentData.status // approved, rejected, pending, in_process

            if (externalRef) {
              // Parse external_reference: "product_itemId_timestamp" or "combo_itemId_timestamp"
              const parts = externalRef.split('_')
              if (parts.length >= 2) {
                const itemId = parts[1]
                // Find the most recent order for this item that is still pending
                const pendingOrders = await db.order.findMany({
                  where: {
                    itemId: itemId,
                    paymentStatus: 'pending',
                  },
                  orderBy: { createdAt: 'desc' },
                  take: 1,
                })

                if (pendingOrders.length > 0) {
                  await db.order.update({
                    where: { id: pendingOrders[0].id },
                    data: {
                      paymentStatus: status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'pending',
                      paymentRef: paymentData.id?.toString() || pendingOrders[0].paymentRef,
                    },
                  })
                }
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ received: true }, { status: 200 })
  }
}

// GET - for webhook verification
export async function GET(request: NextRequest) {
  return NextResponse.json({ status: 'ok' })
}
