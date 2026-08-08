// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/api/publication/named-send/route.ts
// ROUTE: POST /api/publication/named-send
// PURPOSE: Send the publication to one or more named recipients.
//          Unlike full distribution, this targets specific people by name+email.
//          Each send is logged. Supports multiple recipients per call.
// ARCHITECTURE: LC03 Legacy Publication System
// BUILT BY: AI19 · Claude Sonnet 4.6 · 8 August 2026
// VERSION: v2.11.77
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


// ═══ SECTION 2 — Types ═══

interface Recipient {
  name:  string
  email: string
}


// ═══ SECTION 3 — Route handler ═══

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { capsule_id, capsule_slug, recipients } = body as {
      capsule_id:   string
      capsule_slug: string
      recipients:   Recipient[]
    }

    // ── Validate ──────────────────────────────────────────────────────────
    if (!capsule_id || !capsule_slug) {
      return NextResponse.json(
        { error: 'capsule_id and capsule_slug are required' },
        { status: 400 }
      )
    }

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: 'recipients array is required and must not be empty' },
        { status: 400 }
      )
    }

    const validRecipients = recipients.filter(r => r.email?.trim())
    if (validRecipients.length === 0) {
      return NextResponse.json(
        { error: 'At least one recipient must have a valid email address' },
        { status: 400 }
      )
    }

    // ── Fetch capsule ────────────────────────────────────────────────────
    const { data: capsule } = await db
      .from('capsules')
      .select('honouree_name, event_tag')
      .eq('id', capsule_id)
      .maybeSingle()

    if (!capsule) {
      return NextResponse.json({ error: 'Capsule not found' }, { status: 404 })
    }

    // ── Fetch publication render token ───────────────────────────────────
    const { data: pub } = await db
      .from('publications')
      .select('render_token, pdf_url, version')
      .eq('capsule_id', capsule_id)
      .maybeSingle()

    if (!pub?.render_token && !pub?.pdf_url) {
      return NextResponse.json(
        { error: 'Publication not yet generated. Generate the publication first.' },
        { status: 400 }
      )
    }

    const publicationUrl = pub.render_token
      ? `${APP_URL}/publication-render/${pub.render_token}`
      : pub.pdf_url!

    const eventLabel     = capsule.event_tag ?? capsule.honouree_name
    const currentVersion = pub.version ?? 1

    // ── Send to each recipient ───────────────────────────────────────────
    let sent    = 0
    let skipped = 0
    const errors: string[] = []

    for (const recipient of validRecipients) {
      const email = recipient.email.trim().toLowerCase()
      const name  = recipient.name?.trim() || 'Guest'

      try {
        await resend.emails.send({
          from:    'LegacyCapsule <events@itslegacycapsule.com>',
          to:      email,
          subject: `A keepsake has been shared with you — ${eventLabel}`,
          html:    namedSendEmailHtml({
            recipientName:   name,
            honoureeName:    capsule.honouree_name,
            eventLabel,
            publicationUrl,
            capsuleUrl:      `${APP_URL}/for/${capsule_slug}`,
          }),
        })
        sent++
      } catch (emailErr) {
        console.error(`[named-send] Failed for ${email}:`, emailErr)
        errors.push(email)
        skipped++
      }
    }

    return NextResponse.json({
      sent,
      skipped,
      version: currentVersion,
      errors:  errors.length > 0 ? errors : undefined,
    })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Named send failed'
    console.error('[named-send]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed. Use POST.' }, { status: 405 })
}


// ═══ SECTION 4 — Email template ═══

function namedSendEmailHtml(d: {
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
  <title>A keepsake has been shared with you — ${d.eventLabel}</title>
</head>
<body style="margin:0;padding:0;background:#F5F3EE;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3EE;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#1a0d3a;border-radius:16px;overflow:hidden;">

          <tr><td height="3" style="background:linear-gradient(90deg,transparent,#E2C36B,transparent);"></td></tr>

          <tr>
            <td style="padding:40px 44px 8px;text-align:center;">
              <p style="margin:0 0 10px;font-family:Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:rgba(226,195,107,0.6);">A KEEPSAKE HAS BEEN SHARED WITH YOU</p>
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
                Someone wanted you to have this. The keepsake publication for
                <strong style="color:rgba(255,255,255,0.8);">${d.honoureeName}</strong>
                has been shared with you — a permanent record of the voices, memories,
                and photographs gathered to honour a life well lived.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:0 44px 36px;text-align:center;">
              <a href="${d.publicationUrl}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#E2C36B,#C9A84E);color:#1a0845;font-family:Arial,sans-serif;font-size:14px;font-weight:700;text-decoration:none;border-radius:10px;letter-spacing:0.06em;">
                Open the Publication →
              </a>
              <p style="margin:16px 0 0;font-family:Arial,sans-serif;font-size:11px;color:rgba(255,255,255,0.25);">
                Or visit the capsule:
                <a href="${d.capsuleUrl}" style="color:rgba(226,195,107,0.5);">${d.capsuleUrl}</a>
              </p>
              <p style="margin:20px 0 0;font-family:Arial,sans-serif;font-size:10px;color:rgba(255,255,255,0.2);font-style:italic;">
                Captures and Preserves Memories for ALL your events &nbsp;·&nbsp; itslegacycapsule.com
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