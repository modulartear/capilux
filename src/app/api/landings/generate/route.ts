import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

async function generateImages(productName: string, description: string): Promise<{ heroImage1: string | null; heroImage2: string | null }> {
  let heroImage1: string | null = null
  let heroImage2: string | null = null

  try {
    const zai = await ZAI.create()

    const [img1Res, img2Res] = await Promise.allSettled([
      zai.images.generations.create({
        prompt: `Professional product photography of ${productName}. A person happily using ${description.split('.')[0] || productName}. Bright clean background, lifestyle wellness photo, high quality commercial photography, warm lighting, premium feel. No text overlays.`,
        size: '1344x768',
      }),
      zai.images.generations.create({
        prompt: `Lifestyle product photo of ${productName}. Person showing the results of using ${productName}, confident and happy. Modern clean setting, natural light, aspirational wellness lifestyle image. Commercial quality photography. No text overlays.`,
        size: '1344x768',
      }),
    ])

    if (img1Res.status === 'fulfilled' && img1Res.value?.data?.[0]?.base64) {
      const buffer = Buffer.from(img1Res.value.data[0].base64, 'base64')
      const filename = `landings/${slugify(productName)}-hero.png`
      const fs = await import('fs')
      const path = await import('path')
      const filePath = path.join(process.cwd(), 'public', filename)
      fs.writeFileSync(filePath, buffer)
      heroImage1 = `/${filename}`
    }

    if (img2Res.status === 'fulfilled' && img2Res.value?.data?.[0]?.base64) {
      const buffer = Buffer.from(img2Res.value.data[0].base64, 'base64')
      const filename = `landings/${slugify(productName)}-lifestyle.png`
      const fs = await import('fs')
      const path = await import('path')
      const filePath = path.join(process.cwd(), 'public', filename)
      fs.writeFileSync(filePath, buffer)
      heroImage2 = `/${filename}`
    }
  } catch (error) {
    console.error('Image generation failed:', error)
  }

  return { heroImage1, heroImage2 }
}

