/* =========================================================
   lib/admin/auth.ts
   Phase 1 admin auth — env-var password + cookie session.
   Phase 2 replaces with Supabase Auth + role-based RLS.
   
   ENV VARS REQUIRED:
   - LCADMIN_PASSWORD — the admin password
   - LCADMIN_SESSION_SECRET — signs the session cookie
========================================================= */

import { cookies } from 'next/headers'
import crypto from 'crypto'

const PASSWORD = process.env.LCADMIN_PASSWORD ?? 'lcadmin2026'
const SECRET = process.env.LCADMIN_SESSION_SECRET ?? 'lc-session-secret-change-me'
const COOKIE_NAME = 'lcadmin_session'
const SESSION_HOURS = 24

function signToken(payload: string): string {
  const hmac = crypto.createHmac('sha256', SECRET)
  hmac.update(payload)
  return `${payload}.${hmac.digest('hex')}`
}

function verifyToken(token: string): boolean {
  const parts = token.split('.')
  if (parts.length !== 2) return false
  const [payload, sig] = parts
  const hmac = crypto.createHmac('sha256', SECRET)
  hmac.update(payload)
  return hmac.digest('hex') === sig
}

export function validatePassword(input: string): boolean {
  return input === PASSWORD
}

export async function createSession(): Promise<void> {
  const expires = Date.now() + SESSION_HOURS * 60 * 60 * 1000
  const token = signToken(String(expires))
  const cookieStore = await cookies()
cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_HOURS * 60 * 60,
  })
}

export async function isAdminAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const session = cookieStore.get(COOKIE_NAME)
    if (!session?.value) return false
    if (!verifyToken(session.value)) return false
    const [expiresStr] = session.value.split('.')
    return Date.now() < Number(expiresStr)
  } catch {
    return false
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}
