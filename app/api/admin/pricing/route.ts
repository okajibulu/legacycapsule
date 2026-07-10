import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import { getAllPricing, updatePrice, publishPrice, unpublishPrice } from '@/lib/admin/actions'

export async function GET() {
  if (!await isAdminAuthenticated()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await getAllPricing()
  return NextResponse.json({ rows })
}

export async function POST(req: NextRequest) {
  if (!await isAdminAuthenticated()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { key, eur_price, ngn_price, reason, action } = await req.json()
  if (action === 'publish')   { await publishPrice(key, reason);   return NextResponse.json({ ok: true }) }
  if (action === 'unpublish') { await unpublishPrice(key, reason); return NextResponse.json({ ok: true }) }
  await updatePrice(key, eur_price, ngn_price, reason)
  return NextResponse.json({ ok: true })
}
