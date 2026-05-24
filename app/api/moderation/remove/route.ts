import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { adminRemoveContribution } from '@/lib/admin/actions'

export async function POST(req: NextRequest) {
  if (!await isAdminAuthenticated()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, reason } = await req.json()
  await adminRemoveContribution(id, reason)
  return NextResponse.json({ ok: true })
}
