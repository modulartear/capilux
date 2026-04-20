import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { currentProduct, availableProducts } = body

    if (!currentProduct || !availableProducts || !Array.isArray(availableProducts)) {
      return NextResponse.json({ error: 'Datos faltantes' }, { status: 400 })
    }

    // Build a compact product list for the prompt
    const productList = availableProducts
      .map((p: { id: string; name: string; description: string; price: number; items?: string; originalPrice?: number; _type?: string }, i: number) => {
        const typeLabel = p._type === 'combo' ? 'COMBO' : 'PRODUCTO'
        const extraInfo = p._type === 'combo' && p.items ? ` (Incluye: ${p.items})` : ''
        const origPrice = p._type === 'combo' && p.originalPrice ? `, precio original: $${p.originalPrice.toLocaleString('es-AR')}` : ''
        return `${i + 1}. [${typeLabel}] "${p.name}" - $${p.price.toLocaleString('es-AR')}${origPrice} - ${p.description}${extraInfo} (ID: ${p.id})`
      })
      .join('\n')

    const zai = await ZAI.create()

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `Eres un experto en nutricion capilar y suplementos para el cuidado del cabello. Tu tarea es recomendar 2-4 productos complementarios al que el usuario esta viendo.

REGLAS IMPORTANTES:
- Solo recomienda productos de la lista proporcionada
- No recomiendes el producto que el usuario ya esta viendo
- Elige productos que complementen bien al actual (ej: si es un shampoo, recomienda acondicionador o tratamiento)
- Prioriza combos si hacen sentido con el producto actual
- La recomendacion debe ser breve, maximo 2 frases, en espanol argentino
- Responde SOLO en formato JSON valido, sin texto adicional

FORMATO DE RESPUESTA (JSON):
{
  "recommendations": [
    {
      "productId": "ID_DEL_PRODUCTO",
      "reason": "Breve razon de por que complementa"
    }
  ]
}`
        },
        {
          role: 'user',
          content: `El usuario esta viendo este producto:
- Nombre: "${currentProduct.name}"
- Precio: $${currentProduct.price.toLocaleString('es-AR')}
- Descripcion: ${currentProduct.description}
${currentProduct.items ? `- Incluye: ${currentProduct.items}` : ''}

Productos disponibles para recomendar:
${productList}

Recomienda 2-4 productos que complementen bien esta compra. Responde SOLO con el JSON.`
        }
      ],
    })

    const content = completion.choices?.[0]?.message?.content || ''

    // Parse the JSON response - handle potential markdown wrapping
    let parsed
    try {
      // Try to extract JSON from potential markdown code block
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content]
      const jsonStr = (jsonMatch[1] || content).trim()
      parsed = JSON.parse(jsonStr)
    } catch {
      // If parsing fails, return empty recommendations
      return NextResponse.json({ recommendations: [] })
    }

    const recommendations = (parsed.recommendations || [])
      .filter((r: { productId: string; reason: string }) => {
        // Make sure the recommended product exists in the available list
        const productExists = availableProducts.some((p: { id: string }) => p.id === r.productId)
        // Make sure it's not the current product
        const isNotCurrent = r.productId !== currentProduct.id
        return productExists && isNotCurrent && r.reason
      })
      .map((r: { productId: string; reason: string }) => {
        const product = availableProducts.find((p: { id: string }) => p.id === r.productId)
        return {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          image1: product.image1 || null,
          image2: product.image2 || null,
          items: product.items || null,
          originalPrice: product.originalPrice || null,
          type: product._type || 'product',
          reason: r.reason,
        }
      })
      .slice(0, 4)

    return NextResponse.json({ recommendations })
  } catch (error) {
    console.error('AI Upsell error:', error)
    return NextResponse.json({ recommendations: [] })
  }
}
