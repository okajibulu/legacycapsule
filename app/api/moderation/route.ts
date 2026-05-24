import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { getPendingContributions } from '@/lib/admin/actions'

export async function GET() {
  if (!await isAdminAuthenticated()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const items = await getPendingContributions()
  return NextResponse.json({ items })
}
