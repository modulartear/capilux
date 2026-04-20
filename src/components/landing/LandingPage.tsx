'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Check,
  Star,
  Shield,
  Truck,
  Heart,
  Minus,
  Plus,
  Package,
  RotateCcw,
  Clock,
  MapPin,
  CreditCard,
  MessageCircle,
  Share2,
  X,
  Loader2,
  User,
  Mail,
  Phone,
  FileText,
  CircleCheckBig,
  CircleX,
  CircleAlert,
  ArrowRight,
  Building2,
} from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string
  price: number
  image1: string | null
  image2: string | null
}

interface Combo {
  id: string
  name: string
  description: string
  items: string
  originalPrice: number
  price: number
  image1: string | null
  image2: string | null
}

interface LandingPageProps {
  products: Product[]
  combos: Combo[]
  onGoToAdmin: () => void
  paymentStatus: string | null
}

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
}

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

interface ShippingOption {
  id: string
  label: string
  description: string
  cost: number
  estimatedDays: string
  serviceType: string
}

const fallbackShipping = {
  standard: { id: 'standard', label: 'Envio Estandar', description: '3 a 7 dias habiles', cost: 0, estimatedDays: '3 a 7 dias habiles', serviceType: 'estandar' },
  express: { id: 'express', label: 'Envio Express', description: '1 a 2 dias habiles', cost: 3500, estimatedDays: '1 a 2 dias habiles', serviceType: 'express' },
}

