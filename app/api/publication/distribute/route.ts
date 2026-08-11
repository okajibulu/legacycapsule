// ─────────────────────────────────────────────────────────────────────────────
// FILE PATH: app/api/publication/distribute/route.ts
// PURPOSE:   Distribute the Digital Capsule Publication to all recipients.
//            GET ?capsule_id=  — returns recipient counts without sending
//            POST              — sends to all deduped recipients
//
//            Recipients (deduped by email):
//              1. Tribute contributors with email (contributions table)
//              2. D-Day photo contributors with email (gallery_items source='dday')
//              3. Publication subscribers (publication_subscribers table)
//
//            Deduplication: Set on lowercase email — nobody receives twice.
//            Organiser always controls dispatch — never automatic.
//
// ARCHITECTURE: LC03 Legacy Publication System
// BUILT BY:  AI12 · Claude Opus 4.6 · 20 July 2026
// UPDATED:   AI20 · Claude Sonnet 4.6 · 11 August 2026
//            v2.11.93 — Subject fixed: honouree name as primary identifier
//            v2.11.94 — Subject finalised: "Your copy of [Name]'s [Event Type]
//                       Digital Capsule is ready" — personal possessive framing.
//                       Body copy now event-type aware (6 variants).
//                       "Digital Capsule Publication" established as brand term.
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

// ═══ SECTION 2 — Event type helpers ═══
// getEventTypeLabel: converts event_type key → human occasion label.
// getEventBodyCopy:  returns event-aware body paragraph for email.
// Pronouns are neutral "their" throughout — no gender assumptions.
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

function getEventBodyCopy(
  eventType: string | null,
  honoureeName: string,
  eventTypeLabel: string
): { intro: string; privilege: string } {
  const name = honoureeName

  switch (eventType) {
    case 'memorial':
      return {
        intro:     `This Digital Capsule Publication was assembled from the tributes, memories, and stories shared in memory of <strong style="color:rgba(255,255,255,0.9);">${name}</strong> — every voice gathered here preserved as a permanent record of a life that mattered.`,
        privilege: `As one of those who took the time to honour ${name}'s memory, it is a privilege to share this keepsake with you.`,
      }
    case 'wedding':
      return {
        intro:     `This Digital Capsule Publication captures the blessings, memories, and well-wishes gathered from everyone who celebrated <strong style="color:rgba(255,255,255,0.9);">${name}</strong> on their wedding day — a permanent record of the love and community surrounding this occasion.`,
        privilege: `As one of those who shared a blessing for ${name}, it is a privilege to share this keepsake with you.`,
      }
    case 'milestone_birthday':
    case 'birthday':
      return {
        intro:     `This Digital Capsule Publication was assembled from the appreciation, memories, and well-wishes gathered to celebrate <strong style="color:rgba(255,255,255,0.9);">${name}</strong> on this milestone — a permanent record of the voices of those who love and value them.`,
        privilege: `As one of those who honoured ${name} on this occasion, it is a privilege to share this keepsake with you.`,
      }
    case 'chieftaincy':
      return {
        intro:     `This Digital Capsule Publication was assembled from the tributes, commendations, and voices gathered to honour <strong style="color:rgba(255,255,255,0.9);">${name}</strong> on this occasion — a permanent record worthy of the significance of this moment.`,
        privilege: `As one of those who stepped forward to honour ${name}, it is a privilege to share this keepsake with you.`,
      }
    case 'graduation':
      return {
        intro:     `This Digital Capsule Publication captures the congratulations, memories, and encouragement gathered to celebrate <strong style="color:rgba(255,255,255,0.9);">${name}</strong>'s achievement — a permanent record of the community that cheered them to this moment.`,
        privilege: `As one of those who shared in celebrating ${name}'s achievement, it is a privilege to share this keepsake with you.`,
      }
    case 'retirement':
    default:
      return {
        intro:     `This Digital Capsule Publication was assembled from the voices, memories, and stories shared by those who honoured <strong style="color:rgba(255,255,255,0.9);">${name}</strong> on the occasion of their ${eventTypeLabel} — a permanent record of a career and life well celebrated.`,
        privilege: `As one of those who took the time to contribute, it is a privilege to share this keepsake with you.`,
      }
  }
}

// ═══ SECTION 3 — Recipient collector ═══
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

// ═══ SECTION 4 — GET — Preview recipient counts ═══

