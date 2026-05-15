import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { changeCapsuleState } from '@/lib/admin/actions'

export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id, state, reason } = await req.json()
  await changeCapsuleState(id, state, reason)
  return NextResponse.json({ ok: true })
}
