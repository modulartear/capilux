import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

async function authenticate(request: NextRequest) {
  const token = request.cookies.get('capilux-auth')?.value
  if (!token) return false
  const payload = await verifyToken(token)
  return !!payload
}

const DROPI_API = 'https://api.dropi.co'

export async function POST(request: NextRequest) {
  try {
    const isAuth = await authenticate(request)
    if (!isAuth) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contrasena son requeridos' }, { status: 400 })
    }

    const loginRes = await fetch(`${DROPI_API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const loginData = await loginRes.json()

    if (!loginRes.ok || !loginData.token) {
      return NextResponse.json(
        { error: 'Credenciales de Dropi invalidas' },
        { status: 401 }
      )
    }

    return NextResponse.json({ success: true, token: loginData.token })
  } catch {
    return NextResponse.json({ error: 'Error al conectar con Dropi' }, { status: 500 })
  }
}