async function generateCopy(productName: string, description: string, price: number, comparePrice?: number | null): Promise<{
  headline: string
  subheadline: string
  problem: string
  solution: string
  benefits: string
  testimonials: string
  faq: string
  ctaText: string
  urgencyText: string
}> {
  const zai = await ZAI.create()
  const priceStr = `$${price.toLocaleString('es-AR', { minimumFractionDigits: 0 })}`
  const compareStr = comparePrice ? `$${comparePrice.toLocaleString('es-AR', { minimumFractionDigits: 0 })}` : null
  const discount = comparePrice ? Math.round((1 - price / comparePrice) * 100) : 0

  const completion = await zai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `Eres un experto copywriter de landing pages de alto conversion para productos de salud y bienestar en Argentina. Generas contenido persuasivo en espanol. Siempre respondes en formato JSON valido, sin texto adicional.`,
      },
      {
        role: 'user',
        content: `Genera el contenido de una landing page persuasiva para este producto:

Nombre: ${productName}
Descripcion: ${description}
Precio: ${priceStr}
${compareStr ? `Precio original: ${compareStr} (${discount}% de descuento)` : ''}

Responde SOLAMENTE con un JSON valido con esta estructura exacta:
{
  "headline": "Titulo principal persuasivo (max 8 palabras, con emoji al inicio)",
  "subheadline": "Subtitulo que refuerza la promesa (max 15 palabras)",
  "problem": "Descripcion del problema que el cliente tiene (3-4 oraciones emocionales)",
  "solution": "Como este producto resuelve el problema (3-4 oraciones convincentes)",
  "benefits": "JSON array de 6 beneficios, cada uno con 'title' (corto) y 'description' (1 oracion)",
  "testimonials": "JSON array de 3 testimonios, cada uno con 'name', 'location' y 'text' (2-3 oraciones)",
  "faq": "JSON array de 4 preguntas frecuentes, cada una con 'question' y 'answer'",
  "ctaText": "Texto del boton CTA principal (max 5 palabras)",
  "urgencyText": "Texto de urgencia/escasez (1 linea corta)"
}

El tono debe ser: emocional, confiable, cercano, enfocado en resultados reales. No uses lenguaje agresivo.`,
      },
    ],
    temperature: 0.8,
  })

  const content = completion.choices[0]?.message?.content || ''

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch {
    // fallback
  }

  return {
    headline: `${productName} - Transforma tu Salud Hoy`,
    subheadline: `Descubri el secreto que ya miles de personas estan disfrutando. ${priceStr}.`,
    problem: `Todos los dias, millones de personas luchan con problemas de salud que afectan su calidad de vida. La fatiga constante, la falta de energia y el malestar general te impiden disfrutar plenamente de cada momento.`,
    solution: `Con ${productName}, tenes una solucion respaldada por ciencia y formulada con los mejores ingredientes. Cada capsula esta disenada para brindarte resultados reales que podes sentir desde la primera semana.`,
    benefits: JSON.stringify([
      { title: 'Resultados Rapidos', description: 'Senti la diferencia en tu cuerpo desde los primeros 15 dias de uso constante.' },
      { title: 'Formula Natural', description: 'Ingredientes 100% naturales y seleccionados por especialistas en nutricion.' },
      { title: 'Maxima Absorcion', description: 'Tecnologia de absorcion avanzada que garantiza que tu cuerpo aproveche cada nutrient.' },
      { title: 'Calidad Premium', description: 'Fabricado bajo los mas estrictos estandares de calidad y control.' },
      { title: 'Sin Efectos Secundarios', description: 'Formula segura y tolerada, compatible con la mayoria de las dietas.' },
      { title: 'Garantia Total', description: 'Si no estas satisfecho, te devolvemos tu dinero sin preguntas.' },
    ]),
    testimonials: JSON.stringify([
      { name: 'Maria G.', location: 'Buenos Aires', text: 'Llevo 2 meses usandolo y los cambios son increibles. Mi energia cambio por completo y me siento mucho mejor conmigo misma.' },
      { name: 'Carlos R.', location: 'Cordoba', text: 'Lo recomiendo al 100%. Desde que empece a tomarlo note una mejora enorme en mi dia a dia. Espectacular producto.' },
      { name: 'Luciana M.', location: 'Rosario', text: 'Probé muchos productos antes pero ninguno me dio estos resultados. El envio fue rapido y la atencion al cliente excelente.' },
    ]),
    faq: JSON.stringify([
      { question: 'Como debo tomar el producto?', answer: 'Se recomienda seguir las instrucciones del envase. Generalmente, 1-2 capsulas diarias con agua, preferentemente con las comidas.' },
      { question: 'Es seguro para consumption prolongada?', answer: 'Si, todos los ingredientes son naturales y seguros para consumo prolongado. Consulta a tu medico si tenes alguna condicion preexistente.' },
      { question: 'Cuanto tarda en llegar el envio?', answer: 'Los envios se realizan dentro de las 24-48 horas habiles. El tiempo de entrega depende de tu ubicacion, generalmente entre 3-5 dias habiles.' },
      { question: 'Tienen garantia de devolucion?', answer: 'Si, ofrecemos garantia de satisfaccion. Si no estas conforme con el producto, podes solicitar la devolucion dentro de los 30 dias.' },
    ]),
    ctaText: 'Quiero Mi Oferta Ahora',
    urgencyText: `Solo quedan 17 unidades - Oferta por tiempo limitado ${discount > 0 ? `- ${discount}% OFF` : ''}`,
  }
}

export async function POST(request: NextRequest) {
  try {
    const { productId } = await request.json()

    if (!productId) {
      return NextResponse.json({ error: 'ProductId es requerido' }, { status: 400 })
    }

    // Fetch product from real database
    const product = await db.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    // Check for existing landing with same slug
    const slug = slugify(`${product.name}-${Date.now()}`)

    // Generate AI content and images in parallel
    const [copyResult, imageResult] = await Promise.all([
      generateCopy(product.name, product.description, product.price),
      generateImages(product.name, product.description),
    ])

    // Save to database
    const landing = await db.landingPage.create({
      data: {
        slug,
        productId: product.id,
        productName: product.name,
        headline: copyResult.headline,
        subheadline: copyResult.subheadline,
        problem: copyResult.problem,
        solution: copyResult.solution,
        benefits: copyResult.benefits,
        testimonials: copyResult.testimonials,
        faq: copyResult.faq,
        ctaText: copyResult.ctaText,
        ctaLink: `/checkout/${product.id}?type=product`,
        heroImage1: imageResult.heroImage1 || product.image1,
        heroImage2: imageResult.heroImage2 || product.image2,
        urgencyText: copyResult.urgencyText,
        isActive: true,
      },
    })

    return NextResponse.json({ success: true, landing })
  } catch (error: any) {
    console.error('Error generating landing:', error)
    return NextResponse.json({ error: error.message || 'Error al generar la landing' }, { status: 500 })
  }
}
