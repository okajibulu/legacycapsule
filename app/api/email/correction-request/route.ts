// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/api/email/correction-request/route.ts
// PURPOSE: Send a correction request email to a contributor.
//          Four templates available. Includes the contributor's edit link.
//          Max 2 correction requests per contribution — third triggers flag.
// ARCHITECTURE: LC02 Moderation System
// BUILT BY: Claude Sonnet 4.6 · July 2026
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { Resend }                    from 'resend'

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
// SECTION 2 — Correction templates
// ─────────────────────────────────────────────────────────────────────────────

const TEMPLATES: Record<string, { subject_suffix: string; body: string }> = {
  minor_edit: {
    subject_suffix: 'a small adjustment before your tribute goes live',
    body: 'Thank you for taking the time to leave a tribute. Before we publish it, we\'d appreciate a small adjustment — perhaps a word choice or a minor detail that could be refined. Your tribute is almost ready; this is just a light polish.',
  },
  length_adjustment: {
    subject_suffix: 'a note on the length of your tribute',
    body: 'Thank you for your tribute. To ensure the best experience for all contributors on the wall, we\'re asking if you could revisit the length of your message. A more concise tribute often carries greater impact. Please edit and resubmit when you\'re ready.',
  },
  clarity_request: {
    subject_suffix: 'a clarification before your tribute goes live',
    body: 'Thank you for leaving a tribute. We want to make sure it reads clearly for everyone visiting the wall. There\'s a section we\'d like you to revisit — perhaps a phrase or context that would benefit from a little more clarity. Please take a moment to review and update your tribute.',
  },
  photo_quality: {
    subject_suffix: 'a note about the photo attached to your tribute',
    body: 'Thank you for your tribute and for including a photo. Unfortunately the image isn\'t quite suitable for the tribute wall — it may be too small, blurry, or unclear. If you have a better version, we\'d love for you to update it. Alternatively, feel free to resubmit without a photo.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — Route handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { contribution_id, template_key } = await req.json()

    if (!contribution_id || !template_key) {
      return NextResponse.json({ error: 'contribution_id and template_key required' }, { status: 400 })
    }

    const template = TEMPLATES[template_key]
    if (!template) {
      return NextResponse.json({ error: 'Invalid template key' }, { status: 400 })
    }

    // ── Fetch contribution ────────────────────────────────────────────────────
    const { data: contrib } = await db
      .from('contributions')
      .select('id, capsule_id, contributor_name, email, edit_token, correction_count, status')
      .eq('id', contribution_id)
      .maybeSingle()

    if (!contrib) return NextResponse.json({ error: 'Contribution not found' }, { status: 404 })
    if (!contrib.email) return NextResponse.json({ error: 'Contributor has no email address' }, { status: 400 })

    // ── Check correction limit ────────────────────────────────────────────────
    const correctionCount = (contrib.correction_count ?? 0) + 1

    if (correctionCount > 2) {
      // Flag for decline instead of sending another correction
      await db
        .from('contributions')
        .update({ status: 'flagged', correction_count: correctionCount })
        .eq('id', contribution_id)

      return NextResponse.json({
        ok:      false,
        flagged: true,
        message: 'This contribution has exceeded the maximum correction requests and has been flagged for review.',
      })
    }

    // ── Fetch capsule for context ─────────────────────────────────────────────
    const { data: capsule } = await db
      .from('capsules')
      .select('slug, honouree_name, event_type')
      .eq('id', contrib.capsule_id)
      .maybeSingle()

    if (!capsule) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 })

    // ── Build edit link ───────────────────────────────────────────────────────
    const editLink = contrib.edit_token
      ? `${APP_URL}/for/${capsule.slug}/edit/${contrib.edit_token}`
      : `${APP_URL}/for/${capsule.slug}`

    // ── Update correction count and status ────────────────────────────────────
    await db
      .from('contributions')
      .update({
        status:           'pending_correction',
        correction_count: correctionCount,
        correction_note:  template_key,
      })
      .eq('id', contribution_id)

    // ── Send correction request email ─────────────────────────────────────────
    await resend.emails.send({
      from:    'LegacyCapsule <memories@itslegacycapsule.com>',
      to:      contrib.email,
      subject: `${contrib.contributor_name}, we have ${template.subject_suffix}`,
      html:    correctionEmailHtml({
        contributorName: contrib.contributor_name,
        honoureeName:    capsule.honouree_name,
        templateBody:    template.body,
        editLink,
        correctionCount,
      }),
    })

    return NextResponse.json({ ok: true, correction_count: correctionCount })

  } catch (err) {
    console.error('[correction-request]', err)
    return NextResponse.json({ error: 'Failed to send correction request' }, { status: 500 })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — Email template
// Warm, respectful tone — never accusatory. Feels like personal communication.
// ─────────────────────────────────────────────────────────────────────────────

function correctionEmailHtml(d: {
  contributorName: string
  honoureeName:    string
  templateBody:    string
  editLink:        string
  correctionCount: number
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#F5F3EE;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3EE;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#1a0d3a;border-radius:16px;overflow:hidden;">
        <tr><td height="3" style="background:linear-gradient(90deg,transparent,#E2C36B,transparent);"></td></tr>

        <tr><td style="padding:40px 44px 8px;text-align:center;">
          <p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:rgba(226,195,107,0.6);">LEGACYCAPSULE</p>
          <h1 style="margin:0 0 8px;font-family:'Georgia',serif;font-size:24px;font-weight:700;color:#FFFFFF;line-height:1.3;">A note about your tribute</h1>
          <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.45);">For ${d.honoureeName}</p>
        </td></tr>

        <tr><td style="padding:20px 44px 0;"><div style="height:1px;background:linear-gradient(90deg,transparent,rgba(226,195,107,0.3),transparent);"></div></td></tr>

        <tr><td style="padding:28px 44px;">
          <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:14px;color:rgba(255,255,255,0.75);">Dear <strong style="color:#FFFFFF;">${d.contributorName}</strong>,</p>
          <p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:14px;color:rgba(255,255,255,0.65);line-height:1.8;">${d.templateBody}</p>
          <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:rgba(255,255,255,0.65);line-height:1.8;">You can make your changes using the link below. Your tribute will be reviewed again once you've updated it.</p>
        </td></tr>

        <tr><td style="padding:0 44px 32px;text-align:center;">
          <a href="${d.editLink}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#E2C36B,#C8A84A);color:#1a0d3a;font-family:Arial,sans-serif;font-weight:700;font-size:14px;text-decoration:none;border-radius:8px;letter-spacing:0.04em;">
            Edit My Tribute →
          </a>
          ${d.correctionCount === 2 ? `<p style="margin:12px 0 0;font-family:Arial,sans-serif;font-size:10px;color:rgba(255,255,255,0.3);">Please note: this is the final opportunity to revise this tribute before a moderation decision is made.</p>` : ''}
        </td></tr>

        <tr><td style="padding:0 44px 32px;">
          <div style="background:rgba(226,195,107,0.05);border-left:3px solid rgba(226,195,107,0.3);border-radius:0 8px 8px 0;padding:14px 18px;">
            <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:rgba(255,255,255,0.45);line-height:1.7;">If you believe your tribute is fine as submitted and no changes are needed, simply reply to this email and we will review it again.</p>
          </div>
        </td></tr>

        <tr><td height="3" style="background:linear-gradient(90deg,transparent,#E2C36B,transparent);"></td></tr>
        <tr><td style="padding:14px 44px 18px;text-align:center;">
          <p style="margin:0;font-family:Arial,sans-serif;font-size:9px;color:rgba(255,255,255,0.18);letter-spacing:2px;text-transform:uppercase;">LEGACYCAPSULE · VALNEX, UNIPESSOAL LDA · REVOWORLDTECH</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}
