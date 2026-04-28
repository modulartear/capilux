/**
 * AI Image Generation Service for Before/After Photo Book
 * Uses z-ai-web-dev-sdk for image generation.
 */

import ZAI from 'z-ai-web-dev-sdk'
import fs from 'fs'
import path from 'path'

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create()
  }
  return zaiInstance
}

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

/**
 * Generate a single image and save to filesystem.
 * Returns the public URL path.
 */
async function generateAndSaveImage(
  prompt: string,
  outputPath: string,
  publicPath: string
): Promise<string> {
  const zai = await getZAI()
  console.log(`[ImageGen] Generating: ${prompt.substring(0, 80)}...`)

  const response = await zai.images.generations.create({
    prompt,
    size: '1024x1024',
  })

  const base64Data = response.data[0]?.base64
  if (!base64Data) {
    throw new Error('No se genero la imagen')
  }

  // Save to filesystem
  ensureDir(path.dirname(outputPath))
  const buffer = Buffer.from(base64Data, 'base64')
  fs.writeFileSync(outputPath, buffer)

  console.log(`[ImageGen] Saved: ${outputPath}`)
  return publicPath
}

/**
 * Generate 3 before/after images for a product.
 * Returns JSON array of { url, label } objects.
 */
export async function generateBeforeAfterImages(params: {
  productName: string
  productDescription: string
  landingId: string
}): Promise<string> {
  const { productName, productDescription, landingId } = params

  const dir = path.join(process.cwd(), 'public', 'generated')
  ensureDir(dir)

  const prompt1 = `Professional "before" photo for a skincare/beauty product testimonial. A person showing skin imperfections, dull skin, visible pores, uneven skin tone. Natural lighting, close-up selfie angle, neutral background. Realistic amateur photo style, not studio. No text, no watermark. Product: ${productName}`

  const prompt2 = `Professional "after 2 weeks" photo for a skincare/beauty product testimonial. The same person showing noticeable improvement in skin quality, more radiant, less imperfections, glowing skin. Natural lighting, close-up selfie angle, neutral background. Realistic amateur photo style showing genuine improvement. No text, no watermark. Product: ${productName}`

  const prompt3 = `Professional "after 1 month" photo for a skincare/beauty product testimonial. The same person showing amazing transformation, perfect glowing skin, smooth texture, confident smile. Natural lighting, close-up selfie angle, neutral background. Realistic amateur photo style showing dramatic real results. No text, no watermark. Product: ${productName}`

  const images: { url: string; label: string }[] = []

  try {
    const url1 = await generateAndSaveImage(
      prompt1,
      path.join(dir, `${landingId}_before.jpg`),
      `/generated/${landingId}_before.jpg`
    )
    images.push({ url: url1, label: 'Antes' })
  } catch (err) {
    console.error('[ImageGen] Failed to generate before image:', err)
  }

  try {
    const url2 = await generateAndSaveImage(
      prompt2,
      path.join(dir, `${landingId}_after1.jpg`),
      `/generated/${landingId}_after1.jpg`
    )
    images.push({ url: url2, label: 'Despues de 2 semanas' })
  } catch (err) {
    console.error('[ImageGen] Failed to generate after1 image:', err)
  }

  try {
    const url3 = await generateAndSaveImage(
      prompt3,
      path.join(dir, `${landingId}_after2.jpg`),
      `/generated/${landingId}_after2.jpg`
    )
    images.push({ url: url3, label: 'Despues de 1 mes' })
  } catch (err) {
    console.error('[ImageGen] Failed to generate after2 image:', err)
  }

  return JSON.stringify(images)
}
