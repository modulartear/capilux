import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Allow up to 60 seconds for AI image generation
export const maxDuration = 60

// Generate ONE image per request — fast, no timeout issues.
// Client calls this 3 times sequentially for before/after/after2.
export async function POST(request: NextRequest) {
  try {
    const { landingId, imageIndex } = await request.json()

    if (!landingId || imageIndex === undefined) {
      return NextResponse.json({ error: 'landingId e imageIndex son requeridos' }, { status: 400 })
    }

    const landing = await db.landingPage.findUnique({ where: { id: landingId } })
    if (!landing) {
      return NextResponse.json({ error: 'Landing no encontrada' }, { status: 404 })
    }

    const prompts = [
      `Professional "before" photo for a skincare/beauty product testimonial. A young woman showing skin imperfections, dull skin, visible pores, uneven skin tone. Natural lighting, close-up selfie angle, neutral background. Realistic amateur photo style, not studio. No text, no watermark. Product: ${landing.productName}`,
      `Professional "after 2 weeks" photo for a skincare/beauty product testimonial. The same young woman showing noticeable improvement in skin quality, more radiant, less imperfections, glowing skin. Natural lighting, close-up selfie angle, neutral background. Realistic amateur photo style showing genuine improvement. No text, no watermark. Product: ${landing.productName}`,
      `Professional "after 1 month" photo for a skincare/beauty product testimonial. The same young woman showing amazing transformation, perfect glowing skin, smooth texture, confident smile. Natural lighting, close-up selfie angle, neutral background. Realistic amateur photo style showing dramatic real results. No text, no watermark. Product: ${landing.productName}`,
    ]
    const labels = ['Antes', 'Despues de 2 semanas', 'Despues de 1 mes']

    if (imageIndex >= prompts.length) {
      return NextResponse.json({ error: 'imageIndex fuera de rango' }, { status: 400 })
    }

    // Generate single image using z-ai-generate CLI (more reliable than SDK in serverless)
    console.log(`[process-media] Generating image ${imageIndex} for landing ${landingId}`)
    
    const { execFile } = await import('child_process')
    const { writeFile, readFile, unlink } = await import('fs/promises')
    const { join } = await import('path')
    
    const tmpPath = `/tmp/img_${Date.now()}_${imageIndex}.png`
    
    // Use CLI tool to generate image
    const prompt = prompts[imageIndex]
    const truncatedPrompt = prompt.length > 200 ? prompt.substring(0, 200) : prompt
    
    await new Promise<void>((resolve, reject) => {
      const child = execFile(
        'z-ai-generate',
        ['-p', prompt, '-o', tmpPath, '-s', '1024x1024'],
        { timeout: 55000 },
        (error, stdout, stderr) => {
          if (error) {
            console.error('[process-media] CLI error:', error.message)
            console.error('[process-media] stderr:', stderr)
            reject(new Error(`Error generando imagen con IA: ${error.message}`))
            return
          }
          console.log('[process-media] CLI stdout:', stdout?.substring(0, 200))
          resolve()
        }
      )
    })

    // Read the generated image as base64
    const imageBuffer = await readFile(tmpPath)
    const base64Data = imageBuffer.toString('base64')
    
    // Clean up temp file
    try { await unlink(tmpPath) } catch {}

    if (!base64Data || base64Data.length < 100) {
      throw new Error('La IA genero una imagen vacia o invalida')
    }

    const imageUrl = `data:image/png;base64,${base64Data}`

    // Read existing images and append
    let existingImages: { url: string; label: string }[] = []
    try { existingImages = JSON.parse(landing.beforeAfterImages || '[]') } catch { existingImages = [] }

    existingImages[imageIndex] = { url: imageUrl, label: labels[imageIndex] }

    // Save to DB
    await db.landingPage.update({
      where: { id: landingId },
      data: { beforeAfterImages: JSON.stringify(existingImages) },
    })

    console.log(`[process-media] Image ${imageIndex} saved for landing ${landingId} (${base64Data.length} chars)`)
    return NextResponse.json({
      success: true,
      image: { url: imageUrl, label: labels[imageIndex] },
      imageIndex,
      totalImages: prompts.length,
    })
  } catch (error: any) {
    console.error('[process-media] Image generation error:', error)
    return NextResponse.json({ error: error.message || 'Error generando imagen' }, { status: 500 })
  }
}
