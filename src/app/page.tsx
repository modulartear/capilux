'use client'

import { useState, useEffect, useCallback } from 'react'
import { CartProvider } from '@/context/CartContext'

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

export default function Home() {
  const [view, setView] = useState<'landing' | 'dashboard'>('landing')
  const [products, setProducts] = useState<Product[]>([])
  const [combos, setCombos] = useState<Combo[]>([])
  const [LandingPage, setLandingPage] = useState<React.ComponentType<any> | null>(null)
  const [DashboardPage, setDashboardPage] = useState<React.ComponentType<any> | null>(null)

  // Dynamic imports
  useEffect(() => {
    import('@/components/landing/LandingPage').then((mod) => {
      setLandingPage(() => mod.default)
    })
    import('@/components/dashboard/Dashboard').then((mod) => {
      setDashboardPage(() => mod.default)
    })
  }, [])

  // Payment status from hash
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null)

  // Hash routing
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash
      if (hash === '#dashboard') {
        setView('dashboard')
        setPaymentStatus(null)
      } else if (hash === '#pago-exitoso') {
        setView('landing')
        setPaymentStatus('exitoso')
      } else if (hash === '#pago-fallido') {
        setView('landing')
        setPaymentStatus('fallido')
      } else if (hash === '#pago-pendiente') {
        setView('landing')
        setPaymentStatus('pendiente')
      } else {
        setView('landing')
        setPaymentStatus(null)
      }
    }
    handleHash()
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])

  // Fetch data for landing page
  const fetchLandingData = useCallback(async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/combos'),
      ])
      const pData = await pRes.json()
      const cData = await cRes.json()
      setProducts(Array.isArray(pData) ? pData : [])
      setCombos(Array.isArray(cData) ? cData : [])
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    fetchLandingData()
  }, [fetchLandingData])

  if (view === 'dashboard' && DashboardPage) {
    return (
      <DashboardPage
        onGoBack={() => {
          window.location.hash = ''
          setView('landing')
          fetchLandingData()
        }}
      />
    )
  }

  if (view === 'landing' && LandingPage) {
    return (
      <CartProvider>
        <LandingPage
          products={products}
          combos={combos}
          onGoToAdmin={() => {
            window.location.hash = '#dashboard'
            setView('dashboard')
          }}
          paymentStatus={paymentStatus}
        />
      </CartProvider>
    )
  }

  // Loading state
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <img src="/capilux-logo.png" alt="Capilux" className="w-20 h-20 rounded-full mx-auto mb-4 object-cover" />
        <p className="text-gray-400">Cargando...</p>
      </div>
    </div>
  )
}
