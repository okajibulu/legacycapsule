// ─────────────────────────────────────────────────────────────────────────────
// LCAdmin — Content API Route
// Handles update, add_feature, delete_feature actions for lc_content table.
// Service role key used — never expose to client.
// ─────────────────────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin/auth'
import {
  updateContentRow,
  addContentFeature,
  deleteContentFeature,
} from '@/lib/admin/actions'

export async function POST(req: NextRequest) {
  // ── Auth guard ─────────────────────────────────────────────────────────────
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { action } = body

  // ── Route by action ────────────────────────────────────────────────────────
  try {
    if (action === 'update') {
      // Update the value of an existing content row
      const { key, value, reason } = body
      if (!key || value === undefined) {
        return NextResponse.json({ error: 'key and value required' }, { status: 400 })
      }
      await updateContentRow(key, value, reason ?? 'LCAdmin content edit')
      return NextResponse.json({ ok: true })
    }

    if (action === 'add_feature') {
      // Add a new feature bullet to a tier group
      const { groupKey, value, nextSortOrder } = body
      if (!groupKey || !value || nextSortOrder === undefined) {
        return NextResponse.json(
          { error: 'groupKey, value, and nextSortOrder required' },
          { status: 400 }
        )
      }
      await addContentFeature(groupKey, value, nextSortOrder)
      return NextResponse.json({ ok: true })
    }

    if (action === 'delete_feature') {
      // Delete a feature bullet by key
      const { key } = body
      if (!key) {
        return NextResponse.json({ error: 'key required' }, { status: 400 })
      }
      await deleteContentFeature(key)
      return NextResponse.json({ ok: true })
    }

    // Unknown action
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })

  } catch (err) {
    console.error('Content API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}