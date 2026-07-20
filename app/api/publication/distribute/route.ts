// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/api/publication/distribute/route.ts
// PURPOSE: Distribute the generated publication to all recipients.
//          GET ?capsule_id=&preview=1  — returns recipient counts without sending
//          POST                        — sends to all deduped recipients
//
//          Recipients (deduped by email):
//            1. Tribute contributors with email (contributions table)
//            2. D-Day photo contributors with email (gallery_items source='dday')
//            3. Publication subscribers (publication_subscribers table)
//
//          Deduplication: Set on lowercase email — nobody receives twice.
//          Organiser always controls dispatch — never automatic.
//
// ARCHITECTURE: LC03 Legacy Publication System
// BUILT BY: AI12 · Claude Opus 4.6 · 20 July 2026
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { Resend }                    from 'resend'

// ═══ SECTION 1 — Clients ═══

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend  = new Resend(process.env.RESEND_API_KEY!)
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com').replace(/\/$/, '')

// ═══ SECTION 2 — Recipient collector ═══
// Returns a deduped map of email → { name, source }

async function collectRecipients(capsule_id: string): Promise<{
  recipients: Map<string, { name: string; source: string }>
  no_email:   number
}> {
  const recipients = new Map<string, { name: string; source: string }>()
  let no_email = 0

  // ── Source 1: Tribute contributors ────────────────────────────────────
  const { data: contribs } = await db
    .from('contributions')
    .select('contributor_name, email')
    .eq('capsule_id', capsule_id)
    .eq('status', 'approved')
    .is('deleted_at', null)

  for (const c of contribs ?? []) {
    if (c.email?.trim()) {
      const key = c.email.trim().toLowerCase()
      if (!recipients.has(key)) {
        recipients.set(key, { name: c.contributor_name, source: 'contributor' })
      }
    } else {
      no_email++
    }
  }

  // ── Source 2: D-Day photo contributors ────────────────────────────────
  const { data: ddayItems } = await db
    .from('gallery_items')
    .select('contributor_name, contributor_email')
    .eq('capsule_id', capsule_id)
    .eq('source', 'dday')
    .not('contributor_email', 'is', null)

  for (const d of ddayItems ?? []) {
    if (d.contributor_email?.trim()) {
      const key = d.contributor_email.trim().toLowerCase()
      if (!recipients.has(key)) {
        recipients.set(key, { name: d.contributor_name ?? 'Guest', source: 'dday' })
      }
    }
  }

  // ── Source 3: Publication subscribers ─────────────────────────────────
  const { data: subs } = await db
    .from('publication_subscribers')
    .select('name, email')
    .eq('capsule_id', capsule_id)

  for (const s of subs ?? []) {
    if (s.email?.trim()) {
      const key = s.email.trim().toLowerCase()
      if (!recipients.has(key)) {
        recipients.set(key, { name: s.name, source: 'subscriber' })
      }
    }
  }

  return { recipients, no_email }
}

// ═══ SECTION 3 — GET — Preview recipient counts ═══

export async function GET(req: NextRequest) {
  const capsule_id = req.nextUrl.searchParams.get('capsule_id')
  if (!capsule_id) {
    return NextResponse.json({ error: 'capsule_id required' }, { status: 400 })
  }

  try {
    const { recipients, no_email } = await collectRecipients(capsule_id)

    // Count by source for the preview breakdown
    let contributors = 0, dday = 0, subscribers = 0
    for (const [, v] of recipients) {
      if (v.source === 'contributor') contributors++
      else if (v.source === 'dday') dday++
      else if (v.source === 'subscriber') subscribers++
    }

    return NextResponse.json({
      total:        recipients.size,
      contributors,
      dday,
      subscribers,
      no_email,
    })

  } catch (e: any) {
    console.error('[publication/distribute GET]', e)
    return NextResponse.json({ error: 'Failed to load recipients' }, { status: 500 })
  }
}

// ═══ SECTION 4 — POST — Send publication ═══

