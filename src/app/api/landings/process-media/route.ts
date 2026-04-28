import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

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

    // Generate single image
    console.log(`[process-media] Generating image ${imageIndex} for landing ${landingId}`)
    const zai = await ZAI.create()
    const response = await zai.images.generations.create({
      prompt: prompts[imageIndex],
      size: '1024x1024',
    })

    const base64Data = response.data[0]?.base64
    if (!base64Data) {
      throw new Error('La IA no devolvio imagen')
    }

    const imageUrl = `data:image/jpeg;base64,${base64Data}`

    // Read existing images and append
    let existingImages: { url: string; label: string }[] = []
    try { existingImages = JSON.parse(landing.beforeAfterImages || '[]') } catch { existingImages = [] }

    existingImages[imageIndex] = { url: imageUrl, label: labels[imageIndex] }

    // Save to DB
    await db.landingPage.update({
      where: { id: landingId },
      data: { beforeAfterImages: JSON.stringify(existingImages) },
    })

    console.log(`[process-media] Image ${imageIndex} saved for landing ${landingId}`)
    return NextResponse.json({
      success: true,
      image: { url: imageUrl, label: labels[imageIndex] },
      imageIndex,
      totalImages: prompts.length,
    })
  } catch (error: any) {
    console.error('Image generation error:', error)
    return NextResponse.json({ error: error.message || 'Error generando imagen' }, { status: 500 })
  }
}
