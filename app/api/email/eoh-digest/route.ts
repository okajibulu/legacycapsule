// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/api/email/eoh-digest/route.ts
// PURPOSE:   EOH Daily Digest — sends a midnight summary of the day's Expressions
//            of Honour to the honouree portal email (family rep or honouree directly).
//            Called by scheduled send mechanism (Resend / cron).
//            Only sent on days where new expressions of honour have arrived.
// ARCHITECTURE: LC05 Engagement Engine — Gifting (EOH).
//               Private briefing tone — reads like a trusted daily summary,
//               not a notification or receipt.
// BUILT BY:  AI13 · Claude Opus 4.6 · 22 July 2026
// UPDATED:   AI20 · Claude Sonnet 4.6 · 11 August 2026
//            — Header standardised to project format
//            — Section markers unified to ═══ SECTION N ═══ style
//            — Subject line warmed per ECS tone standard
//            — No logic changes
// VERSION:   AI20v2.11.91
// DATE:      11 August 2026
// POST body: { capsule_id, digest_date }
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

// ═══ SECTION 1 — Clients ═══

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY!)

// ═══ SECTION 2 — Route handler ═══
// POST body: { capsule_id, digest_date }

export async function POST(req: NextRequest) {
  try {
    const { capsule_id, digest_date } = await req.json()

    if (!capsule_id || !digest_date) {
      return NextResponse.json(
        { error: 'capsule_id and digest_date are required.' },
        { status: 400 }
      )
    }

    // ── Fetch capsule ──────────────────────────────────────────────────────
    const { data: capsule } = await adminClient
      .from('capsules')
      .select('honouree_name, event_type, organiser_email')
      .eq('id', capsule_id)
      .single()

    if (!capsule) {
      return NextResponse.json({ error: 'Capsule not found.' }, { status: 404 })
    }

    // ── Fetch honouree portal email ────────────────────────────────────────
    const { data: portal } = await adminClient
      .from('honouree_portal_tokens')
      .select('honouree_email')
      .eq('capsule_id', capsule_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const recipientEmail = portal?.honouree_email ?? capsule.organiser_email

    // ── Fetch today's gifters ──────────────────────────────────────────────
    const dateStart = `${digest_date}T00:00:00.000Z`
    const dateEnd   = `${digest_date}T23:59:59.999Z`

    const { data: todayGifters } = await adminClient
      .from('support_acknowledgements')
      .select('supporter_name, supporter_email, amount_acknowledged, method_label, acknowledged_at')
      .eq('capsule_id', capsule_id)
      .gte('acknowledged_at', dateStart)
      .lte('acknowledged_at', dateEnd)
      .order('acknowledged_at', { ascending: true })

    if (!todayGifters || todayGifters.length === 0) {
      return NextResponse.json({ skipped: true, reason: 'No gifters today.' })
    }

    // ── Fetch YTD count — count only, no amount aggregation ───────────────
    // Currency is unknown; amounts not surfaced to avoid misleading display.
    const { data: allGifters } = await adminClient
      .from('support_acknowledgements')
      .select('id')
      .eq('capsule_id', capsule_id)

    const ytdCount = allGifters?.length ?? 0

    // ── Send digest ────────────────────────────────────────────────────────
    await resend.emails.send({
      from: 'LegacyCapsule <memories@itslegacycapsule.com>',
      to:   recipientEmail,
      ...(capsule.organiser_email !== recipientEmail && { cc: capsule.organiser_email }),
      // ECS: subject communicates the moment, not a system action
      subject: `${todayGifters.length} voice${todayGifters.length !== 1 ? 's' : ''} of honour arrived today — ${capsule.honouree_name}`,
      html: eohDigestHtml({
        honoureeName: capsule.honouree_name,
        digestDate:   digest_date,
        todayGifters,
        ytdCount,
      }),
    })

    // ── Mark digest as sent ────────────────────────────────────────────────
    await adminClient
      .from('eoh_digest_schedule')
      .update({ sent_at: new Date().toISOString() })
      .eq('capsule_id', capsule_id)
      .eq('digest_date', digest_date)

    return NextResponse.json({
      ok:           true,
      sent_to:      recipientEmail,
      gifter_count: todayGifters.length,
    })

  } catch (err) {
    console.error('[eoh-digest]', err)
    return NextResponse.json(
      { error: 'Something went wrong sending the digest. Please try again.' },
      { status: 500 }
    )
  }
}

// ═══ SECTION 3 — EOH Digest email template ═══
// Private briefing tone — reads like a personal daily summary from a trusted
// aide. Not a notification or receipt. Audience: honouree / family rep only.

interface DigestGifter {
  supporter_name:      string
  amount_acknowledged: number | null
  method_label:        string | null
  acknowledged_at:     string
}

function eohDigestHtml(d: {
  honoureeName: string
  digestDate:   string
  todayGifters: DigestGifter[]
  ytdCount:     number
}) {
  const dateFormatted = new Date(d.digestDate).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const gifterRows = d.todayGifters.map(g => {
    const time   = new Date(g.acknowledged_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    const method = g.method_label ? ` &middot; via ${g.method_label}` : ''
    return `
      <tr>
        <td style="padding:11px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
          <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:rgba(255,255,255,0.88);font-weight:600;">${g.supporter_name}</p>
          <p style="margin:3px 0 0;font-family:Arial,sans-serif;font-size:12px;color:rgba(226,195,107,0.65);">${time}${method}</p>
        </td>
      </tr>`
  }).join('')

  const todayCount = d.todayGifters.length

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Daily Summary &mdash; ${d.honoureeName}</title>
</head>
<body style="margin:0;padding:0;background:#F5F3EE;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3EE;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#1a0d3a;border-radius:16px;overflow:hidden;">

        <!-- Gold top bar -->
        <tr><td height="3" style="background:linear-gradient(90deg,transparent,#E2C36B,transparent);font-size:0;">&nbsp;</td></tr>

        <!-- Header -->
        <tr><td style="padding:36px 40px 8px;">
          <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:rgba(226,195,107,0.55);">
            LEGACYCAPSULE &middot; GIFTING DIGEST
          </p>
          <h1 style="margin:0;font-family:'Georgia',serif;font-size:22px;font-weight:700;color:#FFFFFF;line-height:1.3;">
            Daily Summary for<br/><span style="color:#E2C36B;">${d.honoureeName}</span>
          </h1>
          <p style="margin:8px 0 0;font-family:Arial,sans-serif;font-size:12px;color:rgba(255,255,255,0.35);">${dateFormatted}</p>
        </td></tr>

        <!-- Gold divider -->
        <tr><td style="padding:20px 40px 0;">
          <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(226,195,107,0.25),transparent);"></div>
        </td></tr>

        <!-- Today's gifters -->
        <tr><td style="padding:24px 40px 0;">
          <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:rgba(226,195,107,0.55);">
            ${todayCount} Expression${todayCount !== 1 ? 's' : ''} of Honour Today
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${gifterRows}
          </table>
        </td></tr>

        <!-- YTD count -->
        <tr><td style="padding:24px 40px 32px;">
          <div style="background:rgba(226,195,107,0.06);border:1px solid rgba(226,195,107,0.15);border-radius:10px;padding:16px 20px;">
            <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(226,195,107,0.5);">
              Total Expressions of Honour Received
            </p>
            <p style="margin:0;font-family:'Georgia',serif;font-size:28px;font-weight:700;color:#E2C36B;">${d.ytdCount}</p>
            <p style="margin:4px 0 0;font-family:Arial,sans-serif;font-size:11px;color:rgba(255,255,255,0.25);line-height:1.6;">
              Cumulative count since the capsule was created.
            </p>
          </div>
        </td></tr>

        <!-- Gold bottom bar -->
        <tr><td height="3" style="background:linear-gradient(90deg,transparent,#E2C36B,transparent);font-size:0;">&nbsp;</td></tr>

        <!-- Footer -->
        <tr><td style="padding:16px 40px 20px;text-align:center;">
          <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:9px;color:rgba(255,255,255,0.18);letter-spacing:0.16em;text-transform:uppercase;">
            LegacyCapsule &middot; Valnex, Unipessoal LDA &middot; RevoWorldTech
          </p>
          <p style="margin:0;font-family:Arial,sans-serif;font-size:10px;color:rgba(255,255,255,0.2);line-height:1.6;">
            This private summary is sent only on days when new expressions of honour arrive.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}