function ProductCard({ product }: { product: Product }) {
  const [imgIndex, setImgIndex] = useState(0)
  const images = [product.image1, product.image2].filter(Boolean) as string[]

  return (
    <motion.div variants={fadeInUp}>
      <Card
        className="group cursor-pointer overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white"
        onClick={() => { window.location.href = '/producto/' + product.id }}
      >
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50">
          {images.length > 0 ? (
            <>
              <img
                src={images[imgIndex % images.length]}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {images.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.stopPropagation(); setImgIndex(i) }}
                      className={`w-2 h-2 rounded-full transition-all ${i === imgIndex ? 'bg-emerald-600 w-5' : 'bg-white/70'}`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-emerald-300">
              <Heart className="w-16 h-16" />
            </div>
          )}
          <Badge className="absolute top-3 right-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-3 py-1">
            ${product.price.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
          </Badge>
        </div>
        <CardContent className="p-5">
          <h3 className="font-bold text-lg text-gray-800 mb-2">{product.name}</h3>
          <p className="text-gray-500 text-sm line-clamp-2">{product.description}</p>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function ComboCard({ combo }: { combo: Combo }) {
  const [imgIndex, setImgIndex] = useState(0)
  const images = [combo.image1, combo.image2].filter(Boolean) as string[]
  const discount = combo.originalPrice > 0 ? Math.round((1 - combo.price / combo.originalPrice) * 100) : 0

  return (
    <motion.div variants={fadeInUp}>
      <Card
        className="group cursor-pointer overflow-hidden border-2 border-emerald-200 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white relative"
        onClick={() => { window.location.href = '/producto/' + combo.id + '?type=combo' }}
      >
        {discount > 0 && (
          <div className="absolute top-0 left-0 bg-red-500 text-white font-bold text-xs px-4 py-1.5 rounded-br-xl z-10">
            -{discount}% OFF
          </div>
        )}
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50">
          {images.length > 0 ? (
            <>
              <img
                src={images[imgIndex % images.length]}
                alt={combo.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {images.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.stopPropagation(); setImgIndex(i) }}
                      className={`w-2 h-2 rounded-full transition-all ${i === imgIndex ? 'bg-amber-600 w-5' : 'bg-white/70'}`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-amber-300">
              <Star className="w-16 h-16" />
            </div>
          )}
        </div>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-amber-500 hover:bg-amber-600 text-white">COMBO</Badge>
            <h3 className="font-bold text-lg text-gray-800">{combo.name}</h3>
          </div>
          <p className="text-gray-500 text-sm mb-3 line-clamp-2">{combo.description}</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-emerald-600">${combo.price.toLocaleString('es-AR', { minimumFractionDigits: 0 })}</span>
            {combo.originalPrice > 0 && (
              <span className="text-sm text-gray-400 line-through">${combo.originalPrice.toLocaleString('es-AR', { minimumFractionDigits: 0 })}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

/* ==============================
   BUYER FORM (shared)
   ============================== */
function BuyerForm({
  buyerName,
  setBuyerName,
  buyerEmail,
  setBuyerEmail,
  buyerPhone,
  setBuyerPhone,
  buyerDni,
  setBuyerDni,
}: {
  buyerName: string
  setBuyerName: (v: string) => void
  buyerEmail: string
  setBuyerEmail: (v: string) => void
  buyerPhone: string
  setBuyerPhone: (v: string) => void
  buyerDni: string
  setBuyerDni: (v: string) => void
}) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide mb-1">Tus Datos</h3>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="bname" className="text-xs text-gray-500">Nombre completo *</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              id="bname"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="Tu nombre y apellido"
              className="pl-10 h-11"
              required
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bemail" className="text-xs text-gray-500">Email *</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              id="bemail"
              type="email"
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
              placeholder="tu@email.com"
              className="pl-10 h-11"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="bphone" className="text-xs text-gray-500">Telefono</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="bphone"
                type="tel"
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                placeholder="11 1234 5678"
                className="pl-10 h-11"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bdni" className="text-xs text-gray-500">DNI</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="bdni"
                value={buyerDni}
                onChange={(e) => setBuyerDni(e.target.value)}
                placeholder="12345678"
                className="pl-10 h-11"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ==============================
   SHIPPING ADDRESS FORM (shared)
   ============================== */
function ShippingAddressForm({
  postalCode,
  setPostalCode,
  province,
  setProvince,
  city,
  setCity,
  street,
  setStreet,
  number,
  setNumber,
  floor,
  setFloor,
  onQuote,
  quoting,
  quoteError,
  provinces,
}: {
  postalCode: string
  setPostalCode: (v: string) => void
  province: string
  setProvince: (v: string) => void
  city: string
  setCity: (v: string) => void
  street: string
  setStreet: (v: string) => void
  number: string
  setNumber: (v: string) => void
  floor: string
  setFloor: (v: string) => void
  onQuote: (cp: string) => void
  quoting: boolean
  quoteError: string
  provinces: Array<{ code: string; name: string }>
}) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide mb-1">Direccion de Envio</h3>
      <div className="space-y-3">
        {/* Postal Code + Quote Button */}
        <div className="space-y-1.5">
          <Label htmlFor="postalcode" className="text-xs text-gray-500">Codigo Postal *</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="postalcode"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="Ej: B1636"
                className="pl-10 h-11"
                required
              />
            </div>
            <Button
              variant="outline"
              className="h-11 px-4 border-emerald-200 text-emerald-600 hover:bg-emerald-50 font-semibold text-xs whitespace-nowrap"
              onClick={() => onQuote(postalCode)}
              disabled={quoting || !postalCode}
            >
              {quoting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
              <span className="ml-1.5">Calcular envio</span>
            </Button>
          </div>
          {quoteError && (
            <p className="text-xs text-amber-600 mt-1">{quoteError}</p>
          )}
        </div>

        {/* Province */}
        <div className="space-y-1.5">
          <Label htmlFor="province" className="text-xs text-gray-500">Provincia</Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              id="province"
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="w-full h-11 pl-10 pr-3 rounded-md border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none"
            >
              <option value="">Selecciona tu provincia</option>
              {provinces.map((p) => (
                <option key={p.code} value={p.code}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* City */}
        <div className="space-y-1.5">
          <Label htmlFor="city" className="text-xs text-gray-500">Ciudad / Localidad</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ej: Olivos"
              className="pl-10 h-11"
            />
          </div>
        </div>

        {/* Street + Number */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="street" className="text-xs text-gray-500">Calle</Label>
            <Input
              id="street"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder="Av. Libertador"
              className="h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="number" className="text-xs text-gray-500">Numero</Label>
            <Input
              id="number"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="1234"
              className="h-11"
            />
          </div>
        </div>

        {/* Floor/Depto */}
        <div className="space-y-1.5">
          <Label htmlFor="floor" className="text-xs text-gray-500">Piso / Depto <span className="text-gray-400">(opcional)</span></Label>
          <Input
            id="floor"
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
            placeholder="Ej: 3B"
            className="h-11"
          />
        </div>
      </div>
    </div>
  )
}

/* ==============================
   SHIPPING SELECTOR (shared)
   ============================== */
function ShippingSelector({
  andreaniOptions,
  selectedShippingId,
  setSelectedShippingId,
  configured,
}: {
  andreaniOptions: ShippingOption[]
  selectedShippingId: string
  setSelectedShippingId: (v: string) => void
  configured: boolean
}) {
  const options = configured && andreaniOptions.length > 0 ? andreaniOptions : [
    fallbackShipping.standard,
    fallbackShipping.express,
  ]

  return (
    <div>
      <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide mb-3">
        Metodo de Envio
        {configured && <Badge className="ml-2 bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 hover:bg-blue-100">Andreani</Badge>}
      </h3>
      <div className="space-y-2">
        {options.map((opt) => {
          const isSelected = selectedShippingId === opt.id
          const TheIcon = opt.serviceType === 'express' || opt.serviceType === 'urgente' ? Clock : Truck
          return (
            <button
              key={opt.id}
              onClick={() => setSelectedShippingId(opt.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                isSelected ? 'bg-emerald-600' : 'bg-gray-100'
              }`}>
                <TheIcon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-800 text-sm">{opt.label}</span>
                  {opt.cost === 0 && (
                    <Badge className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 hover:bg-emerald-100">GRATIS</Badge>
                  )}
                </div>
                <span className="text-xs text-gray-500">{opt.description || opt.estimatedDays}</span>
              </div>
              <div className="text-right flex-shrink-0">
                {opt.cost === 0 ? (
                  <span className="text-sm font-bold text-emerald-600">Gratis</span>
                ) : (
                  <span className="text-sm font-bold text-gray-700">${opt.cost.toLocaleString('es-AR')}</span>
                )}
                <div className={`w-5 h-5 rounded-full border-2 mx-auto mt-1 flex items-center justify-center ${
                  isSelected ? 'border-emerald-600' : 'border-gray-300'
                }`}>
                  {isSelected && (
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
      {!configured && (
        <div className="flex items-center gap-2 mt-3 p-3 bg-blue-50 rounded-lg">
          <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <span className="text-xs text-blue-700">Envio a todo el pais. Ingresa tu codigo postal para cotizar con Andreani.</span>
        </div>
      )}
    </div>
  )
}

/* ==============================
   PAYMENT HANDLER
   ============================== */
async function handleMercadoPago(params: {
  title: string
  description: string
  price: number
  quantity: number
  shippingCost: number
  shippingLabel: string
  buyerName: string
  buyerEmail: string
  buyerPhone: string
  buyerDni: string
  itemType: 'product' | 'combo'
  itemId: string
  shippingAddress?: { postalCode: string; province: string; city: string; street: string; number: string; floor: string }
  shippingMethod?: string
  shippingQuoteId?: string
  orderId?: string
}) {
  const res = await fetch('/api/payments/create-preference', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || 'Error al crear el pago')
  }
  // Redirect to MercadoPago checkout
  if (data.initPoint) {
    window.location.href = data.initPoint
  }
}

/* ==============================
   PRODUCT DETAIL SHEET
   ============================== */
function ProductDetailSheet({
  product,
  open,
  onClose,
}: {
  product: Product
  open: boolean
  onClose: () => void
}) {
  const images = [product.image1, product.image2].filter(Boolean) as string[]
  const [mainImage, setMainImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [buyerName, setBuyerName] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [buyerDni, setBuyerDni] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
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
  const [orderId, setOrderId] = useState('')

  useEffect(() => {
    fetch('/api/shipping/provinces')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setProvinces(data) })
      .catch(() => {})
  }, [])

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

  const unitPrice = product.price
  const activeOptions = andreaniConfigured && andreaniOptions.length > 0 ? andreaniOptions : [fallbackShipping.standard, fallbackShipping.express]
  const selectedOption = activeOptions.find(o => o.id === selectedShippingId) || activeOptions[0]
  const shippingCost = selectedOption.cost
  const shippingLabel = selectedOption.label
  const totalPrice = unitPrice * quantity + shippingCost

  const onMP = async () => {
    if (!buyerName || !buyerEmail) {
      setError('Completa nombre y email para continuar')
      return
    }
    if (!postalCode) {
      setError('Ingresa tu codigo postal para el envio')
      return
    }
    setError('')
    setLoading(true)
    try {
      // Create order first
      const totalAmount = unitPrice * quantity + shippingCost
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType: 'product',
          itemId: product.id,
          itemName: product.name,
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
        title: product.name,
        description: product.description,
        price: unitPrice,
        quantity,
        shippingCost,
        shippingLabel: shippingLabel,
        buyerName,
        buyerEmail,
        buyerPhone,
        buyerDni,
        itemType: 'product',
        itemId: product.id,
        shippingAddress: { postalCode, province, city, street, number, floor },
        shippingMethod: selectedOption.label,
        orderId: savedOrderId,
      })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al procesar el pago')
    } finally {
      setLoading(false)
    }
  }

  const handleWhatsApp = () => {
    const addrStr = street ? `${street} ${number}, ${city}, ${province} (CP: ${postalCode})` : postalCode
    const msg = encodeURIComponent(
      `Hola! Me interesa el producto: ${product.name}\nCantidad: ${quantity}\nEnvio a: ${addrStr}\nTotal estimado: $${totalPrice.toLocaleString('es-AR')}`
    )
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl lg:max-w-3xl p-0 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm px-4 sm:px-6 py-4 flex items-center justify-between border-b">
          <SheetTitle className="text-sm font-medium text-gray-500">Detalle del Producto</SheetTitle>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="px-4 sm:px-6 py-6 space-y-0">
          {/* Image Gallery */}
          <div className="space-y-3">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50">
              {images.length > 0 ? (
                <AnimatePresence mode="wait">
                  <motion.img key={mainImage} src={images[mainImage % images.length]} alt={product.name}
                    className="absolute inset-0 w-full h-full object-cover"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} />
                </AnimatePresence>
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Heart className="w-24 h-24 text-emerald-200" /></div>
              )}
              {images.length > 1 && (
                <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full">
                  {mainImage + 1} / {images.length}
                </div>
              )}
              <button className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-sm hover:bg-white transition-colors"
                onClick={() => { if (navigator.share) navigator.share({ title: product.name, text: product.description }) }}>
                <Share2 className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            {images.length > 1 && (
              <div className="flex gap-3">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setMainImage(i)}
                    className={`relative flex-1 aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                      i === mainImage ? 'border-emerald-600 ring-2 ring-emerald-600/20 shadow-md' : 'border-gray-200 hover:border-gray-300 opacity-70 hover:opacity-100'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="mt-6 space-y-5">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{product.name}</h1>
              <div className="flex items-end gap-3 mt-2">
                <span className="text-3xl font-extrabold text-emerald-600">${unitPrice.toLocaleString('es-AR', { minimumFractionDigits: 0 })}</span>
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

            <Separator />
            <div>
              <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide mb-2">Descripcion</h3>
              <p className="text-gray-600 leading-relaxed text-[15px]">{product.description}</p>
            </div>

            <Separator />

            {/* Quantity */}
            <div>
              <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide mb-3">Cantidad</h3>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-lg"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}><Minus className="w-4 h-4" /></Button>
                <div className="h-10 w-14 flex items-center justify-center font-semibold text-lg border-y rounded-none bg-gray-50">{quantity}</div>
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-lg"
                  onClick={() => setQuantity(quantity + 1)}><Plus className="w-4 h-4" /></Button>
                <span className="text-sm text-gray-400 ml-3">Subtotal: ${(unitPrice * quantity).toLocaleString('es-AR', { minimumFractionDigits: 0 })}</span>
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
              <div className="flex justify-between text-sm text-gray-500"><span>Precio unitario</span><span>${unitPrice.toLocaleString('es-AR', { minimumFractionDigits: 0 })}</span></div>
              <div className="flex justify-between text-sm text-gray-500"><span>Cantidad</span><span>x{quantity}</span></div>
              <div className="flex justify-between text-sm text-gray-500"><span>Subtotal</span><span>${(unitPrice * quantity).toLocaleString('es-AR', { minimumFractionDigits: 0 })}</span></div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Envio ({shippingLabel})</span>
                <span>{shippingCost === 0 ? 'Gratis' : `$${shippingCost.toLocaleString('es-AR')}`}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900 text-lg">Total</span>
                <span className="font-extrabold text-emerald-600 text-2xl">${totalPrice.toLocaleString('es-AR', { minimumFractionDigits: 0 })}</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg">{error}</div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pb-4">
              <Button
                className="w-full h-14 bg-[#009ee3] hover:bg-[#0089c7] text-white text-base font-bold rounded-xl gap-3 shadow-lg"
                onClick={onMP}
                disabled={loading}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
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

            {/* Trust Features */}
            <div className="grid grid-cols-2 gap-3 pb-6">
              {[
                { icon: Shield, label: 'Compra segura', desc: 'Datos protegidos' },
                { icon: RotateCcw, label: 'Devoluciones', desc: '30 dias para devolver' },
                { icon: Package, label: 'Envio original', desc: 'Producto sellado' },
                { icon: CreditCard, label: 'Todos los medios', desc: 'MP / transferencia' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 p-3 rounded-lg bg-gray-50">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-700">{item.label}</p>
                    <p className="text-[10px] text-gray-400 truncate">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

/* ==============================
   COMBO DETAIL SHEET
   ============================== */
function ComboDetailSheet({
  combo,
  open,
  onClose,
}: {
  combo: Combo
  open: boolean
  onClose: () => void
}) {
  const images = [combo.image1, combo.image2].filter(Boolean) as string[]
  const [mainImage, setMainImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [buyerName, setBuyerName] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [buyerDni, setBuyerDni] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
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
  const [orderId, setOrderId] = useState('')
  const discount = combo.originalPrice > 0 ? Math.round((1 - combo.price / combo.originalPrice) * 100) : 0

  useEffect(() => {
    fetch('/api/shipping/provinces')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setProvinces(data) })
      .catch(() => {})
  }, [])

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

  const unitPrice = combo.price
  const activeOptions = andreaniConfigured && andreaniOptions.length > 0 ? andreaniOptions : [fallbackShipping.standard, fallbackShipping.express]
  const selectedOption = activeOptions.find(o => o.id === selectedShippingId) || activeOptions[0]
  const shippingCost = selectedOption.cost
  const shippingLabel = selectedOption.label
  const totalPrice = unitPrice * quantity + shippingCost

  const onMP = async () => {
    if (!buyerName || !buyerEmail) {
      setError('Completa nombre y email para continuar')
      return
    }
    if (!postalCode) {
      setError('Ingresa tu codigo postal para el envio')
      return
    }
    setError('')
    setLoading(true)
    try {
      // Create order first
      const totalAmount = unitPrice * quantity + shippingCost
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType: 'combo',
          itemId: combo.id,
          itemName: combo.name,
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
        title: combo.name,
        description: combo.description,
        price: unitPrice,
        quantity,
        shippingCost,
        shippingLabel: shippingLabel,
        buyerName,
        buyerEmail,
        buyerPhone,
        buyerDni,
        itemType: 'combo',
        itemId: combo.id,
        shippingAddress: { postalCode, province, city, street, number, floor },
        shippingMethod: selectedOption.label,
        orderId: savedOrderId,
      })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al procesar el pago')
    } finally {
      setLoading(false)
    }
  }

  const handleWhatsApp = () => {
    const addrStr = street ? `${street} ${number}, ${city}, ${province} (CP: ${postalCode})` : postalCode
    const msg = encodeURIComponent(
      `Hola! Me interesa el combo: ${combo.name}\nCantidad: ${quantity}\nEnvio a: ${addrStr}\nTotal estimado: $${totalPrice.toLocaleString('es-AR')}`
    )
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl lg:max-w-3xl p-0 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm px-4 sm:px-6 py-4 flex items-center justify-between border-b">
          <SheetTitle className="text-sm font-medium text-gray-500">Detalle del Combo</SheetTitle>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="px-4 sm:px-6 py-6 space-y-0">
          {/* Combo Badge */}
          <div className="flex items-center gap-2 mb-4">
            <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-3 py-1 gap-1"><Package className="w-3 h-3" /> COMBO</Badge>
            {discount > 0 && <Badge className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1">Ahorra {discount}%</Badge>}
          </div>

          {/* Image Gallery */}
          <div className="space-y-3">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50">
              {images.length > 0 ? (
                <AnimatePresence mode="wait">
                  <motion.img key={mainImage} src={images[mainImage % images.length]} alt={combo.name}
                    className="absolute inset-0 w-full h-full object-cover"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} />
                </AnimatePresence>
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Package className="w-24 h-24 text-amber-200" /></div>
              )}
              {images.length > 1 && (
                <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full">{mainImage + 1} / {images.length}</div>
              )}
              <button className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-sm hover:bg-white transition-colors"
                onClick={() => { if (navigator.share) navigator.share({ title: combo.name, text: combo.description }) }}>
                <Share2 className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            {images.length > 1 && (
              <div className="flex gap-3">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setMainImage(i)}
                    className={`relative flex-1 aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                      i === mainImage ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md' : 'border-gray-200 hover:border-gray-300 opacity-70 hover:opacity-100'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Combo Info */}
          <div className="mt-6 space-y-5">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{combo.name}</h1>
              <div className="flex items-end gap-3 mt-2">
                <span className="text-3xl font-extrabold text-emerald-600">${unitPrice.toLocaleString('es-AR', { minimumFractionDigits: 0 })}</span>
                {combo.originalPrice > 0 && (
                  <>
                    <span className="text-lg text-gray-400 line-through mb-0.5">${combo.originalPrice.toLocaleString('es-AR', { minimumFractionDigits: 0 })}</span>
                    <Badge className="bg-red-100 text-red-600 text-xs mb-0.5">-{discount}%</Badge>
                  </>
                )}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide mb-2">Descripcion</h3>
              <p className="text-gray-600 leading-relaxed text-[15px]">{combo.description}</p>
            </div>

            <Separator />

            {/* Combo Items */}
            <div>
              <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide mb-3">Que incluye este combo</h3>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-2">
                {combo.items.split('\n').filter(Boolean).map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-amber-700" />
                    </div>
                    <span className="text-sm text-amber-900">{item.trim()}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Quantity */}
            <div>
              <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide mb-3">Cantidad</h3>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-lg"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}><Minus className="w-4 h-4" /></Button>
                <div className="h-10 w-14 flex items-center justify-center font-semibold text-lg border-y rounded-none bg-gray-50">{quantity}</div>
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-lg"
                  onClick={() => setQuantity(quantity + 1)}><Plus className="w-4 h-4" /></Button>
                <span className="text-sm text-gray-400 ml-3">Subtotal: ${(unitPrice * quantity).toLocaleString('es-AR', { minimumFractionDigits: 0 })}</span>
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
              <div className="flex justify-between text-sm text-gray-500"><span>Precio del combo</span><span>${unitPrice.toLocaleString('es-AR', { minimumFractionDigits: 0 })}</span></div>
              {combo.originalPrice > 0 && (
                <div className="flex justify-between text-sm text-red-500"><span>Ahorro (-{discount}%)</span><span>-${(combo.originalPrice - combo.price).toLocaleString('es-AR', { minimumFractionDigits: 0 })}</span></div>
              )}
              <div className="flex justify-between text-sm text-gray-500"><span>Cantidad</span><span>x{quantity}</span></div>
              <div className="flex justify-between text-sm text-gray-500"><span>Subtotal</span><span>${(unitPrice * quantity).toLocaleString('es-AR', { minimumFractionDigits: 0 })}</span></div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Envio ({shippingLabel})</span>
                <span>{shippingCost === 0 ? 'Gratis' : `$${shippingCost.toLocaleString('es-AR')}`}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900 text-lg">Total</span>
                <span className="font-extrabold text-emerald-600 text-2xl">${totalPrice.toLocaleString('es-AR', { minimumFractionDigits: 0 })}</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg">{error}</div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pb-4">
              <Button
                className="w-full h-14 bg-[#009ee3] hover:bg-[#0089c7] text-white text-base font-bold rounded-xl gap-3 shadow-lg"
                onClick={onMP}
                disabled={loading}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
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

            {/* Trust Features */}
            <div className="grid grid-cols-2 gap-3 pb-6">
              {[
                { icon: Shield, label: 'Compra segura', desc: 'Datos protegidos' },
                { icon: RotateCcw, label: 'Devoluciones', desc: '30 dias para devolver' },
                { icon: Package, label: 'Envio original', desc: 'Producto sellado' },
                { icon: CreditCard, label: 'Todos los medios', desc: 'MP / transferencia' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 p-3 rounded-lg bg-gray-50">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-700">{item.label}</p>
                    <p className="text-[10px] text-gray-400 truncate">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

/* ==============================
   PAYMENT RESULT SCREEN
   ============================== */
function PaymentResult({ status, onDismiss }: { status: 'exitoso' | 'fallido' | 'pendiente'; onDismiss: () => void }) {
  const config = {
    exitoso: {
      icon: CircleCheckBig,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      title: 'Pago exitoso!',
      subtitle: 'Tu pedido fue recibido correctamente. Te contactaremos a la brevedad para coordinar el envio.',
      btnLabel: 'Volver a la tienda',
      btnClass: 'bg-emerald-600 hover:bg-emerald-700',
    },
    fallido: {
      icon: CircleX,
      color: 'text-red-500',
      bg: 'bg-red-50',
      border: 'border-red-200',
      title: 'El pago no se completo',
      subtitle: 'Hubo un problema con el pago. Podes intentar nuevamente o contactarnos por WhatsApp.',
      btnLabel: 'Volver a intentar',
      btnClass: 'bg-red-500 hover:bg-red-600',
    },
    pendiente: {
      icon: CircleAlert,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      title: 'Pago pendiente',
      subtitle: 'Tu pago esta siendo procesado. Te enviaremos una confirmacion por email cuando se acredite.',
      btnLabel: 'Volver a la tienda',
      btnClass: 'bg-amber-500 hover:bg-amber-600',
    },
  }

  const c = config[status]
  const CIcon = c.icon

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center"
      >
        <div className={`${c.bg} ${c.border} border-2 rounded-3xl p-10 space-y-6`}>
          <div className={`w-20 h-20 ${c.bg} rounded-full flex items-center justify-center mx-auto`}>
            <CIcon className={`w-10 h-10 ${c.color}`} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{c.title}</h1>
            <p className="text-gray-500 mt-3 leading-relaxed">{c.subtitle}</p>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <Button className={`w-full h-13 ${c.btnClass} text-white font-bold rounded-xl text-base gap-2`}
              onClick={onDismiss}>
              Volver a la tienda
            </Button>
            {status !== 'exitoso' && (
              <Button variant="outline" className="w-full h-11 rounded-xl gap-2" onClick={() => window.open('https://wa.me/', '_blank')}>
                <MessageCircle className="w-4 h-4" />
                Contactar por WhatsApp
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

/* ==============================
   MAIN LANDING PAGE
   ============================== */
export default function LandingPage({ products, combos, onGoToAdmin, paymentStatus }: LandingPageProps) {
  // Payment result view
  if (paymentStatus) {
    return (
      <PaymentResult
        status={paymentStatus as 'exitoso' | 'fallido' | 'pendiente'}
        onDismiss={() => { window.location.hash = '' }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center gap-3">
              <img src="/capilux-logo.png" alt="Capilux" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover" />
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">Capilux</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#productos" className="text-gray-600 hover:text-emerald-600 transition-colors font-medium">Productos</a>
              <a href="#combos" className="text-gray-600 hover:text-emerald-600 transition-colors font-medium">Combos</a>
            </div>
            <Button variant="ghost" size="sm" onClick={onGoToAdmin} className="text-gray-400 hover:text-emerald-600 text-xs">Admin</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-400">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-yellow-300 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center">
            <Badge className="mb-6 bg-white/20 text-white border-0 text-sm px-4 py-2 backdrop-blur-sm">Nutricion Premium para tu Bienestar</Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Tu cuerpo merece<span className="block text-yellow-300">lo mejor</span>
            </h1>
            <p className="text-lg sm:text-xl text-emerald-100 max-w-2xl mx-auto mb-10">
              Suplementos nutricionales de alta calidad formulados para potenciar tu salud, energia y bienestar general. Descubri la diferencia Capilux.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#productos"><Button size="lg" className="bg-white text-emerald-700 hover:bg-gray-100 font-bold text-lg px-8 py-6 rounded-full shadow-lg">Ver Productos</Button></a>
              <a href="#combos"><Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 font-bold text-lg px-8 py-6 rounded-full">Ver Combos</Button></a>
            </div>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* Trust Badges */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Shield, label: 'Calidad Garantizada', desc: 'Productos premium' },
              { icon: Truck, label: 'Envio Rapido', desc: 'A todo el pais' },
              { icon: Heart, label: '100% Natural', desc: 'Sin conservantes' },
              { icon: Star, label: 'Resultados Reales', desc: 'Hecho con ciencia' },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="flex flex-col items-center text-center p-4">
                <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-3"><item.icon className="w-7 h-7 text-emerald-600" /></div>
                <h3 className="font-bold text-gray-800 text-sm sm:text-base">{item.label}</h3>
                <p className="text-gray-400 text-xs sm:text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="productos" className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Nuestros Productos</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">Suplementos que transforman</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Cada producto Capilux esta formulado con los mejores ingredientes para garantizar resultados excepcionales.</p>
          </motion.div>
          {products.length > 0 ? (
            <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" variants={stagger} initial="initial" whileInView="animate" viewport={{ once: true }}>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-16">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Pronto tendremos productos disponibles</p>
            </div>
          )}
        </div>
      </section>

      {/* Combos Section */}
      {combos.length > 0 && (
        <section id="combos" className="py-16 sm:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="text-center mb-12">
              <Badge className="mb-4 bg-amber-100 text-amber-700 hover:bg-amber-100">Ofertas Especiales</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">Combos con descuento</h2>
              <p className="text-gray-500 max-w-xl mx-auto">Ahorra comprando nuestros combos exclusivos. La mejor relacion calidad-precio para tu nutricion diaria.</p>
            </motion.div>
            <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8" variants={stagger} initial="initial" whileInView="animate" viewport={{ once: true }}>
              {combos.map((combo) => (
                <ComboCard key={combo.id} combo={combo} />
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-emerald-600 to-teal-500 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-20 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-48 h-48 bg-yellow-300 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">Comenza hoy tu transformacion</h2>
            <p className="text-emerald-100 text-lg sm:text-xl mb-8 max-w-2xl mx-auto">Unite a miles de personas que ya eligieron Capilux para mejorar su calidad de vida.</p>
            <Button size="lg" className="bg-white text-emerald-700 hover:bg-gray-100 font-bold text-lg px-10 py-6 rounded-full shadow-xl">Contactanos</Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <img src="/capilux-logo.png" alt="Capilux" className="w-10 h-10 rounded-full object-cover" />
              <span className="text-xl font-bold text-white">Capilux</span>
            </div>
            <div className="flex items-center gap-4">
              <CreditCard className="w-5 h-5" />
              <span className="text-xs">Pagos seguros con MercadoPago</span>
            </div>
            <p className="text-sm">Todos los derechos reservados. Capilux {new Date().getFullYear()}</p>
          </div>
        </div>
      </footer>

    </div>
  )
}