export async function GET(req: NextRequest) {
  const capsule_id = req.nextUrl.searchParams.get('capsule_id')
  if (!capsule_id) {
    return NextResponse.json({ error: 'capsule_id required' }, { status: 400 })
  }

  try {
    const { recipients, no_email } = await collectRecipients(capsule_id)

    let contributors = 0, dday = 0, subscribers = 0
    for (const [, v] of recipients) {
      if (v.source === 'contributor') contributors++
      else if (v.source === 'dday') dday++
      else if (v.source === 'subscriber') subscribers++
    }

    return NextResponse.json({
      total: recipients.size,
      contributors,
      dday,
      subscribers,
      no_email,
    })

  } catch (e: unknown) {
    console.error('[publication/distribute GET]', e)
    return NextResponse.json(
      { error: 'Failed to load recipients. Please try again.' },
      { status: 500 }
    )
  }
}

// ═══ SECTION 5 — POST — Send publication ═══

export async function POST(req: NextRequest) {
  try {
    const { capsule_id, capsule_slug } = await req.json()

    if (!capsule_id || !capsule_slug) {
      return NextResponse.json(
        { error: 'capsule_id and capsule_slug are required.' },
        { status: 400 }
      )
    }

    // ── Fetch capsule ────────────────────────────────────────────────────
    const { data: capsule } = await db
      .from('capsules')
      .select('honouree_name, event_type, event_tag, slug')
      .eq('id', capsule_id)
      .maybeSingle()

    if (!capsule) {
      return NextResponse.json({ error: 'Capsule not found.' }, { status: 404 })
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

    const publicationUrl = `${APP_URL}/publication/${capsule_slug}`
    const eventTypeLabel = getEventTypeLabel(capsule.event_type, capsule.event_tag)
    const bodyCopy       = getEventBodyCopy(capsule.event_type, capsule.honouree_name, eventTypeLabel)

    const { recipients, no_email } = await collectRecipients(capsule_id)

    if (recipients.size === 0) {
      return NextResponse.json({ sent: 0, skipped: 0, no_email })
    }

    // ── Send emails — batched with delay to protect inbox delivery ────────
    const BATCH_SIZE     = 10
    const BATCH_DELAY_MS = 30 * 1000

    const recipientList = Array.from(recipients.entries())
    let sent    = 0
    let skipped = 0

    for (let i = 0; i < recipientList.length; i += BATCH_SIZE) {
      const batch = recipientList.slice(i, i + BATCH_SIZE)

      await Promise.all(batch.map(async ([email, { name }]) => {
        try {
          await resend.emails.send({
            from:    'LegacyCapsule <events@itslegacycapsule.com>',
            to:      email,
            subject: `Your copy of ${capsule.honouree_name}\u2019s ${eventTypeLabel} Digital Capsule is ready`,
            html:    distributeEmailHtml({
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
          console.error(`[publication/distribute] Failed for ${email}:`, emailErr)
          skipped++
        }
      }))

      if (i + BATCH_SIZE < recipientList.length) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS))
      }
    }

    // ── Mark subscribers as sent ──────────────────────────────────────────
    await db
      .from('publication_subscribers')
      .update({ sent_at: new Date().toISOString() })
      .eq('capsule_id', capsule_id)
      .is('sent_at', null)

    return NextResponse.json({ sent, skipped, no_email })

  } catch (e: unknown) {
    console.error('[publication/distribute POST]', e)
    return NextResponse.json(
      { error: 'Something went wrong sending the publication. Please try again.' },
      { status: 500 }
    )
  }
}

// ═══ SECTION 6 — Email template — distribute ═══
// Audience: contributors, D-Day participants, subscribers.
// All have honoured the honouree in some way — body copy reflects that.
// "Digital Capsule Publication" used as brand term throughout.

function distributeEmailHtml(d: {
  recipientName:  string
  honoureeName:   string
  eventTypeLabel: string
  bodyCopy:       { intro: string; privilege: string }
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
                DIGITAL CAPSULE PUBLICATION
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
              <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.55);line-height:1.85;">
                ${d.bodyCopy.privilege}
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:28px 44px 36px;text-align:center;">
              <a href="${d.publicationUrl}"
                style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#E2C36B,#C9A84E);color:#1a0845;font-family:Arial,sans-serif;font-size:14px;font-weight:700;text-decoration:none;border-radius:10px;letter-spacing:0.06em;">
                Open Your Digital Capsule &rarr;
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