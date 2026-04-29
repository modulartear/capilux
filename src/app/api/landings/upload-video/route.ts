import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Allow up to 60 seconds for video upload + DB save
export const maxDuration = 60

// Upload a video file from the user's PC and save as base64 in videoUrl field
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const landingId = formData.get('landingId') as string
    const videoFile = formData.get('video') as File | null

    if (!landingId) {
      return NextResponse.json({ error: 'landingId es requerido' }, { status: 400 })
    }

    if (!videoFile) {
      return NextResponse.json({ error: 'No se envio ningun archivo de video' }, { status: 400 })
    }

    // Validate file type
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
    if (!validTypes.includes(videoFile.type) && !videoFile.name.match(/\.(mp4|webm|mov|avi)$/i)) {
      return NextResponse.json({ error: 'Formato no soportado. Usá MP4, WebM, MOV o AVI' }, { status: 400 })
    }

    // Limit to 50MB
    const maxSize = 50 * 1024 * 1024
    if (videoFile.size > maxSize) {
      return NextResponse.json({ error: 'El video es muy grande. Maximo 50MB' }, { status: 400 })
    }

    const landing = await db.landingPage.findUnique({ where: { id: landingId } })
    if (!landing) {
      return NextResponse.json({ error: 'Landing no encontrada' }, { status: 404 })
    }

    // Convert file to base64 data URL
    const arrayBuffer = await videoFile.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const videoDataUrl = `data:${videoFile.type};base64,${base64}`

    // Save to DB
    await db.landingPage.update({
      where: { id: landingId },
      data: { videoUrl: videoDataUrl },
    })

    console.log(`[upload-video] Video saved for landing ${landingId} (${(videoFile.size / 1024 / 1024).toFixed(1)}MB)`)
    return NextResponse.json({
      success: true,
      message: 'Video subido correctamente',
      videoSize: videoFile.size,
      videoType: videoFile.type,
    })
  } catch (error: any) {
    console.error('[upload-video] Error:', error)
    return NextResponse.json({ error: error.message || 'Error al subir el video' }, { status: 500 })
  }
}
