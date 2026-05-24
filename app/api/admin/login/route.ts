/* =========================================================
   app/api/admin/login/route.ts
========================================================= */
import { NextRequest, NextResponse } from 'next/server'
import { validatePassword, createSession } from '@/lib/admin/auth'

export async function POST(request: NextRequest) {
  const { password } = await request.json()
  if (!validatePassword(password)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await createSession()
  return NextResponse.json({ ok: true })
}
