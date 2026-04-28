'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  LogOut,
  Package,
  Layers,
  Eye,
  EyeOff,
  Loader2,
  ImageIcon,
  X,
  Settings,
  CreditCard,
  Globe,
  Check,
  Truck,
  ClipboardList,
  RefreshCw,
  ExternalLink,
  Search,
  Download,
  ChevronDown,
  ChevronUp,
  Save,
  StickyNote,
  Sparkles,
  Link2,
} from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string
  price: number
  image1: string | null
  image2: string | null
  isActive: boolean
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
  isActive: boolean
}

interface Order {
  id: string
  itemType: string
  itemId: string
  itemName: string
  itemPrice: number
  quantity: number
  subtotal: number
  buyerName: string
  buyerEmail: string
  buyerPhone: string | null
  buyerDni: string | null
  shippingMethod: string | null
  shippingCost: number
  shippingAddress: string | null
  shippingProvince: string | null
  shippingCity: string | null
  shippingStreet: string | null
  shippingNumber: string | null
  shippingFloor: string | null
  shippingCp: string | null
  total: number
  paymentStatus: string
  paymentRef: string | null
  shippingStatus: string
  notes: string | null
  createdAt: string
  updatedAt: string
}

interface LandingPageItem {
  id: string
  slug: string
  productId: string | null
  productName: string
  headline: string
  heroImage1: string | null
  isActive: boolean
  createdAt: string
  product?: { name: string; price: number; image1: string | null } | null
}

interface DashboardProps {
  onGoBack: () => void
}

function ImageUpload({
  label,
  value,
  onChange,
}: {
  label: string
  value: string | null
  onChange: (val: string | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no puede superar los 5MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => onChange(reader.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-700">{label}</Label>
      <div className="relative">
        {value ? (
          <div className="relative group">
            <img src={value} alt="" className="w-full aspect-video object-cover rounded-lg border" />
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full aspect-video rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-emerald-400 hover:text-emerald-500 transition-colors"
          >
            <ImageIcon className="w-8 h-8" />
            <span className="text-sm">Subir imagen</span>
            <span className="text-xs text-gray-300">Max 5MB</span>
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
        />
      </div>
    </div>
  )
}

function ProductForm({
  product,
  onSave,
  onCancel,
  loading,
}: {
  product?: Product | null
  onSave: (data: any) => void
  onCancel: () => void
  loading: boolean
}) {
  const [name, setName] = useState(product?.name ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [price, setPrice] = useState(product?.price.toString() ?? '')
  const [image1, setImage1] = useState<string | null>(product?.image1 ?? null)
  const [image2, setImage2] = useState<string | null>(product?.image2 ?? null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ name, description, price, image1, image2 })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <ImageUpload label="Imagen Principal" value={image1} onChange={setImage1} />
        <ImageUpload label="Imagen Secundaria" value={image2} onChange={setImage2} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pname">Nombre del Producto</Label>
        <Input id="pname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Colageno Hidrolizado" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pdesc">Descripcion</Label>
        <Textarea id="pdesc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe el producto, sus beneficios, modo de uso..." rows={4} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pprice">Precio ($)</Label>
        <Input id="pprice" type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Ej: 15000" required />
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {product ? 'Actualizar Producto' : 'Crear Producto'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Cancelar</Button>
      </div>
    </form>
  )
}

function ComboForm({
  combo,
  onSave,
  onCancel,
  loading,
}: {
  combo?: Combo | null
  onSave: (data: any) => void
  onCancel: () => void
  loading: boolean
}) {
  const [name, setName] = useState(combo?.name ?? '')
  const [description, setDescription] = useState(combo?.description ?? '')
  const [items, setItems] = useState(combo?.items ?? '')
  const [originalPrice, setOriginalPrice] = useState(combo?.originalPrice?.toString() ?? '')
  const [price, setPrice] = useState(combo?.price.toString() ?? '')
  const [image1, setImage1] = useState<string | null>(combo?.image1 ?? null)
  const [image2, setImage2] = useState<string | null>(combo?.image2 ?? null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ name, description, items, originalPrice, price, image1, image2 })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <ImageUpload label="Imagen Principal" value={image1} onChange={setImage1} />
        <ImageUpload label="Imagen Secundaria" value={image2} onChange={setImage2} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cname">Nombre del Combo</Label>
        <Input id="cname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Combo Vitalidad Completa" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cdesc">Descripcion</Label>
        <Textarea id="cdesc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe el combo y sus beneficios..." rows={3} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="citems">Que incluye (un item por linea)</Label>
        <Textarea id="citems" value={items} onChange={(e) => setItems(e.target.value)} placeholder={"Colageno Hidrolizado x1\nVitamina C x1\nOmega 3 x1"} rows={4} required />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="corig">Precio Original ($)</Label>
          <Input id="corig" type="number" step="0.01" min="0" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} placeholder="Suma de precios individuales" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cprice">Precio Combo ($)</Label>
          <Input id="cprice" type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Precio con descuento" required />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading} className="flex-1 bg-amber-600 hover:bg-amber-700">
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {combo ? 'Actualizar Combo' : 'Crear Combo'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Cancelar</Button>
      </div>
    </form>
  )
}

const SHIPPING_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente', color: 'bg-gray-100 text-gray-600' },
  { value: 'preparing', label: 'Preparando', color: 'bg-amber-100 text-amber-700' },
  { value: 'shipped', label: 'Enviado', color: 'bg-blue-100 text-blue-700' },
  { value: 'delivered', label: 'Entregado', color: 'bg-emerald-100 text-emerald-700' },
]

const PAYMENT_STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'approved', label: 'Aprobado' },
  { value: 'rejected', label: 'Rechazado' },
  { value: 'in_process', label: 'En proceso' },
]

const SHIPPING_FILTER_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'preparing', label: 'Preparando' },
  { value: 'shipped', label: 'Enviado' },
  { value: 'delivered', label: 'Entregado' },
]

