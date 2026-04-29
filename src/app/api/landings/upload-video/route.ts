import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { writeFile, mkdir, readdir, readFile, unlink } from 'fs/promises'
import { join } from 'path'

export const maxDuration = 120

const CHUNK_DIR = '/tmp/video_uploads'
const FINAL_DIR = '/tmp/videos'
const CHUNK_SIZE = 500_000 // 500KB per chunk — safe for any proxy limit

// POST: Upload a video chunk, or finalize assembly
// Body JSON: { landingId, action, ... }
//   action="info"    → returns { totalChunks } — client asks how many chunks needed
//   action="chunk"   → { landingId, chunkIndex, totalChunks, data (base64), fileName, fileType }
//   action="done"    → { landingId, totalChunks, fileName, fileType } → assembles and saves to DB
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

    // --- ACTION: done (assemble) ---
    if (action === 'done') {
      const { totalChunks, fileName, fileType } = body
      const chunkDir = join(CHUNK_DIR, landingId)
      await mkdir(FINAL_DIR, { recursive: true })

      const ext = getExtension(fileName || 'video.mp4')
      const finalPath = join(FINAL_DIR, `${landingId}.${ext}`)

      // Assemble all chunks
      const bufferParts: Buffer[] = []
      for (let i = 0; i < totalChunks; i++) {
        const chunkPath = join(chunkDir, `chunk_${i}`)
        try {
          const chunk = await readFile(chunkPath)
          bufferParts.push(chunk)
        } catch (err) {
          console.error(`[upload-video] Missing chunk ${i} for ${landingId}`)
          return NextResponse.json({ error: `Falta el chunk ${i}` }, { status: 400 })
        }
      }

      const finalBuffer = Buffer.concat(bufferParts)
      await writeFile(finalPath, finalBuffer)

      // Clean up chunks
      try {
        const files = await readdir(chunkDir)
        for (const f of files) {
          await unlink(join(chunkDir, f))
        }
      } catch {}

      // Save URL to DB — serve via API route
      const videoUrl = `/api/landings/serve-video?landingId=${landingId}`
      await db.landingPage.update({
        where: { id: landingId },
        data: { videoUrl },
      })

      console.log(`[upload-video] Video assembled for landing ${landingId}: ${(finalBuffer.length / 1024 / 1024).toFixed(1)}MB, ${totalChunks} chunks`)
      return NextResponse.json({
        success: true,
        message: 'Video subido correctamente',
        videoSize: finalBuffer.length,
        videoUrl,
      })
    }

    return NextResponse.json({ error: 'Accion no valida. Usá "chunk" o "done"' }, { status: 400 })
  } catch (error: any) {
    console.error('[upload-video] Error:', error)
    return NextResponse.json({ error: error.message || 'Error al subir el video' }, { status: 500 })
  }
}

function getExtension(fileName: string): string {
  const match = fileName.match(/\.(mp4|webm|mov|avi|mkv)$/i)
  return match ? match[1].toLowerCase() : 'mp4'
}
