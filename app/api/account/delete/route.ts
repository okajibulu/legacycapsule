/* =========================================================
   app/api/account/delete/route.ts
   Deletes a single capsule. Only deletes auth user + profile
   when NO active capsules remain under the email.
   GDPR Article 17 — Right to Erasure
   Fixed: AI7 — prevents auth deletion when other capsules exist
========================================================= */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { email, confirmation, capsuleId } = await request.json()

    if (!email || confirmation !== 'DELETE') {
      return NextResponse.json({ error: 'Invalid confirmation' }, { status: 400 })
    }

    const normalised = email.trim().toLowerCase()

    // ── Soft-delete the specific capsule only ─────────────────────────────
    if (capsuleId) {
      await supabase
        .from('capsules')
        .update({ deleted_at: new Date().toISOString(), page_state: 'deleted' })
        .eq('id', capsuleId)
        .eq('organiser_email', normalised)

      await supabase.from('capsule_access').delete().eq('capsule_id', capsuleId)
      await supabase.from('honouree_portal_tokens').delete().eq('capsule_id', capsuleId)
    } else {
      // Legacy path — soft-delete all capsules
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
        await supabase.from('capsule_access').delete().in('capsule_id', capsuleIds)
        await supabase.from('honouree_portal_tokens').delete().in('capsule_id', capsuleIds)
      }
    }

    // ── Check if any active capsules remain ───────────────────────────────
    const { data: remaining } = await supabase
      .from('capsules')
      .select('id')
      .eq('organiser_email', normalised)
      .is('deleted_at', null)

    const hasRemaining = (remaining?.length ?? 0) > 0

    // ── Only delete profile + auth if NO capsules remain ──────────────────
    if (!hasRemaining) {
      await supabase.from('profiles').delete().eq('email', normalised)

      const { data: { users } } = await supabase.auth.admin.listUsers()
      const authUser = users?.find((u: any) => u.email === normalised)
      if (authUser) {
        await supabase.auth.admin.deleteUser(authUser.id)
      }
    }

    // ── Audit log ─────────────────────────────────────────────────────────
    try {
      await supabase.from('admin_audit_log').insert({
        action: hasRemaining ? 'capsule_deleted' : 'account_deleted',
        entity_type: 'profile',
        entity_id: normalised,
        details: {
          capsule_id: capsuleId ?? 'all',
          remaining_capsules: remaining?.length ?? 0,
          requested_by: normalised,
        },
      })
    } catch { /* non-fatal */ }

    return NextResponse.json({ success: true, accountDeleted: !hasRemaining })

  } catch (err) {
    console.error('Delete account error:', err)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}