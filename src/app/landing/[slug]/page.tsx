'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Star,
  ChevronDown,
  Shield,
  Truck,
  RotateCcw,
  CreditCard,
  CheckCircle2,
  ShoppingCart,
  Heart,
  Zap,
  Clock,
  ArrowRight,
  Loader2,
  Volume2,
} from 'lucide-react'

interface Testimonial {
  name: string
  location: string
  text: string
}

interface Benefit {
  title: string
  description: string
}

interface FAQItem {
  question: string
  answer: string
}

interface LandingData {
  id: string
  slug: string
  productName: string
  headline: string
  subheadline: string
  problem: string
  solution: string
  benefits: string
  testimonials: string
  faq: string
  ctaText: string
  ctaLink: string
  heroImage1: string | null
  heroImage2: string | null
  videoUrl: string | null
  audioUrl: string | null
  urgencyText: string
  product?: {
    price: number
    name: string
  } | null
}

const benefitIcons = [Zap, Heart, Shield, CheckCircle2, Clock, Star]

export default function LandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const [data, setData] = useState<LandingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [benefits, setBenefits] = useState<Benefit[]>([])
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [faq, setFaq] = useState<FAQItem[]>([])
  const [videoStatus, setVideoStatus] = useState<'idle' | 'processing' | 'done' | 'failed'>('idle')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [generatingVideo, setGeneratingVideo] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollCountRef = useRef(0)
  const dataRef = useRef<LandingData | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const checkVideoStatusRef = useRef<(landingId: string) => Promise<void>>()

  // Keep dataRef in sync
  useEffect(() => { dataRef.current = data }, [data])

  // Check video status via API — also picks up new images, audio, and AI copy
  const checkVideoStatus = useCallback(async (landingId: string) => {
    try {
      const res = await fetch(`/api/video/status?landingId=${landingId}`)
      const result = await res.json()

      // Update audio URL when available
      if (result.audioUrl) setAudioUrl(result.audioUrl)

      // Update images when they become available
      if (result.heroImage1 || result.heroImage2) {
        setData(prev => prev ? {
          ...prev,
          ...(result.heroImage1 ? { heroImage1: result.heroImage1 } : {}),
          ...(result.heroImage2 ? { heroImage2: result.heroImage2 } : {}),
        } : prev)
      }

      // Update AI-generated copy when ready (returned as flat fields)
      if (result.headline && result.benefits) {
        setData(prev => prev ? {
          ...prev,
          headline: result.headline,
          subheadline: result.subheadline,
          problem: result.problem,
          solution: result.solution,
          benefits: result.benefits,
          testimonials: result.testimonials,
          faq: result.faq,
          ctaText: result.ctaText,
          urgencyText: result.urgencyText,
        } : prev)
        try { setBenefits(JSON.parse(result.benefits)) } catch {}
        try { setTestimonials(JSON.parse(result.testimonials)) } catch {}
        try { setFaq(JSON.parse(result.faq)) } catch {}
      }

      if (result.status === 'done' && result.videoUrl) {
        setData(prev => prev ? { ...prev, videoUrl: result.videoUrl } : prev)
        setVideoStatus('done')
        if (pollRef.current) clearInterval(pollRef.current)
        return
      }

      if (result.status === 'failed' || result.status === 'video_failed' || result.status === 'no_task') {
        setVideoStatus('idle')
        if (pollRef.current) clearInterval(pollRef.current)
        return
      }

      // Still processing media or video
      setVideoStatus('processing')

      // Stop polling after 5 minutes (100 polls x 3s = 300s)
      pollCountRef.current += 1
      if (pollCountRef.current >= 100) {
        if (pollRef.current) clearInterval(pollRef.current)
        setVideoStatus('failed')
      }
    } catch {
      // Silently ignore poll errors
    }
  }, [])

  // Keep checkVideoStatus ref in sync
  useEffect(() => { checkVideoStatusRef.current = checkVideoStatus }, [checkVideoStatus])

  const handleGenerateVideo = useCallback(async () => {
    if (!dataRef.current?.id || generatingVideo) return
    setGeneratingVideo(true)
    setVideoStatus('processing')
    try {
      const res = await fetch('/api/landings/process-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ landingId: dataRef.current!.id }),
      })
      const mediaData = await res.json()
      if (mediaData.videoUrl) {
        setData(prev => prev ? { ...prev, videoUrl: mediaData.videoUrl } : prev)
        setVideoStatus('done')
        setGeneratingVideo(false)
        return
      }
      if (mediaData.videoTaskId) {
        pollCountRef.current = 0
        const landingId = dataRef.current!.id
        setTimeout(() => checkVideoStatusRef.current?.(landingId), 5000)
        pollRef.current = setInterval(() => checkVideoStatusRef.current?.(landingId), 3000)
      }
    } catch (err) {
      console.error('Failed to start video generation:', err)
      setVideoStatus('idle')
    }
    setGeneratingVideo(false)
  }, [generatingVideo])

  // Start video polling when landing loads without video
  useEffect(() => {
    params.then(({ slug }) => {
      fetch(`/api/landings/${slug}`)
        .then(res => res.json())
        .then(landing => {
          if (landing.error) {
            setError(landing.error)
          } else {
            setData(landing)
            try { setBenefits(JSON.parse(landing.benefits)) } catch { setBenefits([]) }
            try { setTestimonials(JSON.parse(landing.testimonials)) } catch { setTestimonials([]) }
            try { setFaq(JSON.parse(landing.faq)) } catch { setFaq([]) }
            if (landing.audioUrl) setAudioUrl(landing.audioUrl)

            if (!landing.videoUrl && landing.id) {
              // Check status first — only poll if there's an active task
              pollCountRef.current = 0
              fetch(`/api/video/status?landingId=${landing.id}`)
                .then(res => res.json())
                .then(result => {
                  if (result.status === 'no_task' || result.status === 'video_failed') {
                    // No active task — show idle with generate button
                    setVideoStatus('idle')
                  } else if (result.status === 'done' && result.videoUrl) {
                    setData(prev => prev ? { ...prev, videoUrl: result.videoUrl } : prev)
                    setVideoStatus('done')
                  } else {
                    // Active task — start polling
                    setVideoStatus('processing')
                    setTimeout(() => checkVideoStatusRef.current?.(landing.id), 5000)
                    pollRef.current = setInterval(() => checkVideoStatusRef.current?.(landing.id), 3000)
                  }
                })
                .catch(() => setVideoStatus('idle'))
            } else if (landing.videoUrl) {
              setVideoStatus('done')
            }
          }
        })
        .catch(() => setError('Error al cargar la landing page'))
        .finally(() => setLoading(false))
    })

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [params, checkVideoStatus])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Cargando landing page...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-red-500 text-lg font-semibold">{error || 'Landing no encontrada'}</p>
        </div>
      </div>
    )
  }

  const price = data.product?.price

  const handleCTA = () => {
    if (data.ctaLink) {
      window.location.href = data.ctaLink
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* SECTION 1: HERO + SOCIAL PROOF BAR */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-teal-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 sm:pt-12 sm:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
                {data.headline}
              </h1>
              <div className="flex items-center justify-center lg:justify-start gap-1 mb-4">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <span className="text-sm font-semibold text-gray-600 ml-2">+2000 clientes satisfechos</span>
              </div>
              <p className="text-lg sm:text-xl text-gray-600 mb-6 leading-relaxed">{data.subheadline}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <motion.button
                  onClick={handleCTA}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="cta-pulse inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg px-8 py-4 rounded-xl shadow-lg shadow-emerald-200 transition-colors"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {data.ctaText}
                  {price && (
                    <span className="ml-1 bg-white/20 px-2 py-0.5 rounded text-sm">
                      ${price.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                    </span>
                  )}
                </motion.button>
              </div>
              {data.urgencyText && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-red-500 font-semibold text-sm mt-4 flex items-center gap-1 justify-center lg:justify-start">
                  <Clock className="w-4 h-4" />
                  {data.urgencyText}
                </motion.p>
              )}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mt-6 text-gray-400 text-xs">
                <div className="flex items-center gap-1"><Shield className="w-4 h-4" /> Compra Segura</div>
                <div className="flex items-center gap-1"><Truck className="w-4 h-4" /> Envio Express</div>
                <div className="flex items-center gap-1"><RotateCcw className="w-4 h-4" /> 30 dias garantia</div>
                <div className="flex items-center gap-1"><CreditCard className="w-4 h-4" /> Todos los medios de pago</div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }} className="relative">
              {data.heroImage1 ? (
                <img src={data.heroImage1} alt={data.productName} className="w-full rounded-2xl shadow-2xl" />
              ) : (
                <div className="w-full aspect-video bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center">
                  <p className="text-emerald-600 font-semibold text-lg">{data.productName}</p>
                </div>
              )}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-3 flex items-center gap-2">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-sm">Verificado</p>
                  <p className="text-gray-400 text-xs">+2000 ventas</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 2: UGC VIDEO + AUDIO */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wider mb-3">Testimonio Real</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">Escucha y mira lo que dicen nuestros clientes</h2>

            {/* Audio player */}
            {audioUrl && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 bg-white rounded-2xl p-4 shadow-md border border-emerald-100"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (audioRef.current) {
                        if (audioRef.current.paused) {
                          audioRef.current.play()
                        } else {
                          audioRef.current.pause()
                        }
                      }
                    }}
                    className="w-12 h-12 bg-emerald-600 hover:bg-emerald-700 rounded-full flex items-center justify-center shadow-lg flex-shrink-0 transition-colors"
                  >
                    <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-gray-800">Audio testimonial - Voz real</p>
                    <p className="text-xs text-gray-500">Escucha la experiencia de nuestra clienta</p>
                  </div>
                  <Volume2 className="w-5 h-5 text-emerald-500" />
                </div>
                <audio ref={audioRef} src={audioUrl} preload="auto" className="w-full mt-3" controls />
              </motion.div>
            )}

            <div className="relative aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-xl">
              {data.videoUrl ? (
                <video
                  src={data.videoUrl}
                  controls
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : videoStatus === 'processing' ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/80 to-teal-900/80" />
                  <div className="relative z-10 text-center">
                    <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mx-auto mb-4" />
                    <p className="text-white font-semibold text-lg">Generando video UGC...</p>
                    <p className="text-white/60 text-sm mt-1">La IA esta creando tu video con el producto</p>
                    {audioUrl && <p className="text-emerald-300 text-xs mt-3">Mientras tanto, escucha el audio testimonial abajo</p>}
                    {!audioUrl && <p className="text-emerald-300 text-xs mt-3">El video aparecera automaticamente cuando este listo</p>}
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/80 to-teal-900/80" />
                  <div className="relative z-10 text-center">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                    <p className="text-white font-semibold text-lg">Video UGC</p>
                    <p className="text-white/60 text-sm mt-1 mb-4">Aun no se genero el video para esta landing</p>
                    <button
                      onClick={handleGenerateVideo}
                      disabled={generatingVideo}
                      className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-700 text-white font-semibold rounded-xl transition-all text-sm shadow-lg hover:shadow-emerald-500/30"
                    >
                      {generatingVideo ? 'Generando...' : 'Generar Video UGC'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 3: PROBLEM + SOLUTION */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="bg-red-50 rounded-2xl p-8">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">😰</span>
              </div>
              <h3 className="text-xl font-bold text-red-800 mb-4">El problema que vivis</h3>
              <p className="text-red-700/80 leading-relaxed">{data.problem}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="bg-emerald-50 rounded-2xl p-8">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="text-xl font-bold text-emerald-800 mb-4">La solucion que mereces</h3>
              <p className="text-emerald-700/80 leading-relaxed">{data.solution}</p>
              <motion.button onClick={handleCTA} whileHover={{ scale: 1.03 }} className="mt-6 inline-flex items-center gap-2 bg-emerald-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors">
                {data.ctaText}
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 4: BENEFITS GRID */}
      {benefits.length > 0 && (
        <section className="py-12 sm:py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
              <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wider mb-2">Beneficios</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Por que elegir {data.productName}</h2>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((benefit, i) => {
                const IconComp = benefitIcons[i % benefitIcons.length]
                return (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-3">
                      <IconComp className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h4 className="font-bold text-gray-800 mb-2">{benefit.title}</h4>
                    <p className="text-gray-500 text-sm leading-relaxed">{benefit.description}</p>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* SECTION 5: LIFESTYLE IMAGE */}
      {data.heroImage2 && (
        <section className="py-12 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
              <img src={data.heroImage2} alt={`${data.productName} lifestyle`} className="w-full rounded-2xl shadow-xl" />
            </motion.div>
          </div>
        </section>
      )}

      {/* SECTION 6: TESTIMONIALS */}
      {testimonials.length > 0 && (
        <section className="py-12 sm:py-16 bg-emerald-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
              <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wider mb-2">Testimonios</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Lo que dicen nuestros clientes</h2>
              <div className="flex justify-center mt-3">
                <div className="flex">{[...Array(5)].map((_, i) => (<Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />))}</div>
              </div>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="bg-white rounded-xl p-6 shadow-sm border">
                  <div className="flex mb-3">{[...Array(5)].map((_, j) => (<Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />))}</div>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4 italic">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center gap-3 pt-4 border-t">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                      <span className="text-emerald-700 font-bold text-sm">{t.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{t.name}</p>
                      <p className="text-gray-400 text-xs">{t.location}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SECTION 7: OFFER + CTA */}
      <section className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-8 sm:p-12 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
            </div>
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-4">Oferta Exclusiva</h2>
              <p className="text-emerald-100 text-lg mb-6 max-w-xl mx-auto">No dejes pasar esta oportunidad de transformar tu salud con {data.productName}</p>
              {price && (
                <p className="text-4xl sm:text-5xl font-extrabold mb-6">
                  ${price.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                  <span className="text-lg text-emerald-200 line-through ml-3">
                    ${Math.round(price * 1.4).toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                  </span>
                </p>
              )}
              <motion.button onClick={handleCTA} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="cta-pulse inline-flex items-center justify-center gap-2 bg-white text-emerald-700 font-bold text-lg px-10 py-4 rounded-xl shadow-lg hover:bg-emerald-50 transition-colors">
                <ShoppingCart className="w-5 h-5" />
                {data.ctaText}
              </motion.button>
              <p className="text-emerald-200 text-xs mt-4 flex items-center justify-center gap-1">
                <Shield className="w-3 h-3" /> Compra 100% segura &bull; Garantia de devolucion
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 8: FAQ ACCORDION */}
      {faq.length > 0 && (
        <section className="py-12 sm:py-16 bg-gray-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
              <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wider mb-2">FAQ</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Preguntas Frecuentes</h2>
            </motion.div>
            <div className="space-y-3">
              {faq.map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-white rounded-xl border overflow-hidden">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors">
                    <span className="font-semibold text-gray-800 pr-4">{item.question}</span>
                    <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="px-5 pb-5">
                      <p className="text-gray-600 text-sm leading-relaxed">{item.answer}</p>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SECTION 9: FINAL CTA + URGENCY + FOOTER */}
      <section className="py-12 sm:py-16 bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">No esperes mas, tu salud no puede esperar</h2>
            <p className="text-gray-400 text-lg mb-8">Unite a los miles de clientes que ya transformaron su vida con {data.productName}</p>
            <motion.button onClick={handleCTA} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="cta-pulse inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-lg px-10 py-4 rounded-xl shadow-lg transition-colors">
              <ShoppingCart className="w-5 h-5" />
              {data.ctaText}
            </motion.button>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 pt-8 border-t border-gray-700">
              <div className="text-center"><Shield className="w-6 h-6 text-emerald-400 mx-auto mb-1" /><p className="text-gray-400 text-xs">Compra 100% Segura</p></div>
              <div className="text-center"><Truck className="w-6 h-6 text-emerald-400 mx-auto mb-1" /><p className="text-gray-400 text-xs">Envio a todo el pais</p></div>
              <div className="text-center"><RotateCcw className="w-6 h-6 text-emerald-400 mx-auto mb-1" /><p className="text-gray-400 text-xs">Garantia 30 dias</p></div>
              <div className="text-center"><CreditCard className="w-6 h-6 text-emerald-400 mx-auto mb-1" /><p className="text-gray-400 text-xs">Todos los medios de pago</p></div>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="bg-gray-950 text-gray-500 py-6 text-center text-xs">
        <p>&copy; {new Date().getFullYear()} Capilux | Nutricion Premium. Todos los derechos reservados.</p>
      </footer>
    </div>
  )
}
