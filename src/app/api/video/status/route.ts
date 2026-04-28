import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const landingId = request.nextUrl.searchParams.get('landingId')

    if (!landingId) {
      return NextResponse.json({ error: 'landingId es requerido' }, { status: 400 })
    }

    // Check if video already exists in the landing
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
        landing: {
          headline: landing.headline,
          subheadline: landing.subheadline,
          problem: landing.problem,
          solution: landing.solution,
          benefits: landing.benefits,
          testimonials: landing.testimonials,
          faq: landing.faq,
          ctaText: landing.ctaText,
          urgencyText: landing.urgencyText,
        },
      })
    }

    // Check if background media processing is done
    const mediaDone = await db.config.findUnique({
      where: { key: `media_done_${landingId}` },
    })

    const response: any = {
      status: 'processing',
      audioUrl: landing.audioUrl || null,
      heroImage1: landing.heroImage1 || null,
      heroImage2: landing.heroImage2 || null,
    }

    // Return updated copy if AI copy has been applied (check if headline has emoji = AI generated)
    if (landing.headline && /\p{Emoji}/u.test(landing.headline)) {
      response.landing = {
        headline: landing.headline,
        subheadline: landing.subheadline,
        problem: landing.problem,
        solution: landing.solution,
        benefits: landing.benefits,
        testimonials: landing.testimonials,
        faq: landing.faq,
        ctaText: landing.ctaText,
        urgencyText: landing.urgencyText,
      }
    }

    if (mediaDone) {
      // Media images + audio done, video may still be processing
      // Look up the video task ID
      const taskConfig = await db.config.findUnique({
        where: { key: `video_task_${landingId}` },
      })

      if (!taskConfig) {
        // No video task created yet, media still in progress
        return NextResponse.json({ ...response, status: 'media_processing' })
      }

      const taskId = taskConfig.value

      // Poll the video task once
      const ZAI = (await import('z-ai-web-dev-sdk')).default
      const zai = await ZAI.create()

      const result = await zai.async.result.query(taskId)

      if (result.task_status === 'SUCCESS') {
        const videoUrl =
          result.video_result?.[0]?.url ||
          result.video_url ||
          result.url ||
          result.video

        if (videoUrl) {
          await db.landingPage.update({
            where: { id: landingId },
            data: { videoUrl },
          })

          // Clean up task configs
          await db.config.delete({ where: { key: `video_task_${landingId}` } }).catch(() => {})
          await db.config.delete({ where: { key: `media_done_${landingId}` } }).catch(() => {})

          return NextResponse.json({
            status: 'done',
            videoUrl,
            audioUrl: landing.audioUrl,
            heroImage1: landing.heroImage1,
            heroImage2: landing.heroImage2,
            landing: {
              headline: landing.headline,
              subheadline: landing.subheadline,
              problem: landing.problem,
              solution: landing.solution,
              benefits: landing.benefits,
              testimonials: landing.testimonials,
              faq: landing.faq,
              ctaText: landing.ctaText,
              urgencyText: landing.urgencyText,
            },
          })
        }
      }

      if (result.task_status === 'FAIL') {
        await db.config.delete({ where: { key: `video_task_${landingId}` } }).catch(() => {})
        await db.config.delete({ where: { key: `media_done_${landingId}` } }).catch(() => {})

        return NextResponse.json({ ...response, status: 'video_failed' })
      }

      // Video still processing
      return NextResponse.json({ ...response, status: 'video_processing' })
    }

    // Background media not done yet
    return NextResponse.json({ ...response, status: 'media_processing' })
  } catch (error: any) {
    console.error('Video status check error:', error)
    return NextResponse.json({ status: 'error', error: error.message }, { status: 500 })
  }
}
