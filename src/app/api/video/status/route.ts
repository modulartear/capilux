import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { queryVideoTask } from '@/lib/minimax-video'

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

    // If video already generated, return full landing data
    if (landing.videoUrl) {
      return NextResponse.json({
        status: 'done',
        videoUrl: landing.videoUrl,
        audioUrl: landing.audioUrl,
        heroImage1: landing.heroImage1,
        heroImage2: landing.heroImage2,
        headline: landing.headline,
        subheadline: landing.subheadline,
        problem: landing.problem,
        solution: landing.solution,
        benefits: landing.benefits,
        testimonials: landing.testimonials,
        faq: landing.faq,
        ctaText: landing.ctaText,
        urgencyText: landing.urgencyText,
      })
    }

    // Check for video task ID
    const taskConfig = await db.config.findUnique({
      where: { key: `video_task_${landingId}` },
    })

    if (!taskConfig) {
      // No video task — tell client to show idle state with generate button
      return NextResponse.json({
        status: 'no_task',
        audioUrl: landing.audioUrl || null,
        heroImage1: landing.heroImage1 || null,
        heroImage2: landing.heroImage2 || null,
        headline: landing.headline,
        subheadline: landing.subheadline,
        problem: landing.problem,
        solution: landing.solution,
        benefits: landing.benefits,
        testimonials: landing.testimonials,
        faq: landing.faq,
        ctaText: landing.ctaText,
        urgencyText: landing.urgencyText,
      })
    }

    const taskId = taskConfig.value

    // Poll the MiniMax video task
    const result = await queryVideoTask(taskId)

    if (result.status === 'done' && result.videoUrl) {
      await db.landingPage.update({
        where: { id: landingId },
        data: { videoUrl: result.videoUrl },
      })

      // Clean up task ID
      await db.config.delete({ where: { key: `video_task_${landingId}` } }).catch(() => {})

      return NextResponse.json({
        status: 'done',
        videoUrl: result.videoUrl,
        audioUrl: landing.audioUrl,
        heroImage1: landing.heroImage1,
        heroImage2: landing.heroImage2,
        headline: landing.headline,
        subheadline: landing.subheadline,
        problem: landing.problem,
        solution: landing.solution,
        benefits: landing.benefits,
        testimonials: landing.testimonials,
        faq: landing.faq,
        ctaText: landing.ctaText,
        urgencyText: landing.urgencyText,
      })
    }

    if (result.status === 'failed') {
      await db.config.delete({ where: { key: `video_task_${landingId}` } }).catch(() => {})
      return NextResponse.json({
        status: 'video_failed',
        audioUrl: landing.audioUrl,
        heroImage1: landing.heroImage1,
        heroImage2: landing.heroImage2,
      })
    }

    // Video still processing
    return NextResponse.json({
      status: 'video_processing',
      audioUrl: landing.audioUrl || null,
      heroImage1: landing.heroImage1 || null,
      heroImage2: landing.heroImage2 || null,
      headline: landing.headline,
      subheadline: landing.subheadline,
      problem: landing.problem,
      solution: landing.solution,
      benefits: landing.benefits,
      testimonials: landing.testimonials,
      faq: landing.faq,
      ctaText: landing.ctaText,
      urgencyText: landing.urgencyText,
    })
  } catch (error: any) {
    console.error('Video status check error:', error)
    return NextResponse.json({ status: 'error', error: error.message }, { status: 500 })
  }
}
