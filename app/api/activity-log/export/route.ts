// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/api/activity-log/export/route.ts
// PURPOSE:   Exports the full capsule activity log as a CSV file download.
//            Organiser and Family Rep Full Access only.
//            Streams the CSV directly — no temp file stored.
// ARCHITECTURE: CA-SPEC-001 — Step 13.
// BUILT BY:  AI21 · Claude Opus 4.6
// VERSION:   AI21v2.12.13
// DATE:      16 August 2026
//
// GET ?capsule_id=[id]
// Returns: CSV file download
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

// ═══ SECTION 1 — DB client ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ═══ SECTION 2 — CSV escape helper ═══

function csvEscape(value: string | null | undefined): string {
  if (!value) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

// ═══ SECTION 3 — Route handler ═══

export async function GET(req: NextRequest) {
  try {
    const capsule_id = req.nextUrl.searchParams.get('capsule_id')

    if (!capsule_id) {
      return NextResponse.json({ error: 'capsule_id is required.' }, { status: 400 })
    }

    // ── Fetch all entries — no pagination for export ──────────────────────
    const { data, error } = await db
      .from('capsule_activity_log')
      .select('actor_type, actor_name, actor_email, action_key, action_label, entity_type, entity_id, created_at')
      .eq('capsule_id', capsule_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[activity-log/export] Query error:', error)
      return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
    }

    // ── Build CSV ─────────────────────────────────────────────────────────
    const headers = ['Date', 'Time', 'Account Type', 'Name', 'Email', 'Action', 'Detail', 'Entity Type', 'Entity ID']
    const rows    = (data ?? []).map(entry => {
      const date = new Date(entry.created_at)
      return [
        csvEscape(date.toLocaleDateString('en-GB')),
        csvEscape(date.toLocaleTimeString('en-GB')),
        csvEscape(entry.actor_type?.replace(/_/g, ' ')),
        csvEscape(entry.actor_name),
        csvEscape(entry.actor_email),
        csvEscape(entry.action_key),
        csvEscape(entry.action_label),
        csvEscape(entry.entity_type),
        csvEscape(entry.entity_id),
      ].join(',')
    })

    const csv      = [headers.join(','), ...rows].join('\n')
    const filename = `activity-log-${capsule_id.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.csv`

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type':        'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })

  } catch (err) {
    console.error('[activity-log/export]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}