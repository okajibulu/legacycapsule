import { cookies } from 'next/headers'

const SESSION_KEY = 'lcadmin_session'
const MAX_AGE = 60 * 60 * 8 // 8 hours

export async function setAdminSession() {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_KEY, process.env.LCADMIN_SESSION_SECRET!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: MAX_AGE,
    path: '/admin',
    sameSite: 'lax',
  })
}

export async function clearAdminSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_KEY)
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(SESSION_KEY)
  return cookie?.value === process.env.LCADMIN_SESSION_SECRET
}
