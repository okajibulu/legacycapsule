/**
 * ============================================================
 * FILE PATH: app/api/capsule/honouree-reveal/route.ts
 * LEGACYCAPSULE — VALNEX, UNIPESSOAL LDA · RevoWorldTech
 * ============================================================
 * Built by: AI11 · June 2026
 *
 * POST — Send the Capsule Reveal email to the honouree/subject.
 * Experience 5 from LegacyCapsule_Six_Engagement_Experiences.
 *
 * Flow:
 *   1. Validate capsule_id + honouree_email
 *   2. Create a portal token in honouree_portal_tokens
 *   3. Send the Reveal email via Resend
 *   4. Update capsule reveal_sent_at timestamp
 *   5. Return ok
 *
 * Body: { capsule_id: string, honouree_email: string }
 * ============================================================
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

// ============================================================
// SECTION 1 — Clients
// ============================================================

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY!)
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://itslegacycapsule.com').replace(/\/$/, '')

// ============================================================
// SECTION 2 — Token generator
// ============================================================

function generateToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let token = ''
  for (let i = 0; i < 48; i++) {
    token += chars[Math.floor(Math.random() * chars.length)]
  }
  return token
}

// ============================================================
// SECTION 3 — Reveal email HTML builder
// ============================================================

function buildRevealEmailHtml(params: {
  honoureeName: string
  eventType: string
  eventTag: string | null
  slug: string
  portalUrl: string
  contributorCount: number
  countryCount: number
}): string {
  const { honoureeName, eventType, eventTag, portalUrl, contributorCount, countryCount } = params

  const isMemorial = (eventType ?? '').toLowerCase().includes('memorial')
  const firstName = honoureeName.split(' ')[0]

  const headline = isMemorial
    ? `A collection of memories has been gathered in honour of ${honoureeName}`
    : `Something special has been built for you, ${firstName}`

  const bodyText = isMemorial
    ? `People who loved ${honoureeName} have come together to share their memories, tributes and reflections. ${contributorCount} voices from ${countryCount} ${countryCount === 1 ? 'country' : 'countries'} have contributed to this collection — and it is now ready for you to see.`
    : `${contributorCount} people from ${countryCount} ${countryCount === 1 ? 'country' : 'countries'} have gathered their voices, memories and tributes — all for you. Every word was written with care. This collection is now ready for you.`

  const ctaText = isMemorial
    ? 'View the Collection'
    : 'See What They Built for You'

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#0D0820;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D0820;padding:48px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- Brand -->
        <tr><td align="center" style="padding-bottom:32px;">
          <p style="margin:0;font-size:10px;color:rgba(212,174,42,0.5);letter-spacing:4px;text-transform:uppercase;">LegacyCapsule</p>
        </td></tr>

        <!-- Main card -->
        <tr><td style="padding:3px;border-radius:18px;background:linear-gradient(135deg,#D4AE2A,#B8960C,#D4AE2A);">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3EE;border-radius:16px;overflow:hidden;">
            <tr><td style="height:4px;background:linear-gradient(90deg,#2D1B69,#D4AE2A,#2D1B69);"></td></tr>
            <tr><td style="padding:40px 36px;text-align:center;">

              <!-- Ornament -->
              <p style="margin:0 0 20px;font-size:32px;line-height:1;">✦</p>

              <!-- Headline -->
              <h1 style="margin:0 0 16px;font-family:Georgia,'Playfair Display',serif;font-size:24px;font-weight:700;color:#1a1a2e;line-height:1.4;">
                ${headline}
              </h1>

              ${eventTag ? `<p style="margin:0 0 20px;font-size:12px;color:#B8960C;letter-spacing:0.15em;text-transform:uppercase;">${eventTag}</p>` : ''}

              <!-- Body -->
              <p style="margin:0 0 24px;font-size:15px;color:#3a3a4e;line-height:1.8;">
                ${bodyText}
              </p>

              <!-- Stats -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td width="50%" style="text-align:center;padding:16px 0;border-right:1px solid rgba(212,174,42,0.2);">
                    <p style="margin:0;font-family:Georgia,serif;font-size:28px;font-weight:700;color:#2D1B69;">${contributorCount}</p>
                    <p style="margin:4px 0 0;font-size:10px;color:#9090a0;letter-spacing:0.1em;text-transform:uppercase;">Voices</p>
                  </td>
                  <td width="50%" style="text-align:center;padding:16px 0;">
                    <p style="margin:0;font-family:Georgia,serif;font-size:28px;font-weight:700;color:#2D1B69;">${countryCount}</p>
                    <p style="margin:4px 0 0;font-size:10px;color:#9090a0;letter-spacing:0.1em;text-transform:uppercase;">${countryCount === 1 ? 'Country' : 'Countries'}</p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <a href="${portalUrl}" style="display:inline-block;padding:14px 36px;border-radius:10px;background:linear-gradient(135deg,#D4AE2A,#B8960C);color:#0D0820;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.04em;">
                ${ctaText}
              </a>

              <p style="margin:20px 0 0;font-size:12px;color:#9090a0;line-height:1.6;">
                This link is private and unique to you. It will remain active for 6 months.
              </p>

            </td></tr>
            <tr><td style="height:3px;background:linear-gradient(90deg,transparent,#D4AE2A,transparent);"></td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding-top:28px;">
          <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.12);letter-spacing:0.1em;text-transform:uppercase;">
            VALNEX, UNIPESSOAL LDA · RevoWorldTech · LegacyCapsule
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ============================================================
// SECTION 4 — Route handler
// ============================================================

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── 4.1 Parse body ────────────────────────────────────
  let body: { capsule_id: string; honouree_email: string }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const { capsule_id, honouree_email } = body

  if (!capsule_id || !honouree_email?.includes('@')) {
    return NextResponse.json(
      { error: 'capsule_id and a valid honouree_email are required.' },
      { status: 400 }
    )
  }

  // ── 4.2 Fetch capsule ─────────────────────────────────
  const { data: capsule, error: capErr } = await adminClient
    .from('capsules')
    .select('id, slug, honouree_name, event_type, event_tag, approved_contrib_count')
    .eq('id', capsule_id)
    .is('deleted_at', null)
    .maybeSingle()

  if (capErr || !capsule) {
    return NextResponse.json({ error: 'Capsule not found.' }, { status: 404 })
  }

  // ── 4.3 Count unique countries ────────────────────────
  const { data: countryRows } = await adminClient
    .from('contributions')
    .select('country')
    .eq('capsule_id', capsule_id)
    .eq('status', 'approved')
    .is('deleted_at', null)
    .not('country', 'is', null)

  const countryCount = new Set((countryRows ?? []).map(r => r.country)).size

  // ── 4.4 Create portal token ───────────────────────────
  const token = generateToken()
  const expiresAt = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString() // 6 months

  const { error: tokenErr } = await adminClient
    .from('honouree_portal_tokens')
    .insert({
      capsule_id,
      honouree_email: honouree_email.trim().toLowerCase(),
      token,
      expires_at: expiresAt,
    })

  if (tokenErr) {
    console.error('[honouree-reveal] Token insert error:', tokenErr.message)
    return NextResponse.json({ error: 'Failed to create portal access.' }, { status: 500 })
  }

  // ── 4.5 Send Reveal email ─────────────────────────────
  const portalUrl = `${APP_URL}/for/${capsule.slug}/honouree?token=${token}`

  const isMemorial = (capsule.event_type ?? '').toLowerCase().includes('memorial')
  const subject = isMemorial
    ? `A collection of memories for ${capsule.honouree_name}`
    : `${capsule.honouree_name} — something special has been built for you`

  try {
    const { error: sendErr } = await resend.emails.send({
      from: `LegacyCapsule <noreply@itslegacycapsule.com>`,
      to: honouree_email.trim().toLowerCase(),
      subject,
      html: buildRevealEmailHtml({
        honoureeName: capsule.honouree_name,
        eventType: capsule.event_type,
        eventTag: capsule.event_tag,
        slug: capsule.slug,
        portalUrl,
        contributorCount: capsule.approved_contrib_count ?? 0,
        countryCount,
      }),
    })

    if (sendErr) {
      console.error('[honouree-reveal] Resend error:', sendErr)
      return NextResponse.json({ error: 'Email send failed.' }, { status: 500 })
    }
  } catch (err) {
    console.error('[honouree-reveal] Unexpected send error:', err)
    return NextResponse.json({ error: 'Email send failed.' }, { status: 500 })
  }

  // ── 4.6 Update capsule reveal timestamp ───────────────
  try {
    await adminClient
      .from('capsules')
      .update({ reveal_sent_at: new Date().toISOString() } as any)
      .eq('id', capsule_id)
  } catch {}

  // ── 4.7 Return success ────────────────────────────────
  return NextResponse.json({ ok: true }, { status: 201 })
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed.' }, { status: 405 })
}
