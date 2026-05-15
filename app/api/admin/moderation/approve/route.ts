import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { approveContribution } from '@/lib/admin/actions'

export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id, reason } = await req.json()
  await approveContribution(id, reason ?? 'Admin moderation approval')
  return NextResponse.json({ ok: true })
}