export default function Dashboard({ onGoBack }: DashboardProps) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const [products, setProducts] = useState<Product[]>([])
  const [combos, setCombos] = useState<Combo[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [activeTab, setActiveTab] = useState('productos')

  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showComboForm, setShowComboForm] = useState(false)
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  // Config states
  const [mpToken, setMpToken] = useState('')
  const [siteURL, setSiteURL] = useState('')
  const [minimaxApiKey, setMinimaxApiKey] = useState('')
  const [configLoading, setConfigLoading] = useState(false)
  const [configSaved, setConfigSaved] = useState(false)

  // Orders filter/search states
  const [orderSearch, setOrderSearch] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [shippingFilter, setShippingFilter] = useState('all')
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)

  // Dropi states
  const [dropiIntegrationKey, setDropiIntegrationKey] = useState('')
  const [dropiCountry, setDropiCountry] = useState('AR')
  const [dropiToken, setDropiToken] = useState('')
  const [dropiConnected, setDropiConnected] = useState(false)
  const [dropiConnecting, setDropiConnecting] = useState(false)
  const [dropiError, setDropiError] = useState('')
  const [dropiSearch, setDropiSearch] = useState('')
  const [dropiProducts, setDropiProducts] = useState<any[]>([])
  const [dropiTotal, setDropiTotal] = useState(0)
  const [dropiPage, setDropiPage] = useState(0)
  const [dropiLoading, setDropiLoading] = useState(false)
  const [dropiImporting, setDropiImporting] = useState<string | null>(null)

  // Landing states
  const [landings, setLandings] = useState<LandingPageItem[]>([])
  const [generatingLanding, setGeneratingLanding] = useState<string | null>(null)
  const [landingStep, setLandingStep] = useState('')
  const [showLandingOverlay, setShowLandingOverlay] = useState(false)

  // Fetch landings
  const fetchLandings = useCallback(async () => {
    try {
      const res = await fetch('/api/landings')
      if (res.ok) {
        const data = await res.json()
        setLandings(Array.isArray(data) ? data : [])
      }
    } catch {
      // ignore
    }
  }, [])

  const handleGenerateLanding = async (productId: string) => {
    setGeneratingLanding(productId)
    setShowLandingOverlay(true)
    setLandingStep('Creando landing...')
    try {
      // Step 1: Create landing
      const res = await fetch('/api/landings/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      })
      if (!res.ok) {
        const data = await res.json()
        setLandingStep(`Error: ${data.error || 'No se pudo generar'}`)
        setTimeout(() => { setShowLandingOverlay(false); setGeneratingLanding(null) }, 3000)
        return
      }
      const data = await res.json()
      const landingId = data.landing.id

      // Step 2: Generate 3 before/after images (one by one)
      setLandingStep('Generando fotos antes/despues...')
      let generatedCount = 0
      for (let i = 0; i < 3; i++) {
        setLandingStep(`Generando foto ${i + 1} de 3...`)
        try {
          const mediaRes = await fetch('/api/landings/process-media', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ landingId, imageIndex: i }),
          })
          if (mediaRes.ok) generatedCount++
        } catch { /* continue */ }
      }

      if (generatedCount > 0) {
        setLandingStep('Landing creada con fotos!')
      } else {
        setLandingStep('Landing creada')
      }
      fetchLandings()
      setTimeout(() => { setShowLandingOverlay(false); setGeneratingLanding(null); setActiveTab('landings') }, 1500)
    } catch {
      setLandingStep('Error de conexion')
      setTimeout(() => { setShowLandingOverlay(false); setGeneratingLanding(null) }, 3000)
    }
  }

  const handleDeleteLanding = async (slug: string) => {
    if (!confirm('Eliminar esta landing page?')) return
    await fetch(`/api/landings/${slug}`, { method: 'DELETE' })
    fetchLandings()
  }

  // Fetch config
  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/config')
      if (res.ok) {
        const data = await res.json()
        if (data.MP_ACCESS_TOKEN) setMpToken(data.MP_ACCESS_TOKEN)
        if (data.NEXT_PUBLIC_SITE_URL) setSiteURL(data.NEXT_PUBLIC_SITE_URL)
        if (data.MINIMAX_API_KEY) setMinimaxApiKey(data.MINIMAX_API_KEY)
        if (data.DROPI_TOKEN) {
          setDropiToken(data.DROPI_TOKEN)
          setDropiIntegrationKey(data.DROPI_TOKEN)
          setDropiConnected(true)
        }
        if (data.DROPI_COUNTRY) setDropiCountry(data.DROPI_COUNTRY)
      }
    } catch {
      // ignore
    }
  }, [])

  const handleSaveConfig = async () => {
    setConfigLoading(true)
    setConfigSaved(false)
    try {
      await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs: { MP_ACCESS_TOKEN: mpToken, NEXT_PUBLIC_SITE_URL: siteURL, MINIMAX_API_KEY: minimaxApiKey } }),
      })
      setConfigSaved(true)
    } finally {
      setConfigLoading(false)
    }
  }

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders')
      if (res.ok) {
        const data = await res.json()
        setOrders(Array.isArray(data) ? data : [])
      }
    } catch {
      // ignore
    }
  }, [])

  const handleUpdateShippingStatus = async (orderId: string, shippingStatus: string) => {
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shippingStatus }),
      })
      fetchOrders()
    } catch {
      // ignore
    }
  }

  const handleUpdateNotes = async (orderId: string, notes: string) => {
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })
      fetchOrders()
    } catch {
      // ignore
    }
  }

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth')
      if (res.ok) {
        setAuthenticated(true)
      } else {
        setAuthenticated(false)
      }
    } catch {
      setAuthenticated(false)
    }
  }, [])

  useEffect(() => { checkAuth() }, [checkAuth])

  const fetchData = useCallback(async () => {
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
    if (authenticated) {
      fetchData()
      fetchConfig()
      fetchOrders()
      fetchLandings()
    }
  }, [authenticated, fetchData, fetchConfig, fetchOrders, fetchLandings])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (res.ok) {
        setAuthenticated(true)
      } else {
        const data = await res.json()
        setLoginError(data.error || 'Error al iniciar sesion')
      }
    } catch {
      setLoginError('Error de conexion')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' })
    setAuthenticated(false)
    setEmail('')
    setPassword('')
  }

  const handleSaveProduct = async (data: any) => {
    setFormLoading(true)
    try {
      if (editingProduct) {
        const res = await fetch(`/api/products/${editingProduct.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        if (res.ok) { setShowProductForm(false); setEditingProduct(null); fetchData() }
      } else {
        const res = await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        if (res.ok) { setShowProductForm(false); fetchData() }
      }
    } finally { setFormLoading(false) }
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Estas seguro de eliminar este producto?')) return
    await fetch(`/api/products/${id}`, { method: 'DELETE' })
    fetchData()
  }

  const handleToggleProduct = async (product: Product) => {
    await fetch(`/api/products/${product.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !product.isActive }) })
    fetchData()
  }

  const handleSaveCombo = async (data: any) => {
    setFormLoading(true)
    try {
      if (editingCombo) {
        const res = await fetch(`/api/combos/${editingCombo.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        if (res.ok) { setShowComboForm(false); setEditingCombo(null); fetchData() }
      } else {
        const res = await fetch('/api/combos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        if (res.ok) { setShowComboForm(false); fetchData() }
      }
    } finally { setFormLoading(false) }
  }

  const handleDeleteCombo = async (id: string) => {
    if (!confirm('Estas seguro de eliminar este combo?')) return
    await fetch(`/api/combos/${id}`, { method: 'DELETE' })
    fetchData()
  }

  const handleToggleCombo = async (combo: Combo) => {
    await fetch(`/api/combos/${combo.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !combo.isActive }) })
    fetchData()
  }

  const paymentStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-emerald-100 text-emerald-700'
      case 'rejected': return 'bg-red-100 text-red-700'
      case 'in_process': return 'bg-amber-100 text-amber-700'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const paymentStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Aprobado'
      case 'rejected': return 'Rechazado'
      case 'in_process': return 'En proceso'
      default: return 'Pendiente'
    }
  }

  const shippingStatusColor = (status: string) => {
    switch (status) {
      case 'preparing': return 'bg-amber-100 text-amber-700'
      case 'shipped': return 'bg-blue-100 text-blue-700'
      case 'delivered': return 'bg-emerald-100 text-emerald-700'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const shippingStatusLabel = (status: string) => {
    switch (status) {
      case 'preparing': return 'Preparando'
      case 'shipped': return 'Enviado'
      case 'delivered': return 'Entregado'
      default: return 'Pendiente'
    }
  }

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = orderSearch === '' ||
        order.buyerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
        order.buyerEmail.toLowerCase().includes(orderSearch.toLowerCase()) ||
        order.itemName.toLowerCase().includes(orderSearch.toLowerCase()) ||
        order.id.toLowerCase().includes(orderSearch.toLowerCase())
      const matchesPayment = paymentFilter === 'all' || order.paymentStatus === paymentFilter
      const matchesShipping = shippingFilter === 'all' || order.shippingStatus === shippingFilter
      return matchesSearch && matchesPayment && matchesShipping
    })
  }, [orders, orderSearch, paymentFilter, shippingFilter])

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Fecha', 'Cliente', 'Email', 'Telefono', 'Producto', 'Cantidad', 'Tipo', 'Subtotal', 'Total', 'Estado Pago', 'Estado Envio', 'Provincia', 'Ciudad', 'Direccion', 'CP']
    const rows = filteredOrders.map(o => [
      new Date(o.createdAt).toLocaleDateString('es-AR'),
      o.buyerName,
      o.buyerEmail,
      o.buyerPhone || '',
      o.itemName,
      o.quantity,
      o.itemType === 'combo' ? 'Combo' : 'Producto',
      o.subtotal,
      o.total,
      paymentStatusLabel(o.paymentStatus),
      shippingStatusLabel(o.shippingStatus),
      o.shippingProvince || '',
      o.shippingCity || '',
      `${o.shippingStreet || ''} ${o.shippingNumber || ''}`.trim(),
      o.shippingCp || '',
    ])
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ordenes-capilux-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Dropi handlers
  const [dropiDebug, setDropiDebug] = useState<{status?: number; message?: string; serverIp?: string; hint?: string} | null>(null)

  const handleDropiConnect = async () => {
    if (!dropiIntegrationKey.trim()) {
      setDropiError('Ingresa tu Integration Key de Dropi')
      return
    }
    setDropiConnecting(true)
    setDropiError('')
    setDropiDebug(null)
    try {
      const res = await fetch('/api/dropi/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrationKey: dropiIntegrationKey.trim(), country: dropiCountry }),
      })
      const data = await res.json()
      if (res.ok && data.token) {
        setDropiToken(data.token)
        setDropiConnected(true)
        setDropiDebug(null)
        await fetch('/api/config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ configs: { DROPI_TOKEN: data.token } }),
        })
      } else {
        setDropiError(data.error || 'Token invalido. Verifica tu Integration Key')
        if (data.debug) {
          setDropiDebug(data.debug)
        }
      }
    } catch {
      setDropiError('Error de conexion con Dropi')
    } finally {
      setDropiConnecting(false)
    }
  }

  const handleDropiDisconnect = () => {
    setDropiToken('')
    setDropiIntegrationKey('')
    setDropiConnected(false)
    setDropiProducts([])
    setDropiSearch('')
  }

  const handleDropiSearch = async (page = 0) => {
    if (!dropiToken) return
    setDropiLoading(true)
    setDropiError('')
    try {
      const res = await fetch('/api/dropi/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dropiToken, keywords: dropiSearch, page, pageSize: 20, country: dropiCountry }),
      })
      const data = await res.json()
      if (res.ok) {
        setDropiProducts(data.products || [])
        setDropiTotal(data.total || 0)
        setDropiPage(page)
      } else {
        setDropiError(data.error || 'Error al buscar productos')
      }
    } catch {
      setDropiError('Error de conexion')
    } finally {
      setDropiLoading(false)
    }
  }

  const handleDropiImport = async (product: any) => {
    if (!dropiToken) return
    setDropiImporting(product.id)
    try {
      const res = await fetch('/api/dropi/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dropiId: product.id,
          name: product.name,
          description: product.description || `Producto importado de Dropi${product.sku ? ` - SKU: ${product.sku}` : ''}`,
          price: product.suggestedPrice || product.price,
          image1: product.image1 || product.image || (product.images && product.images[0]) || null,
          image2: product.image2 || (product.images && product.images[1]) || null,
          dropiPrice: product.price,
          stock: product.stock,
          sku: product.sku,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        fetchData()
        alert(data.updated ? 'Producto actualizado correctamente' : 'Producto importado correctamente a tu tienda')
      } else {
        alert(data.error || 'Error al importar producto')
      }
    } catch {
      alert('Error de conexion')
    } finally {
      setDropiImporting(null)
    }
  }

  // Login screen
  if (authenticated === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-4">
                <img src="/capilux-logo.png" alt="Capilux" className="w-16 h-16 rounded-full object-cover" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-800">Panel de Administracion</CardTitle>
              <p className="text-gray-400 text-sm mt-1">Capilux - Nutricion Premium</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="modularte.ar@gmail.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contrasena</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Tu contrasena" required className="pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {loginError && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{loginError}</p>}
                <Button type="submit" disabled={loginLoading} className="w-full bg-emerald-600 hover:bg-emerald-700 py-5">
                  {loginLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Iniciar Sesion
                </Button>
              </form>
              <Button variant="ghost" onClick={onGoBack} className="w-full mt-4 text-gray-400 hover:text-gray-600">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a la tienda
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  if (authenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onGoBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Tienda</span>
              </Button>
              <div className="h-6 w-px bg-gray-200" />
              <div className="flex items-center gap-2">
                <img src="/capilux-logo.png" alt="" className="w-8 h-8 rounded-full object-cover" />
                <span className="font-bold text-gray-800">Dashboard</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400 hidden sm:inline">modularte.ar@gmail.com</span>
              <Button variant="outline" size="sm" onClick={handleLogout} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                <LogOut className="w-4 h-4 mr-1" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Gestion de Contenido</h1>
              <p className="text-gray-400 text-sm mt-1">Administra productos, combos y pedidos</p>
            </div>
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="productos" className="gap-1.5 text-xs sm:text-sm"><Package className="w-4 h-4" />Productos</TabsTrigger>
              <TabsTrigger value="combos" className="gap-1.5 text-xs sm:text-sm"><Layers className="w-4 h-4" />Combos</TabsTrigger>
              <TabsTrigger value="pedidos" className="gap-1.5 text-xs sm:text-sm"><ClipboardList className="w-4 h-4" />Ordenes</TabsTrigger>
              <TabsTrigger value="dropi" className="gap-1.5 text-xs sm:text-sm"><Download className="w-4 h-4" />Dropi</TabsTrigger>
              <TabsTrigger value="config" className="gap-1.5 text-xs sm:text-sm"><CreditCard className="w-4 h-4" /><span className="hidden sm:inline">MP</span></TabsTrigger>
              <TabsTrigger value="landings" className="gap-1.5 text-xs sm:text-sm"><Sparkles className="w-4 h-4" />Landings</TabsTrigger>
            </TabsList>
          </div>

          {/* Products Tab */}
          <TabsContent value="productos" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => { setEditingProduct(null); setShowProductForm(true) }} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                <Plus className="w-4 h-4" />Nuevo Producto
              </Button>
            </div>
            {products.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Package className="w-16 h-16 text-gray-300 mb-4" />
                  <p className="text-gray-400 text-lg">No hay productos cargados</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {products.map((product) => (
                  <Card key={product.id} className={`overflow-hidden ${!product.isActive ? 'opacity-60' : ''}`}>
                    <div className="flex gap-3 p-4">
                      <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                        {product.image1 ? (
                          <img src={product.image1} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Package className="w-8 h-8 text-gray-300" /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-gray-800 truncate">{product.name}</h3>
                          <Badge variant={product.isActive ? 'default' : 'secondary'} className={`text-xs flex-shrink-0 ${product.isActive ? 'bg-emerald-100 text-emerald-700' : ''}`}>
                            {product.isActive ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>
                        <p className="text-emerald-600 font-bold mt-1">${product.price.toLocaleString('es-AR', { minimumFractionDigits: 0 })}</p>
                        <p className="text-gray-400 text-xs mt-1 line-clamp-2">{product.description}</p>
                      </div>
                    </div>
                    <div className="flex border-t">
                      <Button variant="ghost" size="sm" className="flex-1 rounded-none text-violet-500 hover:text-violet-600 gap-1" onClick={() => handleGenerateLanding(product.id)} disabled={!!generatingLanding}>
                        {generatingLanding === product.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        Landing
                      </Button>
                      <Button variant="ghost" size="sm" className="flex-1 rounded-none text-gray-500 hover:text-emerald-600 gap-1 border-l" onClick={() => handleToggleProduct(product)}>
                        {product.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        {product.isActive ? 'Ocultar' : 'Mostrar'}
                      </Button>
                      <Button variant="ghost" size="sm" className="flex-1 rounded-none text-gray-500 hover:text-blue-600 gap-1 border-l" onClick={() => { setEditingProduct(product); setShowProductForm(true) }}>
                        <Pencil className="w-3.5 h-3.5" />Editar
                      </Button>
                      <Button variant="ghost" size="sm" className="flex-1 rounded-none text-gray-500 hover:text-red-600 gap-1 border-l" onClick={() => handleDeleteProduct(product.id)}>
                        <Trash2 className="w-3.5 h-3.5" />Eliminar
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Combos Tab */}
          <TabsContent value="combos" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => { setEditingCombo(null); setShowComboForm(true) }} className="bg-amber-600 hover:bg-amber-700 gap-2">
                <Plus className="w-4 h-4" />Nuevo Combo
              </Button>
            </div>
            {combos.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Layers className="w-16 h-16 text-gray-300 mb-4" />
                  <p className="text-gray-400 text-lg">No hay combos cargados</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {combos.map((combo) => {
                  const discount = combo.originalPrice > 0 ? Math.round((1 - combo.price / combo.originalPrice) * 100) : 0
                  return (
                    <Card key={combo.id} className={`overflow-hidden border-amber-200 ${!combo.isActive ? 'opacity-60' : ''}`}>
                      <div className="flex gap-3 p-4">
                        <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                          {combo.image1 ? (
                            <img src={combo.image1} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Layers className="w-8 h-8 text-amber-300" /></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-gray-800 truncate">{combo.name}</h3>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {discount > 0 && <Badge className="bg-red-100 text-red-600 text-xs">-{discount}%</Badge>}
                              <Badge variant={combo.isActive ? 'default' : 'secondary'} className={`text-xs ${combo.isActive ? 'bg-emerald-100 text-emerald-700' : ''}`}>
                                {combo.isActive ? 'Activo' : 'Inactivo'}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-amber-600 font-bold">${combo.price.toLocaleString('es-AR', { minimumFractionDigits: 0 })}</span>
                            {combo.originalPrice > 0 && <span className="text-gray-400 line-through text-xs">${combo.originalPrice.toLocaleString('es-AR', { minimumFractionDigits: 0 })}</span>}
                          </div>
                          <p className="text-gray-400 text-xs mt-1 line-clamp-1">{combo.description}</p>
                        </div>
                      </div>
                      <div className="flex border-t">
                        <Button variant="ghost" size="sm" className="flex-1 rounded-none text-gray-500 hover:text-emerald-600 gap-1" onClick={() => handleToggleCombo(combo)}>
                          {combo.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          {combo.isActive ? 'Ocultar' : 'Mostrar'}
                        </Button>
                        <Button variant="ghost" size="sm" className="flex-1 rounded-none text-gray-500 hover:text-blue-600 gap-1 border-l" onClick={() => { setEditingCombo(combo); setShowComboForm(true) }}>
                          <Pencil className="w-3.5 h-3.5" />Editar
                        </Button>
                        <Button variant="ghost" size="sm" className="flex-1 rounded-none text-gray-500 hover:text-red-600 gap-1 border-l" onClick={() => handleDeleteCombo(combo.id)}>
                          <Trash2 className="w-3.5 h-3.5" />Eliminar
                        </Button>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* Orders Tab - Spreadsheet View */}
          <TabsContent value="pedidos" className="space-y-4">
            {/* Header & Filters */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Ordenes de Venta ({filteredOrders.length})</h2>
                <p className="text-gray-400 text-sm">Historial completo de ordenes</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="gap-2" onClick={fetchOrders}>
                  <RefreshCw className="w-4 h-4" />Actualizar
                </Button>
                <Button variant="outline" className="gap-2" onClick={handleExportCSV} disabled={filteredOrders.length === 0}>
                  <Download className="w-4 h-4" />Exportar CSV
                </Button>
              </div>
            </div>

            {/* Search & Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por nombre, email, producto..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                    <SelectTrigger className="w-full sm:w-[160px]">
                      <SelectValue placeholder="Estado Pago" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_STATUS_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={shippingFilter} onValueChange={setShippingFilter}>
                    <SelectTrigger className="w-full sm:w-[160px]">
                      <SelectValue placeholder="Estado Envio" />
                    </SelectTrigger>
                    <SelectContent>
                      {SHIPPING_FILTER_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Orders Table */}
            {filteredOrders.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <ClipboardList className="w-16 h-16 text-gray-300 mb-4" />
                  <p className="text-gray-400 text-lg">No hay ordenes</p>
                  <p className="text-gray-300 text-sm mt-1">Las ordenes apareceran aqui cuando los clientes compren</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-3 font-semibold text-gray-600 whitespace-nowrap">Fecha</th>
                        <th className="text-left p-3 font-semibold text-gray-600 whitespace-nowrap">Cliente</th>
                        <th className="text-left p-3 font-semibold text-gray-600 whitespace-nowrap hidden lg:table-cell">Email</th>
                        <th className="text-left p-3 font-semibold text-gray-600 whitespace-nowrap hidden xl:table-cell">Telefono</th>
                        <th className="text-left p-3 font-semibold text-gray-600 whitespace-nowrap">Producto</th>
                        <th className="text-left p-3 font-semibold text-gray-600 whitespace-nowrap hidden md:table-cell">Tipo</th>
                        <th className="text-right p-3 font-semibold text-gray-600 whitespace-nowrap hidden md:table-cell">Subtotal</th>
                        <th className="text-right p-3 font-semibold text-gray-600 whitespace-nowrap">Total</th>
                        <th className="text-left p-3 font-semibold text-gray-600 whitespace-nowrap">Pago</th>
                        <th className="text-left p-3 font-semibold text-gray-600 whitespace-nowrap">Envio</th>
                        <th className="text-left p-3 font-semibold text-gray-600 whitespace-nowrap hidden md:table-cell">Direccion</th>
                        <th className="p-3 w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((order) => {
                        const isExpanded = expandedOrderId === order.id
                        const orderDate = new Date(order.createdAt).toLocaleDateString('es-AR')
                        const shippingAddr = [order.shippingStreet, order.shippingNumber, order.shippingFloor].filter(Boolean).join(' ')
                        const fullAddr = [shippingAddr, order.shippingCity, order.shippingProvince, order.shippingCp ? `CP: ${order.shippingCp}` : null].filter(Boolean).join(', ')

                        return (
                          <>
                            <tr
                              key={order.id}
                              className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                              onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                            >
                              <td className="p-3 text-gray-600 whitespace-nowrap">{orderDate}</td>
                              <td className="p-3 font-medium text-gray-800 whitespace-nowrap">{order.buyerName}</td>
                              <td className="p-3 text-gray-600 hidden lg:table-cell">{order.buyerEmail}</td>
                              <td className="p-3 text-gray-600 hidden xl:table-cell">{order.buyerPhone || '-'}</td>
                              <td className="p-3 text-gray-800 whitespace-nowrap">
                                {order.itemName} <span className="text-gray-400">x{order.quantity}</span>
                              </td>
                              <td className="p-3 hidden md:table-cell">
                                <Badge variant="outline" className={`text-xs ${order.itemType === 'combo' ? 'border-amber-200 text-amber-700' : 'border-gray-200 text-gray-600'}`}>
                                  {order.itemType === 'combo' ? 'Combo' : 'Producto'}
                                </Badge>
                              </td>
                              <td className="p-3 text-right text-gray-600 hidden md:table-cell">${order.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 0 })}</td>
                              <td className="p-3 text-right font-bold text-emerald-600 whitespace-nowrap">${order.total.toLocaleString('es-AR', { minimumFractionDigits: 0 })}</td>
                              <td className="p-3">
                                <Badge className={`${paymentStatusColor(order.paymentStatus)} text-xs whitespace-nowrap`}>
                                  {paymentStatusLabel(order.paymentStatus)}
                                </Badge>
                              </td>
                              <td className="p-3" onClick={(e) => e.stopPropagation()}>
                                <select
                                  value={order.shippingStatus}
                                  onChange={(e) => handleUpdateShippingStatus(order.id, e.target.value)}
                                  className={`text-xs rounded-full px-2 py-1 border-0 font-medium cursor-pointer ${shippingStatusColor(order.shippingStatus)}`}
                                >
                                  {SHIPPING_STATUS_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="p-3 text-gray-500 text-xs hidden md:table-cell max-w-[220px]" title={fullAddr || '-'}>
                                {fullAddr ? (
                                  <span className="line-clamp-2 leading-tight">{fullAddr}</span>
                                ) : (
                                  <span className="text-gray-300">-</span>
                                )}
                              </td>
                              <td className="p-3">
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-gray-400" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-gray-400" />
                                )}
                              </td>
                            </tr>
                            {/* Expanded row */}
                            {isExpanded && (
                              <tr key={`${order.id}-expanded`} className="bg-gray-50/50">
                                <td colSpan={12} className="p-4">
                                  {/* SHIPPING LABEL - Most prominent section */}
                                  <div className="mb-4 p-4 bg-white rounded-xl border-2 border-emerald-200 shadow-sm">
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-2">
                                        <Truck className="w-5 h-5 text-emerald-600" />
                                        <span className="font-bold text-emerald-700 text-sm uppercase tracking-wide">Datos de Envio</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {order.shippingMethod && (
                                          <Badge className="bg-blue-100 text-blue-700 text-xs">
                                            {order.shippingMethod}
                                          </Badge>
                                        )}
                                        {order.shippingCost === 0 ? (
                                          <Badge className="bg-emerald-100 text-emerald-700 text-xs">Envio gratis</Badge>
                                        ) : (
                                          <Badge variant="outline" className="text-xs border-gray-300 text-gray-600">
                                            Envio: ${order.shippingCost.toLocaleString('es-AR')}
                                          </Badge>
                                        )}
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-7 text-xs gap-1 border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            const label = `${order.buyerName}\n${order.buyerPhone || ''}\n${order.shippingStreet || ''} ${order.shippingNumber || ''}${order.shippingFloor ? ', ' + order.shippingFloor : ''}\n${order.shippingCity || ''}, ${order.shippingProvince || ''}\nCP: ${order.shippingCp || ''}${order.buyerDni ? '\nDNI: ' + order.buyerDni : ''}`
                                            navigator.clipboard.writeText(label)
                                          }}
                                        >
                                          <ClipboardList className="w-3 h-3" />Copiar
                                        </Button>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                      <div className="space-y-1">
                                        <p className="text-xs text-gray-400 font-medium">Destinatario</p>
                                        <p className="text-sm font-semibold text-gray-800">{order.buyerName}</p>
                                        {order.buyerPhone && <p className="text-sm text-gray-600">Tel: {order.buyerPhone}</p>}
                                        {order.buyerDni && <p className="text-sm text-gray-600">DNI: {order.buyerDni}</p>}
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-xs text-gray-400 font-medium">Direccion</p>
                                        <p className="text-sm text-gray-800">
                                          {order.shippingStreet || '-'}{order.shippingNumber ? ` ${order.shippingNumber}` : ''}{order.shippingFloor ? `, ${order.shippingFloor}` : ''}
                                        </p>
                                        <p className="text-sm text-gray-800">
                                          {order.shippingCity || '-'}{order.shippingProvince ? `, ${order.shippingProvince}` : ''}
                                        </p>
                                        {order.shippingCp && <p className="text-sm text-gray-600">CP: {order.shippingCp}</p>}
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-xs text-gray-400 font-medium">Metodo de Envio</p>
                                        <p className="text-sm font-medium text-gray-800">{order.shippingMethod || 'Estandar'}</p>
                                        <p className="text-sm text-gray-600">Costo: {order.shippingCost === 0 ? 'Gratis' : `$${order.shippingCost.toLocaleString('es-AR')}`}</p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                      <span className="text-gray-400 text-xs font-medium block mb-1">DATOS DEL CLIENTE</span>
                                      <div className="space-y-1 text-sm">
                                        <p className="text-gray-800"><span className="text-gray-500">Nombre:</span> {order.buyerName}</p>
                                        <p className="text-gray-800"><span className="text-gray-500">Email:</span> {order.buyerEmail}</p>
                                        <p className="text-gray-800"><span className="text-gray-500">Telefono:</span> {order.buyerPhone || '-'}</p>
                                        <p className="text-gray-800"><span className="text-gray-500">DNI:</span> {order.buyerDni || '-'}</p>
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-gray-400 text-xs font-medium block mb-1">DETALLE DEL PEDIDO</span>
                                      <div className="space-y-1 text-sm">
                                        <p className="text-gray-800"><span className="text-gray-500">Producto:</span> {order.itemName}</p>
                                        <p className="text-gray-800"><span className="text-gray-500">Tipo:</span> {order.itemType === 'combo' ? 'Combo' : 'Producto'}</p>
                                        <p className="text-gray-800"><span className="text-gray-500">Cantidad:</span> {order.quantity}</p>
                                        <p className="text-gray-800"><span className="text-gray-500">Precio unit.:</span> ${order.itemPrice.toLocaleString('es-AR')}</p>
                                        <p className="text-gray-800"><span className="text-gray-500">Envio:</span> ${order.shippingCost.toLocaleString('es-AR')}</p>
                                        <p className="font-bold text-emerald-600"><span className="text-gray-500 font-normal">Total:</span> ${order.total.toLocaleString('es-AR')}</p>
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-gray-400 text-xs font-medium block mb-1">INFO Y NOTAS</span>
                                      <div className="space-y-1 text-sm">
                                        <p className="text-gray-800"><span className="text-gray-500">Fecha:</span> {new Date(order.createdAt).toLocaleString('es-AR')}</p>
                                        <p className="text-gray-800"><span className="text-gray-500">Ref:</span> {order.id.slice(0, 10)}</p>
                                        {order.paymentRef && (
                                          <p className="text-gray-800"><span className="text-gray-500">Ref Pago:</span> {order.paymentRef}</p>
                                        )}
                                      </div>
                                      <div className="mt-2 space-y-1.5">
                                        <div className="flex items-center gap-1 text-xs text-gray-400">
                                          <StickyNote className="w-3 h-3" /> Notas internas
                                        </div>
                                        <Textarea
                                          placeholder="Agregar nota..."
                                          defaultValue={order.notes || ''}
                                          rows={2}
                                          className="text-xs resize-none"
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="w-full h-7 text-xs gap-1"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            const textarea = e.currentTarget.closest('div')?.querySelector('textarea') as HTMLTextAreaElement
                                            if (textarea) handleUpdateNotes(order.id, textarea.value)
                                          }}
                                        >
                                          <Save className="w-3 h-3" />Guardar nota
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* MercadoPago Config Tab */}
          <TabsContent value="config" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings className="w-5 h-5" />
                  Configuracion de MercadoPago
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="text-gray-500 text-sm">Ingresa tus credenciales de MercadoPago para habilitar los pagos online. Podes obtener tu Access Token desde <a href="https://www.mercadopago.com.ar/developers/panel" target="_blank" rel="noreferrer" className="text-emerald-600 underline hover:text-emerald-700">MercadoPago Developers</a>.</p>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="mpToken" className="text-sm font-medium">Access Token (Produccion)</Label>
                    <Input id="mpToken" type="password" value={mpToken} onChange={(e) => setMpToken(e.target.value)} placeholder="APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className="h-11" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="siteURL" className="text-sm font-medium">URL del sitio (para notificaciones MP)</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input id="siteURL" type="url" value={siteURL} onChange={(e) => setSiteURL(e.target.value)} placeholder="https://tu-sitio.com" className="pl-10 h-11" />
                    </div>
                  </div>
                </div>
                <Button onClick={handleSaveConfig} disabled={configLoading} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                  {configLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Guardar Configuracion
                </Button>
                {configSaved && (
                  <p className="text-emerald-600 text-sm flex items-center gap-1"><Check className="w-4 h-4" /> Configuracion guardada correctamente</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  MiniMax / Hailuo AI - Video UGC
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="text-gray-500 text-sm">Ingresa tu API Key de MiniMax para generar videos UGC con IA. Obtenela en <a href="https://platform.minimaxi.com" target="_blank" rel="noreferrer" className="text-emerald-600 underline hover:text-emerald-700">platform.minimaxi.com</a>.</p>
                <div className="space-y-1.5">
                  <Label htmlFor="minimaxKey" className="text-sm font-medium">MiniMax API Key</Label>
                  <Input id="minimaxKey" type="password" value={minimaxApiKey} onChange={(e) => setMinimaxApiKey(e.target.value)} placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." className="h-11" />
                </div>
                <Button onClick={handleSaveConfig} disabled={configLoading} className="bg-purple-600 hover:bg-purple-700 gap-2">
                  {configLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Guardar API Key
                </Button>
                {configSaved && (
                  <p className="text-emerald-600 text-sm flex items-center gap-1"><Check className="w-4 h-4" /> Configuracion guardada correctamente</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dropi Tab */}
          <TabsContent value="dropi" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Download className="w-5 h-5" />
                  Importar de Dropi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="text-gray-500 text-sm">
                  Importa productos de Dropi a tu tienda. Necesitas tu <b>Integration Key</b> (token de integracion)
                  que se genera desde el panel de Dropi en la seccion de <b>Tiendas</b> o <b>Integraciones</b>.
                  Registrate en{' '}
                  <a href="https://app.dropi.ar" target="_blank" rel="noreferrer" className="text-blue-600 underline hover:text-blue-700">app.dropi.ar</a>.
                </p>

                {!dropiConnected ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="dropiCountry" className="text-sm font-medium">Pais</Label>
                        <select
                          id="dropiCountry"
                          value={dropiCountry}
                          onChange={(e) => setDropiCountry(e.target.value)}
                          className="w-full h-9 rounded-md border border-gray-300 bg-white px-3 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        >
                          <option value="AR">Argentina (dropi.ar)</option>
                          <option value="CO">Colombia (dropi.co)</option>
                          <option value="CL">Chile (dropi.cl)</option>
                          <option value="MX">Mexico (dropi.mx)</option>
                          <option value="PE">Peru (dropi.pe)</option>
                          <option value="EC">Ecuador (dropi.ec)</option>
                          <option value="PA">Panama (dropi.pa)</option>
                          <option value="PY">Paraguay (dropi.com.py)</option>
                          <option value="ES">Espana (dropi.com.es)</option>
                        </select>
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <Label htmlFor="dropiKey" className="text-sm font-medium">Integration Key de Dropi</Label>
                        <Input
                          id="dropiKey"
                          type="text"
                          value={dropiIntegrationKey}
                          onChange={(e) => setDropiIntegrationKey(e.target.value)}
                          placeholder="Pega aqui tu Integration Key de Dropi..."
                          className="font-mono text-sm"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">
                      Encontra tu Integration Key en: app.<b>{dropiCountry === 'AR' ? 'dropi.ar' : dropiCountry === 'CO' ? 'dropi.co' : 'dropi.' + dropiCountry.toLowerCase()}</b> {'>'} Tiendas {'>'} tu tienda {'>'} Token de integracion
                    </p>
                    {dropiError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
                        <p className="text-red-600 text-sm font-medium">{dropiError}</p>
                        {dropiDebug && (
                          <div className="text-xs text-red-400 space-y-1">
                            <p>Estado: {dropiDebug.status} | Mensaje Dropi: {dropiDebug.message}</p>
                            {dropiDebug.serverIp && <p>IP del servidor: {dropiDebug.serverIp}</p>}
                            {dropiDebug.hint && <p className="text-amber-500 italic">{dropiDebug.hint}</p>}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 pt-1 border-t border-red-100">
                          <p className="font-medium text-gray-600 mb-1">Posibles soluciones:</p>
                          <ul className="list-disc list-inside space-y-0.5">
                            <li>Asegurate de copiar el token completo desde {dropiCountry === 'AR' ? 'app.dropi.ar' : 'app.dropi.co'}</li>
                            <li>Ve a <b>Tiendas</b> {'>'} tu tienda {'>'} <b>Token de integracion</b></li>
                            <li>El token es largo y alfanumerico - no lo recortes</li>
                            <li>Si el problema persiste, contacta a soporte de Dropi</li>
                          </ul>
                        </div>
                      </div>
                    )}
                    <Button onClick={handleDropiConnect} disabled={dropiConnecting || !dropiIntegrationKey.trim()} className="bg-violet-600 hover:bg-violet-700 gap-2">
                      {dropiConnecting && <Loader2 className="w-4 h-4 animate-spin" />}
                      {dropiConnecting ? 'Validando...' : 'Conectar con Dropi'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-emerald-600" />
                        <span className="text-emerald-700 font-medium text-sm">Conectado a Dropi</span>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleDropiDisconnect} className="text-red-500 hover:text-red-600 text-xs">
                        Desconectar
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="Buscar productos en Dropi (vitaminas, proteinas, suplementos...)"
                          value={dropiSearch}
                          onChange={(e) => setDropiSearch(e.target.value)}
                          className="pl-10"
                          onKeyDown={(e) => e.key === 'Enter' && handleDropiSearch(0)}
                        />
                      </div>
                      <Button onClick={() => handleDropiSearch(0)} disabled={dropiLoading} className="bg-violet-600 hover:bg-violet-700 gap-2">
                        {dropiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        Buscar
                      </Button>
                    </div>

                    {dropiError && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{dropiError}</p>}

                    {dropiProducts.length > 0 && (
                      <>
                        <div className="text-sm text-gray-500">
                          {dropiTotal} productos encontrados - Pagina {dropiPage + 1}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                          {dropiProducts.map((p: any) => (
                            <Card key={p.id} className="overflow-hidden border-violet-100">
                              <div className="flex gap-3 p-4">
                                <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                                  {p.image ? (
                                    <img src={p.image} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center"><Package className="w-8 h-8 text-gray-300" /></div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-gray-800 text-sm truncate">{p.name}</h3>
                                  {p.suggestedPrice > 0 && (
                                    <p className="text-emerald-600 font-bold mt-1 text-sm">${p.suggestedPrice.toLocaleString('es-AR')}</p>
                                  )}
                                  {p.price > 0 && (
                                    <p className="text-gray-400 text-xs">Costo: ${p.price.toLocaleString('es-AR')}</p>
                                  )}
                                  <div className="flex items-center gap-2 mt-1">
                                    {p.stock > 0 ? (
                                      <Badge className="bg-emerald-100 text-emerald-700 text-xs">Stock: {p.stock}</Badge>
                                    ) : (
                                      <Badge className="bg-red-100 text-red-600 text-xs">Sin stock</Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex border-t">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="flex-1 rounded-none text-violet-600 hover:text-violet-700 hover:bg-violet-50 gap-1 text-xs"
                                  disabled={dropiImporting === p.id}
                                  onClick={() => handleDropiImport(p)}
                                >
                                  {dropiImporting === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                  {dropiImporting === p.id ? 'Importando...' : 'Importar'}
                                </Button>
                              </div>
                            </Card>
                          ))}
                        </div>

                        <div className="flex justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={dropiPage === 0 || dropiLoading}
                            onClick={() => handleDropiSearch(dropiPage - 1)}
                          >
                            Anterior
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={(dropiPage + 1) * 20 >= dropiTotal || dropiLoading}
                            onClick={() => handleDropiSearch(dropiPage + 1)}
                          >
                            Siguiente
                          </Button>
                        </div>
                      </>
                    )}

                    {dropiProducts.length === 0 && !dropiLoading && dropiSearch && (
                      <div className="text-center py-8 text-gray-400">
                        No se encontraron productos. Intenta con otros terminos de busqueda.
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          {/* Landings Tab */}
          <TabsContent value="landings" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Landing Pages ({landings.length})</h2>
                <p className="text-gray-400 text-sm">Paginas de venta generadas por IA</p>
              </div>
              <Button variant="outline" className="gap-2" onClick={fetchLandings}>
                <RefreshCw className="w-4 h-4" />Actualizar
              </Button>
            </div>

            {landings.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Sparkles className="w-16 h-16 text-gray-300 mb-4" />
                  <p className="text-gray-400 text-lg mb-2">No hay landing pages creadas</p>
                  <p className="text-gray-300 text-sm">Selecciona un producto y haz clic en "Landing" para crear una</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {landings.map((landing) => (
                  <Card key={landing.id} className={`overflow-hidden ${!landing.isActive ? 'opacity-60' : ''}`}>
                    <div className="flex gap-3 p-4">
                      <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                        {landing.heroImage1 ? (
                          <img src={landing.heroImage1} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Sparkles className="w-8 h-8 text-violet-300" /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 truncate text-sm">{landing.productName}</h3>
                        <p className="text-gray-500 text-xs mt-1 line-clamp-1">{landing.headline}</p>
                        <p className="text-gray-400 text-xs mt-1">{new Date(landing.createdAt).toLocaleDateString('es-AR')}</p>
                      </div>
                    </div>
                    <div className="flex border-t">
                      <Button variant="ghost" size="sm" className="flex-1 rounded-none text-emerald-500 hover:text-emerald-600 gap-1" onClick={() => window.open(`/landing/${landing.slug}`, '_blank')}>
                        <ExternalLink className="w-3.5 h-3.5" />Ver
                      </Button>
                      <Button variant="ghost" size="sm" className="flex-1 rounded-none text-gray-500 hover:text-blue-600 gap-1 border-l" onClick={() => navigator.clipboard.writeText(`/landing/${landing.slug}`)}>
                        <Link2 className="w-3.5 h-3.5" />Copiar Link
                      </Button>
                      <Button variant="ghost" size="sm" className="flex-1 rounded-none text-gray-500 hover:text-red-600 gap-1 border-l" onClick={() => handleDeleteLanding(landing.slug)}>
                        <Trash2 className="w-3.5 h-3.5" />Eliminar
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

        </Tabs>
      </main>

      {/* Landing Generation Overlay */}
      {showLandingOverlay && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl"
          >
            <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-violet-600 animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Creando Landing Page</h3>
            <p className="text-gray-500 text-sm mb-4">La IA esta generando tu pagina de venta...</p>
            <div className="space-y-2 text-left">
              <div className={`flex items-center gap-2 text-sm ${landingStep.includes('Creando landing') || landingStep.includes('fotos') || landingStep.includes('creada') ? 'text-violet-600' : 'text-gray-400'}`}>
                {(landingStep.includes('Creando landing') || landingStep.includes('fotos')) && !landingStep.includes('con fotos') ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Creando landing en base de datos
              </div>
              <div className={`flex items-center gap-2 text-sm ${landingStep.includes('fotos') ? 'text-violet-600 font-semibold' : landingStep.includes('con fotos') ? 'text-emerald-600 font-semibold' : 'text-gray-400'}`}>
                {landingStep.includes('fotos antes') ? <Loader2 className="w-4 h-4 animate-spin" /> : landingStep.includes('con fotos') ? <Check className="w-4 h-4 text-emerald-500" /> : <div className="w-4 h-4" />}
                {landingStep.includes('fotos antes') ? 'Generando fotos antes/despues con IA...' : 'Generando fotos antes/despues con IA'}
              </div>
              <div className={`flex items-center gap-2 text-sm ${landingStep.includes('con fotos') || landingStep.includes('creada') ? 'text-emerald-600 font-semibold' : 'text-gray-400'}`}>
                {landingStep.includes('con fotos') ? <Check className="w-4 h-4 text-emerald-500" /> : <div className="w-4 h-4" />}
                Publicando landing page
              </div>
            </div>
            {landingStep.includes('fotos antes') && (
              <p className="mt-4 text-xs text-gray-400">Las imagenes se generan en ~15-30 segundos</p>
            )}
            {landingStep.includes('Error') && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm font-medium">{landingStep}</p>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Product Form Dialog */}
      <Dialog open={showProductForm} onOpenChange={(open) => { if (!open) { setShowProductForm(false); setEditingProduct(null) } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </DialogTitle>
          </DialogHeader>
          <ProductForm key={editingProduct?.id ?? 'new-product'} product={editingProduct} onSave={handleSaveProduct} onCancel={() => { setShowProductForm(false); setEditingProduct(null) }} loading={formLoading} />
        </DialogContent>
      </Dialog>

      {/* Combo Form Dialog */}
      <Dialog open={showComboForm} onOpenChange={(open) => { if (!open) { setShowComboForm(false); setEditingCombo(null) } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">
              {editingCombo ? 'Editar Combo' : 'Nuevo Combo'}
            </DialogTitle>
          </DialogHeader>
          <ComboForm key={editingCombo?.id ?? 'new-combo'} combo={editingCombo} onSave={handleSaveCombo} onCancel={() => { setShowComboForm(false); setEditingCombo(null) }} loading={formLoading} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
