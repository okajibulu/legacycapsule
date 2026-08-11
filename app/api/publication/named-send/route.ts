// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/api/publication/named-send/route.ts
// ROUTE:     POST /api/publication/named-send
// PURPOSE:   Send the Digital Capsule Publication to one or more named
//            recipients. Unlike full distribution, this targets specific
//            people by name + email — family members, nominees, VIPs.
//            Each send is logged. Supports multiple recipients per call.
//            Used for family preview sends and organiser-nominated individuals.
// ARCHITECTURE: LC03 Legacy Publication System
// BUILT BY:  AI19 · Claude Sonnet 4.6 · 8 August 2026
// UPDATED:   AI20 · Claude Sonnet 4.6 · 11 August 2026
//            v2.11.93 — Subject fixed: honouree name as primary identifier
//            v2.11.94 — Subject finalised: "[Name]'s [Event] Digital Capsule
//                       is ready and has been shared with you first for your
//                       preview" — exclusive preview framing for named sends.
//                       Body copy now event-type aware (6 variants).
//                       Separate body copy path for named recipients (family/
//                       nominees) who may not have contributed themselves.
//                       "Digital Capsule Publication" as brand term throughout.
//                       Pronouns: neutral "their" throughout.
// VERSION:   AI20v2.11.94
// DATE:      11 August 2026
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

// ═══ SECTION 3 — Event type helpers ═══
// getEventTypeLabel: converts event_type key → human occasion label.
// getNamedSendBodyCopy: named-send variant — recipients are family/nominees
//   who may not have contributed. Body copy reflects their connection to the
//   honouree rather than their own contribution.
// Pronouns: neutral "their" throughout — no gender assumptions.
// "Digital Capsule Publication" is a brand term — never abbreviated.

function getEventTypeLabel(eventType: string | null, eventTag: string | null): string {
  const map: Record<string, string> = {
    retirement:         'Retirement Celebration',
    memorial:           'Memorial',
    wedding:            'Wedding Celebration',
    milestone_birthday: 'Milestone Birthday',
    birthday:           'Birthday Celebration',
    chieftaincy:        'Chieftaincy & Recognition',
    graduation:         'Graduation',
    anniversary:        'Anniversary',
    naming_ceremony:    'Naming Ceremony',
    corporate:          'Corporate Recognition',
  }
  return map[eventType ?? ''] ?? eventTag ?? 'Special Occasion'
}

function getNamedSendBodyCopy(
  eventType: string | null,
  honoureeName: string,
  eventTypeLabel: string
): { intro: string; closing: string } {
  const name = honoureeName

  switch (eventType) {
    case 'memorial':
      return {
        intro:   `This Digital Capsule Publication has been assembled from the tributes, memories, and stories shared in memory of <strong style="color:rgba(255,255,255,0.9);">${name}</strong> — every voice preserved as a permanent record of a life that mattered deeply to so many people.`,
        closing: `It is being shared with you ahead of the full release — a keepsake worthy of the occasion it honours, and of the person at its heart.`,
      }
    case 'wedding':
      return {
        intro:   `This Digital Capsule Publication captures the blessings, memories, and well-wishes gathered from everyone who celebrated <strong style="color:rgba(255,255,255,0.9);">${name}</strong> on their wedding day — a permanent record of the love and community surrounding this occasion.`,
        closing: `It is being shared with you ahead of the full release — a keepsake of a day that will long be remembered.`,
      }
    case 'milestone_birthday':
    case 'birthday':
      return {
        intro:   `This Digital Capsule Publication was assembled from the appreciation, memories, and well-wishes gathered to celebrate <strong style="color:rgba(255,255,255,0.9);">${name}</strong> on this milestone — a permanent record of the voices of those who love and value them.`,
        closing: `It is being shared with you ahead of the full release — a keepsake built to last far beyond the occasion itself.`,
      }
    case 'chieftaincy':
      return {
        intro:   `This Digital Capsule Publication was assembled from the tributes, commendations, and voices gathered to honour <strong style="color:rgba(255,255,255,0.9);">${name}</strong> on this occasion — a permanent record worthy of the significance of this moment.`,
        closing: `It is being shared with you ahead of the full release — a keepsake that preserves the weight of what was said and who said it.`,
      }
    case 'graduation':
      return {
        intro:   `This Digital Capsule Publication captures the congratulations, memories, and encouragement gathered to celebrate <strong style="color:rgba(255,255,255,0.9);">${name}</strong>'s achievement — a permanent record of the community that cheered them to this moment.`,
        closing: `It is being shared with you ahead of the full release — a keepsake of an achievement that deserves to be remembered in full.`,
      }
    case 'retirement':
    default:
      return {
        intro:   `This Digital Capsule Publication was assembled from the voices, memories, and stories shared by those who honoured <strong style="color:rgba(255,255,255,0.9);">${name}</strong> on the occasion of their ${eventTypeLabel} — a permanent record of a career and life well celebrated by the community that witnessed it.`,
        closing: `It is being shared with you ahead of the full release — a keepsake of everything that was said, by everyone who chose to speak.`,
      }
  }
}

