/**
 * AI Image Generation Service for Before/After Photo Book
 * Uses z-ai-web-dev-sdk for image generation.
 * Returns base64 data URLs to store in DB directly (no filesystem needed).
 */

import ZAI from 'z-ai-web-dev-sdk'

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create()
  }
  return zaiInstance
}

/**
 * Generate a single image and return as base64 data URL.
 */
async function generateImage(prompt: string): Promise<string | null> {
  try {
    const zai = await getZAI()
    console.log(`[ImageGen] Generating: ${prompt.substring(0, 80)}...`)

    const response = await zai.images.generations.create({
      prompt,
      size: '1024x1024',
    })

    const base64Data = response.data[0]?.base64
    if (!base64Data) {
      console.error('[ImageGen] No base64 in response')
      return null
    }

    console.log(`[ImageGen] Generated successfully (${base64Data.length} chars)`)
    return `data:image/jpeg;base64,${base64Data}`
  } catch (err: any) {
    console.error('[ImageGen] Error:', err.message || err)
    return null
  }
}

/**
 * Generate 3 before/after images for a product.
 * Returns JSON array of { url (base64 data URL), label } objects.
 */
export async function generateBeforeAfterImages(params: {
  productName: string
  productDescription: string
  landingId: string
}): Promise<string> {
  const { productName } = params

  const prompt1 = `Professional "before" photo for a skincare/beauty product testimonial. A woman showing skin imperfections, dull skin, visible pores, uneven skin tone. Natural lighting, close-up selfie angle, neutral background. Realistic amateur photo style, not studio. No text, no watermark. Product: ${productName}`

  const prompt2 = `Professional "after 2 weeks" photo for a skincare/beauty product testimonial. The same woman showing noticeable improvement in skin quality, more radiant, less imperfections, glowing skin. Natural lighting, close-up selfie angle, neutral background. Realistic amateur photo style showing genuine improvement. No text, no watermark. Product: ${productName}`

  const prompt3 = `Professional "after 1 month" photo for a skincare/beauty product testimonial. The same woman showing amazing transformation, perfect glowing skin, smooth texture, confident smile. Natural lighting, close-up selfie angle, neutral background. Realistic amateur photo style showing dramatic real results. No text, no watermark. Product: ${productName}`

  const images: { url: string; label: string }[] = []

  const url1 = await generateImage(prompt1)
  if (url1) images.push({ url: url1, label: 'Antes' })

  const url2 = await generateImage(prompt2)
  if (url2) images.push({ url: url2, label: 'Despues de 2 semanas' })

  const url3 = await generateImage(prompt3)
  if (url3) images.push({ url: url3, label: 'Despues de 1 mes' })

  return JSON.stringify(images)
}
