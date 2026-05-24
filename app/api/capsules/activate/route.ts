import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { activateCapsule } from '@/lib/admin/actions'

export async function POST(req: NextRequest) {
  if (!await isAdminAuthenticated()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { capsuleId } = await req.json()
  await activateCapsule(capsuleId)
  return NextResponse.json({ ok: true })
}