// ═══ SECTION 4 — Route handler ═══

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
        { error: 'capsule_id and capsule_slug are required.' },
        { status: 400 }
      )
    }

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: 'recipients array is required and must not be empty.' },
        { status: 400 }
      )
    }

    const validRecipients = recipients.filter(r => r.email?.trim())
    if (validRecipients.length === 0) {
      return NextResponse.json(
        { error: 'At least one recipient must have a valid email address.' },
        { status: 400 }
      )
    }

    // ── Fetch capsule ────────────────────────────────────────────────────
    const { data: capsule } = await db
      .from('capsules')
      .select('honouree_name, event_type, event_tag')
      .eq('id', capsule_id)
      .maybeSingle()

    if (!capsule) {
      return NextResponse.json({ error: 'Capsule not found.' }, { status: 404 })
    }

    // ── Fetch publication ────────────────────────────────────────────────
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

    const publicationUrl = `${APP_URL}/publication/${capsule_slug}`
    const eventTypeLabel = getEventTypeLabel(capsule.event_type, capsule.event_tag)
    const bodyCopy       = getNamedSendBodyCopy(capsule.event_type, capsule.honouree_name, eventTypeLabel)
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
          subject: `${capsule.honouree_name}\u2019s ${eventTypeLabel} Digital Capsule is ready and has been shared with you first for your preview`,
          html:    namedSendEmailHtml({
            recipientName:  name,
            honoureeName:   capsule.honouree_name,
            eventTypeLabel,
            bodyCopy,
            publicationUrl,
            capsuleUrl:     `${APP_URL}/for/${capsule_slug}`,
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
    const msg = err instanceof Error ? err.message : 'Named send failed.'
    console.error('[named-send]', msg)
    return NextResponse.json(
      { error: 'Something went wrong sending the publication. Please try again.' },
      { status: 500 }
    )
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'This endpoint only accepts POST requests.' },
    { status: 405 }
  )
}

// ═══ SECTION 5 — Email template — named send ═══
// Audience: family members, nominees, VIPs — targeted individuals.
// Framing: exclusive preview — "shared with you first for your preview".
// These recipients may not have contributed — body copy reflects their
// connection to the honouree rather than their own contribution.
// "Digital Capsule Publication" used as brand term throughout.

function namedSendEmailHtml(d: {
  recipientName:  string
  honoureeName:   string
  eventTypeLabel: string
  bodyCopy:       { intro: string; closing: string }
  publicationUrl: string
  capsuleUrl:     string
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${d.honoureeName}&rsquo;s ${d.eventTypeLabel} Digital Capsule Publication</title>
</head>
<body style="margin:0;padding:0;background:#F5F3EE;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3EE;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#1a0d3a;border-radius:16px;overflow:hidden;">

          <tr><td height="3" style="background:linear-gradient(90deg,transparent,#E2C36B,transparent);font-size:0;">&nbsp;</td></tr>

          <!-- Header -->
          <tr>
            <td style="padding:40px 44px 8px;text-align:center;">
              <p style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:rgba(226,195,107,0.6);">
                DIGITAL CAPSULE PUBLICATION &nbsp;&middot;&nbsp; PREVIEW
              </p>
              <h1 style="margin:0 0 6px;font-family:Georgia,serif;font-size:26px;font-weight:700;color:#FFFFFF;line-height:1.3;">
                ${d.honoureeName}
              </h1>
              <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:rgba(226,195,107,0.65);letter-spacing:0.08em;">
                ${d.eventTypeLabel}
              </p>
            </td>
          </tr>

          <tr><td style="padding:20px 44px 0;">
            <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(226,195,107,0.3),transparent);"></div>
          </td></tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 44px 8px;text-align:center;">
              <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:14px;color:rgba(255,255,255,0.75);">
                Dear <strong style="color:#FFFFFF;">${d.recipientName}</strong>,
              </p>
              <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.55);line-height:1.85;">
                ${d.bodyCopy.intro}
              </p>
              <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.55);line-height:1.85;font-style:italic;">
                ${d.bodyCopy.closing}
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:28px 44px 36px;text-align:center;">
              <a href="${d.publicationUrl}"
                style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#E2C36B,#C9A84E);color:#1a0845;font-family:Arial,sans-serif;font-size:14px;font-weight:700;text-decoration:none;border-radius:10px;letter-spacing:0.06em;">
                Open Your Preview &rarr;
              </a>
              <p style="margin:16px 0 0;font-family:Arial,sans-serif;font-size:11px;color:rgba(255,255,255,0.25);">
                Or visit the record:
                <a href="${d.capsuleUrl}" style="color:rgba(226,195,107,0.5);">${d.capsuleUrl}</a>
              </p>
              <p style="margin:20px 0 0;font-family:Arial,sans-serif;font-size:10px;color:rgba(255,255,255,0.2);font-style:italic;">
                LegacyCapsule preserves the voices that matter most &mdash; for the people being celebrated, and for those who come after.
              </p>
            </td>
          </tr>

          <tr><td height="3" style="background:linear-gradient(90deg,transparent,#E2C36B,transparent);font-size:0;">&nbsp;</td></tr>

          <tr>
            <td style="padding:14px 44px 18px;text-align:center;">
              <p style="margin:0;font-family:Arial,sans-serif;font-size:9px;color:rgba(255,255,255,0.18);letter-spacing:2px;text-transform:uppercase;">
                LEGACYCAPSULE &middot; VALNEX, UNIPESSOAL LDA &middot; REVOWORLDTECH
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