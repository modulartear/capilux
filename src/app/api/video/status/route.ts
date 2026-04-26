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
      select: { videoUrl: true },
    })

    if (!landing) {
      return NextResponse.json({ error: 'Landing no encontrada' }, { status: 404 })
    }

    // If video already generated, return it
    if (landing.videoUrl) {
      return NextResponse.json({ status: 'done', videoUrl: landing.videoUrl })
    }

    // Look up the task ID from Config table
    const taskConfig = await db.config.findUnique({
      where: { key: `video_task_${landingId}` },
    })

    if (!taskConfig) {
      return NextResponse.json({ status: 'not_started' })
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
        // Update landing page with the video URL
        await db.landingPage.update({
          where: { id: landingId },
          data: { videoUrl },
        })

        // Clean up task ID from Config
        await db.config.delete({
          where: { key: `video_task_${landingId}` },
        }).catch(() => {})

        return NextResponse.json({ status: 'done', videoUrl })
      }
    }

    if (result.task_status === 'FAIL') {
      // Clean up failed task
      await db.config.delete({
        where: { key: `video_task_${landingId}` },
      }).catch(() => {})

      return NextResponse.json({ status: 'failed' })
    }

    // Still processing
    return NextResponse.json({ status: 'processing' })
  } catch (error: any) {
    console.error('Video status check error:', error)
    return NextResponse.json({ status: 'error', error: error.message }, { status: 500 })
  }
}
