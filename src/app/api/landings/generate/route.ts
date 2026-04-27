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
    problem: `Todos los dias, millones de personas luchan con problemas de salud que afectan su calidad de vida. La fatiga constante, la falta de energia y el malestar general te impiden disfrutar plenamente de cada momento. Sentis que nada funciona y que siempre estas atrasado con sus metas.`,
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

// === BACKGROUND: generates images, video + TTS after landing is created ===
async function processLandingMedia(landingId: string, productName: string, productImage: string | null, productDescription: string) {
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()
    const fs = await import('fs')
    const path = await import('path')

    // 1) Generate AI images + TTS in parallel
    const [aiImg1, aiImg2, ttsResult] = await Promise.allSettled([
      generateImageWithAI(productName, productDescription, 'hero'),
      generateImageWithAI(productName, productDescription, 'lifestyle'),
      (async () => {
        try {
          const ttsText = `Hola che! Soy Mati y les quiero contar mi experiencia con ${productName}. Desde que lo empece a usar note un cambio barbaro en mi dia a dia. ${productDescription.split('.')[0]}. Lo uso hace dos meses y te juro que no puedo mas sin el. Lo recomiendo al cien por ciento, no lo duden, es re copado.`.slice(0, 1024)
          const audioResponse = await zai.audio.tts.create({
            input: ttsText,
            voice: 'chuichui',
            speed: 1.0,
            response_format: 'wav',
            stream: false,
          })
          const audioBuffer = Buffer.from(new Uint8Array(await audioResponse.arrayBuffer()))
          return `data:audio/wav;base64,${audioBuffer.toString('base64')}`
        } catch (e) {
          console.error('TTS generation failed:', e)
          return null
        }
      })(),
    ])

    const heroImage1 = (aiImg1.status === 'fulfilled' && aiImg1.value) ? aiImg1.value : productImage
    const heroImage2 = (aiImg2.status === 'fulfilled' && aiImg2.value) ? aiImg2.value : null
    const audioBase64 = (ttsResult.status === 'fulfilled' && ttsResult.value) ? ttsResult.value : null

    // Update landing with generated images + audio
    const updateData: any = {}
    if (heroImage1) updateData.heroImage1 = heroImage1
    if (heroImage2) updateData.heroImage2 = heroImage2
    if (audioBase64) updateData.audioUrl = audioBase64

    if (Object.keys(updateData).length > 0) {
      await db.landingPage.update({ where: { id: landingId }, data: updateData })
      console.log(`Landing ${landingId} updated with images + audio`)
    }

    // 2) Start video generation task (uses product image or generated hero image)
    let videoImage: string | undefined
    const imgForVideo = heroImage1 || productImage
    if (imgForVideo) {
      if (imgForVideo.startsWith('data:')) {
        videoImage = imgForVideo
      } else {
        try {
          const imgRes = await fetch(imgForVideo)
          if (imgRes.ok) {
            const imgBuf = Buffer.from(await imgRes.arrayBuffer())
            videoImage = `data:image/jpeg;base64,${imgBuf.toString('base64')}`
          }
        } catch {
          videoImage = imgForVideo
        }
      }
    }
    if (!videoImage) {
      const avatarPath = path.join(process.cwd(), 'public', 'ugc-avatar.jpg')
      try {
        const imgBuffer = fs.readFileSync(avatarPath)
        videoImage = `data:image/jpeg;base64,${imgBuffer.toString('base64')}`
      } catch {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
        videoImage = `${siteUrl}/ugc-avatar.jpg`
      }
    }

    const videoPrompt = `Video estilo UGC testimonial en español argentino. Una mujer joven argentina mostrando y explicando el producto ${productName}. Sostiene el producto frente a la camara, lo muestra de cerca con orgullo, gira el frasco para ver las etiquetas. Iluminacion natural, estilo selfie, fondo living moderno. Expresion genuina y entusiasmada. Redes sociales style.`

    const task = await zai.video.generations.create({
      prompt: videoPrompt,
      image_url: videoImage,
      quality: 'speed',
      duration: 5,
      fps: 24,
      size: '1024x576',
    })
    console.log(`Video task created: ${task.id} for landing ${landingId}`)

    await db.config.upsert({
      where: { key: `video_task_${landingId}` },
      update: { value: task.id },
      create: { key: `video_task_${landingId}`, value: task.id },
    })

    // Mark landing as generating video so client knows to poll
    await db.config.upsert({
      where: { key: `media_done_${landingId}` },
      update: { value: 'true' },
      create: { key: `media_done_${landingId}`, value: 'true' },
    })

  } catch (error) {
    console.error('Background media processing error:', error)
    // Still mark as done so client stops waiting for initial media
    await db.config.upsert({
      where: { key: `media_done_${landingId}` },
      update: { value: 'true' },
      create: { key: `media_done_${landingId}`, value: 'true' },
    }).catch(() => {})
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

    // Use fallback copy immediately (fast, no API call)
    const copyResult = buildFallbackCopy(product.name, product.description, product.price)

    // Create landing immediately with fallback copy + existing product images
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
        heroImage1: product.image1 || null,
        heroImage2: product.image2 || null,
        urgencyText: copyResult.urgencyText,
        isActive: true,
      },
    })

    // Return immediately — client gets the landing page URL right away
    // Background: generate AI copy, images, TTS, and video
    processLandingMedia(landing.id, product.name, product.image1, product.description).catch(() => {})

    // Also generate AI copy in background and update if better
    generateCopyWithAI(product.name, product.description, product.price)
      .then(async (aiCopy) => {
        if (aiCopy) {
          await db.landingPage.update({
            where: { id: landing.id },
            data: {
              headline: aiCopy.headline,
              subheadline: aiCopy.subheadline,
              problem: aiCopy.problem,
              solution: aiCopy.solution,
              benefits: aiCopy.benefits,
              testimonials: aiCopy.testimonials,
              faq: aiCopy.faq,
              ctaText: aiCopy.ctaText,
              urgencyText: aiCopy.urgencyText,
            },
          })
          console.log(`AI copy updated for landing ${landing.id}`)
        }
      })
      .catch(() => {})

    return NextResponse.json({
      success: true,
      landing,
      mediaGenerating: true,
      slug: landing.slug,
    })
  } catch (error: any) {
    console.error('Error generating landing:', error)
    return NextResponse.json({ error: error.message || 'Error al generar la landing' }, { status: 500 })
  }
}
