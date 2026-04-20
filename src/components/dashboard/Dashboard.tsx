'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
  shippingQuoteId: string | null
  total: number
  paymentStatus: string
  paymentRef: string | null
  shippingStatus: string
  andreaniTrack: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
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
  const [configLoading, setConfigLoading] = useState(false)
  const [configSaved, setConfigSaved] = useState(false)

  // Andreani config states
  const [andreaniApiUrl, setAndreaniApiUrl] = useState('')
  const [andreaniUsername, setAndreaniUsername] = useState('')
  const [andreaniPassword, setAndreaniPassword] = useState('')
  const [andreaniContract, setAndreaniContract] = useState('')
  const [andreaniSenderCp, setAndreaniSenderCp] = useState('')
  const [andreaniSaved, setAndreaniSaved] = useState(false)
  const [andreaniTestResult, setAndreaniTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [andreaniTesting, setAndreaniTesting] = useState(false)

  // Dropi states
  const [dropiIntegrationKey, setDropiIntegrationKey] = useState('')
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

  // Fetch config
  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/config')
      if (res.ok) {
        const data = await res.json()
        if (data.MP_ACCESS_TOKEN) setMpToken(data.MP_ACCESS_TOKEN)
        if (data.NEXT_PUBLIC_SITE_URL) setSiteURL(data.NEXT_PUBLIC_SITE_URL)
        if (data.ANDREANI_API_URL) setAndreaniApiUrl(data.ANDREANI_API_URL)
        if (data.ANDREANI_USERNAME) setAndreaniUsername(data.ANDREANI_USERNAME)
        if (data.ANDREANI_PASSWORD) setAndreaniPassword(data.ANDREANI_PASSWORD)
        if (data.ANDREANI_CONTRACT) setAndreaniContract(data.ANDREANI_CONTRACT)
        if (data.ANDREANI_SENDER_CP) setAndreaniSenderCp(data.ANDREANI_SENDER_CP)
        if (data.DROPI_TOKEN) {
          setDropiToken(data.DROPI_TOKEN)
          setDropiIntegrationKey(data.DROPI_TOKEN)
          setDropiConnected(true)
        }
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
        body: JSON.stringify({ configs: { MP_ACCESS_TOKEN: mpToken, NEXT_PUBLIC_SITE_URL: siteURL } }),
      })
      setConfigSaved(true)
    } finally {
      setConfigLoading(false)
    }
  }

  const handleSaveAndreani = async () => {
    setConfigLoading(true)
    setAndreaniSaved(false)
    try {
      await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configs: {
            ANDREANI_API_URL: andreaniApiUrl,
            ANDREANI_USERNAME: andreaniUsername,
            ANDREANI_PASSWORD: andreaniPassword,
            ANDREANI_CONTRACT: andreaniContract,
            ANDREANI_SENDER_CP: andreaniSenderCp,
          },
        }),
      })
      setAndreaniSaved(true)
    } finally {
      setConfigLoading(false)
    }
  }

  const handleTestAndreani = async () => {
    setAndreaniTesting(true)
    setAndreaniTestResult(null)
    try {
      const res = await fetch('/api/shipping/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postalCode: '1001', weight: 0.5 }),
      })
      const data = await res.json()
      if (res.ok && data.configured) {
        setAndreaniTestResult({ success: true, message: `Conexion exitosa! ${data.options?.length || 0} opciones de envio disponibles.` })
      } else {
        setAndreaniTestResult({ success: false, message: data.error || 'Error en la conexion' })
      }
    } catch {
      setAndreaniTestResult({ success: false, message: 'No se pudo conectar con Andreani' })
    } finally {
      setAndreaniTesting(false)
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

  const handleUpdateTracking = async (orderId: string, tracking: string, shippingStatus: string) => {
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ andreaniTrack: tracking, shippingStatus }),
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
    }
  }, [authenticated, fetchData, fetchConfig, fetchOrders])

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

  const shippingStatusLabel = (status: string) => {
    switch (status) {
      case 'shipped': return 'Enviado'
      case 'delivered': return 'Entregado'
      case 'pending': return 'Pendiente'
      default: return status
    }
  }

  // Dropi handlers
  const handleDropiConnect = async () => {
    if (!dropiIntegrationKey.trim()) {
      setDropiError('Ingresa tu Integration Key de Dropi')
      return
    }
    setDropiConnecting(true)
    setDropiError('')
    try {
      const res = await fetch('/api/dropi/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrationKey: dropiIntegrationKey.trim() }),
      })
      const data = await res.json()
      if (res.ok && data.token) {
        setDropiToken(data.token)
        setDropiConnected(true)
        // Guardar en la DB para persistir
        await fetch('/api/config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ configs: { DROPI_TOKEN: data.token } }),
        })
      } else {
        setDropiError(data.error || 'Token invalido. Verifica tu Integration Key en app.dropi.co')
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
        body: JSON.stringify({ dropiToken, keywords: dropiSearch, page, pageSize: 20 }),
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
              <p className="text-gray-400 text-sm mt-1">Administra productos, combos, envios y pedidos</p>
            </div>
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="productos" className="gap-1.5 text-xs sm:text-sm"><Package className="w-4 h-4" />Productos</TabsTrigger>
              <TabsTrigger value="combos" className="gap-1.5 text-xs sm:text-sm"><Layers className="w-4 h-4" />Combos</TabsTrigger>
              <TabsTrigger value="pedidos" className="gap-1.5 text-xs sm:text-sm"><ClipboardList className="w-4 h-4" />Pedidos</TabsTrigger>
              <TabsTrigger value="envios" className="gap-1.5 text-xs sm:text-sm"><Truck className="w-4 h-4" />Andreani</TabsTrigger>
              <TabsTrigger value="dropi" className="gap-1.5 text-xs sm:text-sm"><Download className="w-4 h-4" />Dropi</TabsTrigger>
              <TabsTrigger value="config" className="gap-1.5 text-xs sm:text-sm"><CreditCard className="w-4 h-4" /><span className="hidden sm:inline">MP</span></TabsTrigger>
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
                      <Button variant="ghost" size="sm" className="flex-1 rounded-none text-gray-500 hover:text-emerald-600 gap-1" onClick={() => handleToggleProduct(product)}>
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

          {/* Orders Tab */}
          <TabsContent value="pedidos" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Pedidos ({orders.length})</h2>
                <p className="text-gray-400 text-sm">Historial completo de pedidos</p>
              </div>
              <Button variant="outline" className="gap-2" onClick={fetchOrders}>
                <RefreshCw className="w-4 h-4" />Actualizar
              </Button>
            </div>
            {orders.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <ClipboardList className="w-16 h-16 text-gray-300 mb-4" />
                  <p className="text-gray-400 text-lg">No hay pedidos aun</p>
                  <p className="text-gray-300 text-sm mt-1">Los pedidos apareceran aqui cuando los clientes compren</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => {
                  const addr = order.shippingAddress ? JSON.parse(order.shippingAddress) : null
                  return (
                    <Card key={order.id} className="overflow-hidden">
                      <CardContent className="p-5">
                        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-gray-800">{order.itemName}</span>
                              <Badge variant="outline" className="text-xs">{order.itemType === 'combo' ? 'Combo' : 'Producto'}</Badge>
                              <Badge className={paymentStatusColor(order.paymentStatus)}>{paymentStatusLabel(order.paymentStatus)}</Badge>
                              <Badge className="bg-blue-100 text-blue-700 text-xs">{shippingStatusLabel(order.shippingStatus)}</Badge>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                              <div>
                                <span className="text-gray-400 block text-xs">Cliente</span>
                                <span className="font-medium text-gray-700">{order.buyerName}</span>
                              </div>
                              <div>
                                <span className="text-gray-400 block text-xs">Email</span>
                                <span className="font-medium text-gray-700">{order.buyerEmail}</span>
                              </div>
                              <div>
                                <span className="text-gray-400 block text-xs">Telefono</span>
                                <span className="font-medium text-gray-700">{order.buyerPhone || '-'}</span>
                              </div>
                              <div>
                                <span className="text-gray-400 block text-xs">DNI</span>
                                <span className="font-medium text-gray-700">{order.buyerDni || '-'}</span>
                              </div>
                            </div>
                            {addr && (
                              <div className="text-sm">
                                <span className="text-gray-400 text-xs block">Direccion de envio</span>
                                <span className="font-medium text-gray-700">{addr.street} {addr.number}{addr.floor ? `, ${addr.floor}` : ''}, {addr.city}, {addr.province} (CP: {addr.postalCode})</span>
                              </div>
                            )}
                            <div className="text-xs text-gray-400">
                              {new Date(order.createdAt).toLocaleString('es-AR')} - Ref: {order.id.slice(0, 8)}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 lg:min-w-[200px]">
                            <div className="text-right">
                              <span className="text-gray-400 text-xs block">Total</span>
                              <span className="text-xl font-bold text-emerald-600">${order.total.toLocaleString('es-AR', { minimumFractionDigits: 0 })}</span>
                            </div>
                            <div className="text-right text-xs text-gray-400">
                              {order.quantity}x ${order.itemPrice.toLocaleString('es-AR')}
                              {order.shippingCost > 0 && ` + Envio $${order.shippingCost.toLocaleString('es-AR')}`}
                            </div>
                            {/* Tracking */}
                            <div className="flex items-center gap-2 w-full mt-2">
                              <Input
                                placeholder="Numero de tracking Andreani"
                                value={order.andreaniTrack || ''}
                                onChange={(e) => {
                                  const val = e.target.value
                                  setOrders(prev => prev.map(o => o.id === order.id ? { ...o, andreaniTrack: val } : o))
                                }}
                                className="h-8 text-xs"
                              />
                              <Button
                                size="sm"
                                className="h-8 px-3 bg-blue-600 hover:bg-blue-700"
                                onClick={() => handleUpdateTracking(order.id, order.andreaniTrack || '', order.shippingStatus === 'pending' ? 'shipped' : order.shippingStatus)}
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                            </div>
                            {order.andreaniTrack && (
                              <a
                                href={`https://www.andreani.com.ar/seguimiento/envio/${order.andreaniTrack}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                              >
                                <ExternalLink className="w-3 h-3" />Ver seguimiento
                              </a>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* Andreani Config Tab */}
          <TabsContent value="envios" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Truck className="w-5 h-5" />
                  Configuracion de Andreani
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="text-gray-500 text-sm">
                  Configura tu cuenta de Andreani para calcular costos de envio automaticamente.
                  Necesitas las credenciales de API de tu cuenta Andreani. Podes obtenerlas desde{' '}
                  <a href="https://developers.andreani.com.ar" target="_blank" rel="noreferrer" className="text-blue-600 underline hover:text-blue-700">Andreani Developers</a>.
                </p>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="apiUrl" className="text-sm font-medium">URL de API Andreani</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input id="apiUrl" value={andreaniApiUrl} onChange={(e) => setAndreaniApiUrl(e.target.value)} placeholder="https://api.andreani.com.ar" className="pl-10 h-11" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="contract" className="text-sm font-medium">Numero de Contrato</Label>
                      <Input id="contract" value={andreaniContract} onChange={(e) => setAndreaniContract(e.target.value)} placeholder="12345678" className="h-11" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="andUsername" className="text-sm font-medium">Usuario API (x-username)</Label>
                      <Input id="andUsername" value={andreaniUsername} onChange={(e) => setAndreaniUsername(e.target.value)} placeholder="tu_usuario" className="h-11" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="andPassword" className="text-sm font-medium">Clave API (x-password)</Label>
                      <Input id="andPassword" type="password" value={andreaniPassword} onChange={(e) => setAndreaniPassword(e.target.value)} placeholder="tu_clave" className="h-11" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="senderCp" className="text-sm font-medium">Codigo Postal de Origen (tu deposito)</Label>
                    <Input id="senderCp" value={andreaniSenderCp} onChange={(e) => setAndreaniSenderCp(e.target.value)} placeholder="1001" className="h-11 max-w-xs" />
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleSaveAndreani} disabled={configLoading} className="bg-blue-600 hover:bg-blue-700 gap-2">
                    {configLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Guardar Configuracion Andreani
                  </Button>
                  <Button onClick={handleTestAndreani} disabled={andreaniTesting} variant="outline" className="gap-2">
                    {andreaniTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
                    Probar Conexion
                  </Button>
                </div>
                {andreaniSaved && (
                  <p className="text-emerald-600 text-sm flex items-center gap-1"><Check className="w-4 h-4" /> Configuracion de Andreani guardada correctamente</p>
                )}
                {andreaniTestResult && (
                  <div className={`p-3 rounded-lg text-sm ${andreaniTestResult.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                    {andreaniTestResult.message}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Shipping Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="w-5 h-5" />
                  Info de Envios
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-gray-600">
                <p>Los envios se calculan automaticamente usando la API de Andreani cuando el cliente ingresa su codigo postal. El sistema obtiene las tarifas disponibles para ese destino y las muestra en el checkout.</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-1">Peso por defecto</h4>
                    <p className="text-blue-600">0.5 kg (suplementos)</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-1">Dimensiones por defecto</h4>
                    <p className="text-blue-600">25x15x10 cm</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-1">Cotizacion en vivo</h4>
                    <p className="text-blue-600">Directo desde Andreani</p>
                  </div>
                </div>
              </CardContent>
            </Card>
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
                  <a href="https://app.dropi.co" target="_blank" rel="noreferrer" className="text-blue-600 underline hover:text-blue-700">app.dropi.co</a>.
                </p>

                {!dropiConnected ? (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="dropiKey" className="text-sm font-medium">Integration Key de Dropi</Label>
                      <Input
                        id="dropiKey"
                        type="text"
                        value={dropiIntegrationKey}
                        onChange={(e) => setDropiIntegrationKey(e.target.value)}
                        placeholder="Pega aqui tu Integration Key de Dropi..."
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-gray-400">
                        Encontra tu Integration Key en: app.dropi.co {'>'} Tiendas {'>'} tu tienda {'>'} Token de integracion
                      </p>
                    </div>
                    {dropiError && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{dropiError}</p>}
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
        </Tabs>
      </main>

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
