import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { extendCapsuleExpiry } from '@/lib/admin/actions'

export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id, newDate, reason } = await req.json()
  await extendCapsuleExpiry(id, newDate, reason)
  return NextResponse.json({ ok: true })
}