import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { removeContribution } from '@/lib/admin/actions'

export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id, reason } = await req.json()
  await removeContribution(id, reason ?? 'Admin moderation removal')
  return NextResponse.json({ ok: true })
}
