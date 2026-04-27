import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const landings = await db.landingPage.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: { name: true, price: true, image1: true },
        },
      },
    })
    return NextResponse.json(landings)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
