import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Simple & fast: creates video with avatar, polls until done, saves to landing.
// Called from Dashboard after landing is created. Returns when video is ready.
export async function POST(request: NextRequest) {
  try {
    const { landingId } = await request.json()

    if (!landingId) {
      return NextResponse.json({ error: 'landingId es requerido' }, { status: 400 })
    }

    const landing = await db.landingPage.findUnique({ where: { id: landingId } })
    if (!landing) {
      return NextResponse.json({ error: 'Landing no encontrada' }, { status: 404 })
    }

    // Idempotent: skip if video already saved
    if (landing.videoUrl) {
      return NextResponse.json({ success: true, videoUrl: landing.videoUrl, alreadyDone: true })
    }

    const productName = landing.productName
    const productDescription = landing.description || ''

    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()

    // Read avatar
    const fs = await import('fs')
    const path = await import('path')
    const avatarPath = path.join(process.cwd(), 'public', 'ugc-avatar.jpg')
    const imgBuffer = fs.readFileSync(avatarPath)
    const videoImage = `data:image/jpeg;base64,${imgBuffer.toString('base64')}`

    // Create video task
    const prompt = `Video estilo UGC testimonial en español argentino. Una mujer joven argentina mostrando y explicando los beneficios del producto ${productName}. ${productDescription.split('.')[0]}. Sostiene el producto frente a la camara, lo muestra con orgullo, gira el frasco para ver las etiquetas. Iluminacion natural, estilo selfie, fondo living moderno. Expresion genuina y entusiasmada. Redes sociales style.`

    const task = await zai.video.generations.create({
      prompt,
      image_url: videoImage,
      quality: 'speed',
      duration: 5,
      size: '1024x576',
    })
    console.log(`Video task created: ${task.id} for landing ${landingId}`)

    // Poll until done (max 3 min)
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 3000))
      const result = await zai.async.result.query(task.id)

      if (result.task_status === 'SUCCESS') {
        const videoUrl = result.video_result?.[0]?.url
        if (videoUrl) {
          // Save video URL to landing — done!
          await db.landingPage.update({
            where: { id: landingId },
            data: { videoUrl },
          })
          console.log(`Video saved to landing ${landingId}: ${videoUrl}`)
          return NextResponse.json({ success: true, videoUrl })
        }
      }

      if (result.task_status === 'FAIL') {
        console.error(`Video task failed for landing ${landingId}`)
        return NextResponse.json({ error: 'Video generation failed' }, { status: 500 })
      }
    }

    return NextResponse.json({ error: 'Video timeout' }, { status: 504 })
  } catch (error: any) {
    console.error('Media processing error:', error)
    return NextResponse.json({ error: error.message || 'Error processing media' }, { status: 500 })
  }
}
