import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createVideoTask } from '@/lib/minimax-video'

// Creates a MiniMax/Hailuo video task and returns task ID immediately.
// Client polls /api/video/status for progress until video is saved to landing.
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

    if (landing.videoUrl) {
      return NextResponse.json({ success: true, videoUrl: landing.videoUrl, alreadyDone: true })
    }

    const existingTask = await db.config.findUnique({ where: { key: `video_task_${landingId}` } })
    if (existingTask) {
      return NextResponse.json({ success: true, videoTaskId: existingTask.value, alreadyStarted: true })
    }

    const productName = landing.productName
    const productDescription = landing.solution || ''

    // Read UGC avatar image
    const fs = await import('fs')
    const path = await import('path')
    const avatarPath = path.join(process.cwd(), 'public', 'ugc-avatar.jpg')
    let videoImage: string | undefined
    try {
      const imgBuffer = fs.readFileSync(avatarPath)
      videoImage = `data:image/jpeg;base64,${imgBuffer.toString('base64')}`
    } catch {
      console.warn('[process-media] ugc-avatar.jpg not found, using text-to-video mode')
    }

    const prompt = `Video estilo UGC testimonial en espanol argentino. Una mujer joven argentina mostrando y explicando los beneficios de ${productName}. ${productDescription.split('.')[0]}. Sostiene el producto frente a la camara, lo muestra con orgullo, gira el frasco para ver las etiquetas. Iluminacion natural, estilo selfie, fondo living moderno. Expresion genuina y entusiasmada. Redes sociales style.`

    // Use MiniMax/Hailuo API
    const { taskId } = await createVideoTask({
      prompt,
      imageUrl: videoImage,
      model: 'video-01-live',
    })

    await db.config.upsert({
      where: { key: `video_task_${landingId}` },
      update: { value: taskId },
      create: { key: `video_task_${landingId}`, value: taskId },
    })

    return NextResponse.json({ success: true, videoTaskId: taskId, provider: 'minimax' })
  } catch (error: any) {
    console.error('Media processing error:', error)
    return NextResponse.json({ error: error.message || 'Error processing media' }, { status: 500 })
  }
}
