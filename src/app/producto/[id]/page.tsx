'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Star,
  Heart,
  Minus,
  Plus,
  Package,
  Shield,
  RotateCcw,
  CreditCard,
  Share2,
  ChevronLeft,
  ChevronDown,
  Truck,
  Sparkles,
  ArrowRight,
  ShoppingCart,
} from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { CartSheet } from '@/components/cart/CartSheet'

interface ProductData {
  id: string
  name: string
  description: string
  price: number
  image1: string | null
  image2: string | null
  items?: string
  originalPrice?: number
}

interface UpsellRecommendation {
  id: string
  name: string
  description: string
  price: number
  image1: string | null
  image2: string | null
  type: string
  reason: string
}

/* ==============================
   FREE SHIPPING BAR
   ============================== */
const FREE_SHIPPING_THRESHOLD = 50000

function FreeShippingBar({ currentTotal }: { currentTotal: number }) {
  const progress = Math.min((currentTotal / FREE_SHIPPING_THRESHOLD) * 100, 100)
  const remaining = Math.max(FREE_SHIPPING_THRESHOLD - currentTotal, 0)
  const reached = currentTotal >= FREE_SHIPPING_THRESHOLD

  return (
    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-semibold text-gray-800">
            {reached ? 'Tenes envio gratis!' : `Envio gratis desde $${FREE_SHIPPING_THRESHOLD.toLocaleString('es-AR')}`}
          </span>
        </div>
        {!reached && (
          <span className="text-xs text-gray-500">
            Te faltan <span className="font-semibold text-emerald-600">${remaining.toLocaleString('es-AR')}</span>
          </span>
        )}
      </div>
      <div className="w-full h-2.5 bg-white rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      {reached && (
        <p className="text-xs text-emerald-600 mt-1.5 font-medium">Tu pedido califica para envio sin cargo</p>
      )}
    </div>
  )
}

/* ==============================
   ACCORDION SECTION
   ============================== */
