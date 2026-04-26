import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

function buildFallbackCopy(productName: string, description: string, price: number) {
  const priceStr = `$${price.toLocaleString('es-AR', { minimumFractionDigits: 0 })}`
  return {
    headline: `${productName} - Transforma tu Salud Hoy`,
    subheadline: `Descubri el secreto que ya miles de personas estan disfrutando. ${priceStr}.`,
    problem: `Todos los dias, millones de personas luchan con problemas de salud que afectan su calidad de vida. La fatiga constante, la falta de energia y el malestar general te impiden disfrutar plenamente de cada momento. Sentis que nada funciona y que siempre estas atrasado con tus metas.`,
    solution: `Con ${productName}, tenes una solucion respaldada por ciencia y formulada con los mejores ingredientes. Cada capsula esta disenada para brindarte resultados reales que podes sentir desde la primera semana. Miles de personas ya lo comprueban.`,
    benefits: JSON.stringify([
      { title: 'Resultados Rapidos', description: 'Senti la diferencia en tu cuerpo desde los primeros 15 dias de uso constante.' },
      { title: 'Formula Natural', description: 'Ingredientes 100% naturales y seleccionados por especialistas en nutricion.' },
      { title: 'Maxima Absorcion', description: 'Tecnologia de absorcion avanzada que garantiza que tu cuerpo aproveche cada nutriente.' },
      { title: 'Calidad Premium', description: 'Fabricado bajo los mas estrictos estandares de calidad y control.' },
      { title: 'Sin Efectos Secundarios', description: 'Formula segura y tolerada, compatible con la mayoria de las dietas.' },
      { title: 'Garantia Total', description: 'Si no estas satisfecho, te devolvemos tu dinero sin preguntas.' },
    ]),
    testimonials: JSON.stringify([
      { name: 'Maria G.', location: 'Buenos Aires', text: 'Llevo 2 meses usandolo y los cambios son increibles. Mi energia cambio por completo y me siento mucho mejor conmigo misma.' },
      { name: 'Carlos R.', location: 'Cordoba', text: 'Lo recomiendo al 100%. Desde que empece a tomarlo note una mejora enorme en mi dia a dia. Espectacular producto.' },
      { name: 'Luciana M.', location: 'Rosario', text: 'Probe muchos productos antes pero ninguno me dio estos resultados. El envio fue rapido y la atencion al cliente excelente.' },
    ]),
    faq: JSON.stringify([
      { question: 'Como debo tomar el producto?', answer: 'Se recomienda seguir las instrucciones del envase. Generalmente, 1-2 capsulas diarias con agua, preferentemente con las comidas.' },
      { question: 'Es seguro para consumo prolongada?', answer: 'Si, todos los ingredientes son naturales y seguros para consumo prolongado. Consulta a tu medico si tenes alguna condicion preexistente.' },
      { question: 'Cuanto tarda en llegar el envio?', answer: 'Los envios se realizan dentro de las 24-48 horas habiles. El tiempo de entrega depende de tu ubicacion, generalmente entre 3-5 dias habiles.' },
      { question: 'Tienen garantia de devolucion?', answer: 'Si, ofrecemos garantia de satisfaccion. Si no estas conforme con el producto, podes solicitar la devolucion dentro de los 30 dias.' },
    ]),
    ctaText: 'Quiero Mi Oferta Ahora',
    urgencyText: 'Solo quedan 17 unidades - Oferta por tiempo limitado',
  }
}

async function generateCopyWithAI(productName: string, description: string, price: number) {
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()
    const priceStr = `$${price.toLocaleString('es-AR', { minimumFractionDigits: 0 })}`

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
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      if (parsed.headline && parsed.subheadline && parsed.problem && parsed.solution) {
        return parsed
      }
    }
    return null
  } catch (error) {
    console.error('AI copy generation failed, using fallback:', error)
    return null
  }
}

