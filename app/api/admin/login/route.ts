import { NextRequest, NextResponse } from 'next/server'
import { setAdminSession } from '@/lib/admin/auth'

export async function POST(req: NextRequest) {
  const { password } = await req.json()

  if (password !== process.env.LCADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  setAdminSession()
  return NextResponse.json({ ok: true })
}
