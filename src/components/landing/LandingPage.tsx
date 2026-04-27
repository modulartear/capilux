'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Check,
  Star,
  Shield,
  Truck,
  Heart,
  Package,
  CreditCard,
  MessageCircle,
  CircleCheckBig,
  CircleX,
  CircleAlert,
  ShoppingCart,
  Plus,
} from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { CartSheet } from '@/components/cart/CartSheet'

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

function ProductCard({ product }: { product: Product }) {
  const [imgIndex, setImgIndex] = useState(0)
  const [addedToCart, setAddedToCart] = useState(false)
  const images = [product.image1, product.image2].filter(Boolean) as string[]
  const { addItem } = useCart()

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image1,
      type: 'product',
    })
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 1500)
  }

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
          {/* Add to cart button overlay */}
          <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleAddToCart}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold shadow-lg transition-all ${
                addedToCart
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              {addedToCart ? 'Agregado!' : 'Agregar'}
            </motion.button>
          </div>
        </div>
        <CardContent className="p-5">
          <h3 className="font-bold text-lg text-gray-800 mb-2">{product.name}</h3>
          <p className="text-gray-500 text-sm line-clamp-2">{product.description}</p>
          {/* Mobile add to cart button */}
          <button
            onClick={handleAddToCart}
            className={`mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all md:hidden ${
              addedToCart
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <Plus className="w-4 h-4" />
            {addedToCart ? 'Agregado al carrito' : 'Agregar al carrito'}
          </button>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function ComboCard({ combo }: { combo: Combo }) {
  const [imgIndex, setImgIndex] = useState(0)
  const [addedToCart, setAddedToCart] = useState(false)
  const images = [combo.image1, combo.image2].filter(Boolean) as string[]
  const discount = combo.originalPrice > 0 ? Math.round((1 - combo.price / combo.originalPrice) * 100) : 0
  const { addItem } = useCart()

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    addItem({
      id: combo.id,
      name: combo.name,
      price: combo.price,
      image: combo.image1,
      type: 'combo',
    })
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 1500)
  }

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
          {/* Add to cart button overlay */}
          <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleAddToCart}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold shadow-lg transition-all ${
                addedToCart
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              {addedToCart ? 'Agregado!' : 'Agregar'}
            </motion.button>
          </div>
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
          {/* Mobile add to cart button */}
          <button
            onClick={handleAddToCart}
            className={`mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all md:hidden ${
              addedToCart
                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Plus className="w-4 h-4" />
            {addedToCart ? 'Agregado al carrito' : 'Agregar al carrito'}
          </button>
        </CardContent>
      </Card>
    </motion.div>
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
            <div className="flex items-center gap-1">
              <CartSheet />
              <Button variant="ghost" size="sm" onClick={onGoToAdmin} className="text-gray-400 hover:text-emerald-600 text-xs">Admin</Button>
            </div>
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
