'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Star,
  Shield,
  Heart,
  Minus,
  Plus,
  Package,
  RotateCcw,
  CreditCard,
  MessageCircle,
  Share2,
  Loader2,
  ChevronLeft,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import {
  BuyerForm,
  ShippingAddressForm,
  ShippingSelector,
  handleMercadoPago,
  fallbackShipping,
  type ShippingOption,
} from '@/components/checkout/CheckoutForms'

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

interface UpsellRecommendation extends ProductData {
  type: string
  reason: string
}

export default function ProductPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params.id as string
  const type = searchParams.get('type') || 'product'
  const upsellRef = useRef<HTMLDivElement>(null)

  const [item, setItem] = useState<ProductData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Form state
  const [mainImage, setMainImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [buyerName, setBuyerName] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [buyerDni, setBuyerDni] = useState('')
  const [payLoading, setPayLoading] = useState(false)
  const [payError, setPayError] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [province, setProvince] = useState('')
  const [city, setCity] = useState('')
  const [street, setStreet] = useState('')
  const [number, setNumber] = useState('')
  const [floor, setFloor] = useState('')
  const [provinces, setProvinces] = useState<Array<{ code: string; name: string }>>([])
  const [andreaniOptions, setAndreaniOptions] = useState<ShippingOption[]>([])
  const [selectedShippingId, setSelectedShippingId] = useState('standard')
  const [andreaniConfigured, setAndreaniConfigured] = useState(false)
  const [quoting, setQuoting] = useState(false)
  const [quoteError, setQuoteError] = useState('')

  // Upsell state
  const [upsellRecs, setUpsellRecs] = useState<UpsellRecommendation[]>([])
  const [upsellLoading, setUpsellLoading] = useState(false)
  const [upsellFetched, setUpsellFetched] = useState(false)

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

  // Fetch provinces
  useEffect(() => {
    fetch('/api/shipping/provinces')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setProvinces(data) })
      .catch(() => {})
  }, [])

  // Fetch upsell recommendations (only once, using IntersectionObserver)
  useEffect(() => {
    if (!item || upsellFetched) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !upsellFetched) {
          setUpsellFetched(true)
          fetchUpsell()
        }
      },
      { threshold: 0.1 }
    )

    const currentRef = upsellRef.current
    if (currentRef) observer.observe(currentRef)

    return () => {
      if (currentRef) observer.unobserve(currentRef)
    }
  }, [item, upsellFetched])

  const fetchUpsell = async () => {
    // Check sessionStorage cache first
    const cacheKey = `upsell-${id}-${type}`
    const cached = sessionStorage.getItem(cacheKey)
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setUpsellRecs(parsed)
          return
        }
      } catch { /* ignore */ }
    }

    try {
      setUpsellLoading(true)
      // Fetch other items from the API
      const res = await fetch(`/api/products/${id}?type=${type}`)
      if (!res.ok) return
      const data = await res.json()
      const otherItems = data.otherItems || []

      if (otherItems.length === 0) return

      // Build the request body for AI
      const currentProduct = {
        id: item!.id,
        name: item!.name,
        description: item!.description,
        price: item!.price,
        ...(item!.items && { items: item!.items }),
        ...(item!.originalPrice && { originalPrice: item!.originalPrice }),
      }

      const availableProducts = otherItems.map((p: ProductData & { _type?: string }, i: number) => ({
        ...p,
        _type: p.id.startsWith('cm') ? 'combo' : 'product',
      }))

      const upsellRes = await fetch('/api/ai/upsell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentProduct, availableProducts }),
      })
      if (!upsellRes.ok) return
      const upsellData = await upsellRes.json()
      const recs = upsellData.recommendations || []
      if (recs.length > 0) {
        setUpsellRecs(recs)
        sessionStorage.setItem(cacheKey, JSON.stringify(recs))
      }
    } catch {
      // Silently fail - upsell is optional
    } finally {
      setUpsellLoading(false)
    }
  }

  const fetchShippingQuote = useCallback(async (cp: string) => {
    if (!cp || cp.length < 4) return
    setQuoting(true)
    setQuoteError('')
    try {
      const res = await fetch('/api/shipping/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postalCode: cp, weight: 0.5, dimensions: { length: 25, width: 15, height: 10 } }),
      })
      const data = await res.json()
      if (data.configured && Array.isArray(data.options) && data.options.length > 0) {
        setAndreaniOptions(data.options)
        setAndreaniConfigured(true)
        setSelectedShippingId(data.options[0].id)
      } else {
        setAndreaniConfigured(false)
        setQuoteError(data.error || 'No se pudo obtener la cotizacion. Se usara tarifa estandar.')
      }
    } catch {
      setQuoteError('Error de conexion. Se usara tarifa estandar.')
      setAndreaniConfigured(false)
    } finally {
      setQuoting(false)
    }
  }, [])

  const unitPrice = item?.price || 0
  const activeOptions = andreaniConfigured && andreaniOptions.length > 0 ? andreaniOptions : [fallbackShipping.standard, fallbackShipping.express]
  const selectedOption = activeOptions.find(o => o.id === selectedShippingId) || activeOptions[0]
  const shippingCost = selectedOption.cost
  const shippingLabel = selectedOption.label
  const totalPrice = unitPrice * quantity + shippingCost
  const discount = type === 'combo' && item && 'originalPrice' in item && item.originalPrice ? Math.round((1 - item.price / item.originalPrice) * 100) : 0

  const onMP = async () => {
    if (!buyerName || !buyerEmail) {
      setPayError('Completa nombre y email para continuar')
      return
    }
    if (!postalCode) {
      setPayError('Ingresa tu codigo postal para el envio')
      return
    }
    setPayError('')
    setPayLoading(true)
    try {
      const totalAmount = unitPrice * quantity + shippingCost
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType: type === 'combo' ? 'combo' : 'product',
          itemId: item!.id,
          itemName: item!.name,
          itemPrice: unitPrice,
          quantity,
          subtotal: unitPrice * quantity,
          buyerName,
          buyerEmail,
          buyerPhone,
          buyerDni,
          shippingMethod: selectedOption.label,
          shippingCost,
          shippingAddress: { postalCode, province, city, street, number, floor },
          total: totalAmount,
        }),
      })
      const orderData = await orderRes.json()
      const savedOrderId = orderData.orderId || ''

      await handleMercadoPago({
        title: item!.name,
        description: item!.description,
        price: unitPrice,
        quantity,
        shippingCost,
        shippingLabel,
        buyerName,
        buyerEmail,
        buyerPhone,
        buyerDni,
        itemType: type === 'combo' ? 'combo' : 'product',
        itemId: item!.id,
        shippingAddress: { postalCode, province, city, street, number, floor },
        shippingMethod: selectedOption.label,
        orderId: savedOrderId,
      })
    } catch (e: unknown) {
      setPayError(e instanceof Error ? e.message : 'Error al procesar el pago')
    } finally {
      setPayLoading(false)
    }
  }

  const handleWhatsApp = () => {
    const addrStr = street ? `${street} ${number}, ${city}, ${province} (CP: ${postalCode})` : postalCode
    const itemLabel = type === 'combo' ? 'combo' : 'producto'
    const msg = encodeURIComponent(
      `Hola! Me interesa el ${itemLabel}: ${item?.name}\nCantidad: ${quantity}\nEnvio a: ${addrStr}\nTotal estimado: $${totalPrice.toLocaleString('es-AR')}`
    )
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  const images = item ? [item.image1, item.image2].filter(Boolean) as string[] : []

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
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
              <Skeleton className="h-32 w-full" />
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

  return (
    <div className="min-h-screen bg-white">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors font-medium text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Volver
          </button>
          <button
            onClick={() => { if (navigator.share) navigator.share({ title: item.name, text: item.description, url: window.location.href }) }}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <Share2 className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-16">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* LEFT COLUMN: Images & Description */}
          <div>
            {/* Image Gallery */}
            <div className="space-y-3">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50">
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
                          ? 'border-emerald-600 ring-2 ring-emerald-600/20 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info - visible on mobile (below images) */}
            <div className="mt-6 space-y-4 lg:hidden">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{item.name}</h1>
                <div className="flex items-end gap-3 mt-2">
                  <span className="text-3xl font-extrabold text-emerald-600">
                    ${unitPrice.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                  </span>
                  {type === 'combo' && item.originalPrice && item.originalPrice > 0 && (
                    <span className="text-base text-gray-400 line-through mb-0.5">
                      ${item.originalPrice.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                    </span>
                  )}
                  <span className="text-sm text-gray-400 mb-1">cada uno</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`w-4 h-4 ${s <= 4 ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`} />
                  ))}
                </div>
                <span className="text-sm text-gray-400">(4.0)</span>
                <Separator orientation="vertical" className="h-4" />
                <span className="text-sm text-emerald-600 font-medium">En stock</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide mb-2">Descripcion</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </div>
              {type === 'combo' && item.items && (
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide mb-2">Incluye</h3>
                  <p className="text-gray-600 leading-relaxed">{item.items}</p>
                </div>
              )}
            </div>

            {/* Trust Features */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                { icon: Shield, label: 'Compra segura', desc: 'Datos protegidos' },
                { icon: RotateCcw, label: 'Devoluciones', desc: '30 dias para devolver' },
                { icon: Package, label: 'Envio original', desc: 'Producto sellado' },
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

          {/* RIGHT COLUMN: Purchase Form */}
          <div>
            {/* Sticky purchase form on desktop */}
            <div className="lg:sticky lg:top-16 lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto lg:pb-8 space-y-6">
              {/* Product Info - desktop only */}
              <div className="hidden lg:block space-y-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{item.name}</h1>
                  <div className="flex items-end gap-3 mt-2">
                    <span className="text-3xl font-extrabold text-emerald-600">
                      ${unitPrice.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                    </span>
                    {type === 'combo' && item.originalPrice && item.originalPrice > 0 && (
                      <span className="text-base text-gray-400 line-through mb-0.5">
                        ${item.originalPrice.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                      </span>
                    )}
                    <span className="text-sm text-gray-400 mb-1">cada uno</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-4 h-4 ${s <= 4 ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`} />
                    ))}
                  </div>
                  <span className="text-sm text-gray-400">(4.0)</span>
                  <Separator orientation="vertical" className="h-4" />
                  <span className="text-sm text-emerald-600 font-medium">En stock</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide mb-2">Descripcion</h3>
                  <p className="text-gray-600 leading-relaxed text-[15px]">{item.description}</p>
                </div>
                {type === 'combo' && item.items && (
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide mb-2">Incluye</h3>
                    <p className="text-gray-600 leading-relaxed">{item.items}</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Quantity */}
              <div>
                <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide mb-3">Cantidad</h3>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-10 w-10 rounded-lg"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>
                    <Minus className="w-4 h-4" />
                  </Button>
                  <div className="h-10 w-14 flex items-center justify-center font-semibold text-lg border-y rounded-none bg-gray-50">
                    {quantity}
                  </div>
                  <Button variant="outline" size="icon" className="h-10 w-10 rounded-lg"
                    onClick={() => setQuantity(quantity + 1)}>
                    <Plus className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-gray-400 ml-3">
                    Subtotal: ${(unitPrice * quantity).toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Shipping Address */}
              <ShippingAddressForm
                postalCode={postalCode} setPostalCode={setPostalCode}
                province={province} setProvince={setProvince}
                city={city} setCity={setCity}
                street={street} setStreet={setStreet}
                number={number} setNumber={setNumber}
                floor={floor} setFloor={setFloor}
                onQuote={fetchShippingQuote}
                quoting={quoting}
                quoteError={quoteError}
                provinces={provinces}
              />

              <Separator />

              {/* Shipping Options */}
              <ShippingSelector
                andreaniOptions={andreaniOptions}
                selectedShippingId={selectedShippingId}
                setSelectedShippingId={setSelectedShippingId}
                configured={andreaniConfigured}
              />

              <Separator />

              {/* Buyer Info */}
              <BuyerForm
                buyerName={buyerName} setBuyerName={setBuyerName}
                buyerEmail={buyerEmail} setBuyerEmail={setBuyerEmail}
                buyerPhone={buyerPhone} setBuyerPhone={setBuyerPhone}
                buyerDni={buyerDni} setBuyerDni={setBuyerDni}
              />

              <Separator />

              {/* Price Summary */}
              <div className="space-y-2.5 bg-gray-50 rounded-xl p-5">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Precio unitario</span>
                  <span>${unitPrice.toLocaleString('es-AR', { minimumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Cantidad</span>
                  <span>x{quantity}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>${(unitPrice * quantity).toLocaleString('es-AR', { minimumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Envio ({shippingLabel})</span>
                  <span>{shippingCost === 0 ? 'Gratis' : `$${shippingCost.toLocaleString('es-AR')}`}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900 text-lg">Total</span>
                  <span className="font-extrabold text-emerald-600 text-2xl">
                    ${totalPrice.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                  </span>
                </div>
              </div>

              {payError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg">{payError}</div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <Button
                  className="w-full h-14 bg-[#009ee3] hover:bg-[#0089c7] text-white text-base font-bold rounded-xl gap-3 shadow-lg"
                  onClick={onMP}
                  disabled={payLoading}
                >
                  {payLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                  Pagar con MercadoPago
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-12 border-emerald-200 text-emerald-600 hover:bg-emerald-50 font-semibold rounded-xl gap-2"
                  onClick={handleWhatsApp}
                >
                  <MessageCircle className="w-4 h-4" />
                  Consultar por WhatsApp
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* AI UPSELL SECTION */}
        <div ref={upsellRef} className="mt-16">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-100 p-6 sm:p-8">
            {/* Decorative elements */}
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
                        <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">
                          {rec.reason}
                        </p>
                        <div className="flex items-center gap-1 mt-2 text-emerald-600 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          <span>Ver producto</span>
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      </motion.a>
                    )
                  })}
                </div>
              ) : upsellFetched ? null : (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Cargando recomendaciones...
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
