import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// 1) Creates video task immediately (saved to DB)
// 2) Returns video task ID so client can start polling
// 3) Images/TTS/copy continue in background and update landing
export async function POST(request: NextRequest) {
  try {
    const { landingId } = await request.json()

    if (!landingId) {
      return NextResponse.json({ error: 'landingId es requerido' }, { status: 400 })
    }

    const landing = await db.landingPage.findUnique({
      where: { id: landingId },
    })

    if (!landing) {
      return NextResponse.json({ error: 'Landing no encontrada' }, { status: 404 })
    }

    // Idempotent: skip if video already exists or task already created
    if (landing.videoUrl) {
      return NextResponse.json({ success: true, alreadyDone: true })
    }
    const existingTask = await db.config.findUnique({ where: { key: `video_task_${landingId}` } })
    if (existingTask) {
      return NextResponse.json({ success: true, alreadyProcessing: true, videoTaskId: existingTask.value })
    }

    const productName = landing.productName
    const productDescription = landing.description || ''
    const productImage = landing.heroImage1

    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()

    // === STEP 1: Create video task FIRST (fast, ~3s) ===
    let videoImage: string | undefined
    if (productImage) {
      if (productImage.startsWith('data:')) {
        videoImage = productImage
      } else {
        try {
          const imgRes = await fetch(productImage)
          if (imgRes.ok) {
            const imgBuf = Buffer.from(await imgRes.arrayBuffer())
            videoImage = `data:image/jpeg;base64,${imgBuf.toString('base64')}`
          }
        } catch {
          videoImage = productImage
        }
      }
    }
    if (!videoImage) {
      try {
        const fs = await import('fs')
        const path = await import('path')
        const avatarPath = path.join(process.cwd(), 'public', 'ugc-avatar.jpg')
        const imgBuffer = fs.readFileSync(avatarPath)
        videoImage = `data:image/jpeg;base64,${imgBuffer.toString('base64')}`
      } catch {
        videoImage = undefined
      }
    }

    const videoPrompt = `Video estilo UGC testimonial en español argentino. Una mujer joven argentina mostrando y explicando el producto ${productName}. Sostiene el producto frente a la camara, lo muestra de cerca con orgullo, gira el frasco para ver las etiquetas. Iluminacion natural, estilo selfie, fondo living moderno. Expresion genuina y entusiasmada. Redes sociales style.`

    const videoPayload: any = {
      prompt: videoPrompt,
      quality: 'speed',
      duration: 5,
      size: '1024x576',
    }
    if (videoImage) videoPayload.image_url = videoImage

    const task = await zai.video.generations.create(videoPayload)
    console.log(`Video task created: ${task.id} for landing ${landingId}`)

    // Save video task ID to DB immediately
    await db.config.upsert({
      where: { key: `video_task_${landingId}` },
      update: { value: task.id },
      create: { key: `video_task_${landingId}`, value: task.id },
    })

    // === STEP 2: Return immediately with video task ID ===
    // Client can now poll /api/video/status while images/TTS/copy generate below

    // Fire images + TTS + copy in background (don't await)
    Promise.allSettled([
      // Hero image
      (async (): Promise<string | null> => {
        try {
          const result = await zai.images.generations.create({
            prompt: `Professional product photography of ${productName}. A person happily using ${productDescription.split('.')[0] || productName}. Bright clean background, lifestyle wellness photo, high quality commercial photography, warm lighting, premium feel. No text overlays.`,
            size: '1344x768',
          })
          return result.data?.[0]?.base64 ? `data:image/png;base64,${result.data[0].base64}` : null
        } catch (e) { console.error('Hero image failed:', e); return null }
      })(),

      // Lifestyle image
      (async (): Promise<string | null> => {
        try {
          const result = await zai.images.generations.create({
            prompt: `Lifestyle product photo of ${productName}. Person showing the results of using ${productName}, confident and happy. Modern clean setting, natural light, aspirational wellness lifestyle image. Commercial quality photography. No text overlays.`,
            size: '1344x768',
          })
          return result.data?.[0]?.base64 ? `data:image/png;base64,${result.data[0].base64}` : null
        } catch (e) { console.error('Lifestyle image failed:', e); return null }
      })(),

      // TTS audio
      (async (): Promise<string | null> => {
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
        } catch (e) { console.error('TTS failed:', e); return null }
      })(),

      // AI copy
      (async () => {
        try {
          const priceStr = landing.product?.price
            ? `$${landing.product.price.toLocaleString('es-AR', { minimumFractionDigits: 0 })}`
            : ''
          const completion = await zai.chat.completions.create({
            messages: [
              { role: 'system', content: `Eres un experto copywriter de landing pages de alto conversion para productos de salud y bienestar en Argentina. Generas contenido persuasivo en espanol. Siempre respondes en formato JSON valido, sin texto adicional.` },
              { role: 'user', content: `Genera el contenido de una landing page persuasiva para este producto:\n\nNombre: ${productName}\nDescripcion: ${productDescription}\nPrecio: ${priceStr}\n\nResponde SOLAMENTE con un JSON valido con esta estructura exacta:\n{"headline": "Titulo principal persuasivo (max 8 palabras, con emoji al inicio)", "subheadline": "Subtitulo que refuerza la promesa (max 15 palabras)", "problem": "Descripcion del problema (3-4 oraciones emocionales)", "solution": "Como este producto resuelve el problema (3-4 oraciones)", "benefits": "JSON array de 6 beneficios con title y description", "testimonials": "JSON array de 3 testimonios con name, location y text", "faq": "JSON array de 4 preguntas con question y answer", "ctaText": "Texto del boton CTA (max 5 palabras)", "urgencyText": "Texto de urgencia (1 linea)"}\n\nTono: emocional, confiable, cercano. No uses lenguaje agresivo.` },
            ],
            temperature: 0.8,
          })
          const content = completion.choices[0]?.message?.content || ''
          const jsonMatch = content.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0])
            if (parsed.headline && parsed.subheadline && parsed.problem && parsed.solution) return parsed
          }
          return null
        } catch (e) { console.error('AI copy failed:', e); return null }
      })(),
    ]).then(async ([aiImg1, aiImg2, ttsResult, aiCopy]) => {
      const updateData: any = {}
      if (aiImg1.status === 'fulfilled' && aiImg1.value) updateData.heroImage1 = aiImg1.value
      if (aiImg2.status === 'fulfilled' && aiImg2.value) updateData.heroImage2 = aiImg2.value
      if (ttsResult.status === 'fulfilled' && ttsResult.value) updateData.audioUrl = ttsResult.value
      if (aiCopy.status === 'fulfilled' && aiCopy.value) {
        Object.assign(updateData, {
          headline: aiCopy.value.headline,
          subheadline: aiCopy.value.subheadline,
          problem: aiCopy.value.problem,
          solution: aiCopy.value.solution,
          benefits: aiCopy.value.benefits,
          testimonials: aiCopy.value.testimonials,
          faq: aiCopy.value.faq,
          ctaText: aiCopy.value.ctaText,
          urgencyText: aiCopy.value.urgencyText,
        })
      }
      if (Object.keys(updateData).length > 0) {
        await db.landingPage.update({ where: { id: landingId }, data: updateData }).catch(() => {})
        console.log(`Landing ${landingId} updated with media in background`)
      }
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      videoTaskId: task.id,
    })
  } catch (error: any) {
    console.error('Media processing error:', error)
    return NextResponse.json({ error: error.message || 'Error processing media' }, { status: 500 })
  }
}
