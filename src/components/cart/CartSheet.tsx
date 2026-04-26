'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  X,
  Package,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react'
import { useCart, type CartItem } from '@/context/CartContext'

function CartItemRow({ item, onUpdate, onRemove }: { item: CartItem; onUpdate: (id: string, qty: number) => void; onRemove: (id: string) => void }) {
  const [removing, setRemoving] = useState(false)

  const handleRemove = () => {
    setRemoving(true)
    setTimeout(() => onRemove(item.id), 300)
  }

  return (
    <AnimatePresence>
      {!removing ? (
        <motion.div
          layout
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20, height: 0 }}
          transition={{ duration: 0.3 }}
          className="flex gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100"
        >
          {/* Image */}
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-emerald-50 flex-shrink-0">
            {item.image ? (
              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-emerald-300">
                <Package className="w-6 h-6" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="font-semibold text-gray-800 text-sm truncate">{item.name}</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {item.type === 'combo' && (
                    <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0 h-4">COMBO</Badge>
                  )}
                </div>
              </div>
              <button
                onClick={handleRemove}
                className="p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between mt-2">
              {/* Quantity Controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onUpdate(item.id, item.quantity - 1)}
                  className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <Minus className="w-3 h-3 text-gray-600" />
                </button>
                <span className="w-8 text-center font-semibold text-sm text-gray-800">{item.quantity}</span>
                <button
                  onClick={() => onUpdate(item.id, item.quantity + 1)}
                  className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <Plus className="w-3 h-3 text-gray-600" />
                </button>
              </div>

              {/* Price */}
              <span className="font-bold text-emerald-600 text-sm">
                ${(item.price * item.quantity).toLocaleString('es-AR', { minimumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

export function CartSheet() {
  const { items, totalItems, totalPrice, updateQuantity, removeItem, clearCart } = useCart()

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 p-2 rounded-full transition-all"
        >
          <ShoppingCart className="w-5 h-5" />
          {totalItems > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1"
            >
              {totalItems}
            </motion.span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-gray-100">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
            Mi Carrito
            {totalItems > 0 && (
              <Badge className="bg-emerald-100 text-emerald-700 text-xs ml-1">{totalItems} {totalItems === 1 ? 'item' : 'items'}</Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                <ShoppingCart className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">Tu carrito esta vacio</p>
              <p className="text-gray-400 text-sm mt-1">Agrega productos para comenzar</p>
            </div>
          ) : (
            <AnimatePresence>
              {items.map(item => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  onUpdate={updateQuantity}
                  onRemove={removeItem}
                />
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <SheetFooter className="border-t border-gray-100 px-5 py-4 space-y-4 bg-white">
            {/* Total */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal ({totalItems} {totalItems === 1 ? 'producto' : 'productos'})</span>
                <span>${totalPrice.toLocaleString('es-AR', { minimumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <span className="font-bold text-gray-900 text-lg">Total</span>
                <span className="font-extrabold text-emerald-600 text-2xl">
                  ${totalPrice.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl gap-2 shadow-lg shadow-emerald-600/20"
                onClick={() => {
                  window.location.href = '/carrito'
                }}
              >
                Finalizar Compra
                <ArrowRight className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-red-500 text-xs"
                onClick={clearCart}
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Vaciar carrito
              </Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
