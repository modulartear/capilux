'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useCart, type CartItem } from '@/context/CartContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  Package,
  ShoppingBag,
  ShoppingCart,
  Loader2,
  MessageCircle,
  MapPin,
  User,
  Phone,
  Mail,
  CreditCard,
  FileText,
  CheckCircle,
} from 'lucide-react'

export default function CarritoPage() {
  const { items, totalItems, totalPrice, updateQuantity, removeItem, clearCart } = useCart()

  // Form state
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [dni, setDni] = useState('')
  const [provincia, setProvincia] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [direccion, setDireccion] = useState('')
  const [numero, setNumero] = useState('')
  const [piso, setPiso] = useState('')
  const [codigoPostal, setCodigoPostal] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const shippingCost = 0
  const grandTotal = totalPrice + shippingCost

  const handleMPCheckout = async () => {
    setError('')

    if (!nombre.trim() || !email.trim() || !telefono.trim() || !dni.trim()) {
      setError('Completa todos los datos del comprador')
      return
    }
    if (!provincia.trim() || !ciudad.trim() || !direccion.trim() || !codigoPostal.trim()) {
      setError('Completa todos los campos de envio obligatorios')
      return
    }
    if (items.length === 0) {
      setError('El carrito esta vacio')
      return
    }

    setLoading(true)
    try {
      // Create one order per cart item
      const orderPromises = items.map(async (item) => {
        const orderRes = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itemType: item.type,
            itemId: item.id,
            itemName: item.name,
            itemPrice: item.price,
            quantity: item.quantity,
            subtotal: item.price * item.quantity,
            buyerName: nombre.trim(),
            buyerEmail: email.trim(),
            buyerPhone: telefono.trim(),
            buyerDni: dni.trim(),
            shippingCost: 0,
            total: item.price * item.quantity,
            shippingProvince: provincia.trim(),
            shippingCity: ciudad.trim(),
            shippingStreet: direccion.trim(),
            shippingNumber: numero.trim(),
            shippingFloor: piso.trim() || null,
            shippingCp: codigoPostal.trim(),
          }),
        })
        if (!orderRes.ok) {
          const data = await orderRes.json()
          throw new Error(data.error || 'Error al crear pedido')
        }
        return await orderRes.json()
      })

      const orderResults = await Promise.all(orderPromises)

      // Create MP preference with all items
      const mpItems = items.map(item => ({
        title: item.name,
        description: `${item.type === 'combo' ? 'Combo' : 'Producto'} - ${item.name}`,
        price: item.price,
        quantity: item.quantity,
        itemType: item.type,
        itemId: item.id,
        unit_price: item.price,
        currency_id: 'ARS',
        category_id: item.type === 'combo' ? 'combo' : 'supplements',
      }))

      const prefRes = await fetch('/api/payments/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: items.length === 1 ? items[0].name : `Compra Capilux - ${items.length} productos`,
          description: `Pedido de ${nombre}`,
          price: items[0].price,
          quantity: items[0].quantity,
          shippingCost: 0,
          buyerName: nombre.trim(),
          buyerEmail: email.trim(),
          buyerPhone: telefono.trim(),
          buyerDni: dni.trim(),
          itemType: items[0].type,
          itemId: items[0].id,
          shippingProvince: provincia.trim(),
          shippingCity: ciudad.trim(),
          shippingStreet: direccion.trim(),
          shippingNumber: numero.trim(),
          shippingFloor: piso.trim() || null,
          shippingCp: codigoPostal.trim(),
          orderId: orderResults[0]?.orderId,
        }),
      })

      if (!prefRes.ok) {
        const data = await prefRes.json()
        throw new Error(data.error || 'Error al crear preferencia de pago')
      }

      const prefData = await prefRes.json()

      // Clear cart and redirect to MP
      clearCart()
      if (prefData.initPoint) {
        window.location.href = prefData.initPoint
      }
    } catch (err: any) {
      setError(err.message || 'Error al procesar la compra')
    } finally {
      setLoading(false)
    }
  }

  const handleWhatsApp = () => {
    if (!nombre.trim() || !telefono.trim()) {
      setError('Ingresa tu nombre y telefono para consultar por WhatsApp')
      return
    }
    const cartText = items.map(i => `- ${i.name} x${i.quantity} ($${(i.price * i.quantity).toLocaleString('es-AR')})`).join('\n')
    const msg = `Hola! Quiero hacer un pedido:\n\n${cartText}\n\nTotal: $${totalPrice.toLocaleString('es-AR')}\n\nNombre: ${nombre}\nEnvio: ${direccion} ${numero}${piso ? `, ${piso}` : ''}, ${ciudad}, ${provincia} (CP: ${codigoPostal})`
    const encoded = encodeURIComponent(msg)
    window.open(`https://wa.me/?text=${encoded}`, '_blank')
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-emerald-600 transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            Volver a la tienda
          </Link>
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 rounded-full bg-gray-50 flex items-center justify-center mb-6">
              <ShoppingCart className="w-12 h-12 text-gray-300" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Tu carrito esta vacio</h1>
            <p className="text-gray-400 mb-8">Agrega productos para comenzar tu compra</p>
            <Link href="/">
              <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-xl px-8 h-12 gap-2">
                <ShoppingBag className="w-4 h-4" />
                Ver productos
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-emerald-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Volver</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
            <h1 className="text-xl font-bold text-gray-800">Mi Carrito</h1>
            <Badge className="bg-emerald-100 text-emerald-700">{totalItems} {totalItems === 1 ? 'item' : 'items'}</Badge>
          </div>
          <div className="w-[100px]" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left - Cart Items */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-gray-800">Productos</h2>
              <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600 text-xs gap-1" onClick={clearCart}>
                <Trash2 className="w-3.5 h-3.5" />
                Vaciar carrito
              </Button>
            </div>

            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20, height: 0 }}
                  className="flex gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100"
                >
                  {/* Image */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-emerald-50 flex-shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-emerald-300">
                        <Package className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-800 text-sm sm:text-base truncate">{item.name}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {item.type === 'combo' && (
                            <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0 h-4">COMBO</Badge>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      {/* Quantity */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-100 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5 text-gray-600" />
                        </button>
                        <span className="w-8 text-center font-semibold text-sm text-gray-800">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-100 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5 text-gray-600" />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="text-xs text-gray-400">${item.price.toLocaleString('es-AR')} c/u</p>
                        <span className="font-bold text-emerald-600 text-base sm:text-lg">
                          ${(item.price * item.quantity).toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Right - Checkout Form */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 space-y-4">
              {/* Shipping Form */}
              <Card className="border-gray-200">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-bold text-gray-800">Direccion de Envio</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 sm:col-span-1 space-y-1.5">
                      <Label htmlFor="provincia" className="text-xs font-medium text-gray-600">Provincia *</Label>
                      <Input
                        id="provincia"
                        value={provincia}
                        onChange={(e) => setProvincia(e.target.value)}
                        placeholder="Ej: Buenos Aires"
                        className="h-10"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1 space-y-1.5">
                      <Label htmlFor="ciudad" className="text-xs font-medium text-gray-600">Localidad / Ciudad *</Label>
                      <Input
                        id="ciudad"
                        value={ciudad}
                        onChange={(e) => setCiudad(e.target.value)}
                        placeholder="Ej: CABA"
                        className="h-10"
                      />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label htmlFor="direccion" className="text-xs font-medium text-gray-600">Direccion *</Label>
                      <Input
                        id="direccion"
                        value={direccion}
                        onChange={(e) => setDireccion(e.target.value)}
                        placeholder="Ej: Av. Corrientes"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="numero" className="text-xs font-medium text-gray-600">Numero</Label>
                      <Input
                        id="numero"
                        value={numero}
                        onChange={(e) => setNumero(e.target.value)}
                        placeholder="1234"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="piso" className="text-xs font-medium text-gray-600">Piso / Depto</Label>
                      <Input
                        id="piso"
                        value={piso}
                        onChange={(e) => setPiso(e.target.value)}
                        placeholder="3B"
                        className="h-10"
                      />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label htmlFor="cp" className="text-xs font-medium text-gray-600">Codigo Postal *</Label>
                      <Input
                        id="cp"
                        value={codigoPostal}
                        onChange={(e) => setCodigoPostal(e.target.value)}
                        placeholder="C1414"
                        className="h-10"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Buyer Info */}
              <Card className="border-gray-200">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-bold text-gray-800">Datos del Comprador</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="nombre" className="text-xs font-medium text-gray-600">Nombre completo *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre completo" className="pl-10 h-10" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs font-medium text-gray-600">Email *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" className="pl-10 h-10" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="telefono" className="text-xs font-medium text-gray-600">Telefono *</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input id="telefono" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="11 1234-5678" className="pl-10 h-10" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="dni" className="text-xs font-medium text-gray-600">DNI *</Label>
                        <div className="relative">
                          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input id="dni" value={dni} onChange={(e) => setDni(e.target.value)} placeholder="12345678" className="pl-10 h-10" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card className="border-gray-200">
                <CardContent className="p-5 space-y-3">
                  <h3 className="font-bold text-gray-800 mb-2">Resumen del Pedido</h3>
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600 truncate mr-2">{item.name} x{item.quantity}</span>
                      <span className="font-medium text-gray-800 flex-shrink-0">${(item.price * item.quantity).toLocaleString('es-AR', { minimumFractionDigits: 0 })}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="text-gray-700">${totalPrice.toLocaleString('es-AR', { minimumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Envio</span>
                    <span className="text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Gratis
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                    <span className="font-bold text-gray-900 text-lg">Total</span>
                    <span className="font-extrabold text-emerald-600 text-2xl">
                      ${grandTotal.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleMPCheckout}
                  disabled={loading}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl gap-2 shadow-lg shadow-emerald-600/20 text-base"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CreditCard className="w-5 h-5" />
                  )}
                  {loading ? 'Procesando...' : 'Finalizar Compra con MercadoPago'}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleWhatsApp}
                  disabled={loading}
                  className="w-full h-11 rounded-xl gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  Consultar por WhatsApp
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
