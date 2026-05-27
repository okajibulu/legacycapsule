/* =========================================================
   app/api/admin/capsule/components/route.ts
   Updates capsules.components array
========================================================= */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminAuthenticated } from '@/lib/admin/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  if (!await isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { capsuleId, components } = await request.json()
  if (!capsuleId || !Array.isArray(components)) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const { error } = await supabase
    .from('capsules')
    .update({ components })
    .eq('id', capsuleId)

  if (error) {
    console.error('Components update error:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }

  // Log to audit table
  try {
    await supabase.from('admin_audit_log').insert({
      action: 'update_components',
      entity_type: 'capsule',
      entity_id: capsuleId,
      details: { components },
    })
  } catch { /* non-fatal */ }

  return NextResponse.json({ success: true })
}
