// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/api/honouree/acknowledgement/route.ts
// PURPOSE: Records EOH supporter acknowledgement.
//          Sends auto-ack email to supporter via sendSupportThankYou.
//          Schedules (or reschedules) daily digest to honouree portal holder.
// ARCHITECTURE: LC05 Engagement Engine · Expression of Honour
// UPDATED: Claude Sonnet 4.6 · July 2026
//   — Added EOH daily digest scheduling via Resend scheduledAt
//   — cancel+reschedule pattern ensures digest always includes full day's gifters
// ─────────────────────────────────────────────────────────────────────────────

/*
 * Flow:
 * 1. Validate body
 * 2. Insert support_acknowledgements record
 * 3. If supporter provided email → fire sendSupportThankYou (auto-ack)
 * 4. Schedule / reschedule midnight UTC digest to honouree portal email
 * 5. Return ok
 *
 * Body: {
 *   capsule_id:         string
 *   support_account_id: string
 *   supporter_name:     string
 *   supporter_email?:   string  (optional — contributor may skip)
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { sendSupportThankYou }       from '@/lib/honoureeEmail'
import { Resend }                    from 'resend'

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Clients
// ─────────────────────────────────────────────────────────────────────────────

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY!)

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — Route handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {

  // ── 2.1  Parse and validate body ──────────────────────────────────────────

  let body: {
    capsule_id:         string
    support_account_id: string
    supporter_name:     string
    supporter_email?:   string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const { capsule_id, support_account_id, supporter_name, supporter_email } = body

  if (!capsule_id || !support_account_id || !supporter_name?.trim()) {
    return NextResponse.json(
      { error: 'capsule_id, support_account_id, and supporter_name are required.' },
      { status: 400 }
    )
  }

  // ── 2.2  Fetch capsule ────────────────────────────────────────────────────

  const { data: capsule } = await adminClient
    .from('capsules')
    .select('id, slug, event_type, honouree_name, organiser_email')
    .eq('id', capsule_id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!capsule) {
    return NextResponse.json({ error: 'Capsule not found.' }, { status: 404 })
  }

  // ── 2.3  Fetch support account for method label ───────────────────────────

  const { data: account } = await adminClient
    .from('capsule_support_accounts')
    .select('method_label')
    .eq('id', support_account_id)
    .eq('capsule_id', capsule_id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!account) {
    return NextResponse.json({ error: 'Support account not found.' }, { status: 404 })
  }

  // ── 2.4  Insert acknowledgement record ────────────────────────────────────

  const { error: insertErr } = await adminClient
    .from('support_acknowledgements')
    .insert({
      capsule_id,
      support_account_id,
      supporter_name:  supporter_name.trim(),
      supporter_email: supporter_email?.trim() || null,
    })

  if (insertErr) {
    console.error('[acknowledgement] insert error:', insertErr.message)
    return NextResponse.json(
      { error: 'Failed to record acknowledgement.' },
      { status: 500 }
    )
  }

  // ── 2.5  Auto-acknowledgement email to supporter ──────────────────────────

  let emailSent = false

  if (supporter_email?.trim()) {
    const result = await sendSupportThankYou({
      capsuleId:      capsule_id,
      eventType:      capsule.event_type,
      honoureeName:   capsule.honouree_name,
      slug:           capsule.slug,
      supporterName:  supporter_name.trim(),
      supporterEmail: supporter_email.trim(),
      methodLabel:    account.method_label,
    })

    if (result.ok) {
      await adminClient
        .from('support_acknowledgements')
        .update({ thank_you_sent_at: new Date().toISOString() })
        .eq('capsule_id', capsule_id)
        .eq('supporter_name', supporter_name.trim())
        .order('created_at', { ascending: false })
        .limit(1)

      emailSent = true
    }
  }

  // ── 2.6  Schedule / reschedule EOH daily digest ───────────────────────────
  // Pattern: each new submission cancels the existing Resend scheduled send
  // and creates a new one with the full day's gifters compiled at this moment.
  // The midnight UTC send will always contain all gifters up to the last
  // submission before midnight.

  try {
    const todayUtc = new Date().toISOString().split('T')[0]

    // Fetch honouree portal email — primary digest recipient
    const { data: portal } = await adminClient
      .from('honouree_portal_tokens')
      .select('honouree_email')
      .eq('capsule_id', capsule_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const digestRecipient = portal?.honouree_email ?? capsule.organiser_email

    // Cancel existing scheduled digest for today if present
    const { data: existing } = await adminClient
      .from('eoh_digest_schedule')
      .select('id, resend_email_id')
      .eq('capsule_id', capsule_id)
      .eq('digest_date', todayUtc)
      .is('sent_at', null)
      .maybeSingle()

    if (existing?.resend_email_id) {
      try {
        await resend.emails.cancel(existing.resend_email_id)
      } catch {
        // Already sent or expired — safe to continue
      }
    }

    // Fetch all today's gifters
    const { data: todayGifters } = await adminClient
      .from('support_acknowledgements')
      .select('supporter_name, acknowledged_at')
      .eq('capsule_id', capsule_id)
      .gte('acknowledged_at', todayUtc + 'T00:00:00.000Z')
      .lte('acknowledged_at', todayUtc + 'T23:59:59.999Z')
      .order('acknowledged_at', { ascending: true })

    // Fetch YTD count
    const { count: ytdCount } = await adminClient
      .from('support_acknowledgements')
      .select('*', { count: 'exact', head: true })
      .eq('capsule_id', capsule_id)

    const count = todayGifters?.length ?? 1

    const gifterRows = (todayGifters ?? []).map((g: {
      supporter_name: string
      acknowledged_at: string
    }) => {
      const time = new Date(g.acknowledged_at).toLocaleTimeString('en-GB', {
        hour: '2-digit', minute: '2-digit',
      })
      return '<tr><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">'
        + '<p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:rgba(255,255,255,0.85);font-weight:600;">' + g.supporter_name + '</p>'
        + '<p style="margin:3px 0 0;font-family:Arial,sans-serif;font-size:12px;color:rgba(226,195,107,0.7);">' + time + ' via ' + account.method_label + '</p>'
        + '</td></tr>'
    }).join('')

    const digestHtml = '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F5F3EE;">'
      + '<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3EE;">'
      + '<tr><td align="center" style="padding:40px 20px;">'
      + '<table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#1a0d3a;border-radius:16px;overflow:hidden;">'
      + '<tr><td height="3" style="background:linear-gradient(90deg,transparent,#E2C36B,transparent);"></td></tr>'
      + '<tr><td style="padding:36px 40px 16px;">'
      + '<p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:rgba(226,195,107,0.5);">LEGACYCAPSULE - EXPRESSION OF HONOUR</p>'
      + '<h1 style="margin:0;font-family:Georgia,serif;font-size:22px;font-weight:700;color:#FFFFFF;">Daily Summary for <span style="color:#E2C36B;">' + capsule.honouree_name + '</span></h1>'
      + '</td></tr>'
      + '<tr><td style="padding:0 40px;"><div style="height:1px;background:linear-gradient(90deg,transparent,rgba(226,195,107,0.25),transparent);"></div></td></tr>'
      + '<tr><td style="padding:24px 40px 0;">'
      + '<p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:rgba(226,195,107,0.55);">'
      + count + ' New Expression' + (count !== 1 ? 's' : '') + ' Today</p>'
      + '<table width="100%" cellpadding="0" cellspacing="0">' + gifterRows + '</table>'
      + '</td></tr>'
      + '<tr><td style="padding:20px 40px 32px;">'
      + '<div style="background:rgba(226,195,107,0.06);border:1px solid rgba(226,195,107,0.15);border-radius:10px;padding:16px 20px;">'
      + '<p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(226,195,107,0.5);">Total Expressions to Date</p>'
      + '<p style="margin:0;font-family:Georgia,serif;font-size:28px;font-weight:700;color:#E2C36B;">' + (ytdCount ?? 0) + '</p>'
      + '</div></td></tr>'
      + '<tr><td height="3" style="background:linear-gradient(90deg,transparent,#E2C36B,transparent);"></td></tr>'
      + '<tr><td style="padding:14px 40px 18px;text-align:center;">'
      + '<p style="margin:0;font-family:Arial,sans-serif;font-size:9px;color:rgba(255,255,255,0.18);letter-spacing:2px;text-transform:uppercase;">LEGACYCAPSULE - VALNEX, UNIPESSOAL LDA - REVOWORLDTECH</p>'
      + '</td></tr>'
      + '</table></td></tr></table></body></html>'

    // Schedule digest for midnight UTC (start of tomorrow)
    const midnight = new Date()
    midnight.setUTCDate(midnight.getUTCDate() + 1)
    midnight.setUTCHours(0, 0, 0, 0)

    const digestResult = await resend.emails.send({
      from:        'LegacyCapsule <memories@itslegacycapsule.com>',
      to:          digestRecipient,
      ...(digestRecipient !== capsule.organiser_email && { cc: capsule.organiser_email }),
      subject:     count + ' expression' + (count !== 1 ? 's' : '') + ' of honour for ' + capsule.honouree_name + ' - Daily Summary',
      scheduledAt: midnight.toISOString(),
      html:        digestHtml,
    })

    // Upsert schedule record
    await adminClient
      .from('eoh_digest_schedule')
      .upsert({
        capsule_id,
        digest_date:     todayUtc,
        resend_email_id: digestResult.data?.id ?? null,
        sent_at:         null,
      }, { onConflict: 'capsule_id,digest_date' })

  } catch (digestErr) {
    console.error('[acknowledgement] Digest scheduling error:', digestErr)
    // Non-critical — never fail the submission over digest scheduling
  }

  // ── 2.7  Return success ───────────────────────────────────────────────────

  return NextResponse.json({
    ok:         true,
    email_sent: emailSent,
  }, { status: 201 })
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — Method guard
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed.' }, { status: 405 })
}