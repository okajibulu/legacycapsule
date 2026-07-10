// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/api/publication/distribute/route.ts
// PURPOSE: Collective Belonging Email — sends publication link to all
//          approved contributors who provided an email address.
//          Called from PublicationEditor when organiser clicks Distribute.
// ARCHITECTURE: LC03 Publication Engine · LC05 Engagement Engine
// BUILT BY: Claude Sonnet 4.6 · July 2026
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Clients
// ─────────────────────────────────────────────────────────────────────────────

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY!)

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com').replace(/\/$/, '')

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — Route handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { capsule_id, capsule_slug } = await req.json()

    if (!capsule_id || !capsule_slug) {
      return NextResponse.json({ error: 'capsule_id and capsule_slug required' }, { status: 400 })
    }

    // ── Fetch capsule details ─────────────────────────────────────────────────
    const { data: capsule, error: capsuleError } = await adminClient
      .from('capsules')
      .select('honouree_name, event_type, event_tag, organiser_email')
      .eq('id', capsule_id)
      .single()

    if (capsuleError || !capsule) {
      return NextResponse.json({ error: 'Capsule not found' }, { status: 404 })
    }

    // ── Fetch publication — must have a pdf_url ───────────────────────────────
    const { data: publication } = await adminClient
      .from('publications')
      .select('id, pdf_url')
      .eq('capsule_id', capsule_id)
      .not('pdf_url', 'is', null)
      .maybeSingle()

    if (!publication?.pdf_url) {
      return NextResponse.json({ error: 'No publication PDF available. Generate the PDF first.' }, { status: 400 })
    }

    // ── Fetch all approved contributors with emails ───────────────────────────
    const { data: contributors } = await adminClient
      .from('contributions')
      .select('id, contributor_name, email')
      .eq('capsule_id', capsule_id)
      .eq('status', 'approved')
      .not('email', 'is', null)
      .is('deleted_at', null)

    if (!contributors || contributors.length === 0) {
      return NextResponse.json({ sent: 0, skipped: 0, message: 'No contributors with email addresses found.' })
    }

    // Deduplicate by email — one email per address
    const seen = new Set<string>()
    const recipients = contributors.filter(c => {
      const email = c.email?.toLowerCase().trim()
      if (!email || seen.has(email)) return false
      seen.add(email)
      return true
    })

    const capsuleUrl = `${APP_URL}/for/${capsule_slug}`
    const publicationUrl = publication.pdf_url

    // ── Send in batches of 50 (Resend batch limit) ───────────────────────────
    const BATCH_SIZE = 50
    let totalSent = 0

    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE)

      const emails = batch.map(contributor => ({
        from: 'LegacyCapsule <memories@itslegacycapsule.com>',
        to: contributor.email!,
        subject: `${capsule.honouree_name}'s Legacy Capsule — The Collection is Complete`,
        html: collectiveBelongingHtml({
          contributorName: contributor.contributor_name,
          honoureeName: capsule.honouree_name,
          eventTag: capsule.event_tag,
          capsuleUrl,
          publicationUrl,
        }),
      }))

      try {
        await resend.batch.send(emails)
        totalSent += batch.length
      } catch (batchErr) {
        console.error('[distribute] Batch send error:', batchErr)
        // Continue with remaining batches — partial send is better than none
      }
    }

    const skipped = contributors.length - recipients.length

    // ── Mark publication as distributed ──────────────────────────────────────
    // Update distributed_at if column exists — graceful if it doesn't
    try {
      await adminClient
        .from('publications')
        .update({ distributed_at: new Date().toISOString() })
        .eq('id', publication.id)
    } catch {
      // Column may not exist — not a blocking error
    }

    return NextResponse.json({
      sent: totalSent,
      skipped,
      message: `Publication sent to ${totalSent} contributor${totalSent !== 1 ? 's' : ''}.`,
    })

  } catch (err) {
    console.error('[publication/distribute]', err)
    return NextResponse.json({ error: 'Distribution failed. Please try again.' }, { status: 500 })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — Collective Belonging Email template
// The publication has been assembled from every voice in this community.
// Each contributor receives a personal acknowledgement + download link.
// ─────────────────────────────────────────────────────────────────────────────

function collectiveBelongingHtml(d: {
  contributorName: string
  honoureeName: string
  eventTag: string | null
  capsuleUrl: string
  publicationUrl: string
}) {
  const occasion = d.eventTag ?? `${d.honoureeName}'s Legacy Capsule`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${occasion} — Publication Ready</title>
</head>
<body style="margin:0;padding:0;background:#F5F3EE;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3EE;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="540" cellpadding="0" cellspacing="0" style="max-width:540px;width:100%;background:#1a0d3a;border-radius:16px;overflow:hidden;">

          <!-- Gold top rule -->
          <tr>
            <td height="3" style="background:linear-gradient(90deg,transparent,#E2C36B,transparent);"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding:44px 44px 8px;text-align:center;">
              <p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:rgba(226,195,107,0.6);">
                LEGACYCAPSULE
              </p>
              <h1 style="margin:0;font-family:'Georgia',serif;font-size:13px;font-weight:400;color:rgba(255,255,255,0.5);letter-spacing:0.14em;text-transform:uppercase;">
                The collection is complete
              </h1>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:20px 44px 0;">
              <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(226,195,107,0.3),transparent);"></div>
            </td>
          </tr>

          <!-- Main message -->
          <tr>
            <td style="padding:32px 44px 28px;text-align:center;">
              <h2 style="margin:0 0 16px;font-family:'Georgia',serif;font-size:26px;font-weight:700;color:#FFFFFF;line-height:1.3;">
                Dear ${d.contributorName},
              </h2>
              <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:15px;color:rgba(255,255,255,0.75);line-height:1.8;">
                Your voice helped preserve something that will last long after this occasion.
              </p>
              <p style="margin:0;font-family:Arial,sans-serif;font-size:15px;color:rgba(255,255,255,0.75);line-height:1.8;">
                The Legacy Capsule for <strong style="color:#E2C36B;">${d.honoureeName}</strong> is now complete —
                and the community publication has been assembled from every tribute, story and memory gathered.
              </p>
            </td>
          </tr>

          <!-- CTAs -->
          <tr>
            <td style="padding:0 44px 36px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="padding-right:12px;">
                    <a href="${d.publicationUrl}"
                      style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#E2C36B,#C8A84A);color:#1a0d3a;font-family:Arial,sans-serif;font-weight:700;font-size:13px;text-decoration:none;border-radius:8px;letter-spacing:0.04em;">
                      ⬇ Download Publication
                    </a>
                  </td>
                  <td>
                    <a href="${d.capsuleUrl}"
                      style="display:inline-block;padding:14px 28px;background:rgba(226,195,107,0.1);color:#E2C36B;font-family:Arial,sans-serif;font-weight:600;font-size:13px;text-decoration:none;border-radius:8px;border:1px solid rgba(226,195,107,0.3);letter-spacing:0.04em;">
                      Visit the Capsule →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Quote -->
          <tr>
            <td style="padding:0 44px 32px;">
              <div style="background:rgba(226,195,107,0.05);border-left:3px solid rgba(226,195,107,0.4);border-radius:0 8px 8px 0;padding:16px 20px;">
                <p style="margin:0;font-family:'Georgia',serif;font-size:13px;font-style:italic;color:rgba(255,255,255,0.5);line-height:1.7;">
                  "Events end. Legacies don't."
                </p>
              </div>
            </td>
          </tr>

          <!-- Gold bottom rule -->
          <tr>
            <td height="3" style="background:linear-gradient(90deg,transparent,#E2C36B,transparent);"></td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 44px 20px;text-align:center;">
              <p style="margin:0;font-family:Arial,sans-serif;font-size:9px;color:rgba(255,255,255,0.18);letter-spacing:2px;text-transform:uppercase;">
                LEGACYCAPSULE · VALNEX, UNIPESSOAL LDA · REVOWORLDTECH
              </p>
              <p style="margin:8px 0 0;font-family:Arial,sans-serif;font-size:10px;color:rgba(255,255,255,0.2);">
                You received this because you contributed to a LegacyCapsule event.
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
