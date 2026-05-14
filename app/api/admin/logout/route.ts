import { NextResponse } from 'next/server'
import { clearAdminSession } from '@/lib/admin/auth'

export async function POST() {
  clearAdminSession()
  return NextResponse.redirect(
    new URL('/admin/login', process.env.NEXT_PUBLIC_APP_URL!)
  )
}