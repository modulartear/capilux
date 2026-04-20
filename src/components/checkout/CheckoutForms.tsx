'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Truck,
  Clock,
  MapPin,
  Loader2,
  User,
  Mail,
  Phone,
  FileText,
  Building2,
} from 'lucide-react'

/* ==============================
   SHIPPING OPTION
   ============================== */
export interface ShippingOption {
  id: string
  label: string
  description: string
  cost: number
  estimatedDays: string
  serviceType: string
}

export const fallbackShipping = {
  standard: { id: 'standard', label: 'Envio Estandar', description: '3 a 7 dias habiles', cost: 0, estimatedDays: '3 a 7 dias habiles', serviceType: 'estandar' },
  express: { id: 'express', label: 'Envio Express', description: '1 a 2 dias habiles', cost: 3500, estimatedDays: '1 a 2 dias habiles', serviceType: 'express' },
}

/* ==============================
   BUYER FORM
   ============================== */
export function BuyerForm({
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
   SHIPPING ADDRESS FORM
   ============================== */
export function ShippingAddressForm({
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
   SHIPPING SELECTOR
   ============================== */
export function ShippingSelector({
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
export async function handleMercadoPago(params: {
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
  if (data.initPoint) {
    window.location.href = data.initPoint
  }
}