export async function POST(req: NextRequest) {
  try {
    const { capsule_id, capsule_slug } = await req.json()

    if (!capsule_id || !capsule_slug) {
      return NextResponse.json(
        { error: 'capsule_id and capsule_slug required' },
        { status: 400 }
      )
    }

    // ── Fetch capsule and publication ────────────────────────────────────
    const { data: capsule } = await db
      .from('capsules')
      .select('honouree_name, event_tag')
      .eq('id', capsule_id)
      .maybeSingle()

    if (!capsule) {
      return NextResponse.json({ error: 'Capsule not found' }, { status: 404 })
    }

    const { data: pub } = await db
      .from('publications')
      .select('pdf_url, render_token')
      .eq('capsule_id', capsule_id)
      .maybeSingle()

    if (!pub?.pdf_url && !pub?.render_token) {
      return NextResponse.json(
        { error: 'No publication found. Generate the publication before distributing.' },
        { status: 400 }
      )
    }

    const publicationUrl = pub.render_token
      ? `${APP_URL}/publication-render/${pub.render_token}`
      : pub.pdf_url!

    const eventLabel = capsule.event_tag ?? capsule.honouree_name
    const { recipients, no_email } = await collectRecipients(capsule_id)

    if (recipients.size === 0) {
      return NextResponse.json({ sent: 0, skipped: 0, no_email })
    }

    // ── Send emails ───────────────────────────────────────────────────────
    let sent    = 0
    let skipped = 0

    for (const [email, { name }] of recipients) {
      try {
        await resend.emails.send({
          from:    'LegacyCapsule <events@itslegacycapsule.com>',
          to:      email,
          subject: `The keepsake publication is ready — ${eventLabel}`,
          html:    publicationEmailHtml({
            recipientName:   name,
            honoureeName:    capsule.honouree_name,
            eventLabel,
            publicationUrl,
            capsuleUrl:      `${APP_URL}/for/${capsule_slug}`,
          }),
        })

        sent++

      } catch (emailErr) {
        console.error(`[publication/distribute] Failed for ${email}:`, emailErr)
        skipped++
      }
    }

    // ── Mark subscribers as sent ──────────────────────────────────────────
    await db
      .from('publication_subscribers')
      .update({ sent_at: new Date().toISOString() })
      .eq('capsule_id', capsule_id)
      .is('sent_at', null)

    return NextResponse.json({ sent, skipped, no_email })

  } catch (e: any) {
    console.error('[publication/distribute POST]', e)
    return NextResponse.json({ error: e.message ?? 'Distribution failed' }, { status: 500 })
  }
}

// ═══ SECTION 5 — Email template ═══

function publicationEmailHtml(d: {
  recipientName:  string
  honoureeName:   string
  eventLabel:     string
  publicationUrl: string
  capsuleUrl:     string
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>The keepsake publication is ready — ${d.eventLabel}</title>
</head>
<body style="margin:0;padding:0;background:#F5F3EE;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3EE;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#1a0d3a;border-radius:16px;overflow:hidden;">

          <tr><td height="3" style="background:linear-gradient(90deg,transparent,#E2C36B,transparent);"></td></tr>

          <tr>
            <td style="padding:40px 44px 8px;text-align:center;">
              <p style="margin:0 0 10px;font-family:Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:rgba(226,195,107,0.6);">YOUR KEEPSAKE IS READY</p>
              <h1 style="margin:0 0 6px;font-family:Georgia,serif;font-size:24px;font-weight:700;color:#FFFFFF;line-height:1.3;">${d.eventLabel}</h1>
            </td>
          </tr>

          <tr><td style="padding:20px 44px 0;"><div style="height:1px;background:linear-gradient(90deg,transparent,rgba(226,195,107,0.3),transparent);"></div></td></tr>

          <tr>
            <td style="padding:24px 44px;text-align:center;">
              <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:14px;color:rgba(255,255,255,0.75);">
                Dear <strong style="color:#FFFFFF;">${d.recipientName}</strong>,
              </p>
              <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.55);line-height:1.8;">
                The keepsake publication for <strong style="color:rgba(255,255,255,0.8);">${d.honoureeName}</strong> is now ready.
                Every tribute, memory, story, and photograph — assembled into a permanent record for everyone who was part of this occasion.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:0 44px 36px;text-align:center;">
              <a href="${d.publicationUrl}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#E2C36B,#C9A84E);color:#1a0845;font-family:Arial,sans-serif;font-size:14px;font-weight:700;text-decoration:none;border-radius:10px;letter-spacing:0.06em;">
                View the Publication →
              </a>
              <p style="margin:16px 0 0;font-family:Arial,sans-serif;font-size:11px;color:rgba(255,255,255,0.25);">
                Or visit the capsule: <a href="${d.capsuleUrl}" style="color:rgba(226,195,107,0.5);">${d.capsuleUrl}</a>
              </p>
            </td>
          </tr>

          <tr><td height="3" style="background:linear-gradient(90deg,transparent,#E2C36B,transparent);"></td></tr>

          <tr>
            <td style="padding:14px 44px 18px;text-align:center;">
              <p style="margin:0;font-family:Arial,sans-serif;font-size:9px;color:rgba(255,255,255,0.18);letter-spacing:2px;text-transform:uppercase;">
                LEGACYCAPSULE · VALNEX, UNIPESSOAL LDA · REVOWORLDTECH
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
