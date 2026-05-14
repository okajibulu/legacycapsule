import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { addCapsuleNote } from '@/lib/admin/actions'

export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id, note } = await req.json()
  await addCapsuleNote(id, note)
  return NextResponse.json({ ok: true })
}