import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { writeFile, mkdir, readdir, readFile, unlink, rm } from 'fs/promises'
import { join } from 'path'

export const maxDuration = 120

const CHUNK_DIR = '/tmp/video_uploads'

// POST: Upload a video in chunks, then assemble and save as base64 to DB
//   action="chunk"   → { landingId, chunkIndex, totalChunks, data (base64), fileName, fileType }
//   action="done"    → { landingId, totalChunks, fileName, fileType } → assembles chunks, saves base64 to DB
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { landingId, action } = body

    if (!landingId) {
      return NextResponse.json({ error: 'landingId es requerido' }, { status: 400 })
    }

    const landing = await db.landingPage.findUnique({ where: { id: landingId } })
    if (!landing) {
      return NextResponse.json({ error: 'Landing no encontrada' }, { status: 404 })
    }

    // --- ACTION: chunk ---
    if (action === 'chunk') {
      const { chunkIndex, totalChunks, data, fileName, fileType } = body
      if (data === undefined || chunkIndex === undefined) {
        return NextResponse.json({ error: 'Faltan datos del chunk' }, { status: 400 })
      }

      const chunkDir = join(CHUNK_DIR, landingId)
      await mkdir(chunkDir, { recursive: true })
      await writeFile(join(chunkDir, `chunk_${chunkIndex}`), data, 'base64')

      return NextResponse.json({ success: true, chunkIndex, totalChunks })
    }

    // --- ACTION: done (assemble chunks into base64, save to DB) ---
    if (action === 'done') {
      const { totalChunks, fileName, fileType } = body
      const chunkDir = join(CHUNK_DIR, landingId)

      // Assemble all chunks into one Buffer
      const bufferParts: Buffer[] = []
      for (let i = 0; i < totalChunks; i++) {
        const chunkPath = join(chunkDir, `chunk_${i}`)
        try {
          const chunk = await readFile(chunkPath)
          bufferParts.push(chunk)
        } catch (err) {
          console.error(`[upload-video] Missing chunk ${i} for ${landingId}`)
          // Clean up and abort
          try { await rm(chunkDir, { recursive: true, force: true }) } catch {}
          return NextResponse.json({ error: `Falta el chunk ${i}. Volvé a subir el video.` }, { status: 400 })
        }
      }

      const finalBuffer = Buffer.concat(bufferParts)
      const base64 = finalBuffer.toString('base64')
      const mimeType = fileType || 'video/mp4'
      const videoDataUrl = `data:${mimeType};base64,${base64}`

      // Clean up chunks from /tmp
      try { await rm(chunkDir, { recursive: true, force: true }) } catch {}

      // Save base64 data URL to DB
      await db.landingPage.update({
        where: { id: landingId },
        data: { videoUrl: videoDataUrl },
      })

      console.log(`[upload-video] Video saved to DB for landing ${landingId}: ${(finalBuffer.length / 1024 / 1024).toFixed(1)}MB, ${totalChunks} chunks`)
      return NextResponse.json({
        success: true,
        message: 'Video subido correctamente',
        videoSize: finalBuffer.length,
        videoUrl: videoDataUrl,
      })
    }

    return NextResponse.json({ error: 'Accion no valida. Usá "chunk" o "done"' }, { status: 400 })
  } catch (error: any) {
    console.error('[upload-video] Error:', error)
    return NextResponse.json({ error: error.message || 'Error al subir el video' }, { status: 500 })
  }
}
