/* =========================================================
   app/api/admin/logout/route.ts
========================================================= */
import { NextRequest, NextResponse } from 'next/server'
import { clearSession } from '@/lib/admin/auth'

export async function POST(request: NextRequest) {
  await clearSession()
  return NextResponse.redirect(new URL('/admin', request.url))
}
