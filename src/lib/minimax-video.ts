/**
 * MiniMax / Hailuo AI Video Generation Service
 * 
 * API Docs: https://platform.minimaxi.com/document/Video-Generation
 * 
 * Uses the official MiniMax API for text-to-video and image-to-video generation.
 * Requires MINIMAX_API_KEY in environment or Config table.
 */

const MINIMAX_BASE_URL = 'https://api.minimax.chat/v1'

interface MiniMaxTaskResponse {
  base_resp: {
    status_code: number
    status_msg: string
  }
  task_id: string
}

interface MiniMaxQueryResponse {
  base_resp: {
    status_code: number
    status_msg: string
  }
  task_id: string
  file_id: string
  video_url: string
  status: 'Processing' | 'Success' | 'Fail'
}

async function getApiKey(): Promise<string> {
  // Try env first
  if (process.env.MINIMAX_API_KEY) return process.env.MINIMAX_API_KEY

  // Try Config table
  const { db } = await import('@/lib/db')
  const config = await db.config.findUnique({ where: { key: 'MINIMAX_API_KEY' } })
  if (config?.value) return config.value

  throw new Error('MINIMAX_API_KEY no configurada. Agregala en el Dashboard > Configuracion.')
}

/**
 * Create a video generation task using MiniMax/Hailuo API.
 * Supports image-to-video (I2V) with an optional reference image.
 */
export async function createVideoTask(params: {
  prompt: string
  imageUrl?: string
  model?: string
  duration?: number
}): Promise<{ taskId: string }> {
  const apiKey = await getApiKey()

  const model = params.model || 'video-01-live'
  const payload: Record<string, unknown> = {
    model,
    prompt,
  }

  // Use speed mode for faster generation
  payload.quality = 'speed'

  // If image provided, use image-to-video mode
  if (params.imageUrl) {
    payload.first_frame_image = params.imageUrl
  }

  console.log(`[MiniMax] Creating video task with model: ${model}`)

  const response = await fetch(`${MINIMAX_BASE_URL}/video/generation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`[MiniMax] API error ${response.status}:`, errorText)
    throw new Error(`MiniMax API error ${response.status}: ${errorText}`)
  }

  const data: MiniMaxTaskResponse = await response.json()

  if (data.base_resp?.status_code !== 0) {
    console.error('[MiniMax] Task creation failed:', data.base_resp)
    throw new Error(`MiniMax: ${data.base_resp?.status_msg || 'Error al crear tarea de video'}`)
  }

  console.log(`[MiniMax] Task created: ${data.task_id}`)
  return { taskId: data.task_id }
}

/**
 * Query the status of a video generation task.
 * Returns the video URL when the task is complete.
 */
export async function queryVideoTask(taskId: string): Promise<{
  status: 'processing' | 'done' | 'failed'
  videoUrl?: string
}> {
  const apiKey = await getApiKey()

  const response = await fetch(`${MINIMAX_BASE_URL}/video/query/${taskId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`[MiniMax] Query error ${response.status}:`, errorText)
    return { status: 'failed' }
  }

  const data: MiniMaxQueryResponse = await response.json()

  if (data.base_resp?.status_code !== 0) {
    console.error('[MiniMax] Query failed:', data.base_resp)
    return { status: 'failed' }
  }

  // MiniMax returns status as a string field
  const taskStatus = (data as Record<string, unknown>).status as string || ''

  if (taskStatus === 'Success' && data.video_url) {
    console.log(`[MiniMax] Task ${taskId} complete: ${data.video_url}`)
    return { status: 'done', videoUrl: data.video_url }
  }

  if (taskStatus === 'Fail') {
    console.error(`[MiniMax] Task ${taskId} failed`)
    return { status: 'failed' }
  }

  // Still processing
  return { status: 'processing' }
}
