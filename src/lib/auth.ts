import { SignJWT, jwtVerify } from 'jose'

const ADMIN_EMAIL = 'modularte.ar@gmail.com'
const ADMIN_PASSWORD = 'Caseros305'
const JWT_SECRET = new TextEncoder().encode('capilux-secret-key-2024')

export interface AuthPayload {
  email: string
  iat: number
  exp: number
}

export async function verifyCredentials(email: string, password: string): Promise<boolean> {
  return email === ADMIN_EMAIL && password === ADMIN_PASSWORD
}

export async function createToken(email: string): Promise<string> {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as AuthPayload
  } catch {
    return null
  }
}
