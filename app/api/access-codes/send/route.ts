// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/api/access-codes/send/route.ts
// PURPOSE: Send access codes via email to all guests (or a subset).
//          Generates QR code as base64 image for each guest.
//          Premium email template — branded, event-specific.
//          Step 7 of LC-ACCESS-001 build sequence.
// ARCHITECTURE: LC02 Event Services Engine · Access Code System
// BUILT BY: Claude Sonnet 4.6 · July 2026
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { Resend }                    from 'resend'
import QRCode                        from 'qrcode'

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Clients
// ─────────────────────────────────────────────────────────────────────────────

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend  = new Resend(process.env.RESEND_API_KEY!)
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com').replace(/\/$/, '')

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — Tier display labels
// ─────────────────────────────────────────────────────────────────────────────

const TIER_LABEL: Record<string, string> = {
  vvip:           'VVIP',
  vip:            'VIP',
  general:        'Guest',
  reception_only: 'Reception Guest',
  staff:          'Staff',
  media:          'Media',
  vendor:         'Vendor',
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — POST handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { capsule_id, capsule_slug, honouree_name, event_tag, guest_ids } = await req.json()

    if (!capsule_id || !capsule_slug) {
      return NextResponse.json(
        { error: 'capsule_id and capsule_slug required' },
        { status: 400 }
      )
    }

    // ── Fetch codes to send ───────────────────────────────────────────────────
    let query = db
      .from('event_access_codes')
      .select(`
        id, guest_name, guest_email, numeric_code, qr_payload,
        participant_type, event_sections ( name )
      `)
      .eq('capsule_id', capsule_id)
      .not('guest_email', 'is', null)
      .neq('status', 'revoked')

    if (guest_ids && guest_ids.length > 0) {
      query = query.in('guest_id', guest_ids)
    }

    const { data: codes } = await query

    if (!codes || codes.length === 0) {
      return NextResponse.json(
        { error: 'No guests with email addresses found' },
        { status: 404 }
      )
    }

    let sent    = 0
    let skipped = 0

    for (const code of codes) {
      if (!code.guest_email) { skipped++; continue }

      try {
        // Generate QR code image as base64 data URL
        const qrBase64 = await QRCode.toDataURL(code.qr_payload, {
          errorCorrectionLevel: 'M',
          width:  200,
          margin: 2,
          color:  { dark: '#1a0845', light: '#F5F3EE' },
        })

        const sectionName = (code.event_sections as any)?.name ?? null
        const eventLabel  = event_tag ?? honouree_name ?? 'Your Event'

        await resend.emails.send({
          from:    'LegacyCapsule <events@itslegacycapsule.com>',
          to:      code.guest_email,
          subject: `Your Access Code — ${eventLabel}`,
          html:    accessCodeEmailHtml({
            guestName:    code.guest_name,
            eventLabel,
            honoureeName: honouree_name ?? '',
            numericCode:  code.numeric_code,
            qrBase64,
            tier:         code.participant_type,
            sectionName,
            capsuleUrl:   `${APP_URL}/for/${capsule_slug}`,
          }),
        })

        // Mark code as sent
        await db
          .from('event_access_codes')
          .update({ status: 'sent', updated_at: new Date().toISOString() })
          .eq('id', code.id)

        sent++

      } catch (emailErr) {
        console.error(`[access-codes/send] Failed for ${code.guest_email}:`, emailErr)
        skipped++
      }
    }

    return NextResponse.json({ ok: true, sent, skipped })

  } catch (e) {
    console.error('[access-codes/send]', e)
    return NextResponse.json({ error: 'Send operation failed' }, { status: 500 })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — Email template
// Premium branded access code email.
// Includes QR image + numeric code + tier + section.
// Also links to the capsule tribute wall.
// ─────────────────────────────────────────────────────────────────────────────

function accessCodeEmailHtml(d: {
  guestName:    string
  eventLabel:   string
  honoureeName: string
  numericCode:  string
  qrBase64:     string
  tier:         string
  sectionName:  string | null
  capsuleUrl:   string
}) {
  const tierLabel = TIER_LABEL[d.tier] ?? 'Guest'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Your Access Code — ${d.eventLabel}</title>
</head>
<body style="margin:0;padding:0;background:#F5F3EE;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3EE;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#1a0d3a;border-radius:16px;overflow:hidden;">

          <!-- Gold top rule -->
          <tr><td height="3" style="background:linear-gradient(90deg,transparent,#E2C36B,transparent);"></td></tr>

          <!-- Header -->
          <tr>
            <td style="padding:40px 44px 8px;text-align:center;">
              <p style="margin:0 0 10px;font-family:Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:rgba(226,195,107,0.6);">YOUR ACCESS CODE</p>
              <h1 style="margin:0 0 6px;font-family:Georgia,serif;font-size:24px;font-weight:700;color:#FFFFFF;line-height:1.3;">${d.eventLabel}</h1>
              ${d.honoureeName ? `<p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:rgba(226,195,107,0.7);">${d.honoureeName}</p>` : ''}
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="padding:20px 44px 0;"><div style="height:1px;background:linear-gradient(90deg,transparent,rgba(226,195,107,0.3),transparent);"></div></td></tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:24px 44px 20px;text-align:center;">
              <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:rgba(255,255,255,0.75);">
                Dear <strong style="color:#FFFFFF;">${d.guestName}</strong>,
              </p>
              <p style="margin:12px 0 0;font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.55);line-height:1.75;">
                Your access code for this event is ready. Present it at the entrance — the QR code or the numeric code below are both accepted.
              </p>
            </td>
          </tr>

          <!-- QR Code -->
          <tr>
            <td style="padding:0 44px;text-align:center;">
              <div style="background:rgba(245,243,238,0.95);border-radius:14px;padding:20px;display:inline-block;">
                <img src="${d.qrBase64}" alt="Your Access QR Code" width="160" height="160" style="display:block;"/>
              </div>
              <p style="margin:14px 0 4px;font-family:'Courier New',monospace;font-size:30px;font-weight:800;color:#E2C36B;letter-spacing:0.35em;">${d.numericCode}</p>
              <p style="margin:0;font-family:Arial,sans-serif;font-size:10px;color:rgba(255,255,255,0.3);letter-spacing:0.12em;text-transform:uppercase;">Numeric code — use if QR cannot be scanned</p>
            </td>
          </tr>

          <!-- Tier and section -->
          <tr>
            <td style="padding:24px 44px;">
              <div style="background:rgba(226,195,107,0.06);border:1px solid rgba(226,195,107,0.18);border-radius:12px;padding:16px 20px;text-align:center;">
                <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(226,195,107,0.5);">Access Level</p>
                <p style="margin:0;font-family:Georgia,serif;font-size:22px;font-weight:700;color:#E2C36B;">${tierLabel}</p>
                ${d.sectionName ? `<p style="margin:6px 0 0;font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.5);">${d.sectionName}</p>` : ''}
              </div>
            </td>
          </tr>

          <!-- Capsule link -->
          <tr>
            <td style="padding:0 44px 36px;text-align:center;">
              <p style="margin:0 0 14px;font-family:Arial,sans-serif;font-size:12px;color:rgba(255,255,255,0.38);line-height:1.7;">
                This event is being preserved in a LegacyCapsule. You can leave your tribute and be part of a permanent record of this occasion.
              </p>
              <a href="${d.capsuleUrl}" style="display:inline-block;padding:11px 28px;background:rgba(226,195,107,0.1);border:1px solid rgba(226,195,107,0.28);color:#E2C36B;font-family:Arial,sans-serif;font-size:13px;font-weight:600;text-decoration:none;border-radius:8px;letter-spacing:0.04em;">
                Visit the Capsule →
              </a>
            </td>
          </tr>

          <!-- Gold bottom rule -->
          <tr><td height="3" style="background:linear-gradient(90deg,transparent,#E2C36B,transparent);"></td></tr>

          <!-- Footer -->
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
