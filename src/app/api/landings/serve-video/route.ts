import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { readFile, stat } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export const maxDuration = 60

// Serve video file from /tmp/videos/ directory
export async function GET(request: NextRequest) {
  try {
    const landingId = request.nextUrl.searchParams.get('landingId')

    if (!landingId) {
      return NextResponse.json({ error: 'landingId es requerido' }, { status: 400 })
    }

    const landing = await db.landingPage.findUnique({ where: { id: landingId } })
    if (!landing) {
      return NextResponse.json({ error: 'Landing no encontrada' }, { status: 404 })
    }

    // Try common video extensions
    const extensions = ['mp4', 'webm', 'mov', 'avi', 'mkv']
    let videoPath = ''
    let found = false

    for (const ext of extensions) {
      const candidate = join('/tmp/videos', `${landingId}.${ext}`)
      if (existsSync(candidate)) {
        videoPath = candidate
        found = true
        break
      }
    }

    if (!found) {
      // If videoUrl is a base64 data URL (legacy), redirect to it
      if (landing.videoUrl && landing.videoUrl.startsWith('data:')) {
        return NextResponse.json({ videoUrl: landing.videoUrl })
      }
      return NextResponse.json({ error: 'Video no encontrado' }, { status: 404 })
    }

    const videoBuffer = await readFile(videoPath)
    const videoStat = await stat(videoPath)

    // Determine content type
    const ext = videoPath.split('.').pop()?.toLowerCase() || 'mp4'
    const contentTypes: Record<string, string> = {
      mp4: 'video/mp4',
      webm: 'video/webm',
      mov: 'video/quicktime',
      avi: 'video/x-msvideo',
      mkv: 'video/x-matroska',
    }

    return new NextResponse(videoBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentTypes[ext] || 'video/mp4',
        'Content-Length': videoStat.size.toString(),
        'Cache-Control': 'public, max-age=86400',
        'Accept-Ranges': 'bytes',
      },
    })
  } catch (error: any) {
    console.error('[serve-video] Error:', error)
    return NextResponse.json({ error: error.message || 'Error al servir el video' }, { status: 500 })
  }
}
