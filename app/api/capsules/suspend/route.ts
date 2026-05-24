import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { suspendCapsule } from '@/lib/admin/actions'

export async function POST(req: NextRequest) {
  if (!await isAdminAuthenticated()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { capsuleId, reason } = await req.json()
  await suspendCapsule(capsuleId, reason)
  return NextResponse.json({ ok: true })
}
