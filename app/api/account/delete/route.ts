/* =========================================================
   app/api/account/delete/route.ts
   Permanently deletes organiser account and all capsules
   GDPR Article 17 — Right to Erasure xxxxxx
========================================================= */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { email, confirmation } = await request.json()

    if (!email || confirmation !== 'DELETE') {
      return NextResponse.json({ error: 'Invalid confirmation' }, { status: 400 })
    }

    const normalised = email.trim().toLowerCase()

    // Soft-delete all capsules belonging to this organiser
    const { data: capsules } = await supabase
      .from('capsules')
      .select('id')
      .eq('organiser_email', normalised)
      .is('deleted_at', null)

    if (capsules && capsules.length > 0) {
      const capsuleIds = capsules.map(c => c.id)

      await supabase
        .from('capsules')
        .update({ deleted_at: new Date().toISOString(), page_state: 'deleted' })
        .in('id', capsuleIds)

      // Remove capsule_access rows
      await supabase
        .from('capsule_access')
        .delete()
        .in('capsule_id', capsuleIds)

      // Invalidate portal tokens
      await supabase
        .from('honouree_portal_tokens')
        .delete()
        .in('capsule_id', capsuleIds)
    }

    // Delete profile
    await supabase
      .from('profiles')
      .delete()
      .eq('email', normalised)

    // Delete Supabase Auth account
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const authUser = users?.find((u: any) => u.email === normalised)
    if (authUser) {
      await supabase.auth.admin.deleteUser(authUser.id)
    }

    // Log deletion for audit
try {
  await supabase.from('admin_audit_log').insert({
    action: 'account_deleted',
    entity_type: 'profile',
    entity_id: normalised,
    details: { capsules_deleted: capsules?.length ?? 0, requested_by: normalised },
  })
} catch { /* non-fatal */ }

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('Delete account error:', err)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}
