import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Returns the current state of images/media for a landing.
// Images are now generated synchronously, so this is mainly for checking.
export async function GET(request: NextRequest) {
  try {
    const landingId = request.nextUrl.searchParams.get('landingId')

    if (!landingId) {
      return NextResponse.json({ error: 'landingId es requerido' }, { status: 400 })
    }

    const landing = await db.landingPage.findUnique({
      where: { id: landingId },
    })

    if (!landing) {
      return NextResponse.json({ error: 'Landing no encontrada' }, { status: 404 })
    }

    return NextResponse.json({
      status: landing.beforeAfterImages ? 'done' : 'no_images',
      beforeAfterImages: landing.beforeAfterImages || null,
      heroImage1: landing.heroImage1 || null,
      heroImage2: landing.heroImage2 || null,
    })
  } catch (error: any) {
    console.error('Status check error:', error)
    return NextResponse.json({ status: 'error', error: error.message }, { status: 500 })
  }
}