async function generateImageWithAI(productName: string, description: string, type: 'hero' | 'lifestyle'): Promise<string | null> {
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()

    const prompts = {
      hero: `Professional product photography of ${productName}. A person happily using ${description.split('.')[0] || productName}. Bright clean background, lifestyle wellness photo, high quality commercial photography, warm lighting, premium feel. No text overlays.`,
      lifestyle: `Lifestyle product photo of ${productName}. Person showing the results of using ${productName}, confident and happy. Modern clean setting, natural light, aspirational wellness lifestyle image. Commercial quality photography. No text overlays.`,
    }

    const result = await zai.images.generations.create({
      prompt: prompts[type],
      size: '1344x768',
    })

    if (result.data?.[0]?.base64) {
      return `data:image/png;base64,${result.data[0].base64}`
    }
    return null
  } catch (error) {
    console.error(`AI image generation (${type}) failed:`, error)
    return null
  }
}

// Start UGC video generation - just creates the task and saves ID
// Client polls /api/video/status?landingId=xxx for progress
async function startUGCVideoTask(landingId: string, productName: string) {
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()

    // Read avatar as base64 (more reliable than URL for the video API)
    const fs = await import('fs')
    const path = await import('path')
    const avatarPath = path.join(process.cwd(), 'public', 'ugc-avatar.jpg')
    let avatarBase64: string | undefined
    try {
      const imgBuffer = fs.readFileSync(avatarPath)
      avatarBase64 = `data:image/jpeg;base64,${imgBuffer.toString('base64')}`
    } catch {
      // Fallback to URL if file not found
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
      avatarBase64 = `${siteUrl}/ugc-avatar.jpg`
    }

    const videoPrompt = `Video estilo UGC testimonial en español argentino (rioplatense). Una persona real hablando a cámara sobre ${productName}, entusiasmada y auténtica, mostrando el producto con confianza. Iluminación natural, estilo selfie, fondo casual como un dormitorio o living. Contenido para redes sociales, expresión genuina y cercana. La persona dice algo como: "Mirá, desde que uso ${productName} mi vida cambió totalmente, lo recomiendo al cien por ciento, no lo duden." Tonado argentino, vocabulario rioplatense (che, mirá, re bien, barbaro, copado).`

    const task = await zai.video.generations.create({
      prompt: videoPrompt,
      image_url: avatarBase64,
      quality: 'speed',
      duration: 5,
      fps: 24,
      size: '1024x576',
    })

    console.log(`Video task created: ${task.id} for landing ${landingId}`)

    // Save task ID in Config table so client can poll for it
    await db.config.upsert({
      where: { key: `video_task_${landingId}` },
      update: { value: task.id },
      create: { key: `video_task_${landingId}`, value: task.id },
    })

    return task.id
  } catch (error) {
    console.error('Video task creation error:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const { productId } = await request.json()

    if (!productId) {
      return NextResponse.json({ error: 'ProductId es requerido' }, { status: 400 })
    }

    const product = await db.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    const slug = slugify(`${product.name}-${Date.now()}`)

    // Generate AI copy (with fallback)
    const copyResult = await generateCopyWithAI(product.name, product.description, product.price)
      || buildFallbackCopy(product.name, product.description, product.price)

    // Generate AI images in parallel
    let heroImage1 = product.image1 || null
    let heroImage2 = product.image2 || null

    const [aiImg1, aiImg2] = await Promise.allSettled([
      generateImageWithAI(product.name, product.description, 'hero'),
      generateImageWithAI(product.name, product.description, 'lifestyle'),
    ])

    if (aiImg1.status === 'fulfilled' && aiImg1.value) heroImage1 = aiImg1.value
    if (aiImg2.status === 'fulfilled' && aiImg2.value) heroImage2 = aiImg2.value

    // Save landing to database (without video yet)
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
        heroImage1,
        heroImage2,
        urgencyText: copyResult.urgencyText,
        isActive: true,
      },
    })

    // Start video generation task (saves task ID in DB, client polls for result)
    const videoTaskId = await startUGCVideoTask(landing.id, product.name)

    return NextResponse.json({ success: true, landing, videoGenerating: !!videoTaskId, videoTaskId })
  } catch (error: any) {
    console.error('Error generating landing:', error)
    return NextResponse.json({ error: error.message || 'Error al generar la landing' }, { status: 500 })
  }
}
