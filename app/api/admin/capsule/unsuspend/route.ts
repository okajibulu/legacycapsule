import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { unsuspendCapsule } from '@/lib/admin/actions'

export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id, reason } = await req.json()
  await unsuspendCapsule(id, reason)
  return NextResponse.json({ ok: true })
}