function AccordionItem({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="font-semibold text-gray-800 text-sm">{title}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 py-4 text-sm text-gray-600 leading-relaxed">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ProductContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params.id as string
  const type = searchParams.get('type') || 'product'

  const { addItem } = useCart()
  const [item, setItem] = useState<ProductData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mainImage, setMainImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isFavorite, setIsFavorite] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)

  // Upsell state
  const [upsellRecs, setUpsellRecs] = useState<UpsellRecommendation[]>([])
  const [upsellLoading, setUpsellLoading] = useState(false)
  const [upsellFetched, setUpsellFetched] = useState(false)
  const fetchUpsellRef = useRef<() => void>(() => {})

  // Fetch product data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const res = await fetch(`/api/products/${id}?type=${type}`)
        if (!res.ok) throw new Error('Producto no encontrado')
        const data = await res.json()
        setItem(data.item)
      } catch {
        setError('No pudimos cargar este producto. Intenta nuevamente.')
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchData()
  }, [id, type])

  // Check favorites
  useEffect(() => {
    try {
      const favs = JSON.parse(localStorage.getItem('capilux_favorites') || '[]')
      setIsFavorite(favs.includes(id))
    } catch { /* ignore */ }
  }, [id])

  // Fetch upsell recommendations - trigger immediately when item loads
  const fetchUpsell = useCallback(async () => {
    if (!item) return
    const cacheKey = `upsell-${id}-${type}`
    const cached = sessionStorage.getItem(cacheKey)
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setUpsellRecs(parsed)
          setUpsellFetched(true)
          return
        }
      } catch { /* ignore bad cache */ }
    }
    try {
      setUpsellLoading(true)
      const res = await fetch(`/api/products/${id}?type=${type}`)
      if (!res.ok) throw new Error('Failed to fetch products')
      const data = await res.json()
      const otherItems: Array<ProductData & { _type?: string; items?: string; originalPrice?: number }> = data.otherItems || []
      if (otherItems.length === 0) {
        setUpsellFetched(true)
        return
      }
      const currentProduct = {
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        ...(item.items && { items: item.items }),
        ...(item.originalPrice && { originalPrice: item.originalPrice }),
      }
      const availableProducts = otherItems.map((p) => ({
        ...p,
        _type: p.id.startsWith('cm') ? 'combo' : 'product',
      }))

      // Try AI upsell
      let recs: UpsellRecommendation[] = []
      try {
        const upsellRes = await fetch('/api/ai/upsell', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentProduct, availableProducts }),
        })
        if (upsellRes.ok) {
          const upsellData = await upsellRes.json()
          recs = upsellData.recommendations || []
        }
      } catch (e) {
        console.warn('AI upsell failed, using fallback:', e)
      }

      // Fallback: if AI returned nothing, pick random products from catalog
      if (recs.length === 0) {
        const shuffled = [...availableProducts].sort(() => Math.random() - 0.5)
        const fallbackReasons = [
          'Un excelente complemento para tu compra.',
          'Ideal para potenciar tus resultados.',
          'Perfecto para combinar con este producto.',
          'Nuestros clientes lo eligen junto a este item.',
        ]
        recs = shuffled.slice(0, 4).map((p, i) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          image1: p.image1 || null,
          image2: p.image2 || null,
          items: p.items || null,
          originalPrice: p.originalPrice || null,
          type: (p._type || 'product') as string,
          reason: fallbackReasons[i % fallbackReasons.length],
        }))
      }

      if (recs.length > 0) {
        setUpsellRecs(recs)
        sessionStorage.setItem(cacheKey, JSON.stringify(recs))
      }
    } catch (e) {
      console.error('Upsell error:', e)
    } finally {
      setUpsellLoading(false)
      setUpsellFetched(true)
    }
  }, [item, id, type])

  fetchUpsellRef.current = fetchUpsell

  // Trigger upsell fetch when item is loaded
  useEffect(() => {
    if (item && !upsellFetched) {
      fetchUpsellRef.current()
    }
  }, [item, upsellFetched])

  const toggleFavorite = () => {
    try {
      const favs = JSON.parse(localStorage.getItem('capilux_favorites') || '[]')
      if (isFavorite) {
        const idx = favs.indexOf(id)
        if (idx > -1) favs.splice(idx, 1)
      } else {
        favs.push(id)
      }
      localStorage.setItem('capilux_favorites', JSON.stringify(favs))
      setIsFavorite(!isFavorite)
    } catch { /* ignore */ }
  }

  const handleAddToCart = () => {
    addItem({
      id: item!.id,
      name: item!.name,
      price: item!.price,
      image: item!.image1,
      type: type === 'combo' ? 'combo' : 'product',
    })
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  const handleBuyNow = () => {
    const query = type === 'combo' ? `?type=combo&qty=${quantity}` : `?qty=${quantity}`
    window.location.href = `/checkout/${id}${query}`
  }

  const unitPrice = item?.price || 0
  const discount = type === 'combo' && item && item.originalPrice ? Math.round((1 - item.price / item.originalPrice) * 100) : 0
  const images = item ? [item.image1, item.image2].filter(Boolean) as string[] : []

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <Skeleton className="w-32 h-8 mb-8" />
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            <div>
              <Skeleton className="aspect-square rounded-2xl w-full" />
              <div className="flex gap-3 mt-3">
                <Skeleton className="flex-1 aspect-[4/3] rounded-xl" />
                <Skeleton className="flex-1 aspect-[4/3] rounded-xl" />
              </div>
            </div>
            <div className="space-y-6">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-8 w-1/4" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !item) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center px-4">
          <img src="/capilux-logo.png" alt="Capilux" className="w-20 h-20 rounded-full mx-auto mb-4 object-cover" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Producto no encontrado</h2>
          <p className="text-gray-500 mb-6">{error || 'Lo sentimos, no pudimos encontrar este producto.'}</p>
          <Button onClick={() => window.location.href = '/'} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Volver al inicio
          </Button>
        </div>
      </div>
    )
  }

  // Generate product details from description for accordion
  const descriptionParts = item.description.split(/[.\n]/).filter(Boolean)

  return (
    <div className="min-h-screen bg-white">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors font-medium text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Volver
          </button>
          <div className="flex items-center gap-1">
            <CartSheet />
            <button
              onClick={toggleFavorite}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Heart className={`w-5 h-5 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
            </button>
            <button
              onClick={() => { if (navigator.share) navigator.share({ title: item.name, text: item.description, url: window.location.href }) }}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Share2 className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-16">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-emerald-600 transition-colors">Inicio</Link>
          <span>/</span>
          {type === 'combo' ? (
            <span className="text-emerald-600 font-medium">Combos</span>
          ) : (
            <span className="text-emerald-600 font-medium">Productos</span>
          )}
          <span>/</span>
          <span className="text-gray-700 font-medium truncate max-w-[200px]">{item.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* LEFT COLUMN: Images */}
          <div>
            <div className="space-y-3">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50 border border-gray-100">
                {images.length > 0 ? (
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={mainImage}
                      src={images[mainImage % images.length]}
                      alt={item.name}
                      className="absolute inset-0 w-full h-full object-cover"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  </AnimatePresence>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Heart className="w-24 h-24 text-emerald-200" />
                  </div>
                )}
                {images.length > 1 && (
                  <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full">
                    {mainImage + 1} / {images.length}
                  </div>
                )}
                {type === 'combo' && discount > 0 && (
                  <div className="absolute top-3 left-3 bg-red-500 text-white font-bold text-sm px-4 py-1.5 rounded-xl">
                    -{discount}% OFF
                  </div>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-3">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setMainImage(i)}
                      className={`relative flex-1 aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                        i === mainImage
                          ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Product Info & Actions */}
          <div>
            <div className="lg:sticky lg:top-16 space-y-5">
              {/* Title */}
              <div>
                {type === 'combo' && (
                  <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold mb-3">COMBO</Badge>
                )}
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight uppercase tracking-tight">
                  {item.name}
                </h1>
              </div>

              {/* Price */}
              <div className="space-y-1">
                <div className="flex items-end gap-3">
                  <span className="text-3xl font-extrabold text-gray-900">
                    ${unitPrice.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                  </span>
                  {type === 'combo' && item.originalPrice && item.originalPrice > 0 && (
                    <span className="text-base text-gray-400 line-through mb-1">
                      ${item.originalPrice.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                    </span>
                  )}
                </div>
                {type === 'combo' && item.originalPrice && item.originalPrice > 0 && (
                  <p className="text-xs text-gray-400">
                    Precio original: ${item.originalPrice.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                  </p>
                )}
              </div>

              {/* Rating & Stock */}
              <div className="flex items-center gap-3">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`w-4 h-4 ${s <= 4 ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`} />
                  ))}
                </div>
                <span className="text-sm text-gray-400">(4.0)</span>
                <div className="w-px h-4 bg-gray-200" />
                <span className="text-sm text-emerald-600 font-semibold">En stock</span>
              </div>

              {/* Free Shipping Bar */}
              <FreeShippingBar currentTotal={unitPrice * quantity} />

              {/* Quantity Selector */}
              <div>
                <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide mb-3">Cantidad</h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="h-10 w-10 rounded-lg border-2 border-gray-200 flex items-center justify-center hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus className="w-4 h-4 text-gray-600" />
                  </button>
                  <div className="h-10 w-14 flex items-center justify-center font-semibold text-lg border-y-2 border-gray-200 bg-gray-50">
                    {quantity}
                  </div>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="h-10 w-10 rounded-lg border-2 border-gray-200 flex items-center justify-center hover:border-gray-300 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-gray-600" />
                  </button>
                  <span className="text-sm text-gray-400 ml-3">
                    Subtotal: ${(unitPrice * quantity).toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-2">
                <Button
                  className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white text-base font-bold rounded-xl gap-3 shadow-lg shadow-emerald-600/20 transition-all"
                  onClick={handleBuyNow}
                >
                  <ShoppingCart className="w-5 h-5" />
                  Comprar ahora
                </Button>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className={`flex-1 h-12 rounded-xl gap-2 font-semibold transition-all ${
                      addedToCart
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-600'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={handleAddToCart}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {addedToCart ? 'Agregado!' : 'Agregar al carrito'}
                  </Button>

                  <Button
                    variant="outline"
                    className={`h-12 px-5 rounded-xl gap-2 transition-all ${
                      isFavorite
                        ? 'border-red-200 bg-red-50 text-red-500 hover:bg-red-50'
                        : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                    onClick={toggleFavorite}
                  >
                    <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500' : ''}`} />
                    <span className="text-sm">
                      {isFavorite ? 'Guardado' : 'Favorito'}
                    </span>
                  </Button>
                </div>

                {/* MercadoPago badge */}
                <div className="flex items-center justify-center gap-2 py-1">
                  <CreditCard className="w-4 h-4 text-[#009ee3]" />
                  <span className="text-xs text-gray-500">Aceptamos todos los medios de pago</span>
                </div>
              </div>

              {/* Description */}
              <div className="pt-4">
                <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide mb-3">Descripcion del Producto</h3>
                <p className="text-gray-600 leading-relaxed text-[15px]">
                  {item.description}
                </p>
                {type === 'combo' && item.items && (
                  <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Incluye</p>
                    <p className="text-amber-800 text-sm leading-relaxed">{item.items}</p>
                  </div>
                )}
              </div>

              {/* Accordion Sections */}
              <div className="space-y-2 pt-2">
                <AccordionItem title="Beneficios" defaultOpen={true}>
                  <div className="space-y-2">
                    {item.description.split(/[.\n]/).filter(s => s.trim().length > 10).slice(0, 4).map((part, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span>{part.trim()}.</span>
                      </div>
                    ))}
                  </div>
                </AccordionItem>

                <AccordionItem title="Modo de uso">
                  <p>Segui las instrucciones del envase del producto. Consulta con tu profesional de confianza para obtener los mejores resultados.</p>
                </AccordionItem>

                <AccordionItem title="Envio y entregas">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Truck className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-800">Envio a todo el pais</p>
                        <p className="text-gray-500 text-xs mt-0.5">Envio estandar: 3 a 7 dias habiles. Express: 1 a 2 dias habiles.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Package className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-800">Producto original y sellado</p>
                        <p className="text-gray-500 text-xs mt-0.5">Todos nuestros productos son 100% originales y se envian en su empaque original.</p>
                      </div>
                    </div>
                  </div>
                </AccordionItem>

                <AccordionItem title="Politica de devoluciones">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <RotateCcw className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-800">30 dias para devolver</p>
                        <p className="text-gray-500 text-xs mt-0.5">Si no quedas conforme, podes devolver el producto dentro de los 30 dias siguientes a la recepcion. El producto debe estar en su empaque original y sin uso.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-800">Compra segura</p>
                        <p className="text-gray-500 text-xs mt-0.5">Tus datos estan protegidos. Trabajamos con MercadoPago para garantizar la seguridad de tu compra.</p>
                      </div>
                    </div>
                  </div>
                </AccordionItem>
              </div>

              {/* Trust Features */}
              <div className="grid grid-cols-2 gap-3 pt-4">
                {[
                  { icon: Shield, label: 'Compra segura', desc: 'Datos protegidos' },
                  { icon: RotateCcw, label: 'Devoluciones', desc: '30 dias' },
                  { icon: Package, label: 'Producto original', desc: 'Sellado de fabrica' },
                  { icon: CreditCard, label: 'Todos los medios', desc: 'MP / transferencia' },
                ].map((trustItem, i) => (
                  <div key={i} className="flex items-center gap-2.5 p-3 rounded-lg bg-gray-50">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <trustItem.icon className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-700">{trustItem.label}</p>
                      <p className="text-[10px] text-gray-400 truncate">{trustItem.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* AI UPSELL SECTION */}
        <div className="mt-16">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-100 p-6 sm:p-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-200/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    Te recomendamos para complementar tu compra
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">Seleccionado por inteligencia artificial</p>
                </div>
              </div>

              {upsellLoading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50">
                      <Skeleton className="aspect-square rounded-lg mb-3" />
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-full mb-1" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  ))}
                </div>
              ) : upsellRecs.length > 0 ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {upsellRecs.map((rec) => {
                    const recImages = [rec.image1, rec.image2].filter(Boolean) as string[]
                    const recUrl = `/producto/${rec.id}${rec.type === 'combo' ? '?type=combo' : ''}`
                    return (
                      <motion.a
                        key={rec.id}
                        href={recUrl}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="group bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50 hover:border-emerald-200 hover:shadow-lg transition-all duration-300 cursor-pointer"
                      >
                        <div className="relative aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50 mb-3">
                          {recImages.length > 0 ? (
                            <img
                              src={recImages[0]}
                              alt={rec.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-emerald-300">
                              <Package className="w-10 h-10" />
                            </div>
                          )}
                          {rec.type === 'combo' && (
                            <Badge className="absolute top-2 left-2 bg-amber-500 text-white text-[10px]">COMBO</Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-800 text-sm line-clamp-1 mb-1 group-hover:text-emerald-600 transition-colors">
                          {rec.name}
                        </h3>
                        <p className="text-emerald-600 font-bold text-sm mb-2">
                          ${rec.price.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                        </p>
                        <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{rec.reason}</p>
                        <div className="flex items-center gap-1 mt-2 text-emerald-600 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          <span>Ver producto</span>
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      </motion.a>
                    )
                  })}
                </div>
              ) : upsellFetched && upsellRecs.length === 0 ? null : (
                <div className="text-center py-8 text-gray-400 text-sm">Cargando recomendaciones...</div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function ProductPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
            <Skeleton className="w-32 h-8 mb-8" />
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
              <div>
                <Skeleton className="aspect-square rounded-2xl w-full" />
              </div>
              <div className="space-y-6">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-32 w-full" />
              </div>
            </div>
          </div>
        </div>
      }
    >
      <ProductContent />
    </Suspense>
  )
}
