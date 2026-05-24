import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { getAllFlags, setFeatureFlag } from '@/lib/admin/actions'

export async function GET() {
  if (!await isAdminAuthenticated()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const flags = await getAllFlags()
  return NextResponse.json({ flags })
}

export async function POST(req: NextRequest) {
  if (!await isAdminAuthenticated()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { key, enabled, reason } = await req.json()
  await setFeatureFlag(key, enabled, reason)
  return NextResponse.json({ ok: true })
}
