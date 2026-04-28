import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateBeforeAfterImages } from '@/lib/generate-images'

// Generates before/after AI images and saves them to the landing.
// Runs synchronously — images generate fast (~5-10s each).
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

    // Skip if images already generated (must have at least 1 image)
    let existingImages: { url: string; label: string }[] = []
    try { existingImages = JSON.parse(landing.beforeAfterImages || '[]') } catch { existingImages = [] }
    if (existingImages.length > 0) {
      return NextResponse.json({
        success: true,
        images: landing.beforeAfterImages,
        alreadyDone: true,
      })
    }

    // Generate 3 before/after images
    const imagesJson = await generateBeforeAfterImages({
      productName: landing.productName,
      productDescription: landing.solution || '',
      landingId: landing.id,
    })

    // Save to landing
    await db.landingPage.update({
      where: { id: landingId },
      data: { beforeAfterImages: imagesJson },
    })

    return NextResponse.json({
      success: true,
      images: imagesJson,
    })
  } catch (error: any) {
    console.error('Image generation error:', error)
    return NextResponse.json({ error: error.message || 'Error generando imagenes' }, { status: 500 })
  }
}
