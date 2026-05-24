import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { extendCapsule } from '@/lib/admin/actions'

export async function POST(req: NextRequest) {
  if (!await isAdminAuthenticated()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { capsuleId, days, reason } = await req.json()
  await extendCapsule(capsuleId, days, reason)
  return NextResponse.json({ ok: true })
}
